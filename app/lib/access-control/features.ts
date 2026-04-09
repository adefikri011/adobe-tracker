export const FEATURES = {
  UNLIMITED_SEARCHES: "unlimited_searches",
  ALL_FEATURES: "all_features",
  EXPORT_CSV: "export_csv",
  PERFORMANCE_ANALYTICS: "performance_analytics",
  PRIORITY_SUPPORT: "priority_support",
} as const;

export type FeatureName = typeof FEATURES[keyof typeof FEATURES];


// SEARCH QUOTA LIMITS (per day)
export const SEARCH_QUOTA = {
  FREE: 2,       
  PRO: 1000,     // Changed from Infinity to 1000 untuk Prisma compatibility (take parameter)
} as const;

// PLAN-TO-FEATURES MAPPING
export const PLAN_FEATURES: Record<string, FeatureName[]> = {
  free: [
  ],
  
  // Pro plans (1 day, 3 day, 7 day) - semua features
  "pro-1day": [
    FEATURES.UNLIMITED_SEARCHES,
    FEATURES.ALL_FEATURES,
    FEATURES.EXPORT_CSV,
    FEATURES.PERFORMANCE_ANALYTICS,
  ],
  
  "pro-3day": [
    FEATURES.UNLIMITED_SEARCHES,
    FEATURES.ALL_FEATURES,
    FEATURES.EXPORT_CSV,
    FEATURES.PERFORMANCE_ANALYTICS,
  ],
  
  "pro-7day": [
    FEATURES.UNLIMITED_SEARCHES,
    FEATURES.ALL_FEATURES,
    FEATURES.EXPORT_CSV,
    FEATURES.PERFORMANCE_ANALYTICS,
  ],
  
  // Pro 15 day & 30 day = includes priority support
  "pro-15day": [
    FEATURES.UNLIMITED_SEARCHES,
    FEATURES.ALL_FEATURES,
    FEATURES.EXPORT_CSV,
    FEATURES.PERFORMANCE_ANALYTICS,
    FEATURES.PRIORITY_SUPPORT,
  ],
  
  "pro-30day": [
    FEATURES.UNLIMITED_SEARCHES,
    FEATURES.ALL_FEATURES,
    FEATURES.EXPORT_CSV,
    FEATURES.PERFORMANCE_ANALYTICS,
    FEATURES.PRIORITY_SUPPORT,
  ],
};

// FEATURE DESCRIPTIONS (untuk UI/logging)
export const FEATURE_DESCRIPTIONS: Record<FeatureName, string> = {
  [FEATURES.UNLIMITED_SEARCHES]: "Unlimited searches tanpa batasan daily quota",
  [FEATURES.ALL_FEATURES]: "Akses ke semua fitur aplikasi",
  [FEATURES.EXPORT_CSV]: "Kemampuan export result ke CSV file",
  [FEATURES.PERFORMANCE_ANALYTICS]: "Dashboard analytics & performance metrics",
  [FEATURES.PRIORITY_SUPPORT]: "Priority customer support",
  
};
// HELPER FUNCTIONS
/**
 * Get search quota limit berdasarkan plan
 * @param planName - nama plan user (contoh: "free", "pro-7day")
 * @returns quota limit (number atau Infinity untuk unlimited)
 */
export async function getSearchQuotaLimit(planName: string): Promise<number> {
  try {
    // Import prisma locally to avoid circular dependencies
    const { prisma } = await import("@/lib/prisma");
    
    console.log(`[getSearchQuotaLimit] Querying DB for plan slug: "${planName.toLowerCase()}"`);
    
    // Query database for plan's maxSearches setting
    const plan = await prisma.plan.findUnique({
      where: { slug: planName.toLowerCase() },
      select: { maxSearches: true, slug: true, name: true },
    });
    
    console.log(`[getSearchQuotaLimit] DB result:`, plan);
    
    if (plan?.maxSearches) {
      console.log(`[getSearchQuotaLimit] Found maxSearches: "${plan.maxSearches}"`);
      // Handle different maxSearches formats
      if (plan.maxSearches === "unlimited") {
        console.log(`[getSearchQuotaLimit] Returning unlimited (${SEARCH_QUOTA.PRO})`);
        return SEARCH_QUOTA.PRO; // 1000 as max for Prisma compatibility
      }
      const parsed = parseInt(plan.maxSearches, 10);
      if (!isNaN(parsed) && parsed > 0) {
        console.log(`[getSearchQuotaLimit] Returning parsed value: ${parsed}`);
        return parsed;
      }
    } else {
      console.log(`[getSearchQuotaLimit] No maxSearches found in DB, using fallback`);
    }
  } catch (error) {
    console.warn(`[getSearchQuotaLimit] Error querying DB for plan "${planName}":`, error);
    // Fall through to default below
  }
  
  // Fallback to hardcoded defaults if DB lookup fails
  const planLower = planName.toLowerCase();
  console.log(`[getSearchQuotaLimit] Using fallback for plan: "${planLower}"`);
  if (planLower.startsWith("pro")) {
    console.log(`[getSearchQuotaLimit] Returning pro default: ${SEARCH_QUOTA.PRO}`);
    return SEARCH_QUOTA.PRO;
  }
  console.log(`[getSearchQuotaLimit] Returning free default: ${SEARCH_QUOTA.FREE}`);
  return SEARCH_QUOTA.FREE;
}

/**
 * Check apakah plan memiliki feature tertentu
 * @param planName 
 * @param feature 
 * @returns 
 */
export function planHasFeature(planName: string, feature: FeatureName): boolean {
  const features = PLAN_FEATURES[planName.toLowerCase()] || PLAN_FEATURES.free;
  return features.includes(feature);
}

/**
 * Get semua features untuk plan tertentu
 * @param planName 
 * @returns 
 */
export function getPlanFeatures(planName: string): FeatureName[] {
  return PLAN_FEATURES[planName.toLowerCase()] || PLAN_FEATURES.free;
}

/**
 * Check apakah plan adalah premium (bukan free)
 * @param planName 
 * @returns 
 */
export function isPremiumPlan(planName: string): boolean {
  return planName.toLowerCase() !== "free" && planName.toLowerCase().startsWith("pro");
}

// TYPE EXPORTS (untuk TypeScript safety)
export type PlanName = keyof typeof PLAN_FEATURES;
