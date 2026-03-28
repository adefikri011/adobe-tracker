import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    if (!sessionRecord?.activeSessionId) {
      await supabase.auth.signOut();

      return NextResponse.json({
        status: "session_revoked",
      });
    }

    if (sessionRecord.activeSessionId !== accessToken) {
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
