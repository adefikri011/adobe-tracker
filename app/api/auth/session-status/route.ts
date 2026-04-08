import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SessionEntry = {
  token: string;
  createdAt?: string;
};

function parseSessionEntries(raw: unknown): SessionEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const item = entry as Partial<SessionEntry>;
      return {
        token: typeof item.token === "string" ? item.token : "",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
      };
    })
    .filter((entry) => entry.token.length > 0);
}

function keepRecentSessions(sessions: SessionEntry[]) {
  const cutoffMs = 30 * 24 * 60 * 60 * 1000;

  return sessions.filter((session) => {
    if (!session.createdAt) {
      return true;
    }

    const createdMs = new Date(session.createdAt).getTime();
    if (Number.isNaN(createdMs)) {
      return false;
    }

    return Date.now() - createdMs < cutoffMs;
  });
}

export async function GET() {
  const supabase = await createServerSupabaseClient();

  try {
    // Read AppSettings once so every response (including 401) can carry consistent duration.
    const appSettings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
      select: { suspendDurationMinutes: true },
    });
    const suspendDurationMinutes = appSettings?.suspendDurationMinutes || 30;

    const [{ data: userData }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);

    const user = userData.user;
    const accessToken = sessionData.session?.access_token;

    if (!user || !accessToken) {
      return NextResponse.json(
        { status: "unauthenticated", suspendDurationMinutes },
        { status: 401 }
      );
    }

    const [sessionRecord, profile] = await Promise.all([
      prisma.userSession.findUnique({
        where: { id: user.id },
      }),
      prisma.profile.findUnique({
        where: { id: user.id },
        select: { status: true },
      }),
    ]);

    const now = new Date();

    if (sessionRecord?.suspendedUntil && sessionRecord.suspendedUntil > now) {
      const diffMs = sessionRecord.suspendedUntil.getTime() - now.getTime();
      const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));
      const minutesLeft = Math.ceil(diffMs / 60000);

      if (profile?.status !== "suspended") {
        await prisma.profile.update({
          where: { id: user.id },
          data: { status: "suspended" },
        });
      }

      await supabase.auth.signOut();

      return NextResponse.json({
        status: "suspended",
        secondsLeft,
        minutesLeft,
        suspendedUntil: sessionRecord.suspendedUntil.toISOString(),
        suspendDurationMinutes,
      });
    }

    if (sessionRecord?.suspendedUntil && sessionRecord.suspendedUntil <= now) {
      await Promise.all([
        prisma.userSession.update({
          where: { id: user.id },
          data: { suspendedUntil: null },
        }),
        prisma.profile.update({
          where: { id: user.id },
          data: { status: "active" },
        }),
      ]);
    }

    const activeSessions = keepRecentSessions(parseSessionEntries(sessionRecord?.activeSessions));
    
    // Jika tidak ada sessions di database, atau token tidak ditemukan,
    // jangan langsung suspend - cek dulu apakah ini adalah session baru yang valid
    // User masih punya token valid dari Supabase, jadi tetap allow akses
    if (activeSessions.length === 0) {
      // Ini kemungkinan session pertama atau sessions sudah expired dari database
      // Tapi user masih memiliki token valid dari Supabase, jadi allow akses
      console.log("[SESSION-STATUS] No active sessions in DB, but user has valid Supabase token - allow access");
      return NextResponse.json({ 
        status: "ok",
        suspendDurationMinutes,
      });
    }

    const hasCurrentToken = activeSessions.some((session) => session.token === accessToken);

    if (!hasCurrentToken) {
      // Token tidak ditemukan di db, tapi masih valid di Supabase
      // Ini bisa berarti: session baru, atau sessions di db sudah cleanup tapi Supabase cookie masih valid
      // IMPORTANT: Jangan suspend user hanya karena token tidak ada di db
      // User harus login ulang via /api/auth/login untuk refresh sessions mereka
      console.log("[SESSION-STATUS] Current token not in DB sessions, checking if user needs refresh");
      
      // Silakan tetap allow akses, tapi session perlu refresh pada login berikutnya
      return NextResponse.json({ 
        status: "ok",
        suspendDurationMinutes,
      });
    }

    return NextResponse.json({ 
      status: "ok",
      suspendDurationMinutes,
    });
  } catch (error) {
    console.error("Session status check error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
