import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.MYKANZ_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
