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
 * @param userId - Profile ID
 * @param planName - nama plan user ("free", "pro-7day", etc)
 * @returns Status quota + apakah boleh search
 */
export async function checkSearchQuota(
  userId: string,
  planName: string
): Promise<SearchQuotaStatus> {
  try {
    const quotaLimit = getSearchQuotaLimit(planName);

    // Pro user = unlimited, langsung allow
    if (quotaLimit === Infinity) {
      return {
        userId,
        plan: planName,
        quotaLimit,
        searchesUsedToday: 0,
        canSearch: true,
        remainingSearches: Infinity,
      };
    }

    // Free user: hitung berapa kali sudah search hari ini
    // PENTING: Gunakan UTC untuk consistency dengan database
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    console.log(`[checkSearchQuota] Counting from ${today.toISOString()} for user ${userId}`);

    // Count berapa kali user punya record di ActivityLog dengan action "search" hari ini
    const searchesUsedToday = await prisma.activityLog.count({
      where: {
        user: userId,
        action: "search",
        createdAt: {
          gte: today,
        },
      },
    });
    
    console.log(`[checkSearchQuota] Found ${searchesUsedToday} searches for user ${userId}`);

    const remainingSearches = Math.max(0, quotaLimit - searchesUsedToday);
    const canSearch = searchesUsedToday < quotaLimit;

    return {
      userId,
      plan: planName,
      quotaLimit,
      searchesUsedToday,
      canSearch,
      remainingSearches,
      reason: !canSearch
        ? `Daily search limit (${quotaLimit}) reached. Reset at midnight.`
        : undefined,
    };
  } catch (error) {
    console.error("[SearchQuota] Error checking quota:", error);
    // Default: allow search jika ada error (better UX)
    return {
      userId,
      plan: planName,
      quotaLimit: getSearchQuotaLimit(planName),
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
