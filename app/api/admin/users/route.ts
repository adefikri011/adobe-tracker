import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";
import { getClientIP } from "../../../lib/activity-log";

type UserRole = "admin" | "user";
type UserStatus = "active" | "suspended";

async function ensureAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, email: true, fullName: true },
  });

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }

  return { 
    userId: user.id, 
    adminEmail: profile.email || user.email || "admin@system", 
    adminName: profile.fullName || "Admin" 
  };
}

/**
 * Helper: Get plan data untuk user (set plan name & expiry)
 * Jangan create subscription di sini, hanya return plan data
 */
async function getPlanData(userId: string, planId?: string) {
  const updateData: any = {};

  if (!planId || planId === "free") {
    // Free plan
    updateData.plan = "free";
    updateData.planExpiry = null;
  } else {
    // Pro plan - extract dari database
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true, name: true, durationDays: true },
    });

    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    // Set plan to "pro"
    updateData.plan = "pro";
    updateData.planExpiry = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
    updateData.planId = plan.id; // Store for subscription creation later
  }

  return updateData;
}

/**
 * Helper: Activate plan untuk user
 * - Jika planId ada & valid → set plan="pro", set planExpiry, create Subscription
 * - Jika planId tidak ada / planId="free" → set plan="free", planExpiry=null
 */
async function activatePlanForUser(userId: string, planId?: string) {
  const updateData: any = {};

  if (!planId || planId === "free") {
    // Free plan
    updateData.plan = "free";
    updateData.planExpiry = null;
  } else {
    // Pro plan - extract dari database
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true, name: true, durationDays: true },
    });

    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    // Set plan to "pro" (bukan pro_30d, hanya pro)
    updateData.plan = "pro";
    updateData.planExpiry = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Create Subscription record
    await prisma.subscription.create({
      data: {
        profileId: userId,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
        endDate: updateData.planExpiry,
      },
    });
  }

  return updateData;
}

export async function GET() {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const users = await prisma.profile.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        plan: true,
        planExpiry: true,
        deviceLimit: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json({ message: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const body = (await req.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      planId?: string;
      status?: UserStatus;
      deviceLimit?: number;
    };

    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || crypto.randomUUID().slice(0, 12); // Generate temp password

    if (!fullName || !email) {
      return NextResponse.json({ message: "fullName and email are required" }, { status: 400 });
    }

    // Create Supabase Auth user with admin client
    const adminClient = createServerSupabaseAdminClient();
    let userId: string = "";

    try {
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Mark email as verified so no verification needed
      });

      if (authError) {
        console.error("Supabase auth error:", authError);
        return NextResponse.json({ message: `Auth error: ${authError.message}` }, { status: 400 });
      }

      if (!authUser?.user) {
        return NextResponse.json({ message: "Failed to create auth user" }, { status: 500 });
      }

      // Use Supabase auth user ID as profile ID
      userId = authUser.user.id;

      // Get plan data (without creating subscription yet)
      const planData = await getPlanData(userId, body.planId);

      // Create Prisma Profile first
      const created = await prisma.profile.create({
        data: {
          id: userId,
          fullName,
          email,
          role: body.role === "admin" ? "admin" : "user",
          plan: planData.plan,
          planExpiry: planData.planExpiry,
          status: body.status || "active",
          deviceLimit: Math.max(1, Math.floor(body.deviceLimit || 1)),
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          plan: true,
          planExpiry: true,
          deviceLimit: true,
        },
      });

      // Now create subscription if planId is valid (profile exists at this point)
      if (body.planId && body.planId !== "free") {
        const plan = await prisma.plan.findUnique({
          where: { id: body.planId },
          select: { id: true, durationDays: true },
        });

        if (plan) {
          const endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
          await prisma.subscription.create({
            data: {
              profileId: userId,
              planId: plan.id,
              status: "active",
              startDate: new Date(),
              endDate,
            },
          });
        }
      }

      // Log activity
      const planName = body.planId && body.planId !== "free" ? " with pro plan" : "";
      await prisma.activityLog.create({
        data: {
          user: `${adminCheck.adminName} (admin)`,
          email: adminCheck.adminEmail,
          action: "Created User",
          detail: `Created user ${fullName} (${email})${planName} - can login directly`,
          ipAddress: getClientIP(req),
        },
      });

      return NextResponse.json({ user: created }, { status: 201 });
    } catch (supabaseError: any) {
      console.error("Supabase error:", supabaseError);
      
      // If error is because user already exists, still create in Prisma (fallback)
      if (supabaseError?.message?.includes("already exists")) {
        // If userId not set, fetch existing user from Prisma by email
        if (!userId) {
          const existingProfile = await prisma.profile.findUnique({
            where: { email },
            select: { id: true },
          });
          if (!existingProfile?.id) {
            return NextResponse.json({ message: "Cannot determine user ID" }, { status: 400 });
          }
          userId = existingProfile.id;
        }

        const planData = await getPlanData(userId, body.planId);
        const created = await prisma.profile.create({
          data: {
            id: userId,
            fullName,
            email,
            role: body.role === "admin" ? "admin" : "user",
            plan: planData.plan,
            planExpiry: planData.planExpiry,
            status: body.status || "active",
            deviceLimit: Math.max(1, Math.floor(body.deviceLimit || 1)),
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            plan: true,
            planExpiry: true,
            deviceLimit: true,
          },
        });

        // Create subscription if planId is valid
        if (body.planId && body.planId !== "free") {
          const plan = await prisma.plan.findUnique({
            where: { id: body.planId },
            select: { id: true, durationDays: true },
          });

          if (plan) {
            const endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
            await prisma.subscription.create({
              data: {
                profileId: userId,
                planId: plan.id,
                status: "active",
                startDate: new Date(),
                endDate,
              },
            });
          }
        }

        return NextResponse.json({ user: created, warning: "User created in database but auth may already exist" }, { status: 201 });
      }

      throw supabaseError;
    }
  } catch (error: any) {
    console.error("Create admin user error:", error);
    return NextResponse.json({ message: error.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const body = (await req.json()) as {
      userId?: string;
      planId?: string; // Plan ID dari database
      deviceLimit?: number;
      status?: UserStatus;
    };

    if (!body.userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    const updateData: any = {};

    // Handle plan change
    if (body.planId !== undefined) {
      const planData = await getPlanData(body.userId, body.planId);
      updateData.plan = planData.plan;
      updateData.planExpiry = planData.planExpiry;

      // Delete old subscriptions and create new one if planId is valid
      if (body.planId && body.planId !== "free") {
        // Delete existing subscriptions
        await prisma.subscription.deleteMany({
          where: { profileId: body.userId },
        });

        // Create new subscription
        const plan = await prisma.plan.findUnique({
          where: { id: body.planId },
          select: { id: true, durationDays: true },
        });

        if (plan) {
          const endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
          await prisma.subscription.create({
            data: {
              profileId: body.userId,
              planId: plan.id,
              status: "active",
              startDate: new Date(),
              endDate,
            },
          });
        }
      } else {
        // Delete subscriptions if changing to free
        await prisma.subscription.deleteMany({
          where: { profileId: body.userId },
        });
      }
    }

    if (typeof body.deviceLimit === "number") {
      updateData.deviceLimit = Math.max(1, Math.floor(body.deviceLimit));
    }

    if (body.status) {
      updateData.status = body.status;
    }

    const updated = await prisma.profile.update({
      where: { id: body.userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        plan: true,
        planExpiry: true,
        deviceLimit: true,
      },
    });

    // Log activity
    const changes = [];
    if (body.planId !== undefined) changes.push(`plan: ${body.planId === "free" ? "free" : "pro"}`);
    if (body.deviceLimit) changes.push(`deviceLimit: ${body.deviceLimit}`);
    if (body.status) changes.push(`status: ${body.status}`);

    await prisma.activityLog.create({
      data: {
        user: `${adminCheck.adminName} (admin)`,
        email: adminCheck.adminEmail,
        action: "Updated User",
        detail: `Updated user ${updated.fullName} (${updated.email}): ${changes.join(", ")}`,
        ipAddress: getClientIP(req),
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    console.error("Update admin user error:", error);
    return NextResponse.json({ message: error.message || "Failed to update user" }, { status: 500 });
  }
}