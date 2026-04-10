import { NextRequest, NextResponse } from "next/server";
import { cleanupUnpopularAssets, getCleanupInfo, forceCleanup } from "../../../../lib/cleanup-service";

/**
 * GET /api/admin/cleanup
 * Get cleanup status and schedule
 */
export async function GET(request: NextRequest) {
  try {
    // Allow token auth for external/cron requests
    const token = request.headers.get("x-cleanup-token");
    const CLEANUP_SECRET = process.env.CLEANUP_SECRET_TOKEN;
    
    // For now, allow from admin UI (already protected) or with valid token
    // In production, add proper session auth here
    if (!token && !request.headers.get("cookie")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // If token provided, verify it
    if (token && token !== CLEANUP_SECRET) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const info = await getCleanupInfo();
    return NextResponse.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error("Cleanup info error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get cleanup info" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cleanup
 * Trigger cleanup manually or on schedule
 */
export async function POST(request: NextRequest) {
  try {
    // Allow token auth for external/cron requests
    const token = request.headers.get("x-cleanup-token");
    const CLEANUP_SECRET = process.env.CLEANUP_SECRET_TOKEN;
    
    // For now, allow from admin UI (already protected) or with valid token
    // In production, add proper session auth here
    if (!token && !request.headers.get("cookie")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // If token provided, verify it
    if (token && token !== CLEANUP_SECRET) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const force = body.force === true;

    let result;
    if (force) {
      result = await forceCleanup();
    } else {
      result = await cleanupUnpopularAssets();
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
      },
      { status: 500 }
    );
  }
}
