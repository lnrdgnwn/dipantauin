import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1h"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().default("noreply@dipantauin.my.id"),
  MIDTRANS_SERVER_KEY: z.string().min(1),
  MIDTRANS_CLIENT_KEY: z.string().min(1),
  MIDTRANS_IS_PRODUCTION: z
    .preprocess((value) => value === "true", z.boolean())
    .default(false),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error("Invalid environment variables:", envParsed.error.format());
  process.exit(1);
}

export const env = envParsed.data;
