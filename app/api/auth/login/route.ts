import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Note: Device policy is now managed via AppSettings instead of device-policy legacy endpoint

const DEFAULT_SUSPEND_MINUTES = 1; // Default fallback, should always read from AppSettings

type SessionEntry = {
  token: string;
  device: string;
  deviceKey: string;
  createdAt: string;
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

function parseSessionEntries(raw: unknown): SessionEntry[] {
  const rawArray = Array.isArray(raw) ? raw : [];
  return rawArray
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const item = entry as Partial<SessionEntry>;
      const device = typeof item.device === "string" ? item.device : "Unknown Device";
      const createdAt = typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString();
      const token = typeof item.token === "string" ? item.token : "";
      
      // Use stored deviceKey if it exists and looks normalized (contains "-")
      // Otherwise fallback to normalizing the full device user agent
      let deviceKey = "";
      if (typeof item.deviceKey === "string" && item.deviceKey.length > 0 && item.deviceKey.includes("-")) {
        // Already normalized from previous sessions
        deviceKey = item.deviceKey;
      } else if (typeof item.device === "string") {
        // Need to normalize from full user agent
        deviceKey = normalizeDeviceKey(item.device);
      } else {
        deviceKey = "unknown-device";
      }

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
  const filtered = sessions.filter((session) => {
    const createdMs = new Date(session.createdAt).getTime();
    if (Number.isNaN(createdMs)) {
      return false;
    }

    const isRecent = Date.now() - createdMs < cutoffMs;
    if (!isRecent) {
      console.log("[LOGIN] Removing old session from:", new Date(session.createdAt).toISOString());
    }
    return isRecent;
  });
  
  return filtered;
}

function dedupeByDevice(sessions: SessionEntry[]) {
  const latestByDevice = new Map<string, SessionEntry>();

  for (const session of sessions) {
    // Skip invalid device keys
    if (session.deviceKey === "unknown-device" || session.deviceKey === "unknown-0-unknown-os") {
      console.log("[LOGIN] Skipping invalid device key:", session.deviceKey);
      continue;
    }

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

    // Load the account first so we can block suspended users before creating any auth session.
    const existingProfile = await prisma.profile.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    const existingSessionBeforeLogin = existingProfile
      ? await prisma.userSession.findUnique({ where: { id: existingProfile.id } })
      : null;

    const now = new Date();

    if (existingSessionBeforeLogin?.suspendedUntil && existingSessionBeforeLogin.suspendedUntil > now) {
      const diffMs = existingSessionBeforeLogin.suspendedUntil.getTime() - now.getTime();
      const diffMin = Math.max(1, Math.ceil(diffMs / 60000));

      if (existingProfile?.status !== "suspended") {
        const profileId = existingProfile?.id;
        if (profileId) {
        await prisma.profile.update({
          where: { id: profileId },
          data: { status: "suspended" },
        });
        }
      }

      console.log("[LOGIN] 🚫 BLOCKED EARLY - Account still suspended, sign-in not attempted");
      return NextResponse.json({
        error: "SUSPENDED_BAN",
        message: `Your account is currently suspended ban. You cannot login until the suspension period ends. Please wait ${diffMin} more minute(s).`,
        minutesLeft: diffMin,
        suspendedUntil: existingSessionBeforeLogin.suspendedUntil.toISOString(),
      }, { status: 403 });
    }

    if (existingProfile?.status === "suspended") {
      console.log("[LOGIN] 🚫 BLOCKED EARLY - Profile is suspended, sign-in not attempted");
      return NextResponse.json({
        error: "SUSPENDED_BAN",
        message: "Your account is currently suspended ban. You cannot login until the suspension period ends.",
        suspendedUntil: existingSessionBeforeLogin?.suspendedUntil?.toISOString(),
      }, { status: 403 });
    }

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

    // Read app settings which contains the admin-configured device limits
    const appSettings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
      select: { 
        globalMaxDevices: true,
        suspendDurationMinutes: true,
      },
    });
    
    console.log("[LOGIN] AppSettings from DB:", appSettings);
    
    const globalMaxDevices = appSettings?.globalMaxDevices || null;
    const suspendDurationMinutes = appSettings?.suspendDurationMinutes || DEFAULT_SUSPEND_MINUTES;

    console.log("[LOGIN] Using suspendDurationMinutes:", suspendDurationMinutes, "DEFAULT_SUSPEND_MINUTES:", DEFAULT_SUSPEND_MINUTES);

    // SUSPENSION CHECK (FIRST & STRICT): If suspendedUntil > now, REJECT immediately - no exceptions
    if (sessionRecord?.suspendedUntil && sessionRecord.suspendedUntil > now) {
      await supabase.auth.signOut();

      const diffMs = sessionRecord.suspendedUntil.getTime() - now.getTime();
      const diffMin = Math.max(1, Math.ceil(diffMs / 60000));

      console.log("[LOGIN] 🚫 BLOCKED - Account still suspended, cannot login");
      return NextResponse.json({
        error: "SUSPENDED_BAN",
        message: `Your account is currently suspended ban. You cannot login until the suspension period ends. Please wait ${diffMin} more minute(s).`,
        minutesLeft: diffMin,
        suspendedUntil: sessionRecord.suspendedUntil.toISOString(),
      }, { status: 403 });
    }

    // 3. CEK APAKAH SUSPENSION TIME SUDAH EXPIRED (Auto-clear if safe)
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

    // 4. CEK APAKAH USER DALAM STATUS SUSPENDED (extra safety check)
    if (profile.status === "suspended") {
      await supabase.auth.signOut();

      const suspendMinutesLeft = sessionRecord?.suspendedUntil
        ? Math.max(1, Math.ceil((sessionRecord.suspendedUntil.getTime() - Date.now()) / 60000))
        : suspendDurationMinutes;

      return NextResponse.json({
        error: "SUSPENDED_BAN",
        message: "Your account is currently suspended ban. You cannot login until the suspension period ends. Please contact support for assistance.",
        minutesLeft: suspendMinutesLeft,
        suspendedUntil: sessionRecord?.suspendedUntil?.toISOString(),
      }, { status: 403 });
    }

    // 6. CEK DEVICE LIMIT - hitung berdasarkan UNIQUE DEVICE
    const parsedSessions = parseSessionEntries(sessionRecord?.activeSessions);
    console.log("[LOGIN] Parsed Sessions:", parsedSessions.length, parsedSessions.map(s => s.deviceKey));
    
    const recentSessions = keepRecentSessions(parsedSessions);
    console.log("[LOGIN] Recent Sessions (30 days):", recentSessions.length, recentSessions.map(s => s.deviceKey));
    
    const uniqueSessions = dedupeByDevice(recentSessions);
    console.log("[LOGIN] Unique Sessions (after dedup):", uniqueSessions.length, uniqueSessions.map(s => s.deviceKey));
    
    // Check jika currentToken sudah ada di activeSessions (user login ulang dengan device lama)
    const tokenAlreadyExists = uniqueSessions.some(session => session.token === currentToken);
    console.log("[LOGIN] Token already exists in sessions:", tokenAlreadyExists);

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        profileId: userId,
        status: "active",
        endDate: {
          gt: now,
        },
      },
      select: {
        plan: {
          select: {
            deviceLimit: true,
          },
        },
      },
      orderBy: {
        endDate: "desc",
      },
    });

    const perUserLimit = Math.max(1, profile.deviceLimit || 1);
    const activePlanLimit = activeSubscription?.plan?.deviceLimit
      ? Math.max(1, activeSubscription.plan.deviceLimit)
      : null;

    // Priority: active non-expired plan > global setting > per-user fallback.
    const deviceLimit = activePlanLimit ?? globalMaxDevices ?? perUserLimit;

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
    console.log("Suspend Duration Minutes:", suspendDurationMinutes);
    console.log("All Session Device Keys:", uniqueSessions.map(s => s.deviceKey));
    console.log("Token Already Exists:", tokenAlreadyExists);
    console.log("===================");

    // Jika token sudah ada di sistem, ini adalah re-login dari device yang sama - JANGAN suspend
    // Hanya anggap sebagai NEW device jika:
    // 1. Token TIDAK ada di history
    // 2. Device key TIDAK ada di history 
    // 3. Sudah mencapai device limit
    if (
      !tokenAlreadyExists && 
      existingDeviceIndex === -1 && 
      uniqueSessions.length >= deviceLimit
    ) {
      const suspendTime = new Date(Date.now() + suspendDurationMinutes * 60 * 1000);

      console.log("[LOGIN] 🔒 SUSPENDING - New device beyond limit");
      console.log("[LOGIN] Suspend until:", suspendTime.toISOString());

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

      console.log("[LOGIN] ✅ Profile status = suspended, UserSession.suspendedUntil = set");

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

    console.log("[LOGIN] Updated Sessions to save:", updatedSessions.length, updatedSessions.map(s => s.deviceKey));

    // Update both session and profile status to active (if no suspension) to keep db in sync
    await Promise.all([
      prisma.userSession.upsert({
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
      }),
      prisma.profile.update({
        where: { id: userId },
        data: { status: "active" },
      }),
    ]);

    console.log("[LOGIN] ✅ Login successful - session updated and status cleared");

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