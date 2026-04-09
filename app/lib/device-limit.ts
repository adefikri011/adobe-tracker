import { prisma } from "./prisma";

/**
 * Get the effective device limit for a user
 * Priority: Active Plan Device Limit > Individual Override > Global Setting
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

    // 2. Check if user has ACTIVE subscription (not expired) with plan device limit
    if (profile.subscriptions.length > 0) {
      const subscription = profile.subscriptions[0];
      const now = new Date();

      // Check if subscription is still valid (not expired)
      if (subscription.endDate > now) {
        const planLimit = subscription.plan.deviceLimit || 0;
        if (planLimit > 0) {
          // Return whichever is higher: plan limit or individual override
          if (profile.deviceLimit && profile.deviceLimit > planLimit) {
            return profile.deviceLimit;
          }
          return planLimit;
        }
      }
    }

    // 3. Check individual override (but only if > 0)
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
 * Get the effective suspend duration for a user
 * Priority: Active Plan Suspend Duration > Global Setting
 */
export async function getUserSuspendDuration(userId: string): Promise<number> {
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
      // Fallback to global setting
      const settings = await getGlobalDeviceSettings();
      return settings.suspendDurationMinutes;
    }

    // 2. Check if user has ACTIVE subscription (not expired) with plan suspend duration
    if (profile.subscriptions.length > 0) {
      const subscription = profile.subscriptions[0];
      const now = new Date();

      // Check if subscription is still valid (not expired)
      if (subscription.endDate > now) {
        const planSuspendDuration = subscription.plan.suspendDurationMinutes || 0;
        if (planSuspendDuration > 0) {
          return planSuspendDuration;
        }
      }
    }

    // 3. Fallback to global setting
    const appSettings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    return appSettings?.suspendDurationMinutes || 30;
  } catch (error) {
    console.error("[getUserSuspendDuration] Error:", error);
    return 30; // safe fallback
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
 * Uses plan-specific suspend duration if available, else falls back to global setting
 */
export async function suspendUserForDeviceLimit(userId: string): Promise<boolean> {
  try {
    // Get user's effective suspend duration (from plan or global setting)
    const suspendMinutes = await getUserSuspendDuration(userId);
    
    const suspendedUntil = new Date();
    suspendedUntil.setMinutes(suspendedUntil.getMinutes() + suspendMinutes);

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

    console.log(`[Device Limit] User ${userId} suspended until ${suspendedUntil} (${suspendMinutes} minutes)`);
    return true;
  } catch (error) {
    console.error("[suspendUserForDeviceLimit] Error:", error);
    return false;
  }
}
