import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  CalendarClock,
  ChevronDown,
  CircleSlash2,
  Eraser,
  MessageCircleMore,
  Orbit,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState, ReflectionShareCard } from "@/components/visual";
import { InlineNotice } from "@/components/common/InlineNotice";
import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { localStore } from "@/lib/storage";
import { useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import type { HistoryKind, HistoryRecord } from "@/types";

type Filter = "all" | HistoryKind;

export function HistoryPage() {
  const { isEnglish } = useLocale();
  const kindInfo: Record<
    HistoryKind,
    { label: string; eyebrow: string; icon: typeof Orbit; color: string }
  > = {
    ziwei: { label: isEnglish ? "Star Paths" : "星轨推演", eyebrow: "LONG HORIZON", icon: Orbit, color: "text-haze-purple" },
    tarot: { label: isEnglish ? "Present Mirror" : "即时镜像", eyebrow: "PRESENT MIRROR", icon: Sparkles, color: "text-haze-cyan" },
    chat: { label: isEnglish ? "Open Dialogue" : "随心闲谈", eyebrow: "OPEN DIALOGUE", icon: MessageCircleMore, color: "text-haze-champagne" },
  };
  const [records, setRecords] = useState<HistoryRecord[]>(() =>
    localStore.getHistory(),
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string>();
  const [confirmClear, setConfirmClear] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [translatedExcerpts, setTranslatedExcerpts] = useState<
    Record<string, Pick<HistoryRecord, "title" | "summary">>
  >({});
  const [translatedDetail, setTranslatedDetail] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirmClear) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current
      ?.querySelector<HTMLElement>("[data-autofocus]")
      ?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirmClear(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      previouslyFocused?.focus();
    };
  }, [confirmClear]);

  useEffect(() => {
    // Only Ziwei/Tarot title and summary are system-generated. Chat summaries
    // are user writing, so they are deliberately excluded from translation.
    const generated = records
      .filter((record) => record.kind !== "chat")
      .map(({ id, title, summary }) => ({ id, title, summary }));
    if (!generated.length) {
      setTranslatedExcerpts({});
      return;
    }

    let active = true;
    setTranslatedExcerpts({});
    void api
      .translateGeneratedHistory(generated)
      .then(({ items }) => {
        if (!active) return;
        setTranslatedExcerpts(
          Object.fromEntries(
            items.map((item) => [item.id, { title: item.title, summary: item.summary }]),
          ),
        );
      })
      // Keep the original local copy visible if translation is temporarily
      // unavailable; the user's writing is never sent as a substitute.
      .catch(() => {
        if (active) setTranslatedExcerpts({});
      });

    return () => {
      active = false;
    };
  }, [records, isEnglish]);

  useEffect(() => {
    const record = records.find((item) => item.id === expanded);
    if (!record) {
      setTranslatedDetail({});
      return;
    }

    const items = generatedDetailEntries(record);
    if (!items.length) {
      setTranslatedDetail({});
      return;
    }

    let active = true;
    setTranslatedDetail({});
    void api.translateGeneratedHistory(items).then(({ items: translated }) => {
      if (!active) return;
      setTranslatedDetail(Object.fromEntries(translated.map((item) => [item.id, item.summary])));
    }).catch(() => {
      if (active) setTranslatedDetail({});
    });

    return () => {
      active = false;
    };
  }, [expanded, isEnglish, records]);

  const displayRecords = useMemo(
    () =>
      records.map((record) => {
        if (record.kind === "chat") {
          return {
            ...record,
            // Chat titles are application copy; their summary remains user input.
            title: isEnglish ? "An open dialogue" : "一段随心闲谈",
          };
        }
        return { ...record, ...translatedExcerpts[record.id] };
      }),
    [isEnglish, records, translatedExcerpts],
  );

  const visibleRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return displayRecords.filter(
      (record) =>
        (filter === "all" || record.kind === filter) &&
        (!normalized ||
          record.title.toLowerCase().includes(normalized) ||
          record.summary.toLowerCase().includes(normalized)),
    );
  }, [displayRecords, filter, query]);

  const counts = useMemo(
    () => ({
      all: records.length,
      ziwei: records.filter((record) => record.kind === "ziwei").length,
      tarot: records.filter((record) => record.kind === "tarot").length,
      chat: records.filter((record) => record.kind === "chat").length,
    }),
    [records],
  );

  function removeRecord(id: string) {
    setRecords(localStore.removeHistory(id));
    if (expanded === id) setExpanded(undefined);
  }

  function clearAll() {
    localStore.clearAll();
    setRecords([]);
    setExpanded(undefined);
    setConfirmClear(false);
  }

  function addRealityNote(record: HistoryRecord) {
    const text = noteDrafts[record.id]?.trim();
    if (!text) return;
    const realityNotes = [
      ...(record.realityNotes ?? []),
      { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() },
    ].slice(-20);
    const next = localStore.updateHistory(record.id, { realityNotes });
    setRecords(next);
    setNoteDrafts((current) => ({ ...current, [record.id]: "" }));
  }

  function trapDialogFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <section className="page-container">
      <PageIntro
        eyebrow="ANTI-FATALISM JOURNAL"
        title={isEnglish ? "Choice Journal" : "反宿命日志"}
        description={isEnglish ? "The value is not whether a reading comes true, but how you choose, revise, and continue living. Place past narratives beside reality and record the path you actually walked." : "推演的价值不在「是否应验」，而在你如何选择、修正和继续生活。把过去的叙事与现实并排放置，记录自己真正走过的路。"}
        step={isEnglish ? `${records.length} entries · this device only` : `${records.length} 条记录 · 仅保存在当前设备`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([
          ["all", isEnglish ? "All entries" : "全部记录", Archive],
          ["ziwei", kindInfo.ziwei.label, Orbit],
          ["tarot", kindInfo.tarot.label, Sparkles],
          ["chat", kindInfo.chat.label, MessageCircleMore],
        ] as const).map(([value, label, Icon]) => (
          <button
            type="button"
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "glass-panel flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition duration-500",
              filter === value
                ? "border-white/[.14] bg-white/[.065]"
                : "border-white/[.065] bg-white/[.025] hover:bg-white/[.045]",
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="size-4 text-mist-500" strokeWidth={1.3} />
              <span className="text-xs text-mist-300">{label}</span>
            </div>
            <span className="text-[10px] tabular-nums text-mist-600">
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-mist-600" strokeWidth={1.4} />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isEnglish ? "Search titles or excerpts…" : "搜索标题或片段……"}
            aria-label={isEnglish ? "Search choice journal" : "搜索反宿命日志"}
            className="h-11 pl-11"
          />
        </div>
        {records.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmClear(true)}
          >
            <Eraser className="size-3.5" />
            {isEnglish ? "Clear all entries" : "清除全部记录"}
          </Button>
        )}
      </div>

      {visibleRecords.length === 0 ? (
        <EmptyState
          icon={<CircleSlash2 className="size-6" strokeWidth={1.2} />}
          title={records.length
            ? isEnglish ? "No matching entries" : "没有找到相符记录"
            : isEnglish ? "Your journal is still blank" : "日志还是空白的"}
          description={
            records.length
              ? isEnglish ? "Try a different keyword or explore another path." : "尝试换一个关键词，或查看其他入口。"
              : isEnglish ? "After a star-path reading, present mirror, or open dialogue, the entry remains on this device." : "完成一次星轨推演、即时镜像或随心闲谈后，记录会留在这台设备上。"
          }
          actionLabel={records.length ? (isEnglish ? "Clear filters" : "清除筛选") : undefined}
          onAction={
            records.length
              ? () => {
                  setFilter("all");
                  setQuery("");
                }
              : undefined
          }
        />
      ) : (
        <div className="relative space-y-3 before:absolute before:bottom-8 before:left-[1.15rem] before:top-8 before:w-px before:bg-gradient-to-b before:from-white/[.12] before:via-white/[.05] before:to-transparent md:before:left-[1.45rem]">
          {visibleRecords.map((record, index) => {
            const info = kindInfo[record.kind];
            const Icon = info.icon;
            const open = expanded === record.id;
            return (
              <motion.article
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.24) }}
                className="relative pl-10 md:pl-14"
              >
                <span className="absolute left-[.86rem] top-7 z-10 size-2 rounded-full border border-space-950 bg-mist-500 shadow-[0_0_0_5px_rgba(187,185,209,.05)] md:left-[1.16rem]" />
                <Card className="transition duration-500 hover:border-white/[.12]">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? undefined : record.id)}
                    className="flex w-full items-start gap-4 p-5 text-left md:p-6"
                    aria-expanded={open}
                  >
                    <span className="hidden size-10 shrink-0 place-items-center rounded-full border border-white/[.075] bg-white/[.025] sm:grid">
                      <Icon className={cn("size-4", info.color)} strokeWidth={1.3} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge>{info.label}</Badge>
                        {record.reflection && (
                          <Badge className="border-haze-cyan/10 text-haze-cyan/70">
                            {isEnglish ? "Reflected" : "已复盘"}
                          </Badge>
                        )}
                      </span>
                      <span className="mt-3 block truncate text-base font-light text-mist-200">
                        {record.title}
                      </span>
                      <span className="mt-2 line-clamp-2 block text-xs font-light leading-6 text-mist-500">
                        {record.summary}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="flex items-center gap-1.5 text-[9px] text-mist-600">
                        <CalendarClock className="size-3" />
                        {new Date(record.createdAt).toLocaleDateString(isEnglish ? "en" : "zh-CN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <ChevronDown
                        className={cn(
                          "ml-auto mt-4 size-3.5 text-mist-600 transition duration-500",
                          open && "rotate-180",
                        )}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/[.055] p-5 md:p-6">
                          <div className="mb-5 grid gap-4 rounded-2xl border border-white/[.055] bg-space-950/25 p-4 md:grid-cols-[1fr_auto]">
                            <div>
                              <p className="text-[9px] tracking-[.16em] text-mist-600">
                                {isEnglish ? "REALITY CHECK" : "REALITY CHECK · 现实校验"}
                              </p>
                              <p className="mt-2 text-xs font-light leading-6 text-mist-500">
                                {isEnglish
                                  ? "When you return, note what happened next, what information you overlooked, and how you would rewrite this narrative now."
                                  : "回看时，试着记录：后来发生了什么？我当时忽略了哪些信息？现在的我会怎样重写这段叙事？"}
                              </p>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => removeRecord(record.id)}
                            >
                              <Trash2 className="size-3.5" />
                              {isEnglish ? "Delete entry" : "删除这条"}
                            </Button>
                          </div>

                          <div className="mb-5 rounded-2xl border border-white/[.055] bg-white/[.018] p-4">
                            <p className="text-[9px] tracking-[.16em] text-mist-600">
                              {isEnglish ? "REALITY NOTES" : "REALITY NOTES · 现实对照"}
                            </p>
                            {(record.realityNotes ?? []).length > 0 && (
                              <div className="mt-4 space-y-3">
                                {record.realityNotes?.map((note) => (
                                  <div
                                    key={note.id}
                                    className="border-l border-haze-cyan/15 pl-3"
                                  >
                                    <p className="text-xs font-light leading-6 text-mist-400">
                                      {note.text}
                                    </p>
                                    <p className="mt-1 text-[9px] text-mist-600">
                                      {new Date(note.createdAt).toLocaleString(isEnglish ? "en" : "zh-CN")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <Textarea
                              value={noteDrafts[record.id] || ""}
                              onChange={(event) =>
                                setNoteDrafts((current) => ({
                                  ...current,
                                  [record.id]: event.target.value,
                                }))
                              }
                              maxLength={1200}
                              className="mt-4 min-h-24"
                              aria-label={isEnglish ? `Record what happened after “${record.title}”` : `记录「${record.title}」的现实进展`}
                              placeholder={isEnglish
                                ? "What happened later? Which judgment or choice did you revise?"
                                : "后来发生了什么？你修订了哪些判断或选择？"}
                            />
                            <div className="mt-3 flex justify-end">
                              <Button
                                size="sm"
                                variant="soft"
                                onClick={() => addRealityNote(record)}
                                disabled={!noteDrafts[record.id]?.trim()}
                              >
                                {isEnglish ? "Save reality note" : "保存现实对照"}
                              </Button>
                            </div>
                          </div>

                          {record.kind === "chat" ? (
                            <ChatHistoryPreview
                              payload={record.payload}
                              recordId={record.id}
                              isEnglish={isEnglish}
                              translations={translatedDetail}
                            />
                          ) : (
                            <SavedNarrativePreview
                              payload={record.payload}
                              isEnglish={isEnglish}
                              translation={translatedDetail[`narrative:${record.id}`]}
                            />
                          )}

                          {record.reflection && (
                            <div className="mt-5">
                              <ReflectionShareCard
                                fileName={`fate-fork-${record.kind}-reflection.png`}
                                content={{
                                  title: translatedDetail[`reflection-title:${record.id}`] ?? record.reflection.title,
                                  channelLabel: `${info.label} · Fate Fork`,
                                  dateLabel: new Date(
                                    record.reflection.createdAt,
                                  ).toLocaleDateString(isEnglish ? "en" : "zh-CN"),
                                  summary: translatedDetail[`reflection-insight:${record.id}`] ?? record.reflection.insight,
                                  reflections: record.reflection.choices.map(
                                    (choice, index) =>
                                      translatedDetail[`reflection-choice:${record.id}:${index}`] ?? choice,
                                  ),
                                  imageryTags: record.reflection.imageryTags,
                                  disclaimer:
                                    isEnglish
                                      ? "A past narrative does not bind the present. You can always choose again."
                                      : "过去的叙事不约束现在；你始终可以重新选择。",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.article>
            );
          })}
        </div>
      )}

      <InlineNotice className="mt-8">
        {isEnglish ? "All journal entries stay on this device and never sync elsewhere. Clearing browser data or deleting an entry cannot be undone." : "所有日志都留在当前设备，不会同步到其他设备。清除浏览器数据或点击删除后将无法恢复。"}
      </InlineNotice>

      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-space-950/75 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setConfirmClear(false);
            }}
          >
            <motion.div
              ref={dialogRef}
              onKeyDown={trapDialogFocus}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-md rounded-[1.75rem] border border-white/[.1] bg-space-900 p-6 shadow-glass outline-none"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="clear-dialog-title"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] tracking-[.18em] text-mist-500">
                    YOUR JOURNAL
                  </p>
                  <h2 id="clear-dialog-title" className="mt-3 text-xl font-light text-mist-100">
                    {isEnglish ? "Clear all entries?" : "清除全部记录？"}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmClear(false)}
                  aria-label={isEnglish ? "Close" : "关闭"}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mt-5 text-xs font-light leading-6 text-mist-500">
                {isEnglish
                  ? "This will delete the choice journal and saved birth form on this device. It cannot be undone."
                  : "这会同时删除反宿命日志与已保存的生辰表单，操作不可恢复。"}
              </p>
              <div className="mt-7 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmClear(false)}
                  data-autofocus
                >
                  {isEnglish ? "Cancel" : "取消"}
                </Button>
                <Button variant="danger" onClick={clearAll}>
                  <Trash2 className="size-4" />
                  {isEnglish ? "Confirm clear" : "确认清除"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

type HistoryMessage = { id?: string; role?: string; content?: string };

function getHistoryMessages(payload: unknown): HistoryMessage[] {
  return payload &&
    typeof payload === "object" &&
    "messages" in payload &&
    Array.isArray((payload as { messages?: unknown[] }).messages)
    ? (payload as { messages: HistoryMessage[] }).messages
    : [];
}

function getNarrativeTakeaway(payload: unknown): string | undefined {
  const narrative =
    payload &&
    typeof payload === "object" &&
    "narrative" in payload &&
    (payload as { narrative?: unknown }).narrative &&
    typeof (payload as { narrative?: unknown }).narrative === "object"
      ? (payload as { narrative: Record<string, unknown> }).narrative
      : undefined;
  return (typeof narrative?.sharedReflection === "string" && narrative.sharedReflection) ||
    (typeof narrative?.gentleAction === "string" && narrative.gentleAction) ||
    undefined;
}

/** Select only model-authored details; local user writing is never included. */
function generatedDetailEntries(record: HistoryRecord) {
  const items: Array<{ id: string; title: string; summary: string }> = [];
  const takeaway = getNarrativeTakeaway(record.payload);
  if (takeaway) {
    items.push({ id: `narrative:${record.id}`, title: "Generated narrative", summary: takeaway });
  }
  getHistoryMessages(record.payload).forEach((message, index) => {
    if (message.role === "assistant" && message.content?.trim()) {
      items.push({
        id: `chat:${record.id}:${index}`,
        title: "Generated dialogue reply",
        summary: message.content.trim(),
      });
    }
  });
  if (record.reflection) {
    items.push(
      { id: `reflection-title:${record.id}`, title: "Reflection title", summary: record.reflection.title },
      { id: `reflection-insight:${record.id}`, title: "Reflection insight", summary: record.reflection.insight },
      ...record.reflection.choices.slice(0, 3).map((choice, index) => ({
        id: `reflection-choice:${record.id}:${index}`,
        title: "Reflection choice",
        summary: choice,
      })),
    );
  }
  return items.slice(0, 24);
}

function ChatHistoryPreview({
  payload,
  recordId,
  isEnglish,
  translations,
}: {
  payload: unknown;
  recordId: string;
  isEnglish: boolean;
  translations: Record<string, string>;
}) {
  const messages = getHistoryMessages(payload);

  return (
    <div className="space-y-2">
      {messages.slice(-8).map((message, index) => (
        <div
          key={message.id || index}
          className={cn(
            "rounded-2xl px-4 py-3 text-xs font-light leading-6",
            message.role === "user"
              ? "ml-8 bg-white/[.06] text-mist-300"
              : "mr-8 border border-white/[.055] text-mist-500",
          )}
        >
          {message.role === "assistant"
            ? translations[`chat:${recordId}:${messages.indexOf(message)}`] ?? message.content
            : message.content}
        </div>
      ))}
      {messages.length === 0 && (
        <p className="text-xs text-mist-600">
          {isEnglish ? "There are no messages to display in this dialogue." : "这段对话没有可显示的消息。"}
        </p>
      )}
    </div>
  );
}

function SavedNarrativePreview({
  payload,
  isEnglish,
  translation,
}: {
  payload: unknown;
  isEnglish: boolean;
  translation?: string;
}) {
  const takeaway = getNarrativeTakeaway(payload);

  if (!takeaway) return null;

  return (
    <div className="rounded-2xl border border-white/[.055] bg-white/[.018] p-4">
      <p className="text-[9px] tracking-[.16em] text-mist-600">
        {isEnglish ? "ONE THING TO KEEP" : "此刻，想记住的一件事"}
      </p>
      <p className="mt-2 text-xs font-light leading-6 text-mist-400">
        {translation ?? takeaway}
      </p>
    </div>
  );
}
