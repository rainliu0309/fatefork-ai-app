import assert from "node:assert/strict";
import test from "node:test";
import { TAROT_DECK, drawThreeCardMirror } from "./tarot.js";
import { calculateZiweiChart } from "./ziwei.js";

test("ziwei engine is deterministic and places all fourteen major stars", () => {
  const birth = {
    birthDate: "1996-08-17",
    birthTime: "14:20",
    timezone: "Asia/Shanghai",
  };
  const first = calculateZiweiChart(birth);
  const second = calculateZiweiChart(birth);

  assert.deepEqual(first, second);
  assert.equal(first.palaces.length, 12);
  assert.equal(
    first.palaces.flatMap((palace) => palace.majorStarDetails).length,
    14,
  );
  assert.equal(first.birth.utcInstant, "1996-08-17T06:20:00.000Z");
});

test("IANA and fixed-offset birth inputs resolve to the same instant", () => {
  const common = { birthDate: "2000-01-02", birthTime: "08:05" };
  const iana = calculateZiweiChart({ ...common, timezone: "Asia/Shanghai" });
  const fixed = calculateZiweiChart({ ...common, timezone: "+08:00" });

  assert.equal(iana.birth.utcInstant, fixed.birth.utcInstant);
});

test("non-existent daylight-saving civil time is rejected", () => {
  assert.throws(
    () =>
      calculateZiweiChart({
        birthDate: "2024-03-10",
        birthTime: "02:30",
        timezone: "America/Toronto",
      }),
    /does not exist/,
  );
});

test("tarot engine owns a unique 78-card deck and draws three unique cards", () => {
  assert.equal(TAROT_DECK.length, 78);
  assert.equal(new Set(TAROT_DECK.map((card) => card.id)).size, 78);

  const draw = drawThreeCardMirror();
  assert.equal(draw.cards.length, 3);
  assert.equal(new Set(draw.cards.map((card) => card.id)).size, 3);
  assert.equal(draw.randomSource, "node:crypto.randomInt + Fisher-Yates");
  assert.ok(
    draw.cards.every(
      (card) => card.orientation === "upright" || card.orientation === "reversed",
    ),
  );
});
