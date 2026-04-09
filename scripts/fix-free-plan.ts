import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function fixFreePlan() {
  console.log("Updating Free plan maxSearches to 5...");
  
  const updated = await prisma.plan.update({
    where: { slug: "free" },
    data: { maxSearches: "5" },
  });
  
  console.log("✅ Updated Free plan:");
  console.log(`   - name: ${updated.name}`);
  console.log(`   - slug: ${updated.slug}`);
  console.log(`   - maxSearches: ${updated.maxSearches}`);
  console.log(`   - deviceLimit: ${updated.deviceLimit}`);
}

fixFreePlan()
  .catch(e => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
