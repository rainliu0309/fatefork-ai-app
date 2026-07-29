import { Router } from "express";
import { asyncHandler, sendData } from "../middleware/http.js";
import { translateGeneratedHistory } from "../services/generationService.js";
import { asRecord, parseLocale, requiredString } from "../utils/validation.js";
import { badRequest } from "../errors.js";

export const translationRouter = Router();

/**
 * Only generated Ziwei/Tarot excerpts are accepted here. Chat excerpts are
 * intentionally excluded by the client because they can be user-authored.
 */
translationRouter.post(
  "/history",
  asyncHandler(async (request, response) => {
    const record = asRecord(request.body);
    if (!Array.isArray(record.items) || record.items.length < 1 || record.items.length > 24) {
      throw badRequest('"items" must contain 1-24 generated record excerpts.');
    }
    const items = record.items.map((item, index) => {
      const value = asRecord(item, `items[${index}]`);
      return {
        id: requiredString(value, "id", { max: 120 }),
        title: requiredString(value, "title", { max: 500 }),
        summary: requiredString(value, "summary", { max: 4_000 }),
      };
    });
    const translated = await translateGeneratedHistory({
      items,
      locale: parseLocale(record.locale),
    });
    sendData(request, response, { items: translated });
  }),
);
