// lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const pg = require('pg'); 

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL 
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Inisialisasi Prisma Client dengan Adapter PG
export const prisma =
  globalForPrisma.prisma ?? 
  new PrismaClient({ 
    adapter 
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;