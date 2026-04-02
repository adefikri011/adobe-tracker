import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/admin/settings/device - ambil global device settings
export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      // Create default if not exists
      settings = await prisma.appSettings.create({
        data: {
          id: "singleton",
          currency: "USD",
          exchangeRate: 15800,
          globalMaxDevices: 1,
          suspendDurationMinutes: 30,
        },
      });
    }

    return NextResponse.json({
      globalMaxDevices: settings.globalMaxDevices,
      suspendDurationMinutes: settings.suspendDurationMinutes,
    });
  } catch (error: any) {
    console.error("[Device Settings GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/settings/device - update global device settings (admin only)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { globalMaxDevices, suspendDurationMinutes } = body;

    if (globalMaxDevices === undefined || suspendDurationMinutes === undefined) {
      return NextResponse.json(
        { error: "globalMaxDevices and suspendDurationMinutes are required" },
        { status: 400 }
      );
    }

    const newGlobalMaxDevices = Math.max(1, globalMaxDevices);
    const newSuspendMinutes = Math.max(1, suspendDurationMinutes);

    // Update app settings in a transaction
    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: {
        globalMaxDevices: newGlobalMaxDevices,
        suspendDurationMinutes: newSuspendMinutes,
      },
      create: {
        id: "singleton",
        currency: "USD",
        exchangeRate: 15800,
        globalMaxDevices: newGlobalMaxDevices,
        suspendDurationMinutes: newSuspendMinutes,
      },
    });

    // After updating global setting, also update all user profiles that don't have paid plans
    // Get all profiles that don't have active subscriptions with plan device limits
    const profilesWithoutPlanLimit = await prisma.profile.findMany({
      where: {
        subscriptions: {
          none: {
            status: "active",
            plan: {
              deviceLimit: {
                gt: 0, // has device limit
              },
            },
          },
        },
      },
    });

    // Update their device limit to match global setting
    if (profilesWithoutPlanLimit.length > 0) {
      const profileIds = profilesWithoutPlanLimit.map(p => p.id);
      await prisma.profile.updateMany({
        where: { id: { in: profileIds } },
        data: { deviceLimit: newGlobalMaxDevices },
      });
      console.log(`[Device Settings] Updated ${profileIds.length} profiles to global device limit: ${newGlobalMaxDevices}`);
    }

    return NextResponse.json({
      globalMaxDevices: settings.globalMaxDevices,
      suspendDurationMinutes: settings.suspendDurationMinutes,
      updatedProfileCount: profilesWithoutPlanLimit.length,
    });
  } catch (error: any) {
    console.error("[Device Settings POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
