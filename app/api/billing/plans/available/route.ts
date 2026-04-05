/**
 * GET /api/billing/plans/available
 * 
 * Return semua active plans yang tersedia untuk upgrade
 * No auth needed — untuk encourage upsell saat quota exceeded
 * 
 * Response: Array of plans dengan pricing + features
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get hanya active plans, sorted by price
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        finalPrice: true,
        discount: true,
        durationDays: true,
        deviceLimit: true,
        features: true,
      },
      orderBy: {
        price: "asc",
      },
    });

    // Format untuk frontend consumption
    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      duration: {
        days: plan.durationDays,
        label: `${plan.durationDays} ${plan.durationDays === 1 ? "Day" : "Days"}`,
      },
      pricing: {
        original: plan.price,
        final: plan.finalPrice,
        discount: plan.discount > 0 ? `${plan.discount}% off` : null,
        currency: "IDR",
      },
      deviceLimit: plan.deviceLimit,
      features: plan.features,
      upgradeUrl: `/checkout?planId=${plan.id}`, // Link untuk upgrade
    }));

    return NextResponse.json({ plans: formattedPlans, total: formattedPlans.length });
  } catch (error: any) {
    console.error("[Plans API] Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans", message: error.message },
      { status: 500 }
    );
  }
}
