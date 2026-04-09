import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (!globalForPrisma.prisma) {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000, // Keep connections alive 30s
    connectionTimeoutMillis: 10000, // Timeout 10s untuk connect
  });

  const adapter = new PrismaPg(pool as any);

  globalForPrisma.prisma = new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

prisma = globalForPrisma.prisma;

export { prisma };