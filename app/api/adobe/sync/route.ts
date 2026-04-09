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
  const runRes = await fetch(
    `${APIFY_BASE_URL}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchUrl }),
    }
  );
  if (!runRes.ok) {
    const err = await runRes.text();
    throw new Error(`Gagal trigger actor: ${err}`);
  }
  const runPayload = await runRes.json();
  const runId: string = runPayload?.data?.id;
  if (!runId) throw new Error("Run ID tidak ditemukan dari Apify");

  const maxAttempts = 40;
  let datasetId: string | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusRes = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );
    const statusPayload = await statusRes.json();
    const status: string = statusPayload?.data?.status;
    datasetId = statusPayload?.data?.defaultDatasetId;
    if (status === "SUCCEEDED") break;
    if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) throw new Error(`Run gagal: ${status}`);
    await sleep(3000);
  }
  if (!datasetId) throw new Error("Dataset tidak ditemukan setelah polling");

  const datasetRes = await fetch(
    `${APIFY_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}&clean=true`,
    { cache: "no-store" }
  );
  if (!datasetRes.ok) {
    const err = await datasetRes.text();
    throw new Error(`Gagal ambil dataset: ${err}`);
  }
  const items = await datasetRes.json();
  return Array.isArray(items) ? items : [];
}

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
  const queryParam = url.searchParams.get("query"); // e.g., "nature", "urban", "business"
  
  const LIMIT = limitParam ? Math.min(Math.max(parseInt(limitParam), 10), 1000) : 300;
  const searchQuery = queryParam || "stock"; // Default search query

  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID || "cOsM6hOaAbSxqSG1E";
  const contributorUrl = process.env.ADOBE_CONTRIBUTOR_URL;

  if (!token) return NextResponse.json({ error: "APIFY_API_TOKEN belum diset" }, { status: 500 });

  // Try extract creator ID, but it's optional
  let creatorId: string | null = null;
  if (contributorUrl) {
    creatorId = extractCreatorId(contributorUrl);
  }

  // Calculate max pages needed (10 items per page)
  const MAX_PAGES = Math.ceil(LIMIT / 10);
  const encoder = new TextEncoder();

  // SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        sseEvent(controller, encoder, {
          type: "start",
          message: `Memulai sinkronisasi${searchQuery ? ` dengan query "${searchQuery}"` : " untuk semua jenis aset"}...`,
          totalPages: MAX_PAGES,
        });

        const allRawItems: any[] = [];
        const seenIds = new Set<string>();
        const startTime = Date.now();

        for (let page = 1; page <= MAX_PAGES; page++) {
          const pageUrl = buildPageUrl(creatorId, page, searchQuery);

          sseEvent(controller, encoder, {
            type: "page_start",
            page,
            totalPages: MAX_PAGES,
            totalCollected: allRawItems.length,
            message: `Scraping halaman ${page}/${MAX_PAGES}...`,
            elapsedMs: Date.now() - startTime,
          });

          let pageItems: any[];
          try {
            pageItems = await runApifyAndGetItems(actorId, token, pageUrl);
          } catch (e: any) {
            sseEvent(controller, encoder, {
              type: "page_error",
              page,
              message: `Halaman ${page} error: ${e.message}`,
            });
            break;
          }

          if (pageItems.length === 0) {
            sseEvent(controller, encoder, {
              type: "page_empty",
              page,
              message: `Halaman ${page} kosong, selesai.`,
            });
            break;
          }

          let newItemsCount = 0;
          for (const item of pageItems) {
            const rawId = String(item?.content_id || item?.id || item?.assetId || "").trim();
            if (rawId && seenIds.has(rawId)) continue;
            if (rawId) seenIds.add(rawId);
            allRawItems.push(item);
            newItemsCount++;
          }

          const elapsedMs = Date.now() - startTime;
          const avgMsPerPage = elapsedMs / page;
          const remainingPages = MAX_PAGES - page;
          const estimatedRemainingMs = avgMsPerPage * remainingPages;

          sseEvent(controller, encoder, {
            type: "page_done",
            page,
            totalPages: MAX_PAGES,
            pageItems: pageItems.length,
            newItems: newItemsCount,
            totalCollected: allRawItems.length,
            elapsedMs,
            estimatedRemainingMs: newItemsCount === 0 ? 0 : estimatedRemainingMs,
            message: `Halaman ${page} selesai: ${newItemsCount} item baru`,
          });

          if (newItemsCount === 0 || pageItems.length < 10) break;
        }

        // Normalisasi
        sseEvent(controller, encoder, {
          type: "saving",
          message: "Menyimpan ke database...",
          totalCollected: allRawItems.length,
        });

        const normalizedItems: NormalizedAsset[] = allRawItems
          .map((item: any): NormalizedAsset | null => {
            const rawId = item?.content_id || item?.id || item?.assetId || item?.asset_id || "";
            const assetId = String(rawId).trim();
            if (!assetId) return null;
            const downloads = parseInt(String(item?.nb_downloads ?? item?.downloads ?? 0), 10);
            const earnings = parseFloat(String(item?.earnings ?? item?.revenue ?? 0));
            const popularity = parseFloat(String(item?.order_key ?? item?.popularity ?? 0));
            return {
              assetId,
              title: String(item?.title || item?.name || "Untitled").trim(),
              thumbnail: item?.thumbnail_url || item?.content_thumb_large_url || item?.thumbnailUrl || "",
              previewUrl: item?.comp_file_path || item?.video_preview_url || item?.comp_url || "",
              assetUrl: normalizeAssetUrl(item),
              contributor: String(item?.author || item?.author_name || item?.contributor || "").trim(),
              contributorId: String(item?.creator_id || item?.author_id || item?.contributorId || "").trim(),
              category: normalizeCategory(item),
              fileType: normalizeFileType(item),
              keywords: normalizeKeywords(item),
              uploadedAt: normalizeDate(item?.creation_date || item?.upload_date || item?.created_at),
              downloads: isNaN(downloads) ? 0 : downloads,
              earnings: isNaN(earnings) ? 0 : earnings,
              popularity: isNaN(popularity) ? 0 : popularity,
            };
          })
          .filter((item): item is NormalizedAsset => item !== null);

        // Shuffle untuk variasi data
        const shuffledItems = shuffleArray(normalizedItems);

        // Ambil MAX sampai LIMIT items
        const itemsToInsert = shuffledItems.slice(0, LIMIT);

        // INSERT dengan skipDuplicates - DATABASE akan handle duplikat detection
        // Jauh lebih cepat dari pre-check query!
        let created = 0;
        const BATCH_SIZE = 100; // Can be larger karena tidak ada pre-check
        const countBefore = await prisma.asset.count({ where: { profileId: user.id } });
        
        if (itemsToInsert.length > 0) {
          for (let i = 0; i < itemsToInsert.length; i += BATCH_SIZE) {
            const batch = itemsToInsert.slice(i, i + BATCH_SIZE);
            
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

            // skipDuplicates don't return count, so we add batch length as estimate
            // Actual created count calculated after
            created += batch.length;
          }
        }

        const totalInDb = await prisma.asset.count({ where: { profileId: user.id } });
        const actualCreated = totalInDb - countBefore; // Actual new items created
        const duplicateSkipped = itemsToInsert.length - actualCreated; // Items skipped due to duplicate

        // Save sync log
        await prisma.syncLog.create({
          data: {
            profileId: user.id,
            status: "success",
            totalCollected: itemsToInsert.length,
            created: actualCreated,
            updated: 0, // Tidak ada update, hanya insert baru
            totalInDatabase: totalInDb,
          },
        });

        // Log activity
        const userProfile = await prisma.profile.findUnique({
          where: { id: user.id },
          select: { fullName: true, email: true },
        });

        await prisma.activityLog.create({
          data: {
            user: userProfile?.fullName || "Unknown",
            email: userProfile?.email || "unknown@email.com",
            action: "Manual Sync",
            detail: `API sync ${searchQuery ? `query "${searchQuery}"` : "semua jenis aset"} — ${actualCreated} asset baru ditambahkan, ${duplicateSkipped} diskip. Total di database: ${totalInDb}`,
            ipAddress: getClientIP(req),
          },
        }).catch(err => console.error("Failed to log sync activity:", err));

        sseEvent(controller, encoder, {
          type: "done",
          created: actualCreated,
          updated: 0,
          skipped: duplicateSkipped,
          totalInDatabase: totalInDb,
          message: `Sinkronisasi selesai! ${actualCreated} item baru ditambahkan.`,
        });

      } catch (error: any) {
        // Save error log
        await prisma.syncLog.create({
          data: {
            profileId: user.id,
            status: "failed",
            errorMessage: error?.message || "Internal server error",
          },
        }).catch(() => {}); // ignore if table doesn't exist yet

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