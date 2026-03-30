import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GLOBAL_POLICY_ID = "__GLOBAL_DEVICE_POLICY__";
const DEFAULT_SUSPEND_MINUTES = 5;

type SessionEntry = {
  token: string;
  device: string;
  deviceKey: string;
  createdAt: string;
};

type PolicyPayload = {
  maxDevices?: number;
  suspendMinutes?: number;
};

function normalizeDeviceKey(userAgent: string) {
  if (!userAgent || typeof userAgent !== "string") {
    return "unknown-device";
  }

  // Extract browser name & version
  let browserName = "unknown";
  let browserVersion = "";
  
  if (userAgent.includes("Chrome/")) {
    browserName = "chrome";
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) {
    browserName = "safari";
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes("Firefox/")) {
    browserName = "firefox";
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes("Edg/")) {
    browserName = "edge";
    const match = userAgent.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  }

  // Extract OS (major version only)
  let osName = "unknown-os";
  
  if (userAgent.includes("Windows")) {
    osName = "windows";
  } else if (userAgent.includes("Macintosh")) {
    osName = "mac";
  } else if (userAgent.includes("Linux")) {
    osName = "linux";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    osName = "ios";
  } else if (userAgent.includes("Android")) {
    osName = "android";
  }

  // Combine: browser-major-version + os (ignore incognito/minor details)
  return `${browserName}-${browserVersion || "0"}-${osName}`.toLowerCase();
}

function getGlobalPolicy(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      maxDevices: null as number | null,
      suspendMinutes: DEFAULT_SUSPEND_MINUTES,
    };
  }

  const policy = raw as PolicyPayload;
  const maxDevices =
    typeof policy.maxDevices === "number" ? Math.max(1, Math.floor(policy.maxDevices)) : null;
  const suspendMinutes =
    typeof policy.suspendMinutes === "number"
      ? Math.max(1, Math.floor(policy.suspendMinutes))
      : DEFAULT_SUSPEND_MINUTES;

  return { maxDevices, suspendMinutes };
}

function parseSessionEntries(raw: unknown): SessionEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const item = entry as Partial<SessionEntry>;
      const token = typeof item.token === "string" ? item.token : "";
      const device = typeof item.device === "string" ? item.device : "Unknown Device";
      const createdAt = typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString();
      const deviceKey =
        typeof item.deviceKey === "string" && item.deviceKey.length > 0
          ? item.deviceKey
          : normalizeDeviceKey(device);

      return { token, device, createdAt, deviceKey };
    })
    .filter((entry) => entry.token.length > 0);
}

function keepRecentSessions(sessions: SessionEntry[]) {
  const cutoffMs = 30 * 24 * 60 * 60 * 1000;
  return sessions.filter((session) => {
    const createdMs = new Date(session.createdAt).getTime();
    if (Number.isNaN(createdMs)) {
      return false;
    }

    return Date.now() - createdMs < cutoffMs;
  });
}

function dedupeByDevice(sessions: SessionEntry[]) {
  const latestByDevice = new Map<string, SessionEntry>();

  for (const session of sessions) {
    const existing = latestByDevice.get(session.deviceKey);
    if (!existing) {
      latestByDevice.set(session.deviceKey, session);
      continue;
    }

    const currentTime = new Date(session.createdAt).getTime();
    const existingTime = new Date(existing.createdAt).getTime();
    if (!Number.isNaN(currentTime) && (Number.isNaN(existingTime) || currentTime > existingTime)) {
      latestByDevice.set(session.deviceKey, session);
    }
  }

  return Array.from(latestByDevice.values());
}

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
      const userAgent = request.headers.get("user-agent") || "Unknown Device";
      const currentDeviceKey = normalizeDeviceKey(userAgent);

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
            status: "active",
            deviceLimit: 1,
          },
          select: { role: true, status: true, deviceLimit: true },
        });
      } catch (profileError) {
        console.error("❌ Profile Error:", profileError);
      }

      let profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { role: true, status: true, deviceLimit: true },
      });

      if (!profile) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=profile_not_found`);
      }

      const globalPolicyRow = await prisma.userSession.findUnique({
        where: { id: GLOBAL_POLICY_ID },
        select: { activeSessions: true },
      });
      const globalPolicy = getGlobalPolicy(globalPolicyRow?.activeSessions);
      const suspendDurationMinutes = globalPolicy.suspendMinutes;

      let existingSession = await prisma.userSession.findUnique({
        where: { id: userId },
      });

      if (existingSession?.suspendedUntil && existingSession.suspendedUntil <= new Date()) {
        await Promise.all([
          prisma.profile.update({
            where: { id: userId },
            data: { status: "active" },
          }),
          prisma.userSession.update({
            where: { id: userId },
            data: { suspendedUntil: null },
          }),
        ]);

        const [freshProfile, freshSession] = await Promise.all([
          prisma.profile.findUnique({
            where: { id: userId },
            select: { role: true, status: true, deviceLimit: true },
          }),
          prisma.userSession.findUnique({ where: { id: userId } }),
        ]);

        if (freshProfile) {
          profile = freshProfile;
        }
        existingSession = freshSession;
      }

      if (existingSession?.suspendedUntil && existingSession.suspendedUntil > new Date()) {
        await supabase.auth.signOut();
        const diffMs = existingSession.suspendedUntil.getTime() - Date.now();
        const diffMin = Math.max(1, Math.ceil(diffMs / 60000));
        return NextResponse.redirect(`${origin}/login?error=suspended&minutes=${diffMin}`);
      }

      if (profile.status === "suspended") {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=suspended&minutes=${suspendDurationMinutes}`);
      }

      const parsedSessions = parseSessionEntries(existingSession?.activeSessions);
      const recentSessions = keepRecentSessions(parsedSessions);
      const uniqueSessions = dedupeByDevice(recentSessions);

      const perUserLimit = Math.max(1, profile.deviceLimit || 1);
      const deviceLimit = globalPolicy.maxDevices ?? perUserLimit;
      const existingDeviceIndex = uniqueSessions.findIndex((session) => session.deviceKey === currentDeviceKey);

      if (existingDeviceIndex === -1 && uniqueSessions.length >= deviceLimit) {
        const suspendUntil = new Date(Date.now() + suspendDurationMinutes * 60 * 1000);

        await Promise.all([
          prisma.profile.update({
            where: { id: userId },
            data: { status: "suspended" },
          }),
          prisma.userSession.upsert({
            where: { id: userId },
            update: {
              activeSessions: [],
              suspendedUntil: suspendUntil,
            },
            create: {
              id: userId,
              activeSessions: [],
              suspendedUntil: suspendUntil,
            },
          }),
        ]);

        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=double_login&minutes=${suspendDurationMinutes}`);
      }

      const newSession: SessionEntry = {
        token,
        device: userAgent,
        deviceKey: currentDeviceKey,
        createdAt: new Date().toISOString(),
      };

      const updatedSessions = [...uniqueSessions];
      if (existingDeviceIndex >= 0) {
        updatedSessions[existingDeviceIndex] = newSession;
      } else {
        updatedSessions.push(newSession);
      }

      try {
        await prisma.userSession.upsert({
          where: { id: userId },
          update: { activeSessions: updatedSessions, suspendedUntil: null },
          create: { id: userId, activeSessions: [newSession], suspendedUntil: null },
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