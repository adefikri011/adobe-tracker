import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { prisma } from "../../../lib/prisma";

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

  return NextResponse.json({ plan: profile.plan });
}