import { Router } from "express";
import { badRequest } from "../errors.js";
import { calculateZiweiChart } from "../engine/ziwei.js";
import { asyncHandler, sendData } from "../middleware/http.js";
import { createZiweiNarrative } from "../services/generationService.js";
import type { BirthInput, ZiweiChart } from "../types/api.js";
import {
  asRecord,
  optionalString,
  parseBirthInput,
  parseLocale,
  parseMoodImage,
  requiredString,
} from "../utils/validation.js";

export const ziweiRouter = Router();

ziweiRouter.post(
  "/chart",
  asyncHandler(async (request, response) => {
    const record = asRecord(request.body);
    // Accept direct fields as documented; `{ birth: ... }` is a convenience for
    // clients that share the narrative request shape.
    const birth = parseBirthInput(record.birth ?? record);
    const chart = calculateZiweiChart(birth);
    sendData(request, response, chart);
  }),
);

function canonicalChartFromBody(record: Record<string, unknown>): ZiweiChart {
  if (record.birth !== undefined) {
    return calculateZiweiChart(parseBirthInput(record.birth));
  }
  if (record.chart === undefined) {
    throw badRequest('Provide either "chart" from /ziwei/chart or a "birth" object.');
  }

  // Rebuild any echoed chart from its normalized birth fields. This guarantees
  // that user-editable star names cannot become prompt injection content.
  const supplied = asRecord(record.chart, "chart");
  const suppliedBirth = asRecord(supplied.birth, "chart.birth");
  const reconstructed: BirthInput = {
    birthDate: requiredString(suppliedBirth, "localDate", { max: 10 }),
    birthTime: requiredString(suppliedBirth, "localTime", { max: 5 }),
    timezone: requiredString(suppliedBirth, "timezone", { max: 64 }),
    ...(optionalString(suppliedBirth, "place", 120)
      ? { place: optionalString(suppliedBirth, "place", 120) }
      : {}),
  };
  const chart = calculateZiweiChart(reconstructed);
  if (typeof supplied.chartId === "string" && supplied.chartId !== chart.chartId) {
    throw badRequest("The supplied chart does not match its birth fields. Recalculate it.");
  }
  return chart;
}

ziweiRouter.post(
  "/narrative",
  asyncHandler(async (request, response) => {
    const record = asRecord(request.body);
    const chart = canonicalChartFromBody(record);
    const result = await createZiweiNarrative({
      chart,
      focus: optionalString(record, "focus", 1_500),
      moodImage: parseMoodImage(record.moodImage),
      locale: parseLocale(record.locale),
    });
    sendData(request, response, result, { mock: result.meta.provider === "mock" });
  }),
);
