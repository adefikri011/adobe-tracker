import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * CRON Job atau Manual endpoint untuk sync user device limits
 * - Jika user punya active subscription: deviceLimit = plan.deviceLimit
 * - Jika subscription expired: deviceLimit = global setting
 */
export async function POST(req: NextRequest) {
  try {
    // Get global device limit
    const appSettings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });
    const globalDeviceLimit = appSettings?.globalMaxDevices || 1;

    // Get all profiles
    const profiles = await prisma.profile.findMany({
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    let updatedCount = 0;

    for (const profile of profiles) {
      let newDeviceLimit = globalDeviceLimit;

      // Cek apakah user punya active subscription
      if (profile.subscriptions.length > 0) {
        const subscription = profile.subscriptions[0];
        const now = new Date();

        // Jika subscription masih active
        if (subscription.endDate > now && subscription.status === "active") {
          // Gunakan plan device limit
          newDeviceLimit = subscription.plan.deviceLimit || globalDeviceLimit;
        }
        // Jika subscription expired, gunakan global
      }

      // Hanya update jika ada perubahan
      if (profile.deviceLimit !== newDeviceLimit) {
        await prisma.profile.update({
          where: { id: profile.id },
          data: { deviceLimit: newDeviceLimit },
        });
        updatedCount++;
        console.log(
          `[Device Limit Sync] Updated user ${profile.id}: ${profile.deviceLimit} → ${newDeviceLimit}`
        );
      }
    }

    return NextResponse.json({
      message: "Device limits synced successfully",
      updatedCount,
      totalProfiles: profiles.length,
    });
  } catch (error: any) {
    console.error("[Device Limit Sync]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
