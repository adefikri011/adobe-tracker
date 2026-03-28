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

    // 2. Hapus catatan sesi aktif di Prisma (hapus row agar benar-benar "hilang")
    let deletedCount = 0;
    if (userId || accessToken) {
      const deleted = await prisma.userSession.deleteMany({
        where: {
          OR: [
            ...(userId ? [{ id: userId }] : []),
            ...(accessToken ? [{ activeSessionId: accessToken }] : []),
          ],
        },
      });
      deletedCount = deleted.count;
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