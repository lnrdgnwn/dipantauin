import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const workerEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url().optional(),
});

const parsed = workerEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid worker environment variables:", parsed.error.format());
  process.exit(1);
}

export const workerEnv = parsed.data;
