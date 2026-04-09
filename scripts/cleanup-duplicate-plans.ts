import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment variables
loadEnvConfig(process.cwd());

// Create Prisma client with adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning up duplicate plans...");

  // Get all plans
  const allPlans = await prisma.plan.findMany({
    orderBy: [{ slug: "asc" }, { createdAt: "asc" }],
  });

  console.log(`Found ${allPlans.length} total plans`);

  // Group by slug
  const plansBySlug: Record<string, any[]> = {};
  allPlans.forEach((plan) => {
    if (!plansBySlug[plan.slug]) {
      plansBySlug[plan.slug] = [];
    }
    plansBySlug[plan.slug].push(plan);
  });

  // Delete duplicates (keep only the latest)
  let deletedCount = 0;
  for (const [slug, plans] of Object.entries(plansBySlug)) {
    if (plans.length > 1) {
      console.log(`\n📋 Plan slug: "${slug}" has ${plans.length} entries`);
      // Sort by createdAt, delete oldest ones
      plans.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Keep the newest, delete the rest
      for (let i = 0; i < plans.length - 1; i++) {
        const toDelete = plans[i];
        console.log(`  ❌ Deleting old entry: ${toDelete.id} (created: ${toDelete.createdAt})`);
        
        // Delete related records first
        await prisma.subscription.deleteMany({
          where: { planId: toDelete.id },
        });
        
        await prisma.transaction.deleteMany({
          where: { planId: toDelete.id },
        });

        // Delete the plan
        await prisma.plan.delete({
          where: { id: toDelete.id },
        });
        
        deletedCount++;
      }

      // Show the one we kept
      const kept = plans[plans.length - 1];
      console.log(`  ✅ Keeping: ${kept.id} (created: ${kept.createdAt}) - maxSearches: ${kept.maxSearches}`);
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate plans`);

  // Show final state
  const finalPlans = await prisma.plan.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      maxSearches: true,
      deviceLimit: true,
      createdAt: true,
    },
    orderBy: { slug: "asc" },
  });

  console.log("\n📋 Final Plans in Database:");
  console.log(JSON.stringify(finalPlans, null, 2));
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
