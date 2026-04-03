import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getClientIP } from "@/lib/activity-log";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    update: { plan: "pro" },
    create: {
      id: user.id,
      fullName: user.user_metadata?.full_name ?? null,
      plan: "pro",
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      user: profile.fullName || "Unknown",
      email: user.email || "unknown@email.com",
      action: "Upgraded to Pro",
      detail: `User upgraded to Pro plan`,
      ipAddress: getClientIP(req),
    },
  }).catch(err => console.error("Failed to log upgrade activity:", err));

  return NextResponse.json({ plan: profile.plan, success: true });
}