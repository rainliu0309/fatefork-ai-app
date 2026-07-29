# Fate Fork REST API / 接口参考

Base path / 基础路径：`/api`  
Content type / 内容类型：`application/json`

The API is stateless. It does not provide account authentication or server-side
history storage. `AGNES_API_KEY` belongs to the Express environment and is never
accepted from a browser request.

接口无会话状态，不提供账户鉴权或服务端历史存储。`AGNES_API_KEY` 只属于 Express
运行环境，任何浏览器请求都不应携带该密钥。

## Common contract / 通用约定

### Response envelope / 响应信封

Success / 成功：

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "c5a24634-b39d-4b11-87f2-e339a2acc345",
    "timestamp": "2026-07-29T12:00:00.000Z",
    "mock": false
  }
}
```

Failure / 失败：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "\"birthDate\" must use YYYY-MM-DD."
  },
  "meta": {
    "requestId": "c5a24634-b39d-4b11-87f2-e339a2acc345",
    "timestamp": "2026-07-29T12:00:00.000Z"
  }
}
```

`meta.mock` appears on generation responses. Generated text also includes
`data.meta.provider`, which is either `agnes` or `mock`.

生成类响应会包含 `meta.mock`；生成文本还会在 `data.meta.provider` 明确标记
`agnes` 或 `mock`。

Clients may send `X-Request-ID` using 8–80 ASCII letters, digits, `_`, or `-`.
The server otherwise creates an ID and always returns it in the `X-Request-ID`
header and response metadata.

客户端可用 `X-Request-ID` 传入 8–80 位字母、数字、`_` 或 `-`；否则服务端自动
生成，并始终在响应头与响应元数据中返回。

### Shared optional fields / 通用可选字段

| Field / 字段 | Contract / 约定 |
| --- | --- |
| `locale` | `zh-CN` (default / 默认) or `en` |
| `moodImage` | Public `https://` URL, or a complete `data:image/...;base64,...` string / 公开 HTTPS URL 或完整 data URL |
| `history` | Up to 12 `{ "role": "user" \| "assistant", "content": "..." }` turns / 最多 12 轮 |

Data URL images accept `image/jpeg`, `image/png`, or `image/webp` and must be
8 MB or smaller before base64 overhead. The global JSON body limit defaults to
12 MB. Mood images are optional and are sent to Agnes only for the invoked
request.

Data URL 心境图支持 `image/jpeg`、`image/png`、`image/webp`，原图最大 8 MB；
全局 JSON 请求体默认上限为 12 MB。心境图始终可选，且只在用户触发对应请求时发送
给 Agnes。

### Compatibility aliases / 兼容别名

The canonical fields documented below are preferred. The server also accepts
the portfolio client's earlier aliases: `birthplace` for `place`, a
`{ mimeType, data }` mood-image object, `spread` for `draw`, `messages` for chat
or follow-up history, the earlier reflection shape
`{ source, sourceTitle, narrative, answers: string[] }`, and `emotionalTone` for
image `mood`. Responses retain a few corresponding display aliases. New clients
should use the canonical contract below.

建议新客户端使用下文规范字段。为兼容作品集早期前端，服务端也识别：以
`birthplace` 代替 `place`、`{ mimeType, data }` 心境图对象、以 `spread` 代替
`draw`、闲谈/追问中的 `messages`、旧复盘形状
`{ source, sourceTitle, narrative, answers: string[] }`，以及以
`emotionalTone` 代替图片 `mood`。响应也保留少量对应展示别名。

## Health / 健康检查

### `GET /api/health`

No request body. This route is excluded from the application rate limiter.

无需请求体，且不计入应用 API 限流。

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "agnesConfigured": false,
    "service": "fatefork-api",
    "version": "1.0.0",
    "uptimeSeconds": 42,
    "agnes": {
      "configured": false,
      "mode": "mock",
      "textModel": "agnes-2.0-flash",
      "imageModel": "agnes-image-2.1-flash"
    },
    "engines": {
      "ziwei": "ziwei-rules-1.0.0",
      "tarot": "tarot-crypto-1.0.0"
    }
  },
  "meta": {
    "requestId": "…",
    "timestamp": "…"
  }
}
```

## Zi Wei / 紫微斗数

### `POST /api/ziwei/chart`

Calculates the chart in server code. The model is not called.

完全由后端代码排盘，不调用模型。

```json
{
  "birthDate": "1998-04-16",
  "birthTime": "21:30",
  "timezone": "Asia/Shanghai",
  "place": "Shanghai"
}
```

| Field / 字段 | Rules / 规则 |
| --- | --- |
| `birthDate` | Real Gregorian date from `1900-01-01` through `2100-12-31`, format `YYYY-MM-DD` / 有效公历日期 |
| `birthTime` | 24-hour `HH:mm` |
| `timezone` | IANA zone such as `Asia/Shanghai`, `UTC`/`Z`, or fixed offset from `-14:00` to `+14:00` / IANA 时区或固定偏移 |
| `place` | Optional display label, at most 120 characters / 可选展示名称，最多 120 字符 |

The same fields may be nested under a `birth` key. An invalid local time during
a daylight-saving gap is rejected. If an autumn clock change makes a local time
occur twice, the earlier instant is selected deterministically.

上述字段也可放在 `birth` 对象中。夏令时跳时导致的不存在时刻会被拒绝；秋季回拨
导致同一民用时间出现两次时，规则引擎确定性选择较早的实际时刻。

`data` is a `ZiweiChart`: chart/engine IDs, normalized birth time, solar and
lunar calendar data, bureau, life/body palace branches, all 12 palaces, major
star placements, and a calculation trace. See
[`server/types/api.ts`](../server/types/api.ts) for the authoritative type.

`data` 为 `ZiweiChart`：包含星盘/引擎 ID、归一化时间、公历与农历、五行局、命身宫、
十二宫、主星位置和可审阅的计算说明。权威类型定义见
[`server/types/api.ts`](../server/types/api.ts)。

### `POST /api/ziwei/narrative`

Recommended request / 推荐请求：

```json
{
  "chart": {},
  "focus": "我想比较继续深耕与转向新领域的代价",
  "moodImage": "data:image/webp;base64,...",
  "locale": "zh-CN"
}
```

| Field / 字段 | Rules / 规则 |
| --- | --- |
| `chart` | Complete chart returned by `/ziwei/chart` / 上一接口返回的完整星盘 |
| `birth` | Alternative to `chart`; the server recalculates the chart / 可替代 `chart`，服务端重新排盘 |
| `focus` | Optional, at most 1,500 characters / 可选，最多 1,500 字符 |
| `moodImage` | Optional image contract described above / 可选，见通用图片约定 |
| `locale` | Optional `zh-CN` or `en` / 可选 |

When a client echoes a chart, the server rebuilds it from its birth fields and
rejects a mismatched `chartId`. Client-edited stars therefore cannot become
provider instructions. Before Agnes is called, the service removes the chart
ID, place, exact date/time, UTC instant, and other unnecessary raw birth fields.

客户端回传星盘时，服务端会根据其中的生辰字段重新排盘；`chartId` 不一致会被拒绝。
因此客户端修改星名也无法成为供应商指令。调用 Agnes 前，服务会移除星盘 ID、地点、
精确日期时间、UTC 时刻及其他不必要的原始生辰字段。

`data` is a `ZiweiNarrative` containing `paths.flow`, `paths.turn`, three
chapters per path, three reflection questions, emotion metadata, abstract image
direction, disclaimer, and generation metadata.

`data` 为 `ZiweiNarrative`，包含 `paths.flow`、`paths.turn`、每轨三阶段、三道自省
问题、情绪元数据、抽象配图方向、免责声明与生成元数据。

## Tarot / 塔罗镜像

### `POST /api/tarot/draw`

Send `{}`; an optional question may be present but cannot influence randomness.
Returns HTTP `201`.

发送 `{}` 即可；即使携带问题，问题也不会影响随机结果。成功状态码为 `201`。

The server shuffles the standard 78-card deck using Fisher–Yates with
`node:crypto.randomInt`, takes three unique cards, independently assigns
upright/reversed orientation, and fixes them to:

服务端使用 `node:crypto.randomInt` 与 Fisher–Yates 洗牌标准 78 张牌，抽取三张
不重复卡牌，独立生成正逆位，并固定对应：

1. `situation` — present mirror / 此刻镜面
2. `inner-block` — inner tension / 内在阻力
3. `possibilities` — possible paths / 可能路径

`data` is a `TarotDraw` with the draw ID, engine version, spread name, cards,
timestamp, and explicit random source.

### `POST /api/tarot/narrative`

```json
{
  "question": "我该如何看待这次转职犹豫？",
  "draw": {},
  "moodImage": "https://example.com/my-image.webp",
  "locale": "zh-CN"
}
```

`question` is required and limited to 2,000 characters. `draw` must be the
complete result of `/tarot/draw`. The server reconstructs canonical card names,
keywords, and positions from card IDs; unknown/duplicate IDs or invalid
orientations are rejected.

`question` 必填，最多 2,000 字符；`draw` 必须为抽牌接口的完整结果。服务端依据
卡牌 ID 重建权威名称、关键词与位置；未知/重复 ID 或无效正逆位会被拒绝。

`data` is a `TarotNarrative` containing the opening mirror, exactly three
layers, 2–4 parallel possibilities, grounding text, three reflection questions,
emotion metadata, abstract image direction, disclaimer, and generation metadata.

### `POST /api/tarot/followup`

```json
{
  "question": "我该如何看待这次转职犹豫？",
  "followup": "我最担心的是失去稳定感，可以怎样拆小？",
  "draw": {},
  "previousNarrative": "optional compact narrative context",
  "history": [
    { "role": "user", "content": "…" },
    { "role": "assistant", "content": "…" }
  ],
  "locale": "zh-CN"
}
```

| Field / 字段 | Rules / 规则 |
| --- | --- |
| `question` | Original question, required, max 2,000 characters / 原问题，必填 |
| `followup` | Current follow-up, required, max 2,000 characters / 本轮追问，必填 |
| `draw` | Original three-card draw; no redraw occurs / 原三张牌，不重新抽取 |
| `previousNarrative` | Optional compact text, max 8,000 characters / 可选上轮摘要 |
| `history` | Optional, no more than 12 turns; each content max 4,000 characters / 最多 12 轮 |
| `locale` | Optional `zh-CN` or `en` |

`data` is a `ReflectiveReply`: reply, observations, questions, emotion metadata,
optional safety note, and generation metadata.

## Open reflection / 随心闲谈

### `POST /api/chat`

```json
{
  "message": "我同时想要稳定和变化，不知道怎样比较。",
  "history": [],
  "moodImage": "data:image/jpeg;base64,...",
  "locale": "zh-CN"
}
```

`message` is required and limited to 4,000 characters. `history`, `moodImage`,
and `locale` follow the shared contracts. No Zi Wei or tarot symbols are added.
The response is a `ReflectiveReply`.

`message` 必填，最多 4,000 字符；其余字段遵循通用约定。服务端不会加入任何紫微
或塔罗符号，响应为 `ReflectiveReply`。

## Reflection card / 复盘卡片

### `POST /api/reflection`

```json
{
  "sourceType": "ziwei",
  "answers": [
    {
      "question": "此刻最需要先看见什么？",
      "answer": "我需要承认自己对长期消耗的担心。"
    }
  ],
  "narrativeSummary": "optional compact source summary",
  "imageryTags": ["薄雾岔路", "冷银潮汐"],
  "locale": "zh-CN"
}
```

| Field / 字段 | Rules / 规则 |
| --- | --- |
| `sourceType` | `ziwei`, `tarot`, or `chat` |
| `answers` | 1–5 objects; question max 500, answer max 3,000 characters / 1–5 组问答 |
| `narrativeSummary` | Optional, max 4,000 characters / 可选叙事摘要 |
| `imageryTags` | Optional, up to 6 strings of at most 80 characters / 可选，最多 6 个 |
| `locale` | Optional `zh-CN` or `en` |

`data` is a `ReflectionCard`: eyebrow, title, insight, 2–3 choices, one small
next step, quote, imagery tags, disclaimer, and generation metadata. The client
renders this data to a downloadable PNG locally.

`data` 为 `ReflectionCard`：眉题、标题、洞见、2–3 个并存选择、一个最小下一步、
短句、意象标签、免责声明与生成元数据。前端在本地将这些数据绘制为可下载 PNG。

## Abstract image / 抽象氛围图

### `POST /api/image`

```json
{
  "imageryTags": ["平行微光", "薄雾岔路", "银蓝潮汐"],
  "mood": "quiet, spacious",
  "ratio": "3:4"
}
```

| Field / 字段 | Rules / 规则 |
| --- | --- |
| `imageryTags` | Required, 1–8 strings, each max 80 characters / 必填，1–8 个 |
| `mood` | Optional, max 240 characters / 可选 |
| `ratio` | Optional: `1:1` (default), `3:4`, `4:3`, `16:9`, or `9:16` |

The server sanitizes user-derived tags and appends an immutable image safety
prompt. `data` contains `url` (remote or data URL), `mimeType`, the final safe
prompt, `provider`, and `model`. The route does not generate tarot cards,
charts, hexagrams, religious symbols, portraits, readable text, logos, or
watermarks.

服务端清理用户来源的意象，并追加不可覆盖的图像安全 Prompt。`data` 包含远程 URL
或 data URL、MIME、最终安全 Prompt、供应商与模型。该接口禁止生成塔罗牌、星盘、
卦象、宗教符号、人物、可读文字、Logo 或水印。

## Limits and errors / 限流与错误

- `API_RATE_LIMIT_PER_MINUTE` defaults to 90 requests per source IP per process;
  `/health` and CORS preflight do not count. / 默认每进程每 IP 每分钟 90 次。
- `AGNES_MAX_REQUESTS_PER_MINUTE` defaults to 30 provider requests per process. /
  Agnes 网关默认每进程每分钟 30 次。
- A `429` response includes `Retry-After`. / `429` 响应包含 `Retry-After`。
- Common codes include `INVALID_JSON`, `VALIDATION_ERROR`,
  `ORIGIN_NOT_ALLOWED`, `ROUTE_NOT_FOUND`, `API_RATE_LIMIT`,
  `AGNES_RATE_LIMIT`, `AGNES_AUTH_ERROR`, `AGNES_INVALID_JSON`,
  `AGNES_PROVIDER_ERROR`, `AGNES_NETWORK_ERROR`, and `AGNES_TIMEOUT`.
- Provider bodies and stack traces are not returned to the browser. /
  供应商原始响应与堆栈不会返回浏览器。

The built-in limiter is suitable for a local or single-instance portfolio
deployment. A scaled multi-instance production service should add a shared
edge/gateway limiter.

内置限流适合本地或单实例作品集部署；若扩展为多实例生产服务，应增加共享的边缘或
网关限流。
