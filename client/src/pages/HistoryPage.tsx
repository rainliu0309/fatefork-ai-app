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
import { localStore } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { HistoryKind, HistoryRecord } from "@/types";

const kindInfo: Record<
  HistoryKind,
  { label: string; eyebrow: string; icon: typeof Orbit; color: string }
> = {
  ziwei: {
    label: "星轨推演",
    eyebrow: "LONG HORIZON",
    icon: Orbit,
    color: "text-haze-purple",
  },
  tarot: {
    label: "即时镜像",
    eyebrow: "PRESENT MIRROR",
    icon: Sparkles,
    color: "text-haze-cyan",
  },
  chat: {
    label: "随心闲谈",
    eyebrow: "OPEN DIALOGUE",
    icon: MessageCircleMore,
    color: "text-haze-champagne",
  },
};

type Filter = "all" | HistoryKind;

export function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>(() =>
    localStore.getHistory(),
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string>();
  const [confirmClear, setConfirmClear] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
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

  const visibleRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter(
      (record) =>
        (filter === "all" || record.kind === filter) &&
        (!normalized ||
          record.title.toLowerCase().includes(normalized) ||
          record.summary.toLowerCase().includes(normalized)),
    );
  }, [records, filter, query]);

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
        title="反宿命日志"
        description="推演的价值不在「是否应验」，而在你如何选择、修正和继续生活。把过去的叙事与现实并排放置，记录自己真正走过的路。"
        step={`${records.length} 条记录 · 仅保存在本机`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {([
          ["all", "全部记录", Archive],
          ["ziwei", "星轨推演", Orbit],
          ["tarot", "即时镜像", Sparkles],
          ["chat", "随心闲谈", MessageCircleMore],
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
            placeholder="搜索标题或片段……"
            aria-label="搜索反宿命日志"
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
            清除全部本地数据
          </Button>
        )}
      </div>

      {visibleRecords.length === 0 ? (
        <EmptyState
          icon={<CircleSlash2 className="size-6" strokeWidth={1.2} />}
          title={records.length ? "没有找到相符记录" : "日志还是空白的"}
          description={
            records.length
              ? "尝试换一个关键词，或查看其他入口。"
              : "完成一次星轨推演、即时镜像或随心闲谈后，记录会留在这台设备上。"
          }
          actionLabel={records.length ? "清除筛选" : undefined}
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
                            已复盘
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
                        {new Date(record.createdAt).toLocaleDateString("zh-CN", {
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
                                REALITY CHECK
                              </p>
                              <p className="mt-2 text-xs font-light leading-6 text-mist-500">
                                回看时，试着记录：后来发生了什么？我当时忽略了哪些信息？现在的我会怎样重写这段叙事？
                              </p>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => removeRecord(record.id)}
                            >
                              <Trash2 className="size-3.5" />
                              删除这条
                            </Button>
                          </div>

                          <div className="mb-5 rounded-2xl border border-white/[.055] bg-white/[.018] p-4">
                            <p className="text-[9px] tracking-[.16em] text-mist-600">
                              REALITY NOTES · 现实对照
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
                                      {new Date(note.createdAt).toLocaleString("zh-CN")}
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
                              aria-label={`记录「${record.title}」的现实进展`}
                              placeholder="后来发生了什么？你修订了哪些判断或选择？"
                            />
                            <div className="mt-3 flex justify-end">
                              <Button
                                size="sm"
                                variant="soft"
                                onClick={() => addRealityNote(record)}
                                disabled={!noteDrafts[record.id]?.trim()}
                              >
                                保存现实对照
                              </Button>
                            </div>
                          </div>

                          {record.kind === "chat" ? (
                            <ChatHistoryPreview payload={record.payload} />
                          ) : (
                            <details className="rounded-2xl border border-white/[.055] bg-white/[.018] p-4">
                              <summary className="cursor-pointer list-none text-xs text-mist-400">
                                查看保存的结构化结果
                              </summary>
                              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-space-950/55 p-4 text-[10px] leading-5 text-mist-600">
                                {JSON.stringify(record.payload, null, 2)}
                              </pre>
                            </details>
                          )}

                          {record.reflection && (
                            <div className="mt-5">
                              <ReflectionShareCard
                                fileName={`fate-fork-${record.kind}-reflection.png`}
                                content={{
                                  title: record.reflection.title,
                                  channelLabel: `${info.label} · Fate Fork`,
                                  dateLabel: new Date(
                                    record.reflection.createdAt,
                                  ).toLocaleDateString("zh-CN"),
                                  summary: record.reflection.insight,
                                  reflections: record.reflection.choices,
                                  imageryTags: record.reflection.imageryTags,
                                  closingLine: record.reflection.closing,
                                  disclaimer:
                                    "过去的叙事不约束现在；你始终可以重新选择。",
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
        所有日志都存放在当前浏览器的 LocalStorage，不跨设备同步。清除浏览器数据或点击删除后将无法恢复。
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
                    CLEAR LOCAL DATA
                  </p>
                  <h2 id="clear-dialog-title" className="mt-3 text-xl font-light text-mist-100">
                    清除全部本地记录？
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmClear(false)}
                  aria-label="关闭"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mt-5 text-xs font-light leading-6 text-mist-500">
                这会同时删除反宿命日志与已保存的生辰表单，操作不可恢复。
              </p>
              <div className="mt-7 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmClear(false)}
                  data-autofocus
                >
                  取消
                </Button>
                <Button variant="danger" onClick={clearAll}>
                  <Trash2 className="size-4" />
                  确认清除
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ChatHistoryPreview({ payload }: { payload: unknown }) {
  const messages =
    payload &&
    typeof payload === "object" &&
    "messages" in payload &&
    Array.isArray((payload as { messages?: unknown[] }).messages)
      ? (payload as { messages: Array<{ id?: string; role?: string; content?: string }> })
          .messages
      : [];

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
          {message.content}
        </div>
      ))}
      {messages.length === 0 && (
        <p className="text-xs text-mist-600">这段对话没有可显示的消息。</p>
      )}
    </div>
  );
}
