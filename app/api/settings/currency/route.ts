import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getClientIP } from "@/lib/activity-log";

// Helper untuk cek apakah user adalah admin
async function isAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  return profile?.role === "admin";
}

// Get admin info untuk logging
async function getAdminInfo() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { email: "unknown@email.com", name: "Unknown" };

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { fullName: true, email: true },
  });

  return {
    name: profile?.fullName || "Unknown",
    email: user.email || "unknown@email.com",
  };
}

// GET: Ambil currency settings (public endpoint)
export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    // Jika belum ada, buat default
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: "singleton",
          currency: "USD",
          exchangeRate: 15800,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Update currency settings (admin only)
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currency, exchangeRate } = body;

    // Validasi input
    if (!currency || !["USD", "IDR"].includes(currency)) {
      return NextResponse.json(
        { success: false, error: "Invalid currency. Must be USD or IDR" },
        { status: 400 }
      );
    }

    if (typeof exchangeRate !== "number" || exchangeRate <= 0) {
      return NextResponse.json(
        { success: false, error: "Exchange rate must be a positive number" },
        { status: 400 }
      );
    }

    // Update atau create
    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      update: {
        currency,
        exchangeRate,
      },
      create: {
        id: "singleton",
        currency,
        exchangeRate,
      },
    });

    // Log activity
    const admin = await getAdminInfo();
    await prisma.activityLog.create({
      data: {
        user: admin.name,
        email: admin.email,
        action: "Currency Settings Updated",
        detail: `Updated currency to ${currency} with exchange rate: ${exchangeRate}`,
        ipAddress: getClientIP(req),
      },
    }).catch(err => console.error("Failed to log currency update:", err));

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Currency settings updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
