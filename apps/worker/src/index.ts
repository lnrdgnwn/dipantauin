import cron from "node-cron";
import { prisma } from "@dipantauin/prisma";
import { checkProducts } from "./jobs/product-checker";
import { workerEnv } from "./config/env";

if (!workerEnv.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the worker");
}

console.log("Worker started. Scheduling jobs...");

let isProductCheckRunning = false;

// Run every minute
const task = cron.schedule("* * * * *", async () => {
  if (isProductCheckRunning) {
    console.log(
      `[${new Date().toISOString()}] Previous product checker is still running; skipping overlapping run.`,
    );
    return;
  }

  isProductCheckRunning = true;
  console.log(`[${new Date().toISOString()}] Running product checker job...`);
  try {
    await checkProducts();
    console.log(`[${new Date().toISOString()}] Product checker job completed.`);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error running product checker job:`,
      error,
    );
  } finally {
    isProductCheckRunning = false;
  }
});

// Graceful Shutdown Handling
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down worker gracefully...`);

  // Stop the cron job from scheduling new runs
  task.stop();

  try {
    // Disconnect Prisma
    await prisma.$disconnect();
    console.log("Disconnected from database.");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
