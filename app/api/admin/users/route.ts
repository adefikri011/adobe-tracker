import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PlanType = "free" | "pro_1d" | "pro_3d" | "pro_7d" | "pro_15d" | "pro_30d" | "lifetime";
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
    select: { role: true },
  });

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }

  return { userId: user.id };
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
      role?: UserRole;
      plan?: PlanType;
      status?: UserStatus;
      deviceLimit?: number;
    };

    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();

    if (!fullName || !email) {
      return NextResponse.json({ message: "fullName and email are required" }, { status: 400 });
    }

    const created = await prisma.profile.create({
      data: {
        id: crypto.randomUUID(),
        fullName,
        email,
        role: body.role === "admin" ? "admin" : "user",
        plan: body.plan || "free",
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
        deviceLimit: true,
      },
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error) {
    console.error("Create admin user error:", error);
    return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
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
      plan?: PlanType;
      deviceLimit?: number;
      status?: UserStatus;
    };

    if (!body.userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    const updateData: {
      plan?: PlanType;
      deviceLimit?: number;
      status?: UserStatus;
    } = {};

    if (body.plan) {
      updateData.plan = body.plan;
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
        deviceLimit: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Update admin user error:", error);
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}