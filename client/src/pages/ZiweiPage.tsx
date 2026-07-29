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
import { useEffect, useMemo, useRef, useState } from "react";
import { AtmosphereImage } from "@/components/common/AtmosphereImage";
import { InlineNotice } from "@/components/common/InlineNotice";
import { ProcessIndicator } from "@/components/common/ProcessIndicator";
import { PageIntro } from "@/components/layout/PageIntro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { useLocale } from "@/lib/locale";
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
type PathKey = "aligned" | "turning";

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

const reflectionChoices = [
  [
    "先照顾我此刻真实的感受",
    "先把现实条件和边界列清",
    "先收集更多信息，再决定",
    "我想暂时留一点空白",
  ],
  [
    "延续已经有效的做法",
    "尝试一个小而可逆的变化",
    "先和可信的人认真谈谈",
    "先不急着给出答案",
  ],
  [
    "把注意力放回我能控制的部分",
    "为真正重要的事留出时间",
    "允许自己重新调整方向",
    "带着不确定继续向前一点",
  ],
] as const;

const reflectionChoicesEnglish = [
  [
    "Start with what I genuinely feel right now",
    "List the practical conditions and boundaries first",
    "Gather more information before deciding",
    "Leave some room for uncertainty for now",
  ],
  [
    "Continue what is already working",
    "Try one small, reversible change",
    "Talk it through carefully with someone I trust",
    "Do not rush to an answer yet",
  ],
  [
    "Return my attention to what I can influence",
    "Make time for what genuinely matters",
    "Allow myself to adjust direction again",
    "Move one step forward with uncertainty still present",
  ],
] as const;

const tempoLabels = {
  slow: "缓慢",
  steady: "平稳",
  flowing: "流动",
} as const;

const tempoLabelsEnglish = {
  slow: "Slow",
  steady: "Steady",
  flowing: "Flowing",
} as const;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("IMAGE_READ_FAILED"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function ZiweiPage() {
  const { isEnglish } = useLocale();
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
  const [reflectionStep, setReflectionStep] = useState(0);
  const [activePath, setActivePath] = useState<PathKey | null>(null);
  const [pathProgress, setPathProgress] = useState<Record<PathKey, number>>({
    aligned: 0,
    turning: 0,
  });
  const [reflection, setReflection] = useState<ReflectionCardData>();
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [recordId, setRecordId] = useState("");
  const [atmosphereSrc, setAtmosphereSrc] = useState<string>();
  const [imageLoading, setImageLoading] = useState(false);
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [timezoneQuery, setTimezoneQuery] = useState("");
  const timezonePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStore.getBirthProfile();
    if (saved) setProfile(saved);
  }, []);

  useEffect(() => {
    if (!timezoneOpen) return;

    // 让选择面板可随时关闭，同时不影响再次打开查看完整时区名称。
    function closePicker(event: PointerEvent) {
      if (!timezonePickerRef.current?.contains(event.target as Node)) {
        setTimezoneOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setTimezoneOpen(false);
    }

    document.addEventListener("pointerdown", closePicker);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closePicker);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [timezoneOpen]);

  const canSubmit = Boolean(
    profile.birthDate && profile.birthTime && profile.timezone,
  );

  const filteredTimezones = useMemo(() => {
    const query = timezoneQuery.trim().toLowerCase();
    if (!query) return supportedTimezones;
    return supportedTimezones.filter((timezone) =>
      timezone.toLowerCase().includes(query),
    );
  }, [timezoneQuery]);

  const chartHighlights = useMemo(() => {
    if (!chart) return [];
    return [
      [isEnglish ? "Life palace" : "命宫", chart.profile.lifePalaceBranch],
      [isEnglish ? "Body palace" : "身宫", chart.profile.bodyPalaceBranch],
      [isEnglish ? "Five elements" : "五行局", chart.profile.fiveElementBureau],
      [isEnglish ? "Time zone" : "时区", chart.calendar.timezone],
    ];
  }, [chart, isEnglish]);

  function updateProfile(field: keyof SavedBirthProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function clearPrivateData() {
    localStore.clearBirthProfile();
    setProfile(defaultProfile);
    setMoodImage(undefined);
    setMoodImageName("");
  }

  function openPath(path: PathKey) {
    setActivePath(path);
    setPathProgress((current) => ({
      ...current,
      [path]: Math.max(1, current[path]),
    }));
  }

  function advancePath() {
    if (!activePath) return;
    setPathProgress((current) => ({
      ...current,
      [activePath]: current[activePath] + 1,
    }));
  }

  async function handleImage(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("请上传 JPG、PNG 或 WebP 图片。");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("请选择不超过 3MB 的图片。");
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
    setReflectionStep(0);
    setActivePath(null);
    setPathProgress({ aligned: 0, turning: 0 });

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
      if (!src) setError("本次暂未生成意境图。");
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
              STAR TRACK · TWO PATHS
            </p>
            <h1 className="mt-4 text-2xl font-light text-mist-100">
              {isEnglish ? "Opening two equally weighted paths" : "正在展开两条等权路径"}
            </h1>
            <p className="mt-3 text-xs font-light leading-6 text-mist-500">
              {isEnglish
                ? "Reading the chart structure and unfolding two open narrative paths."
                : "正在梳理星盘结构，并展开两条开放的叙事路径。"}
            </p>
          </CardHeader>
          <CardContent className="mt-4">
            <ProcessIndicator
              current={loadingStep}
              steps={[
                isEnglish ? "Preparing birth details" : "整理出生信息",
                isEnglish ? "Opening the twelve-palace map" : "展开十二宫星轨",
                isEnglish ? "Writing continuity and change narratives" : "生成顺势与转折叙事",
              ]}
            />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (phase === "result" && chart && narrative) {
    const activeReflectionChoices = isEnglish
      ? reflectionChoicesEnglish
      : reflectionChoices;
    const pathTracks = {
      aligned: {
        id: "aligned",
        eyebrow: "PATH A · EQUAL WEIGHT",
        label: isEnglish ? "Path of Continuity" : "顺势之路",
        description: isEnglish ? "Continuing familiar resources and rhythms does not make it more correct." : "延续已有的力量与节奏，不代表更正确。",
        moments: narrative.alignedPath.map((section, index) => ({
          id: `aligned-${index}`,
          label: section.phase || (isEnglish ? `Phase ${index + 1}` : `阶段 ${index + 1}`),
          title: section.title,
          narrative: section.body,
          reflection: section.reflection,
        })),
      },
      turning: {
        id: "turning",
        eyebrow: "PATH B · EQUAL WEIGHT",
        label: isEnglish ? "Path of Change" : "转折之路",
        description: isEnglish ? "Changing some conditions and habits does not make it more risky." : "改变一部分条件与惯性，不代表更冒险。",
        moments: narrative.turningPath.map((section, index) => ({
          id: `turning-${index}`,
          label: section.phase || (isEnglish ? `Phase ${index + 1}` : `阶段 ${index + 1}`),
          title: section.title,
          narrative: section.body,
          reflection: section.reflection,
        })),
      },
    };
    const currentTrack = activePath ? pathTracks[activePath] : undefined;
    const currentProgress = activePath ? pathProgress[activePath] : 0;
    const otherPath: PathKey | null = activePath
      ? activePath === "aligned"
        ? "turning"
        : "aligned"
      : null;
    const reflectionQuestions = narrative.reflectionQuestions.slice(0, 3);
    // Keep this framing as interface copy so changing language never leaves a
    // previously saved compatibility projection mixed with the active locale.
    const sharedReflection = `${isEnglish
      ? "Whether you continue or turn, both paths invite you to notice what you truly need, what costs you can hold, and when a choice may need revising. "
      : "无论延续还是转向，两条路径都在邀请你辨认真实需要、可承担的代价与修订选择的时机。"}${reflectionQuestions[0] ?? ""}`;
    const activeReflectionQuestion = reflectionQuestions[reflectionStep];
    const isLastReflectionStep =
      reflectionStep === reflectionQuestions.length - 1;
    const completedPathCount = (Object.keys(pathTracks) as PathKey[]).filter(
      (path) =>
        pathTracks[path].moments.length > 0 &&
        pathProgress[path] >= pathTracks[path].moments.length,
    ).length;
    const hasCompletedBothPaths = completedPathCount === 2;

    return (
      <section className="page-container">
        <PageIntro
          eyebrow="ZIWEI · LONG HORIZON"
          title={narrative.title}
          description={narrative.opening}
          step={isEnglish ? "READING COMPLETE · SAVED ON THIS DEVICE" : "推演已完成 · 结果已保存在当前设备"}
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
              {isEnglish ? "Preview narrative mode" : "预览叙事模式"}
            </Badge>
          )}
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-start justify-between gap-5">
            <div>
              <p className="text-[10px] tracking-[.22em] text-mist-500">
                {isEnglish ? "YOUR STAR MAP · THIS STRUCTURE" : "YOUR STAR MAP · 本次结构"}
              </p>
              <h2 className="mt-3 text-xl font-light text-mist-200">{isEnglish ? "Twelve-palace snapshot" : "十二宫结构快照"}</h2>
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
              {isEnglish ? "Start again" : "重新推演"}
            </Button>
          </CardHeader>
          <CardContent>
            <div
              data-preserve-locale
              className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
            >
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
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="grid gap-6 pt-6 md:grid-cols-[1fr_1.6fr] md:pt-7">
            <div>
              <p className="text-[10px] tracking-[.22em] text-mist-500">
                COMMON GROUND
              </p>
              <h2 className="mt-3 text-xl font-light text-mist-200">{isEnglish ? "What both paths are asking" : "两条路共同在问"}</h2>
            </div>
            <p className="prose-calm">{sharedReflection}</p>
          </CardContent>
        </Card>

        <section className="mb-14">
          <div className="mb-6">
            <p className="text-[10px] tracking-[.22em] text-mist-500">
              GRADUAL PATH REVEAL
            </p>
            <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <h2 className="text-2xl font-light text-mist-200">
                {isEnglish ? "Follow one path slowly" : "先沿一条路慢慢看"}
              </h2>
              <p className="max-w-md text-xs font-light leading-6 text-mist-500">
                {isEnglish ? "Both paths carry equal weight. You do not need to read them at once; reveal only the next part in view." : "两条路径权重相同，但不必一次读完。每次只展开眼前这一段。"}
              </p>
            </div>
          </div>

          {!activePath ? (
            <div className="grid gap-4 md:grid-cols-2">
              {([
                ["aligned", isEnglish ? "Path of Continuity" : "顺势之路", isEnglish ? "See how life may unfold when you continue existing strengths." : "先看延续已有力量时，生活会如何展开。"],
                ["turning", isEnglish ? "Path of Change" : "转折之路", isEnglish ? "See what new space may appear when you change some conditions." : "先看改变一部分条件后，会出现哪些新空间。"],
              ] as const).map(([path, label, description]) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => openPath(path)}
                  className="group rounded-[1.75rem] border border-white/[.09] bg-white/[.025] p-6 text-left transition duration-700 hover:border-white/[.18] hover:bg-white/[.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haze-cyan/40"
                >
                  <span className="text-[10px] tracking-[.22em] text-mist-500">
                    {isEnglish ? "BEGIN HERE" : "从这里开始"}
                  </span>
                  <span className="mt-5 block text-xl font-light text-mist-100">
                    {label}
                  </span>
                  <span className="mt-3 block text-xs font-light leading-6 text-mist-500">
                    {description}
                  </span>
                  <span className="mt-8 flex items-center gap-2 text-xs tracking-[.12em] text-mist-400 transition duration-500 group-hover:text-mist-100">
                    {isEnglish ? "Reveal the first part" : "展开第一段"}
                    <ArrowRight className="size-3.5" />
                  </span>
                </button>
              ))}
            </div>
          ) : currentTrack ? (
            <div className="mx-auto max-w-4xl">
              <DualTrackTimeline
                tracks={[
                  {
                    ...currentTrack,
                    moments: currentTrack.moments.slice(0, currentProgress),
                  },
                ]}
                metadata={narrative.emotionMeta}
                locale={isEnglish ? "en" : "zh-CN"}
              />
              <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-white/[.07] bg-white/[.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-mist-500">
                  {isEnglish ? "Revealed" : "已展开"} {Math.min(currentProgress, currentTrack.moments.length)} / {currentTrack.moments.length} {isEnglish ? "sections" : "段"}
                </p>
                {currentProgress < currentTrack.moments.length ? (
                  <Button size="sm" variant="soft" onClick={advancePath}>
                    {isEnglish ? "Reveal the next part" : "继续展开下一段"}
                    <ArrowRight className="size-3.5" />
                  </Button>
                ) : otherPath && pathProgress[otherPath] === 0 ? (
                  <Button size="sm" variant="soft" onClick={() => openPath(otherPath)}>
                    {isEnglish ? "Open the other path now" : "现在展开另一条路径"}
                    <ArrowRight className="size-3.5" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openPath("aligned")}>
                      {isEnglish ? "Revisit Path of Continuity" : "回看顺势之路"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openPath("turning")}>
                      {isEnglish ? "Revisit Path of Change" : "回看转折之路"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>

        {hasCompletedBothPaths ? (
          <>
        <div className="mb-14 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <AtmosphereImage
            src={atmosphereSrc}
            loading={imageLoading}
            onGenerate={generateAtmosphere}
            description={isEnglish
              ? `Use ${narrative.emotionMeta.imageryTags.join(", ")} as metaphors for an abstract atmospheric image without cards, charts, or religious symbols.`
              : `以 ${narrative.emotionMeta.imageryTags.join("、")} 为隐喻，生成不含牌面、星盘或宗教符号的抽象氛围图。`}
          />
          <Card>
            <CardHeader>
              <p className="text-[10px] tracking-[.22em] text-mist-500">
                EMOTIONAL METADATA
              </p>
              <h2 className="mt-3 text-xl font-light text-mist-200">
                {isEnglish ? "Emotional texture of this narrative" : "叙事的情绪纹理"}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <Metric
                  label={isEnglish ? "Conflict intensity" : "冲突强度"}
                  value={narrative.emotionMeta.conflictIntensity}
                />
                <Metric label={isEnglish ? "Clarity" : "清晰程度"} value={narrative.emotionMeta.clarity} />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {narrative.emotionMeta.imageryTags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <p className="mt-6 text-xs font-light leading-6 text-mist-500">
                {isEnglish ? "Tone: " : "氛围："}{narrative.emotionMeta.emotionalTone} · {isEnglish ? "Pace: " : "节奏："}
                {(isEnglish ? tempoLabelsEnglish : tempoLabels)[narrative.emotionMeta.tempo]}
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
              {isEnglish ? "Bring the narrative back to your real life" : "把叙事交还给现实里的你"}
            </h2>
            <p className="mt-3 text-xs font-light leading-6 text-mist-500">
              {isEnglish
                ? "Your selections only shape this reflection card. It remains on this device and does not include birth details."
                : "回答只用于生成本次复盘卡；生成后的卡片保存在此设备，且不包含生辰信息。"}
            </p>
          </div>
          {activeReflectionQuestion && (
            <Card>
              <CardContent className="pt-6 md:pt-7">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] tracking-[.2em] text-mist-500">
                    0{reflectionStep + 1} / 0{reflectionQuestions.length}
                  </span>
                  <div className="flex gap-1.5" aria-label={isEnglish ? "Reflection progress" : "复盘进度"}>
                    {reflectionQuestions.map((question, index) => (
                      <span
                        key={question}
                        className={`h-1.5 w-7 rounded-full ${
                          index <= reflectionStep
                            ? "bg-haze-cyan/60"
                            : "bg-white/[.08]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <h3 className="mt-6 max-w-3xl text-xl font-light leading-8 text-mist-200">
                  {activeReflectionQuestion}
                </h3>
                <p className="mt-3 text-xs leading-6 text-mist-500">
                  {isEnglish ? "Which option feels closest to your current state?" : "此刻，哪一句更贴近你的真实状态？"}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {activeReflectionChoices[reflectionStep].map((choice) => {
                    const selected = answers[reflectionStep] === choice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setAnswers((current) =>
                            current.map((answer, index) =>
                              index === reflectionStep ? choice : answer,
                            ),
                          )
                        }
                        className={`rounded-2xl border p-4 text-left text-sm font-light leading-6 transition duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-haze-cyan/40 ${
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
                <div className="mt-7 flex items-center justify-between gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setReflectionStep((current) => Math.max(0, current - 1))
                    }
                    disabled={reflectionStep === 0}
                  >
                    {isEnglish ? "Previous" : "上一题"}
                  </Button>
                  {isLastReflectionStep ? (
                    <Button
                      size="sm"
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
                      {isEnglish ? "Create my reflection card" : "生成我的复盘卡片"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="soft"
                      disabled={!answers[reflectionStep]}
                      onClick={() => setReflectionStep((current) => current + 1)}
                    >
                      {isEnglish ? "Next" : "下一题"}
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {error && <InlineNotice tone="error" className="mt-4">{error}</InlineNotice>}
        </section>
          </>
        ) : (
          <Card className="mb-14">
            <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between md:pt-7">
              <div>
                <p className="text-[10px] tracking-[.2em] text-mist-500">
                  NEXT · COMPLETE THE PATHS
                </p>
                <p className="mt-2 text-sm font-light leading-6 text-mist-400">
                  {isEnglish
                    ? `You have fully read ${completedPathCount} / 2 paths. Open both before moving to your reflection.`
                    : `已完整阅读 ${completedPathCount} / 2 条路径。两条路都展开后，再进入你的选择复盘。`}
                </p>
              </div>
              <span className="text-xs tracking-[.14em] text-mist-500">
                {isEnglish ? "It is okay to go slowly" : "慢一点，也没关系"}
              </span>
            </CardContent>
          </Card>
        )}

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
                  channelLabel: isEnglish ? "COMPLETE STAR PATH · FATE FORK" : "完整星轨推演 · Fate Fork",
                  dateLabel: new Date(reflection.createdAt).toLocaleDateString(isEnglish ? "en" : "zh-CN"),
                  summary: reflection.insight,
                  reflections: reflection.choices,
                  imageryTags: reflection.imageryTags,
                  disclaimer: isEnglish
                    ? "This narrative is for reflection only. You remain the author of your life."
                    : "叙事仅供自省参考。人生的作者始终是你。",
                }}
              />
            </motion.section>
          )}
        </AnimatePresence>

        <InlineNotice>
          {narrative.disclaimer} {isEnglish
            ? "The chart and narrative are symbolic material for reflection, not predictions. Keep real-world facts, resources, and professional advice in view when making decisions."
            : "排盘与叙事是文化符号驱动的自省素材，不是预测结论；任何现实决定仍应结合事实、资源与专业意见。"}
        </InlineNotice>
      </section>
    );
  }

  return (
    <section className="page-container">
      <PageIntro
        eyebrow="ZIWEI · LONG HORIZON"
        title={isEnglish ? "Complete Star Path" : "完整星轨推演"}
        description={isEnglish ? "Use birth time to open a longer view, then unfold one symbolic set into two parallel narratives: continuity and change. They carry equal weight and are not predictions." : "从出生时间打开一个更长的视角，再将同一组符号展开为「顺势」与「转折」两条平行叙事。它们权重相同，也都不是预言。"}
        step={isEnglish ? "01 / BASIC DETAILS" : "01 / 填写基础信息"}
      />

      <form onSubmit={runReading} className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] tracking-[.2em] text-mist-500">
                  BIRTH INPUT · 仅用于本次推演
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
                <div ref={timezonePickerRef} className="relative">
                  <button
                    id="timezone"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={timezoneOpen}
                    onClick={() => {
                      setTimezoneOpen((open) => !open);
                      setTimezoneQuery("");
                    }}
                    className="flex h-12 w-full items-center rounded-2xl border border-white/10 bg-space-950/35 pl-11 pr-10 text-sm text-mist-100 outline-none transition duration-500 hover:border-white/20 focus:border-haze-cyan/35 focus:bg-space-950/50 focus:ring-4 focus:ring-haze-cyan/[.05]"
                  >
                    <MapPin className="pointer-events-none absolute left-4 size-4 text-mist-500" strokeWidth={1.4} />
                    <span className="min-w-0 flex-1 text-left break-all">
                      {profile.timezone}
                    </span>
                    <ChevronDown
                      className={`pointer-events-none absolute right-4 size-4 text-mist-500 transition-transform duration-300 ${timezoneOpen ? "rotate-180" : ""}`}
                      strokeWidth={1.4}
                    />
                  </button>

                  <AnimatePresence>
                    {timezoneOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        role="dialog"
                        aria-label="选择出生地时区"
                        className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-full max-w-[30rem] overflow-hidden rounded-2xl border border-white/[.12] bg-space-900/95 p-2 shadow-glass backdrop-blur-xl"
                      >
                        <div className="border-b border-white/[.08] p-1 pb-2">
                          <Input
                            autoFocus
                            value={timezoneQuery}
                            onChange={(event) => setTimezoneQuery(event.target.value)}
                            placeholder="搜索时区，例如 Shanghai / Toronto"
                            aria-label="搜索时区"
                            className="h-10"
                          />
                        </div>
                        <div
                          role="listbox"
                          aria-label="时区列表"
                          className="max-h-64 overflow-y-auto py-1"
                        >
                          {filteredTimezones.length ? (
                            filteredTimezones.map((timezone) => {
                              const selected = profile.timezone === timezone;
                              return (
                                <button
                                  key={timezone}
                                  type="button"
                                  role="option"
                                  aria-selected={selected}
                                  onClick={() => {
                                    updateProfile("timezone", timezone);
                                    setTimezoneOpen(false);
                                    setTimezoneQuery("");
                                  }}
                                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm leading-5 transition duration-300 ${
                                    selected
                                      ? "bg-haze-cyan/[.12] text-mist-50"
                                      : "text-mist-300 hover:bg-white/[.06] hover:text-mist-100"
                                  }`}
                                >
                                  <span className="min-w-0 flex-1 break-all">
                                    {timezone}
                                  </span>
                                  {selected ? (
                                    <Check className="size-4 shrink-0 text-haze-cyan" />
                                  ) : null}
                                </button>
                              );
                            })
                          ) : (
                            <p className="px-3 py-5 text-sm text-mist-500">
                              没有匹配的时区
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
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
                    可帮助叙事更贴近你当下的感受。支持 JPG / PNG / WebP，最大 3MB。
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
                    图片不会保存在历史记录中，仅用于本次叙事的氛围调整。
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
                    只保存在此设备，不会同步到其他设备。取消后本次仍可推演。
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
            生辰信息仅用于本次推演；若选择保存，也只保存在当前设备，随时可以清除。
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
            结果仅保存在当前设备
          </div>
        </div>
      </form>
    </section>
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
