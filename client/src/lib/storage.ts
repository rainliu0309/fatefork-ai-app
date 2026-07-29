import type { HistoryRecord } from "@/types";

const HISTORY_KEY = "fatefork.history.v1";
const BIRTH_KEY = "fatefork.birth-profile.v1";
export const PRIVACY_EVENT = "fatefork:privacy-cleared";

export interface SavedBirthProfile {
  birthDate: string;
  birthTime: string;
  timezone: string;
  birthplace: string;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isHistoryRecord(value: unknown): value is HistoryRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<HistoryRecord>;
  return (
    typeof record.id === "string" &&
    (record.kind === "ziwei" ||
      record.kind === "tarot" ||
      record.kind === "chat") &&
    typeof record.title === "string" &&
    typeof record.summary === "string" &&
    typeof record.createdAt === "string" &&
    Number.isFinite(Date.parse(record.createdAt))
  );
}

function writeHistory(records: HistoryRecord[]): HistoryRecord[] {
  // Keep the local journal comfortably below common browser storage quotas.
  const next = records.slice(0, 60);
  while (next.length > 1 && JSON.stringify(next).length > 3_000_000) {
    next.pop();
  }
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // A successful narrative should stay usable even when storage is blocked.
  }
  return next;
}

function scrubZiweiPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || !("chart" in payload)) {
    return payload;
  }
  const source = payload as { chart?: unknown; [key: string]: unknown };
  if (!source.chart || typeof source.chart !== "object") return payload;
  const {
    birth: _birth,
    calendar: _calendar,
    chartId: _chartId,
    ...safeChart
  } = source.chart as Record<string, unknown>;
  void _birth;
  void _calendar;
  void _chartId;
  return { ...source, chart: safeChart };
}

export const localStore = {
  getBirthProfile(): SavedBirthProfile | null {
    return safeParse<SavedBirthProfile | null>(
      window.localStorage.getItem(BIRTH_KEY),
      null,
    );
  },

  saveBirthProfile(profile: SavedBirthProfile) {
    try {
      window.localStorage.setItem(BIRTH_KEY, JSON.stringify(profile));
    } catch {
      // Private browsing modes may disable storage; the form still works.
    }
  },

  clearBirthProfile() {
    window.localStorage.removeItem(BIRTH_KEY);
    writeHistory(
      this.getHistory().map((record) =>
        record.kind === "ziwei"
          ? { ...record, payload: scrubZiweiPayload(record.payload) }
          : record,
      ),
    );
    window.dispatchEvent(new CustomEvent(PRIVACY_EVENT));
  },

  getHistory(): HistoryRecord[] {
    const parsed = safeParse<unknown[]>(
      window.localStorage.getItem(HISTORY_KEY),
      [],
    );
    return parsed
      .filter(isHistoryRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  addHistory(record: HistoryRecord) {
    const safeRecord =
      record.kind === "ziwei"
        ? { ...record, payload: scrubZiweiPayload(record.payload) }
        : record;
    const next = [safeRecord, ...this.getHistory()].slice(0, 60);
    return writeHistory(next);
  },

  updateHistory(id: string, patch: Partial<HistoryRecord>) {
    const next = this.getHistory().map((record) =>
      record.id === id ? { ...record, ...patch } : record,
    );
    return writeHistory(next);
  },

  removeHistory(id: string) {
    const next = this.getHistory().filter((record) => record.id !== id);
    return writeHistory(next);
  },

  clearAll() {
    window.localStorage.removeItem(HISTORY_KEY);
    window.localStorage.removeItem(BIRTH_KEY);
    window.dispatchEvent(new CustomEvent(PRIVACY_EVENT));
  },
};

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
