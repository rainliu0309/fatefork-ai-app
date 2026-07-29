import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Eraser,
  FileImage,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  RefreshCw,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AtmosphereImage } from "@/components/common/AtmosphereImage";
import { InlineNotice } from "@/components/common/InlineNotice";
import { ProcessIndicator } from "@/components/common/ProcessIndicator";
import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import {
  localStore,
  newId,
  type SavedBirthProfile,
} from "@/lib/storage";
import type {
  ReflectionCardData,
  ZiweiChart,
  ZiweiNarrative,
} from "@/types";
import {
  DualTrackTimeline,
  ReflectionShareCard,
} from "@/components/visual";

type Phase = "form" | "loading" | "result";

const defaultProfile: SavedBirthProfile = {
  birthDate: "",
  birthTime: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
  birthplace: "",
};

const commonTimezones = [
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Singapore",
  "Asia/Tokyo",
  "America/Toronto",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Australia/Sydney",
  "UTC",
];

const supportedTimezones = (() => {
  const supportedValuesOf = (
    Intl as typeof Intl & {
      supportedValuesOf?: (key: "timeZone") => string[];
    }
  ).supportedValuesOf;
  const zones = supportedValuesOf?.("timeZone") ?? [];
  return [...new Set([...commonTimezones, ...zones])].sort();
})();

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("IMAGE_READ_FAILED"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function ZiweiPage() {
  const [profile, setProfile] = useState<SavedBirthProfile>(defaultProfile);
  const [remember, setRemember] = useState(true);
  const [moodImage, setMoodImage] = useState<string>();
  const [moodImageName, setMoodImageName] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [loadingStep, setLoadingStep] = useState(0);
  const [chart, setChart] = useState<ZiweiChart>();
  const [narrative, setNarrative] = useState<ZiweiNarrative>();
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState(["", "", ""]);
  const [reflection, setReflection] = useState<ReflectionCardData>();
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [recordId, setRecordId] = useState("");
  const [atmosphereSrc, setAtmosphereSrc] = useState<string>();
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    const saved = localStore.getBirthProfile();
    if (saved) setProfile(saved);
  }, []);

  const canSubmit = Boolean(
    profile.birthDate && profile.birthTime && profile.timezone,
  );

  const chartHighlights = useMemo(() => {
    if (!chart) return [];
    return [
      ["命宫", chart.profile.lifePalaceBranch],
      ["身宫", chart.profile.bodyPalaceBranch],
      ["五行局", chart.profile.fiveElementBureau],
      ["时区", chart.calendar.timezone],
    ];
  }, [chart]);

  function updateProfile(field: keyof SavedBirthProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function clearPrivateData() {
    localStore.clearBirthProfile();
    setProfile(defaultProfile);
    setMoodImage(undefined);
    setMoodImageName("");
  }

  async function handleImage(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("请上传 JPG、PNG 或 WebP 图片。");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("图片请控制在 3MB 以内，减少敏感数据传输。");
      return;
    }
    setError("");
    setMoodImage(await fileToDataUrl(file));
    setMoodImageName(file.name);
  }

  async function runReading(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setError("");
    setPhase("loading");
    setLoadingStep(0);
    setReflection(undefined);
    setAtmosphereSrc(undefined);
    setAnswers(["", "", ""]);

    if (remember) localStore.saveBirthProfile(profile);
    else localStore.clearBirthProfile();

    try {
      const nextChart = await api.createZiweiChart(profile);
      setChart(nextChart);
      setLoadingStep(1);

      const nextNarrative = await api.createZiweiNarrative({
        chart: nextChart,
        moodImage: moodImage
          ? {
              mimeType: moodImage.slice(5, moodImage.indexOf(";")),
              data: moodImage,
            }
          : undefined,
      });
      setNarrative(nextNarrative);
      setLoadingStep(2);

      const id = newId("ziwei");
      setRecordId(id);
      localStore.addHistory({
        id,
        kind: "ziwei",
        title: nextNarrative.title || "一次完整星轨推演",
        summary: nextNarrative.opening,
        createdAt: new Date().toISOString(),
        payload: { chart: nextChart, narrative: nextNarrative },
      });
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "推演暂时停在了半路，请稍后再试。",
      );
      setPhase("form");
    }
  }

  async function createReflection() {
    if (!narrative || answers.some((answer) => !answer.trim())) return;
    setReflectionLoading(true);
    setError("");
    try {
      const card = await api.reflection({
        source: "ziwei",
        sourceTitle: narrative.title,
        narrative,
        answers,
        questions: narrative.reflectionQuestions.slice(0, 3),
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
      const src =
        result.imageUrl ||
        (result.imageData
          ? `data:${result.mimeType || "image/png"};base64,${result.imageData}`
          : undefined);
      setAtmosphereSrc(src);
      if (!src) setError("当前为本地演示模式，已生成意境提示词但没有调用图像模型。");
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-6 grid size-20 place-items-center rounded-full border border-dashed border-white/15"
            >
              <span className="size-2 rounded-full bg-haze-purple shadow-[0_0_20px_rgba(170,160,200,.7)]" />
            </motion.div>
            <p className="text-[10px] tracking-[.24em] text-mist-500">
              RULES FIRST · NARRATIVE SECOND
            </p>
            <h1 className="mt-4 text-2xl font-light text-mist-100">
              正在展开两条等权路径
            </h1>
            <p className="mt-3 text-xs font-light leading-6 text-mist-500">
              排盘由本地规则引擎完成，AI 仅将结构转译为开放叙事。
            </p>
          </CardHeader>
          <CardContent className="mt-4">
            <ProcessIndicator
              current={loadingStep}
              steps={[
                "换算出生时区并建立十二宫",
                "读取结构化星曜关系",
                "生成双轨叙事与情绪元数据",
              ]}
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (phase === "result" && chart && narrative) {
    return (
      <section className="page-container">
        <PageIntro
          eyebrow="ZIWEI · LONG HORIZON"
          title={narrative.title}
          description={narrative.opening}
          step="推演已完成 · 结果已保存在本机"
        />

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {chartHighlights.map(([label, value]) => (
            <Badge key={label}>
              {label} · {value}
            </Badge>
          ))}
          {(narrative.generatedBy === "mock" ||
            narrative.meta?.provider === "mock") && (
            <Badge className="border-haze-champagne/15 text-haze-champagne">
              本地演示叙事
            </Badge>
          )}
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-start justify-between gap-5">
            <div>
              <p className="text-[10px] tracking-[.22em] text-mist-500">
                STRUCTURED CHART · 规则引擎输出
              </p>
              <h2 className="mt-3 text-xl font-light text-mist-200">十二宫结构快照</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPhase("form");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <RefreshCw className="size-3.5" />
              重新推演
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {chart.palaces.map((palace) => (
                <div
                  key={`${palace.name}-${palace.earthlyBranch}`}
                  className="rounded-2xl border border-white/[.065] bg-space-950/25 p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-mist-300">{palace.name}</span>
                    <span className="text-[9px] text-mist-600">
                      {palace.earthlyBranch}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-8 text-[10px] leading-4 text-mist-500">
                    {palace.majorStars.join(" · ") || "静宫"}
                  </p>
                </div>
              ))}
            </div>
            <details className="mt-4 rounded-2xl border border-white/[.055] bg-white/[.018] p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs text-mist-400">
                查看结构化星盘 JSON
                <ChevronDown className="size-3.5" />
              </summary>
              <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-space-950/60 p-4 text-[10px] leading-5 text-mist-500">
                {JSON.stringify(chart, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>

        <section className="mb-12">
          <div className="mb-6">
            <p className="text-[10px] tracking-[.22em] text-mist-500">
              GENERATIVE DUAL TIMELINE
            </p>
            <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <h2 className="text-2xl font-light text-mist-200">
                同一组素材，两种展开方式
              </h2>
              <p className="max-w-md text-xs font-light leading-6 text-mist-500">
                线条起伏、节点明暗与流速来自本次叙事的情绪元数据，不表达好坏或概率。
              </p>
            </div>
          </div>
          <DualTrackTimeline
            tracks={[
              {
                id: "aligned",
                eyebrow: "PATH A · EQUAL WEIGHT",
                label: "顺势之路",
                description: "延续已有的力量与节奏，不代表更正确。",
                moments: narrative.alignedPath.map((section, index) => ({
                  id: `aligned-${index}`,
                  label: section.phase || `阶段 ${index + 1}`,
                  title: section.title,
                  narrative: section.body,
                  reflection: section.reflection,
                })),
              },
              {
                id: "turning",
                eyebrow: "PATH B · EQUAL WEIGHT",
                label: "转折之路",
                description: "改变一部分条件与惯性，不代表更冒险。",
                moments: narrative.turningPath.map((section, index) => ({
                  id: `turning-${index}`,
                  label: section.phase || `阶段 ${index + 1}`,
                  title: section.title,
                  narrative: section.body,
                  reflection: section.reflection,
                })),
              },
            ]}
            metadata={narrative.emotionMeta}
          />
        </section>

        <section className="mb-14 grid gap-4 lg:grid-cols-2">
          <PathNarrative
            label="PATH A · 顺势之路"
            title="延续已有的力量"
            sections={narrative.alignedPath}
            accent="purple"
          />
          <PathNarrative
            label="PATH B · 转折之路"
            title="为新条件腾出空间"
            sections={narrative.turningPath}
            accent="cyan"
          />
        </section>

        <Card className="mb-8">
          <CardContent className="grid gap-6 pt-6 md:grid-cols-[1fr_1.6fr] md:pt-7">
            <div>
              <p className="text-[10px] tracking-[.22em] text-mist-500">
                COMMON GROUND
              </p>
              <h2 className="mt-3 text-xl font-light text-mist-200">两条路共同在问</h2>
            </div>
            <p className="prose-calm">{narrative.sharedReflection}</p>
          </CardContent>
        </Card>

        <div className="mb-14 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <AtmosphereImage
            src={atmosphereSrc}
            loading={imageLoading}
            onGenerate={generateAtmosphere}
            description={`以 ${narrative.emotionMeta.imageryTags.join("、")} 为隐喻，生成不含牌面、星盘或宗教符号的抽象氛围图。`}
          />
          <Card>
            <CardHeader>
              <p className="text-[10px] tracking-[.22em] text-mist-500">
                EMOTIONAL METADATA
              </p>
              <h2 className="mt-3 text-xl font-light text-mist-200">叙事的情绪纹理</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <Metric
                  label="冲突强度"
                  value={narrative.emotionMeta.conflictIntensity}
                />
                <Metric label="清晰程度" value={narrative.emotionMeta.clarity} />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {narrative.emotionMeta.imageryTags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <p className="mt-6 text-xs font-light leading-6 text-mist-500">
                氛围：{narrative.emotionMeta.emotionalTone} · 节奏：
                {narrative.emotionMeta.tempo}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mb-14">
          <div className="mb-7">
            <p className="text-[10px] tracking-[.22em] text-mist-500">
              PROGRESSIVE REFLECTION
            </p>
            <h2 className="mt-3 text-2xl font-light text-mist-200">
              把叙事交还给现实里的你
            </h2>
            <p className="mt-3 text-xs font-light leading-6 text-mist-500">
              回答会临时发送到当前后端用于生成复盘卡，不写入服务端数据库；生成后的卡片保存在本机，且不含生辰。
            </p>
          </div>
          <div className="grid gap-4">
            {narrative.reflectionQuestions.slice(0, 3).map((question, index) => (
              <Card key={question}>
                <CardContent className="grid gap-4 pt-6 md:grid-cols-[auto_1fr] md:pt-7">
                  <span className="grid size-9 place-items-center rounded-full border border-white/[.08] text-xs text-mist-500">
                    0{index + 1}
                  </span>
                  <div>
                    <Label htmlFor={`reflection-${index}`} className="text-sm tracking-normal text-mist-200">
                      {question}
                    </Label>
                    <Textarea
                      id={`reflection-${index}`}
                      value={answers[index]}
                      onChange={(event) =>
                        setAnswers((current) =>
                          current.map((answer, answerIndex) =>
                            answerIndex === index ? event.target.value : answer,
                          ),
                        )
                      }
                      className="mt-3 min-h-28"
                      placeholder="不必完整，写下第一个诚实的念头……"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {error && <InlineNotice tone="error" className="mt-4">{error}</InlineNotice>}
          <div className="mt-5 flex justify-end">
            <Button
              size="lg"
              disabled={
                reflectionLoading || answers.some((answer) => !answer.trim())
              }
              onClick={createReflection}
            >
              {reflectionLoading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              生成我的复盘卡片
            </Button>
          </div>
        </section>

        <AnimatePresence>
          {reflection && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <ReflectionShareCard
                fileName="fate-fork-ziwei-reflection.png"
                content={{
                  title: reflection.title,
                  channelLabel: "完整星轨推演 · Fate Fork",
                  dateLabel: new Date(reflection.createdAt).toLocaleDateString("zh-CN"),
                  summary: reflection.insight,
                  reflections: reflection.choices,
                  imageryTags: reflection.imageryTags,
                  closingLine: reflection.closing,
                  disclaimer: "叙事仅供自省参考。人生的作者始终是你。",
                }}
              />
            </motion.section>
          )}
        </AnimatePresence>

        <InlineNotice>
          {narrative.disclaimer} 排盘与叙事是文化符号驱动的自省素材，不是预测结论；任何现实决定仍应结合事实、资源与专业意见。
        </InlineNotice>
      </section>
    );
  }

  return (
    <section className="page-container">
      <PageIntro
        eyebrow="ZIWEI · LONG HORIZON"
        title="完整星轨推演"
        description="从出生时间建立一个结构化的长期视角，再将同一组符号展开为「顺势」与「转折」两条平行叙事。它们权重相同，也都不是预言。"
        step="01 / 填写基础信息"
      />

      <form onSubmit={runReading} className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] tracking-[.2em] text-mist-500">
                  BIRTH INPUT · 仅用于规则排盘
                </p>
                <h2 className="mt-3 text-xl font-light text-mist-200">
                  给时间一个准确的坐标
                </h2>
              </div>
              <span className="grid size-10 place-items-center rounded-full border border-white/[.08] bg-white/[.03]">
                <LockKeyhole className="size-4 text-mist-400" strokeWidth={1.25} />
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="birth-date">公历出生日期</Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-4 size-4 text-mist-500" strokeWidth={1.4} />
                  <Input
                    id="birth-date"
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    value={profile.birthDate}
                    onChange={(event) => updateProfile("birthDate", event.target.value)}
                    className="pl-11 [color-scheme:dark]"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="birth-time">出生时辰</Label>
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-4 top-4 size-4 text-mist-500" strokeWidth={1.4} />
                  <Input
                    id="birth-time"
                    type="time"
                    required
                    value={profile.birthTime}
                    onChange={(event) => updateProfile("birthTime", event.target.value)}
                    className="pl-11 [color-scheme:dark]"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="timezone">出生地时区</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-4 size-4 text-mist-500" strokeWidth={1.4} />
                  <Input
                    id="timezone"
                    list="fatefork-timezones"
                    required
                    value={profile.timezone}
                    onChange={(event) => updateProfile("timezone", event.target.value)}
                    className="pl-11"
                    placeholder="IANA 时区或 +08:00"
                    autoComplete="off"
                  />
                  <datalist id="fatefork-timezones">
                    {supportedTimezones.map((timezone) => (
                      <option key={timezone} value={timezone} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div>
                <Label htmlFor="birthplace">出生地（可选，仅作标记）</Label>
                <Input
                  id="birthplace"
                  value={profile.birthplace}
                  onChange={(event) => updateProfile("birthplace", event.target.value)}
                  placeholder="例如：杭州"
                />
              </div>
            </div>

            <div className="my-7 hairline" />

            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="mood-image" className="mb-1 text-sm tracking-normal text-mist-300">
                    此刻的心境图片（可选）
                  </Label>
                  <p className="text-[10px] leading-5 text-mist-600">
                    仅调节叙事文风，不参与排盘；支持 JPG / PNG / WebP，最大 3MB。
                  </p>
                </div>
                {moodImage && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setMoodImage(undefined);
                      setMoodImageName("");
                    }}
                    aria-label="移除心境图片"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
              <label
                htmlFor="mood-image"
                className="mt-4 flex min-h-28 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/[.1] bg-white/[.018] p-4 transition duration-500 hover:border-white/20 hover:bg-white/[.035]"
              >
                {moodImage ? (
                  <img
                    src={moodImage}
                    alt="心境图片预览"
                    className="size-20 rounded-xl object-cover opacity-75"
                  />
                ) : (
                  <span className="grid size-12 place-items-center rounded-xl border border-white/[.08] bg-white/[.03]">
                    <FileImage className="size-5 text-mist-500" strokeWidth={1.3} />
                  </span>
                )}
                <span>
                  <span className="block text-xs text-mist-300">
                    {moodImageName || "选择一张能代表此刻的图片"}
                  </span>
                  <span className="mt-1 block text-[10px] text-mist-600">
                    图片不会写入历史；生成叙事时会临时发送至后端，并在已配置 Agnes 时交由视觉模型理解
                  </span>
                </span>
                <input
                  id="mood-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => handleImage(event.target.files?.[0])}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <p className="text-[10px] tracking-[.2em] text-mist-500">PRIVACY FIRST</p>
              <h2 className="mt-3 text-lg font-light text-mist-200">隐私由你掌控</h2>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[.06] bg-space-950/20 p-4">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  onClick={() => {
                    setRemember((value) => {
                      const next = !value;
                      if (!next) localStore.clearBirthProfile();
                      return next;
                    });
                  }}
                  className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border ${
                    remember
                      ? "border-haze-cyan/30 bg-haze-cyan/15 text-haze-cyan"
                      : "border-white/15"
                  }`}
                >
                  {remember && <Check className="size-3" />}
                </button>
                <span>
                  <span className="block text-xs text-mist-300">在此设备保存表单</span>
                  <span className="mt-1 block text-[10px] leading-5 text-mist-600">
                    使用 LocalStorage，不上传云数据库。取消后本次仍可推演。
                  </span>
                </span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={clearPrivateData}
              >
                <Eraser className="size-3.5" />
                一键清除已存生辰
              </Button>
            </CardContent>
          </Card>

          <InlineNotice>
            生辰信息只会发送至你正在运行的后端规则引擎。请求 Agnes 时使用的是排盘后的结构化符号，不把原始生辰作为模型任务。
          </InlineNotice>

          {error && <InlineNotice tone="error">{error}</InlineNotice>}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
          >
            开始双轨推演
            <ArrowRight className="size-4" />
          </Button>
          <div className="flex items-center justify-center gap-2 text-[9px] tracking-[.12em] text-mist-600">
            <Save className="size-3" />
            结果仅保存在当前浏览器
          </div>
        </div>
      </form>
    </section>
  );
}

function PathNarrative({
  label,
  title,
  sections,
  accent,
}: {
  label: string;
  title: string;
  sections: ZiweiNarrative["alignedPath"];
  accent: "purple" | "cyan";
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <span
          className={`mb-5 block h-px w-14 ${
            accent === "purple" ? "bg-haze-purple/45" : "bg-haze-cyan/45"
          }`}
        />
        <p className="text-[10px] tracking-[.22em] text-mist-500">{label}</p>
        <h3 className="mt-3 text-xl font-light text-mist-200">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-7">
          {sections.map((section, index) => (
            <article key={`${section.title}-${index}`} className="relative pl-6">
              <span
                className={`absolute left-0 top-2 size-1.5 rounded-full ${
                  accent === "purple"
                    ? "bg-haze-purple/70 shadow-[0_0_10px_rgba(170,160,200,.4)]"
                    : "bg-haze-cyan/70 shadow-[0_0_10px_rgba(155,198,201,.4)]"
                }`}
              />
              {section.phase && (
                <p className="text-[9px] tracking-[.17em] text-mist-600">
                  {section.phase}
                </p>
              )}
              <h4 className="mt-1 text-sm font-medium text-mist-300">{section.title}</h4>
              <p className="mt-3 text-sm font-light leading-7 text-mist-500">
                {section.body}
              </p>
              {section.reflection && (
                <p className="mt-3 border-l border-white/[.08] pl-3 text-xs italic leading-6 text-mist-500">
                  {section.reflection}
                </p>
              )}
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(1, value));
  return (
    <div>
      <div className="mb-2 flex justify-between text-[10px] tracking-[.12em] text-mist-500">
        <span>{label}</span>
        <span>{Math.round(safeValue * 100)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[.055]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${safeValue * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-haze-purple/60 to-haze-cyan/60"
        />
      </div>
    </div>
  );
}
