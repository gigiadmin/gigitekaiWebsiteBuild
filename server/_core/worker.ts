/**
 * Dedicated worker entrypoint for background schedulers and pollers.
 *
 * This entrypoint is intended to run inside an Azure Container Apps Job,
 * Azure Container Apps Worker service, or a similar long-running non-web
 * process. It uses the same Docker image as the web server, but starts only
 * the scheduler/poller loops instead of the HTTP server.
 *
 * Environment:
 *   - DATABASE_URL, REDIS_URL, and other secrets are read from env/Key Vault.
 *   - This process does NOT open a web port.
 *   - Graceful shutdown stops the email poller and other schedulers on SIGTERM.
 */

import { initializeTelemetry, flushTelemetry } from "./telemetry";
import { startSchedulers } from "./startSchedulers";
import { stopEmailPoller } from "./emailPoller";

async function main() {
  initializeTelemetry();

  console.log("[Worker] Initializing GigitekAI background worker...");
  await startSchedulers();

  // Keep the process alive. Schedulers run on their own intervals/timeouts.
  // We intentionally do not exit; the container orchestrator manages lifetime.
  setInterval(() => {
    // Heartbeat placeholder for orchestrator health checks
  }, 30_000);

  console.log("[Worker] Background worker running");
}

async function shutdown(signal: string) {
  console.log(`[Worker] Received ${signal}, shutting down gracefully...`);
  try {
    stopEmailPoller();
  } catch (err) {
    console.error("[Worker] Error stopping email poller:", err);
  }
  try {
    await flushTelemetry();
  } catch (err) {
    console.error("[Worker] Error flushing telemetry:", err);
  }
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

main().catch((err) => {
  console.error("[Worker] Fatal startup error:", err);
  process.exit(1);
});
