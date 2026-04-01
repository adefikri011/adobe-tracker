import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Gunakan type casting agar global variable terbaca dengan benar
const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (!globalForPrisma.prisma) {
  // 1. Setup Connection Pool
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  // 2. Setup Adapter (Wajib karena kamu pakai driver adapter di schema)
  const adapter = new PrismaPg(pool as any);

  // 3. Masukkan adapter ke dalam PrismaClient
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

prisma = globalForPrisma.prisma;

export { prisma };