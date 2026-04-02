import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
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

  return NextResponse.json({ plan: profile.plan, success: true });
}