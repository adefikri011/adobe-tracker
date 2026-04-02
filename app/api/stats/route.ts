import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Ambil semua cache entries
    const allCaches = await prisma.searchCache.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    if (allCaches.length === 0) {
      return NextResponse.json({
        totalAssets: 0,
        avgDownloadsDay: 0,
        topCategory: "—",
        trendingQuery: "—",
        trendingGrowth: "—",
      });
    }

    // Flatten semua results dari semua cache entries
    const allResults: any[] = allCaches.flatMap((c) =>
      Array.isArray(c.results) ? (c.results as any[]) : []
    );

    // 1. Total Assets Indexed
    const totalAssets = allResults.length;

    // 2. Avg Downloads/Day — rata-rata downloads semua asset
    const totalDownloads = allResults.reduce(
      (sum, r) => sum + (Number(r.downloads) || 0),
      0
    );
    const avgDownloadsDay =
      allResults.length > 0 ? Math.round(totalDownloads / allResults.length) : 0;

    // 3. Top Category — kategori paling banyak muncul di semua hasil
    const categoryCount: Record<string, number> = {};
    for (const r of allResults) {
      const cat = r.category || "General";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
    const topCategory =
      Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // 4. Trending Now — query yang paling sering dicari
    const queryCount: Record<string, number> = {};
    for (const c of allCaches) {
      queryCount[c.query] = (queryCount[c.query] || 0) + 1;
    }
    const trendingQuery =
      Object.entries(queryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // Hitung growth: avg downloads query trending vs global avg
    const trendingResults = allCaches
      .filter((c) => c.query === trendingQuery)
      .flatMap((c) => (Array.isArray(c.results) ? (c.results as any[]) : []));

    const trendingDownloads = trendingResults.reduce(
      (sum, r) => sum + (Number(r.downloads) || 0),
      0
    );
    const trendingAvg =
      trendingResults.length > 0
        ? Math.round(trendingDownloads / trendingResults.length)
        : 0;
    const growthPct =
      avgDownloadsDay > 0
        ? Math.round(((trendingAvg - avgDownloadsDay) / avgDownloadsDay) * 100)
        : 0;
    const trendingGrowth = growthPct >= 0 ? `+${growthPct}%` : `${growthPct}%`;

    return NextResponse.json({
      totalAssets,
      avgDownloadsDay,
      topCategory,
      trendingQuery,
      trendingGrowth,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      {
        totalAssets: 0,
        avgDownloadsDay: 0,
        topCategory: "—",
        trendingQuery: "—",
        trendingGrowth: "—",
      },
      { status: 500 }
    );
  }
}