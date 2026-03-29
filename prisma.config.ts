import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Biar Prisma bisa baca .env.local seperti Next.js
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // datasource: {
  //   url: process.env.DATABASE_URL,
  //   // Kita tambahkan 'as any' biar TypeScript nggak komplain, 
  //   // tapi Prisma tetep bisa baca variabelnya saat build.
  //   directUrl: process.env.DIRECT_URL,
  // } as any,
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});

