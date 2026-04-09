/**
 * Search Quota Tracker - Enforce daily search limits
 * 
 * Untuk free plan: max 2 searches per day
 * Untuk pro plan: unlimited
 * 
 * Tracking menggunakan ActivityLog table (ada saat user search)
 */

import { prisma } from "@/lib/prisma";
import { getSearchQuotaLimit } from "./features";

// ============================================
// TYPES
// ============================================

export interface SearchQuotaStatus {
  userId: string;
  plan: string;
  quotaLimit: number;
  searchesUsedToday: number;
  canSearch: boolean;
  remainingSearches: number;
  reason?: string;
}

// ============================================
// MAIN: Check Search Quota
// ============================================

/**
 * Check apakah user bisa melakukan search hari ini
 * Merupakan enforcement untuk daily search limit
 * 
 * LOGIC:
 * - FREE plan: Enforce daily limit (maxSearches dari database)
 * - PRO plans: Unlimited searches per day (result limit via maxSearches only)
 *
 * @param userId - Profile ID
 * @param planName - nama plan user ("free", "pro-7day", etc)
 * @returns Status quota + apakah boleh search
 */
export async function checkSearchQuota(
  userId: string,
  planName: string
): Promise<SearchQuotaStatus> {
  try {
    const planLower = planName.toLowerCase();
    
    // LANGKAH 1: Ambil plan dari database untuk dapatkan dailySearchLimit
    const plan = await prisma.plan.findFirst({
      where: {
        slug: {
          contains: planLower,
          mode: "insensitive",
        },
        isActive: true,
      },
      select: {
        dailySearchLimit: true,
      },
    });

    if (!plan) {
      console.warn(`[checkSearchQuota] Plan ${planName} tidak ditemukan di database`);
      // Fallback ke default jika plan tidak ditemukan
      return {
        userId,
        plan: planName,
        quotaLimit: planLower.startsWith("pro") ? Infinity : 5,
        searchesUsedToday: 0,
        canSearch: true,
        remainingSearches: Infinity,
      };
    }

    // LANGKAH 2: Untuk PRO users, unlimited daily searches
    if (planLower.startsWith("pro")) {
      console.log(`[checkSearchQuota] Pro user (${planName}) - unlimited daily searches allowed`);
      return {
        userId,
        plan: planName,
        quotaLimit: Infinity,
        searchesUsedToday: 0,
        canSearch: true,
        remainingSearches: Infinity,
      };
    }

    // LANGKAH 3: Untuk FREE users, enforce daily limit dari database
    console.log(`[checkSearchQuota] Free user - checking daily search limit`);
    
    // PENTING: Gunakan UTC untuk consistency dengan database
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const dailyLimit = plan.dailySearchLimit;
    console.log(`[checkSearchQuota] Daily limit for ${planName}: ${dailyLimit}`);

    // Count berapa kali user sudah search hari ini
    const searchesUsedToday = await prisma.activityLog.count({
      where: {
        user: userId,
        action: "search",
        createdAt: {
          gte: today,
        },
      },
    });
    
    console.log(`[checkSearchQuota] Free user ${userId} - used ${searchesUsedToday}/${dailyLimit} searches today`);

    const remainingSearches = Math.max(0, dailyLimit - searchesUsedToday);
    const canSearch = searchesUsedToday < dailyLimit;

    return {
      userId,
      plan: planName,
      quotaLimit: dailyLimit,
      searchesUsedToday,
      canSearch,
      remainingSearches,
      reason: !canSearch
        ? `Batas pencarian harian (${dailyLimit}) sudah tercapai. Akan reset pada tengah malam.`
        : undefined,
    };
  } catch (error) {
    console.error("[SearchQuota] Error checking quota:", error);
    // Default: allow search jika ada error (better UX)
    return {
      userId,
      plan: planName,
      quotaLimit: Infinity, // Allow on error
      searchesUsedToday: 0,
      canSearch: true,
      remainingSearches: Infinity,
      reason: "Error checking quota (allowing search)",
    };
  }
}

// ============================================
// HELPER: Log Search Action
// ============================================

/**
 * Log search action untuk tracking quota
 * Call ini setelah successful search
 *
 * @param userId - Profile ID
 * @param query - Search query yang digunakan
 * @param email - User email
 */
export async function logSearchAction(
  userId: string,
  query: string,
  email: string
): Promise<void> {
  try {
    console.log(`[logSearchAction] Starting - user: ${userId}, query: "${query}", email: ${email}`);
    
    const logEntry = await prisma.activityLog.create({
      data: {
        user: userId,
        email,
        action: "search",
        detail: `Search query: "${query}"`,
      },
    });
    
    console.log(`[logSearchAction] SUCCESS - logged with id: ${logEntry.id}`);
  } catch (error) {
    console.error(`[logSearchAction] ERROR:`, error);
    // Log error tapi jangan throw — don't block search if logging fails
  }
}

// ============================================
// HELPER: Get Reset Time
// ============================================

/**
 * Get waktu kapan quota akan di-reset (midnight UTC)
 *
 * @returns Datetime ketika quota reset
 */
export function getQuotaResetTime(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Get menit sampai quota reset
 *
 * @returns Minutes sampai reset
 */
export function getMinutesUntilReset(): number {
  const resetTime = getQuotaResetTime();
  const now = new Date();
  const diffMs = resetTime.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60));
}
