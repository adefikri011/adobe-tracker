import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'daily'; // 'daily' or 'monthly'

    const now = new Date();
    let startDate: Date;
    let groupBy: 'day' | 'month';

    if (mode === 'daily') {
      // Last 7 days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupBy = 'day';
    } else {
      // Last 12 months
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      groupBy = 'month';
    }

    // Fetch assets with upload dates
    const assets = await prisma.asset.findMany({
      where: {
        uploadedAt: {
          gte: startDate,
        },
      },
      select: {
        uploadedAt: true,
        downloads: true,
      },
    });

    // Group by day or month
    const groupedData = new Map<string, number>();

    if (groupBy === 'day') {
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = date.toLocaleDateString('en-US', { weekday: 'short' });
        groupedData.set(key, 0);
      }

      // Add downloads
      assets.forEach((asset) => {
        if (asset.uploadedAt) {
          const key = asset.uploadedAt.toLocaleDateString('en-US', { weekday: 'short' });
          const current = groupedData.get(key) || 0;
          groupedData.set(key, current + asset.downloads);
        }
      });
    } else {
      // Initialize last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('en-US', { month: 'short' });
        groupedData.set(key, 0);
      }

      // Add downloads
      assets.forEach((asset) => {
        if (asset.uploadedAt) {
          const key = asset.uploadedAt.toLocaleDateString('en-US', { month: 'short' });
          const current = groupedData.get(key) || 0;
          groupedData.set(key, current + asset.downloads);
        }
      });
    }

    const data = Array.from(groupedData.entries()).map(([label, downloads]) => ({
      label,
      downloads,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
