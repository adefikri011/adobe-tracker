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
    const hasCurrentToken = activeSessions.some((session) => session.token === accessToken);

    if (!hasCurrentToken) {
      const suspendedUntil = new Date(Date.now() + suspendDurationMinutes * 60 * 1000);
      const diffMs = suspendedUntil.getTime() - now.getTime();
      const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));
      const minutesLeft = Math.ceil(diffMs / 60000);

      await Promise.all([
        prisma.profile.update({
          where: { id: user.id },
          data: { status: "suspended" },
        }),
        prisma.userSession.upsert({
          where: { id: user.id },
          update: {
            activeSessions: [],
            suspendedUntil,
          },
          create: {
            id: user.id,
            activeSessions: [],
            suspendedUntil,
          },
        }),
      ]);

      await supabase.auth.signOut();

      return NextResponse.json({
        status: "suspended",
        secondsLeft,
        minutesLeft,
        suspendedUntil: suspendedUntil.toISOString(),
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
