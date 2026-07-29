import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CornerDownLeft,
  Layers3,
  LoaderCircle,
  MessageCircleMore,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AtmosphereImage } from "@/components/common/AtmosphereImage";
import { InlineNotice } from "@/components/common/InlineNotice";
import { ProcessIndicator } from "@/components/common/ProcessIndicator";
import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ReflectionShareCard,
  TarotFlipSpread,
  TarotSelfDraw,
} from "@/components/visual";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { localStore, newId } from "@/lib/storage";
import type {
  ChatMessage,
  ReflectionCardData,
  TarotNarrative,
  TarotSelfDrawSession,
  TarotSpread,
} from "@/types";

type Phase = "question" | "selecting" | "loading" | "result";

const starterQuestions = [
  "我该如何理解最近反复出现的犹豫？",
  "这段关系中，有什么被我忽略了？",
  "面对眼前的机会，我真正担心的是什么？",
];

const starterQuestionsEnglish = [
  "How can I understand the hesitation that keeps returning?",
  "What might I be overlooking in this relationship?",
  "What am I really worried about in this opportunity?",
];

const tarotReflectionChoices = [
  [
    "先列出已经确认的三件事实",
    "承认其中有一部分仍是我的推测",
    "找一个人核实我最在意的信息",
    "先不急着解释，继续观察几天",
  ],
  [
    "优先保护我此刻最在意的关系",
    "优先保留自己的时间和精力边界",
    "先不牺牲任何一边，补齐更多信息",
    "允许暂时放下一个不再适合的期待",
  ],
  [
    "约一次能获得关键信息的对话",
    "做一个不超过半小时的小尝试",
    "给自己设一个一周后的复盘提醒",
    "先把一项现实压力减到可承受范围",
  ],
] as const;

const tarotReflectionChoicesEnglish = [
  [
    "List three facts I have already confirmed",
    "Acknowledge that part of this is still my assumption",
    "Ask someone to verify the information that matters most",
    "Keep observing for a few days before explaining it",
  ],
  [
    "Protect the relationship that matters most to me right now",
    "Protect my time and energy boundaries",
    "Do not sacrifice either side yet; gather more information",
    "Let go, for now, of an expectation that no longer fits",
  ],
  [
    "Schedule a conversation that can bring key information",
    "Try something small that takes less than thirty minutes",
    "Set a reminder to reflect again in one week",
    "Reduce one practical pressure to a manageable level first",
  ],
] as const;

export function TarotPage() {
  const { isEnglish } = useLocale();
  const [phase, setPhase] = useState<Phase>("question");
  const [question, setQuestion] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [spread, setSpread] = useState<TarotSpread>();
  const [selfDraw, setSelfDraw] = useState<TarotSelfDrawSession>();
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [selectingCard, setSelectingCard] = useState(false);
  const [narrative, setNarrative] = useState<TarotNarrative>();
  const [error, setError] = useState("");
  const [followup, setFollowup] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [answers, setAnswers] = useState(["", "", ""]);
  const [reflection, setReflection] = useState<ReflectionCardData>();
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [recordId, setRecordId] = useState("");
  const [atmosphereSrc, setAtmosphereSrc] = useState<string>();
  const [imageLoading, setImageLoading] = useState(false);
  const [safetyNote, setSafetyNote] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const isSendingFollowupRef = useRef(false);
  const [chatPanelHeight, setChatPanelHeight] = useState<number>();

  useEffect(() => {
    const panel = chatPanelRef.current;
    if (phase !== "result" || !panel) return;

    const syncHeight = () => {
      const nextHeight = Math.ceil(panel.getBoundingClientRect().height);
      setChatPanelHeight((current) => (current === nextHeight ? current : nextHeight));
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [phase, messages.length, safetyNote]);

  async function begin(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;

    setError("");
    setSelfDraw(undefined);
    setSelectedSlots([]);
    setSelectingCard(false);
    setMessages([]);
    setReflection(undefined);
    setAtmosphereSrc(undefined);
    setAnswers(["", "", ""]);
    setSafetyNote("");

    try {
      const session = await api.prepareTarotSelfDraw();
      setSelfDraw(session);
      setPhase("selecting");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "镜像暂时没有展开，请稍后再试。",
      );
      setPhase("question");
    }
  }

  function selectCard(slot: number) {
    if (!selfDraw || selectingCard || selectedSlots.includes(slot)) return;
    if (selectedSlots.length >= selfDraw.requiredSelections) return;
    setSelectedSlots((current) => [...current, slot]);
  }

  function deselectCard(slot: number) {
    if (selectingCard) return;
    setSelectedSlots((current) => current.filter((currentSlot) => currentSlot !== slot));
  }

  async function revealSelectedCards() {
    if (!selfDraw || selectingCard || selectedSlots.length !== selfDraw.requiredSelections) {
      return;
    }

    setSelectingCard(true);
    setError("");
    try {
      const result = await api.revealTarotSelfDraw(
        selfDraw.sessionId,
        selectedSlots,
      );
      setSelectedSlots(result.selectedSlots);
      if (!result.draw) throw new Error("DRAW_NOT_READY");

      const nextSpread = result.draw;
      setSpread(nextSpread);
      setPhase("loading");
      setLoadingStep(1);
      const nextNarrative = await api.createTarotNarrative(
        question.trim(),
        nextSpread,
      );
      setNarrative(nextNarrative);
      setLoadingStep(2);

      const id = newId("tarot");
      setRecordId(id);
      localStore.addHistory({
        id,
        kind: "tarot",
        title: nextNarrative.title || "一次即时镜像",
        summary: nextNarrative.grounding,
        createdAt: new Date().toISOString(),
        payload: {
          question: question.trim(),
          spread: nextSpread,
          narrative: nextNarrative,
        },
      });
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "这次选择没有被记录，请再试一次。",
      );
    } finally {
      setSelectingCard(false);
    }
  }

  async function sendFollowup(event: React.FormEvent) {
    event.preventDefault();
    if (
      !followup.trim() ||
      !spread ||
      !narrative ||
      chatLoading ||
      isSendingFollowupRef.current
    ) {
      return;
    }

    const userMessage: ChatMessage = {
      id: newId("message"),
      role: "user",
      content: followup.trim(),
      createdAt: new Date().toISOString(),
    };
    const history = [...messages, userMessage];
    setMessages(history);
    setFollowup("");
    setChatLoading(true);
    isSendingFollowupRef.current = true;
    setError("");

    try {
      const result = await api.tarotFollowup(
        question,
        spread,
        narrative,
        history,
      );
      const assistantMessage: ChatMessage = {
        id: newId("message"),
        role: "assistant",
        content: result.reply,
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...history, assistantMessage];
      setMessages(nextMessages);
      setSafetyNote(result.safetyNote || "");
      if (recordId) {
        localStore.updateHistory(recordId, {
          payload: { question, spread, narrative, messages: nextMessages },
        });
      }
      window.setTimeout(
        () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        80,
      );
    } catch (caught) {
      // A message that did not receive a reply stays in the composer for retry,
      // rather than appearing as a duplicate bubble in the conversation.
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      setFollowup(userMessage.content);
      setError(caught instanceof ApiError ? caught.message : "追问暂时未能送达。");
    } finally {
      setChatLoading(false);
      isSendingFollowupRef.current = false;
    }
  }

  async function createReflection() {
    if (!narrative || answers.some((answer) => !answer.trim())) return;
    setReflectionLoading(true);
    setError("");
    try {
      const card = await api.reflection({
        source: "tarot",
        sourceTitle: narrative.title,
        narrative,
        answers,
        questions: narrative.followupPrompts.slice(0, 3),
      });
      setReflection(card);
      if (recordId) localStore.updateHistory(recordId, { reflection: card });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "复盘卡片生成失败。");
    } finally {
      setReflectionLoading(false);
    }
  }

  async function generateAtmosphere() {
    if (!narrative) return;
    setImageLoading(true);
    setError("");
    try {
      const result = await api.atmosphereImage(
        narrative.emotionMeta.imageryTags,
        narrative.emotionMeta.emotionalTone,
      );
      setAtmosphereSrc(
        result.imageUrl ||
          (result.imageData
            ? `data:${result.mimeType || "image/png"};base64,${result.imageData}`
            : undefined),
      );
      if (!result.imageUrl && !result.imageData) {
        setError("本次暂未生成意境图。");
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "意境图生成失败。");
    } finally {
      setImageLoading(false);
    }
  }

  if (phase === "selecting" && selfDraw) {
    return (
      <section className="page-container">
        <PageIntro
          eyebrow="TAROT · YOUR DRAW"
          title={isEnglish ? "The shuffle is complete" : "洗牌已经完成"}
          description={isEnglish
            ? "All 78 cards are shuffled and spread out. Choose three face-down positions; they will enter the mirror in the order you choose."
            : "完整的 78 张牌已经洗好并摊开。选择三个背面位置，三张牌会按你的选择顺序进入镜像。"}
          step={isEnglish ? "02 / CHOOSE FOR YOURSELF" : "02 / 亲自选择"}
        />

        <Card className="mx-auto max-w-5xl overflow-hidden">
          <CardContent className="pt-6 md:pt-8">
            <div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/[.06] pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] tracking-[.18em] text-mist-500">THIS MOMENT</p>
                <p className="mt-2 max-w-2xl text-sm font-light leading-7 text-mist-300">
                  “{question}”
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={selectingCard}
                onClick={() => {
                  setPhase("question");
                  setSelfDraw(undefined);
                  setSelectedSlots([]);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <RefreshCw className="size-3.5" />
                {isEnglish ? "Rewrite your question" : "重新写下困惑"}
              </Button>
            </div>

            <TarotSelfDraw
              slotCount={selfDraw.slotCount}
              selectedSlots={selectedSlots}
              requiredSelections={selfDraw.requiredSelections}
              disabled={selectingCard}
              onSelect={selectCard}
              onDeselect={deselectCard}
            />

            {error ? <InlineNotice tone="error" className="mt-5">{error}</InlineNotice> : null}
            <div className="mt-7 flex flex-col items-center gap-3 border-t border-white/[.06] pt-6">
              <Button
                size="lg"
                disabled={
                  selectingCard || selectedSlots.length !== selfDraw.requiredSelections
                }
                onClick={revealSelectedCards}
              >
                {selectingCard ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {isEnglish ? "Turn over these three" : "翻开这三张"}
              </Button>
              <p className="text-center text-xs leading-6 text-mist-500">
                {isEnglish
                  ? "Cards remain hidden until your choices are complete. They are for observing the present, not deciding an outcome."
                  : "牌面在选择完成前保持隐藏；它们用于观察当下，不替你判断结果。"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (phase === "loading") {
    return (
      <section className="page-container flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-xl p-3">
          <CardHeader className="text-center">
            <div className="relative mx-auto mb-6 h-24 w-20">
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  initial={{ x: 0, rotate: 0 }}
                  animate={{
                    x: [0, index === 1 ? 12 : index === 2 ? -12 : 0, 0],
                    rotate: [0, index === 1 ? 5 : index === 2 ? -5 : 0, 0],
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    delay: index * 0.28,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-space-800 to-space-900"
                />
              ))}
            </div>
            <p className="text-[10px] tracking-[.24em] text-mist-500">
              TAROT MIRROR · THREE CARDS
            </p>
            <h1 className="mt-4 text-2xl font-light text-mist-100">
              {isEnglish ? "Opening a mirror for this moment" : "正在洗牌，展开此刻的镜像"}
            </h1>
            <p className="mt-3 text-xs font-light leading-6 text-mist-500">
              {isEnglish
                ? "The three cards you chose are unfolding. Once revealed, the draw remains unchanged."
                : "你选择的三张牌正在展开，结果一经展开便保持不变。"}
            </p>
          </CardHeader>
          <CardContent className="mt-4">
            <ProcessIndicator
              current={loadingStep}
              steps={[
                isEnglish ? "Shuffling quietly" : "安静地洗牌",
                isEnglish ? "Opening three tarot mirrors" : "展开三张塔罗镜像",
                isEnglish ? "Shaping the present narrative" : "整理当下叙事",
              ]}
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (phase === "result" && spread && narrative) {
    const fallbackReflectionChoices = isEnglish
      ? tarotReflectionChoicesEnglish
      : tarotReflectionChoices;
    const cardPositions = isEnglish
      ? ["Present mirror", "Inner block", "Possible paths"]
      : ["此刻镜面", "内在阻力", "可能路径"];
    const interpretations = [
      narrative.situation.body,
      narrative.innerBlock.body,
      narrative.possibilities[0]?.body,
    ];

    return (
      <section className="page-container">
        <PageIntro
          eyebrow="TAROT · PRESENT MIRROR"
          title={narrative.title}
          description={narrative.grounding}
          step={isEnglish ? "MIRROR OPENED · NOT A VERDICT" : "镜像已展开 · 不构成结果判定"}
        />

        {narrative.meta?.provider === "mock" && (
          <Badge className="mb-5 border-haze-champagne/15 text-haze-champagne">
            {isEnglish ? "Preview narrative mode" : "预览叙事模式"}
          </Badge>
        )}

        <Card className="mb-8">
          <CardContent className="pt-6 md:pt-7">
            <div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/[.06] pb-6 md:flex-row md:items-center">
              <div>
                <p className="text-[10px] tracking-[.18em] text-mist-500">
                  YOUR QUESTION
                </p>
                <p className="mt-2 max-w-3xl text-sm font-light leading-7 text-mist-300">
                  “{question}”
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPhase("question");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <RefreshCw className="size-3.5" />
                {isEnglish ? "Ask a new question" : "提出新困惑"}
              </Button>
            </div>
            <TarotFlipSpread
              cards={spread.cards.map((card, index) => ({
                id: card.id,
                name: isEnglish ? card.nameEn : card.name,
                position: cardPositions[index] ?? card.positionLabel,
                orientation: card.orientation,
                // Keywords are rule-engine source labels without English
                // equivalents; omit them in English rather than mix locales.
                keywords: isEnglish ? [] : card.keywords,
                interpretation: interpretations[index],
              }))}
            />
          </CardContent>
        </Card>

        <div className="mb-12 grid gap-4 lg:grid-cols-3">
          <NarrativeLayer
            index="01"
            eyebrow={isEnglish ? "SITUATION" : "SITUATION · 现状"}
            section={narrative.situation}
          />
          <NarrativeLayer
            index="02"
            eyebrow={isEnglish ? "INNER BLOCK" : "INNER BLOCK · 内在阻碍"}
            section={narrative.innerBlock}
          />
          <Card>
            <CardHeader>
              <span className="text-[10px] tracking-[.22em] text-mist-600">03</span>
              <p className="mt-8 text-[10px] tracking-[.18em] text-mist-500">
                {isEnglish ? "POSSIBILITIES" : "POSSIBILITIES · 多重发展"}
              </p>
              <h3 className="mt-3 text-lg font-light text-mist-200">
                {isEnglish
                  ? "Possible perspectives"
                  : narrative.possibilities[0]?.title || "可能性视角"}
              </h3>
            </CardHeader>
            <CardContent className="space-y-5">
              {narrative.possibilities.map((possibility, index) => (
                <div
                  key={`${possibility.title}-${index}`}
                  className="border-l border-haze-cyan/15 pl-4"
                >
                  <p className="text-xs font-medium text-mist-300">
                    {isEnglish ? `Perspective ${index + 1}` : possibility.title}
                  </p>
                  <p className="mt-2 text-sm font-light leading-7 text-mist-500">
                    {possibility.body}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 overflow-hidden bg-gradient-to-br from-haze-purple/[.055] via-white/[.025] to-haze-cyan/[.045]">
          <CardContent className="grid gap-5 pt-6 md:grid-cols-[auto_1fr] md:items-center md:pt-7">
            <span className="grid size-12 place-items-center rounded-full border border-white/[.09]">
              <CornerDownLeft className="size-4 text-mist-400" strokeWidth={1.3} />
            </span>
            <div>
              <p className="text-[10px] tracking-[.18em] text-mist-500">
                A GENTLE NEXT MOVE
              </p>
              <p className="mt-2 text-sm font-light leading-7 text-mist-300">
                {narrative.gentleAction}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mb-12 grid items-start gap-6 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
          <AtmosphereImage
            src={atmosphereSrc}
            loading={imageLoading}
            onGenerate={generateAtmosphere}
            description={isEnglish
              ? `Use ${narrative.emotionMeta.imageryTags.join(", ")} as metaphors. Generate only mist, light, paths, or tides.`
              : `以 ${narrative.emotionMeta.imageryTags.join("、")} 为隐喻，只生成云雾、光影、道路或潮汐。`}
            matchedHeight={chatPanelHeight}
          />
          <div ref={chatPanelRef} className="min-w-0">
          <Card className="flex min-h-[34rem] flex-col lg:h-[40rem] lg:min-h-0">
            <CardHeader className="shrink-0">
              <div className="flex items-center gap-3">
                <MessageCircleMore className="size-4 text-haze-purple" strokeWidth={1.3} />
                <p className="text-[10px] tracking-[.2em] text-mist-500">
                  GENTLE FOLLOW-UP
                </p>
              </div>
              <h2 className="mt-3 text-xl font-light text-mist-200">
                {isEnglish ? "Continue asking, without another draw" : "继续问，但不追加抽牌"}
              </h2>
              <p className="mt-2 text-xs font-light leading-6 text-mist-500">
                {isEnglish
                  ? "Follow-up stays with the same three cards and your real-life feelings, rather than drawing repeatedly for certainty."
                  : "追问只围绕同一组三张牌与现实感受展开，避免不断抽牌制造确定感。"}
              </p>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/[.08] p-4">
                    <p className="text-[10px] tracking-[.14em] text-mist-600">
                      {isEnglish ? "You could continue from here" : "可以从这些方向继续"}
                    </p>
                    <div className="mt-3 space-y-2">
                      {narrative.followupPrompts.slice(0, 3).map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => setFollowup(prompt)}
                          className="block w-full rounded-xl bg-white/[.025] px-3 py-2 text-left text-xs leading-5 text-mist-500 transition hover:bg-white/[.05] hover:text-mist-300"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl px-4 py-3 text-xs font-light leading-6 ${
                      message.role === "user"
                        ? "ml-8 bg-white/[.07] text-mist-300"
                        : "mr-8 border border-white/[.07] bg-space-950/25 text-mist-400"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="mr-8 flex items-center gap-2 rounded-2xl border border-white/[.07] px-4 py-3 text-xs text-mist-500">
                    <LoaderCircle className="size-3.5 animate-spin" />
                    {isEnglish ? "Taking a moment to reflect, without rushing to a conclusion…" : "正在整理，不急着给结论……"}
                  </div>
                )}
                {safetyNote && (
                  <InlineNotice tone="error" className="mr-8">
                    {safetyNote}
                  </InlineNotice>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendFollowup} className="mt-4 flex shrink-0 items-center gap-2">
                <Textarea
                  value={followup}
                  onChange={(event) => setFollowup(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  className="min-h-11 flex-1 py-2.5"
                  rows={1}
                  aria-label={isEnglish ? "Write a tarot mirror follow-up" : "输入塔罗镜像追问"}
                  placeholder={isEnglish ? "Continue with the thought that just surfaced…" : "把刚才浮现的想法继续说下去……"}
                />
                <Button
                  size="icon"
                  type="submit"
                  className="shrink-0"
                  disabled={!followup.trim() || chatLoading}
                  aria-label={isEnglish ? "Send follow-up" : "发送追问"}
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>

        <section className="mb-12">
          <div className="mb-6">
            <p className="text-[10px] tracking-[.22em] text-mist-500">
              MIRROR BACK TO LIFE
            </p>
            <h2 className="mt-3 text-2xl font-light text-mist-200">
              {isEnglish ? "Set the cards down. Keep your own words." : "收回牌面，留下自己的话"}
            </h2>
            <p className="mt-2 text-sm font-light leading-7 text-mist-500">
              {isEnglish
                ? "Choose the line closest to this moment. You do not need to fully explain the feeling yet."
                : "每题选择此刻最贴近的一句，不必急着把感受说完整。"}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {narrative.followupPrompts.slice(0, 3).map((prompt, index) => (
              <Card key={prompt}>
                <CardContent className="pt-6 md:pt-7">
                  <Label
                    className="min-h-12 text-sm leading-6 tracking-normal text-mist-300"
                  >
                    {prompt}
                  </Label>
                  <p className="mt-3 text-xs leading-6 text-mist-500">
                    {isEnglish ? "Which line is closest to how you feel right now?" : "哪一句更接近你此刻的状态？"}
                  </p>
                  <div className="mt-4 space-y-2">
                    {(isEnglish
                      ? fallbackReflectionChoices[index]
                      : narrative.reflectionChoices?.[index] ?? fallbackReflectionChoices[index]
                    ).map((choice) => {
                      const selected = answers[index] === choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            setAnswers((current) =>
                              current.map((answer, answerIndex) =>
                                answerIndex === index ? choice : answer,
                              ),
                            )
                          }
                          className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs font-light leading-5 transition duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haze-cyan/40 ${
                            selected
                              ? "border-haze-cyan/35 bg-haze-cyan/[.09] text-mist-100"
                              : "border-white/[.07] bg-white/[.018] text-mist-500 hover:border-white/[.15] hover:bg-white/[.04] hover:text-mist-300"
                          }`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {error && <InlineNotice tone="error" className="mt-4">{error}</InlineNotice>}
          <div className="mt-5 flex justify-end">
            <Button
              size="lg"
              onClick={createReflection}
              disabled={
                reflectionLoading || answers.some((answer) => !answer.trim())
              }
            >
              {reflectionLoading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {isEnglish ? "Create reflection card" : "生成复盘卡片"}
            </Button>
          </div>
        </section>

        <AnimatePresence>
          {reflection && (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <ReflectionShareCard
                fileName="fate-fork-tarot-reflection.png"
                content={{
                  title: reflection.title,
                  channelLabel: isEnglish ? "INSTANT MIRROR · FATE FORK" : "即时镜像 · Fate Fork",
                  dateLabel: new Date(reflection.createdAt).toLocaleDateString(isEnglish ? "en" : "zh-CN"),
                  summary: reflection.insight,
                  reflections: reflection.choices,
                  imageryTags: reflection.imageryTags,
                  disclaimer: isEnglish
                    ? "A mirror is not a verdict. You still have room to choose and revise."
                    : "镜像不是判定。你依然拥有选择与修正的空间。",
                }}
              />
            </motion.section>
          )}
        </AnimatePresence>

        <InlineNotice>{narrative.disclaimer}</InlineNotice>
      </section>
    );
  }

  return (
    <section className="page-container">
      <PageIntro
        eyebrow="TAROT · PRESENT MIRROR"
        title={isEnglish ? "Instant Mirror Reading" : "即时镜像占卜"}
        description={isEnglish ? "Place the question in front of you. Three mirrors reveal the present, an inner obstacle, and possible directions. They offer language for observation, not a verdict." : "把此刻的困惑放在桌面上。三张镜像依次照见现状、内在阻碍与潜在可能。它们提供观察语言，不替你判断方向。"}
        step={isEnglish ? "01 / WRITE THIS MOMENT" : "01 / 写下此刻"}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] tracking-[.2em] text-mist-500">
                  ONE QUESTION · THREE MIRRORS
                </p>
                <h2 className="mt-3 text-xl font-light text-mist-200">
                  {isEnglish ? "Do not rush toward an answer" : "先别急着寻找答案"}
                </h2>
              </div>
              <span className="grid size-10 place-items-center rounded-full border border-white/[.08]">
                <Layers3 className="size-4 text-mist-400" strokeWidth={1.3} />
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={begin}>
              <Label htmlFor="tarot-question" className="text-sm tracking-normal text-mist-300">
                {isEnglish ? "What would you like to see more clearly?" : "你想更清楚地看见什么？"}
              </Label>
              <Textarea
                id="tarot-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={600}
                className="mt-3 min-h-44 text-[15px]"
                placeholder={isEnglish
                  ? "For example: I am torn between staying and taking another path. What is really holding me back?"
                  : "例如：我在继续坚持和换一条路之间犹豫，真正让我停住的是什么？"}
              />
              <div className="mt-2 flex justify-between text-[9px] tracking-[.1em] text-mist-600">
                <span>{isEnglish ? "Describe feelings and context, rather than only asking whether something will happen." : "尽量描述感受与处境，而非只问“会不会”"}</span>
                <span>{question.length} / 600</span>
              </div>
              {error && <InlineNotice tone="error" className="mt-4">{error}</InlineNotice>}
              <Button
                type="submit"
                size="lg"
                className="mt-6 w-full"
                disabled={!question.trim()}
              >
                {isEnglish ? "Shuffle, then choose for yourself" : "洗牌后亲自抽取"}
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <p className="text-[10px] tracking-[.2em] text-mist-500">
                QUESTION STARTERS
              </p>
              <h2 className="mt-3 text-lg font-light text-mist-200">
                {isEnglish ? "If you do not know how to begin" : "如果一时不知道怎么问"}
              </h2>
            </CardHeader>
            <CardContent className="space-y-2">
              {(isEnglish ? starterQuestionsEnglish : starterQuestions).map((starter) => (
                <button
                  type="button"
                  key={starter}
                  onClick={() => setQuestion(starter)}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[.06] bg-white/[.018] px-4 py-3 text-left text-xs font-light leading-5 text-mist-500 transition duration-500 hover:border-white/[.12] hover:bg-white/[.04] hover:text-mist-300"
                >
                  {starter}
                  <ArrowRight className="size-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </CardContent>
          </Card>
          <InlineNotice>
            {isEnglish
              ? "Each draw unfolds independently; its result is neither reselected nor altered."
              : "每次抽取都独立展开，结果不会被重新挑选或改动。"}
          </InlineNotice>
        </div>
      </div>
    </section>
  );
}

function NarrativeLayer({
  index,
  eyebrow,
  section,
}: {
  index: string;
  eyebrow: string;
  section: TarotNarrative["situation"];
}) {
  return (
    <Card>
      <CardHeader>
        <span className="text-[10px] tracking-[.22em] text-mist-600">{index}</span>
        <p className="mt-8 text-[10px] tracking-[.18em] text-mist-500">{eyebrow}</p>
        <h3 className="mt-3 text-lg font-light text-mist-200">{section.title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-light leading-7 text-mist-500">{section.body}</p>
        {section.reflection && (
          <p className="mt-5 border-l border-haze-purple/15 pl-4 text-xs italic leading-6 text-mist-500">
            {section.reflection}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
