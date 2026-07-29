import { Router } from "express";
import { config, isAgnesConfigured } from "../config.js";
import { sendData } from "../middleware/http.js";

export const healthRouter = Router();

healthRouter.get("/", (request, response) => {
  sendData(request, response, {
    status: "ok",
    agnesConfigured: isAgnesConfigured,
    service: "fatefork-api",
    version: "1.0.0",
    uptimeSeconds: Math.round(process.uptime()),
    agnes: {
      configured: isAgnesConfigured,
      mode: isAgnesConfigured ? ("live" as const) : ("mock" as const),
      textModel: config.agnes.textModel,
      imageModel: config.agnes.imageModel,
    },
    engines: {
      ziwei: "ziwei-rules-1.0.0",
      tarot: "tarot-crypto-1.0.0",
    },
  });
});
