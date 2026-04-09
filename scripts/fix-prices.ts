import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function fixPrices() {
  console.log("Fixing prices and durations...\n");

  const updates = [
    {
      slug: "free",
      data: {
        price: 0,
        finalPrice: 0,
        durationDays: 1, // Just 1 day or keep as continuous
      },
    },
    {
      slug: "pro-1day",
      data: {
        price: 1.00,
        finalPrice: 1.00,
      },
    },
    {
      slug: "pro-3day",
      data: {
        price: 4.99,
        finalPrice: 4.99,
      },
    },
    {
      slug: "pro-7day",
      data: {
        price: 7.00,
        finalPrice: 7.00,
      },
    },
    {
      slug: "pro-15day",
      data: {
        price: 11.00,
        finalPrice: 11.00,
      },
    },
    {
      slug: "pro-30day",
      data: {
        price: 1500.00,
        finalPrice: 1500.00,
      },
    },
  ];

  for (const update of updates) {
    const plan = await prisma.plan.update({
      where: { slug: update.slug },
      data: update.data,
    });

    console.log(`✅ Updated ${plan.slug}:`);
    console.log(`   Price: $${plan.price} → $${plan.finalPrice}`);
    if ("durationDays" in update.data) {
      console.log(`   Duration: ${plan.durationDays} days`);
    }
    console.log();
  }

  console.log("✅ All prices and durations fixed!");
}

fixPrices()
  .catch(e => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
