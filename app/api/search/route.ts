import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const CACHE_HOURS = 24;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSearchUrl(keyword: string): string {
  const params = new URLSearchParams({
    "filters[content_type:photo]": "1",
    "filters[content_type:illustration]": "1",
    "filters[content_type:zip_vector]": "1",
    "filters[content_type:video]": "1",
    "filters[content_type:template]": "1",
    "filters[content_type:3d]": "1",
    k: keyword,
    order: "nb_downloads",
  });
  return `https://stock.adobe.com/search?${params.toString()}`;
}

function normalizeFileType(item: any): string {
  // Pakai media_type_label dulu karena sudah tersedia dari Apify
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) return NextResponse.json({ results: [] });

  // Cek plan user (free = max 5 hasil, pro = semua)
  let isPro = false;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { plan: true },
      });
      isPro = profile?.plan === "pro";
    }
  } catch {
    // kalau gagal cek plan, anggap free
  }

  const FREE_LIMIT = 5;

  try {
    // 1. Cek cache dulu
    const cached = await prisma.searchCache.findFirst({
      where: {
        query: query.toLowerCase(),
        createdAt: {
          gte: new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000),
        },
      },
    });

    if (cached) {
      const allResults = cached.results as any[];
      return NextResponse.json({
        results: isPro ? allResults : allResults.slice(0, FREE_LIMIT),
        fromCache: true,
        cachedAt: cached.createdAt,
        isPro,
        total: allResults.length,
      });
    }

    // 2. Cache tidak ada → panggil Apify
    const token = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID || "cOsM6hOaAbSxqSG1E";

    if (!token) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN belum diset" },
        { status: 500 }
      );
    }

    const searchUrl = buildSearchUrl(query);
    console.log(`[Search] Keyword: "${query}" → URL: ${searchUrl}`);

    // Trigger actor
    const runRes = await fetch(
      `${APIFY_BASE_URL}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchUrl, maxItems: 50 }),
      }
    );

    if (!runRes.ok) {
      const err = await runRes.text();
      throw new Error(`Gagal trigger actor: ${err}`);
    }

    const runPayload = await runRes.json();
    const runId = runPayload?.data?.id;
    if (!runId) throw new Error("Run ID tidak ditemukan");

    console.log(`[Search] Run ID: ${runId}`);

    // 3. Polling
    const maxAttempts = 60;
    let datasetId: string | undefined;

    for (let i = 0; i < maxAttempts; i++) {
      const statusRes = await fetch(
        `${APIFY_BASE_URL}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      const statusPayload = await statusRes.json();
      const status = statusPayload?.data?.status;
      datasetId = statusPayload?.data?.defaultDatasetId;

      console.log(`[Search Polling] ${i + 1}/${maxAttempts} → ${status}`);

      if (status === "SUCCEEDED") break;
      if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
        throw new Error(`Run gagal: ${status}`);
      }
      await sleep(3000);
    }

    if (!datasetId) throw new Error("Dataset tidak ditemukan");

    // 4. Ambil dataset
    const dataRes = await fetch(
      `${APIFY_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}&clean=true&limit=50`,
      { cache: "no-store" }
    );
    const items = (await dataRes.json()) as any[];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ results: [], fromCache: false, total: 0 });
    }

    // 5. Format hasil — fix contentUrl & artistUrl
    const results = items.map((item: any) => {
      const contentId = String(item?.content_id || "").trim();

      // ✅ contentUrl: pakai content_url langsung (sudah full URL dari Apify)
      // fallback ke build dari content_id
      const contentUrl =
        item?.content_url
          ? item.content_url.startsWith("http")
            ? item.content_url
            : `https://stock.adobe.com${item.content_url}`
          : contentId
          ? `https://stock.adobe.com/id/${contentId}`
          : "";

      // ✅ artistUrl: artist_page_url dari Apify adalah relative path
      const artistUrl = item?.artist_page_url
        ? item.artist_page_url.startsWith("http")
          ? item.artist_page_url
          : `https://stock.adobe.com${item.artist_page_url}`
        : "";

      return {
        adobeId: contentId,
        title: item?.title || "Untitled",
        creator: item?.author || item?.author_name || "Unknown",
        thumbnail:
          item?.thumbnail_url || item?.content_thumb_large_url || "",
        type: normalizeFileType(item),
        // ✅ category: ambil langsung dari object .name
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
    });

    // 6. Hapus cache lama & simpan baru
    await prisma.searchCache.deleteMany({
      where: { query: query.toLowerCase() },
    });

    await prisma.searchCache.create({
      data: { query: query.toLowerCase(), results: results as any },
    });

    console.log(`[Search] Saved ${results.length} results for "${query}"`);

    return NextResponse.json({
      results: isPro ? results : results.slice(0, FREE_LIMIT),
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