import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCleanupInfo } from "../../../../../lib/cleanup-service";

/**
 * GET /api/admin/settings/cleanup
 * Get cleanup configuration
 */
export async function GET(request: NextRequest) {
  try {
    const info = await getCleanupInfo();
    return NextResponse.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error("Get cleanup settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cleanup settings" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings/cleanup
 * Update cleanup configuration
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cleanupFrequencyDays,
      keepPercentage,
      minDownloadThreshold,
    } = body;

    // Validate inputs
    if (cleanupFrequencyDays !== undefined) {
      if (![1, 7, 14, 30, 60].includes(cleanupFrequencyDays)) {
        return NextResponse.json(
          { success: false, error: "Invalid cleanup frequency" },
          { status: 400 }
        );
      }
    }

    if (keepPercentage !== undefined) {
      if (keepPercentage < 50 || keepPercentage > 95) {
        return NextResponse.json(
          { success: false, error: "Keep percentage must be between 50-95" },
          { status: 400 }
        );
      }
    }

    if (minDownloadThreshold !== undefined) {
      if (minDownloadThreshold < 0 || minDownloadThreshold > 1000) {
        return NextResponse.json(
          { success: false, error: "Min download threshold must be 0-1000" },
          { status: 400 }
        );
      }
    }

    // Update settings
    const updated = await prisma.appSettings.update({
      where: { id: "singleton" },
      data: {
        ...(cleanupFrequencyDays && { cleanupFrequencyDays }),
        ...(keepPercentage && { keepPercentage }),
        ...(minDownloadThreshold !== undefined && {
          minDownloadThreshold,
        }),
      },
    });

    const info = await getCleanupInfo();

    return NextResponse.json({
      success: true,
      data: info,
      message: "Cleanup settings updated successfully",
    });
  } catch (error) {
    console.error("Update cleanup settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update cleanup settings" },
      { status: 500 }
    );
  }
}
