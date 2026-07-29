import { existsSync } from "node:fs";
import { resolve } from "node:path";
import express from "express";
import { config } from "./config.js";
import {
  apiRateLimit,
  cors,
  errorHandler,
  notFound,
  requestContext,
  securityHeaders,
} from "./middleware/http.js";
import { chatRouter } from "./routes/chat.js";
import { healthRouter } from "./routes/health.js";
import { imageRouter } from "./routes/image.js";
import { reflectionRouter } from "./routes/reflection.js";
import { tarotRouter } from "./routes/tarot.js";
import { ziweiRouter } from "./routes/ziwei.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(cors);
  app.use(express.json({ limit: config.jsonBodyLimit, type: "application/json" }));

  const api = express.Router();
  api.use(apiRateLimit);
  api.use("/health", healthRouter);
  api.use("/ziwei", ziweiRouter);
  api.use("/tarot", tarotRouter);
  api.use("/chat", chatRouter);
  api.use("/image", imageRouter);
  api.use("/reflection", reflectionRouter);
  api.use(notFound);
  app.use("/api", api);

  // The production server also hosts Vite's output, enabling a single Render
  // web service. API 404s above never fall through to the SPA shell.
  const clientDist = resolve(process.cwd(), "client", "dist");
  if (config.nodeEnv === "production" && existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
    app.get(/^(?!\/api(?:\/|$)).*/, (_request, response) => {
      response.sendFile(resolve(clientDist, "index.html"));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
