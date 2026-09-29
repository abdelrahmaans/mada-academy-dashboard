import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default("/api/v1"),
  JWT_SECRET: z.string().min(32).default("dev-only-change-me-before-production-32chars"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  OTP_TEST_PHONES: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";

if (isProduction && env.JWT_SECRET.startsWith("dev-only")) {
  throw new Error("JWT_SECRET must be replaced before production");
}
