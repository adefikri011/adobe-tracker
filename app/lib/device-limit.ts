import { prisma } from "./prisma";

/**
 * Get the effective device limit for a user
 * Priority: Plan Device Limit > Individual Override > Global Setting
 */
export async function getUserDeviceLimit(userId: string): Promise<number> {
  try {
    // 1. Get user profile with subscription/plan info
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: "active" },
          include: { plan: true },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
    });

    if (!profile) {
      return 1; // default fallback
    }

    // 2. Check if user has active subscription with plan device limit
    if (profile.subscriptions.length > 0) {
      const activePlan = profile.subscriptions[0].plan;
      if (activePlan && activePlan.deviceLimit && activePlan.deviceLimit > 0) {
        // If user has individual override, use whichever is higher
        if (profile.deviceLimit && profile.deviceLimit > activePlan.deviceLimit) {
          return profile.deviceLimit;
        }
        return activePlan.deviceLimit;
      }
    }

    // 3. Check individual override
    if (profile.deviceLimit && profile.deviceLimit > 0) {
      return profile.deviceLimit;
    }

    // 4. Fallback to global setting
    const appSettings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    return appSettings?.globalMaxDevices || 1;
  } catch (error) {
    console.error("[getUserDeviceLimit] Error:", error);
    return 1; // safe fallback
  }
}

/**
 * Get global device settings
 */
export async function getGlobalDeviceSettings() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
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

    return {
      globalMaxDevices: settings.globalMaxDevices,
      suspendDurationMinutes: settings.suspendDurationMinutes,
    };
  } catch (error) {
    console.error("[getGlobalDeviceSettings] Error:", error);
    return {
      globalMaxDevices: 1,
      suspendDurationMinutes: 30,
    };
  }
}

/**
 * Suspend user for exceeding device limit
 */
export async function suspendUserForDeviceLimit(userId: string): Promise<boolean> {
  try {
    const settings = await getGlobalDeviceSettings();
    const suspendedUntil = new Date();
    suspendedUntil.setMinutes(suspendedUntil.getMinutes() + settings.suspendDurationMinutes);

    // Update user session to mark as suspended
    await prisma.userSession.upsert({
      where: { id: userId },
      update: { suspendedUntil },
      create: {
        id: userId,
        suspendedUntil,
        activeSessions: "[]",
      },
    });

    // Update profile status to suspended
    await prisma.profile.update({
      where: { id: userId },
      data: { status: "suspended" },
    });

    console.log(`[Device Limit] User ${userId} suspended until ${suspendedUntil}`);
    return true;
  } catch (error) {
    console.error("[suspendUserForDeviceLimit] Error:", error);
    return false;
  }
}
