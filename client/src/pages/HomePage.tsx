import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpenText,
  ChevronDown,
  CircleDashed,
  MessageCircleMore,
  Orbit,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const entrances = [
  {
    to: "/ziwei",
    index: "01",
    eyebrow: "LONG HORIZON",
    title: "完整星轨推演",
    subtitle: "紫微斗数 · 长期视角",
    description:
      "以规则引擎展开十二宫结构，让同一组人生素材沿「顺势」与「转折」两条等权路径被重新看见。",
    icon: Orbit,
    accent: "from-haze-purple/25 via-transparent to-transparent",
    dot: "bg-haze-purple",
  },
  {
    to: "/tarot",
    index: "02",
    eyebrow: "PRESENT MIRROR",
    title: "即时镜像占卜",
    subtitle: "塔罗 · 当下视角",
    description:
      "写下此刻的困惑，后端完成真实随机洗牌。三张简约镜像不替你决定，只照见局势里的多种可能。",
    icon: Sparkles,
    accent: "from-haze-cyan/20 via-transparent to-transparent",
    dot: "bg-haze-cyan",
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
  },
];

export function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[92vh] items-center px-4 pb-16 pt-28 md:px-8 md:pt-32">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div className="relative z-10 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-7 flex flex-wrap items-center gap-3"
            >
              <Badge className="border-haze-cyan/15 text-haze-cyan">
                受控叙事 · 决策自省
              </Badge>
              <span className="flex items-center gap-2 text-[10px] tracking-[.18em] text-mist-500">
                <span className="size-1.5 rounded-full bg-haze-cyan/70 shadow-[0_0_10px_rgba(155,198,201,.5)]" />
                YOUR CHOICE REMAINS YOURS
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-balance font-light leading-[.95] tracking-[-.055em]"
            >
              <span className="balanced-gradient-text block text-[clamp(3.5rem,9vw,8.2rem)]">
                Fate Fork
              </span>
              <span className="mt-5 block text-[clamp(1.25rem,2.8vw,2.25rem)] tracking-[.16em] text-mist-300">
                命运岔途
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 1 }}
              className="mt-9 border-l border-white/10 pl-5 md:mt-11 md:pl-7"
            >
              <p className="text-lg font-light leading-8 tracking-[-.01em] text-mist-200 md:text-2xl md:leading-10">
                Explore two parallel paths of choice.
              </p>
              <p className="mt-1 text-sm font-light tracking-wide text-mist-500 md:text-base">
                You remain the author of your life.
              </p>
              <p className="mt-5 max-w-xl text-sm font-light leading-7 text-mist-400">
                我们不预言答案，只借两套文化符号与一场诚实对话，
                帮你从焦虑的单一路径里退后一步。
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.75 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link to="/ziwei" className={buttonClassName({ size: "lg" })}>
                开始一次推演
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                to="/history"
                className={buttonClassName({ size: "lg", variant: "soft" })}
              >
                <BookOpenText className="size-4" />
                查看反宿命日志
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto hidden aspect-square w-full max-w-[580px] lg:block"
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
          className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[9px] tracking-[.2em] text-mist-500 md:flex"
        >
          选择入口
          <ChevronDown className="size-3 animate-bounce [animation-duration:2.5s]" />
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

          <div className="grid gap-4 lg:grid-cols-3">
            {entrances.map((item, index) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.09, duration: 0.7 }}
              >
                <Link to={item.to} className="group block h-full">
                  <Card className="relative h-full min-h-[390px] overflow-hidden p-7 transition duration-700 hover:-translate-y-1 hover:border-white/[.16] hover:bg-white/[.06] md:p-8">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-50 transition duration-700 group-hover:opacity-100`}
                    />
                    <div className="relative flex h-full flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] tracking-[.22em] text-mist-500">
                          {item.index} / {item.eyebrow}
                        </span>
                        <span className="grid size-11 place-items-center rounded-full border border-white/[.09] bg-white/[.035] text-mist-300 transition duration-700 group-hover:rotate-12 group-hover:border-white/20 group-hover:text-white">
                          <item.icon className="size-4.5" strokeWidth={1.25} />
                        </span>
                      </div>

                      <div className="mt-24">
                        <div className="mb-4 flex items-center gap-2">
                          <span className={`size-1.5 rounded-full ${item.dot} opacity-70`} />
                          <span className="text-[10px] tracking-[.18em] text-mist-500">
                            {item.subtitle}
                          </span>
                        </div>
                        <h3 className="text-2xl font-light tracking-[-.025em] text-mist-100">
                          {item.title}
                        </h3>
                        <p className="mt-5 text-sm font-light leading-7 text-mist-400">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-10">
                        <span className="text-xs tracking-[.12em] text-mist-400 transition duration-500 group-hover:text-mist-100">
                          进入体验
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
