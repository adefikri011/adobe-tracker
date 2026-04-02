import { prisma } from "@/lib/prisma";

async function fixDeviceLimits() {
  try {
    console.log("📋 FETCHING PLANS...");
    const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });

    console.log("\n📋 PLANS SEBELUM PERBAIKAN:");
    plans.forEach((p) => {
      console.log(
        `  ${p.name} (${p.slug}) - $${p.price} - ${p.durationDays}d - Device Limit: ${p.deviceLimit}`
      );
    });

    console.log("\n⚙️  FIXING DEVICE LIMITS...\n");

    const updates: any[] = [];

    for (const plan of plans) {
      let newLimit = plan.deviceLimit;
      const nameL = plan.name.toLowerCase();
      const slugL = plan.slug.toLowerCase();

      // Auto-assign based on plan characteristics
      if (nameL.includes("free") || slugL.includes("free")) {
        newLimit = 1;
      } else if (nameL.includes("30") || slugL.includes("30")) {
        newLimit = 3;
      } else if (nameL.includes("15") || slugL.includes("15")) {
        newLimit = 2;
      } else if (nameL.includes("14") || slugL.includes("14")) {
        newLimit = 2;
      } else if (nameL.includes("7") || slugL.includes("7")) {
        newLimit = 1;
      } else if (nameL.includes("3") || slugL.includes("3")) {
        newLimit = 1;
      } else if (nameL.includes("pro") || slugL.includes("pro")) {
        newLimit = plan.price > 10 ? 3 : 2;
      }

      if (newLimit !== plan.deviceLimit) {
        updates.push({ id: plan.id, old: plan.deviceLimit, new: newLimit });
        await prisma.plan.update({
          where: { id: plan.id },
          data: { deviceLimit: newLimit },
        });
        console.log(`  ✅ ${plan.name}: ${plan.deviceLimit} → ${newLimit}`);

        // Auto-sync all users with active subscriptions to this plan
        const activeSubs = await prisma.subscription.findMany({
          where: {
            planId: plan.id,
            status: "active",
            endDate: { gt: new Date() },
          },
          select: { profileId: true },
        });

        if (activeSubs.length > 0) {
          const profileIds = activeSubs.map((s) => s.profileId);
          await prisma.profile.updateMany({
            where: { id: { in: profileIds } },
            data: { deviceLimit: newLimit },
          });
          console.log(`     └─ Synced to ${activeSubs.length} active subscribers`);
        }
      }
    }

    console.log("\n📋 PLANS SETELAH PERBAIKAN:");
    const plansAfter = await prisma.plan.findMany({ orderBy: { price: "asc" } });
    plansAfter.forEach((p) => {
      console.log(
        `  ${p.name} (${p.slug}) - $${p.price} - ${p.durationDays}d - Device Limit: ${p.deviceLimit}`
      );
    });

    console.log(`\n🎉 TOTAL UPDATED: ${updates.length} plans`);
    console.log("\n✅ All done!");
  } catch (error) {
    console.error("❌ ERROR:", error);
  }
}

fixDeviceLimits();
