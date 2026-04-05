/**
 * Search API Handler with Quota Management
 * 
 * Utility untuk handle search dengan automatic redirect saat quota exceeded
 */

export interface SearchQuotaExceededError {
  error: string;
  reason: string;
  searchesUsed: number;
  limit: number;
  resetInMinutes: number;
  nextAction: {
    type: "redirect" | "modal";
    url: string;
    message: string;
  };
  upgrade: {
    message: string;
    pricingPageUrl: string;
    availablePlans: any[];
  };
}

export interface SearchResult {
  results: any[];
  isPro: boolean;
  total: number;
  fromCache?: boolean;
  error?: string;
}

/**
 * Perform search dengan automatic quota handling
 * 
 * Saat quota exceeded (429), automatically redirect ke pricing page
 * 
 * @param query - Search query
 * @returns Search results atau redirect ke pricing
 */
export async function searchWithQuotaHandling(
  query: string
): Promise<SearchResult | null> {
  try {
    console.log(`[SearchAPI] Searching for: "${query}"`);

    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

    // Handle quota exceeded
    if (res.status === 429) {
      const quotaData: SearchQuotaExceededError = await res.json();

      console.error(`[SearchAPI] Quota exceeded:`, quotaData);

      // Show alert sebelum redirect (optional)
      const message = quotaData.upgrade.message
        ? `${quotaData.upgrade.message}\n\nAnda sudah search ${quotaData.searchesUsed}/${quotaData.limit} kali hari ini.\nQuota akan di-reset dalam ${quotaData.resetInMinutes} menit.`
        : "Daily search limit reached. Please upgrade to continue.";

      alert(message);

      // Redirect ke pricing page
      window.location.href = quotaData.nextAction.url;

      return null; // Return null karena akan redirect
    }

    // Handle other errors
    if (!res.ok) {
      const errorData = await res.json();
      console.error(`[SearchAPI] Error (${res.status}):`, errorData);
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }

    // Success - return results
    const data: SearchResult = await res.json();
    console.log(`[SearchAPI] Got ${data.results.length} results`);

    return data;
  } catch (error) {
    console.error(`[SearchAPI] Exception:`, error);
    throw error;
  }
}

/**
 * Check search quota status (tanpa perform search)
 * 
 * Gunakan untuk show remaining searches sebelum user search
 */
export async function getSearchQuotaStatus(userId: string) {
  try {
    // This is helper untuk frontend
    // Bisa di-fetch dari dedicated endpoint jika ada
    const dummyRes = await fetch(`/api/search?q=__check__`);

    if (dummyRes.status === 429) {
      const data = await dummyRes.json();
      return {
        isExceeded: true,
        searchesUsed: data.searchesUsed,
        limit: data.limit,
        resetInMinutes: data.resetInMinutes,
      };
    }

    return {
      isExceeded: false,
      searchesUsed: 0,
      limit: 0,
      resetInMinutes: 0,
    };
  } catch (error) {
    console.error(`[QuotaCheck] Error:`, error);
    return null;
  }
}
