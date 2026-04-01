import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch subscriptions dengan relasi profile dan plan
    const subscriptions = await prisma.subscription.findMany({
      include: {
        profile: {
          select: {
            fullName: true,
            email: true,
          },
        },
        plan: {
          select: {
            name: true,
            finalPrice: true,
            durationDays: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response dengan kalkulasi progress
    const formatted = subscriptions.map((sub) => {
      const startDate = new Date(sub.startDate);
      const endDate = new Date(sub.endDate);
      const now = new Date();

      // Hitung progress (0-100%)
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

      // Format tanggal
      const formatDate = (date: Date) => 
        date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      return {
        id: sub.id,
        user: sub.profile?.fullName || sub.profile?.email || "Unknown",
        plan: sub.plan?.name || "Unknown Plan",
        amount: sub.plan?.finalPrice || 0,
        date: formatDate(startDate),
        expiry: formatDate(endDate),
        status: sub.status.toLowerCase() as "active" | "expired" | "cancelled",
        progress: Math.round(progress),
      };
    });

    return NextResponse.json({ history: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
