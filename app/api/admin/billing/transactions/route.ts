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

    // Fetch all transactions dengan data relasi
    const transactions = await prisma.transaction.findMany({
      include: {
        profile: {
          select: {
            email: true,
            fullName: true,
          },
        },
        plan: {
          select: {
            name: true,
            durationDays: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response sesuai kebutuhan frontend
    const formatted = transactions.map((t) => ({
      id: t.id,
      orderId: t.orderId,
      user: t.profile?.email || "Unknown",
      plan: t.plan?.name || "Unknown Plan",
      amount: t.amount,
      status: t.status,
      method: t.paymentMethod || "Unknown",
      date: t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : "N/A",
    }));

    return NextResponse.json({ transactions: formatted });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
