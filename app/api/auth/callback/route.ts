import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SUSPEND_DURATION = 5;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      const userId = data.user.id;
      const token = data.session.access_token;

      // --- 1. CEK STATUS SUSPEND ---
      const existingSession = await prisma.userSession.findUnique({
        where: { id: userId },
      });

      if (existingSession?.suspendedUntil && existingSession.suspendedUntil > new Date()) {
        await supabase.auth.signOut();

        const diffMs = existingSession.suspendedUntil.getTime() - Date.now();
        const diffMin = Math.ceil(diffMs / 60000);
        const suspendUntilIso = encodeURIComponent(existingSession.suspendedUntil.toISOString());

        return NextResponse.redirect(`${origin}/login?error=suspended&minutes=${diffMin}&until=${suspendUntilIso}`);
      }

      // --- 2. LOGIKA HUKUMAN: CEK APAKAH SUDAH ADA SESI AKTIF? ---

      if (existingSession?.activeSessionId) {
        // Jika ada activeSessionId, berarti ada orang lain (browser lain) yang lagi login
        const suspendUntil = new Date(Date.now() + SUSPEND_DURATION * 60 * 1000);

        await prisma.userSession.update({
          where: { id: userId },
          data: { 
            activeSessionId: null, // Matikan sesi yang lama
            suspendedUntil: suspendUntil 
          },
        });

        // Paksa logout dari Supabase
        await supabase.auth.signOut();

        // Lempar balik ke login dengan pesan error
        const suspendUntilIso = encodeURIComponent(suspendUntil.toISOString());
        return NextResponse.redirect(`${origin}/login?error=double_login&minutes=${SUSPEND_DURATION}&until=${suspendUntilIso}`);
      }
      // --- AKHIR LOGIKA HUKUMAN ---

      // 3. JIKA AMAN: Baru catat sesi baru
      await prisma.userSession.upsert({
        where: { id: userId },
        update: { activeSessionId: token, suspendedUntil: null },
        create: { id: userId, activeSessionId: token },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}