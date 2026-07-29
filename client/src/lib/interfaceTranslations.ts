import type { AppLocale } from "@/lib/locale";

/** Static interface copy only. User writing and saved narrative records stay untouched. */
const english: Record<string, string> = {
  "命运岔途": "CHOICE PATHS",
  "跳至主要内容": "Skip to main content",
  "星轨推演": "Star Paths",
  "即时镜像": "Present Mirror",
  "完整星轨推演": "Complete Star Path",
  "随心闲谈": "Open Dialogue",
  "反宿命日志": "Choice Journal",
  "返回": "Back",
  "受控叙事 · 决策自省": "GUIDED NARRATIVE · DECISION REFLECTION",
  "我们不预言答案，只借两套文化符号与一场诚实对话，帮你从焦虑的单一路径里退后一步。": "We do not predict answers. We use two symbolic lenses and an honest dialogue to help you step back from a single anxious path.",
  "此刻": "THIS MOMENT",
  "另一种可能": "ANOTHER POSSIBILITY",
  "选择": "CHOICE",
  "选择入口": "CHOOSE A PATH",
  "紫微斗数 · 长期视角": "ZI WEI DOU SHU · LONG HORIZON",
  "从十二宫结构出发，让同一组人生素材沿「顺势」与「转折」两条等权路径被重新看见。": "Begin with a twelve-palace structure and see the same life material through two equally weighted paths: continuation and change.",
  "以长期视角展开": "Explore the long horizon",
  "十二宫结构": "Twelve-palace structure",
  "双轨平行叙事": "Parallel narratives",
  "复盘卡片": "Reflection card",
  "塔罗 · 当下视角": "TAROT · PRESENT MOMENT",
  "写下此刻的困惑，随机展开三张简约镜像。不替你决定，只照见局势里的多种可能。": "Write what is on your mind and reveal three minimal mirrors at random. They do not decide for you; they reveal several possible views.",
  "照见此刻的局势": "See the present clearly",
  "无符号 · 纯思辨": "NO SYMBOLS · OPEN THINKING",
  "不启用任何命理系统。把纠结慢慢说出来，在开放对话中辨认真正重要的条件、感受与选择。": "No divination system is used. Speak through the knot slowly, and separate the conditions, feelings, and choices that matter.",
  "先把心事说出来": "Start with what is on your mind",
  "思辨对话": "Reflective dialogue",
  "没有标准流程，从一句话开始": "No fixed path. Begin with one sentence.",
  "这里不启用紫微、塔罗或任何命理符号。只有一场开放式思辨对话，陪你把混在一起的事实、情绪、需要与行动慢慢分开。": "No Zi Wei, tarot, or divination symbols are used here. This is an open reflective dialogue to slowly separate facts, feelings, needs, and action.",
  "可以这样开口": "You could begin here",
  "可以从最让你卡住的那一小部分说起。我不会调用星盘或牌卡，也不急着替你归纳答案；我们先一起分清：发生了什么、你在意什么、哪些条件仍可改变。": "Begin with the small part that feels most stuck. I will not use a chart or cards, and I will not rush to summarize an answer. We can separate what happened, what matters to you, and what can still change.",
  "我在两个选择之间反复摇摆……": "I keep wavering between two choices…",
  "我知道该做什么，却一直没有行动……": "I know what to do, but I still cannot act…",
  "我害怕选错后会后悔……": "I am afraid I will regret choosing wrong…",
  "我想分清这是直觉还是焦虑……": "I want to tell intuition from anxiety…",
  "不追求立刻确定": "No need for instant certainty",
  "先允许矛盾同时存在。": "Let conflicting feelings exist together first.",
  "区分事实与推测": "Separate facts from assumptions",
  "让可以验证的条件浮现。": "Make the conditions you can verify visible.",
  "不替代专业支持": "Not a substitute for professional support",
  "高风险议题请寻找现实中的专业帮助。": "For high-risk concerns, seek qualified support in real life.",
  "开启新对话": "Start a new dialogue",
  "慢慢写。Enter 发送，Shift + Enter 换行。": "Take your time. Enter to send, Shift + Enter for a new line.",
  "不启用命理符号 · 自由梳理思绪": "NO DIVINATION SYMBOLS · THINK FREELY",
  "输入随心闲谈消息": "Write an open-dialogue message",
  "发送消息": "Send message",
  "对话内容": "Conversation",
  "正在听，也在分辨……": "Listening, and making room to discern…",
  "洗牌已经完成": "The deck is ready",
  "完整的 78 张牌已经洗好并摊开。选择三个背面位置，三张牌会按你的选择顺序进入镜像。": "All 78 cards are shuffled and laid out. Choose three face-down positions; they will enter the reading in your chosen order.",
  "亲自选择": "CHOOSE YOURSELF",
  "安静地洗牌": "Shuffling quietly",
  "展开三张塔罗镜像": "Revealing three mirrors",
  "整理当下叙事": "Shaping the present narrative",
  "生成复盘卡片": "Create reflection card",
  "生成意境图": "Create atmosphere image",
  "重新生成": "Regenerate",
  "下载复盘卡": "Download reflection card",
  "从你此刻最需要的距离出发": "Begin from the distance you need right now",
  "长期结构、即时镜像或无符号对话。三条入口都不会替代你的现实判断。": "A long-horizon structure, an instant mirror, or an open dialogue. None replaces your real-world judgement.",
  "中立声明：本产品提供的是基于文化符号与受控生成的叙事性自省体验，不构成命运预测、心理治疗、医疗、法律或财务建议。所有结果均为开放参考，现实选择与行动权始终属于你。": "Neutral notice: this product offers reflective narratives based on cultural symbols and guided generation. It is not prediction, therapy, medical, legal, or financial advice. Every result is open for reflection; your real choices remain yours.",
  "即时镜像占卜": "Instant Mirror Reading",
  "把此刻的困惑放在桌面上。三张镜像依次照见现状、内在阻碍与潜在可能。它们提供观察语言，不替你判断方向。": "Place the question in front of you. Three mirrors reveal the present, an inner obstacle, and possible directions. They offer language for observation, not a verdict.",
  "先别急着寻找答案": "Do not rush toward an answer",
  "你想更清楚地看见什么？": "What would you like to see more clearly?",
  "例如：我在继续坚持和换一条路之间犹豫，真正让我停住的是什么？": "For example: I am torn between staying and taking another path. What is really holding me back?",
  "尽量描述感受与处境，而非只问“会不会”": "Describe your feelings and context, rather than only asking whether something will happen.",
  "洗牌后亲自抽取": "Shuffle, then choose for yourself",
  "如果一时不知道怎么问": "If you do not know how to begin",
  "每次抽取都独立展开，结果不会被重新挑选或改动。": "Each draw unfolds independently; its result is neither reselected nor altered.",
  "我该如何理解最近反复出现的犹豫？": "How can I understand the hesitation that keeps returning?",
  "这段关系中，有什么被我忽略了？": "What might I be overlooking in this relationship?",
  "面对眼前的机会，我真正担心的是什么？": "What am I really worried about in this opportunity?",
  "从出生时间打开一个更长的视角，再将同一组符号展开为「顺势」与「转折」两条平行叙事。它们权重相同，也都不是预言。": "Use birth time to open a longer view, then unfold one symbolic set into two parallel narratives: continuity and change. They carry equal weight and are not predictions.",
  "给时间一个准确的坐标": "Give time an accurate coordinate",
  "没有匹配的时区": "No matching time zones",
  "例如：杭州": "For example: Hangzhou",
  "此刻的心境图片（可选）": "A mood image for this moment (optional)",
  "可帮助叙事更贴近你当下的感受。支持 JPG / PNG / WebP，最大 3MB。": "It can tune the narrative closer to your present feeling. JPG, PNG, and WebP supported, up to 3 MB.",
  "选择一张能代表此刻的图片": "Choose an image that represents this moment",
  "图片不会保存在历史记录中，仅用于本次叙事的氛围调整。": "This image is not saved in history; it only adjusts this narrative's atmosphere.",
  "在此设备保存表单": "Save this form on this device",
  "只保存在此设备，不会同步到其他设备。取消后本次仍可推演。": "It stays only on this device and never syncs elsewhere. You can still continue this reading without saving.",
  "一键清除已存生辰": "Clear saved birth details",
  "生辰信息仅用于本次推演；若选择保存，也只保存在当前设备，随时可以清除。": "Birth details are used only for this reading. If saved, they remain on this device and can be cleared anytime.",
  "开始双轨推演": "Begin the two-path reading",
  "结果仅保存在当前设备": "Results stay on this device",
  "推演的价值不在「是否应验」，而在你如何选择、修正和继续生活。把过去的叙事与现实并排放置，记录自己真正走过的路。": "The value is not whether a reading comes true, but how you choose, revise, and continue living. Place past narratives beside reality and record the path you actually walked.",
  "清除全部记录": "Clear all entries",
  "尝试换一个关键词，或查看其他入口。": "Try another keyword or explore another path.",
  "完成一次星轨推演、即时镜像或随心闲谈后，记录会留在这台设备上。": "After a star-path reading, instant mirror, or open dialogue, the entry remains on this device.",
  "清除筛选": "Clear filters",
  "推演已完成 · 结果已保存在当前设备": "READING COMPLETE · SAVED ON THIS DEVICE",
  "预览叙事模式": "Preview narrative mode",
  "十二宫结构快照": "Twelve-palace snapshot",
  "重新推演": "Start again",
  "静宫": "Quiet palace",
  "两条路共同在问": "What both paths are asking",
  "先沿一条路慢慢看": "Follow one path slowly",
  "两条路径权重相同，但不必一次读完。每次只展开眼前这一段。": "Both paths carry equal weight. You do not need to read them at once; reveal only the next part in view.",
  "顺势之路": "Path of Continuity",
  "转折之路": "Path of Change",
  "从这里开始": "BEGIN HERE",
  "展开第一段": "Reveal the first part",
  "继续展开下一段": "Reveal the next part",
  "现在展开另一条路径": "Open the other path now",
  "回看顺势之路": "Revisit the path of continuity",
  "回看转折之路": "Revisit the path of change",
  "叙事的情绪纹理": "Emotional texture",
  "氛围：": "Tone: ",
  "节奏：": "Tempo: ",
  "把叙事交还给现实里的你": "Return the narrative to your real life",
  "此刻，哪一句更贴近你的真实状态？": "Which sentence feels closest to your state right now?",
  "上一题": "Previous",
  "下一题": "Next",
  "生成我的复盘卡片": "Create my reflection card",
  "慢一点，也没关系": "It is okay to go slowly",
  "镜像已展开 · 不构成结果判定": "MIRROR OPENED · NOT A VERDICT",
  "提出新困惑": "Ask a new question",
  "继续问，但不追加抽牌": "Continue asking, without drawing more cards",
  "追问只围绕同一组三张牌与现实感受展开，避免不断抽牌制造确定感。": "Follow-up stays with the same three cards and real feelings, without drawing repeatedly for certainty.",
  "可以从这些方向继续": "You could continue from here",
  "正在整理，不急着给结论……": "Taking a moment to reflect, without rushing to a conclusion…",
  "收回牌面，留下自己的话": "Set the cards down. Keep your own words.",
  "每题选择此刻最贴近的一句，不必急着把感受说完整。": "Choose the line closest to this moment. You do not need to fully explain the feeling yet.",
  "哪一句更接近你此刻的状态？": "Which line is closest to how you feel right now?",
  "公历出生日期": "Birth date",
  "出生时辰": "Birth time",
  "出生地时区": "Birthplace time zone",
  "出生地（可选，仅作标记）": "Birthplace (optional, for your reference)",
  "隐私由你掌控": "Your privacy, your control",
  "冲突强度": "Tension",
  "清晰程度": "Clarity",
  "没有找到相符记录": "No matching entries",
  "日志还是空白的": "Your journal is still blank",
  "搜索标题或片段……": "Search titles or excerpts…",
  "全部记录": "All entries",
  "关闭": "Close",
  "生成失败，请稍后重试": "Generation failed. Please try again.",
  "图片已保存": "Image saved",
  "这条岔路尚未展开": "This path has not opened yet",
  "回到起点，选择一条此刻可见的路径。": "Return to the beginning and choose a path you can see now.",
};

function canonical(value: string): string {
  const compact = value.trim();
  return /[\u3400-\u9fff]/.test(compact)
    ? compact.replace(/\s+/g, "")
    : compact.replace(/\s+/g, " ");
}

const canonicalEnglish = Object.fromEntries(
  Object.entries(english).map(([zh, en]) => [canonical(zh), en]),
);
const canonicalChinese = Object.fromEntries(
  Object.entries(english).map(([zh, en]) => [canonical(en), zh]),
);

function translate(value: string, locale: AppLocale): string {
  return (locale === "en" ? canonicalEnglish : canonicalChinese)[canonical(value)] ?? value;
}

/** Applies the static copy dictionary to rendered text and accessible labels. */
export function applyInterfaceLocale(locale: AppLocale): () => void {
  const update = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Rule-engine symbols (for example a Ziwei palace, branch, or star)
      // intentionally keep their source-language names in every UI locale.
      if (node.parentElement?.closest("[data-preserve-locale]")) return;
      const text = node.textContent ?? "";
      const translated = translate(text.trim(), locale);
      if (translated !== text.trim()) node.textContent = text.replace(text.trim(), translated);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.hasAttribute("data-preserve-locale")) return;
    for (const attribute of ["aria-label", "placeholder", "title"]) {
      const value = node.getAttribute(attribute);
      if (value) node.setAttribute(attribute, translate(value, locale));
    }
    node.childNodes.forEach(update);
  };

  update(document.body);
  const observer = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach(update));
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
