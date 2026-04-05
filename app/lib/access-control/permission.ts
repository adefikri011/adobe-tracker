import { prisma } from "@/lib/prisma";
import {
  PLAN_FEATURES,
  FEATURES,
  FeatureName,
  planHasFeature,
  isPremiumPlan,
  getSearchQuotaLimit,
} from "./features";

// TYPES
export interface UserPermission {
  allowed: boolean;
  reason?: string;
  plan: string;
  isPremium: boolean;
  isSubscriptionActive: boolean;
  isSubscriptionExpired: boolean;
}

export interface ActiveSubscriptionData {
  subscriptionId: string;
  planId: string;
  planName: string;
  planSlug: string;
  status: string;
  startDate: Date;
  endDate: Date;
  isExpired: boolean;
}

// HELPER: Check if subscription is expired
function isSubscriptionExpired(endDate: Date): boolean {
  const now = new Date();
  return endDate < now;
}

// MAIN FUNCTION: Get Active Subscription
/**
 * Get active subscription untuk user
 * Jika ada multiple subscriptions, ambil yang latest dan belum expired
 *
 * @param userId - Profile ID dari user
 * @returns Subscription data atau null jika tidak ada
 */

export async function getActiveSubscription(
  userId: string
): Promise<ActiveSubscriptionData | null> {
  try {
    // Cari subscription yang paling baru dan statusnya "active"
    const subscription = await prisma.subscription.findFirst({
      where: {
        profileId: userId,
        status: "active",
      },
      include: {
        plan: {
          select: {
            id: true,
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

    // Check apakah sudah expired
    const isExpired = isSubscriptionExpired(subscription.endDate);

    // Ensure planSlug ada & valid - ALWAYS generate dari name kalau slug tidak valid
    let planSlug = subscription.plan.slug || "";
    
    // Check apakah slug valid (harus start dengan "pro" atau sama dengan "free")
    const isValidSlug = planSlug && (planSlug.toLowerCase().startsWith("pro") || planSlug.toLowerCase() === "free");
    
    if (!isValidSlug) {
      // Generate slug dari name: "Pro - 7 Day" → "pro-7-day"
      const baseName = subscription.plan.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      
      // Prefix dengan "pro-" jika belum ada
      planSlug = baseName.startsWith("pro") ? baseName : `pro-${baseName}`;
      console.log(`[Permission] Generated planSlug from name: "${subscription.plan.name}" → "${planSlug}"`);
    }

    return {
      subscriptionId: subscription.id,
      planId: subscription.plan.id,
      planName: subscription.plan.name,
      planSlug: planSlug,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isExpired,
    };
  } catch (error) {
    console.error("[Permission] Error getting active subscription:", error);
    return null;
  }
}

// MAIN FUNCTION: Check Feature Access
/**
 * Check apakah user punya akses ke feature tertentu
 *
 * Security Note: Ini function backend-side, result harus di-trust.
 * Call ini di API route sebelum process request.
 *
 * @param userId - Profile ID
 * @param featureName - Feature name dari FEATURES constant
 * @returns Permission object dengan allowed status dan reason
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: FeatureName
): Promise<UserPermission> {
  try {
    // Get user profile untuk cek plan + status
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        status: true,
        planExpiry: true,
      },
    });

    if (!profile) {
      return {
        allowed: false,
        reason: "User not found",
        plan: "none",
        isPremium: false,
        isSubscriptionActive: false,
        isSubscriptionExpired: false,
      };
    }

    // Check user status (suspended/inactive)
    if (profile.status === "suspended") {
      return {
        allowed: false,
        reason: "User account is suspended",
        plan: profile.plan,
        isPremium: isPremiumPlan(profile.plan),
        isSubscriptionActive: false,
        isSubscriptionExpired: false,
      };
    }

    // Get active subscription
    const activeSubscription = await getActiveSubscription(userId);

    // Determine current effective plan
    let effectivePlan = profile.plan;
    let isSubscriptionStillActive = false;

    if (activeSubscription && !activeSubscription.isExpired) {
      effectivePlan = activeSubscription.planSlug;
      isSubscriptionStillActive = true;
    }

    // Check apakah plan ini punya feature yang diminta
    const planHasIt = planHasFeature(effectivePlan, featureName);

    if (!planHasIt) {
      return {
        allowed: false,
        reason: `Feature "${featureName}" not included in ${effectivePlan} plan`,
        plan: effectivePlan,
        isPremium: isPremiumPlan(effectivePlan),
        isSubscriptionActive: isSubscriptionStillActive,
        isSubscriptionExpired: activeSubscription?.isExpired ?? false,
      };
    }

    // Semua check passed
    return {
      allowed: true,
      plan: effectivePlan,
      isPremium: isPremiumPlan(effectivePlan),
      isSubscriptionActive: isSubscriptionStillActive,
      isSubscriptionExpired: activeSubscription?.isExpired ?? false,
    };
  } catch (error) {
    console.error("[Permission] Error checking feature access:", error);
    return {
      allowed: false,
      reason: "Error checking permissions",
      plan: "unknown",
      isPremium: false,
      isSubscriptionActive: false,
      isSubscriptionExpired: false,
    };
  }
}

// HELPER: Check Search Quota Access
/**
 * Check apakah user bisa melakukan search
 * (Biasanya di-call di /api/search/route.ts)
 *
 * @param userId - Profile ID
 * @returns Permission object
 */
export async function checkSearchAccess(userId: string): Promise<UserPermission> {
  // Search memerlukan feature "unlimited_searches" untuk premium
  // Free users bisa search tapi dengan quota limit

  const subscription = await getActiveSubscription(userId);

  if (subscription && !subscription.isExpired) {
    // Ada active subscription
    return {
      allowed: true,
      plan: subscription.planSlug,
      isPremium: isPremiumPlan(subscription.planSlug),
      isSubscriptionActive: true,
      isSubscriptionExpired: false,
    };
  }

  // Fall back to profile plan
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { plan: true, status: true },
  });

  if (!profile || profile.status === "suspended") {
    return {
      allowed: false,
      reason: "User not found or suspended",
      plan: profile?.plan ?? "none",
      isPremium: false,
      isSubscriptionActive: false,
      isSubscriptionExpired: false,
    };
  }

  return {
    allowed: true,
    plan: profile.plan,
    isPremium: isPremiumPlan(profile.plan),
    isSubscriptionActive: false,
    isSubscriptionExpired: false,
  };
}

// ============================================
// HELPER: Get User's Current Plan with Quota
// ============================================

export interface UserPlanInfo {
  planName: string;
  planSlug: string;
  isPremium: boolean;
  searchQuotaLimit: number;
  hasFeature: (feature: FeatureName) => boolean;
  features: FeatureName[];
}

/**
 * Get lengkap info tentang plan user (dengan features & quota)
 *
 * @param userId - Profile ID
 * @returns Plan info object
 */
export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
  const subscription = await getActiveSubscription(userId);

  console.log(`[getUserPlanInfo] userId: ${userId}`);
  console.log(`[getUserPlanInfo] subscription found:`, subscription ? "YES" : "NO");

  let planSlug = "free";
  let planName = "Free";

  if (subscription) {
    console.log(`[getUserPlanInfo] subscription.isExpired: ${subscription.isExpired}, endDate: ${subscription.endDate}`);
    
    if (!subscription.isExpired) {
      planSlug = subscription.planSlug;
      planName = subscription.planName;
      console.log(`[getUserPlanInfo] Using subscription: planSlug="${planSlug}", planName="${planName}"`);
    } else {
      console.log(`[getUserPlanInfo] Subscription expired, falling back to profile.plan`);
      // Get dari profile karena subscription sudah expired
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      planSlug = profile?.plan ?? "free";
    }
  } else {
    console.log(`[getUserPlanInfo] No subscription found, getting from profile.plan`);
    // Get dari profile
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    planSlug = profile?.plan ?? "free";
  }

  const features = (PLAN_FEATURES[planSlug] || PLAN_FEATURES.free) as FeatureName[];
  const isPremium = isPremiumPlan(planSlug);
  const searchQuotaLimit = getSearchQuotaLimit(planSlug);

  console.log(`[getUserPlanInfo] Final result: planSlug="${planSlug}", isPremium=${isPremium}, limit=${searchQuotaLimit}`);

  return {
    planName,
    planSlug,
    isPremium,
    searchQuotaLimit,
    hasFeature: (feature: FeatureName) => features.includes(feature),
    features,
  };
}
