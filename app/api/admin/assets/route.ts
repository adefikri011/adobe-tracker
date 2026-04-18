// app/api/admin/assets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeFileType(fileType: string): string {
  if (!fileType) return "image";
  const normalized = fileType.toLowerCase();
  if (normalized.includes("photo") || normalized.includes("image")) return "image";
  if (normalized.includes("video")) return "video";
  if (normalized.includes("vector")) return "vector";
  if (normalized.includes("illustration")) return "illustration";
  if (normalized.includes("template")) return "template";
  if (normalized.includes("3d")) return "3d";
  return "image";
}

function getPerformanceScore(downloads: number): number {
  return Math.min(100, Math.round((downloads / 500) * 100));
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (adjust this check to match your user role system)
    const dbUser = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (dbUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params — same pattern as search route
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const contentType = searchParams.get("contentType")?.trim() || "all";
    const sortBy = searchParams.get("sortBy")?.trim() || "most-downloaded";
    const status = searchParams.get("status")?.trim() || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 20;

    // Build Prisma where clause
    const where: any = {};

    // Search filter — same logic as search route
    if (query) {
      const queryLower = query.toLowerCase();
      where.OR = [
        { title: { contains: queryLower, mode: "insensitive" } },
        { category: { contains: queryLower, mode: "insensitive" } },
        // keywords is a String[] array — use has for exact match in Prisma
        { keywords: { has: queryLower } },
      ];
    }

    // Status filter
    if (status !== "all") {
      where.isFree = status === "free";
    }

    // Content type filter — same normalizeFileType as search route
    if (contentType !== "all") {
      // Match partial fileType strings like "photo", "video", "vector" etc.
      where.fileType = { contains: contentType, mode: "insensitive" };
    }

    // Sort config
    type OrderByField = "downloads" | "uploadedAt" | "title";
    const orderByMap: Record<string, { field: OrderByField; dir: "asc" | "desc" }> = {
      "most-downloaded": { field: "downloads", dir: "desc" },
      newest:            { field: "uploadedAt", dir: "desc" },
      oldest:            { field: "uploadedAt", dir: "asc" },
      "undiscovered":    { field: "downloads",  dir: "asc" },
      relevance:         { field: "downloads",  dir: "desc" },
    };
    const { field: orderField, dir: orderDir } = orderByMap[sortBy] ?? orderByMap["most-downloaded"];

    // Fetch total count for pagination
    const total = await prisma.asset.count({ where });

    // Fetch paginated assets — same fields as search route
    const assets = await prisma.asset.findMany({
      where,
      orderBy: { [orderField]: orderDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Format — same shape as search route results
    const results = assets.map((a: any) => {
      const downloads = a.downloads ?? 0;
      const score = getPerformanceScore(downloads);
      const revenue = `$${(downloads * 0.33).toFixed(2)}`;

      return {
        id: a.id,
        adobeId: a.assetId,
        title: a.title,
        creator: a.contributor || a.contributorId || "Unknown",
        creatorName: a.contributor || "Unknown",
        creatorId: a.contributorId || "Unknown",
        category: a.category || "General",
        type: normalizeFileType(a.fileType || "image"),
        downloads,
        score,
        trend: `+${Math.floor(Math.random() * 30) + 1}%`,
        revenue,
        status: a.isFree ? "Free" : "Premium",
        thumbnail: a.thumbnail || "",
        uploadDate: a.uploadedAt
          ? new Date(a.uploadedAt).toLocaleDateString("id-ID")
          : "-",
        contentUrl: a.assetUrl || "",
        artistUrl: "",
        keywords: Array.isArray(a.keywords) ? a.keywords : [],
        fromDb: true,
      };
    });

    return NextResponse.json({
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("[AdminAssets Error]", error);
    return NextResponse.json(
      { results: [], error: error?.message || "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

// DELETE a single asset by id
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (dbUser?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Asset ID required" }, { status: 400 });

    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[AdminAssets DELETE Error]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete asset" },
      { status: 500 }
    );
  }
}