import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const CACHE_HOURS = 24;
const FREE_LIMIT = 10;
const PRO_LIMIT = 100;

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
  for (let i = 0; i < 40; i++) {
    const statusPayload = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    ).then((r) => r.json());

    const status = statusPayload?.data?.status;
    datasetId = statusPayload?.data?.defaultDatasetId;

    if (status === "SUCCEEDED") break;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) throw new Error(`Run gagal: ${status}`);
    await sleep(3000);
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

// Fungsi untuk filter hasil berdasarkan keyword relevance
function filterByRelevance(items: any[], keyword: string): any[] {
  const queryLower = keyword.toLowerCase();
  
  return items.filter((item) => {
    const title = String(item?.title || "").toLowerCase();
    const categoryValue = item?.category?.name || item?.category;
    const category = String(categoryValue || "").toLowerCase();
    
    const tags = (item?.tags || []).map((t: any) => {
      if (typeof t === "string") return t.toLowerCase();
      if (t?.name) return String(t.name).toLowerCase();
      return "";
    }).filter(Boolean);
    
    // Cek apakah keyword ada di title, category, atau tags
    const inTitle = title.includes(queryLower);
    const inCategory = category.includes(queryLower);
    const inTags = tags.some((tag: string) => tag.includes(queryLower));
    
    // Return hanya jika keyword relevan di minimal satu field
    return inTitle || inCategory || inTags;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) return NextResponse.json({ results: [] });

  // Cek plan user — default free kalau gagal
  let isPro = false;
  let userId: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      userId = user.id;
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { plan: true },
      });
      isPro = profile?.plan === "pro";
    }
  } catch {
    // silent fail — tetap lanjut sebagai free
  }

  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
  console.log(`[Search] "${query}" | plan: ${isPro ? "pro" : "free"} | limit: ${limit}`);

  try {
    // ── PRIORITAS 1: Cari dari asset DB milik user ──────────────────────────
    // Ini gratis, instant, dan relevan karena dari portfolio sendiri
    // SKIP jika user punya banyak assets (>100) untuk avoid slow query
    if (userId) {
      const assetCount = await prisma.asset.count({
        where: { profileId: userId },
      });
      
      // Only query DB kalau assets sedikit (< 100)
      if (assetCount < 100) {
        const dbAssets = await prisma.asset.findMany({
          where: {
            profileId: userId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { keywords: { has: query } },
              { category: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
          orderBy: { downloads: "desc" },
        });

        if (dbAssets.length >= limit) {
          console.log(`[Search] ${dbAssets.length} hasil dari DB lokal`);
          const results = dbAssets.map((a) => ({
            adobeId: a.assetId,
            title: a.title,
            creator: a.contributor || "Unknown",
            thumbnail: a.thumbnail,
            type: a.fileType || "Photo",
            category: a.category || "General",
            downloads: a.downloads,
            trend: `+${Math.floor(Math.random() * 30) + 1}%`,
            revenue: `$${(a.downloads * 0.33).toFixed(2)}`,
            uploadDate: a.uploadedAt?.toLocaleDateString("id-ID") || "-",
            contentUrl: a.assetUrl || "",
            artistUrl: "",
            status: "Premium",
            keywords: a.keywords || [],
            fromDb: true,
          }));
          return NextResponse.json({ results, fromCache: false, fromDb: true, total: results.length, isPro });
        }
      } else {
        console.log(`[Search] Skip DB query (${assetCount} assets) — langsung ke Apify`);
      }
    }

    // ── PRIORITAS 2: Cache Apify ────────────────────────────────────────────
    const cached = await prisma.searchCache.findFirst({
      where: {
        query: query.toLowerCase(),
        createdAt: { gte: new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000) },
      },
    });

    if (cached) {
      const allResults = cached.results as any[];
      // Filter hasil cache untuk memastikan relevan
      const relevantResults = allResults.filter((r) => {
        const title = (r?.title || "").toLowerCase();
        const category = (r?.category || "").toLowerCase();
        return title.includes(query.toLowerCase()) || category.includes(query.toLowerCase());
      });
      console.log(`[Search] Cache hit: ${relevantResults.length}/${allResults.length} hasil relevan`);
      return NextResponse.json({
        results: relevantResults.slice(0, limit),
        fromCache: true,
        cachedAt: cached.createdAt,
        isPro,
        total: relevantResults.length,
      });
    }

    // ── PRIORITAS 3: Apify scrape multi-halaman ─────────────────────────────
    const token = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID || "cOsM6hOaAbSxqSG1E";

    if (!token) {
      return NextResponse.json({ error: "APIFY_API_TOKEN belum diset" }, { status: 500 });
    }

    // Hitung berapa halaman yang perlu di-scrape
    // Tiap halaman = 10 item, pro butuh 100 = 10 halaman, free butuh 10 = 1 halaman
    const pagesNeeded = Math.ceil(limit / 10);
    console.log(`[Search] Scraping ${pagesNeeded} halaman Apify untuk "${query}"`);

    const allItems: any[] = [];
    const seenIds = new Set<string>();

    for (let page = 1; page <= pagesNeeded; page++) {
      const pageUrl = buildSearchUrl(query, page);
      console.log(`[Search] Halaman ${page}/${pagesNeeded}`);

      let pageItems: any[];
      try {
        pageItems = await runApifyPage(actorId, token, pageUrl);
      } catch (e: any) {
        console.error(`[Search] Halaman ${page} error: ${e.message}`);
        break;
      }

      if (pageItems.length === 0) break;

      for (const item of pageItems) {
        const id = String(item?.content_id || item?.id || "").trim();
        if (id && seenIds.has(id)) continue;
        if (id) seenIds.add(id);
        allItems.push(item);
      }

      if (pageItems.length < 10) break; // halaman terakhir
      if (allItems.length >= limit) break;
    }

    console.log(`[Search] Total dari Apify: ${allItems.length}`);

    if (allItems.length === 0) {
      return NextResponse.json({ results: [], fromCache: false, total: 0, isPro });
    }

    // Filter hasil berdasarkan relevance dengan keyword
    const relevantItems = filterByRelevance(allItems, query);
    console.log(`[Search] Setelah filter relevance: ${relevantItems.length}/${allItems.length}`);

    const results = relevantItems.map(formatItem);

    // Simpan ke cache
    await prisma.searchCache.deleteMany({ where: { query: query.toLowerCase() } });
    await prisma.searchCache.create({
      data: { query: query.toLowerCase(), results: results as any },
    });

    return NextResponse.json({
      results: results.slice(0, limit),
      fromCache: false,
      total: results.length,
      isPro,
    });

  } catch (error: any) {
    console.error("[Search Error]", error);
    return NextResponse.json(
      { results: [], error: error?.message || "Search failed" },
      { status: 500 }
    );
  }
}