import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();

  try {
    // 1. Ambil user + session token yang sedang aktif
    const [userRes, sessionRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);

    const userId = userRes.data.user?.id;
    const accessToken = sessionRes.data.session?.access_token;

    // 2. Hapus sesi aktif user saat ini
    let deletedCount = 0;
    if (userId) {
      if (accessToken) {
        const row = await prisma.userSession.findUnique({
          where: { id: userId },
          select: { activeSessions: true },
        });

        const nextSessions = Array.isArray(row?.activeSessions)
          ? row.activeSessions.filter((entry) => {
              if (!entry || typeof entry !== "object") {
                return false;
              }

              const token = (entry as { token?: string }).token;
              return token && token !== accessToken;
            })
          : [];

        await prisma.userSession.upsert({
          where: { id: userId },
          update: { activeSessions: nextSessions },
          create: { id: userId, activeSessions: [] },
        });
      } else {
        await prisma.userSession.upsert({
          where: { id: userId },
          update: { activeSessions: [] },
          create: { id: userId, activeSessions: [] },
        });
      }

      deletedCount = 1;
    }

    // 3. Logout dari Supabase (hapus cookie session)
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("Logout Error:", error);

    // Tetap usahakan logout di Supabase saat ada error DB
    await supabase.auth.signOut();

    return NextResponse.json({ success: false, error: "LOGOUT_FAILED" }, { status: 500 });
  }
}