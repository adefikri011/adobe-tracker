import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function updateDisplayNames() {
  console.log("Updating plan display names...\n");

  const updates = [
    {
      slug: "free",
      name: "Free",  // Display name
    },
    {
      slug: "pro-1day",
      name: "Pro - 1 Day",
    },
    {
      slug: "pro-3day",
      name: "Pro - 3 Days",
    },
    {
      slug: "pro-7day",
      name: "Pro - 7 Days",
    },
    {
      slug: "pro-15day",
      name: "Pro - 15 Days",
    },
    {
      slug: "pro-30day",
      name: "Pro - 30 Days",
    },
  ];

  for (const update of updates) {
    const plan = await prisma.plan.update({
      where: { slug: update.slug },
      data: { name: update.name },
    });

    console.log(`✅ Updated:`);
    console.log(`   slug (database): "${plan.slug}"`);
    console.log(`   name (UI display): "${plan.name}"`);
    console.log();
  }

  console.log("✅ All display names updated!");
}

updateDisplayNames()
  .catch(e => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
