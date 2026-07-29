import { randomInt, randomUUID } from "node:crypto";
import { badRequest } from "../errors.js";
import type { TarotCard, TarotDraw, TarotOrientation } from "../types/api.js";
import { asRecord } from "../utils/validation.js";

const ENGINE_VERSION = "tarot-crypto-1.0.0";
const SELF_DRAW_SLOT_COUNT = 78;
const SELF_DRAW_TTL_MS = 20 * 60 * 1_000;

const MAJOR_ARCANA: Array<
  Pick<TarotCard, "id" | "nameZh" | "nameEn" | "keywords">
> = [
  { id: "major-00", nameZh: "愚者", nameEn: "The Fool", keywords: ["起点", "开放", "试探"] },
  { id: "major-01", nameZh: "魔术师", nameEn: "The Magician", keywords: ["资源", "行动", "表达"] },
  { id: "major-02", nameZh: "女祭司", nameEn: "The High Priestess", keywords: ["直觉", "静观", "未言明"] },
  { id: "major-03", nameZh: "皇后", nameEn: "The Empress", keywords: ["滋养", "丰盛", "创造"] },
  { id: "major-04", nameZh: "皇帝", nameEn: "The Emperor", keywords: ["结构", "边界", "责任"] },
  { id: "major-05", nameZh: "教皇", nameEn: "The Hierophant", keywords: ["传统", "学习", "共同规范"] },
  { id: "major-06", nameZh: "恋人", nameEn: "The Lovers", keywords: ["价值选择", "联结", "一致性"] },
  { id: "major-07", nameZh: "战车", nameEn: "The Chariot", keywords: ["方向", "意志", "协调"] },
  { id: "major-08", nameZh: "力量", nameEn: "Strength", keywords: ["温柔坚定", "耐心", "自我调节"] },
  { id: "major-09", nameZh: "隐者", nameEn: "The Hermit", keywords: ["独处", "辨识", "内在灯火"] },
  { id: "major-10", nameZh: "命运之轮", nameEn: "Wheel of Fortune", keywords: ["周期", "变化", "可调整性"] },
  { id: "major-11", nameZh: "正义", nameEn: "Justice", keywords: ["权衡", "因果", "诚实"] },
  { id: "major-12", nameZh: "倒吊人", nameEn: "The Hanged Man", keywords: ["暂停", "换位", "松开控制"] },
  { id: "major-13", nameZh: "死神", nameEn: "Death", keywords: ["结束旧章", "过渡", "更新"] },
  { id: "major-14", nameZh: "节制", nameEn: "Temperance", keywords: ["调和", "节奏", "整合"] },
  { id: "major-15", nameZh: "恶魔", nameEn: "The Devil", keywords: ["依附", "诱惑", "看见束缚"] },
  { id: "major-16", nameZh: "高塔", nameEn: "The Tower", keywords: ["结构松动", "意外信息", "重新搭建"] },
  { id: "major-17", nameZh: "星星", nameEn: "The Star", keywords: ["希望", "复原", "远方坐标"] },
  { id: "major-18", nameZh: "月亮", nameEn: "The Moon", keywords: ["模糊", "感受", "投射"] },
  { id: "major-19", nameZh: "太阳", nameEn: "The Sun", keywords: ["清晰", "活力", "被看见"] },
  { id: "major-20", nameZh: "审判", nameEn: "Judgement", keywords: ["回应召唤", "复盘", "重新选择"] },
  { id: "major-21", nameZh: "世界", nameEn: "The World", keywords: ["完成阶段", "整合", "新边界"] },
];

const SUITS = [
  { id: "wands", nameZh: "权杖", nameEn: "Wands", keywords: ["行动", "热情", "创造"] },
  { id: "cups", nameZh: "圣杯", nameEn: "Cups", keywords: ["感受", "关系", "接纳"] },
  { id: "swords", nameZh: "宝剑", nameEn: "Swords", keywords: ["思考", "沟通", "张力"] },
  { id: "pentacles", nameZh: "星币", nameEn: "Pentacles", keywords: ["现实", "资源", "身体"] },
] as const;

const RANKS = [
  { rank: 1, nameZh: "一", nameEn: "Ace", keyword: "萌芽" },
  { rank: 2, nameZh: "二", nameEn: "Two", keyword: "两端" },
  { rank: 3, nameZh: "三", nameEn: "Three", keyword: "协作" },
  { rank: 4, nameZh: "四", nameEn: "Four", keyword: "稳定" },
  { rank: 5, nameZh: "五", nameEn: "Five", keyword: "摩擦" },
  { rank: 6, nameZh: "六", nameEn: "Six", keyword: "流动" },
  { rank: 7, nameZh: "七", nameEn: "Seven", keyword: "检视" },
  { rank: 8, nameZh: "八", nameEn: "Eight", keyword: "推进" },
  { rank: 9, nameZh: "九", nameEn: "Nine", keyword: "积累" },
  { rank: 10, nameZh: "十", nameEn: "Ten", keyword: "阶段收束" },
  { rank: 11, nameZh: "侍从", nameEn: "Page", keyword: "探索消息" },
  { rank: 12, nameZh: "骑士", nameEn: "Knight", keyword: "投入过程" },
  { rank: 13, nameZh: "王后", nameEn: "Queen", keyword: "内在掌握" },
  { rank: 14, nameZh: "国王", nameEn: "King", keyword: "外在承担" },
] as const;

const POSITIONS = [
  {
    id: "situation",
    clientId: "situation",
    nameZh: "此刻镜面",
    nameEn: "Present mirror",
    prompt: "这张牌只映照当下可见的局势与感受。",
  },
  {
    id: "inner-block",
    clientId: "innerBlock",
    nameZh: "内在阻力",
    nameEn: "Inner tension",
    prompt: "这张牌邀请用户辨认需求、担忧或尚未说出的界限。",
  },
  {
    id: "possibilities",
    clientId: "possibility",
    nameZh: "可能路径",
    nameEn: "Possible paths",
    prompt: "这张牌展开多个可行动方向，不把任何方向写成预言。",
  },
] as const;

export const TAROT_DECK: readonly TarotCard[] = [
  ...MAJOR_ARCANA.map((card) => ({ ...card, arcana: "major" as const })),
  ...SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${suit.id}-${String(rank.rank).padStart(2, "0")}`,
      nameZh: `${suit.nameZh}${rank.nameZh}`,
      nameEn: `${rank.nameEn} of ${suit.nameEn}`,
      arcana: "minor" as const,
      suit: suit.id,
      rank: rank.rank,
      keywords: [...suit.keywords, rank.keyword],
    })),
  ),
];

if (TAROT_DECK.length !== 78) {
  throw new Error(`Tarot deck invariant failed: expected 78 cards, got ${TAROT_DECK.length}.`);
}

const CARD_BY_ID = new Map(TAROT_DECK.map((card) => [card.id, card]));

export interface TarotSelfDrawSession {
  sessionId: string;
  slotCount: number;
  requiredSelections: number;
  expiresAt: string;
}

export interface TarotSelfDrawPickResult {
  sessionId: string;
  selectedSlots: number[];
  requiredSelections: number;
  complete: boolean;
  draw?: TarotDraw;
}

interface PendingSelfDraw {
  slots: TarotCard[];
  orientations: TarotOrientation[];
  selectedSlots: number[];
  expiresAt: number;
}

// Draw sessions carry only an already shuffled local deck and expire quickly.
// No question, account, birth data, or other personal information is stored.
const pendingSelfDraws = new Map<string, PendingSelfDraw>();

/**
 * Fisher–Yates with `crypto.randomInt`. randomInt uses rejection sampling,
 * avoiding the modulo bias that a Math.random-based implementation can add.
 */
function cryptographicShuffle<T>(source: readonly T[]): T[] {
  const shuffled = [...source];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createDraw(
  cards: readonly TarotCard[],
  orientations: readonly TarotOrientation[],
): TarotDraw {
  const drawId = `td_${randomUUID()}`;
  return {
    drawId,
    spreadId: drawId,
    engineVersion: ENGINE_VERSION,
    spread: "three-mirror",
    cards: cards.map((card, index) => ({
      ...card,
      name: card.nameZh,
      ...(card.rank === undefined ? {} : { number: card.rank }),
      orientation: orientations[index],
      position: POSITIONS[index].clientId,
      positionLabel: POSITIONS[index].nameZh,
      positionDetail: {
        id: POSITIONS[index].id,
        nameZh: POSITIONS[index].nameZh,
        nameEn: POSITIONS[index].nameEn,
        prompt: POSITIONS[index].prompt,
      },
    })),
    drawnAt: new Date().toISOString(),
    randomSource: "node:crypto.randomInt + Fisher-Yates",
    algorithm: "crypto Fisher-Yates",
  };
}

function purgeExpiredSelfDraws(now = Date.now()) {
  for (const [sessionId, session] of pendingSelfDraws) {
    if (session.expiresAt <= now) pendingSelfDraws.delete(sessionId);
  }
}

/**
 * Prepares a concealed, server-shuffled set of card locations. The browser
 * receives no card names or orientation until it has picked all three slots.
 */
export function prepareSelfDraw(): TarotSelfDrawSession {
  purgeExpiredSelfDraws();
  const sessionId = `ts_${randomUUID()}`;
  const expiresAt = Date.now() + SELF_DRAW_TTL_MS;
  const slots = cryptographicShuffle(TAROT_DECK).slice(0, SELF_DRAW_SLOT_COUNT);
  pendingSelfDraws.set(sessionId, {
    slots,
    orientations: slots.map(() =>
      randomInt(2) === 0 ? ("upright" as const) : ("reversed" as const),
    ),
    selectedSlots: [],
    expiresAt,
  });

  return {
    sessionId,
    slotCount: SELF_DRAW_SLOT_COUNT,
    requiredSelections: POSITIONS.length,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

/**
 * Locks a user-selected concealed slot into the next spread position. A slot
 * can never be selected twice, and the completed draw is assembled solely
 * from the server-held shuffle.
 */
export function pickSelfDrawSlot(
  sessionId: string,
  slot: number,
): TarotSelfDrawPickResult {
  purgeExpiredSelfDraws();
  const session = pendingSelfDraws.get(sessionId);
  if (!session) {
    throw badRequest("本次牌组已失效，请重新洗牌后再试。");
  }
  if (!Number.isInteger(slot) || slot < 0 || slot >= session.slots.length) {
    throw badRequest("请选择牌组中的一张牌。");
  }
  if (session.selectedSlots.includes(slot)) {
    throw badRequest("这张牌已经被选过了，请选择另一张。");
  }

  session.selectedSlots.push(slot);
  const complete = session.selectedSlots.length === POSITIONS.length;
  const selectedSlots = [...session.selectedSlots];
  const response: TarotSelfDrawPickResult = {
    sessionId,
    selectedSlots,
    requiredSelections: POSITIONS.length,
    complete,
  };

  if (complete) {
    response.draw = createDraw(
      selectedSlots.map((selectedSlot) => session.slots[selectedSlot]),
      selectedSlots.map((selectedSlot) => session.orientations[selectedSlot]),
    );
    pendingSelfDraws.delete(sessionId);
  }

  return response;
}

/**
 * Resolves a complete user selection in one request. Validating all slots
 * before mutating the session lets the UI offer an unhurried three-card choice
 * and then reveal the completed spread together.
 */
export function revealSelfDrawSlots(
  sessionId: string,
  slots: number[],
): TarotSelfDrawPickResult {
  purgeExpiredSelfDraws();
  const session = pendingSelfDraws.get(sessionId);
  if (!session) {
    throw badRequest("本次牌组已失效，请重新洗牌后再试。");
  }
  if (
    slots.length !== POSITIONS.length ||
    new Set(slots).size !== slots.length ||
    slots.some(
      (slot) => !Number.isInteger(slot) || slot < 0 || slot >= session.slots.length,
    )
  ) {
    throw badRequest("请从牌组中选择三张不同的牌。");
  }

  const draw = createDraw(
    slots.map((slot) => session.slots[slot]),
    slots.map((slot) => session.orientations[slot]),
  );
  pendingSelfDraws.delete(sessionId);
  return {
    sessionId,
    selectedSlots: [...slots],
    requiredSelections: POSITIONS.length,
    complete: true,
    draw,
  };
}

export function drawThreeCardMirror(): TarotDraw {
  const cards = cryptographicShuffle(TAROT_DECK).slice(0, 3);
  const orientations = cards.map(() =>
    randomInt(2) === 0 ? ("upright" as const) : ("reversed" as const),
  );
  return createDraw(cards, orientations);
}

/**
 * Narrative requests echo the prior draw because the server is stateless.
 * Canonical names/keywords are reconstructed from IDs so a client cannot place
 * arbitrary instructions inside card fields sent onward to Agnes.
 */
export function parseTarotDraw(value: unknown): TarotDraw {
  const record = asRecord(value, "draw");
  const drawId =
    typeof record.drawId === "string"
      ? record.drawId
      : typeof record.spreadId === "string"
        ? record.spreadId
        : undefined;
  if (!drawId?.startsWith("td_")) {
    throw badRequest('"draw.drawId" is invalid.');
  }
  if (!Array.isArray(record.cards) || record.cards.length !== 3) {
    throw badRequest('"draw.cards" must contain the three cards returned by /tarot/draw.');
  }

  const seen = new Set<string>();
  const cards = record.cards.map((rawCard, index) => {
    const item = asRecord(rawCard, `draw.cards[${index}]`);
    const canonical = typeof item.id === "string" ? CARD_BY_ID.get(item.id) : undefined;
    if (!canonical || seen.has(canonical.id)) {
      throw badRequest(`draw.cards[${index}] has an unknown or duplicate card ID.`);
    }
    seen.add(canonical.id);
    if (item.orientation !== "upright" && item.orientation !== "reversed") {
      throw badRequest(`draw.cards[${index}].orientation is invalid.`);
    }
    const orientation =
      item.orientation === "upright" ? ("upright" as const) : ("reversed" as const);
    return {
      ...canonical,
      name: canonical.nameZh,
      ...(canonical.rank === undefined ? {} : { number: canonical.rank }),
      orientation,
      position: POSITIONS[index].clientId,
      positionLabel: POSITIONS[index].nameZh,
      positionDetail: {
        id: POSITIONS[index].id,
        nameZh: POSITIONS[index].nameZh,
        nameEn: POSITIONS[index].nameEn,
        prompt: POSITIONS[index].prompt,
      },
    };
  });

  return {
    drawId,
    spreadId: drawId,
    engineVersion: ENGINE_VERSION,
    spread: "three-mirror",
    cards,
    drawnAt:
      typeof record.drawnAt === "string" ? record.drawnAt : new Date().toISOString(),
    randomSource: "node:crypto.randomInt + Fisher-Yates",
    algorithm: "crypto Fisher-Yates",
  };
}
