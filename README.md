# Fate Fork｜命运岔途

> **Explore two parallel paths of choice. You remain the author of your life.**  
> 探索选择的两条平行路径，人生的作者始终是你。

[中文](#中文) · [English](#english)

Fate Fork 是一个面向年轻决策焦虑群体的 **ToC 受控多模态叙事 AIGC
抉择自省工具**。它借用紫微斗数的长期视角与塔罗的短期镜像，也提供不启用任何
命理符号的开放式对话。产品不预测命运、不替用户做决定；符号只负责打开视角，
现实选择始终属于用户。

Fate Fork is a consumer-facing, controlled multimodal narrative experience for
reflective decision-making. It offers a long-horizon Zi Wei lens, a short-horizon
tarot mirror, and an open conversation path with no divination symbols. It does
not predict fate or decide for the user.

---

## 中文

### 三条体验路径

| 路径 | 入口 | 用途 |
| --- | --- | --- |
| 完整星轨推演 | `/ziwei` | 后端规则引擎排盘，生成「顺势之路 / 转折之路」两条视觉权重相等的长期叙事 |
| 即时镜像占卜 | `/tarot` | 后端安全随机洗牌与三张镜像牌阵，呈现现状、内在阻碍与多重可能 |
| 随心闲谈 | `/chat` | 不启用紫微或塔罗符号，用开放式对话梳理困境与下一步 |
| 反宿命日志 | `/history` | 在当前浏览器回看、对照与删除历史记录 |

首页位于 `/`。页面使用低饱和深空蓝、雾紫、冷银灰与淡香槟/浅青微光，
配合磨砂玻璃、缓慢粒子、克制的 Framer Motion 过渡及极简几何视觉。抽象配图只使用
光影、云雾、道路、星河、潮汐等隐喻，不生成塔罗牌原画、古星盘、卦象或宗教符号。

### 架构铁则

本项目明确划分「规则」与「叙事」：

- 时区换算、农历/十二宫/星曜计算由 Node.js 规则引擎完成；
- 塔罗牌库、Fisher–Yates 洗牌、抽牌、正逆位与牌阵位置由后端代码完成；
- Agnes **不能**选择或改写符号结果，只把结构化结果转换为共情、中立叙事；
- Agnes 的视觉能力只在用户主动上传心境图片时调节叙事文风；
- 文本模型固定为 `agnes-2.0-flash`，图片模型固定为
  `agnes-image-2.1-flash`（均可由服务端环境变量覆盖）；
- 所有生成请求使用单次纯指令与受控 JSON 输出；不使用 RAG、向量数据库、
  Function Calling、工具调用或 Agent 循环；
- 服务端统一执行超时、限流、错误归一化、JSON 解析与结构校验；
- 双轨永远保持同等视觉与叙事权重，不把任一路径包装成「更好答案」。

更完整的数据流与边界见
[架构说明](docs/ARCHITECTURE.md)，隐私与安全承诺见
[隐私与伦理](docs/PRIVACY_AND_ETHICS.md)。

### Agnes Prompt 与结构化输出

两套互相独立、可直接审阅的核心 System Prompt 位于
[`server/ai/prompts.ts`](server/ai/prompts.ts)：

- `ZIWEI_SYSTEM_PROMPT`：只叙述规则引擎已生成的星盘，强制双轨等权、三阶段同步、
  条件化语言、三道递进自省问题与抽象意象；
- `TAROT_SYSTEM_PROMPT`：只叙述后端已抽取的固定牌阵，强制三层镜像、多重可能、
  不重新抽牌且不把正逆位写成好坏等级。

同一文件另含无命理闲谈、复盘卡片和抽象配图的受控 Prompt。JSON Schema 位于
[`server/ai/schemas.ts`](server/ai/schemas.ts)，本地二次校验与禁用词清理位于
[`server/ai/json.ts`](server/ai/json.ts)。模型即使返回代码围栏或多余文本，也不会触发
任何“让 AI 修复 AI”的循环；服务端只做一次确定性的解析与校验。

[`server/ai/agnesClient.ts`](server/ai/agnesClient.ts) 使用 Bearer Token 调用
OpenAI 兼容的 `chat/completions` 与 `images/generations`。文本请求优先携带严格
`response_format: json_schema`；只有供应商以 `400` 明确拒绝该传输字段时，才使用
完全相同的受控 Prompt 重试一次。该兼容重试不改变任务、不调用工具，也不构成
推理或 Agent 循环。

### 技术栈

- **前端：** React 19、TypeScript、Vite、React Router、Tailwind CSS、
  Framer Motion、shadcn/ui 风格基础组件；
- **后端：** Node.js、Express 5、TypeScript、REST JSON API；
- **AIGC：** Agnes 文本与图片 API；没有 API Key 时启用明确标记的确定性 Mock，
  便于本地完整演示；
- **存储：** 生辰草稿、复盘与历史优先保存于浏览器 `localStorage`，作品集版本
  不设置服务端用户数据库；
- **部署：** Render 单 Web Service；构建 React 后由 Express 同时托管 `/api/*`
  与 `client/dist`。

### 项目结构

```text
fatefork-ai-app/
├── .openai/
│   └── hosting.json          # 可选 Sites 前端预览元数据
├── client/
│   ├── public/               # favicon、og.png 等静态资源
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # 流程提示、请求状态与氛围图
│   │   │   ├── layout/       # 导航、页面外壳与标题区
│   │   │   ├── ui/           # shadcn/ui 风格基础组件
│   │   │   └── visual/       # 粒子、双轨时间线、翻牌与分享卡片
│   │   ├── lib/              # REST 客户端、本地存储与通用工具
│   │   ├── pages/            # Landing、紫微、塔罗、闲谈、历史
│   │   ├── styles/           # Tailwind 层、玻璃材质与全局动效
│   │   ├── types/            # 浏览器端数据契约与兼容别名
│   │   ├── App.tsx           # 路由与页面切换
│   │   └── main.tsx          # React 入口
│   ├── index.html
│   ├── tsconfig.json
│   └── vite.config.ts        # `/api` 开发代理与生产构建
├── server/
│   ├── ai/                   # Agnes 网关、Prompt、Schema、Mock 与本地校验
│   ├── engine/               # 紫微/塔罗规则引擎及规则测试
│   ├── routes/               # REST 路由及 HTTP 集成测试
│   ├── middleware/           # 信封、请求 ID、CORS、限流、安全头与错误处理
│   ├── services/             # 脱敏后的受控生成编排
│   ├── types/                # 服务端权威接口类型
│   ├── utils/                # 输入校验与确定性 ID
│   ├── app.ts                # Express 装配、静态托管与 SPA 回退
│   ├── config.ts             # 环境变量与保守默认值
│   ├── index.ts              # HTTP 服务与优雅退出
│   └── tsconfig.json
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── PRIVACY_AND_ETHICS.md
├── sites/
│   ├── worker.ts             # Sites 预览：复用规则引擎与本地 Mock
│   ├── vite.config.ts        # Cloudflare Workers 兼容构建
│   └── wrangler.jsonc        # SPA 静态资源与 /api 路由配置
├── scripts/
│   └── prepare-sites-build.mjs
├── .env.example
├── .gitignore
├── components.json          # shadcn/ui 路径约定
├── eslint.config.mjs
├── postcss.config.cjs
├── render.yaml
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── package-lock.json
```

### 本地启动

前置条件：Node.js `>=20.11`，推荐使用当前 Node.js LTS。

```bash
npm ci
cp .env.example .env
npm run dev
```

打开 `http://127.0.0.1:5173`。开发命令会同时启动：

- Vite 前端：`http://127.0.0.1:5173`
- Express API：`http://127.0.0.1:8787`

`AGNES_API_KEY` 留空时，应用返回 `data.meta.provider: "mock"` 的确定性演示内容；
规则引擎仍在后端真实运行。接入 Agnes 时，只需在 `.env` 设置服务端密钥：

```dotenv
AGNES_API_KEY=your_server_side_key
AGNES_TEXT_MAX_TOKENS=6000
```

不要在变量名上添加 `VITE_`，否则密钥会进入浏览器构建产物。

### 环境变量

先复制 [`.env.example`](.env.example)，再按需修改：

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `NODE_ENV` | `development` | 服务端运行环境 |
| `PORT` | `8787` | Express 端口；Render 会在生产环境注入 |
| `CLIENT_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173` | 本地跨域允许来源；多个来源用逗号分隔 |
| `JSON_BODY_LIMIT` | `12mb` | JSON 请求体上限，覆盖 data URL 心境图 |
| `API_RATE_LIMIT_PER_MINUTE` | `90` | 单客户端 API 总请求频率上限 |
| `AGNES_API_KEY` | 空 | Agnes 服务端密钥；为空时使用 Mock |
| `AGNES_BASE_URL` | `https://apihub.agnes-ai.com/v1` | Agnes API 根地址 |
| `AGNES_TEXT_MODEL` | `agnes-2.0-flash` | 叙事模型 |
| `AGNES_IMAGE_MODEL` | `agnes-image-2.1-flash` | 抽象氛围图模型 |
| `AGNES_TEXT_MAX_TOKENS` | `6000` | 单次叙事 JSON 的最大输出额度 |
| `AGNES_TIMEOUT_MS` | `45000` | 文本请求超时 |
| `AGNES_IMAGE_TIMEOUT_MS` | `90000` | 图片请求超时 |
| `AGNES_MAX_REQUESTS_PER_MINUTE` | `30` | Agnes 网关分钟限流 |
| `VITE_API_BASE_URL` | `/api` | 浏览器 API 前缀；生产环境保持同源 |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:8787` | Vite 开发代理目标 |
| `VITE_PORT` | `5173` | Vite 开发端口 |

### REST API

所有路由均位于 `/api`，统一返回成功或失败信封：

```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "…", "timestamp": "…" }
}
```

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "…" },
  "meta": { "requestId": "…", "timestamp": "…" }
}
```

| 方法 | 路径 | 职责 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康状态与 Agnes 配置状态 |
| `POST` | `/api/ziwei/chart` | 用后端规则引擎生成结构化星盘 |
| `POST` | `/api/ziwei/narrative` | 将星盘转换为双轨叙事；可附可选心境图 |
| `POST` | `/api/tarot/draw` | 后端洗牌并抽取三张镜像牌阵 |
| `POST` | `/api/tarot/narrative` | 结合问题与固定牌阵生成分层叙事 |
| `POST` | `/api/tarot/followup` | 围绕原问题和原牌阵继续反思对话 |
| `POST` | `/api/chat` | 无命理符号的开放式思辨对话 |
| `POST` | `/api/reflection` | 根据用户回答生成可下载复盘卡片数据 |
| `POST` | `/api/image` | 根据意象标签生成抽象氛围图 |

请求字段、大小限制与响应结构见 [API 文档](docs/API.md)。

### 质量检查与生产构建

```bash
npm run typecheck
npm test
npm run build
NODE_ENV=production npm start
```

`npm run build` 先输出 `client/dist`，再编译服务端 TypeScript；`npm start`
启动单一 Express 服务。只有 `NODE_ENV=production` 时 Express 才托管
`client/dist`；也可以在 `.env` 中临时改为 `production`。生产环境访问同一域名即可
获得前端和 `/api`。

### Render 部署

仓库根目录的 [`render.yaml`](render.yaml) 定义了一个 Node Web Service：

1. 将仓库推送到 GitHub（仓库名建议为 `fatefork-ai-app`）。
2. 在 Render 选择 **New → Blueprint** 并连接该仓库。
3. Blueprint 首次创建时，在 Render 控制台填写 `AGNES_API_KEY`；不要把密钥提交到
   Git。若暂不接入 Agnes，可在手动创建 Web Service 时不设置该变量并使用 Mock。
4. Render 执行 `npm ci && npm run build`，随后运行 `npm start`。
5. `/api/health` 作为健康检查；应用必须监听 Render 注入的 `PORT`。

本项目不需要独立静态站点、数据库或持久磁盘。`render.yaml` 使用当前 Blueprint
字段 `runtime: node` 与 `autoDeployTrigger: commit`；详情可查阅
[Render Blueprint 官方说明](https://render.com/docs/blueprint-spec)。

仓库中的 `.openai/hosting.json` 仅支持可选的前端预览工作流；完整 `/api`
能力仍以本地或 Render 上的 Express 服务为准。
`npm run build:sites` 会生成 Cloudflare Workers 兼容的交互式预览产物；该预览
复用同一紫微/塔罗规则引擎，但生成内容固定使用明确标记的本地 Mock，不读取
`AGNES_API_KEY`。

### 隐私说明

- 保存生辰信息是可选行为，可在紫微页面一键清除；
- 历史与复盘保存在当前浏览器，最多保留应用设定的本地条数，并支持逐条或全部删除；
- 开始在线推演时，请求所需字段仍会经过所连接的 Express 服务，但本项目不写入
  服务端数据库；
- 紫微叙事应向 Agnes 发送已计算的结构化符号，而不是不必要的原始生辰字段；
- 用户主动使用心境图、问答或配图能力时，相应内容会发送给所配置的 Agnes 服务；
- 不要输入身份证件、金融凭据、医疗记录、精确住址或第三方隐私内容。

### 伦理护栏

两套 System Prompt 与所有 Mock/错误降级内容执行相同约束：

- 禁止吉凶断语与宿命定论；
- 不以“注定、成败、大凶、大吉”对用户下结论；
- 使用「如果、可能、在……条件下」呈现多个可调整的视角；
- 不诊断身心健康，不替代医疗、心理、法律、金融或安全专业建议；
- 遇到危机内容时优先鼓励现实世界的即时人类支持；
- 每次输出都保留「仅供自省叙事参考，决定权属于用户」的中立免责声明。

---

## English

### Experience paths

| Path | Route | Purpose |
| --- | --- | --- |
| Full star-path reflection | `/ziwei` | A server-side Zi Wei chart becomes two equally weighted long-horizon narratives |
| Instant mirror reading | `/tarot` | A server-side secure shuffle produces a three-card mirror for the present, inner tension, and possibilities |
| Open conversation | `/chat` | Reflective dialogue with no Zi Wei or tarot symbols |
| Anti-fatalism journal | `/history` | Review, compare, and delete records stored in the current browser |

The landing page is `/`. The visual system combines desaturated deep-space
blue, mist violet, cool silver, restrained champagne/cyan glows, frosted glass,
slow particles, and gentle Framer Motion transitions. Generated art is abstract:
light, mist, paths, stars, clouds, and tides—never tarot artwork, antique star
charts, hexagrams, divination diagrams, or religious symbols.

### Non-negotiable architecture

- Time-zone conversion and all Zi Wei palace/star calculations run in the
  Node.js rule engine.
- The tarot deck, Fisher–Yates shuffle, card selection, orientation, and spread
  positions run in server code.
- Agnes cannot select or alter symbolic results. It only converts immutable
  structured symbols into empathetic, neutral prose.
- Mood-image analysis is optional and occurs only after an explicit upload.
- Model calls are single-pass constrained instructions with structured JSON
  output.
- There is no RAG, vector store, function/tool calling, autonomous agent, or
  agent loop.
- The server owns timeouts, rate limits, normalized errors, JSON parsing, and
  output validation.
- Both Zi Wei paths keep equal narrative and visual weight; neither is framed as
  the correct answer.

See [Architecture](docs/ARCHITECTURE.md) and
[Privacy & ethics](docs/PRIVACY_AND_ETHICS.md) for the full boundaries.

The two independent, reviewable core prompts are
`ZIWEI_SYSTEM_PROMPT` and `TAROT_SYSTEM_PROMPT` in
[`server/ai/prompts.ts`](server/ai/prompts.ts). Request schemas live in
[`server/ai/schemas.ts`](server/ai/schemas.ts), and deterministic local parsing,
validation, and forbidden-claim sanitization live in
[`server/ai/json.ts`](server/ai/json.ts). Invalid output is rejected; it never
starts an AI repair loop.

[`server/ai/agnesClient.ts`](server/ai/agnesClient.ts) uses Bearer authentication
with OpenAI-compatible `chat/completions` and `images/generations` endpoints.
Text requests prefer strict `response_format: json_schema`. Only if the provider
explicitly rejects that transport field with `400` does the gateway repeat the
same constrained prompt once without it; this compatibility retry does not
change the task, call a tool, or form a reasoning/agent loop.

### Stack

- **Client:** React 19, TypeScript, Vite, React Router, Tailwind CSS, Framer
  Motion, and shadcn/ui-style primitives.
- **Server:** Node.js, Express 5, TypeScript, and REST JSON endpoints.
- **AIGC:** Agnes text/image APIs with a clearly labelled deterministic mock
  when no API key is configured.
- **Storage:** optional birth draft, reflection cards, and history in browser
  `localStorage`; no server-side user database in this portfolio build.
- **Deployment:** one Render web service. Express serves `/api/*` and the built
  `client/dist`.

### Run locally

Prerequisite: Node.js `>=20.11`; the current Node.js LTS is recommended.

```bash
npm ci
cp .env.example .env
npm run dev
```

Open `http://127.0.0.1:5173`. Vite runs on port `5173` and proxies `/api` to
Express on port `8787`.

Leave `AGNES_API_KEY` empty for deterministic demo responses labelled with
`data.meta.provider: "mock"`. The Zi Wei and tarot rule engines still run for real on
the server. To use Agnes, put the key only in the server-side `.env`:

```dotenv
AGNES_API_KEY=your_server_side_key
```

Never rename it to a `VITE_*` variable; Vite exposes those values to the browser.
The complete variable reference appears in the [Chinese environment table](#环境变量)
and [`.env.example`](.env.example).

### API

The REST surface is under `/api`:

- `GET /api/health`
- `POST /api/ziwei/chart`
- `POST /api/ziwei/narrative`
- `POST /api/tarot/draw`
- `POST /api/tarot/narrative`
- `POST /api/tarot/followup`
- `POST /api/chat`
- `POST /api/reflection`
- `POST /api/image`

Every endpoint uses a consistent `{ success, data, meta }` or
`{ success, error, meta }` envelope. See [API reference](docs/API.md) for request
and response contracts.

### Validate and build

```bash
npm run typecheck
npm test
npm run build
NODE_ENV=production npm start
```

The build creates `client/dist` and compiles the server. `npm start` launches the
single Express service; it serves `client/dist` when `NODE_ENV=production`.

### Deploy to Render

[`render.yaml`](render.yaml) defines the repository as one Node web service:

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint** and connect the repository.
3. Supply `AGNES_API_KEY` in the Render dashboard when Blueprint creation asks
   for the `sync: false` secret. Never commit the key.
4. Render runs `npm ci && npm run build`, then `npm start`.
5. Render checks `/api/health`; the server listens on Render's injected `PORT`.

No separate static service, database, or persistent disk is required. Local
development can omit the key and use the mock provider. The repository's
`.openai/hosting.json` supports an optional frontend preview workflow; the full
`/api` capability remains the local or Render-hosted Express service.
`npm run build:sites` creates the Cloudflare Workers-compatible interactive
preview. It reuses the same Zi Wei and tarot rule engines, but always labels and
uses the local mock generator; it never reads `AGNES_API_KEY`.

### Privacy and ethics

Birth drafts and history are optional and browser-local. A hosted request still
transits the selected Express server, but this build does not persist user input
in a server database. Only calculated Zi Wei symbols—not unnecessary raw birth
fields—should reach the narrative provider. Questions, optional mood images,
follow-ups, and image prompts reach Agnes only when their feature is invoked.

The prompts prohibit auspicious/inauspicious verdicts, deterministic claims,
and claims using “注定”, “成败”, “大凶”, or “大吉”. Narratives use conditional
language, preserve multiple possibilities, and remain reflective rather than
medical, mental-health, legal, financial, employment, or safety advice. The
user remains the author of every choice.
