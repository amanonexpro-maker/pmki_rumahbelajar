import { config as loadEnv } from "dotenv";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
