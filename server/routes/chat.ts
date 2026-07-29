import { Router } from "express";
import { asyncHandler, sendData } from "../middleware/http.js";
import { createReflectiveChat } from "../services/generationService.js";
import {
  asRecord,
  parseConversationHistory,
  parseLocale,
  parseMoodImage,
  requiredString,
} from "../utils/validation.js";

export const chatRouter = Router();

chatRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const record = asRecord(request.body);
    const messages = parseConversationHistory(record.messages);
    const message =
      record.message !== undefined
        ? requiredString(record, "message", { max: 4_000 })
        : [...messages].reverse().find((turn) => turn.role === "user")?.content;
    if (!message) {
      // Reuse the standard validator for a stable validation error message.
      requiredString(record, "message", { max: 4_000 });
    }
    const result = await createReflectiveChat({
      message: message as string,
      history:
        record.history !== undefined
          ? parseConversationHistory(record.history)
          : messages.slice(0, -1),
      moodImage: parseMoodImage(record.moodImage),
      locale: parseLocale(record.locale),
    });
    sendData(request, response, result, { mock: result.meta.provider === "mock" });
  }),
);
