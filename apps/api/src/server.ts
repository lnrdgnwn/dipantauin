import app from "./app";
import { env } from "./config/env";
import { DatabaseRepository } from "./repositories/database.repository";

const server = app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down`);
  server.close(async () => {
    await DatabaseRepository.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
