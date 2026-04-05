/**
 * Admin Endpoint: Check & Process Expired Subscriptions
 * 
 * Path: /api/admin/subscriptions/process-expiry
 * Access: Admin only
 * 
 * Gunakan endpoint ini untuk:
 * 1. Manual trigger batch processing subscriptions yang expired
 * 2. Get report status subscriptions yang expired
 * 3. Manually process single subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  checkAndProcessAllExpiredSubscriptions,
  processSingleSubscriptionExpiry,
  getSubscriptionStatus,
} from "@/lib/access-control/subscription-manager";

// ============================================
// HELPER: Check if user is admin
// ============================================
async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    return profile?.role === "admin";
  } catch {
    return false;
  }
}

// ============================================
// GET: Get subscription status report
// ============================================
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized - admin only" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "status") {
      // Get subscription status summary
      const now = new Date();

      const totalActive = await prisma.subscription.count({
        where: {
          status: "active",
          endDate: { gt: now },
        },
      });

      const totalExpired = await prisma.subscription.count({
        where: {
          status: "active",
          endDate: { lte: now },
        },
      });

      const totalProcessed = await prisma.subscription.count({
        where: { status: "expired" },
      });

      const totalCancelled = await prisma.subscription.count({
        where: { status: "cancelled" },
      });

      return NextResponse.json({
        summary: {
          activeAndValid: totalActive,
          activeButExpired: totalExpired,
          processedAsExpired: totalProcessed,
          cancelled: totalCancelled,
          total: totalActive + totalExpired + totalProcessed + totalCancelled,
        },
        timestamp: now.toISOString(),
      });
    }

    // If no action specified, return available actions
    return NextResponse.json({
      message: "Admin Subscription Management",
      availableActions: {
        status: "GET /?action=status — Get subscription status summary",
        processAll:
          "POST / — Batch process all expired subscriptions",
        processSingle:
          "POST / with { subscriptionId } — Process single subscription",
      },
    });
  } catch (error) {
    console.error("[Admin Subscriptions] GET error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Process subscriptions
// ============================================
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized - admin only" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { subscriptionId, action } = body;

    // If subscriptionId is provided, process single subscription
    if (subscriptionId) {
      const result = await processSingleSubscriptionExpiry(subscriptionId);
      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    // Otherwise, batch process all expired subscriptions
    const result = await checkAndProcessAllExpiredSubscriptions();

    return NextResponse.json(
      {
        ...result,
        timestamp: new Date().toISOString(),
        message: `Processed ${result.subscriptionsExpired} expired subscriptions, ${result.usersDowngraded} users downgraded`,
      },
      { status: result.processed ? 200 : 500 }
    );
  } catch (error) {
    console.error("[Admin Subscriptions] POST error:", error);
    return NextResponse.json(
      {
        error: "Failed to process subscriptions",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
