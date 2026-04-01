import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

// 1. GET: Ambil SEMUA plan (termasuk yang tidak aktif) untuk ditampilkan di Dashboard Admin
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: "asc" },
    });
    
    return NextResponse.json({ plans });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Membuat Plan Baru
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, description, price, discount, durationDays, features } = body;

    // Hitung final price secara otomatis di backend
    const priceNum = Number(price);
    const discountNum = Number(discount) || 0;
    const finalPrice = priceNum - (priceNum * discountNum) / 100;

    const newPlan = await prisma.plan.create({
      data: {
        name,
        slug,
        description,
        price: priceNum,
        discount: discountNum,
        finalPrice: Math.round(finalPrice * 100) / 100,
        durationDays: Number(durationDays),
        features: features || [],
        isActive: true,
      },
    });

    return NextResponse.json({ plan: newPlan }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. PATCH: Update Data Plan (Harga, Diskon, Fitur, atau Status Aktif)
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: "ID wajib ada" }, { status: 400 });

    // Jika harga atau diskon diupdate, hitung ulang finalPrice
    if (updateData.price !== undefined || updateData.discount !== undefined) {
      const currentPlan = await prisma.plan.findUnique({ where: { id } });
      const price = updateData.price ?? currentPlan?.price ?? 0;
      const discount = updateData.discount ?? currentPlan?.discount ?? 0;
      updateData.finalPrice = Math.round((price - (price * discount) / 100) * 100) / 100;
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ plan: updatedPlan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. DELETE: Soft Delete (Mengubah isActive menjadi false)
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID wajib ada" }, { status: 400 });

    const deletedPlan = await prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, plan: deletedPlan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}