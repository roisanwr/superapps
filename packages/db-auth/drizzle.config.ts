import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.AUTH_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
