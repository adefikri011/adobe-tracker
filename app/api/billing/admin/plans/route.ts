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
    
    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 2. POST: Membuat Plan Baru
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, price, finalPrice, discount, durationDays, deviceLimit, suspendDurationMinutes, dailySearchLimit, maxSearches, features, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json({ success: false, message: "Name and slug are required" }, { status: 400 });
    }

    // Check if slug already exists
    const existingSlug = await prisma.plan.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json({ success: false, message: "Slug already exists" }, { status: 400 });
    }

    // Hitung final price secara otomatis di backend jika tidak diberikan
    const priceNum = Number(price) || 0;
    const discountNum = Number(discount) || 0;
    const calculatedFinalPrice = finalPrice !== undefined ? Number(finalPrice) : priceNum - (priceNum * discountNum) / 100;

    const newPlan = await prisma.plan.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        price: priceNum,
        discount: discountNum,
        finalPrice: Math.round(calculatedFinalPrice * 100) / 100,
        durationDays: Number(durationDays) || 1,
        deviceLimit: Math.max(1, Number(deviceLimit) || 1),
        suspendDurationMinutes: Math.max(1, Number(suspendDurationMinutes) || 30),
        dailySearchLimit: Math.max(1, Number(dailySearchLimit) || 5),
        maxSearches: maxSearches || "unlimited",
        features: features || [],
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, data: newPlan }, { status: 201 });
  } catch (error: any) {
    console.error("[Plans API POST Error]:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 3. PATCH: Update Data Plan (Harga, Diskon, Fitur, Device Limit, atau Status Aktif)
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ success: false, message: "Plan ID is required" }, { status: 400 });

    // Get current plan to check if deviceLimit is changing
    const currentPlan = await prisma.plan.findUnique({ where: { id } });
    if (!currentPlan) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }

    const oldDeviceLimit = currentPlan.deviceLimit;
    const newDeviceLimit = updateData.deviceLimit !== undefined ? Number(updateData.deviceLimit) : oldDeviceLimit;

    // Jika harga atau diskon diupdate, hitung ulang finalPrice
    if (updateData.price !== undefined || updateData.discount !== undefined) {
      const price = updateData.price ?? currentPlan.price ?? 0;
      const discount = updateData.discount ?? currentPlan.discount ?? 0;
      const finalPrice = price - (price * discount) / 100;
      updateData.finalPrice = Math.round(finalPrice * 100) / 100;
    }

    // Ensure deviceLimit is valid
    if (updateData.deviceLimit !== undefined) {
      updateData.deviceLimit = Math.max(1, Number(updateData.deviceLimit));
    }

    // Ensure suspendDurationMinutes is valid
    if (updateData.suspendDurationMinutes !== undefined) {
      updateData.suspendDurationMinutes = Math.max(1, Number(updateData.suspendDurationMinutes));
    }

    // Ensure dailySearchLimit is valid
    if (updateData.dailySearchLimit !== undefined) {
      updateData.dailySearchLimit = Math.max(1, Number(updateData.dailySearchLimit));
    }

    // Convert maxSearches to string if provided
    if (updateData.maxSearches !== undefined) {
      updateData.maxSearches = String(updateData.maxSearches);
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    // Jika deviceLimit berubah, sinkronisasi semua user dengan subscription aktif ke plan ini
    if (newDeviceLimit !== oldDeviceLimit && updateData.deviceLimit !== undefined) {
      const usersWithSubscription = await prisma.subscription.findMany({
        where: {
          planId: id,
          status: "active",
          endDate: {
            gt: new Date(), // Hanya yang belum expired
          },
        },
        select: { profileId: true },
      });

      const profileIds = usersWithSubscription.map(s => s.profileId);

      if (profileIds.length > 0) {
        await prisma.profile.updateMany({
          where: { id: { in: profileIds } },
          data: { deviceLimit: newDeviceLimit },
        });
      }

      return NextResponse.json({ 
        success: true,
        data: updatedPlan,
        message: `Plan updated and synced to ${profileIds.length} active subscribers`,
        syncedProfiles: profileIds.length,
      });
    }

    return NextResponse.json({ success: true, data: updatedPlan });
  } catch (error: any) {
    console.error("[Plans API PATCH Error]:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// 4. DELETE: Soft Delete (Mengubah isActive menjadi false)
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, message: "Plan ID is required" }, { status: 400 });

    // Check if plan exists dan statusnya
    const existingPlan = await prisma.plan.findUnique({ where: { id } });

    if (!existingPlan) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }

    // Jika plan masih Active, hanya deactivate (soft delete)
    if (existingPlan.isActive) {
      const deactivatedPlan = await prisma.plan.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({ 
        success: true, 
        data: deactivatedPlan,
        message: "Plan deactivated. Click delete again untuk permanent delete." 
      });
    }

    // Jika plan sudah Inactive, baru bisa permanent delete (hard delete dari database)
    const deletedPlan = await prisma.plan.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      data: deletedPlan,
      message: "Plan permanently deleted from database" 
    });
  } catch (error: any) {
    console.error("[Plans API DELETE Error]:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}