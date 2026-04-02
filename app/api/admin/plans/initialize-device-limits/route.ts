import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Helper to check if user is admin
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

/**
 * Initialize/Fix device limits for all existing plans based on their names
 * This endpoint can be called once to auto-set device limits for plans
 * 
 * Device limit logic:
 * - Free plan: 1 device
 * - 7/14 day plans: 1-2 devices
 * - 15 day plans: 2 devices  
 * - 30 day plans: 3 devices
 * - Higher tier: 3-5 devices
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { overrides } = await req.json();
    
    // Get all plans
    const allPlans = await prisma.plan.findMany();
    
    const updates: { id: string; deviceLimit: number; name: string }[] = [];

    for (const plan of allPlans) {
      let newDeviceLimit = plan.deviceLimit; // Keep existing if no rule matches
      const planNameLower = plan.name.toLowerCase();
      const planSlugLower = plan.slug.toLowerCase();

      // Override if provided in request
      if (overrides && overrides[plan.id]) {
        newDeviceLimit = overrides[plan.id];
      } else {
        // Auto-assign based on plan name/slug
        if (planNameLower.includes("free") || planSlugLower.includes("free")) {
          newDeviceLimit = 1;
        } else if (planNameLower.includes("30") || planSlugLower.includes("30")) {
          newDeviceLimit = 3;
        } else if (planNameLower.includes("15") || planSlugLower.includes("15")) {
          newDeviceLimit = 2;
        } else if (planNameLower.includes("7") || planSlugLower.includes("7")) {
          newDeviceLimit = 1;
        } else if (planNameLower.includes("pro") || planSlugLower.includes("pro")) {
          // Pro plans default to 2-3 depending on price
          newDeviceLimit = plan.price > 10 ? 3 : 2;
        }
      }

      // Only update if deviceLimit will actually change
      if (newDeviceLimit !== plan.deviceLimit) {
        updates.push({
          id: plan.id,
          deviceLimit: newDeviceLimit,
          name: plan.name,
        });

        // Update plan deviceLimit
        await prisma.plan.update({
          where: { id: plan.id },
          data: { deviceLimit: newDeviceLimit },
        });

        // Auto-sync all users with active subscriptions to this plan
        const activeSubscriptions = await prisma.subscription.findMany({
          where: {
            planId: plan.id,
            status: "active",
            endDate: {
              gt: new Date(),
            },
          },
          select: { profileId: true },
        });

        if (activeSubscriptions.length > 0) {
          const profileIds = activeSubscriptions.map(s => s.profileId);
          await prisma.profile.updateMany({
            where: { id: { in: profileIds } },
            data: { deviceLimit: newDeviceLimit },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Device limits initialized for ${updates.length} plans`,
      updated: updates.map(u => ({
        planName: u.name,
        newDeviceLimit: u.deviceLimit,
      })),
    });
  } catch (error: any) {
    console.error("Initialize device limits error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
