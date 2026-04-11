import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserPlanInfo } from "@/lib/access-control/permission";
import { checkSearchQuota, logSearchAction, getMinutesUntilReset } from "../../lib/access-control/search-quota";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const CACHE_HOURS = 24;
const FREE_LIMIT = 10;
const PRO_LIMIT = 100;

// Simple in-memory cache untuk search results (5 menit TTL)
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const memoryCache = new Map<string, { data: any; expires: number }>();

function getCacheKey(userId: string, query: string, limit: number): string {
  return `${userId}:${query}:${limit}`;
}

function getFromCache(userId: string, query: string, limit: number): any | null {
  const key = getCacheKey(userId, query, limit);
  const cached = memoryCache.get(key);
  
  if (!cached) return null;
  if (Date.now() > cached.expires) {
    memoryCache.delete(key); // Expired, delete
    return null;
  }
  
  return cached.data;
}

function setCache(userId: string, query: string, limit: number, data: any): void {
  const key = getCacheKey(userId, query, limit);
  memoryCache.set(key, {
    data,
    expires: Date.now() + SEARCH_CACHE_TTL,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSearchUrl(keyword: string, page: number = 1): string {
  const params = new URLSearchParams({
    "filters[content_type:photo]": "1",
    "filters[content_type:illustration]": "1",
    "filters[content_type:zip_vector]": "1",
    "filters[content_type:video]": "1",
    "filters[content_type:template]": "1",
    "filters[content_type:3d]": "1",
    k: keyword,
    order: "nb_downloads",
    search_page: String(page),
  });
  return `https://stock.adobe.com/search?${params.toString()}`;
}

function normalizeFileType(item: any): string {
  if (item?.media_type_label) return item.media_type_label;
  if (item?.is_video === true) return "Video";
  if (item?.is_vector === true) return "Vector";
  if (item?.is_template === true) return "Template";
  if (item?.is_image === true) return "Photo";
  const ct = String(item?.content_type || item?.asset_type || "").toLowerCase();
  if (ct.includes("video")) return "Video";
  if (ct.includes("vector") || ct.includes("zip")) return "Vector";
  if (ct.includes("template")) return "Template";
  return "Photo";
}

async function runApifyPage(
  actorId: string,
  token: string,
  searchUrl: string
): Promise<any[]> {
  const runRes = await fetch(
    `${APIFY_BASE_URL}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchUrl }),
    }
  );
  if (!runRes.ok) throw new Error(`Gagal trigger actor: ${await runRes.text()}`);

  const runId = (await runRes.json())?.data?.id;
  if (!runId) throw new Error("Run ID tidak ditemukan");

  let datasetId: string | undefined;
  // Reduce polling: max 20 iterations x 1 second = 20 seconds timeout
  for (let i = 0; i < 20; i++) {
    const statusPayload = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    ).then((r) => r.json());

    const status = statusPayload?.data?.status;
    datasetId = statusPayload?.data?.defaultDatasetId;

    if (status === "SUCCEEDED") break;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) throw new Error(`Run gagal: ${status}`);
    // Reduced dari 3000ms → 1000ms (1 detik)
    await sleep(1000);
  }

  if (!datasetId) throw new Error("Dataset tidak ditemukan");

  const items = await fetch(
    `${APIFY_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}&clean=true`,
    { cache: "no-store" }
  ).then((r) => r.json());

  return Array.isArray(items) ? items : [];
}

function formatItem(item: any) {
  const contentId = String(item?.content_id || "").trim();
  const contentUrl = item?.content_url
    ? item.content_url.startsWith("http")
      ? item.content_url
      : `https://stock.adobe.com${item.content_url}`
    : contentId
    ? `https://stock.adobe.com/id/${contentId}`
    : "";

  const artistUrl = item?.artist_page_url
    ? item.artist_page_url.startsWith("http")
      ? item.artist_page_url
      : `https://stock.adobe.com${item.artist_page_url}`
    : "";

  return {
    adobeId: contentId,
    title: item?.title || "Untitled",
    creator: item?.author || item?.author_name || "Unknown",
    thumbnail: item?.thumbnail_url || item?.content_thumb_large_url || "",
    type: normalizeFileType(item),
    category:
      typeof item?.category === "object"
        ? item.category?.name || "General"
        : typeof item?.category === "string"
        ? item.category
        : "General",
    downloads: item?.order_key || 0,
    trend: `+${Math.floor(Math.random() * 30) + 1}%`,
    revenue: `$${((item?.order_key || 0) * 0.33).toFixed(2)}`,
    uploadDate: "-",
    contentUrl,
    artistUrl,
    status: item?.is_free ? "Free" : "Premium",
    keywords: [],
  };
}

// Fungsi untuk filter hasil berdasarkan keyword relevance - STRICT MATCHING
function filterByRelevance(items: any[], keyword: string): any[] {
  const queryLower = keyword.toLowerCase();
  // Create word boundary regex untuk match full words
  const wordRegex = new RegExp(`\\b${queryLower}\\b`, 'i');
  
  return items.filter((item) => {
    const title = String(item?.title || "").toLowerCase();
    const categoryValue = item?.category?.name || item?.category;
    const category = String(categoryValue || "").toLowerCase();
    
    const tags = (item?.tags || []).map((t: any) => {
      if (typeof t === "string") return t.toLowerCase();
      if (t?.name) return String(t.name).toLowerCase();
      return "";
    }).filter(Boolean);
    
    // STRICT: Full word match di title, category, atau tags
    const inTitle = wordRegex.test(title);
    const inCategory = wordRegex.test(category);
    const inTags = tags.some((tag: string) => wordRegex.test(tag));
    
    // Return hanya jika keyword relevan di minimal satu field
    return inTitle || inCategory || inTags;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) return NextResponse.json({ results: [] });

  // Cek plan user dengan validation subscription — default free kalau gagal
  let isPro = false;
  let userId: string | null = null;
  let userEmail = "unknown@system.local";
  let limit = FREE_LIMIT;
  let planName = "free";
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      userId = user.id;
      userEmail = user.email || `user-${user.id}@system.local`;
      const planInfo = await getUserPlanInfo(user.id);
      isPro = planInfo.isPremium;
      limit = planInfo.searchQuotaLimit;
      planName = planInfo.planSlug;
      
      // Ensure limit adalah valid positive number (Prisma take parameter validation)
      if (typeof limit !== "number" || limit <= 0 || !isFinite(limit)) {
        limit = FREE_LIMIT;
        console.log(`[Search] Invalid limit value, resetting to FREE_LIMIT`);
      }
    }
  } catch {
    // silent fail — tetap lanjut sebagai free
  }

  console.log(`[Search] "${query}" | plan: ${isPro ? "pro" : "free"} | limit: ${limit}`);

  // ── CHECK SEARCH QUOTA ─────────────────────────────────────────────────────
  // Enforce daily search limit untuk free users
  if (userId && !isPro) {
    console.log(`[SearchQuota] Checking quota for user ${userId} | plan: ${planName} | isPro: ${isPro}`);
    const quotaStatus = await checkSearchQuota(userId, planName);
    console.log(`[SearchQuota] Status:`, quotaStatus);
    
    if (!quotaStatus.canSearch) {
      console.log(`[Search] Quota exceeded for user ${userId}: ${quotaStatus.searchesUsedToday}/${quotaStatus.quotaLimit}`);
      
      // Fetch available plans untuk upsell
      let availablePlans = [];
      try {
        const plansRes = await fetch(
          new URL("/api/billing/plans/available", process.env.NEXTAUTH_URL || "http://localhost:3000").toString()
        );
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          availablePlans = plansData.plans || [];
        }
      } catch (error) {
        console.error("[Search] Error fetching available plans:", error);
        // Silent fail — return response tanpa plans
      }

      return NextResponse.json(
        {
          error: "Daily search limit reached",
          reason: quotaStatus.reason,
          searchesUsed: quotaStatus.searchesUsedToday,
          limit: quotaStatus.quotaLimit,
          resetInMinutes: getMinutesUntilReset(),
          nextAction: {
            type: "redirect",
            url: "/dashboard/billing/plans?upgrade=quota_exceeded",
            message: "Upgrade ke Pro untuk unlimited searches!",
          },
          upgrade: {
            message: "Upgrade to Pro plan for unlimited searches!",
            pricingPageUrl: "/dashboard/billing/plans",
            availablePlans: availablePlans.slice(0, 3), // Top 3 plans
          },
        },
        { status: 429 } // Too Many Requests
      );
    } else {
      console.log(`[SearchQuota] OK - remaining searches: ${quotaStatus.remainingSearches}`);
    }
  }

  try {
    // ── SEARCH: HANYA dari User's Database (NO Apify) ─────────────────────
    // User search = search portfolio mereka sendiri, instant dari DB
    
    if (!userId) {
      // Not logged in = no search
      return NextResponse.json({ 
        results: [], 
        message: "Please login to search your assets",
        fromDb: false 
      });
    }

    // Check memory cache dulu sebelum query DB
    const cachedResult = getFromCache(userId, query, limit);
    if (cachedResult) {
      console.log(`[Search] Memory cache hit for "${query}"`);
      return NextResponse.json(cachedResult);
    }

    // Query ALL assets (public search untuk analytics - bisa dari semua users)
    console.log(`[Search] Querying all assets (public search)`);
    
    // Fetch ALL assets dari database
    const allUserAssets = await prisma.asset.findMany({
      orderBy: { downloads: "desc" },
      take: 1000, // Limit para safety
    });

    console.log(`[Search] Loaded ${allUserAssets.length} total assets from all users`);

    // Filter by query di memory (case-insensitive, flexible)
    const queryLower = query.toLowerCase();
    const matchedAssets = allUserAssets.filter((asset) => {
      const title = (asset.title || "").toLowerCase();
      
      // Keywords sudah array dari Prisma, tidak perlu JSON.parse()
      const keywords = Array.isArray(asset.keywords) ? asset.keywords : [];
      const keywordsLower = keywords.map((k: string) => (k || "").toLowerCase());
      const category = (asset.category || "").toLowerCase();

      return (
        title.includes(queryLower) ||
        keywordsLower.some((k: string) => k.includes(queryLower)) ||
        category.includes(queryLower)
      );
    });

    console.log(`[Search] After filter: ${matchedAssets.length} assets match "${query}"`);

    // Sort by priority: Title > Keywords > Category
    const prioritySorted = matchedAssets.sort((a, b) => {
      const queryLower = query.toLowerCase();
      const aTitle = (a.title || "").toLowerCase();
      const bTitle = (b.title || "").toLowerCase();
      
      // Keywords sudah array dari Prisma
      const aKeywords = Array.isArray(a.keywords) ? a.keywords : [];
      const bKeywords = Array.isArray(b.keywords) ? b.keywords : [];
      
      const aKeywordsLower = aKeywords.map(k => (k || "").toLowerCase());
      const bKeywordsLower = bKeywords.map(k => (k || "").toLowerCase());
      const aCategory = (a.category || "").toLowerCase();
      const bCategory = (b.category || "").toLowerCase();

      // Priority 1: Title match
      const aTitleMatch = aTitle.includes(queryLower);
      const bTitleMatch = bTitle.includes(queryLower);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      // Priority 2: Keywords match
      const aKeywordMatch = aKeywordsLower.some(k => k.includes(queryLower));
      const bKeywordMatch = bKeywordsLower.some(k => k.includes(queryLower));
      if (aKeywordMatch && !bKeywordMatch) return -1;
      if (!aKeywordMatch && bKeywordMatch) return 1;

      // Priority 3: Category match
      const aCategoryMatch = aCategory.includes(queryLower);
      const bCategoryMatch = bCategory.includes(queryLower);
      if (aCategoryMatch && !bCategoryMatch) return -1;
      if (!aCategoryMatch && bCategoryMatch) return 1;

      // Same priority = sort by downloads
      return b.downloads - a.downloads;
    });

    // Format results
    const results = prioritySorted.slice(0, limit).map((a: any) => ({
      adobeId: a.assetId,
      title: a.title,
      creator: a.contributorId || "Unknown",
      thumbnail: a.thumbnail,
      type: a.fileType || "Photo",
      category: a.category || "General",
      downloads: a.downloads,
      trend: `+${Math.floor(Math.random() * 30) + 1}%`,
      revenue: `$${(a.downloads * 0.33).toFixed(2)}`,
      uploadDate: a.uploadedAt?.toLocaleDateString("id-ID") || "-",
      keywords: Array.isArray(a.keywords) ? a.keywords : [],
      contentUrl: a.assetUrl || "",
      artistUrl: "",
      status: "Premium",
      fromDb: true,
    }));

    // Log search action untuk quota tracking
    console.log(`[SearchLog] Logging search - user: ${userId}, query: ${query}`);
    try {
      await logSearchAction(userId, query, userEmail);
    } catch (logError) {
      console.error(`[SearchLog] Error logging search:`, logError);
      // Don't fail the entire search if logging fails
    }

    const response = { 
      results, 
      fromCache: false, 
      fromDb: true, 
      total: results.length, 
      isPro,
      message: results.length === 0 ? "No assets found matching your search" : null 
    };

    // Cache result for 5 minutes in memory
    setCache(userId, query, limit, response);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("[Search Error]", error);
    console.error("[Search Error Stack]", error?.stack);
    return NextResponse.json(
      { results: [], error: error?.message || "Search failed", details: String(error) },
      { status: 500 }
    );
  }
}