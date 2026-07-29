import { Router } from "express";
import { drawThreeCardMirror, parseTarotDraw } from "../engine/tarot.js";
import { asyncHandler, sendData } from "../middleware/http.js";
import {
  createTarotFollowup,
  createTarotNarrative,
} from "../services/generationService.js";
import {
  asRecord,
  optionalString,
  parseConversationHistory,
  parseLocale,
  parseMoodImage,
  requiredString,
} from "../utils/validation.js";

export const tarotRouter = Router();

tarotRouter.post(
  "/draw",
  asyncHandler(async (request, response) => {
    // Question is intentionally ignored by the random engine; accepting it here
    // lets the UI submit a single flow without allowing text to bias the draw.
    if (request.body !== undefined) asRecord(request.body);
    sendData(request, response, drawThreeCardMirror(), { status: 201 });
  }),
);

tarotRouter.post(
  "/narrative",
  asyncHandler(async (request, response) => {
    const record = asRecord(request.body);
    const result = await createTarotNarrative({
      question: requiredString(record, "question", { max: 2_000 }),
      draw: parseTarotDraw(record.draw ?? record.spread),
      moodImage: parseMoodImage(record.moodImage),
      locale: parseLocale(record.locale),
    });
    sendData(request, response, result, { mock: result.meta.provider === "mock" });
  }),
);

tarotRouter.post(
  "/followup",
  asyncHandler(async (request, response) => {
    const record = asRecord(request.body);
    const history = parseConversationHistory(record.history ?? record.messages);
    const derivedFollowup =
      record.followup ??
      [...history].reverse().find((turn) => turn.role === "user")?.content;
    const result = await createTarotFollowup({
      originalQuestion: requiredString(record, "question", { max: 2_000 }),
      followup:
        typeof derivedFollowup === "string" && derivedFollowup.trim()
          ? derivedFollowup.trim().slice(0, 2_000)
          : requiredString(record, "followup", { max: 2_000 }),
      draw: parseTarotDraw(record.draw ?? record.spread),
      previousNarrative: optionalString(record, "previousNarrative", 8_000),
      history,
      locale: parseLocale(record.locale),
    });
    sendData(request, response, result, { mock: result.meta.provider === "mock" });
  }),
);
