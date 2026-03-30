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
  const rawArray = Array.isArray(raw) ? raw : [];
  return rawArray
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const item = entry as Partial<SessionEntry>;
      const device = typeof item.device === "string" ? item.device : "Unknown Device";
      const createdAt = typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString();
      const token = typeof item.token === "string" ? item.token : "";
      
      // PENTING: Selalu re-normalize deviceKey saat parse dari DB
      // Karena session lama mungkin punya deviceKey yang belum normalized
      const rawDeviceKey =
        typeof item.deviceKey === "string" && item.deviceKey.length > 0
          ? item.deviceKey
          : device;
      const deviceKey = normalizeDeviceKey(rawDeviceKey);

      return {
        token,
        device,
        deviceKey,
        createdAt,
      };
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
    let profile = await prisma.profile.upsert({
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
        status: "active",
        deviceLimit: 1,
      },
      select: {
        role: true,
        status: true,
        deviceLimit: true,
      },
    });

    // 2. CEK STATUS DI PRISMA (DATABASE)
    let sessionRecord = await prisma.userSession.findUnique({
      where: { id: userId },
    });

    const globalPolicyRow = await prisma.userSession.findUnique({
      where: { id: GLOBAL_POLICY_ID },
      select: { activeSessions: true },
    });
    const globalPolicy = getGlobalPolicy(globalPolicyRow?.activeSessions);
    const suspendDurationMinutes = globalPolicy.suspendMinutes;

    // 3. CEK APAKAH SUSPENSION TIME SUDAH EXPIRED
    if (sessionRecord?.suspendedUntil && sessionRecord.suspendedUntil <= new Date()) {
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

      const [freshProfile, freshSessionRecord] = await Promise.all([
        prisma.profile.findUnique({
          where: { id: userId },
          select: {
            role: true,
            status: true,
            deviceLimit: true,
          },
        }),
        prisma.userSession.findUnique({ where: { id: userId } }),
      ]);

      if (freshProfile) {
        profile = freshProfile;
      }

      sessionRecord = freshSessionRecord;
    }

    // 4. CEK APAKAH USER DALAM STATUS SUSPENDED (Belum Expired)
    if (profile.status === "suspended") {
      await supabase.auth.signOut();

      const suspendMinutesLeft = sessionRecord?.suspendedUntil
        ? Math.max(1, Math.ceil((sessionRecord.suspendedUntil.getTime() - Date.now()) / 60000))
        : suspendDurationMinutes;

      return NextResponse.json({
        error: "SUSPENDED_ACCOUNT",
        message: "Your account has been suspended due to unauthorized access attempts. Please contact support for assistance.",
        minutesLeft: suspendMinutesLeft,
        suspendedUntil: sessionRecord?.suspendedUntil?.toISOString(),
      }, { status: 403 });
    }

    // 5. CEK APAKAH SEDANG DALAM MASA SUSPEND (Extra Check)
    if (sessionRecord?.suspendedUntil && sessionRecord.suspendedUntil > new Date()) {
      await supabase.auth.signOut();

      const diffMs = sessionRecord.suspendedUntil.getTime() - Date.now();
      const diffMin = Math.max(1, Math.ceil(diffMs / 60000));

      return NextResponse.json({
        error: "SUSPENDED",
        message: `Account is currently suspended due to exceeding device limit. Please wait ${diffMin} more minutes.`,
        minutesLeft: diffMin,
        suspendedUntil: sessionRecord.suspendedUntil.toISOString(),
      }, { status: 403 });
    }

    // 6. CEK DEVICE LIMIT - hitung berdasarkan UNIQUE DEVICE
    const parsedSessions = parseSessionEntries(sessionRecord?.activeSessions);
    const recentSessions = keepRecentSessions(parsedSessions);
    const uniqueSessions = dedupeByDevice(recentSessions);

    // Jika admin set global maxDevices, pakai untuk semua user
    const perUserLimit = Math.max(1, profile.deviceLimit || 1);
    const deviceLimit = globalPolicy.maxDevices ?? perUserLimit;

    const userAgent = req.headers.get("user-agent") || "Unknown Device";
    const currentDeviceKey = normalizeDeviceKey(userAgent);
    const existingDeviceIndex = uniqueSessions.findIndex((session) => session.deviceKey === currentDeviceKey);

    // DEBUG: Log untuk troubleshoot unique device logic
    console.log("=== LOGIN DEBUG ===");
    console.log("Email:", email);
    console.log("Raw UserAgent:", userAgent);
    console.log("Normalized DeviceKey:", currentDeviceKey);
    console.log("Existing Device Index:", existingDeviceIndex);
    console.log("Unique Sessions Count:", uniqueSessions.length);
    console.log("Device Limit:", deviceLimit);
    console.log("All Session Device Keys:", uniqueSessions.map(s => s.deviceKey));
    console.log("===================");

    if (existingDeviceIndex === -1 && uniqueSessions.length >= deviceLimit) {
      const suspendTime = new Date(Date.now() + suspendDurationMinutes * 60 * 1000);

      await Promise.all([
        prisma.profile.update({
          where: { id: userId },
          data: { status: "suspended" },
        }),
        prisma.userSession.upsert({
          where: { id: userId },
          update: {
            activeSessions: [],
            suspendedUntil: suspendTime,
          },
          create: {
            id: userId,
            activeSessions: [],
            suspendedUntil: suspendTime,
          },
        }),
      ]);

      await supabase.auth.signOut();

      return NextResponse.json({
        error: "DOUBLE_LOGIN",
        message: `Device limit exceeded! You've reached the maximum of ${deviceLimit} device(s). Account suspended for ${suspendDurationMinutes} minute(s) for security.`,
        minutesLeft: suspendDurationMinutes,
        suspendedUntil: suspendTime.toISOString(),
      }, { status: 403 });
    }

    // 7. LOGIN BERHASIL - Update session device saat ini
    const newSession: SessionEntry = {
      token: currentToken,
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

    await prisma.userSession.upsert({
      where: { id: userId },
      update: {
        activeSessions: updatedSessions,
        suspendedUntil: null,
      },
      create: {
        id: userId,
        activeSessions: [newSession],
        suspendedUntil: null,
      },
    });

    const redirectTo = profile.role === "admin" ? "/admin" : "/dashboard";

    return NextResponse.json({
      success: true,
      role: profile.role,
      redirectTo,
    });

  } catch (err) {
    console.error("Login Error:", err);
    return NextResponse.json({
      error: "SERVER_ERROR",
      message: "An error occurred on the server."
    }, { status: 500 });
  }
}