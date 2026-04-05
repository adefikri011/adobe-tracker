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

function parseDeviceInfo(userAgent: string): string {
  if (!userAgent) return 'Unknown Device';

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Parse browser
  if (userAgent.includes('Chrome/')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    browser = `Chrome ${match?.[1] || ''}`.trim();
  } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    browser = `Safari ${match?.[1] || ''}`.trim();
  } else if (userAgent.includes('Firefox/')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    browser = `Firefox ${match?.[1] || ''}`.trim();
  } else if (userAgent.includes('Edg/')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    browser = `Edge ${match?.[1] || ''}`.trim();
  }

  // Parse OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Macintosh')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('iPhone')) {
    os = 'iOS';
  } else if (userAgent.includes('iPad')) {
    os = 'iPadOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  }

  return `${browser} / ${os}`;
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
    // Skip invalid device keys
    if (session.deviceKey === "unknown-device" || session.deviceKey === "unknown-0-unknown-os") {
      console.log("[CALLBACK] Skipping invalid device key:", session.deviceKey);
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  // GUNAKAN INI: Ambil origin langsung dari URL yang sedang diakses
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || requestUrl.origin;

  if (code) {
    const supabase = await createServerSupabaseClient();

    // Tukar kode dengan session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth Error:", error.message);

      // Log failed login attempt
      try {
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('remoteAddress') ||
          'unknown';
        const userAgent = request.headers.get('user-agent') || 'Unknown Device';
        const device = parseDeviceInfo(userAgent);

        await prisma.loginLog.create({
          data: {
            email: 'unknown@failed.local',
            status: 'failed',
            ipAddress: ipAddress.trim(),
            device,
          },
        }).catch(() => {
          // Ignore if loginLog creation fails
        });
      } catch (logError) {
        console.error('Failed to create failed login log:', logError);
      }

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

      // Read app settings which contains the admin-configured device limits
      const appSettings = await prisma.appSettings.findUnique({
        where: { id: "singleton" },
        select: {
          globalMaxDevices: true,
          suspendDurationMinutes: true,
        },
      });

      console.log("[CALLBACK] AppSettings from DB:", appSettings);

      const globalMaxDevices = appSettings?.globalMaxDevices || null;
      const suspendDurationMinutes = appSettings?.suspendDurationMinutes || DEFAULT_SUSPEND_MINUTES;

      console.log("[CALLBACK] Using suspendDurationMinutes:", suspendDurationMinutes, "DEFAULT_SUSPEND_MINUTES:", DEFAULT_SUSPEND_MINUTES);

      // Fetch current user session
      let existingSession = await prisma.userSession.findUnique({
        where: { id: userId },
      });

      // SUSPENSION CHECK (FIRST & STRICT): If suspendedUntil > now, REJECT immediately - no exceptions
      const now = new Date();
      if (existingSession?.suspendedUntil && existingSession.suspendedUntil > now) {
        if (profile.status !== "suspended") {
          await prisma.profile.update({
            where: { id: userId },
            data: { status: "suspended" },
          });
        }

        console.log("[CALLBACK] 🚫 BLOCKED - Account still suspended, cannot login");
        await supabase.auth.signOut();
        const diffMs = existingSession.suspendedUntil.getTime() - now.getTime();
        const diffMin = Math.max(1, Math.ceil(diffMs / 60000));
        return NextResponse.redirect(`${origin}/login?error=suspended_ban&minutes=${diffMin}`);
      }

      // Auto-clear suspension if expired
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

      if (profile.status === "suspended") {
        // Log failed login due to suspension
        try {
          const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('remoteAddress') ||
            'unknown';
          const device = parseDeviceInfo(userAgent);

          await prisma.loginLog.create({
            data: {
              profileId: userId,
              email: data.user.email || 'unknown',
              status: 'failed',
              ipAddress: ipAddress.trim(),
              device,
            },
          }).catch(() => {
            // Ignore if loginLog creation fails
          });
        } catch (logError) {
          console.error('Failed to create failed login log:', logError);
        }

        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=suspended_ban&minutes=${suspendDurationMinutes}`);
      }

      const parsedSessions = parseSessionEntries(existingSession?.activeSessions);
      console.log("[CALLBACK] Parsed Sessions:", parsedSessions.length, parsedSessions.map(s => s.deviceKey));

      const recentSessions = keepRecentSessions(parsedSessions);
      console.log("[CALLBACK] Recent Sessions (30 days):", recentSessions.length, recentSessions.map(s => s.deviceKey));

      const uniqueSessions = dedupeByDevice(recentSessions);
      console.log("[CALLBACK] Unique Sessions (after dedup):", uniqueSessions.length, uniqueSessions.map(s => s.deviceKey));
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
      const existingDeviceIndex = uniqueSessions.findIndex((session) => session.deviceKey === currentDeviceKey);

      // DEBUG: Log untuk troubleshoot
      console.log("=== CALLBACK DEBUG ===");
      console.log("Email:", data.user.email);
      console.log("Suspend Duration Minutes:", suspendDurationMinutes);
      console.log("Device Limit:", deviceLimit);
      console.log("Unique Sessions Count:", uniqueSessions.length);
      console.log("Existing Device Index:", existingDeviceIndex);
      console.log("===================");

      if (existingDeviceIndex === -1 && uniqueSessions.length >= deviceLimit) {
        const suspendUntil = new Date(Date.now() + suspendDurationMinutes * 60 * 1000);

        console.log("[CALLBACK] 🔒 SUSPENDING - New device beyond limit");
        console.log("[CALLBACK] Suspend until:", suspendUntil.toISOString());

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

        console.log("[CALLBACK] ✅ Profile status = suspended, UserSession.suspendedUntil = set");

        // Log failed login due to multiple devices
        try {
          const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('remoteAddress') ||
            'unknown';
          const device = parseDeviceInfo(userAgent);

          await prisma.loginLog.create({
            data: {
              profileId: userId,
              email: data.user.email || 'unknown',
              status: 'failed',
              ipAddress: ipAddress.trim(),
              device,
            },
          }).catch(() => {
            // Ignore if loginLog creation fails
          });
        } catch (logError) {
          console.error('Failed to create failed login log:', logError);
        }

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

      console.log("[CALLBACK] Updated Sessions to save:", updatedSessions.length, updatedSessions.map(s => s.deviceKey));

      try {
        // Update both session and profile status to active (if no suspension) to keep db in sync
        await Promise.all([
          prisma.userSession.upsert({
            where: { id: userId },
            update: { activeSessions: updatedSessions, suspendedUntil: null },
            create: { id: userId, activeSessions: [newSession], suspendedUntil: null },
          }),
          prisma.profile.update({
            where: { id: userId },
            data: { status: "active" },
          }),
        ]);
        console.log("[CALLBACK] ✅ Callback login successful - session updated and status cleared");
      } catch (dbError) {
        console.error("Database Error:", dbError);
        return NextResponse.redirect(`${origin}/login?error=database_error`);
      }

      // Log successful login
      try {
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('remoteAddress') ||
          'unknown';
        const device = parseDeviceInfo(userAgent);

        await prisma.loginLog.create({
          data: {
            profileId: userId,
            email: data.user.email || 'unknown',
            status: 'success',
            ipAddress: ipAddress.trim(),
            device,
          },
        });
      } catch (logError) {
        console.error('Failed to create login log:', logError);
        // Don't fail login if logging fails
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