import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkFeatureAccess } from "@/lib/access-control/permission";
import { FEATURES } from "@/lib/access-control/features";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", allowed: false },
        { status: 401 }
      );
    }

    // Check if user has SPY_CONTRIBUTOR feature
    const permission = await checkFeatureAccess(
      user.id,
      FEATURES.SPY_CONTRIBUTOR
    );

    return NextResponse.json({
      allowed: permission.allowed,
      plan: permission.plan,
      isPremium: permission.isPremium,
      reason: permission.reason,
      isSubscriptionActive: permission.isSubscriptionActive,
      isSubscriptionExpired: permission.isSubscriptionExpired,
    });
  } catch (error) {
    console.error("[Feature Check API Error]", error);
    return NextResponse.json(
      { error: "Failed to check feature access", allowed: false },
      { status: 500 }
    );
  }
}
