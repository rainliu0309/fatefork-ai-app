import { createHash } from "node:crypto";
import type {
  GeneratedImage,
  ReflectionCard,
  ReflectiveReply,
  TarotDraw,
  TarotNarrative,
  ZiweiChart,
  ZiweiNarrative,
} from "../types/api.js";

const MOCK_META = {
  provider: "mock" as const,
  model: "fatefork-local-mock",
  schemaVersion: "1.0",
};

const DISCLAIMER =
  "这是一份用于自省的符号叙事，而非事实预测或行动指令。你始终保有选择权，也是自己生活的作者。";

export function mockZiweiNarrative(chart: ZiweiChart): ZiweiNarrative {
  const life = chart.palaces.find((palace) => palace.isLifePalace);
  const vocation = chart.palaces.find((palace) => palace.name === "官禄");
  const inner = chart.palaces.find((palace) => palace.name === "福德");
  const lifeSymbols = life?.majorStars.join("、") || "命宫留白";
  const vocationSymbols =
    vocation?.majorStars.join("、") || "官禄宫留白";
  const innerSymbols =
    inner?.majorStars.join("、") || "福德宫留白";

  const chapters = {
    flow: [
      {
        id: "flow-1",
        phase: "近景 · 看见已有",
        heading: "让熟悉的节奏变得可见",
        narrative: `以${chart.lifePalaceBranch}宫与${lifeSymbols}作为象征镜面，你可能先从已经积累的能力与关系中辨认稳定支点。这里的重点不是维持不变，而是看清哪些习惯仍在服务于你。`,
        focus: "辨认稳定资源",
        choicePrompt: "最近哪一种熟悉做法仍能为你留出呼吸空间？",
        intensity: 0.38,
      },
      {
        id: "flow-2",
        phase: "中景 · 调整投入",
        heading: "把持续变成有边界的投入",
        narrative: `${vocationSymbols}只被当作工作与责任的象征提示。继续当前方向时，你可以同时观察投入带来的成长与消耗，并为时间、注意力和关系设置可协商的边界。`,
        focus: "校准责任边界",
        choicePrompt: "继续投入的前提里，哪一项最需要被重新协商？",
        intensity: 0.52,
      },
      {
        id: "flow-3",
        phase: "远景 · 留出余地",
        heading: "在延续中保留修订权",
        narrative: `当熟悉路径逐渐加深，${innerSymbols}可以提醒你定期回到内在感受。稳定并不等于封闭；保留复盘节点，会让这条路随着现实信息而微调。`,
        focus: "建立复盘节律",
        choicePrompt: "你愿意用什么现实信号判断需要继续、减量或转向？",
        intensity: 0.46,
      },
    ],
    turn: [
      {
        id: "turn-1",
        phase: "近景 · 松动假设",
        heading: "先改变一个小前提",
        narrative: `同样从${chart.lifePalaceBranch}宫与${lifeSymbols}出发，另一种看法是：不更换整个目标，只松动一个长期默认的前提。你可以从低风险试验开始，观察新的节奏是否更贴近当下需要。`,
        focus: "选择可撤回试验",
        choicePrompt: "如果只允许改变一件很小的事，你最想测试什么？",
        intensity: 0.42,
      },
      {
        id: "turn-2",
        phase: "中景 · 容纳陌生",
        heading: "给新方向一个有限容器",
        narrative: `${vocationSymbols}在这里不是职业结论，而是一种重新组织资源的隐喻。转向可能带来新鲜感，也可能增加学习成本；限定周期与预算，能让探索保持可承受。`,
        focus: "限定探索成本",
        choicePrompt: "什么时间、金钱或情绪边界能保护这次探索？",
        intensity: 0.56,
      },
      {
        id: "turn-3",
        phase: "远景 · 重新命名",
        heading: "允许身份叙事缓慢更新",
        narrative: `当新经验累积，${innerSymbols}可以作为回看内在一致性的象征。你不必立刻为变化下定义；可以先收集现实反馈，再决定哪些部分值得纳入新的自我叙事。`,
        focus: "以证据更新叙事",
        choicePrompt: "哪些可观察反馈会让你愿意扩大这条新路径？",
        intensity: 0.5,
      },
    ],
  };

  return {
    title: "两条同样值得凝视的星轨",
    summary: `${chart.bureau.label}与十二宫符号在这里被转译为选择视角：一条路径深化已有资源，另一条路径用小试验松动前提。它们都保留调整空间。`,
    paths: {
      flow: {
        id: "flow",
        title: "顺势之路",
        subtitle: "深化已经形成的支点",
        thesis: "沿着熟悉方向前行，同时为消耗、边界与复盘留下位置。",
        chapters: chapters.flow,
      },
      turn: {
        id: "turn",
        title: "转折之路",
        subtitle: "用有限试验改写一个前提",
        thesis: "不急于推翻全部，而是让新的现实证据逐步进入选择。",
        chapters: chapters.turn,
      },
    },
    emotion: {
      conflictIntensity: 0.48,
      pace: 0.36,
      luminance: 0.58,
      tone: "安静、清澈、留有余白",
      imageryTags: ["平行微光", "薄雾岔路", "银蓝潮汐", "远处地平线"],
    },
    reflectionQuestions: [
      "此刻哪一部分现实最需要先被如实看见？",
      "两条路径各自需要你承担什么，又各自保护了什么？",
      "未来七天内，你能完成哪一个足够小、可撤回的试验？",
    ],
    imageDirection:
      "深空蓝薄雾中两束等亮的柔和光路平行延展，冷银潮汐与半透明玻璃层缓慢交叠，留出宽阔负空间。",
    disclaimer: DISCLAIMER,
    meta: MOCK_META,
  };
}

export function mockTarotNarrative(draw: TarotDraw): TarotNarrative {
  const references = draw.cards.map(
    (card) => `${card.nameZh}（${card.orientation === "upright" ? "正位" : "逆位"}）`,
  );
  return {
    title: "把问题放在三面安静的镜子之间",
    mirror:
      "你不需要马上把犹豫消除。三张随机符号可以暂时分开处境、内在拉扯与行动空间，让你更容易听见自己真正关心的部分。",
    layers: [
      {
        id: "situation",
        heading: "此刻镜面",
        cardReference: references[0],
        narrative: `${references[0]}带来的关键词是${draw.cards[0].keywords.join("、")}。它可以邀请你先区分已经发生的事实与对后续的想象，不把焦虑本身当作证据。`,
        gentlePrompt: "如果只写下三条已确认事实，它们会是什么？",
        intensity: 0.4,
      },
      {
        id: "inner-block",
        heading: "内在阻力",
        cardReference: references[1],
        narrative: `${references[1]}可以映照${draw.cards[1].keywords.join("、")}之间的拉扯。也许阻力不只是害怕改变，还包括某个需要被保护的关系、节奏或自我期待。`,
        gentlePrompt: "这份迟疑正在试图保护你的哪一种需要？",
        intensity: 0.57,
      },
      {
        id: "possibilities",
        heading: "可能路径",
        cardReference: references[2],
        narrative: `${references[2]}以${draw.cards[2].keywords.join("、")}展开视角：你可以先收集更多信息，也可以做一个范围很小的试验。两者都不要求一次性承诺。`,
        gentlePrompt: "哪个下一步最容易获得真实反馈，同时保留回头空间？",
        intensity: 0.49,
      },
    ],
    possibilities: [
      "先不改变方向，用明确期限补齐一项关键事实，再重新评估。",
      "选择一个影响范围有限的小实验，记录身体感受与现实反馈。",
      "与受影响的人讨论边界和需求，但暂不要求立刻形成共识。",
    ],
    grounding: "先把双脚踩稳、缓慢呼吸，再写下一件今天可以确认的小事实。",
    emotion: {
      conflictIntensity: 0.52,
      pace: 0.32,
      luminance: 0.54,
      tone: "温柔、清醒、不过度靠近",
      imageryTags: ["雾中镜面", "浅青潮线", "微光岔路", "透明涟漪"],
    },
    reflectionQuestions: [
      "问题中哪些是已经发生的事实，哪些仍是你的推测？",
      "每个方向会保护什么，又会暂时放下什么？",
      "你愿意先做哪一个可在一周内复盘的小动作？",
    ],
    imageDirection:
      "雾紫与深空蓝之间浮着三层无文字的半透明镜面，浅青涟漪向多条微光小径扩散，柔和留白。",
    disclaimer: DISCLAIMER,
    meta: MOCK_META,
  };
}

export function mockReflectiveReply(message: string): ReflectiveReply {
  const crisisPattern =
    /(?:自杀|轻生|不想活|伤害自己|伤害他人|kill myself|suicide|hurt myself|hurt someone)/i;
  const atRisk = crisisPattern.test(message);

  return {
    reply: atRisk
      ? "你现在说到的安全风险比梳理选择更重要。请先不要独自承担，也先把可能造成伤害的物品放远。"
      : "我听见你正在几个都重要的需要之间寻找空间。我们可以先不急着选，把已知事实、担心的情景和你真正想保护的东西分别放下来。",
    observations: atRisk
      ? ["此刻最优先的是让你和身边的人保持安全。"]
      : ["犹豫往往说明不止一个价值正在被认真对待。", "把不可控结果与可控动作分开，可能会让问题稍微变轻。"],
    questions: atRisk
      ? ["你现在能否联系一位可信任的人，让对方立即陪着你？"]
      : ["你已经确认的事实有哪些？", "如果暂不追求完美，哪一个需要最值得先被照顾？"],
    emotion: {
      conflictIntensity: atRisk ? 0.86 : 0.44,
      pace: atRisk ? 0.2 : 0.34,
      luminance: atRisk ? 0.42 : 0.58,
      tone: atRisk ? "直接、稳定、以安全为先" : "安静、具体、开放",
      imageryTags: atRisk
        ? ["稳定地面", "近处灯光", "安全边界"]
        : ["清晨薄雾", "玻璃涟漪", "柔光留白"],
    },
    ...(atRisk
      ? {
          safetyNote:
            "如果你可能立即伤害自己或他人，请现在联系当地紧急服务，或让一位可信任的人立即来到你身边。",
        }
      : {}),
    meta: MOCK_META,
  };
}

export function mockReflectionCard(
  sourceType: string,
  answerCount: number,
  imageryTags: string[],
): ReflectionCard {
  return {
    eyebrow: sourceType === "tarot" ? "即时镜像 · 复盘" : "命运岔途 · 选择复盘",
    title: "把选择权带回此刻",
    insight:
      answerCount > 1
        ? "你已经把模糊感受拆成了可以观察的需要、代价与边界；答案不必一次完整，清晰可以在行动与复盘之间逐渐形成。"
        : "你已经为一个重要感受留下了位置；下一步可以继续区分已知事实与仍待验证的假设。",
    choices: [
      "沿着已有支点前行，同时设定一个明确复盘节点。",
      "做一次范围有限、可以撤回的小实验。",
      "暂缓方向承诺，先补齐一项会真正影响选择的信息。",
    ],
    nextStep: "在未来七天内完成一个不超过三十分钟的小动作，并记下它带来的现实反馈。",
    quote: "我可以认真选择，也可以在新信息出现时修订选择。",
    imageryTags:
      imageryTags.length >= 3
        ? imageryTags.slice(0, 6)
        : ["平行微光", "薄雾地平线", "浅青潮汐"],
    disclaimer: DISCLAIMER,
    meta: MOCK_META,
  };
}

export function mockAbstractImage(tags: string[], ratio: string): GeneratedImage {
  const digest = createHash("sha256").update(tags.join("|")).digest();
  const hueA = 210 + (digest[0] % 32);
  const hueB = 255 + (digest[1] % 32);
  const width = ratio === "9:16" ? 768 : ratio === "16:9" ? 1280 : 1024;
  const height = ratio === "9:16" ? 1366 : ratio === "16:9" ? 720 : 1024;

  // Local fallback is an abstract SVG, not a simulated tarot/astrology image.
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="hsl(${hueA} 28% 11%)"/>
          <stop offset="1" stop-color="hsl(${hueB} 24% 18%)"/>
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stop-color="hsla(190 45% 80% / .42)"/>
          <stop offset="1" stop-color="hsla(190 45% 70% / 0)"/>
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="38"/></filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <ellipse cx="28%" cy="38%" rx="38%" ry="30%" fill="url(#glow)" filter="url(#blur)"/>
      <ellipse cx="76%" cy="67%" rx="44%" ry="25%" fill="hsla(${hueB} 38% 70% / .13)" filter="url(#blur)"/>
      <path d="M0 ${height * 0.68} C ${width * 0.28} ${height * 0.58}, ${width * 0.54} ${height * 0.82}, ${width} ${height * 0.56}" fill="none" stroke="hsla(200 42% 87% / .22)" stroke-width="2"/>
      <path d="M0 ${height * 0.73} C ${width * 0.32} ${height * 0.65}, ${width * 0.58} ${height * 0.86}, ${width} ${height * 0.61}" fill="none" stroke="hsla(35 28% 82% / .16)" stroke-width="1.5"/>
    </svg>
  `.trim();

  return {
    url: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    mimeType: "image/svg+xml",
    prompt: "Local abstract gradient fallback",
    provider: "mock",
    model: "fatefork-local-svg",
  };
}
