import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

const MOCK_ASSETS = [
  { adobeId: "1001", title: "Beautiful Sunset Nature", creator: "PhotoPro", category: "Nature", type: "Photo", downloads: 1842, trend: "+12%", revenue: "$184.20", status: "Premium" },
  { adobeId: "1002", title: "Business Team Meeting", creator: "StockMaster", category: "Business", type: "Photo", downloads: 1523, trend: "+8%", revenue: "$152.30", status: "Premium" },
  { adobeId: "1003", title: "Abstract Wave Pattern", creator: "VectorArt", category: "Abstract", type: "Vector", downloads: 1204, trend: "+23%", revenue: "$120.40", status: "Premium" },
  { adobeId: "1004", title: "Mountain Landscape 4K", creator: "NatureShots", category: "Nature", type: "Video", downloads: 987, trend: "+5%", revenue: "$296.10", status: "Premium" },
  { adobeId: "1005", title: "Coffee Shop Aesthetic", creator: "LifestylePics", category: "Lifestyle", type: "Photo", downloads: 876, trend: "+15%", revenue: "$87.60", status: "Premium" },
  { adobeId: "1006", title: "Tech UI Kit Modern", creator: "DesignHub", category: "Technology", type: "Vector", downloads: 743, trend: "+31%", revenue: "$74.30", status: "Premium" },
  { adobeId: "1007", title: "Floral Watercolor Set", creator: "ArtByLuna", category: "Art", type: "Vector", downloads: 698, trend: "+9%", revenue: "$69.80", status: "Premium" },
  { adobeId: "1008", title: "City Night Skyline", creator: "UrbanLens", category: "Urban", type: "Photo", downloads: 612, trend: "+4%", revenue: "$61.20", status: "Premium" },
  { adobeId: "1009", title: "Minimal Logo Template", creator: "BrandStudio", category: "Business", type: "Vector", downloads: 589, trend: "+18%", revenue: "$58.90", status: "Premium" },
  { adobeId: "1010", title: "Ocean Waves Drone", creator: "SkyViewMedia", category: "Nature", type: "Video", downloads: 534, trend: "+7%", revenue: "$160.20", status: "Premium" },
  { adobeId: "1011", title: "Autumn Forest Path", creator: "NatureShots", category: "Nature", type: "Photo", downloads: 498, trend: "+11%", revenue: "$49.80", status: "Premium" },
  { adobeId: "1012", title: "Corporate Presentation", creator: "StockMaster", category: "Business", type: "Vector", downloads: 467, trend: "+6%", revenue: "$46.70", status: "Premium" },
  { adobeId: "1013", title: "Neon Cyberpunk City", creator: "UrbanLens", category: "Urban", type: "Photo", downloads: 445, trend: "+28%", revenue: "$44.50", status: "Premium" },
  { adobeId: "1014", title: "Yoga Wellness Lifestyle", creator: "LifestylePics", category: "Lifestyle", type: "Photo", downloads: 423, trend: "+14%", revenue: "$42.30", status: "Premium" },
  { adobeId: "1015", title: "Geometric Pattern Pack", creator: "VectorArt", category: "Abstract", type: "Vector", downloads: 401, trend: "+19%", revenue: "$40.10", status: "Premium" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase().trim() || "";

  if (!query) {
    return NextResponse.json({ results: [], fromCache: false });
  }

  try {
    // Cek cache dulu
    const cached = await prisma.searchCache.findFirst({
      where: { query },
      orderBy: { createdAt: "desc" },
    });

    if (cached) {
      return NextResponse.json({
        results: cached.results,
        fromCache: true,
        cachedAt: cached.createdAt,
      });
    }

    // Filter berdasarkan query
    const filtered = MOCK_ASSETS.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        a.type.toLowerCase().includes(query) ||
        a.creator.toLowerCase().includes(query)
    );

    // ✅ KEY FIX: kalau hasil filter < 8, tambahkan sisa asset
    // supaya selalu ada cukup data untuk demo blur lock
    let results = filtered;
    if (filtered.length < 8) {
      const filteredIds = new Set(filtered.map((a) => a.adobeId));
      const extras = MOCK_ASSETS
        .filter((a) => !filteredIds.has(a.adobeId))
        .slice(0, 8 - filtered.length);
      results = [...filtered, ...extras];
    }

    // Simpan ke cache
    await prisma.searchCache.create({
      data: { query, results: results as any },
    });

    // Upsert assets ke database
    for (const asset of results) {
      await prisma.asset.upsert({
        where: { adobeId: asset.adobeId },
        update: { downloads: asset.downloads },
        create: asset,
      });
    }

    return NextResponse.json({ results, fromCache: false });

  } catch (error) {
    console.error("Search error:", error);
    // Fallback kalau DB error
    return NextResponse.json({ results: MOCK_ASSETS.slice(0, 10), fromCache: false });
  }
}