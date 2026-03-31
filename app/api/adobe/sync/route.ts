import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

const APIFY_BASE_URL = "https://api.apify.com/v2";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSearchUrl(contributorUrl: string): string {
  if (contributorUrl.includes("/search")) return contributorUrl;
  const match = contributorUrl.match(/\/contributor\/(\d+)/);
  if (!match) throw new Error(`URL contributor tidak valid: ${contributorUrl}`);
  const creatorId = match[1];
  const params = new URLSearchParams({
    "filters[content_type:photo]": "1",
    "filters[content_type:illustration]": "1",
    "filters[content_type:zip_vector]": "1",
    "filters[content_type:video]": "1",
    "filters[content_type:template]": "1",
    "filters[content_type:3d]": "1",
    k: "",
    "filters[creator_id]": creatorId,
    order: "nb_downloads",
  });
  return `https://stock.adobe.com/search?${params.toString()}`;
}

// ✅ Normalize fileType dari berbagai field Apify
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

// ✅ Normalize date safely
function normalizeDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ✅ Normalize keywords — Apify actor ini tidak return keywords, jadi default []
function normalizeKeywords(item: any): string[] {
  const raw = item?.keywords || item?.tags || item?.keyword_list || [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

// ✅ Normalize category — bisa null, array kosong, array of object, atau object langsung
function normalizeCategory(item: any): string | null {
  const cat = item?.category ?? item?.category_hierarchy ?? item?.content_category ?? null;
  if (!cat) return null;
  if (typeof cat === "string") return cat.trim() || null;
  if (Array.isArray(cat)) {
    const first = cat[0];
    if (!first) return null;
    if (typeof first === "string") return first.trim() || null;
    if (typeof first === "object") return String(first?.name || first?.label || "").trim() || null;
    return null;
  }
  if (typeof cat === "object") return String(cat?.name || cat?.label || "").trim() || null;
  return null;
}

// ✅ Normalize assetUrl dari field yang tersedia di Apify
function normalizeAssetUrl(item: any): string {
  const path = item?.content_url || item?.content_path || item?.detailsUrl || item?.url || "";
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `https://stock.adobe.com${path}`;
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID || "cOsM6hOaAbSxqSG1E";
    const contributorUrl = process.env.ADOBE_CONTRIBUTOR_URL;

    if (!token) return NextResponse.json({ error: "APIFY_API_TOKEN belum diset" }, { status: 500 });
    if (!contributorUrl) return NextResponse.json({ error: "ADOBE_CONTRIBUTOR_URL belum diset" }, { status: 500 });

    let searchUrl: string;
    try {
      searchUrl = buildSearchUrl(contributorUrl);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    console.log(`[Apify] Search URL: ${searchUrl}`);

    // 1. Trigger Actor
    const runResponse = await fetch(
      `${APIFY_BASE_URL}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchUrl, maxItems: 3000 }),
      }
    );

    if (!runResponse.ok) {
      const err = await runResponse.text();
      return NextResponse.json({ error: `Gagal trigger actor: ${err}` }, { status: 500 });
    }

    const runPayload = await runResponse.json();
    const runId: string | undefined = runPayload?.data?.id;
    if (!runId) return NextResponse.json({ error: "Run ID tidak ditemukan" }, { status: 500 });

    console.log(`[Apify] Run ID: ${runId}`);

    // 2. Polling max 90x * 3s = 4.5 menit
    const maxAttempts = 90;
    let defaultDatasetId: string | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusRes = await fetch(
        `${APIFY_BASE_URL}/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`,
        { method: "GET", cache: "no-store" }
      );

      if (!statusRes.ok) {
        const err = await statusRes.text();
        return NextResponse.json({ error: `Gagal cek status: ${err}` }, { status: 500 });
      }

      const statusPayload = await statusRes.json();
      const status = statusPayload?.data?.status;
      defaultDatasetId = statusPayload?.data?.defaultDatasetId;

      console.log(`[Polling] Attempt ${attempt + 1}/${maxAttempts} → ${status}`);

      if (status === "SUCCEEDED") break;
      if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
        return NextResponse.json({ error: `Run gagal: ${status}` }, { status: 500 });
      }

      await sleep(3000);
    }

    if (!defaultDatasetId) {
      return NextResponse.json({ error: "Dataset tidak ditemukan setelah polling" }, { status: 500 });
    }

    // 3. Ambil dataset
    const datasetRes = await fetch(
      `${APIFY_BASE_URL}/datasets/${encodeURIComponent(defaultDatasetId)}/items?token=${encodeURIComponent(token)}&clean=true&limit=3000&offset=0`,
      { method: "GET", cache: "no-store" }
    );

    if (!datasetRes.ok) {
      const err = await datasetRes.text();
      return NextResponse.json({ error: `Gagal ambil dataset: ${err}` }, { status: 500 });
    }

    const items = (await datasetRes.json()) as any[];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No assets found" });
    }

    console.log(`[Dataset] Total items: ${items.length}`);

    // 4. Normalisasi dengan semua field dari sample data Apify
    const normalizedItems = items.map((item: any) => {
      const title = String(item?.title || item?.name || "Untitled").trim();

      // ✅ Pakai content_id sebagai assetId — konsisten & tidak berubah tiap run
      const rawId = item?.content_id || item?.id || item?.assetId || item?.asset_id || "";
      const assetId = String(rawId).trim() || `adobe_fallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const downloads = parseInt(String(item?.nb_downloads ?? item?.downloads ?? 0), 10);
      const earnings = parseFloat(String(item?.earnings ?? item?.revenue ?? 0));
      const popularity = parseFloat(String(item?.order_key ?? item?.popularity ?? 0));

      return {
        assetId,
        title,
        thumbnail: item?.thumbnail_url || item?.content_thumb_large_url || item?.thumbnailUrl || "",
        previewUrl: item?.comp_file_path || item?.video_preview_url || item?.comp_url || "",
        assetUrl: normalizeAssetUrl(item),
        // ✅ field author ada di Apify sebagai "author" bukan "author_name"
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
    }).filter((item) => Boolean(item.assetId));

    console.log(`[Normalization] Valid: ${normalizedItems.length} / ${items.length}`);

    if (normalizedItems.length === 0) {
      return NextResponse.json({ success: true, count: 0, skipped: items.length, message: "No valid assets" });
    }

    // 5. Simpan ke DB batch per 100
    const BATCH_SIZE = 100;
    let saved = 0;

    for (let i = 0; i < normalizedItems.length; i += BATCH_SIZE) {
      const batch = normalizedItems.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map((item) =>
          prisma.asset.upsert({
            where: { assetId: item.assetId },
            update: {
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
            },
            create: {
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
            },
          })
        )
      );

      saved += batch.length;
      console.log(`[DB] Batch ${Math.ceil((i + 1) / BATCH_SIZE)} saved: ${saved}/${normalizedItems.length}`);
    }

    const totalInDb = await prisma.asset.count({ where: { profileId: user.id } });

    console.log(`[Sync Complete] Total di DB: ${totalInDb}`);

    return NextResponse.json({
      success: true,
      count: normalizedItems.length,
      skipped: items.length - normalizedItems.length,
      totalInDatabase: totalInDb,
    });

  } catch (error: any) {
    console.error("[Sync Error]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}