import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  CircleDashed,
  MessageCircleMore,
  Orbit,
  Sparkles,
} from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const entrances = [
  {
    to: "/ziwei",
    index: "01",
    eyebrow: "LONG HORIZON",
    title: "完整星轨推演",
    subtitle: "紫微斗数 · 长期视角",
    description:
      "从十二宫结构出发，让同一组人生素材沿「顺势」与「转折」两条等权路径被重新看见。",
    icon: Orbit,
    accent: "from-haze-purple/25 via-transparent to-transparent",
    dot: "bg-haze-purple",
    emphasis: "primary",
    action: "以长期视角展开",
    details: ["十二宫结构", "双轨平行叙事", "复盘卡片"],
  },
  {
    to: "/tarot",
    index: "02",
    eyebrow: "PRESENT MIRROR",
    title: "即时镜像占卜",
    subtitle: "塔罗 · 当下视角",
    description:
      "写下此刻的困惑，随机展开三张简约镜像。不替你决定，只照见局势里的多种可能。",
    icon: Sparkles,
    accent: "from-haze-cyan/20 via-transparent to-transparent",
    dot: "bg-haze-cyan",
    emphasis: "secondary",
    action: "照见此刻的局势",
    details: [],
  },
  {
    to: "/chat",
    index: "03",
    eyebrow: "OPEN DIALOGUE",
    title: "随心闲谈",
    subtitle: "无符号 · 纯思辨",
    description:
      "不启用任何命理系统。把纠结慢慢说出来，在开放对话中辨认真正重要的条件、感受与选择。",
    icon: MessageCircleMore,
    accent: "from-haze-champagne/20 via-transparent to-transparent",
    dot: "bg-haze-champagne",
    emphasis: "tertiary",
    action: "先把心事说出来",
    details: [],
  },
];

/**
 * A CSS-only route map makes the primary entry feel like the product's core
 * experience instead of a card that is merely larger than its neighbours.
 */
function ParallelRouteMap() {
  return (
    <div
      className="pointer-events-none absolute -right-14 top-8 hidden h-[268px] w-[350px] overflow-hidden xl:block"
      aria-hidden="true"
    >
      <span className="absolute -right-14 -top-20 size-72 rounded-full border border-haze-purple/[.15]" />
      <span className="absolute right-1 top-4 size-52 rounded-full border border-dashed border-white/[.10]" />
      <span className="absolute left-10 top-[132px] size-3 rounded-full border border-mist-100/60 bg-space-900 shadow-[0_0_18px_rgba(238,237,246,.35)]" />
      <span className="absolute left-[52px] top-[137px] h-px w-[238px] origin-left -rotate-[27deg] bg-gradient-to-r from-mist-200/60 via-haze-purple/45 to-transparent" />
      <span className="absolute left-[52px] top-[137px] h-px w-[238px] origin-left rotate-[24deg] bg-gradient-to-r from-mist-200/60 via-haze-cyan/40 to-transparent" />
      <span className="absolute left-[196px] top-[64px] size-1.5 rounded-full bg-haze-purple shadow-[0_0_14px_rgba(170,160,200,.85)]" />
      <span className="absolute left-[197px] top-[202px] size-1.5 rounded-full bg-haze-cyan shadow-[0_0_14px_rgba(155,198,201,.85)]" />
      <span className="absolute left-[218px] top-[45px] text-[8px] tracking-[.2em] text-mist-500">
        顺势
      </span>
      <span className="absolute left-[220px] top-[211px] text-[8px] tracking-[.2em] text-mist-500">
        转折
      </span>
      <span className="absolute bottom-2 left-[101px] text-[8px] tracking-[.25em] text-mist-600">
        PARALLEL ROUTES
      </span>
    </div>
  );
}

export function HomePage() {
  const reduceMotion = useReducedMotion();
  const { isEnglish } = useLocale();
  const heroOffsetX = useMotionValue(0);
  const heroOffsetY = useMotionValue(0);
  const heroVisualX = useSpring(heroOffsetX, {
    stiffness: 38,
    damping: 20,
    mass: 0.8,
  });
  const heroVisualY = useSpring(heroOffsetY, {
    stiffness: 38,
    damping: 20,
    mass: 0.8,
  });

  /**
   * The diagram only follows a fine pointer by a few pixels. It keeps the
   * page calm while giving desktop exploration a tactile sense of depth.
   */
  const handleHeroPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    heroOffsetX.set((event.clientX - (bounds.left + bounds.width / 2)) / 30);
    heroOffsetY.set((event.clientY - (bounds.top + bounds.height / 2)) / 36);
  };

  const resetHeroParallax = () => {
    heroOffsetX.set(0);
    heroOffsetY.set(0);
  };

  return (
    <>
      <section
        className="relative flex min-h-[100svh] items-center px-4 pb-24 pt-28 md:px-8 md:pt-32"
        onPointerMove={handleHeroPointerMove}
        onPointerLeave={resetHeroParallax}
      >
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div className="relative z-10 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-7 flex flex-wrap items-center gap-3"
            >
              <Badge className="border-haze-cyan/15 text-haze-cyan">
                {isEnglish ? "GUIDED NARRATIVE · DECISION REFLECTION" : "受控叙事 · 决策自省"}
              </Badge>
              <span className="flex items-center gap-2 text-[10px] tracking-[.18em] text-mist-500">
                <span className="size-1.5 rounded-full bg-haze-cyan/70 shadow-[0_0_10px_rgba(155,198,201,.5)]" />
                {isEnglish ? "YOUR CHOICE REMAINS YOURS" : "选择始终在你手中"}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-balance font-light leading-[.95] tracking-[-.055em]"
            >
              <span className="balanced-gradient-text block text-[clamp(3.5rem,9vw,8.2rem)]">
                {isEnglish ? "Fate Fork" : "命运岔途"}
              </span>
              <span className="mt-5 block text-[clamp(1.25rem,2.8vw,2.25rem)] tracking-[.16em] text-mist-300">
                {isEnglish ? "CHOICE PATHS" : "为选择留出岔路"}
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 1 }}
              className="mt-9 border-l border-white/10 pl-5 md:mt-11 md:pl-7"
            >
              <p className="text-lg font-light leading-8 tracking-[-.01em] text-mist-200 md:text-2xl md:leading-10">
                {isEnglish ? "Explore two parallel paths of choice." : "探索两条并行的选择之路。"}
              </p>
              <p className="mt-1 text-sm font-light tracking-wide text-mist-500 md:text-base">
                {isEnglish ? "You remain the author of your life." : "你始终是自己人生的作者。"}
              </p>
              <p className="mt-5 max-w-xl text-sm font-light leading-7 text-mist-400">
                {isEnglish
                  ? "We do not predict answers. We use two symbolic lenses and an honest dialogue to help you step back from a single anxious path."
                  : "我们不预言答案，只借两套文化符号与一场诚实对话，帮你从焦虑的单一路径里退后一步。"}
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto hidden aspect-square w-full max-w-[580px] lg:block"
            style={{ x: heroVisualX, y: heroVisualY }}
            aria-hidden="true"
          >
            <div className="absolute inset-[8%] animate-[spin_45s_linear_infinite] rounded-full border border-dashed border-white/[.075]" />
            <div className="absolute inset-[21%] animate-[spin_32s_linear_infinite_reverse] rounded-full border border-white/[.06]" />
            <div className="absolute inset-[34%] rounded-full border border-white/[.08] bg-white/[.018] shadow-[0_0_80px_rgba(155,198,201,.05)] backdrop-blur-sm" />
            <div className="absolute left-1/2 top-[27%] h-[39%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/25 to-white/15" />
            <div className="fork-line bottom-[21%] h-[34%] -rotate-[27deg]" />
            <div className="fork-line bottom-[21%] h-[34%] rotate-[27deg]" />
            <div className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-space-900/75 shadow-glow backdrop-blur-md">
              <CircleDashed
                className="size-7 animate-[spin_20s_linear_infinite] text-mist-300"
                strokeWidth={1}
              />
            </div>
            {[
              ["left-[18%] top-[21%]", "此刻"],
              ["right-[15%] top-[25%]", "另一种可能"],
              ["left-[47%] bottom-[13%]", "选择"],
            ].map(([position, label]) => (
              <div
                key={label}
                className={`absolute ${position} flex items-center gap-2 text-[9px] tracking-[.2em] text-mist-500`}
              >
                <span className="size-1 rounded-full bg-mist-300/60 shadow-[0_0_8px_rgba(216,215,231,.5)]" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        <a
          href="#paths"
          className="group absolute bottom-1 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center text-center outline-none focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-haze-cyan/40 md:bottom-2"
          aria-label="向下查看三种选择入口"
        >
          <span className="mb-3 flex items-center gap-3 text-[9px] tracking-[.3em] text-mist-500 transition duration-700 group-hover:text-mist-300">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-mist-500/60" />
            THREE WAYS IN
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-mist-500/60" />
          </span>
          <span className="relative flex items-center gap-3.5 leading-none">
            <span className="absolute -inset-x-9 -inset-y-5 rounded-full bg-[radial-gradient(ellipse,rgba(155,198,201,.12),transparent_68%)] opacity-75 transition duration-700 group-hover:opacity-100" />
            <span className="relative text-[1.45rem] font-light tracking-[.26em] text-mist-100 md:text-[1.7rem]">
              选择入口
            </span>
            <ChevronDown className="relative size-6 shrink-0 text-haze-cyan/90 md:size-7" strokeWidth={1.35} />
          </span>
          <span className="relative mt-4 flex h-12 w-12 justify-center overflow-hidden">
            <span className="absolute -top-1 size-9 rounded-full border border-haze-cyan/[.14]" />
            <span className="absolute inset-y-0 w-px bg-gradient-to-b from-white/[.05] via-haze-cyan/50 to-transparent" />
            <motion.span
              className="absolute top-1 size-2 rounded-full bg-haze-cyan shadow-[0_0_18px_rgba(155,198,201,.95)]"
              animate={
                reduceMotion
                  ? { opacity: 0.7 }
                  : { y: [0, 36, 0], opacity: [0, 1, 0] }
              }
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
        </a>
      </section>

      <section id="paths" className="relative px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 flex flex-col justify-between gap-5 md:mb-14 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] tracking-[.24em] text-mist-500">THREE WAYS IN</p>
              <h2 className="mt-3 text-2xl font-light tracking-[-.02em] text-mist-200 md:text-3xl">
                从你此刻最需要的距离出发
              </h2>
            </div>
            <p className="max-w-sm text-xs font-light leading-6 text-mist-500">
              长期结构、即时镜像或无符号对话。三条入口都不会替代你的现实判断。
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
            {entrances.map((item, index) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.09, duration: 0.7 }}
                className={cn(
                  item.emphasis === "primary" && "lg:col-span-5",
                  item.emphasis === "secondary" && "lg:col-span-4 lg:pt-12",
                  item.emphasis === "tertiary" && "lg:col-span-3 lg:pt-24",
                )}
              >
                <Link to={item.to} className="group block h-full">
                  <Card
                    className={cn(
                      "relative h-full overflow-hidden transition duration-700 hover:-translate-y-1 hover:border-white/[.16] hover:bg-white/[.06]",
                      item.emphasis === "primary" &&
                        "min-h-[470px] border-haze-purple/[.32] bg-[linear-gradient(135deg,rgba(170,160,200,.16),rgba(24,29,47,.74)_46%,rgba(11,16,29,.9))] p-7 shadow-[0_36px_120px_rgba(42,37,76,.25),inset_0_1px_0_rgba(255,255,255,.1)] md:p-9 lg:h-[470px]",
                      item.emphasis === "secondary" &&
                        "min-h-[410px] p-7 lg:h-[470px] md:p-8",
                      item.emphasis === "tertiary" &&
                        "min-h-[370px] p-7 opacity-90 lg:h-[470px] md:p-8",
                    )}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-50 transition duration-700 group-hover:opacity-100`}
                    />
                    {item.emphasis === "primary" && (
                      <ParallelRouteMap />
                    )}
                    <span
                      className={cn(
                        "pointer-events-none absolute -bottom-10 -right-1 text-[11rem] font-light leading-none tracking-[-.1em]",
                        item.emphasis === "primary"
                          ? "text-haze-purple/[.09]"
                          : "text-white/[.025]",
                      )}
                      aria-hidden="true"
                    >
                      {item.index}
                    </span>
                    <div
                      className={cn(
                        "relative flex h-full flex-col",
                        item.emphasis === "primary" && "xl:max-w-[63%]",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-[10px] tracking-[.22em] text-mist-500",
                            item.emphasis === "primary" && "text-mist-300",
                          )}
                        >
                          {item.index} / {item.eyebrow}
                        </span>
                        <span
                          className={cn(
                            "grid place-items-center rounded-full border border-white/[.09] bg-white/[.035] text-mist-300 transition duration-700 group-hover:rotate-12 group-hover:border-white/20 group-hover:text-white",
                            item.emphasis === "primary" &&
                              "size-12 border-haze-purple/[.30] bg-haze-purple/[.08] shadow-[0_0_30px_rgba(170,160,200,.12)]",
                            item.emphasis !== "primary" && "size-11",
                          )}
                        >
                          <item.icon className="size-4.5" strokeWidth={1.25} />
                        </span>
                      </div>

                      <div
                        className={cn(
                          item.emphasis === "primary" ? "mt-16" : "mt-24",
                        )}
                      >
                        <div className="mb-4 flex items-center gap-2">
                          <span className={`size-1.5 rounded-full ${item.dot} opacity-70`} />
                          <span className="line-clamp-1 text-[10px] tracking-[.18em] text-mist-500">
                            {item.subtitle}
                          </span>
                        </div>
                        <h3
                          className={cn(
                            "font-light tracking-[-.025em] text-mist-100",
                            item.emphasis === "primary" && "line-clamp-2 text-3xl md:text-4xl",
                            item.emphasis === "secondary" && "line-clamp-2 text-2xl md:text-[1.7rem]",
                            item.emphasis === "tertiary" && "line-clamp-2 text-xl md:text-2xl",
                          )}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-5 line-clamp-3 text-sm font-light leading-7 text-mist-400">
                          {item.description}
                        </p>
                        {item.details.length > 0 && (
                          <div className="mt-8 grid grid-cols-3 divide-x divide-white/[.08] border-y border-white/[.08]">
                            {item.details.map((detail, detailIndex) => (
                              <span
                                key={detail}
                                className="flex min-h-14 flex-col justify-center px-3 first:pl-0"
                              >
                                <span className="text-[8px] tracking-[.18em] text-haze-purple/70">
                                  0{detailIndex + 1}
                                </span>
                                <span className="mt-1 text-[9px] tracking-[.08em] text-mist-400">
                                  {detail}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div
                        className={cn(
                          "mt-auto flex items-center justify-between pt-10",
                          item.emphasis === "primary" &&
                            "border-t border-white/[.08] pt-6",
                        )}
                      >
                        <span className="text-xs tracking-[.12em] text-mist-400 transition duration-500 group-hover:text-mist-100">
                          {item.action}
                        </span>
                        <ArrowUpRight className="size-4 text-mist-500 transition duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-mist-200" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative px-4 pb-8 pt-14 md:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="hairline mb-8" />
          <div className="grid gap-8 rounded-[1.75rem] border border-white/[.06] bg-white/[.025] p-6 md:grid-cols-[1fr_1.5fr] md:p-8">
            <div>
              <p className="text-xs tracking-[.2em] text-mist-300">FATE FORK · 命运岔途</p>
              <p className="mt-2 text-[10px] tracking-[.12em] text-mist-600">
                A MIRROR, NEVER A VERDICT.
              </p>
            </div>
            <div>
              <p className="text-xs font-light leading-6 text-mist-500">
                中立声明：本产品提供的是基于文化符号与受控生成的叙事性自省体验，不构成命运预测、心理治疗、医疗、法律或财务建议。所有结果均为开放参考，现实选择与行动权始终属于你。
              </p>
              <p className="mt-3 text-[10px] leading-5 text-mist-600">
                Fate Fork offers reflective narratives, not predictions or professional advice.
                You remain responsible for your choices.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
