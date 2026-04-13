import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getClientIP } from "../../../lib/activity-log";

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

  return { ok: true, adminEmail: profile.email, adminName: profile.fullName };
}

export async function POST(req: Request) {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const { userId, durationMinutes } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Validate durationMinutes (allow 0 for permanent, or positive numbers)
    if (typeof durationMinutes !== "number" || durationMinutes < 0) {
      return NextResponse.json(
        { error: "Invalid suspension duration" },
        { status: 400 }
      );
    }

    // Set suspension end time
    // If durationMinutes is 0, make it permanent (far future date)
    const suspendedUntil =
      durationMinutes === 0
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year (effectively permanent)
        : new Date(Date.now() + durationMinutes * 60 * 1000);

    // Update profile and user session
    await Promise.all([
      prisma.profile.update({
        where: { id: userId },
        data: { status: "suspended" },
      }),
      prisma.userSession.upsert({
        where: { id: userId },
        update: {
          suspendedUntil,
          activeSessions: [],
        },
        create: {
          id: userId,
          suspendedUntil,
          activeSessions: [],
        },
      }),
    ]);

    // Log activity
    await prisma.activityLog.create({
      data: {
        user: `${adminCheck.adminName} (admin)`,
        email: adminCheck.adminEmail || "admin@system",
        action: "Suspended User",
        detail: `Suspended user ${userId} for ${
          durationMinutes === 0
            ? "permanent (1 year)"
            : `${durationMinutes} minutes`
        }`,
        ipAddress: getClientIP(req),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Suspend User Error:", err);
    return NextResponse.json(
      { error: "Failed to suspend user" },
      { status: 500 }
    );
  }
}
