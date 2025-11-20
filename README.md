# 嘴替机器人 🤬

一个让AI用你的声音帮你吐槽的Web应用。用户描述想吐槽的事情，AI会生成犀利的吐槽内容，并用克隆的用户声音说出来。

## 功能特性

- 🎤 **语音录制**：录制你的声音样本用于声音克隆
- 💬 **AI吐槽生成**：基于大语言模型生成接地气的吐槽内容
- 🗣️ **语音合成**：用你的声音说出吐槽内容
- ��� **音频播放**：带进度条的音频播放器

## 技术栈

- [Next.js 15](https://nextjs.org/) - React框架
- [HeroUI v2](https://heroui.com/) - UI组件库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- Web Audio API - 语音录制

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

### 3. 配置AI模型和TTS服务

#### 配置AI模型（生成吐槽内容）

编辑 `app/api/generate-roast/route.ts`，替换为你自己部署的模型API：

```typescript
// 示例：使用OpenAI兼容的API
const response = await fetch(process.env.MODEL_API_URL + "/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.MODEL_API_KEY}`,
  },
  body: JSON.stringify({
    model: process.env.MODEL_NAME,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: complaint },
    ],
    temperature: 0.8,
    max_tokens: 500,
  }),
});
```

#### 配置TTS服务（语音合成）

编辑 `app/api/text-to-speech/route.ts`，选择并配置一个TTS服务：

**推荐方案：**

1. **Fish Audio** - 支持中文语音克隆
   - 网站：https://fish.audio/
   - 优点：支持中文、语音克隆质量高
   - 在 `.env.local` 中配置 `FISH_AUDIO_API_KEY`

2. **ElevenLabs** - 高质量语音克隆
   - 网站：https://elevenlabs.io/
   - 优点：语音质量极高
   - 在 `.env.local` 中配置 `ELEVENLABS_API_KEY`

3. **OpenAI TTS** - 简单但不支持语音克隆
   - 优点：API简单，价格便宜
   - 缺点：不支持实时语音克隆

### 4. 运行开发服务器

```bash
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 5. 构建生产版本

```bash
bun run build
bun run start
```

## 使用说明

1. **录制声音**：点击"开始录音"按钮，说一段话（10-30秒），点击"停止录音"
2. **输入槽点**：在文本框中描述你想吐槽的事情
3. **生成吐槽**：点击"开骂！"按钮
4. **听语音**：等待AI生成吐槽内容和语音，然后播放

## 项目结构

```
app/
├── api/
│   ├── generate-roast/    # AI生成吐槽内容的API
│   └── text-to-speech/    # TTS语音合成的API
├── page.tsx               # 主页面
└── layout.tsx            # 根布局

components/
├── voice-recorder.tsx    # 语音录制组件
├── audio-player.tsx      # 音频播放组件
└── navbar.tsx           # 导航栏

config/
└── site.ts              # 网站配置
```

## 自定义配置

### 修改吐槽风格

编辑 `app/api/generate-roast/route.ts` 中的 `SYSTEM_PROMPT` 来调整AI的吐槽风格。

### 修改UI主题

编辑 `tailwind.config.js` 和 `app/layout.tsx` 中的主题配置。

## 开发提示

- 语音录制需要HTTPS或localhost环境（浏览器安全限制）
- 首次使用需要授权麦克风权限
- TTS服务通常有API调用限制和费用，请查看对应服务商的定价
- 建议在生产环境中添加用户认证和使用限制

## License

MIT

## 技术支持

如有问题，请查看各服务商的官方文档：
- Next.js: https://nextjs.org/docs
- Fish Audio API: https://fish.audio/docs
- ElevenLabs API: https://elevenlabs.io/docs
