import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let userId: string | undefined;

    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (authError) {
      console.warn("Supabase auth failed:", authError);
    }

    if (!userId) {
      return NextResponse.json({
        monthlyData: [],
        totalRevenue: 0,
        assetsSold: 0,
        avgCommission: 0,
        recentAssets: [],
      });
    }

    // Get all user assets
    const userAssets = await prisma.asset.findMany({
      where: { profileId: userId },
      select: {
        id: true,
        title: true,
        downloads: true,
        earnings: true,
        uploadedAt: true,
        createdAt: true,
        thumbnail: true,
      },
      orderBy: { downloads: "desc" },
    });

    // Get user transactions
    const userTransactions = await prisma.transaction.findMany({
      where: { profileId: userId, status: "success" },
      select: {
        amount: true,
        paidAt: true,
      },
    });

    // Get user subscriptions for commission calculation
    const userSubscriptions = await prisma.subscription.findMany({
      where: { profileId: userId },
      include: { plan: true },
    });

    // Calculate total asset earnings
    const assetEarnings = userAssets.reduce((sum, asset) => sum + asset.earnings, 0);

    // Calculate total transaction earnings
    const transactionEarnings = userTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Total revenue
    const totalRevenue = assetEarnings + transactionEarnings;

    // Total downloads = assets sold
    const assetsSold = userAssets.reduce((sum, asset) => sum + asset.downloads, 0);

    // Calculate average commission from plans
    const avgCommission = userSubscriptions.length > 0
      ? userSubscriptions.reduce((sum, sub) => sum + (30), 0) / userSubscriptions.length // Default 30% per plan
      : 33; // Default fallback

    // Generate monthly data for the last 7 months
    const monthlyData = generateMonthlyData(userAssets);

    // Get recent assets (top 4)
    const recentAssets = userAssets.slice(0, 4).map((asset) => ({
      id: asset.id,
      name: asset.title,
      date: asset.uploadedAt ? new Date(asset.uploadedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }) : new Date(asset.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      downloads: asset.downloads,
      earnings: asset.earnings,
      thumbnail: asset.thumbnail || "",
    }));

    return NextResponse.json({
      monthlyData,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      assetsSold,
      avgCommission: Math.round(avgCommission),
      recentAssets,
      metadata: {
        totalAssets: userAssets.length,
        totalTransactions: userTransactions.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching reports stats:", error);
    return NextResponse.json(
      {
        monthlyData: [],
        totalRevenue: 0,
        assetsSold: 0,
        avgCommission: 0,
        recentAssets: [],
        error: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 200 }
    );
  }
}

function generateMonthlyData(
  assets: Array<{ downloads: number; uploadedAt: Date | null; createdAt: Date }>
) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const months: { [key: string]: number } = {};

  // Initialize last 7 months
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${monthNames[d.getMonth()]}`;
    months[monthKey] = 0;
  }

  // Aggregate downloads by month
  assets.forEach((asset) => {
    const date = asset.uploadedAt ? new Date(asset.uploadedAt) : new Date(asset.createdAt);
    const monthKey = monthNames[date.getMonth()];

    // Only count if within last 7 months
    const assetMonthDiff = (today.getFullYear() - date.getFullYear()) * 12 + (today.getMonth() - date.getMonth());
    if (assetMonthDiff <= 6) {
      months[monthKey] += asset.downloads;
    }
  });

  return Object.entries(months).map(([name, downloads]) => ({
    name,
    revenue: downloads,
  }));
}
