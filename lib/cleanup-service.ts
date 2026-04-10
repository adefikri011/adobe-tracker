import { prisma } from "@/lib/prisma";

/**
 * Cleanup unpopular assets based on admin settings
 * Keeps top X% of popular assets, deletes bottom (100-X)%
 */
export async function cleanupUnpopularAssets() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      throw new Error("App settings not found");
    }

    // Check if cleanup should run
    const now = new Date();
    const lastCleanup = settings.lastCleanupAt;
    const cleanupIntervalMs = settings.cleanupFrequencyDays * 24 * 60 * 60 * 1000;

    if (lastCleanup && now.getTime() - lastCleanup.getTime() < cleanupIntervalMs) {
      console.log(
        `⏭️  Cleanup skipped. Next cleanup in ${settings.cleanupFrequencyDays} days`
      );
      return {
        executed: false,
        reason: "Not yet time for cleanup",
      };
    }

    console.log("🧹 Starting asset cleanup...");

    // Get total count
    const totalAssets = await prisma.asset.count();
    console.log(`📊 Total assets in database: ${totalAssets}`);

    if (totalAssets === 0) {
      console.log("✅ No assets to clean up");
      return { executed: true, deleted: 0, kept: 0 };
    }

    // Calculate how many to keep
    const keepCount = Math.ceil((totalAssets * settings.keepPercentage) / 100);
    const deleteCount = totalAssets - keepCount;

    console.log(`📈 Keep top ${settings.keepPercentage}%: ${keepCount} assets`);
    console.log(`📉 Delete bottom ${100 - settings.keepPercentage}%: ${deleteCount} assets`);

    // Get assets sorted by downloads (popularity)
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        title: true,
        downloads: true,
      },
      orderBy: {
        downloads: "desc", // Sort by popularity (downloads)
      },
    });

    // Get IDs to delete (bottom 30%)
    const idsToDelete = assets.slice(keepCount).map((a) => a.id);

    if (idsToDelete.length === 0) {
      console.log("✅ All assets are popular enough to keep");
      return { executed: true, deleted: 0, kept: keepCount };
    }

    // Delete unpopular assets
    const result = await prisma.asset.deleteMany({
      where: {
        id: {
          in: idsToDelete,
        },
      },
    });

    console.log(`🗑️  Deleted ${result.count} unpopular assets`);

    // Update last cleanup timestamp
    await prisma.appSettings.update({
      where: { id: "singleton" },
      data: { lastCleanupAt: now },
    });

    console.log(
      `✅ Cleanup completed! Next cleanup in ${settings.cleanupFrequencyDays} days`
    );

    return {
      executed: true,
      deleted: result.count,
      kept: keepCount,
      nextCleanupDate: new Date(now.getTime() + cleanupIntervalMs),
    };
  } catch (error) {
    console.error("❌ Cleanup error:", error);
    throw error;
  }
}

/**
 * Manual cleanup trigger (for testing or admin control)
 */
export async function forceCleanup() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      throw new Error("App settings not found");
    }

    // Force by setting lastCleanupAt to way in the past
    await prisma.appSettings.update({
      where: { id: "singleton" },
      data: { lastCleanupAt: new Date(0) }, // January 1, 1970
    });

    return await cleanupUnpopularAssets();
  } catch (error) {
    console.error("Force cleanup error:", error);
    throw error;
  }
}

/**
 * Get cleanup schedule info
 */
export async function getCleanupInfo() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      throw new Error("App settings not found");
    }

    const now = new Date();
    const lastCleanup = settings.lastCleanupAt || new Date(0);
    const cleanupIntervalMs = settings.cleanupFrequencyDays * 24 * 60 * 60 * 1000;
    const nextCleanup = new Date(lastCleanup.getTime() + cleanupIntervalMs);
    const timeTillNextCleanup = nextCleanup.getTime() - now.getTime();

    return {
      lastCleanupAt: lastCleanup,
      nextCleanupAt: nextCleanup,
      cleanupFrequencyDays: settings.cleanupFrequencyDays,
      keepPercentage: settings.keepPercentage,
      minDownloadThreshold: settings.minDownloadThreshold,
      daysUntilNextCleanup: Math.max(0, Math.ceil(timeTillNextCleanup / (24 * 60 * 60 * 1000))),
      timeTillNextCleanup,
    };
  } catch (error) {
    console.error("Get cleanup info error:", error);
    throw error;
  }
}
