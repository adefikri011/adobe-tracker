import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Durasi suspend untuk testing (dalam menit)
const SUSPEND_DURATION = 1;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const supabase = await createServerSupabaseClient();

    // 1. LOGIN KE SUPABASE AUTH
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Jika email/pass salah
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    const userId = authData.user.id;
    const currentToken = authData.session.access_token;
    const loginFullName =
      authData.user.user_metadata?.full_name ||
      authData.user.user_metadata?.name ||
      (authData.user.email ? authData.user.email.split("@")[0] : null);

    // Pastikan Profile ada (create jika baru)
    await prisma.profile.upsert({
      where: { id: userId },
      update: {
        email: authData.user.email ?? null,
        fullName: loginFullName,
      },
      create: {
        id: userId,
        email: authData.user.email ?? null,
        fullName: loginFullName,
        plan: "free",
        role: "user",
      },
    });


    // 2. CEK STATUS DI PRISMA (DATABASE)
    const sessionRecord = await prisma.userSession.findUnique({
      where: { id: userId },
    });

    // 3. CEK APAKAH SEDANG DALAM MASA SUSPEND
    if (sessionRecord?.suspendedUntil && sessionRecord.suspendedUntil > new Date()) {
      // Paksa logout dari Supabase karena akun lagi dihukum
      await supabase.auth.signOut();

      const diffMs = sessionRecord.suspendedUntil.getTime() - Date.now();
      const diffMin = Math.ceil(diffMs / 60000);

      return NextResponse.json({
        error: "SUSPENDED",
        message: `Akun Anda sedang di-suspend karena terdeteksi login di device lain. Silakan tunggu ${diffMin} menit lagi.`,
        minutesLeft: diffMin,
        suspendedUntil: sessionRecord.suspendedUntil.toISOString(),
      }, { status: 403 });
    }

    // 4. CEK DOUBLE LOGIN (Jika activeSessionId sudah ada isinya)
    if (sessionRecord?.activeSessionId) {
      // Hitung waktu selesai suspend (30 menit dari sekarang)
      const suspendTime = new Date(Date.now() + SUSPEND_DURATION * 60 * 1000);

      // Hukum user: Hapus session aktif dan set waktu suspend
      await prisma.userSession.upsert({
        where: { id: userId },
        update: {
          activeSessionId: null,
          suspendedUntil: suspendTime
        },
        create: {
          id: userId,
          suspendedUntil: suspendTime
        },
      });

      // Paksa logout semua
      await supabase.auth.signOut();

      return NextResponse.json({
        error: "DOUBLE_LOGIN",
        message: `Double login terdeteksi! Akun Anda otomatis di-suspend selama ${SUSPEND_DURATION} menit untuk keamanan.`,
        minutesLeft: SUSPEND_DURATION,
        suspendedUntil: suspendTime.toISOString(),
      }, { status: 403 });
    }

    // 5. LOGIN BERHASIL
    // Simpan token session ke database sebagai tanda "Sesi Aktif"
    await prisma.userSession.upsert({
      where: { id: userId },
      update: {
        activeSessionId: currentToken,
        suspendedUntil: null // Bersihkan status suspend jika sudah lewat waktunya
      },
      create: {
        id: userId,
        activeSessionId: currentToken
      },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Login Error:", err);
    return NextResponse.json({
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}