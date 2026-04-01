import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get top assets by downloads
    const topAssets = await prisma.asset.findMany({
      select: {
        id: true,
        title: true,
        downloads: true,
        fileType: true,
      },
      orderBy: {
        downloads: 'desc',
      },
      take: 5,
    });

    // Map fileType to type
    const assets = topAssets.map((asset) => {
      let type = 'Photo';
      if (asset.fileType?.toLowerCase().includes('vector')) type = 'Vector';
      else if (asset.fileType?.toLowerCase().includes('video') || asset.fileType?.toLowerCase().includes('mp4')) type = 'Video';

      return {
        id: asset.id,
        title: asset.title,
        downloads: asset.downloads,
        type,
      };
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error fetching top assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top assets' },
      { status: 500 }
    );
  }
}
