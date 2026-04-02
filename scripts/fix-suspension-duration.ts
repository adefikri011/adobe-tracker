import { prisma } from "@/lib/prisma";

async function fixSuspensionDuration() {
  try {
    console.log("🔧 FIXING SUSPENSION DURATION & STATUS CONSISTENCY...\n");

    // Get suspended users
    const suspendedSessions = await prisma.userSession.findMany({
      where: {
        suspendedUntil: {
          not: null,
        },
      },
    });

    console.log(`Found ${suspendedSessions.length} suspended sessions\n`);

    // Get current suspension duration from AppSettings
    const appSettings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
      select: { suspendDurationMinutes: true },
    });

    const suspendDurationMinutes = appSettings?.suspendDurationMinutes || 1;
    console.log(`Current suspend duration from AppSettings: ${suspendDurationMinutes} minute(s)\n`);

    const fixes: any[] = [];

    for (const session of suspendedSessions) {
      const userId = session.id;
      if (userId === "__GLOBAL_DEVICE_POLICY__") continue; // Skip global policy

      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { id: true, email: true, status: true },
      });

      if (!profile) continue;

      // Update suspension end time based on current AppSettings
      const newSuspendedUntil = new Date(
        Date.now() + suspendDurationMinutes * 60 * 1000
      );

      // Check if suspension time expired
      const now = new Date();
      let shouldUnsuspend = false;
      if (session.suspendedUntil && session.suspendedUntil <= now) {
        shouldUnsuspend = true;
      }

      if (shouldUnsuspend) {
        // Unsuspend user
        console.log(
          `✅ ${profile.email || profile.id} - Suspension EXPIRED, unsuspending...`
        );
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
        fixes.push({
          email: profile.email,
          action: "UNSUSPENDED (expired)",
        });
      } else {
        // Verify profile status is "suspended"
        if (profile.status !== "suspended") {
          console.log(
            `⚠️  ${profile.email || profile.id} - Status MISMATCH: Profile=${profile.status}, should be suspended`
          );
          await prisma.profile.update({
            where: { id: userId },
            data: { status: "suspended" },
          });
          console.log(`   ✅ Fixed profile status to "suspended"`);
        }

        // Keep suspension with updated duration
        console.log(
          `🔄 ${profile.email || profile.id} - Keeping suspension for full ${suspendDurationMinutes} minute(s)`
        );
        console.log(
          `   Previous end: ${session.suspendedUntil?.toISOString()}`
        );
        console.log(
          `   New end: ${newSuspendedUntil.toISOString()}`
        );

        await prisma.userSession.update({
          where: { id: userId },
          data: { suspendedUntil: newSuspendedUntil },
        });

        fixes.push({
          email: profile.email,
          action: `UPDATED suspension to ${suspendDurationMinutes} min`,
          newUntil: newSuspendedUntil.toISOString(),
        });
      }
    }

    console.log("\n📋 FIXES APPLIED:");
    fixes.forEach((fix) => {
      if (fix.newUntil) {
        console.log(`  ${fix.email} - ${fix.action} (${fix.newUntil})`);
      } else {
        console.log(`  ${fix.email} - ${fix.action}`);
      }
    });

    console.log(`\n🎉 Fixed ${fixes.length} suspensions!`);
  } catch (error) {
    console.error("❌ ERROR:", error);
  }
}

fixSuspensionDuration();
