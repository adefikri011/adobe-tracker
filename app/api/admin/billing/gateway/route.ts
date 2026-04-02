import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/admin/billing/gateway — ambil semua konfigurasi gateway
export async function GET() {
  try {
    const configs = await prisma.gatewayConfig.findMany({
      orderBy: { gateway: "asc" },
    });
    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error("[Gateway Config GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/billing/gateway — update atau buat konfigurasi gateway (admin only)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { gateway, enabled, serverKey, clientKey, publishableKey, mode } = body;

    if (!gateway) {
      return NextResponse.json({ error: "Gateway name is required" }, { status: 400 });
    }

    // Cek apakah sudah ada config untuk gateway ini
    const existingConfig = await prisma.gatewayConfig.findUnique({
      where: { gateway },
    });

    let config;
    if (existingConfig) {
      // Update existing config
      config = await prisma.gatewayConfig.update({
        where: { gateway },
        data: {
          enabled: enabled ?? existingConfig.enabled,
          serverKey: serverKey ?? existingConfig.serverKey,
          clientKey: clientKey ?? existingConfig.clientKey,
          publishableKey: publishableKey ?? existingConfig.publishableKey,
          mode: mode ?? existingConfig.mode,
        },
      });
    } else {
      // Create new config
      config = await prisma.gatewayConfig.create({
        data: {
          gateway,
          enabled: enabled ?? false,
          serverKey,
          clientKey,
          publishableKey,
          mode: mode ?? "sandbox",
        },
      });
    }

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error("[Gateway Config POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
