import { createServer } from "node:http";
import { createApp } from "./app.js";
import { config, isAgnesConfigured } from "./config.js";

const server = createServer(createApp());

server.listen(config.port, "0.0.0.0", () => {
  console.log(
    JSON.stringify({
      level: "info",
      message: "Fate Fork API listening",
      port: config.port,
      agnesMode: isAgnesConfigured ? "live" : "mock",
    }),
  );
});

function shutdown(signal: string): void {
  console.log(JSON.stringify({ level: "info", message: `Received ${signal}` }));
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });

  // Render normally drains quickly; this guard prevents a stuck socket from
  // keeping a superseded instance alive forever.
  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10_000);
  forceExit.unref();
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
