import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { validateAndUpdateUserPlan } from "@/lib/access-control/subscription-manager";
import { getUserPlanInfo } from "@/lib/access-control/permission";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ plan: "free" }, { status: 401 });
  }

  // Ambil profile dari DB
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  // Kalau belum ada profile (user baru), buat dulu
  if (!profile) {
    const newProfile = await prisma.profile.create({
      data: {
        id: user.id,
        fullName: user.user_metadata?.full_name ?? null,
        plan: "free",
      },
    });
    return NextResponse.json({ plan: newProfile.plan });
  }

  // Validate dan update plan jika subscription expired
  try {
    await validateAndUpdateUserPlan(user.id);
  } catch (error) {
    console.error("[Plan validation error]", error);
    // Silent fail — lanjut dengan plan yang sudah ada
  }

  // Get lengkap plan info dari getUserPlanInfo untuk accurate status
  try {
    const planInfo = await getUserPlanInfo(user.id);
    console.log("[Plan API] User plan:", planInfo.planSlug, "isPremium:", planInfo.isPremium);
    return NextResponse.json({ 
      plan: planInfo.planSlug,
      isPremium: planInfo.isPremium,
      planName: planInfo.planName,
      searchQuotaLimit: planInfo.searchQuotaLimit,
      planExpiry: profile?.planExpiry,
    });
  } catch (error) {
    console.error("[Plan API] Error getting plan info:", error);
    // Fallback ke profile.plan
    return NextResponse.json({ plan: profile.plan });
  }
}