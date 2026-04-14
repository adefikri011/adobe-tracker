import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable caching for real-time data

export async function GET() {
  try {
    // Get all searches from all users (last 90 days for relevancy)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const allSearches = await prisma.recentSearch.findMany({
      where: {
        createdAt: {
          gte: ninetyDaysAgo,
        },
      },
      select: {
        query: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group searches by query and count
    const searchStats: Record<string, { count: number; lastSearched: Date }> = {};

    allSearches.forEach((search) => {
      const normalizedQuery = search.query.toLowerCase().trim();
      if (!searchStats[normalizedQuery]) {
        searchStats[normalizedQuery] = {
          count: 0,
          lastSearched: search.createdAt,
        };
      }
      searchStats[normalizedQuery].count++;
      if (search.createdAt > searchStats[normalizedQuery].lastSearched) {
        searchStats[normalizedQuery].lastSearched = search.createdAt;
      }
    });

    // Sort by count (descending) and get top 12
    const topSearches = Object.entries(searchStats)
      .sort((a, b) => {
        // Primary: sort by count
        if (b[1].count !== a[1].count) {
          return b[1].count - a[1].count;
        }
        // Secondary: sort by recency
        return (
          b[1].lastSearched.getTime() - a[1].lastSearched.getTime()
        );
      })
      .slice(0, 12)
      .map(([query, stats]) => ({
        term: query,
        count: stats.count,
        hot: stats.count >= 5, // Mark as "hot" if searched 5+ times
      }));

    // If not enough data, add default popular searches
    if (topSearches.length < 12) {
      const defaultSearches = [
        { term: "artificial intelligence", icon: "🤖", count: 0, hot: false },
        { term: "nature", icon: "🌿", count: 0, hot: false },
        { term: "business", icon: "💼", count: 0, hot: false },
        { term: "cybersecurity", icon: "🔐", count: 0, hot: false },
        { term: "lifestyle", icon: "📸", count: 0, hot: false },
        { term: "health", icon: "🏥", count: 0, hot: false },
        { term: "travel", icon: "✈️", count: 0, hot: false },
        { term: "finance", icon: "💰", count: 0, hot: false },
        { term: "education", icon: "🎓", count: 0, hot: false },
        { term: "food", icon: "🍽️", count: 0, hot: false },
        { term: "urban", icon: "🌆", count: 0, hot: false },
        { term: "people", icon: "👥", count: 0, hot: false },
      ];

      const existingTerms = new Set(topSearches.map((s) => s.term));
      for (const search of defaultSearches) {
        if (
          !existingTerms.has(search.term) &&
          topSearches.length < 12
        ) {
          topSearches.push({
            term: search.term,
            count: 0,
            hot: false,
          });
        }
      }
    }

    return NextResponse.json({
      searches: topSearches.slice(0, 12),
      totalSearches: allSearches.length,
    });
  } catch (error) {
    console.error("[Trending Searches API Error]", error);
    
    // Return default searches if error
    return NextResponse.json({
      searches: [
        { term: "artificial intelligence", count: 0, hot: true },
        { term: "nature", count: 0, hot: false },
        { term: "business", count: 0, hot: false },
        { term: "cybersecurity", count: 0, hot: true },
        { term: "lifestyle", count: 0, hot: false },
        { term: "health", count: 0, hot: false },
        { term: "travel", count: 0, hot: false },
        { term: "finance", count: 0, hot: false },
        { term: "education", count: 0, hot: false },
        { term: "food", count: 0, hot: false },
        { term: "urban", count: 0, hot: false },
        { term: "people", count: 0, hot: false },
      ],
      totalSearches: 0,
    });
  }
}
