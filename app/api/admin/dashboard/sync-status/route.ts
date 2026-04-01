import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let userId: string | undefined;

    // Try to get user from Supabase
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (authError) {
      console.warn("Supabase auth failed, proceeding without userId check:", authError);
      // If Supabase fails, we'll try to get the latest sync for any profile
    }

    if (!userId) {
      // Return generic sync status if no user
      return NextResponse.json({
        lastSync: null,
        nextSync: null,
        totalSynced: 0,
        errors: 0,
        connected: true,
      });
    }

    // Get latest sync log
    const latestSync = await prisma.syncLog.findFirst({
      where: { profileId: userId },
      orderBy: { completedAt: "desc" },
    });

    // Count total assets
    const totalAssets = await prisma.asset.count({
      where: { profileId: userId },
    });

    if (!latestSync) {
      return NextResponse.json({
        lastSync: null,
        nextSync: null,
        totalSynced: totalAssets,
        errors: 0,
        connected: true,
      });
    }

    // Format times for display
    const now = new Date();
    const lastSyncTime = new Date(latestSync.completedAt);
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    let lastSyncLabel = "Just now";
    if (diffMins > 0 && diffMins < 60) {
      lastSyncLabel = `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0 && diffHours < 24) {
      lastSyncLabel = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffMins > 1440) {
      const days = Math.round(diffMins / 1440);
      lastSyncLabel = `${days} day${days > 1 ? "s" : ""} ago`;
    }

    // Estimate next sync (e.g., every 1 hour)
    const nextSyncTime = new Date(lastSyncTime.getTime() + 60 * 60 * 1000);
    const nextDiffMs = nextSyncTime.getTime() - now.getTime();
    const nextDiffMins = Math.round(nextDiffMs / (1000 * 60));
    const nextDiffHours = Math.round(nextDiffMs / (1000 * 60 * 60));

    let nextSyncLabel = "Just now";
    if (nextDiffMins > 0 && nextDiffMins < 60) {
      nextSyncLabel = `${nextDiffMins} minute${nextDiffMins > 1 ? "s" : ""} later`;
    } else if (nextDiffHours > 0) {
      nextSyncLabel = `${nextDiffHours} hour${nextDiffHours > 1 ? "s" : ""} later`;
    }

    return NextResponse.json({
      lastSync: lastSyncLabel,
      nextSync: nextSyncLabel,
      totalSynced: totalAssets,
      errors: latestSync.status === "failed" ? 1 : 0,
      connected: true,
      metadata: {
        created: latestSync.created,
        updated: latestSync.updated,
        totalCollected: latestSync.totalCollected,
        completedAt: latestSync.completedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching sync status:", error);
    // Return error response with proper JSON
    return NextResponse.json(
      {
        lastSync: null,
        nextSync: null,
        totalSynced: 0,
        errors: 1,
        connected: false,
        error: process.env.NODE_ENV === "development" ? error?.message : "Server error",
      },
      { status: 200 } // Return 200 untuk compatibility frontend
    );
  }
}

