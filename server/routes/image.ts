import { Router } from "express";
import { badRequest } from "../errors.js";
import { asyncHandler, sendData } from "../middleware/http.js";
import { createAtmosphereImage } from "../services/generationService.js";
import {
  asRecord,
  optionalString,
  parseStringArray,
} from "../utils/validation.js";

export const imageRouter = Router();

const RATIOS = new Set(["1:1", "3:4", "4:3", "16:9", "9:16"]);
type ImageRatio = "1:1" | "3:4" | "4:3" | "16:9" | "9:16";

imageRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const record = asRecord(request.body);
    const rawRatio = record.ratio ?? "1:1";
    if (typeof rawRatio !== "string" || !RATIOS.has(rawRatio)) {
      throw badRequest('"ratio" must be one of 1:1, 3:4, 4:3, 16:9, or 9:16.');
    }
    const result = await createAtmosphereImage({
      imageryTags: parseStringArray(record.imageryTags, "imageryTags", {
        min: 1,
        max: 8,
        itemMax: 80,
      }),
      mood:
        optionalString(record, "mood", 240) ??
        optionalString(record, "emotionalTone", 240),
      ratio: rawRatio as ImageRatio,
    });
    const dataUrl = result.url.match(/^data:([^;,]+);base64,(.+)$/s);
    sendData(
      request,
      response,
      {
        ...result,
        ...(dataUrl
          ? { imageData: dataUrl[2], mimeType: dataUrl[1] }
          : { imageUrl: result.url }),
      },
      { mock: result.provider === "mock" },
    );
  }),
);
