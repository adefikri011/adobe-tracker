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
  console.log("Deleting old/incorrect plan formats...");

  // Plans to delete (old format with spaces in slug)
  const slugsToDelete = [
    "1 Day",
    "3 Day", 
    "7 Day",
    "15 Day",
    "30 Day",
    "Free",
  ];

  for (const slug of slugsToDelete) {
    const plan = await prisma.plan.findUnique({
      where: { slug },
    });

    if (plan) {
      console.log(`\n❌ Deleting plan: "${slug}" (${plan.name})`);
      
      // Delete related records first
      await prisma.subscription.deleteMany({
        where: { planId: plan.id },
      });
      
      await prisma.transaction.deleteMany({
        where: { planId: plan.id },
      });

      // Delete the plan
      await prisma.plan.delete({
        where: { slug },
      });
      
      console.log(`   ✅ Deleted successfully`);
    } else {
      console.log(`\n⏭️  Plan "${slug}" not found, skipping`);
    }
  }

  console.log(`\n✅ Cleanup complete!`);

  // Show final clean state
  const finalPlans = await prisma.plan.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      maxSearches: true,
      deviceLimit: true,
      durationDays: true,
    },
    orderBy: { slug: "asc" },
  });

  console.log("\n📋 Final Plans in Database (CLEAN):");
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
