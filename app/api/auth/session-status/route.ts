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
    const [{ data: userData }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);

    const user = userData.user;
    const accessToken = sessionData.session?.access_token;

    if (!user || !accessToken) {
      return NextResponse.json({ status: "unauthenticated" }, { status: 401 });
    }

    const sessionRecord = await prisma.userSession.findUnique({
      where: { id: user.id },
    });

    const now = new Date();

    if (sessionRecord?.suspendedUntil && sessionRecord.suspendedUntil > now) {
      const diffMs = sessionRecord.suspendedUntil.getTime() - now.getTime();
      const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));
      const minutesLeft = Math.ceil(diffMs / 60000);

      await supabase.auth.signOut();

      return NextResponse.json({
        status: "suspended",
        secondsLeft,
        minutesLeft,
        suspendedUntil: sessionRecord.suspendedUntil.toISOString(),
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
      await supabase.auth.signOut();

      return NextResponse.json({
        status: "session_revoked",
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Session status check error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
