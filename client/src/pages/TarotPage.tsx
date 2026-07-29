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
import { useRef, useState } from "react";
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
} from "@/components/visual";
import { api, ApiError } from "@/lib/api";
import { localStore, newId } from "@/lib/storage";
import type {
  ChatMessage,
  ReflectionCardData,
  TarotNarrative,
  TarotSpread,
} from "@/types";

type Phase = "question" | "loading" | "result";

const starterQuestions = [
  "我该如何理解最近反复出现的犹豫？",
  "这段关系中，有什么被我忽略了？",
  "面对眼前的机会，我真正担心的是什么？",
];

export function TarotPage() {
  const [phase, setPhase] = useState<Phase>("question");
  const [question, setQuestion] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [spread, setSpread] = useState<TarotSpread>();
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

  async function begin(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;

    setError("");
    setPhase("loading");
    setLoadingStep(0);
    setMessages([]);
    setReflection(undefined);
    setAtmosphereSrc(undefined);
    setAnswers(["", "", ""]);
    setSafetyNote("");

    try {
      const nextSpread = await api.drawTarot(question.trim());
      setSpread(nextSpread);
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
          : "镜像暂时没有展开，请稍后再试。",
      );
      setPhase("question");
    }
  }

  async function sendFollowup(event: React.FormEvent) {
    event.preventDefault();
    if (!followup.trim() || !spread || !narrative || chatLoading) return;

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
      setError(caught instanceof ApiError ? caught.message : "追问暂时未能送达。");
    } finally {
      setChatLoading(false);
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
        setError("当前为本地演示模式，意境提示词已生成，但未调用图像模型。");
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "意境图生成失败。");
    } finally {
      setImageLoading(false);
    }
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
              CRYPTOGRAPHIC SHUFFLE
            </p>
            <h1 className="mt-4 text-2xl font-light text-mist-100">
              正在洗牌，让随机保持随机
            </h1>
            <p className="mt-3 text-xs font-light leading-6 text-mist-500">
              抽牌由后端算法独立完成，模型无法挑选或更换结果。
            </p>
          </CardHeader>
          <CardContent className="mt-4">
            <ProcessIndicator
              current={loadingStep}
              steps={[
                "加密随机数驱动 Fisher–Yates 洗牌",
                "固定现状 / 内在阻碍 / 可能性三牌位",
                "生成分层中立叙事",
              ]}
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (phase === "result" && spread && narrative) {
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
          step="镜像已展开 · 不构成结果判定"
        />

        {narrative.meta?.provider === "mock" && (
          <Badge className="mb-5 border-haze-champagne/15 text-haze-champagne">
            本地演示叙事 · 未调用 Agnes
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
                提出新困惑
              </Button>
            </div>
            <TarotFlipSpread
              cards={spread.cards.map((card, index) => ({
                id: card.id,
                name: `${card.name} · ${card.nameEn}`,
                position: card.positionLabel,
                orientation: card.orientation,
                keywords: card.keywords,
                interpretation: interpretations[index],
              }))}
            />
          </CardContent>
        </Card>

        <div className="mb-12 grid gap-4 lg:grid-cols-3">
          <NarrativeLayer
            index="01"
            eyebrow="SITUATION · 现状"
            section={narrative.situation}
          />
          <NarrativeLayer
            index="02"
            eyebrow="INNER BLOCK · 内在阻碍"
            section={narrative.innerBlock}
          />
          <Card>
            <CardHeader>
              <span className="text-[10px] tracking-[.22em] text-mist-600">03</span>
              <p className="mt-8 text-[10px] tracking-[.18em] text-mist-500">
                POSSIBILITIES · 多重发展
              </p>
              <h3 className="mt-3 text-lg font-light text-mist-200">
                {narrative.possibilities[0]?.title || "可能性视角"}
              </h3>
            </CardHeader>
            <CardContent className="space-y-5">
              {narrative.possibilities.map((possibility, index) => (
                <div
                  key={`${possibility.title}-${index}`}
                  className="border-l border-haze-cyan/15 pl-4"
                >
                  <p className="text-xs font-medium text-mist-300">
                    {possibility.title}
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

        <div className="mb-12 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <AtmosphereImage
            src={atmosphereSrc}
            loading={imageLoading}
            onGenerate={generateAtmosphere}
            description={`以 ${narrative.emotionMeta.imageryTags.join("、")} 为隐喻，只生成云雾、光影、道路或潮汐。`}
          />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageCircleMore className="size-4 text-haze-purple" strokeWidth={1.3} />
                <p className="text-[10px] tracking-[.2em] text-mist-500">
                  GENTLE FOLLOW-UP
                </p>
              </div>
              <h2 className="mt-3 text-xl font-light text-mist-200">继续问，但不追加抽牌</h2>
              <p className="mt-2 text-xs font-light leading-6 text-mist-500">
                追问只围绕同一组三张牌与现实感受展开，避免不断抽牌制造确定感。
              </p>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/[.08] p-4">
                    <p className="text-[10px] tracking-[.14em] text-mist-600">
                      可以从这些方向继续
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
                    正在整理，不急着给结论……
                  </div>
                )}
                {safetyNote && (
                  <InlineNotice tone="error" className="mr-8">
                    {safetyNote}
                  </InlineNotice>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendFollowup} className="mt-4 flex gap-2">
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
                  aria-label="输入塔罗镜像追问"
                  placeholder="把刚才浮现的想法继续说下去……"
                />
                <Button
                  size="icon"
                  type="submit"
                  disabled={!followup.trim() || chatLoading}
                  aria-label="发送追问"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <section className="mb-12">
          <div className="mb-6">
            <p className="text-[10px] tracking-[.22em] text-mist-500">
              MIRROR BACK TO LIFE
            </p>
            <h2 className="mt-3 text-2xl font-light text-mist-200">收回牌面，留下自己的话</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {narrative.followupPrompts.slice(0, 3).map((prompt, index) => (
              <Card key={prompt}>
                <CardContent className="pt-6 md:pt-7">
                  <Label
                    htmlFor={`tarot-reflection-${index}`}
                    className="min-h-12 text-sm leading-6 tracking-normal text-mist-300"
                  >
                    {prompt}
                  </Label>
                  <Textarea
                    id={`tarot-reflection-${index}`}
                    value={answers[index]}
                    onChange={(event) =>
                      setAnswers((current) =>
                        current.map((answer, answerIndex) =>
                          answerIndex === index ? event.target.value : answer,
                        ),
                      )
                    }
                    className="mt-3"
                    placeholder="写下你的答案……"
                  />
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
              生成复盘卡片
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
                  channelLabel: "即时镜像 · Fate Fork",
                  dateLabel: new Date(reflection.createdAt).toLocaleDateString("zh-CN"),
                  summary: reflection.insight,
                  reflections: reflection.choices,
                  imageryTags: reflection.imageryTags,
                  closingLine: reflection.closing,
                  disclaimer: "镜像不是判定。你依然拥有选择与修正的空间。",
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
        title="即时镜像占卜"
        description="把此刻的困惑放在桌面上。后端将独立洗牌并固定三张镜像：现状、内在阻碍、潜在可能。它们提供观察语言，不替你判断方向。"
        step="01 / 写下此刻"
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
                  先别急着寻找答案
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
                你想更清楚地看见什么？
              </Label>
              <Textarea
                id="tarot-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={600}
                className="mt-3 min-h-44 text-[15px]"
                placeholder="例如：我在继续坚持和换一条路之间犹豫，真正让我停住的是什么？"
              />
              <div className="mt-2 flex justify-between text-[9px] tracking-[.1em] text-mist-600">
                <span>尽量描述感受与处境，而非只问“会不会”</span>
                <span>{question.length} / 600</span>
              </div>
              {error && <InlineNotice tone="error" className="mt-4">{error}</InlineNotice>}
              <Button
                type="submit"
                size="lg"
                className="mt-6 w-full"
                disabled={!question.trim()}
              >
                洗牌并展开镜像
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
              <h2 className="mt-3 text-lg font-light text-mist-200">如果一时不知道怎么问</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              {starterQuestions.map((starter) => (
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
            洗牌使用后端加密随机源与 Fisher–Yates 算法。Agnes 只解读已经抽出的结构，无法重抽、挑牌或调用工具。
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
