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
        totalAssets: 0,
        estimatedCost: 0,
        costPerRun: 0.01,
        apifyUsage: { current: 0, limit: 5.0 },
      });
    }

    // Get total assets count for user
    const totalAssets = await prisma.asset.count({
      where: { profileId: userId },
    });

    // Get latest sync log to get actual cost from last sync
    const latestSync = await prisma.syncLog.findFirst({
      where: { profileId: userId },
      orderBy: { completedAt: "desc" },
    });

    // Fetch real Apify usage data
    let apifyUsage = { current: 0, limit: 5.0 };
    let estimatedCost = 0.01; // Default per-run cost

    const apifyToken = process.env.APIFY_API_TOKEN;
    if (apifyToken) {
      try {
        const userRes = await fetch("https://api.apify.com/v2/users/me", {
          headers: {
            Authorization: `Bearer ${apifyToken}`,
          },
          cache: "no-store",
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          const usage = userData?.data?.usage;

          if (usage) {
            apifyUsage = {
              current: parseFloat(usage.resolved || "0"),
              limit: parseFloat(usage.monthlyBudgetUsd || "5.0"),
            };
            // Use real usage as cost
            estimatedCost = apifyUsage.current;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch Apify usage:", error);
        // Fallback: use per-run cost
        estimatedCost = 0.01;
      }
    }

    return NextResponse.json({
      totalAssets,
      estimatedCost, // Real Apify usage
      costPerRun: 0.01,
      apifyUsage,
      lastSyncData: latestSync
        ? {
            created: latestSync.created,
            updated: latestSync.updated,
            totalCollected: latestSync.totalCollected,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error fetching admin api stats:", error);
    return NextResponse.json(
      {
        totalAssets: 0,
        estimatedCost: 0,
        costPerRun: 0.01,
        apifyUsage: { current: 0, limit: 5.0 },
      },
      { status: 200 }
    );
  }
}
