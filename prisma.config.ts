import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Biar Prisma bisa baca .env.local seperti Next.js
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"]!, 
  },
});