import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserPlanInfo } from "@/lib/access-control/permission";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
        email: user.email || null,
      },
      create: {
        id: user.id,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
        email: user.email || null,
        plan: "free",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        status: true,
      },
    });

    const planInfo = await getUserPlanInfo(user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        fullName: profile.fullName,
        email: user.email || profile.email,
        createdAt: profile.createdAt,
        accountStatus: profile.status,
        plan: {
          slug: planInfo.planSlug,
          name: planInfo.planName,
          isPremium: planInfo.isPremium,
        },
      },
    });
  } catch (error) {
    console.error("[User Profile GET] Error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rawName = typeof body?.fullName === "string" ? body.fullName : "";
    const fullName = rawName.trim();

    if (fullName.length < 2 || fullName.length > 80) {
      return NextResponse.json(
        { error: "Nama harus antara 2 sampai 80 karakter" },
        { status: 400 }
      );
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        name: fullName,
      },
    });

    if (authUpdateError) {
      return NextResponse.json(
        { error: authUpdateError.message || "Gagal update profil auth" },
        { status: 400 }
      );
    }

    const updated = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        fullName,
        email: user.email || null,
      },
      create: {
        id: user.id,
        fullName,
        email: user.email || null,
        plan: "free",
      },
      select: {
        fullName: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("[User Profile PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
