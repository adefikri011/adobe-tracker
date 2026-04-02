import { prisma } from "@/lib/prisma";

async function checkSuspensions() {
  try {
    console.log("🔍 CHECKING ALL USER SESSIONS...\n");

    const allSessions = await prisma.userSession.findMany({
      take: 20,
    });

    console.log(`Found ${allSessions.length} sessions:\n`);

    for (const session of allSessions) {
      console.log(`ID: ${session.id}`);
      console.log(`  suspendedUntil: ${session.suspendedUntil || "NULL"}`);
      console.log(`  activeSessions: ${JSON.stringify(session.activeSessions).substring(0, 100)}...`);
      console.log();
    }

    // Also check Profile statuses
    console.log("\n📋 CHECKING PROFILE STATUSES:\n");

    const profilesWithSuspended = await prisma.profile.findMany({
      where: {
        status: "suspended",
      },
      select: {
        id: true,
        email: true,
        status: true,
        deviceLimit: true,
      },
    });

    console.log(`Profiles with suspended status: ${profilesWithSuspended.length}\n`);

    profilesWithSuspended.forEach((p) => {
      console.log(`  ${p.email || p.id} - status=${p.status}, deviceLimit=${p.deviceLimit}`);
    });
  } catch (error) {
    console.error("❌ ERROR:", error);
  }
}

checkSuspensions();
