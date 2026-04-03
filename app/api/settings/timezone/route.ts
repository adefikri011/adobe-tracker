import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { detectTimezoneFromIP, detectLocationFromIP, getTimezoneInfo } from "../../../../lib/geolocation";
import { getClientIP } from "@/lib/activity-log";

/**
 * GET /api/settings/timezone
 * Ambil timezone settings user saat ini
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil profile user dengan timezone settings
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        timezone: true,
        timeFormat: true,
        id: true,
        email: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const timezoneInfo = getTimezoneInfo(profile.timezone);

    return NextResponse.json({
      success: true,
      data: {
        timezone: profile.timezone,
        timeFormat: profile.timeFormat,
        timezoneInfo: timezoneInfo,
      },
    });
  } catch (error) {
    console.error("Timezone GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timezone settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/timezone
 * Simpan timezone settings user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { timezone, timeFormat } = body;

    // Validasi timezone dan timeFormat
    if (!timezone || !["24h", "12h"].includes(timeFormat)) {
      return NextResponse.json(
        { error: "Invalid timezone or timeFormat" },
        { status: 400 }
      );
    }

    // Update profile dengan timezone baru
    const updatedProfile = await prisma.profile.update({
      where: { id: user.id },
      data: {
        timezone: timezone,
        timeFormat: timeFormat,
      },
      select: {
        timezone: true,
        timeFormat: true,
      },
    });

    const timezoneInfo = getTimezoneInfo(updatedProfile.timezone);

    return NextResponse.json({
      success: true,
      message: "Timezone settings updated",
      data: {
        timezone: updatedProfile.timezone,
        timeFormat: updatedProfile.timeFormat,
        timezoneInfo: timezoneInfo,
      },
    });
  } catch (error) {
    console.error("Timezone POST error:", error);
    return NextResponse.json(
      { error: "Failed to update timezone settings" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/settings/timezone?auto-detect=true
 * Auto-detect timezone dari IP device user
 */
export async function getAutoDetectTimezone(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    if (!ip) {
      return {
        success: false,
        timezone: "Asia/Jakarta", // fallback
        error: "Could not determine IP address",
      };
    }

    const location = await detectLocationFromIP(ip);

    return {
      success: true,
      timezone: location.timezone || "Asia/Jakarta",
      location: location,
    };
  } catch (error) {
    console.error("Auto-detect timezone error:", error);
    return {
      success: false,
      timezone: "Asia/Jakarta",
      error: "Failed to auto-detect timezone",
    };
  }
}
