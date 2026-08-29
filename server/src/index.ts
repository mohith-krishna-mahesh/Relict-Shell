import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { assertStartupConfig, config } from "./config.js";
import { prisma } from "./db/client.js";
import { resumeRunWatchers } from "./lib/run-watcher.js";

assertStartupConfig();

const server = createServer(createApp());
server.listen(config.port, () => {
  console.log(`Relict Shell API listening on port ${config.port}`);
  void resumeRunWatchers().catch((error) => {
    console.error("Could not resume run persistence watchers", error);
  });
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
