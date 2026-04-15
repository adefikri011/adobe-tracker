import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const searchParam = req.nextUrl.searchParams.get("search");

    if (!searchParam || searchParam.trim() === "") {
      return NextResponse.json(
        { error: "Search parameter required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If not authenticated, allow search but don't track usage (public search)
    let userId: string | null = null;
    let currentUsage = 0;
    let dailyLimit = 999; // unlimited for public/free users

    if (user) {
      userId = user.id;

      // Get user's profile and subscription
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: { status: "active" },
            include: { plan: true },
            orderBy: { startDate: "desc" },
            take: 1,
          },
        },
      });

      if (profile) {
        // Get active plan's contributor search limit
        if (profile.subscriptions.length > 0) {
          const activePlan = profile.subscriptions[0].plan;
          dailyLimit = activePlan.contributorSearchLimit;
        } else {
          // Free user
          dailyLimit = 5; // default free limit
        }

        // Get today's usage
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayUsage = await prisma.contributorSearchUsage.findUnique({
          where: {
            profileId_date: {
              profileId: userId,
              date: today,
            },
          },
        });

        currentUsage = todayUsage?.count || 0;

        // Check if limit exceeded
        if (currentUsage >= dailyLimit) {
          const resetTime = new Date(today);
          resetTime.setDate(resetTime.getDate() + 1);
          return NextResponse.json(
            {
              error: "Daily contributor search limit exceeded",
              message: `You have reached your daily limit of ${dailyLimit} searches. Your limit will reset tomorrow at ${resetTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
              limitExceeded: true,
              dailyLimit,
              currentUsage,
              resetTime: resetTime.toISOString(),
            },
            { status: 429 }
          );
        }
      }
    }

    const searchLower = searchParam.toLowerCase();

    // Find all assets dari contributor ini (by ID atau name)
    const assets = await prisma.asset.findMany({
      where: {
        OR: [
          {
            contributorId: {
              equals: searchParam, // Exact ID match
              mode: "insensitive",
            },
          },
          {
            contributor: {
              contains: searchLower, // Partial name match
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: { downloads: "desc" },
    });

    if (assets.length === 0) {
      return NextResponse.json(
        { error: "Contributor not found" },
        { status: 404 }
      );
    }

    // Get unique contributor info from first asset (semua dari contributor sama)
    const firstAsset = assets[0];
    const contributorName = firstAsset.contributor || "Unknown";
    const contributorId = firstAsset.contributorId || "Unknown";

    // Calculate aggregate data
    const totalAssets = assets.length;
    const totalDownloads = assets.reduce((sum: number, a: any) => sum + a.downloads, 0);
    const avgRating = 4.8; // Static untuk sekarang, bisa dinambah field di Schema later
    const joinDate = assets
      .sort(
        (a: any, b: any) =>
          (a.uploadedAt?.getTime() || 0) - (b.uploadedAt?.getTime() || 0)
      )[0]?.uploadedAt?.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    }) || "Unknown";

    // Get top category
    const categoryCount: Record<string, number> = {};
    assets.forEach((a: any) => {
      const category = a.category || "General";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount).sort(
      (a: [string, number], b: [string, number]) => b[1] - a[1]
    )[0]?.[0] || "General";

    // Calculate weekly growth (ngambil dari trending/recent)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentAssets = assets.filter(
      (a: any) => (a.uploadedAt?.getTime() || 0) > oneWeekAgo.getTime()
    );
    const weeklyGrowth =
      recentAssets.length > 0
        ? `+${Math.round((recentAssets.length / totalAssets) * 100)}%`
        : "+0%";

    // Format assets untuk response
    const formattedAssets = assets.slice(0, 20).map((a: any) => ({
      id: a.assetId,
      title: a.title,
      category: a.category || "General",
      type: a.fileType || "Photo",
      downloads: a.downloads,
      views: Math.floor(a.downloads * 3.5), // Estimate views
      thumbnail: a.thumbnail,
      uploadDate: a.uploadedAt?.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) || "Unknown",
      trending: a.downloads > 200,
    }));

    // Track usage for authenticated users
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      try {
        await prisma.contributorSearchUsage.upsert({
          where: {
            profileId_date: {
              profileId: userId,
              date: today,
            },
          },
          update: {
            count: {
              increment: 1,
            },
          },
          create: {
            profileId: userId,
            date: today,
            count: 1,
          },
        });
      } catch (error) {
        console.error("[Failed to track contributor search usage]", error);
        // Don't fail the search if tracking fails
      }
    }

    return NextResponse.json({
      contributor: {
        id: contributorId,
        name: contributorName,
        totalAssets,
        totalDownloads,
        rating: avgRating,
        joinDate,
        topCategory,
        weeklyGrowth,
      },
      assets: formattedAssets,
      ...(userId && {
        usage: {
          dailyLimit,
          currentUsage: currentUsage + 1,
          remaining: dailyLimit - (currentUsage + 1),
        },
      }),
    });
  } catch (error) {
    console.error("[Contributor Search Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
