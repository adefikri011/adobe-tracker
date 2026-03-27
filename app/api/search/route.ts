import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) return NextResponse.json({ results: [] });

  try {
    // 1. Cek Cache 24 jam
    const cached = await prisma.searchCache.findFirst({
      where: {
        query: query.toLowerCase(),
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
    });

    if (cached) return NextResponse.json({
      results: cached.results,
      fromCache: true,
      cachedAt: cached.createdAt
    });

    // 2. Panggil Apify
    const apifyToken = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID;

    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          maxItems: 10,
          asset: "photo",
          region: "us",
          order: "downloads",
          proxy: { useApifyProxy: true }
        }),
      }
    );

    if (!runResponse.ok) {
      throw new Error(`Apify error: ${runResponse.status}`);
    }

    const apifyData = await runResponse.json();

    // 3. Format hasil
    const results = apifyData.map((item: any) => ({
      adobeId: item.content_id?.toString() || Math.random().toString().slice(2),
      title: item.title || `Asset ${query}`,
      creator: item.author || "Verified Contributor",
      thumbnail: item.thumbnail_url || item.content_thumb_large_url || "",
      type: item.asset_type || item.media_type_label || "Photo",
      category: item.category?.name || "General",
      downloads: item.order_key || 0, // pakai order_key sebagai proxy popularity
      trend: `+${Math.floor(Math.random() * 30)}%`,
      revenue: `$${((item.order_key || 0) * 0.33).toFixed(2)}`,
      uploadDate: item.creation_date ? new Date(item.creation_date).toLocaleDateString("id-ID") : "-",
      contentUrl: item.content_url || "",
      artistUrl: item.artist_page_url || "",
      status: "Premium",
    }));

    // 4. Hapus cache lama & simpan baru
    await prisma.searchCache.deleteMany({
      where: { query: query.toLowerCase() }
    });

    await prisma.searchCache.create({
      data: { query: query.toLowerCase(), results: results as any },
    });

    return NextResponse.json({ results, fromCache: false });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}