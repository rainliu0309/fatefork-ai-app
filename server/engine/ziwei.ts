import type {
  BirthInput,
  MajorStarPlacement,
  ZiweiChart,
  ZiweiPalace,
} from "../types/api.js";
import { stableId } from "../utils/hash.js";
import { gregorianToChineseLunar, resolveBirthTime } from "./timezone.js";

const ENGINE_VERSION = "ziwei-rules-1.0.0";

export const HEAVENLY_STEMS = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
] as const;

export const EARTHLY_BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
] as const;

const PALACE_NAMES = [
  ["命宫", "Life"],
  ["兄弟", "Siblings"],
  ["夫妻", "Partnership"],
  ["子女", "Creation"],
  ["财帛", "Resources"],
  ["疾厄", "Wellbeing"],
  ["迁移", "Movement"],
  ["交友", "Community"],
  ["官禄", "Vocation"],
  ["田宅", "Foundations"],
  ["福德", "Inner world"],
  ["父母", "Origins"],
] as const;

const NAYIN = [
  ["海中金", "金"],
  ["炉中火", "火"],
  ["大林木", "木"],
  ["路旁土", "土"],
  ["剑锋金", "金"],
  ["山头火", "火"],
  ["涧下水", "水"],
  ["城头土", "土"],
  ["白蜡金", "金"],
  ["杨柳木", "木"],
  ["泉中水", "水"],
  ["屋上土", "土"],
  ["霹雳火", "火"],
  ["松柏木", "木"],
  ["长流水", "水"],
  ["沙中金", "金"],
  ["山下火", "火"],
  ["平地木", "木"],
  ["壁上土", "土"],
  ["金箔金", "金"],
  ["覆灯火", "火"],
  ["天河水", "水"],
  ["大驿土", "土"],
  ["钗钏金", "金"],
  ["桑柘木", "木"],
  ["大溪水", "水"],
  ["沙中土", "土"],
  ["天上火", "火"],
  ["石榴木", "木"],
  ["大海水", "水"],
] as const;

const BUREAU_NUMBER = {
  水: 2,
  木: 3,
  金: 4,
  土: 5,
  火: 6,
} as const;

type ElementName = keyof typeof BUREAU_NUMBER;

function mod(value: number, divisor = 12): number {
  return ((value % divisor) + divisor) % divisor;
}

function stemIndexFromName(stem: string): number {
  return HEAVENLY_STEMS.indexOf(stem as (typeof HEAVENLY_STEMS)[number]);
}

function branchIndexFromName(branch: string): number {
  return EARTHLY_BRANCHES.indexOf(branch as (typeof EARTHLY_BRANCHES)[number]);
}

function palaceStemIndex(yearStemIndex: number, branchIndex: number): number {
  // 五虎遁: 甲己丙寅起、乙庚戊寅起、丙辛庚寅起、丁壬壬寅起、戊癸甲寅起。
  const tigerStartAtYin = mod((yearStemIndex % 5) * 2 + 2, 10);
  return mod(tigerStartAtYin + mod(branchIndex - 2), 10);
}

function sexagenaryIndex(stemIndex: number, branchIndex: number): number {
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stemIndex && index % 12 === branchIndex) return index;
  }
  throw new Error("Stem and branch parity do not form a sexagenary pair.");
}

function deriveBureau(yearStemIndex: number, lifeBranchIndex: number): {
  element: ElementName;
  number: 2 | 3 | 4 | 5 | 6;
  label: string;
  lifePalaceStem: string;
  nayin: string;
} {
  const lifeStemIndex = palaceStemIndex(yearStemIndex, lifeBranchIndex);
  const cycleIndex = sexagenaryIndex(lifeStemIndex, lifeBranchIndex);
  const [nayin, element] = NAYIN[Math.floor(cycleIndex / 2)];
  const number = BUREAU_NUMBER[element];

  return {
    element,
    number,
    label: `${element}${["", "", "二", "三", "四", "五", "六"][number]}局`,
    lifePalaceStem: HEAVENLY_STEMS[lifeStemIndex],
    nayin,
  };
}

/**
 * Traditional arithmetic rule for locating 紫微 from lunar day and bureau:
 * add the smallest "completion" number that makes the day divisible by the
 * bureau number; move the quotient from 寅, then add an even completion or
 * subtract an odd completion.
 */
function locateZiwei(lunarDay: number, bureauNumber: number): {
  branchIndex: number;
  quotient: number;
  completion: number;
} {
  const completion = mod(-lunarDay, bureauNumber);
  const quotient = (lunarDay + completion) / bureauNumber;
  const step =
    completion === 0
      ? quotient
      : completion % 2 === 0
        ? quotient + completion
        : quotient - completion;

  // Traditional tables number 寅 as 1, hence branch index = step + 1.
  return { branchIndex: mod(step + 1), quotient, completion };
}

interface StarRule {
  id: string;
  nameZh: string;
  nameEn: string;
  system: "ziwei" | "tianfu";
  offset: number;
}

const ZIWEI_STARS: StarRule[] = [
  { id: "ziwei", nameZh: "紫微", nameEn: "Ziwei", system: "ziwei", offset: 0 },
  { id: "tianji", nameZh: "天机", nameEn: "Tianji", system: "ziwei", offset: -1 },
  { id: "taiyang", nameZh: "太阳", nameEn: "Taiyang", system: "ziwei", offset: -3 },
  { id: "wuqu", nameZh: "武曲", nameEn: "Wuqu", system: "ziwei", offset: -4 },
  { id: "tiantong", nameZh: "天同", nameEn: "Tiantong", system: "ziwei", offset: -5 },
  { id: "lianzhen", nameZh: "廉贞", nameEn: "Lianzhen", system: "ziwei", offset: -8 },
];

const TIANFU_STARS: StarRule[] = [
  { id: "tianfu", nameZh: "天府", nameEn: "Tianfu", system: "tianfu", offset: 0 },
  { id: "taiyin", nameZh: "太阴", nameEn: "Taiyin", system: "tianfu", offset: 1 },
  { id: "tanlang", nameZh: "贪狼", nameEn: "Tanlang", system: "tianfu", offset: 2 },
  { id: "jumen", nameZh: "巨门", nameEn: "Jumen", system: "tianfu", offset: 3 },
  { id: "tianxiang", nameZh: "天相", nameEn: "Tianxiang", system: "tianfu", offset: 4 },
  { id: "tianliang", nameZh: "天梁", nameEn: "Tianliang", system: "tianfu", offset: 5 },
  { id: "qisha", nameZh: "七杀", nameEn: "Qisha", system: "tianfu", offset: 6 },
  { id: "pojun", nameZh: "破军", nameEn: "Pojun", system: "tianfu", offset: 10 },
];

function placeMajorStars(
  ziweiBranch: number,
  ziweiTrace: string,
): Map<number, MajorStarPlacement[]> {
  const result = new Map<number, MajorStarPlacement[]>();
  const tianfuBranch = mod(4 - ziweiBranch);

  const add = (branchIndex: number, placement: MajorStarPlacement) => {
    result.set(branchIndex, [...(result.get(branchIndex) ?? []), placement]);
  };

  for (const star of ZIWEI_STARS) {
    const branchIndex = mod(ziweiBranch + star.offset);
    add(branchIndex, {
      ...star,
      placementRule:
        star.offset === 0
          ? ziweiTrace
          : `由紫微所在${EARTHLY_BRANCHES[ziweiBranch]}宫按紫微星系偏移 ${star.offset} 宫。`,
    });
  }

  for (const star of TIANFU_STARS) {
    const branchIndex = mod(tianfuBranch + star.offset);
    add(branchIndex, {
      ...star,
      placementRule:
        star.offset === 0
          ? `天府与紫微依寅申轴对照，由紫微${EARTHLY_BRANCHES[ziweiBranch]}宫定于${EARTHLY_BRANCHES[tianfuBranch]}宫。`
          : `由天府所在${EARTHLY_BRANCHES[tianfuBranch]}宫按天府星系偏移 +${star.offset} 宫。`,
    });
  }

  return result;
}

export function calculateZiweiChart(input: BirthInput): ZiweiChart {
  const { birth, civil } = resolveBirthTime(input);
  const lunar = gregorianToChineseLunar(civil);
  const yearStemIndex = stemIndexFromName(lunar.yearStem);
  const yearBranchIndex = branchIndexFromName(lunar.yearBranch);
  if (yearStemIndex < 0 || yearBranchIndex < 0) {
    throw new Error(`Unexpected lunar year stem/branch: ${lunar.yearStem}${lunar.yearBranch}`);
  }

  // 子时 is 23:00-00:59, then each branch spans two civil hours.
  const hourBranchIndex = Math.floor(((civil.hour + 1) % 24) / 2);
  const lifeBranchIndex = mod(2 + (lunar.month - 1) - hourBranchIndex);
  const bodyBranchIndex = mod(2 + (lunar.month - 1) + hourBranchIndex);
  const bureau = deriveBureau(yearStemIndex, lifeBranchIndex);
  const ziwei = locateZiwei(lunar.day, bureau.number);
  const ziweiTrace =
    `农历${lunar.day}日以${bureau.label}除算：补数${ziwei.completion}、商${ziwei.quotient}，` +
    `依奇补逆、偶补顺规则落于${EARTHLY_BRANCHES[ziwei.branchIndex]}宫。`;
  const starsByBranch = placeMajorStars(ziwei.branchIndex, ziweiTrace);

  const categoryByBranch = new Map<number, (typeof PALACE_NAMES)[number]>();
  PALACE_NAMES.forEach((name, categoryIndex) => {
    // 十二宫名称从命宫起逆排地支。
    categoryByBranch.set(mod(lifeBranchIndex - categoryIndex), name);
  });

  const palaces: ZiweiPalace[] = EARTHLY_BRANCHES.map((branch, branchIndex) => {
    const [name, nameEn] = categoryByBranch.get(branchIndex) ?? PALACE_NAMES[0];
    const majorStarDetails = starsByBranch.get(branchIndex) ?? [];
    return {
      branchIndex,
      branch,
      earthlyBranch: branch,
      heavenlyStem:
        HEAVENLY_STEMS[palaceStemIndex(yearStemIndex, branchIndex)],
      name,
      nameEn,
      isLifePalace: branchIndex === lifeBranchIndex,
      isBodyPalace: branchIndex === bodyBranchIndex,
      majorStars: majorStarDetails.map((star) => star.nameZh),
      majorStarDetails,
      minorStars: [],
      lifeStage: "symbolic",
    };
  });

  const chartIdentity = {
    localDate: birth.localDate,
    localTime: birth.localTime,
    timezone: birth.timezone,
    engineVersion: ENGINE_VERSION,
  };

  return {
    chartId: stableId("zw", chartIdentity),
    engineVersion: ENGINE_VERSION,
    birth,
    calendar: {
      solar: input.birthDate,
      lunar,
      hourBranch: EARTHLY_BRANCHES[hourBranchIndex],
      hourBranchIndex,
      localDateTime: `${input.birthDate}T${input.birthTime}`,
      utcDateTime: birth.utcInstant,
      timezone: input.timezone,
      lunarLabel: lunar.display,
    },
    bureau,
    lifePalaceBranch: EARTHLY_BRANCHES[lifeBranchIndex],
    bodyPalaceBranch: EARTHLY_BRANCHES[bodyBranchIndex],
    profile: {
      lifePalaceBranch: EARTHLY_BRANCHES[lifeBranchIndex],
      bodyPalaceBranch: EARTHLY_BRANCHES[bodyBranchIndex],
      fiveElementBureau: bureau.label,
      polarity: yearStemIndex % 2 === 0 ? "阳" : "阴",
    },
    palaces,
    engine: {
      version: ENGINE_VERSION,
      method: "Backend-only deterministic rules: ICU lunar conversion + palace/star tables",
      disclaimer: "Symbols are for reflective narrative, not factual prediction.",
    },
    explanation: [
      `出生地民用时间 ${input.birthDate} ${input.birthTime}（${input.timezone}）换算为 UTC ${birth.utcInstant}；计算使用当时偏移 ${birth.offsetMinutes} 分钟。`,
      `Node ICU 将公历日期转换为 ${lunar.display}${lunar.isLeapMonth ? "（闰月）" : ""}；语言模型未参与历法换算。`,
      `命宫从寅宫起正月顺数至农历${lunar.month}月，再从子时逆数至${EARTHLY_BRANCHES[hourBranchIndex]}时，落${EARTHLY_BRANCHES[lifeBranchIndex]}宫；身宫同月顺数时辰，落${EARTHLY_BRANCHES[bodyBranchIndex]}宫。`,
      `命宫干支纳音为${bureau.nayin}，据此采用${bureau.label}。`,
      ziweiTrace,
      "十四主星由紫微、天府两组固定宫位偏移表分配；本结构只提供符号化自省素材，不提供事件预测。",
    ],
  };
}
