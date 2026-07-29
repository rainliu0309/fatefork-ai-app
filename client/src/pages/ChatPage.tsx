import { motion } from "framer-motion";
import {
  ArrowUp,
  BrainCircuit,
  CircleDotDashed,
  Eraser,
  LoaderCircle,
  MessageCircleMore,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InlineNotice } from "@/components/common/InlineNotice";
import { PageIntro } from "@/components/layout/PageIntro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { localStore, newId } from "@/lib/storage";
import type { ChatMessage } from "@/types";

const initialMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "可以从最让你卡住的那一小部分说起。我不会调用星盘或牌卡，也不急着替你归纳答案；我们先一起分清：发生了什么、你在意什么、哪些条件仍可改变。",
  createdAt: new Date(0).toISOString(),
};

const prompts = [
  "我在两个选择之间反复摇摆……",
  "我知道该做什么，却一直没有行动……",
  "我害怕选错后会后悔……",
  "我想分清这是直觉还是焦虑……",
];

const promptsEnglish = [
  "I keep wavering between two choices…",
  "I know what to do, but I still cannot act…",
  "I am afraid I will regret choosing wrong…",
  "I want to tell intuition from anxiety…",
];

function initialDialogueMessage(isEnglish: boolean): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: isEnglish
      ? "Begin with the small part that feels most stuck. I will not use a chart or cards, and I will not rush to summarize an answer. We can separate what happened, what matters to you, and what can still change."
      : initialMessage.content,
    createdAt: initialMessage.createdAt,
  };
}

export function ChatPage() {
  const { isEnglish } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [initialDialogueMessage(isEnglish)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recordId, setRecordId] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);
  const [safetyNote, setSafetyNote] = useState("");

  useEffect(() => {
    setMessages((current) =>
      current.length === 1 && current[0]?.id === "welcome"
        ? [initialDialogueMessage(isEnglish)]
        : current,
    );
  }, [isEnglish]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: messages.length > 1 ? "smooth" : "auto",
    });
  }, [messages, loading]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || loading || isSendingRef.current) return;

    const userMessage: ChatMessage = {
      id: newId("message"),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    const context = [...messages.filter((message) => message.id !== "welcome"), userMessage];
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);
    isSendingRef.current = true;
    setError("");

    try {
      const result = await api.chat(context);
      const assistantMessage: ChatMessage = {
        id: newId("message"),
        role: "assistant",
        content: [result.reply, result.reflectionPrompt]
          .filter(Boolean)
          .join("\n\n"),
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...messages, userMessage, assistantMessage];
      setMessages(nextMessages);
      setSafetyNote(result.safetyNote || "");

      const summary = userMessage.content.slice(0, 90);
      if (recordId) {
        localStore.updateHistory(recordId, {
          summary,
          payload: { messages: nextMessages, safetyNote: result.safetyNote },
        });
      } else {
        const id = newId("chat");
        setRecordId(id);
        localStore.addHistory({
          id,
          kind: "chat",
          title: "一段随心闲谈",
          summary,
          createdAt: new Date().toISOString(),
          payload: { messages: nextMessages, safetyNote: result.safetyNote },
        });
      }
    } catch (caught) {
      // Restore an unsent thought to the composer instead of leaving a
      // duplicate-looking user bubble in the conversation history.
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      setInput(userMessage.content);
      setError(caught instanceof ApiError ? caught.message : "对话暂时没有送达。");
    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  }

  function clearConversation() {
    setMessages([initialDialogueMessage(isEnglish)]);
    setRecordId("");
    setInput("");
    setError("");
    setSafetyNote("");
  }

  return (
    <section className="page-container">
      <PageIntro
        eyebrow="OPEN DIALOGUE · NO SYMBOLS"
        title={isEnglish ? "Open Dialogue" : "随心闲谈"}
        description={isEnglish
          ? "No Zi Wei, tarot, or divination symbols are used here. This is an open reflective dialogue to slowly separate facts, feelings, needs, and action."
          : "这里不启用紫微、塔罗或任何命理符号。只有一场开放式思辨对话，陪你把混在一起的事实、情绪、需要与行动慢慢分开。"}
        step={isEnglish ? "No fixed path. Begin with one sentence." : "没有标准流程，从一句话开始"}
      />

      <div className="grid min-h-[680px] gap-5 lg:grid-cols-[.72fr_1.28fr]">
        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageCircleMore className="size-4 text-haze-cyan" strokeWidth={1.25} />
                <p className="text-[10px] tracking-[.2em] text-mist-500">
                  A SOFT START
                </p>
              </div>
              <h2 className="mt-3 text-lg font-light text-mist-200">
                {isEnglish ? "You could begin here" : "可以这样开口"}
              </h2>
            </CardHeader>
            <CardContent className="space-y-2">
              {(isEnglish ? promptsEnglish : prompts).map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="w-full rounded-2xl border border-white/[.055] bg-white/[.018] px-4 py-3 text-left text-xs font-light leading-5 text-mist-500 transition duration-500 hover:border-white/[.12] hover:bg-white/[.04] hover:text-mist-300"
                >
                  {prompt}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6 md:pt-7">
              {[
                {
                  icon: CircleDotDashed,
                  title: isEnglish ? "No need for instant certainty" : "不追求立刻确定",
                  body: isEnglish ? "Let conflicting feelings exist together first." : "先允许矛盾同时存在。",
                },
                {
                  icon: BrainCircuit,
                  title: isEnglish ? "Separate facts from assumptions" : "区分事实与推测",
                  body: isEnglish ? "Make the conditions you can verify visible." : "让可以验证的条件浮现。",
                },
                {
                  icon: ShieldCheck,
                  title: isEnglish ? "Not a substitute for professional support" : "不替代专业支持",
                  body: isEnglish ? "For high-risk concerns, seek qualified support in real life." : "高风险议题请寻找现实中的专业帮助。",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-white/[.07]">
                    <Icon className="size-3.5 text-mist-500" strokeWidth={1.3} />
                  </span>
                  <div>
                    <p className="text-xs text-mist-300">{title}</p>
                    <p className="mt-1 text-[10px] leading-5 text-mist-600">{body}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <Card className="flex h-[calc(100dvh-7rem)] min-h-[36rem] max-h-[46rem] flex-col">
          <CardHeader className="shrink-0 flex flex-row items-center justify-between gap-4 border-b border-white/[.055]">
            <div className="flex items-center gap-3">
              <span className="relative size-2 rounded-full bg-haze-cyan/70">
                <span className="absolute inset-0 animate-ping rounded-full bg-haze-cyan/30 [animation-duration:3s]" />
              </span>
              <div>
                <p className="text-xs text-mist-300">
                  {isEnglish ? "Reflective dialogue" : "思辨对话"}
                </p>
                <p className="mt-0.5 text-[9px] tracking-[.13em] text-mist-600">
                  {isEnglish ? "FREE DIALOGUE" : "随心闲谈"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearConversation}>
              <Eraser className="size-3.5" />
              {isEnglish ? "Start a new dialogue" : "开启新对话"}
            </Button>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1"
              aria-live="polite"
              aria-label={isEnglish ? "Conversation" : "对话内容"}
            >
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-white/[.08] bg-white/[.025]">
                      <span className="size-1.5 rounded-full bg-gradient-to-br from-haze-purple to-haze-cyan" />
                    </span>
                  )}
                  <div
                    className={`max-w-[84%] whitespace-pre-wrap rounded-[1.25rem] px-4 py-3.5 text-sm font-light leading-7 ${
                      message.role === "user"
                        ? "rounded-br-sm bg-mist-100 text-space-900"
                        : "rounded-tl-sm border border-white/[.07] bg-white/[.03] text-mist-400"
                    }`}
                  >
                    {message.content}
                    {index > 0 && (
                      <span
                        className={`mt-2 block text-[9px] ${
                          message.role === "user"
                            ? "text-space-900/45"
                            : "text-mist-600"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString(isEnglish ? "en" : "zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full border border-white/[.08]">
                    <span className="size-1.5 rounded-full bg-haze-purple/70" />
                  </span>
                  <div className="flex items-center gap-2 rounded-[1.25rem] rounded-tl-sm border border-white/[.07] bg-white/[.03] px-4 py-3.5 text-xs text-mist-500">
                    <LoaderCircle className="size-3.5 animate-spin" />
                    {isEnglish ? "Listening, and making room to discern…" : "正在听，也在分辨……"}
                  </div>
                </motion.div>
              )}
              {safetyNote && (
                <InlineNotice tone="error">{safetyNote}</InlineNotice>
              )}
              <div ref={endRef} />
            </div>

            {error && <InlineNotice tone="error" className="mt-4">{error}</InlineNotice>}

            <form onSubmit={send} className="mt-5 border-t border-white/[.055] pt-5">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  maxLength={1600}
                  aria-label={isEnglish ? "Write an open-dialogue message" : "输入随心闲谈消息"}
                  className="min-h-24 pr-16"
                  placeholder={isEnglish
                    ? "Take your time. Enter to send, Shift + Enter for a new line."
                    : "慢慢写。Enter 发送，Shift + Enter 换行。"}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || loading}
                  className="absolute bottom-3 right-3 rounded-xl"
                  aria-label={isEnglish ? "Send message" : "发送消息"}
                >
                  <ArrowUp className="size-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] tracking-[.08em] text-mist-600">
                <span>{isEnglish ? "NO DIVINATION SYMBOLS · THINK FREELY" : "不启用命理符号 · 自由梳理思绪"}</span>
                <span>{input.length} / 1600</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <InlineNotice className="mt-5">
        {isEnglish
          ? "This dialogue stays on this device for later reflection. You can delete it anytime from the Choice Journal."
          : "对话会保存在当前设备，方便你日后回看；你可以随时在「反宿命日志」中删除。"}
      </InlineNotice>
    </section>
  );
}
