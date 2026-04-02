import { prisma } from "@/lib/prisma";

async function verifySync() {
  try {
    console.log("🔍 VERIFYING DEVICE LIMIT SYNC...\n");

    // Get all users with active subscriptions
    const activeStubs = await prisma.subscription.findMany({
      where: {
        status: "active",
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        profile: true,
        plan: true,
      },
    });

    console.log(`Found ${activeStubs.length} active subscriptions:\n`);

    for (const sub of activeStubs) {
      const expectedLimit = sub.plan.deviceLimit;
      const actualLimit = sub.profile.deviceLimit;
      const status =
        expectedLimit === actualLimit ? "✅" : "❌";

      console.log(
        `${status} ${sub.profile.email || sub.profile.fullName || sub.profile.id}`
      );
      console.log(
        `   Plan: ${sub.plan.name} (expected: ${expectedLimit}, actual: ${actualLimit})`
      );

      if (expectedLimit !== actualLimit) {
        console.log(
          `   ⚠️  MISMATCH! Updating user device limit from ${actualLimit} to ${expectedLimit}...`
        );
        await prisma.profile.update({
          where: { id: sub.profile.id },
          data: { deviceLimit: expectedLimit },
        });
        console.log(`   ✅ Fixed!`);
      }
      console.log();
    }

    console.log("🎉 Verification complete!");
  } catch (error) {
    console.error("❌ ERROR:", error);
  }
}

verifySync();
