import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contributorId = searchParams.get("id");

    if (!contributorId || contributorId.trim().length === 0) {
      return NextResponse.json(
        { error: "Contributor ID is required" },
        { status: 400 }
      );
    }

    // Fetch all assets from this contributor
    const assets = await prisma.asset.findMany({
      where: {
        contributorId: String(contributorId).trim(),
      },
      select: {
        assetId: true,
        title: true,
        thumbnail: true,
        downloads: true,
        category: true,
        fileType: true,
        uploadedAt: true,
      },
      orderBy: {
        downloads: "desc",
      },
      take: 100, // Limit untuk performance
    });

    if (assets.length === 0) {
      return NextResponse.json(
        {
          contributorId,
          assetCount: 0,
          totalDownloads: 0,
          assets: [],
        }
      );
    }

    // Calculate stats
    const totalDownloads = assets.reduce((sum, asset) => sum + asset.downloads, 0);

    // Format response
    const formattedAssets = assets.map((asset) => ({
      adobeId: asset.assetId,
      title: asset.title,
      thumbnail: asset.thumbnail,
      downloads: asset.downloads,
      category: asset.category,
      type: asset.fileType || "Photo",
      uploadDate: asset.uploadedAt?.toLocaleDateString("id-ID") || "-",
    }));

    return NextResponse.json({
      contributorId,
      assetCount: assets.length,
      totalDownloads,
      assets: formattedAssets,
    });
  } catch (error) {
    console.error("[Contributors API Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch contributor assets" },
      { status: 500 }
    );
  }
}
