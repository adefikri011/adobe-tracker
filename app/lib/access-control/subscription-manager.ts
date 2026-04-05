import { prisma } from "@/lib/prisma";

// TYPES

export interface ExpiryCheckResult {
  processed: boolean;
  subscriptionsExpired: number;
  usersDowngraded: number;
  errors: string[];
}

export interface SingleSubscriptionResult {
  success: boolean;
  message: string;
  userIdAffected?: string;
  oldPlan?: string;
  newPlan?: string;
}

// ============================================
// HELPER: Create activity log
// ============================================

async function logSubscriptionEvent(
  userId: string,
  email: string,
  action: string,
  detail: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        user: userId,
        email,
        action,
        detail,
        ipAddress: null, // Set ini dari middleware kalau ada IP
      },
    });
  } catch (error) {
    console.error("[SubscriptionManager] Failed to log activity:", error);
    // Don't throw, just log. Jangan pakai logging untuk kurangi failure risk
  }
}

// ============================================
// MAIN: Check & Process Single Subscription Expiry
// ============================================

/**
 * Process single subscription yang expired
 * - Mark subscription status jadi "expired"
 * - Downgrade user plan ke "free"
 * - Update planExpiry di Profile
 * - Log event
 *
 * @param subscriptionId - ID subscription yang mau di-process
 * @returns Result object dengan status
 */
export async function processSingleSubscriptionExpiry(
  subscriptionId: string
): Promise<SingleSubscriptionResult> {
  try {
    // Get subscription dengan relasinya
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            plan: true,
          },
        },
        plan: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!subscription) {
      return {
        success: false,
        message: "Subscription not found",
      };
    }

    // Check apakah sudah expired
    const now = new Date();
    if (subscription.endDate > now) {
      return {
        success: false,
        message: "Subscription belum expired",
        userIdAffected: subscription.profileId,
      };
    }

    // Check apakah sudah di-mark sebagai expired
    if (subscription.status === "expired") {
      return {
        success: false,
        message: "Subscription sudah di-mark expired sebelumnya",
        userIdAffected: subscription.profileId,
      };
    }

    const oldPlan = subscription.profile.plan;
    const userEmail = subscription.profile.email || "unknown";

    // Transaction: Update subscription status + user plan
    await prisma.$transaction([
      // 1. Mark subscription sebagai "expired"
      prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "expired",
          updatedAt: now,
        },
      }),

      // 2. Downgrade user plan ke "free"
      prisma.profile.update({
        where: { id: subscription.profileId },
        data: {
          plan: "free",
          planExpiry: now, // Set planExpiry ke waktu expired
        },
      }),
    ]);

    // 3. Log activity
    await logSubscriptionEvent(
      subscription.profileId,
      userEmail,
      "subscription_expired",
      `Subscription untuk plan '${subscription.plan.slug}' expired. User downgraded ke free plan.`
    );

    return {
      success: true,
      message: "Subscription processed successfully",
      userIdAffected: subscription.profileId,
      oldPlan,
      newPlan: "free",
    };
  } catch (error) {
    console.error("[SubscriptionManager] Error processing subscription:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// ============================================
// MAIN: Check All Expired Subscriptions (Batch)
// ============================================

/**
 * Check dan process SEMUA subscription yang sudah expired tapi belum di-mark
 * Cocok untuk di-call dari scheduled job (cron)
 *
 * Ini untuk memastikan semua user yang subscription expired
 * akan ter-downgrade tepat waktu
 *
 * @returns Result dari batch processing
 */
export async function checkAndProcessAllExpiredSubscriptions(): Promise<ExpiryCheckResult> {
  const result: ExpiryCheckResult = {
    processed: false,
    subscriptionsExpired: 0,
    usersDowngraded: 0,
    errors: [],
  };

  try {
    const now = new Date();

    // Cari semua subscription yang:
    // - Status "active"
    // - EndDate sudah lewat
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        endDate: {
          lt: now,
        },
      },
      select: {
        id: true,
      },
    });

    result.subscriptionsExpired = expiredSubscriptions.length;

    if (expiredSubscriptions.length === 0) {
      result.processed = true;
      result.usersDowngraded = 0;
      return result;
    }

    // Process setiap subscription yang expired
    for (const sub of expiredSubscriptions) {
      const processResult = await processSingleSubscriptionExpiry(sub.id);

      if (processResult.success) {
        result.usersDowngraded++;
      } else {
        result.errors.push(
          `Subscription ${sub.id}: ${processResult.message}`
        );
      }
    }

    result.processed = true;

    console.log(
      `[SubscriptionManager] Processed ${result.subscriptionsExpired} expired subscriptions, ${result.usersDowngraded} users downgraded`
    );

    return result;
  } catch (error) {
    console.error("[SubscriptionManager] Error in batch processing:", error);
    result.errors.push(
      `Batch processing error: ${error instanceof Error ? error.message : "Unknown"}`
    );
    return result;
  }
}

// ============================================
// HELPER: Check & Update Single User's Plan
// ============================================

/**
 * Utility function: Check user dan update plan-nya jika subscription expired
 * Gunakan ini di API route untuk lazy evaluation saat user login/access
 *
 * Call ini dari /api/user/plan/route.ts atau auth middleware
 *
 * @param userId - Profile ID
 * @returns { needsUpdate: boolean, oldPlan?: string, newPlan?: string }
 */
export async function validateAndUpdateUserPlan(
  userId: string
): Promise<{
  needsUpdate: boolean;
  oldPlan?: string;
  newPlan?: string;
}> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        plan: true,
      },
    });

    if (!profile || profile.plan === "free") {
      return { needsUpdate: false };
    }

    // Check apakah ada active subscription yang valid
    const now = new Date();
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        profileId: userId,
        status: "active",
        endDate: {
          gt: now,
        },
      },
    });

    // Jika ada active subscription yang belum expired, no need update
    if (activeSubscription) {
      return { needsUpdate: false };
    }

    // Jika tidak ada active subscription, downgrade ke free
    const oldPlan = profile.plan;

    await prisma.$transaction([
      prisma.profile.update({
        where: { id: userId },
        data: {
          plan: "free",
          planExpiry: now,
        },
      }),

      // Mark semua subscription jadi expired
      prisma.subscription.updateMany({
        where: {
          profileId: userId,
          status: "active",
        },
        data: {
          status: "expired",
          updatedAt: now,
        },
      }),
    ]);

    // Log
    await logSubscriptionEvent(
      userId,
      profile.email || "unknown",
      "plan_downgraded",
      `User plan downgraded dari '${oldPlan}' ke 'free' (subscription expired)`
    );

    return {
      needsUpdate: true,
      oldPlan,
      newPlan: "free",
    };
  } catch (error) {
    console.error("[SubscriptionManager] Error validating user plan:", error);
    return { needsUpdate: false };
  }
}

// ============================================
// HELPER: Get Subscription Status
// ============================================

/**
 * Get status subscription user untuk reference
 *
 * @param userId - Profile ID
 * @returns Subscription info atau null
 */
export async function getSubscriptionStatus(userId: string) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        profileId: userId,
      },
      include: {
        plan: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        endDate: "desc",
      },
    });

    if (!subscription) {
      return null;
    }

    const now = new Date();
    const isExpired = subscription.endDate < now;

    return {
      subscriptionId: subscription.id,
      planName: subscription.plan.name,
      planSlug: subscription.plan.slug,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isExpired,
      daysRemaining: isExpired ? 0 : Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    };
  } catch (error) {
    console.error("[SubscriptionManager] Error getting subscription status:", error);
    return null;
  }
}
