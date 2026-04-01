import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get top keywords by sum of downloads
    const topKeywords = await prisma.asset.findMany({
      select: {
        keywords: true,
        downloads: true,
      },
      where: {
        keywords: {
          hasSome: [], // at least has keywords
        },
      },
    });

    // Aggregate keywords
    const keywordMap = new Map<string, number>();

    topKeywords.forEach((asset) => {
      asset.keywords?.forEach((keyword) => {
        const current = keywordMap.get(keyword) || 0;
        keywordMap.set(keyword, current + asset.downloads);
      });
    });

    // Convert to array and sort
    const aggregated = Array.from(keywordMap.entries())
      .map(([keyword, downloads]) => ({
        keyword,
        downloads,
      }))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 6) // Top 6
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

    return NextResponse.json({ keywords: aggregated });
  } catch (error) {
    console.error('Error fetching top keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top keywords' },
      { status: 500 }
    );
  }
}
