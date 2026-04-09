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
  console.log("Creating default plans...");

  // Check if free plan exists
  const existingFree = await prisma.plan.findUnique({
    where: { slug: "free" },
  });

  if (existingFree) {
    console.log("Free plan already exists");
  } else {
    const freePlan = await prisma.plan.create({
      data: {
        name: "Free",
        slug: "free",
        price: 0,
        finalPrice: 0,
        durationDays: 999999,
        deviceLimit: 1,
        suspendDurationMinutes: 30,
        maxSearches: "5", // Set to 5 searches as admin configured
        features: [],
        isActive: true,
      },
    });
    console.log("✅ Free plan created:", freePlan);
  }

  // Pro plans
  const proPlans = [
    {
      name: "Pro - 1 Day",
      slug: "pro-1day",
      price: 9999,
      finalPrice: 9999,
      durationDays: 1,
      maxSearches: "100",
    },
    {
      name: "Pro - 3 Days",
      slug: "pro-3day",
      price: 24999,
      finalPrice: 24999,
      durationDays: 3,
      maxSearches: "100",
    },
    {
      name: "Pro - 7 Days",
      slug: "pro-7day",
      price: 49999,
      finalPrice: 49999,
      durationDays: 7,
      maxSearches: "100",
    },
    {
      name: "Pro - 15 Days",
      slug: "pro-15day",
      price: 89999,
      finalPrice: 89999,
      durationDays: 15,
      maxSearches: "unlimited",
    },
    {
      name: "Pro - 30 Days",
      slug: "pro-30day",
      price: 149999,
      finalPrice: 149999,
      durationDays: 30,
      maxSearches: "unlimited",
    },
  ];

  for (const plan of proPlans) {
    const exists = await prisma.plan.findUnique({
      where: { slug: plan.slug },
    });
    if (exists) {
      console.log(`Plan ${plan.slug} already exists`);
    } else {
      const created = await prisma.plan.create({
        data: {
          ...plan,
          deviceLimit: 10,
          suspendDurationMinutes: 30,
          features: ["unlimited_searches", "all_features", "export_csv", "performance_analytics"],
          isActive: true,
        },
      });
      console.log(`✅ Plan ${plan.slug} created`);
    }
  }

  console.log("✅ All plans created successfully!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
