import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  searchAssetsRapidAPI,
  getTrendingAssets,
  getTopAssetsByCategory,
  getPopularKeywords,
} from "../../../lib/rapidapi-client";

/**
 * GET /api/market-insights/search
 * Search market assets and cache results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "trending"; // trending, category, keywords
    const category = searchParams.get("category") || "nature";
    const query = searchParams.get("query") || type;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    // Check cache first
    const cacheKey = `${type}-${category}-${limit}`;
    const now = new Date();

    const cached = await prisma.marketInsight.findUnique({
      where: { query: cacheKey },
    });

    // Return cached if not expired
    if (cached && cached.expiresAt > now) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        source: "cache",
        cachedAt: cached.lastSyncedAt,
        expiresAt: cached.expiresAt,
      });
    }

    let results;
    let data;

    // Fetch fresh data based on type
    switch (type) {
      case "trending":
        results = await getTrendingAssets(limit);
        data = {
          type: "trending",
          assets: results,
          totalCount: results.length,
          timestamp: now.toISOString(),
        };
        break;

      case "category":
        results = await getTopAssetsByCategory(category, limit);
        data = {
          type: "category",
          category,
          assets: results,
          totalCount: results.length,
          timestamp: now.toISOString(),
        };
        break;

      case "keywords":
        const keywords = await getPopularKeywords();
        data = {
          type: "keywords",
          keywords,
          totalCount: Object.keys(keywords).length,
          timestamp: now.toISOString(),
        };
        break;

      default:
        results = await searchAssetsRapidAPI(query, { limit });
        data = {
          type: "search",
          query,
          assets: results?.results || [],
          totalCount: results?.totalFound || 0,
          timestamp: now.toISOString(),
        };
    }

    // Save/update cache (24 hour TTL)
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await prisma.marketInsight.upsert({
      where: { query: cacheKey },
      create: {
        query: cacheKey,
        data: data as any,
        sourceType: "rapidapi",
        lastSyncedAt: now,
        expiresAt,
      },
      update: {
        data: data as any,
        lastSyncedAt: now,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      data,
      source: "fresh",
      cachedAt: now,
      expiresAt,
    });
  } catch (error) {
    console.error("Market insights error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch market insights",
      },
      { status: 500 }
    );
  }
}
