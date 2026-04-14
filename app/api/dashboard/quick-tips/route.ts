import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile to access their assets
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: {
        assets: {
          orderBy: [
            { downloads: "desc" },
            { earnings: "desc" },
            { popularity: "desc" },
          ],
          take: 100,
        },
      },
    });

    if (!profile || profile.assets.length === 0) {
      // Return default tips if no assets
      return NextResponse.json({
        tips: [
          { emoji: "🎯", text: "Start by uploading your first asset to see personalized insights" },
          { emoji: "🏷️", text: "Use relevant tags to improve asset discoverability" },
          { emoji: "📊", text: "Monitor your dashboard regularly for performance trends" },
          { emoji: "⏰", text: "Consistency is key - upload regularly to maintain visibility" },
        ],
      });
    }

    // Analyze user's assets to generate real tips
    const assets = profile.assets;
    const totalAssets = assets.length;
    const totalDownloads = assets.reduce((sum, a) => sum + a.downloads, 0);
    const totalEarnings = assets.reduce((sum, a) => sum + a.earnings, 0);
    const avgDownloads = totalAssets > 0 ? Math.round(totalDownloads / totalAssets) : 0;
    const avgEarnings = totalAssets > 0 ? Math.round(totalEarnings / totalAssets * 100) / 100 : 0;

    // Get top performing category
    const categoryStats: Record<string, { count: number; downloads: number; earnings: number }> = {};
    assets.forEach((asset) => {
      const cat = asset.category || "Uncategorized";
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, downloads: 0, earnings: 0 };
      }
      categoryStats[cat].count++;
      categoryStats[cat].downloads += asset.downloads;
      categoryStats[cat].earnings += asset.earnings;
    });

    const topCategory = Object.entries(categoryStats)
      .sort((a, b) => b[1].downloads - a[1].downloads)[0];

    // Get top keywords
    const keywordStats: Record<string, number> = {};
    assets.forEach((asset) => {
      asset.keywords.forEach((kw) => {
        keywordStats[kw] = (keywordStats[kw] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywordStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => kw);

    // Generate dynamic tips based on analysis
    const tips = generateTips(
      totalAssets,
      avgDownloads,
      avgEarnings,
      topCategory,
      topKeywords,
      assets
    );

    return NextResponse.json({ tips });
  } catch (error) {
    console.error("[Quick Tips API Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch quick tips" },
      { status: 500 }
    );
  }
}

function generateTips(
  totalAssets: number,
  avgDownloads: number,
  avgEarnings: number,
  topCategory: [string, { count: number; downloads: number; earnings: number }] | undefined,
  topKeywords: string[],
  assets: any[]
) {
  const tips: { emoji: string; text: string }[] = [];

  // Tip 1: Focus on trending keywords
  if (topKeywords.length > 0) {
    tips.push({
      emoji: "🎯",
      text: `Your top keyword "${topKeywords[0]}" drives ${assets.filter((a) => a.keywords.includes(topKeywords[0])).length} assets. Double down on it!`,
    });
  } else {
    tips.push({
      emoji: "🎯",
      text: "Focus on trending keywords to maximize visibility and competition exposure",
    });
  }

  // Tip 2: Category optimization
  if (topCategory) {
    const [category, stats] = topCategory;
    tips.push({
      emoji: "🏷️",
      text: `Your "${category}" assets average ${Math.round(stats.downloads / stats.count)} downloads. Keep focus on this strength!`,
    });
  } else {
    tips.push({
      emoji: "🏷️",
      text: "Use AI-powered tags for better asset discoverability and reach",
    });
  }

  // Tip 3: Monitor competition
  if (totalAssets > 20) {
    tips.push({
      emoji: "📊",
      text: `You have ${totalAssets} assets averaging ${avgDownloads} downloads each. Update pricing based on market trends.`,
    });
  } else {
    tips.push({
      emoji: "📊",
      text: "Monitor competition regularly and adjust pricing to stay competitive",
    });
  }

  // Tip 4: Upload schedule
  const recentAssets = assets.filter((a) => {
    if (!a.uploadedAt) return false;
    const daysSinceUpload = Math.floor(
      (Date.now() - a.uploadedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUpload <= 30;
  });

  if (recentAssets.length < 3) {
    tips.push({
      emoji: "⏰",
      text: "Boost visibility by uploading fresh content regularly (aim for 2-3 per week)",
    });
  } else {
    tips.push({
      emoji: "⏰",
      text: `Great consistency! You've uploaded ${recentAssets.length} assets in the last 30 days.`,
    });
  }

  // Ensure we have exactly 4 tips
  return tips.slice(0, 4);
}
