import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/billing/plans — ambil semua plan aktif
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { finalPrice: "asc" },
    });
    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("[Plans GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/billing/plans — buat plan baru (admin only)
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
    const { name, slug, description, price, discount, durationDays, features } = body;

    if (!name || !slug || !price || !durationDays) {
      return NextResponse.json({ error: "Field name, slug, price, durationDays wajib diisi" }, { status: 400 });
    }

    const discountVal = Number(discount) || 0;
    const finalPrice = price - (price * discountVal) / 100;

    const plan = await prisma.plan.create({
      data: {
        name,
        slug,
        description: description || null,
        price: Number(price),
        finalPrice: Math.round(finalPrice * 100) / 100,
        discount: discountVal,
        durationDays: Number(durationDays),
        features: Array.isArray(features) ? features : [],
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error: any) {
    console.error("[Plans POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/billing/plans — update plan (admin only)
export async function PATCH(req: NextRequest) {
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
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID plan wajib" }, { status: 400 });

    // Recalculate finalPrice kalau price atau discount berubah
    if (data.price !== undefined || data.discount !== undefined) {
      const existing = await prisma.plan.findUnique({ where: { id } });
      const price = data.price ?? existing?.price ?? 0;
      const discount = data.discount ?? existing?.discount ?? 0;
      data.finalPrice = Math.round((price - (price * discount) / 100) * 100) / 100;
    }

    const plan = await prisma.plan.update({ where: { id }, data });
    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error("[Plans PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/billing/plans — soft delete (nonaktifkan) plan (admin only)
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID plan wajib" }, { status: 400 });

    // Soft delete — nonaktifkan saja, jangan hapus (ada transaksi yang reference ke plan)
    await prisma.plan.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Plans DELETE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}