import { badRequest } from "../errors.js";
import type { BirthInput, LunarDate, NormalizedBirth } from "../types/api.js";

interface CivilParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

interface ResolvedBirthTime {
  birth: NormalizedBirth;
  civil: CivilParts;
}

const CHINESE_MONTHS: Record<string, number> = {
  正: 1,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
  冬: 11,
  腊: 12,
};

function parseCivilParts(input: BirthInput): CivilParts {
  const [year, month, day] = input.birthDate.split("-").map(Number);
  const [hour, minute] = input.birthTime.split(":").map(Number);

  // Date.UTC normalizes invalid values, so compare the round-trip explicitly.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1900 ||
    year > 2100 ||
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw badRequest(
      '"birthDate" must be a real Gregorian date between 1900-01-01 and 2100-12-31.',
    );
  }

  return { year, month, day, hour, minute };
}

function parseFixedOffset(timezone: string): number | undefined {
  if (/^(?:Z|UTC)$/i.test(timezone)) return 0;
  const match = timezone.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return undefined;

  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0)) {
    throw badRequest('Fixed timezone offsets must fall between "-14:00" and "+14:00".');
  }
  return (match[1] === "-" ? -1 : 1) * (hours * 60 + minutes);
}

function zonedParts(instantMs: number, timezone: string): CivilParts {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    throw badRequest(
      '"timezone" must be a valid IANA name (for example Asia/Shanghai) or +HH:mm offset.',
    );
  }

  const values = Object.fromEntries(
    formatter
      .formatToParts(new Date(instantMs))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

function partsEqual(left: CivilParts, right: CivilParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

function offsetAt(instantMs: number, timezone: string): number {
  const parts = zonedParts(instantMs, timezone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  return Math.round((representedAsUtc - instantMs) / 60_000);
}

/**
 * Convert an IANA-local civil time to a real UTC instant without depending on
 * the host machine timezone. Candidate offsets around the requested day are
 * sampled to correctly handle DST transitions. If a fall-back hour occurs
 * twice, the earlier instant is selected and documented by deterministic order.
 */
function ianaCivilToUtc(civil: CivilParts, timezone: string): {
  instantMs: number;
  offsetMinutes: number;
} {
  const wallClockAsUtc = Date.UTC(
    civil.year,
    civil.month - 1,
    civil.day,
    civil.hour,
    civil.minute,
  );

  // Sampling a 72-hour window discovers every practical DST/offset transition.
  const offsets = new Set<number>();
  for (let deltaHours = -36; deltaHours <= 36; deltaHours += 3) {
    offsets.add(offsetAt(wallClockAsUtc + deltaHours * 3_600_000, timezone));
  }

  const candidates = [...offsets]
    .map((offsetMinutes) => ({
      instantMs: wallClockAsUtc - offsetMinutes * 60_000,
      offsetMinutes,
    }))
    .filter((candidate) =>
      partsEqual(zonedParts(candidate.instantMs, timezone), civil),
    )
    .sort((a, b) => a.instantMs - b.instantMs);

  if (candidates.length === 0) {
    throw badRequest(
      "The supplied local birth time does not exist in that timezone (usually a daylight-saving transition).",
    );
  }
  return candidates[0];
}

export function resolveBirthTime(input: BirthInput): ResolvedBirthTime {
  const civil = parseCivilParts(input);
  const wallClockAsUtc = Date.UTC(
    civil.year,
    civil.month - 1,
    civil.day,
    civil.hour,
    civil.minute,
  );

  const fixedOffset = parseFixedOffset(input.timezone);
  const resolved =
    fixedOffset === undefined
      ? ianaCivilToUtc(civil, input.timezone)
      : {
          instantMs: wallClockAsUtc - fixedOffset * 60_000,
          offsetMinutes: fixedOffset,
        };

  return {
    civil,
    birth: {
      localDate: input.birthDate,
      localTime: input.birthTime,
      timezone: input.timezone,
      offsetMinutes: resolved.offsetMinutes,
      utcInstant: new Date(resolved.instantMs).toISOString(),
      ...(input.place ? { place: input.place } : {}),
    },
  };
}

/**
 * ICU's Chinese calendar is used only for calendar conversion. Palace and star
 * placement remain explicit TypeScript rules in `ziwei.ts`; no model or remote
 * ephemeris participates in calculation.
 */
export function gregorianToChineseLunar(civil: CivilParts): LunarDate {
  const dateAtUtcNoon = new Date(
    Date.UTC(civil.year, civil.month - 1, civil.day, 12),
  );
  const formatter = new Intl.DateTimeFormat("zh-Hans-CN-u-ca-chinese", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const parts = formatter.formatToParts(dateAtUtcNoon);
  // `relatedYear` and `yearName` are standardized calendar extension parts but
  // are still absent from some TypeScript Intl declaration versions.
  const relatedYear = parts.find((part) => String(part.type) === "relatedYear")?.value;
  const yearName = parts.find((part) => String(part.type) === "yearName")?.value;
  const rawMonth = parts.find((part) => part.type === "month")?.value;
  const rawDay = parts.find((part) => part.type === "day")?.value;

  if (!relatedYear || !yearName || !rawMonth || !rawDay) {
    throw new Error("The current Node.js ICU build cannot convert the Chinese calendar.");
  }

  const isLeapMonth = rawMonth.includes("闰");
  const monthKey = rawMonth.replace(/[闰月]/g, "");
  const month = CHINESE_MONTHS[monthKey];
  const day = Number.parseInt(rawDay, 10);
  if (!month || !Number.isFinite(day)) {
    throw new Error(`Unable to parse ICU lunar date: ${formatter.format(dateAtUtcNoon)}`);
  }

  return {
    year: Number(relatedYear),
    month,
    day,
    isLeapMonth,
    display: `${yearName}年${rawMonth}${rawDay}日`,
    yearStem: yearName[0],
    yearBranch: yearName[1],
  };
}
