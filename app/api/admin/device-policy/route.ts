import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GLOBAL_POLICY_ID = "__GLOBAL_DEVICE_POLICY__";
const DEFAULT_SUSPEND_MINUTES = 5;

type PolicyPayload = {
  maxDevices?: number;
  suspendMinutes?: number;
};

function normalizePolicy(payload: PolicyPayload) {
  const hasMaxDevices = typeof payload.maxDevices === "number";
  const maxDevices = hasMaxDevices ? Math.max(1, Math.floor(payload.maxDevices!)) : null;

  const hasSuspendMinutes = typeof payload.suspendMinutes === "number";
  const suspendMinutes = hasSuspendMinutes
    ? Math.max(1, Math.floor(payload.suspendMinutes!))
    : DEFAULT_SUSPEND_MINUTES;

  return {
    maxDevices,
    suspendMinutes,
  };
}

async function ensureAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

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

    const row = await prisma.userSession.findUnique({
      where: { id: GLOBAL_POLICY_ID },
      select: { activeSessions: true },
    });

    const payload =
      row?.activeSessions && typeof row.activeSessions === "object" && !Array.isArray(row.activeSessions)
        ? normalizePolicy(row.activeSessions as PolicyPayload)
        : normalizePolicy({});

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Get device policy error:", error);
    return NextResponse.json({ message: "Failed to load device policy" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const body = (await req.json()) as PolicyPayload;
    const payload = normalizePolicy(body);

    await prisma.userSession.upsert({
      where: { id: GLOBAL_POLICY_ID },
      update: {
        activeSessions: payload,
        suspendedUntil: null,
      },
      create: {
        id: GLOBAL_POLICY_ID,
        activeSessions: payload,
        suspendedUntil: null,
      },
    });

    return NextResponse.json({ success: true, ...payload });
  } catch (error) {
    console.error("Update device policy error:", error);
    return NextResponse.json({ message: "Failed to update device policy" }, { status: 500 });
  }
}