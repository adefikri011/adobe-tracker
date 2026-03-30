import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function ensureAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true };
}

export async function POST(req: Request) {
  try {
    const adminCheck = await ensureAdmin();
    if (adminCheck.error) {
      return adminCheck.error;
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await Promise.all([
      prisma.profile.update({
        where: { id: userId },
        data: { status: "active" },
      }),
      prisma.userSession.upsert({
        where: { id: userId },
        update: {
          suspendedUntil: null,
          activeSessions: [],
        },
        create: {
          id: userId,
          suspendedUntil: null,
          activeSessions: [],
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unlock User Error:", err);
    return NextResponse.json(
      { error: "Failed to unlock user" },
      { status: 500 }
    );
  }
}
