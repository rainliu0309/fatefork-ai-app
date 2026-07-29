# Privacy and ethics / 隐私与伦理

## Plain-language promise / 简明承诺

Fate Fork is a reflective storytelling tool, not a system for predicting fate.
Its two symbolic channels provide perspectives for comparison; the user remains
the author of every real-world decision.

Fate Fork 是抉择自省叙事工具，不是命运预测系统。两种符号通道用于提供可比较的
视角，现实决定始终由用户本人作出。

## Data handling / 数据处理

- Birth-form drafts, reflection answers, and saved history are stored in the
  current browser's `localStorage` only. Clearing site data or using the
  in-product delete controls removes those local copies. /
  生辰表单草稿、自省答案与历史记录仅存于当前浏览器的 `localStorage`；清除站点
  数据或使用产品内删除功能即可移除本地副本。
- Browser storage is not an encrypted vault. On a shared device or browser
  profile, do not enable birth-profile saving and clear privacy data when
  finished. / 浏览器本地存储不是加密保险箱；使用共享设备或浏览器配置时，请勿启用
  生辰保存，并在结束后清除隐私数据。
- Starting a reading sends the fields required for that request to the selected
  Express server. A hosted deployment therefore involves network transit even
  though the app does not persist those fields in a server database. /
  开始推演时，完成本次请求所需字段会发送到所连接的 Express 服务；因此线上部署
  会产生网络传输，但应用不会将这些字段持久化到服务端数据库。
- The Zi Wei narrative stage should send calculated symbols—not unnecessary raw
  birth fields—to Agnes. / 紫微叙事阶段应向 Agnes 发送已计算符号，而不是不必要的
  原始生辰字段。
- Questions, optional mood images, follow-up messages, and generated imagery
  prompts are sent to Agnes only when the user invokes the corresponding
  feature. Provider-side processing is governed by the chosen Agnes account and
  its policies. / 用户主动使用相关能力时，问题、可选心境图、追问内容和配图提示才会
  发送至 Agnes；供应商侧处理遵循所配置 Agnes 账户及其政策。
- Do not put secrets in `VITE_*` variables: Vite embeds them in browser assets. /
  不要将任何密钥写入 `VITE_*` 变量，Vite 会把它们打包进浏览器资源。

Avoid entering government identifiers, financial credentials, medical records,
exact home addresses, or images containing third-party private information.

请勿输入身份证件、金融凭据、医疗记录、精确住址，或含有第三方隐私的图片。

## Narrative safeguards / 叙事护栏

All production prompts and fallback narratives must follow the same rules:

所有生产 Prompt 与降级文案必须遵守同一组规则：

- no auspicious/inauspicious verdicts and no deterministic prediction; /
  不作吉凶断语，不作确定性预言；
- do not use “注定”, “成败”, “大凶”, or “大吉” as claims about the user; /
  不以“注定、成败、大凶、大吉”对用户下结论；
- present multiple conditional possibilities with equal dignity; /
  以条件化语言呈现多个同等被尊重的可能性；
- distinguish symbolic reflection from facts and professional advice; /
  明确区分符号叙事、客观事实与专业建议；
- avoid diagnosing mental or physical health; /
  不诊断心理或身体健康状况；
- encourage immediate, qualified human help when a message indicates imminent
  danger, self-harm, abuse, or another crisis. /
  当内容显示紧迫危险、自伤、虐待或其他危机时，引导用户立即联系合格的人类援助。

## Image safeguards / 图像护栏

Generated images are abstract atmosphere art built from light, mist, roads,
stars, tides, clouds, and similarly neutral metaphors. Prompts prohibit tarot
card artwork, antique star charts, hexagrams, divination diagrams, religious
symbols, photorealistic people, readable text, logos, and watermarks.

生成图片只使用光影、云雾、道路、星河、潮汐等中性隐喻构成抽象氛围艺术。提示词
禁止塔罗牌原画、古星盘、卦象、占卜图、宗教符号、写实人物、可读文字、Logo 与水印。

## Scope / 使用边界

The product is not medical, mental-health, legal, financial, employment, or
safety advice. For high-impact decisions, use appropriate professional and
real-world evidence. If you are in immediate danger, contact local emergency
services or a trusted person who can be physically present.

本产品不构成医疗、心理、法律、金融、就业或安全建议。涉及重大现实后果时，请结合
可靠事实与相应专业人士。若正面临即时危险，请联系当地紧急服务或能到场协助的可信任
人士。
