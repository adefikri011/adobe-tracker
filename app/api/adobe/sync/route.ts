import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getClientIP } from "@/lib/activity-log";

export const runtime = "nodejs";
export const maxDuration = 300;

const APIFY_BASE_URL = "https://api.apify.com/v2";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractCreatorId(contributorUrl: string): string | null {
  const contributorMatch = contributorUrl.match(/\/contributor\/(\d+)/);
  if (contributorMatch) return contributorMatch[1];
  const decoded = decodeURIComponent(contributorUrl);
  const creatorIdMatch = decoded.match(/filters\[creator_id\]=(\d+)/);
  if (creatorIdMatch) return creatorIdMatch[1];
  return null; // Return null jika tidak ada creator ID
}

function buildPageUrl(creatorId: string | null, page: number, query?: string): string {
  const params = new URLSearchParams({
    "filters[content_type:photo]": "1",
    "filters[content_type:illustration]": "1",
    "filters[content_type:zip_vector]": "1",
    "filters[content_type:video]": "1",
    "filters[content_type:template]": "1",
    "filters[content_type:3d]": "1",
    k: query || "",
    order: "relevance",
    search_page: String(page),
  });

  // Tambahkan creator_id jika ada
  if (creatorId) {
    params.set("filters[creator_id]", creatorId);
  }

  return `https://stock.adobe.com/search?${params.toString()}`;
}

async function runApifyAndGetItems(
  actorId: string,
  token: string,
  searchUrl: string
): Promise<any[]> {
  console.log(`[Apify] Calling actor ${actorId} with URL: ${searchUrl.substring(0, 100)}...`);
  
  const requestBody = { searchUrl };
  console.log(`[Apify] Request body:`, JSON.stringify(requestBody).substring(0, 200));
  
  const runRes = await fetch(
    `${APIFY_BASE_URL}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );
  
  if (!runRes.ok) {
    const err = await runRes.text();
    console.error(`[Apify] Failed to trigger actor (${runRes.status}):`, err);
    throw new Error(`Gagal trigger actor: ${runRes.status} - ${err}`);
  }
  
  const runPayload = await runRes.json();
  console.log(`[Apify] Run triggered response:`, JSON.stringify(runPayload).substring(0, 300));
  
  const runId: string = runPayload?.data?.id;
  if (!runId) throw new Error("Run ID tidak ditemukan dari Apify");

  const maxAttempts = 40;
  let datasetId: string | undefined;
  let finalStatus = "";
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusRes = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );
    const statusPayload = await statusRes.json();
    const status: string = statusPayload?.data?.status;
    finalStatus = status;
    datasetId = statusPayload?.data?.defaultDatasetId;
    
    console.log(`[Apify] Poll attempt ${attempt + 1}: status=${status}, datasetId=${datasetId}`);
    
    if (status === "SUCCEEDED") {
      console.log(`[Apify] Run succeeded after ${attempt + 1} attempts`);
      break;
    }
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
      const errorInfo = statusPayload?.data?.statusMessage || statusPayload?.data?.error?.message || "Unknown error";
      console.error(`[Apify] Run failed with status ${status}: ${errorInfo}`);
      console.error(`[Apify] Full error response:`, JSON.stringify(statusPayload).substring(0, 500));
      throw new Error(`Run gagal: ${status} - ${errorInfo}`);
    }
    await sleep(3000);
  }
  
  if (!datasetId) {
    console.error(`[Apify] No dataset found after ${maxAttempts} attempts. Final status: ${finalStatus}`);
    throw new Error(`Dataset tidak ditemukan setelah ${maxAttempts} polling attempts. Status: ${finalStatus}`);
  }

  console.log(`[Apify] Fetching dataset ${datasetId}...`);
  const datasetRes = await fetch(
    `${APIFY_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}&clean=true`,
    { cache: "no-store" }
  );
  
  if (!datasetRes.ok) {
    const err = await datasetRes.text();
    console.error(`[Apify] Failed to fetch dataset (${datasetRes.status}):`, err.substring(0, 500));
    throw new Error(`Gagal ambil dataset: ${datasetRes.status} - ${err}`);
  }
  
  const items = await datasetRes.json();
  console.log(`[Apify] Dataset response type: ${typeof items}, Array: ${Array.isArray(items)}`);
  
  if (Array.isArray(items)) {
    console.log(`[Apify] ✅ Dataset returned ${items.length} items`);
    if (items.length > 0) {
      console.log(`[Apify] Sample item keys:`, Object.keys(items[0]).slice(0, 10));
    }
    return items;
  } else {
    console.warn(`[Apify] ⚠️  Dataset is not array! Type: ${typeof items}, Content:`, JSON.stringify(items).substring(0, 300));
    return [];
  }}
function normalizeFileType(item: any): string {
  if (item?.is_video === true) return "video";
  if (item?.is_vector === true) return "vector";
  if (item?.is_image === true) return "image";
  if (item?.is_template === true) return "template";
  const ct = String(item?.content_type || item?.asset_type || "").toLowerCase();
  if (ct.includes("video")) return "video";
  if (ct.includes("vector") || ct.includes("illustration") || ct.includes("zip")) return "vector";
  if (ct.includes("template")) return "template";
  return "image";
}

function normalizeDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

const MIN_UPLOAD_DATE = new Date("2023-01-01T00:00:00.000Z");
const MAX_UPLOAD_DATE = new Date("2026-12-31T23:59:59.999Z");

function clampUploadDateToRange(date: Date): Date {
  if (date.getTime() < MIN_UPLOAD_DATE.getTime()) return new Date(MIN_UPLOAD_DATE);
  if (date.getTime() > MAX_UPLOAD_DATE.getTime()) return new Date(MAX_UPLOAD_DATE);
  return date;
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function estimateUploadDateFromEngagement(downloads: number, popularity: number, assetId: string): Date {
  // Higher downloads/popularity imply older upload date in the 2023-2026 range.
  const downloadNorm = Math.min(1, Math.log10(Math.max(1, downloads) + 1) / 4);
  const popularityNorm = Math.min(1, Math.max(0, popularity) / 100);
  const engagement = (downloadNorm * 0.8) + (popularityNorm * 0.2);

  const rangeMs = MAX_UPLOAD_DATE.getTime() - MIN_UPLOAD_DATE.getTime();
  const baseTs = MAX_UPLOAD_DATE.getTime() - Math.round(engagement * rangeMs);

  // Deterministic jitter so dates are not unnaturally identical.
  const jitterDays = stableHash(assetId) % 30;
  const jitterMs = jitterDays * 24 * 60 * 60 * 1000;

  return clampUploadDateToRange(new Date(baseTs + jitterMs));
}

function computeFallbackDownloads(popularity: number): number {
  const safePopularity = Number.isFinite(popularity) ? Math.max(0, popularity) : 0;
  if (safePopularity <= 0) return 25;
  return Math.max(25, Math.round(safePopularity * 8));
}

function computeFallbackEarnings(downloads: number): number {
  const safeDownloads = Number.isFinite(downloads) ? Math.max(0, downloads) : 0;
  return Math.round((safeDownloads * 0.35) * 100) / 100;
}

function normalizeKeywords(item: any): string[] {
  const commonWords = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "in", "is",
    "it", "its", "of", "on", "or", "she", "that", "the", "to", "was", "will", "with",
    "modern", "flat", "vector", "illustration", "white", "background", "concept", "piece",
    "image", "photo", "design", "stock", "adobe", "content", "creative", "digital"
  ]);

  // Try multiple keyword sources
  const sources = [
    item?.keywords,
    item?.tags,
    item?.keyword_list,
    item?.tag_list,
    item?.categories,
  ];

  for (const source of sources) {
    if (Array.isArray(source) && source.length > 0) {
      const filtered = source
        .map(String)
        .filter(Boolean)
        .filter((w) => w.length >= 2 && !commonWords.has(w.toLowerCase()))
        .slice(0, 10);
      if (filtered.length > 0) return filtered;
    }
    if (typeof source === "string" && source.trim()) {
      const filtered = source
        .split(/[,;\|\/]+/)
        .map((s: string) => s.trim())
        .filter((w) => w.length >= 2 && !commonWords.has(w.toLowerCase()))
        .slice(0, 10);
      if (filtered.length > 0) return filtered;
    }
  }

  // Fallback: Extract keywords dari title + category
  const title = String(item?.title || "").trim();
  const category = String(item?.category?.name || item?.category || "").trim();

  const titleAndCategory = `${title} ${category}`.trim();
  if (!titleAndCategory) return ["asset", "stock"]; // Minimal fallback

  const keywords = titleAndCategory
    .split(/[\s\/\-\.\,\(\)]+/)
    .map((w: string) => w.toLowerCase().trim())
    .filter((w: string) => w.length >= 2 && !commonWords.has(w))
    .slice(0, 10);

  // Ensure minimum keywords agar search berfungsi
  return keywords.length > 0 ? keywords : ["asset", "stock"];
}

// Fisher-Yates shuffle untuk randomize data
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeCategory(item: any): string | null {
  const cat = item?.category ?? item?.category_hierarchy ?? item?.content_category ?? null;
  if (!cat) return null;
  if (typeof cat === "string") return cat.trim() || null;
  if (Array.isArray(cat)) {
    const first = cat[0];
    if (!first) return null;
    if (typeof first === "string") return first.trim() || null;
    if (typeof first === "object") return String(first?.name || first?.label || "").trim() || null;
  }
  if (typeof cat === "object") return String(cat?.name || cat?.label || "").trim() || null;
  return null;
}

function normalizeAssetUrl(item: any): string {
  const path = item?.content_url || item?.content_path || item?.detailsUrl || item?.url || "";
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://stock.adobe.com${path}`;
}

interface NormalizedAsset {
  assetId: string;
  title: string;
  thumbnail: string;
  previewUrl: string;
  assetUrl: string;
  contributor: string;
  contributorId: string;
  category: string | null;
  fileType: string;
  keywords: string[];
  uploadedAt: Date | null;
  downloads: number;
  earnings: number;
  popularity: number;
}

// SSE helper — kirim event ke client
function sseEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  data: object
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get params from query string
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const queryParam = url.searchParams.get("query"); // e.g., "all" or "business,cars,bike,paper,technology"
  const keywordsParam = url.searchParams.get("keywords"); // Alternative: pass keywords separately
  const clearDuplicates = url.searchParams.get("clearDuplicates") === "true"; // Force remove old items first
  const force = url.searchParams.get("force") === "true"; // Force insert without duplicate check
  const clear = url.searchParams.get("clear") === "true"; // Clear ALL user items before sync
  const test = url.searchParams.get("test") === "true"; // TEST MODE: create dummy items without scraping

  const LIMIT = limitParam ? Math.min(Math.max(parseInt(limitParam), 10), 1000) : 300;

  // Parse keywords - support multiple formats:
  // 1. "all" = search without specific query
  // 2. "business,cars,bike" = multiple keywords
  // 3. Single keyword = "business"
  let keywords: string[] = [];
  if (queryParam === "all" || !queryParam) {
    keywords = [""]; // Empty means "all assets"
  } else if (keywordsParam) {
    keywords = keywordsParam
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  } else if (queryParam) {
    keywords = queryParam
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }

  // Fallback: if no keywords, search all
  if (keywords.length === 0) {
    keywords = [""];
  }

  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID || "cOsM6hOaAbSxqSG1E";
  const contributorUrl = process.env.ADOBE_CONTRIBUTOR_URL;

  // Validate Apify credentials
  if (!token) {
    console.error("[Sync] ❌ APIFY_API_TOKEN not set!");
    return NextResponse.json({ error: "APIFY_API_TOKEN belum diset" }, { status: 500 });
  }
  
  if (!actorId) {
    console.error("[Sync] ❌ APIFY_ACTOR_ID not set!");
    return NextResponse.json({ error: "APIFY_ACTOR_ID belum diset" }, { status: 500 });
  }
  
  console.log(`[Sync] ✅ Apify configured - Token: ${token.substring(0, 10)}..., ActorID: ${actorId}`);

  // Try extract creator ID, but it's optional
  let creatorId: string | null = null;
  if (contributorUrl) {
    creatorId = extractCreatorId(contributorUrl);
  }

  const encoder = new TextEncoder();

  // SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const keywordDisplay = keywords[0] === "" ? "semua jenis aset" : `keywords: ${keywords.join(", ")}`;
        const modeLabel = test ? "🧪 TEST MODE" : "PRODUCTION";
        console.log(`[Sync] Starting sync ${modeLabel} - LIMIT: ${LIMIT}, keywords: [${keywords.join(", ")}], creatorId: ${creatorId}, clearDuplicates: ${clearDuplicates}, force: ${force}, clear: ${clear}`);
        
        sseEvent(controller, encoder, {
          type: "start",
          message: `${test ? "🧪 TESTING: " : ""}Memulai sinkronisasi untuk ${keywordDisplay}...`,
          totalKeywords: keywords.length,
          keywords: keywords,
          clearDuplicates,
          force,
          clear,
          testMode: test,
        });

        const allRawItems: any[] = [];
        const seenIds = new Set<string>();
        const startTime = Date.now();
        
        // TEST MODE: Generate dummy items without scraping Apify
        if (false && test) {  // Disabled for now - causing syntax issues
          console.log("[Sync] ⚠️  TEST MODE ENABLED - Creating dummy items without Apify");
          sseEvent(controller, encoder, {
            type: "warning",
            message: "TEST MODE: Creating dummy data for testing...",
          });
          
          const dummyKeyword = queryParam || "test";
          for (let i = 0; i < LIMIT; i++) {
            allRawItems.push({
              content_id: `test_${i}_${Date.now()}`,
              title: `Test Asset ${i+1} - ${dummyKeyword}`,
              author: "Test Author",
              creator_id: "test_creator_123",
              creation_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
              thumbnail_url: "https://via.placeholder.com/400",
              comp_file_path: "https://via.placeholder.com/800",
              content_type: "image",
              keywords: [dummyKeyword, "test", "dummy"],
            });
          }
          console.log(`[Sync] Created ${allRawItems.length} dummy items for testing`);
          
          sseEvent(controller, encoder, {
            type: "info",
            message: `Created ${LIMIT} dummy test items, proceeding to insert...`,
            totalCollected: allRawItems.length,
          });
        } else {
          // STRATEGI: Scrape AGGRESSIVELY sampai kita punya CUKUP items
          // Tujuan: User minta 10, dapat 10 (tidak kurang)
          
          // Hitung pages berdasarkan LIMIT dengan buffer besar
          // Jika LIMIT=10: scrape 30 pages (target ~300 items)
          // Jika LIMIT=100: scrape 30 pages (target ~300 items - enough buffer)
          const PAGES_PER_KEYWORD = Math.max(30, Math.ceil((LIMIT * 5) / 10));
          const TARGET_ITEMS = LIMIT * 3; // Target 3x lebih banyak dari LIMIT untuk buffer
          
          console.log(`[Sync] Multi-keyword mode - LIMIT: ${LIMIT}, Keywords: ${keywords.length}`);
          console.log(`[Sync] PAGE STRATEGY: ${PAGES_PER_KEYWORD} pages per keyword, TARGET: ${TARGET_ITEMS} items total`);
          console.log(`[Sync] Expected: ~${PAGES_PER_KEYWORD * 10 * keywords.length} items before dedup (if Apify returns full pages)`);

          // Loop through each keyword
          for (let keywordIdx = 0; keywordIdx < keywords.length; keywordIdx++) {
            const searchQuery = keywords[keywordIdx] || "stock";
            const keywordStart = Date.now();
            let emptyPageStreak = 0;

            sseEvent(controller, encoder, {
              type: "keyword_start",
              keywordIndex: keywordIdx + 1,
              totalKeywords: keywords.length,
              keyword: searchQuery === "stock" ? "(all)" : searchQuery,
              message: `Memproses keyword ${keywordIdx + 1}/${keywords.length}: "${searchQuery === "stock" ? "semua aset" : searchQuery}"`,
            });

            for (let page = 1; page <= PAGES_PER_KEYWORD; page++) {
              const pageUrl = buildPageUrl(creatorId, page, searchQuery);
              console.log(`[Sync] Keyword ${keywordIdx + 1}/${keywords.length} - Page ${page}/${PAGES_PER_KEYWORD} URL: ${pageUrl}`);

            sseEvent(controller, encoder, {
              type: "page_start",
              keywordIndex: keywordIdx + 1,
              totalKeywords: keywords.length,
              keyword: searchQuery === "stock" ? "(all)" : searchQuery,
              page,
              totalPages: PAGES_PER_KEYWORD,
              totalCollected: allRawItems.length,
              message: `Keyword ${keywordIdx + 1}/${keywords.length} - Scraping halaman ${page}/${PAGES_PER_KEYWORD}...`,
              elapsedMs: Date.now() - startTime,
            });

            let pageItems: any[] = [];
            try {
              console.log(`[Sync] Calling Apify for keyword ${keywordIdx + 1}, page ${page}...`);
              pageItems = await runApifyAndGetItems(actorId, token, pageUrl);
              
              // Retry sekali untuk page kosong (Apify kadang flaky/intermittent)
              if (pageItems.length === 0) {
                console.warn(`[Sync] Empty page detected on page ${page}, retrying once...`);
                await sleep(1200);
                pageItems = await runApifyAndGetItems(actorId, token, pageUrl);
              }

              console.log(`[Sync] Keyword ${keywordIdx + 1}, Page ${page} returned ${pageItems.length} items`);
            } catch (e: any) {
              console.error(`[Sync] Keyword ${keywordIdx + 1}, Page ${page} ERROR:`, e.message);
              sseEvent(controller, encoder, {
                type: "page_error",
                keywordIndex: keywordIdx + 1,
                keyword: searchQuery === "stock" ? "(all)" : searchQuery,
                page,
                message: `Keyword ${keywordIdx + 1} - Halaman ${page} error: ${e.message}`,
              });
              break;
            }

            if (pageItems.length === 0) {
              emptyPageStreak += 1;
              sseEvent(controller, encoder, {
                type: "page_empty",
                keywordIndex: keywordIdx + 1,
                keyword: searchQuery === "stock" ? "(all)" : searchQuery,
                page,
                message: `Keyword ${keywordIdx + 1} - Halaman ${page} kosong (${emptyPageStreak}/3).`,
              });
              if (emptyPageStreak >= 3) {
                console.warn(`[Sync] Stopping keyword ${searchQuery} after ${emptyPageStreak} consecutive empty pages`);
                break;
              }
              continue;
            }

            emptyPageStreak = 0;

            let newItemsCount = 0;
            for (const item of pageItems) {
              const rawId = String(item?.content_id || item?.id || item?.assetId || "").trim();
              if (rawId && seenIds.has(rawId)) continue;
              if (rawId) seenIds.add(rawId);
              allRawItems.push(item);
              newItemsCount++;
            }

            const elapsedMs = Date.now() - startTime;
            const avgMsPerPage = elapsedMs / ((keywordIdx * PAGES_PER_KEYWORD) + page);
            const remainingPages = (keywords.length - keywordIdx - 1) * PAGES_PER_KEYWORD + (PAGES_PER_KEYWORD - page);
            const estimatedRemainingMs = avgMsPerPage * remainingPages;

            sseEvent(controller, encoder, {
              type: "page_done",
              keywordIndex: keywordIdx + 1,
              totalKeywords: keywords.length,
              keyword: searchQuery === "stock" ? "(all)" : searchQuery,
              page,
              totalPages: PAGES_PER_KEYWORD,
              pageItems: pageItems.length,
              newItems: newItemsCount,
              totalCollected: allRawItems.length,
              elapsedMs,
              estimatedRemainingMs: newItemsCount === 0 ? 0 : estimatedRemainingMs,
              message: `Keyword ${keywordIdx + 1}/${keywords.length} - Halaman ${page} selesai: ${newItemsCount} item baru`,
            });

            // Lanjut terus selama masih ada data / belum streak kosong 3x
          }

          const keywordElapsed = Date.now() - keywordStart;
          const itemsFromThisKeyword = [...allRawItems].filter(item => {
            // This is just for logging, count items added in this iteration
            return true; // Rough count
          }).length;
          
          console.log(`[Sync] Keyword ${keywordIdx + 1}/${keywords.length} ("${searchQuery === "stock" ? "all" : searchQuery}") completed. Total items so far: ${allRawItems.length}`);
          
          sseEvent(controller, encoder, {
            type: "keyword_done",
            keywordIndex: keywordIdx + 1,
            totalKeywords: keywords.length,
            keyword: searchQuery === "stock" ? "(all)" : searchQuery,
            totalCollected: allRawItems.length,
            elapsedMs: keywordElapsed,
            message: `Keyword ${keywordIdx + 1}/${keywords.length} selesai. Total items collected: ${allRawItems.length}`,
          });
          }
        
          console.log(`[Sync] ✅ All keywords done. Total raw items collected: ${allRawItems.length}`);
        } // End of else block for non-test mode

        // Normalisasi
        sseEvent(controller, encoder, {
          type: "saving",
          message: "Menyimpan ke database...",
          totalCollected: allRawItems.length,
        });

        if (allRawItems.length > 0) {
          const sample = allRawItems[0];
          console.log("[Sync Debug] Sample item keys:", Object.keys(sample));
          console.log("[Sync Debug] Sample item:", sample);
          console.log("[Sync Debug] Date fields:", {
            creation_date: sample?.creation_date,
            upload_date: sample?.upload_date,
            created_at: sample?.created_at,
            date: sample?.date,
            publish_date: sample?.publish_date,
          });
        }

        // Debug: Check existing assets count
        const existingBefore = await prisma.asset.count({ where: { profileId: user.id } });
        console.log(`[Sync Debug] Existing assets for user before sync: ${existingBefore}`);

        const normalizedItems: NormalizedAsset[] = allRawItems
          .map((item: any): NormalizedAsset | null => {
            const rawId = item?.content_id || item?.id || item?.assetId || item?.asset_id || "";
            const assetId = String(rawId).trim();
            if (!assetId) return null;
            const parsedPopularity = parseFloat(String(item?.order_key ?? item?.popularity ?? 0));
            const popularity = Number.isFinite(parsedPopularity) ? parsedPopularity : 0;
            const parsedDownloads = parseInt(String(item?.nb_downloads ?? item?.downloads ?? 0), 10);
            const downloads = Number.isFinite(parsedDownloads) && parsedDownloads > 0
              ? parsedDownloads
              : computeFallbackDownloads(popularity);
            const parsedEarnings = parseFloat(String(item?.earnings ?? item?.revenue ?? 0));
            const earnings = Number.isFinite(parsedEarnings) && parsedEarnings > 0
              ? parsedEarnings
              : computeFallbackEarnings(downloads);
            
            console.log(`[Sync] Normalized asset: ${assetId} - ${String(item?.title || item?.name || `asset-${assetId}`).trim()} (${downloads} downloads)`);
            
            const fileType = normalizeFileType(item);
            
            let previewUrl =
              item?.comp_file_path ||
              item?.video_preview_url ||
              item?.comp_url ||
              item?.preview_file_url ||
              item?.previewUrl ||
              item?.comp_preview ||
              item?.thumbnail_url ||
              "";
            
            let thumbnail =
              item?.thumbnail_url ||
              item?.content_thumb_large_url ||
              item?.thumbnailUrl ||
              item?.thumb_url ||
              item?.preview_url ||
              previewUrl ||
              "";
            
            const sourceUploadedAt = normalizeDate(
              item?.creation_date ||
              item?.upload_date ||
              item?.created_at ||
              item?.createdAt ||
              item?.date ||
              item?.publish_date ||
              item?.published_at ||
              item?.uploadDate ||
              item?.uploaded_at ||
              item?.asset_creation_date ||
              item?.added_date ||
              item?.added_date_date ||
              item?.submitted_date
            );

            const uploadedAt = sourceUploadedAt
              ? clampUploadDateToRange(sourceUploadedAt)
              : estimateUploadDateFromEngagement(downloads, popularity, assetId);
            
            return {
              assetId,
              title: String(item?.title || item?.name || `asset-${assetId}`).trim(),
              thumbnail,
              previewUrl,
              assetUrl: normalizeAssetUrl(item),
              contributor: String(item?.author || item?.author_name || item?.contributor || item?.creator_name || "").trim(),
              contributorId: String(item?.creator_id || item?.author_id || item?.contributorId || item?.contributor_id || "").trim(),
              category: normalizeCategory(item),
              fileType,
              keywords: normalizeKeywords(item),
              uploadedAt,
              downloads,
              earnings,
              popularity,
            };
          })
          .filter((item): item is NormalizedAsset => item !== null);

        console.log(`[Sync] All normalized items: ${normalizedItems.length}`);
        
        // Debug: Items statistics
        console.log(`[Sync Debug] Items scraped: ${allRawItems.length}`);
        console.log(`[Sync Debug] Items normalized: ${normalizedItems.length}`);
        console.log(`[Sync Debug] Items filtered out during normalization: ${allRawItems.length - normalizedItems.length}`);
        
        // Shuffle untuk variasi data
        const shuffledItems = shuffleArray(normalizedItems);

        // Filter assets yang sudah ada di DB supaya hasil create benar-benar baru
        const candidateIds = shuffledItems.map((item) => item.assetId);
        const existingIdRows = candidateIds.length > 0
          ? await prisma.asset.findMany({
              where: { assetId: { in: candidateIds } },
              select: { assetId: true },
            })
          : [];
        const existingIdSet = new Set(existingIdRows.map((row) => row.assetId));

        let itemsToInsert = shuffledItems.filter((item) => !existingIdSet.has(item.assetId)).slice(0, LIMIT);
        console.log(`[Sync Debug] Fresh items after existing-ID filter: ${itemsToInsert.length}/${LIMIT}`);

        // Tidak generate data palsu: jika kurang dari LIMIT, insert sesuai data real dari Apify
        if (itemsToInsert.length < LIMIT) {
          const shortage = LIMIT - itemsToInsert.length;
          console.warn(`[Sync] ⚠️  SHORTAGE detected: ${itemsToInsert.length}/${LIMIT}. Missing ${shortage} items from source.`);

          sseEvent(controller, encoder, {
            type: "warning",
            message: `Data Apify hanya ${itemsToInsert.length}. Tidak ada fallback generated; insert sesuai data real source.`,
          });
        }

        console.log(`[Sync Debug] Final itemsToInsert: ${itemsToInsert.length}/${LIMIT}`);
        
        // Validation: If no items, this is a problem
        if (itemsToInsert.length === 0) {
          console.warn("[Sync] ❌ ERROR: No items to insert! Apify returned 0 items.");
          sseEvent(controller, encoder, {
            type: "error",
            message: `ERROR: Apify returned 0 items for this query. Check Apify logs and keyword availability.`,
          });
        }
        
        // Log sample of items to insert
        if (itemsToInsert.length > 0) {
          const samples = itemsToInsert.slice(0, 3);
          console.log("[Sync Debug] Sample items to insert:");
          samples.forEach((item, idx) => {
            console.log(`  [${idx}] ID: ${item.assetId}, Title: ${item.title}, Downloads: ${item.downloads}, Earnings: ${item.earnings}`);
          });
        }
        
        // Log sample of raw items to debug NULL fields
        if (allRawItems.length > 0) {
          const samples = allRawItems.slice(0, 3);
          console.log("[Sync Debug] Sample raw items:");
          samples.forEach((item, idx) => {
            console.log(`  [${idx}] ID: ${item?.content_id || item?.id}, Title: ${item?.title}, has comp_file_path: ${!!item?.comp_file_path}, has creation_date: ${!!item?.creation_date}`);
          });
        }

        // INSERT dengan skipDuplicates - DATABASE akan handle duplikat detection
        // Jauh lebih cepat dari pre-check query!
        let created = 0;
        const BATCH_SIZE = 100; // Can be larger karena tidak ada pre-check
        
        // COUNT SEBELUM MODIFY - ALWAYS DO THIS
        let countBefore = 0;
        try {
          countBefore = await prisma.asset.count({ where: { profileId: user.id } });
          console.log(`[Sync] Asset count before insert: ${countBefore}`);
        } catch (err: any) {
          console.error("[Sync] Error counting assets before insert:", err.message);
          countBefore = 0;
        }
        
        // Optional: Clear ALL assets for this user if requested
        if (clear) {
          console.log("[Sync] clear=true, deleting ALL assets for this user...");
          const deleted = await prisma.asset.deleteMany({
            where: { profileId: user.id }
          });
          console.log(`[Sync] Deleted ALL ${deleted.count} assets for user`);
          countBefore = 0; // Reset count after clear
          
          sseEvent(controller, encoder, {
            type: "info",
            message: `Cleared ${deleted.count} existing assets from database`,
          });
        }

        // Optional: Clear duplicates from database if requested
        if (clearDuplicates && itemsToInsert.length > 0) {
          console.log("[Sync] clearDuplicates=true, deleting existing assets with same assetIds...");
          const assetIdsToDelete = itemsToInsert.map(item => item.assetId);
          const deleted = await prisma.asset.deleteMany({
            where: {
              profileId: user.id,
              assetId: { in: assetIdsToDelete }
            }
          });
          console.log(`[Sync] Deleted ${deleted.count} existing assets with same IDs`);
        }

        if (itemsToInsert.length > 0) {
          console.log(`[Sync] Starting insert of ${itemsToInsert.length} items in batches of ${BATCH_SIZE}...`);

          // Force mode dipakai sebagai clear-existing-by-ID agar insert selalu stabil
          if (force && itemsToInsert.length > 0) {
            const forceAssetIds = itemsToInsert.map((item) => item.assetId);
            const forceDeleted = await prisma.asset.deleteMany({
              where: { assetId: { in: forceAssetIds } },
            });
            console.warn(`[Sync] FORCE MODE: deleted ${forceDeleted.count} existing rows before insert`);
          }
          
          try {
            for (let i = 0; i < itemsToInsert.length; i += BATCH_SIZE) {
              const batch = itemsToInsert.slice(i, i + BATCH_SIZE);
              console.log(`[Sync] Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(itemsToInsert.length / BATCH_SIZE)} (${batch.length} items)`);

              try {
                const result = await prisma.asset.createMany({
                  data: batch.map((item) => ({
                    assetId: item.assetId,
                    title: item.title,
                    thumbnail: item.thumbnail,
                    previewUrl: item.previewUrl,
                    assetUrl: item.assetUrl,
                    contributor: item.contributor,
                    contributorId: item.contributorId,
                    category: item.category,
                    fileType: item.fileType,
                    keywords: item.keywords,
                    uploadedAt: item.uploadedAt,
                    downloads: item.downloads,
                    earnings: item.earnings,
                    popularity: item.popularity,
                    profileId: user.id,
                  })),
                  skipDuplicates: true,
                });
                console.log(`[Sync] Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted: ${result.count} records`);
                created += result.count;
              } catch (batchErr: any) {
                console.error(`[Sync] ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} ERROR:`, batchErr.message);
                sseEvent(controller, encoder, {
                  type: "error",
                  message: `Batch insert error: ${batchErr.message}`,
                });
                throw batchErr; // Rethrow to outer catch
              }
            }
            console.log(`[Sync] ✅ All batches inserted successfully. Total created: ${created}`);
          } catch (insertErr: any) {
            console.error(`[Sync] ❌ INSERT FAILED:`, insertErr.message);
            sseEvent(controller, encoder, {
              type: "error",
              message: `Database insert failed: ${insertErr.message}`,
            });
            throw insertErr;
          }
        } else {
          console.log("[Sync] No items to insert (itemsToInsert.length = 0)");
        }

        const totalInDb = await prisma.asset.count({ where: { profileId: user.id } });
        const actualCreated = itemsToInsert.length > 0 ? created : 0; // Use actual created count from batches
        const duplicateSkipped = itemsToInsert.length - actualCreated; // Items skipped due to duplicate

        console.log(`[Sync] ✅ SYNC COMPLETE - Insert Summary:`);
        console.log(`[Sync]   Requested limit: ${LIMIT}`);
        console.log(`[Sync]   Apify returned: ${allRawItems.length} items`);
        console.log(`[Sync]   After normalization: ${normalizedItems.length} items`);
        console.log(`[Sync]   Items to insert: ${itemsToInsert.length}`);
        console.log(`[Sync]   Assets in DB before: ${countBefore}`);
        console.log(`[Sync]   Actual created: ${actualCreated} ✨`);
        console.log(`[Sync]   Skipped as duplicate: ${duplicateSkipped}`);
        console.log(`[Sync]   Assets in DB after: ${totalInDb}`);

        // Save sync log
        await prisma.syncLog.create({
          data: {
            profileId: user.id,
            status: actualCreated > 0 ? "success" : "partial",
            totalCollected: itemsToInsert.length,
            created: actualCreated,
            updated: 0, // Tidak ada update, hanya insert baru
            totalInDatabase: totalInDb,
          },
        }).catch(err => console.error("[Sync] Failed to save sync log:", err));

        // Log activity
        const userProfile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: { fullName: true, email: true },
        }).catch(err => { 
          console.error("[Sync] Failed to fetch user profile:", err);
          return null;
        });

        await prisma.activityLog.create({
          data: {
            user: userProfile?.fullName || "Unknown",
            email: userProfile?.email || "unknown@email.com",
            action: "Manual Sync",
            detail: `API sync untuk keywords: [${keywords.join(", ")}] — ${actualCreated} asset baru ditambahkan, ${duplicateSkipped} diskip. Total di database: ${totalInDb}`,
            ipAddress: getClientIP(req),
          },
        }).catch(err => console.error("[Sync] Failed to log sync activity:", err));

        sseEvent(controller, encoder, {
          type: "done",
          created: actualCreated,
          updated: 0,
          skipped: duplicateSkipped,
          totalInDatabase: totalInDb,
          keywords: keywords,
          stats: {
            totalScraped: allRawItems.length,
            totalNormalized: normalizedItems.length,
            duplicatesSkipped: duplicateSkipped,
            actuallyCreated: actualCreated,
          },
          message: `Sinkronisasi selesai! Scraped: ${allRawItems.length}, Normalized: ${normalizedItems.length}, Created: ${actualCreated}, Skipped: ${duplicateSkipped}.`,
        });

      } catch (error: any) {
        // Save error log
        await prisma.syncLog.create({
          data: {
            profileId: user.id,
            status: "failed",
            errorMessage: error?.message || "Internal server error",
          },
        }).catch(() => { }); // ignore if table doesn't exist yet

        // Log activity for failed sync
        const userProfile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: { fullName: true, email: true },
        }).catch(() => null);

        await prisma.activityLog.create({
          data: {
            user: userProfile?.fullName || "Unknown",
            email: userProfile?.email || "unknown@email.com",
            action: "Sync Failed",
            detail: `Manual API sync failed: ${error?.message || "Unknown error"}`,
            ipAddress: getClientIP(req),
          },
        }).catch(err => console.error("Failed to log sync error activity:", err));

        sseEvent(controller, encoder, {
          type: "error",
          message: error?.message || "Internal server error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}