import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SUSPEND_DURATION = 5;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  // GUNAKAN INI: Ambil origin langsung dari URL yang sedang diakses
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createServerSupabaseClient();

    // Tukar kode dengan session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth Error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    if (data?.user && data?.session) {
      const userId = data.user.id;
      const token = data.session.access_token;

           try {
        const googleFullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          (data.user.email ? data.user.email.split("@")[0] : null);

        await prisma.profile.upsert({
          where: { id: userId },
          update: {
            email: data.user.email ?? null,
            fullName: googleFullName,
          },
          create: {
            id: userId,
            email: data.user.email ?? null,
            fullName: googleFullName,
            plan: "free",
            role: "user",
          },
        });

        console.log("✅ Profile created/updated successfully");
      } catch (profileError) {
        console.error("❌ Profile Error:", profileError);
      }

      // --- 1. CEK STATUS SUSPEND ---
      // (Kode kamu yang ini sudah benar, teruskan saja...)
      const existingSession = await prisma.userSession.findUnique({
        where: { id: userId },
      });

      if (existingSession?.suspendedUntil && existingSession.suspendedUntil > new Date()) {
        await supabase.auth.signOut();
        const diffMs = existingSession.suspendedUntil.getTime() - Date.now();
        const diffMin = Math.ceil(diffMs / 60000);
        return NextResponse.redirect(`${origin}/login?error=suspended&minutes=${diffMin}`);
      }

      // --- 2. LOGIKA HUKUMAN ---
      if (existingSession?.activeSessionId) {
        const suspendUntil = new Date(Date.now() + SUSPEND_DURATION * 60 * 1000);
        await prisma.userSession.update({
          where: { id: userId },
          data: { activeSessionId: null, suspendedUntil: suspendUntil },
        });
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=double_login&minutes=${SUSPEND_DURATION}`);
      }

      // --- 3. JIKA AMAN: UPSERT ---
      try {
        await prisma.userSession.upsert({
          where: { id: userId },
          update: { activeSessionId: token, suspendedUntil: null },
          create: { id: userId, activeSessionId: token },
        });
      } catch (dbError) {
        console.error("Database Error:", dbError);
        return NextResponse.redirect(`${origin}/login?error=database_error`);
      }

      const roleProfile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const redirectPath = roleProfile?.role === "admin" ? "/admin" : next;
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Jika tidak ada kode atau gagal total
  return NextResponse.redirect(`${origin}/login`);
}