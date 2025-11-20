# 快速集成指南

## 集成LLM API

打开 `app/api/generate-roast/route.ts`，找到TODO注释，替换为你的LLM API调用代码。

### 示例：使用OpenAI兼容API

```typescript
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

const data = await response.json();
const roast = data.choices[0].message.content;

return NextResponse.json({ roast });
```

### 环境变量配置

在 `.env.local` 中添加：

```bash
MODEL_API_URL=https://your-api-endpoint.com
MODEL_API_KEY=your_api_key_here
MODEL_NAME=your_model_name
```

## 集成TTS服务

打开 `app/api/text-to-speech/route.ts`，选择一个TTS服务进行集成。

### 方案1: Fish Audio（推荐用于中文）

```typescript
const formData = new FormData();
formData.append("text", text);
formData.append("reference_audio", voiceSample);
formData.append("reference_text", ""); // 可选：参考音频的文本

const response = await fetch("https://api.fish.audio/v1/tts", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
  },
  body: formData,
});

const audioBuffer = await response.arrayBuffer();

return new NextResponse(audioBuffer, {
  headers: {
    "Content-Type": "audio/mpeg",
  },
});
```

环境变量：
```bash
FISH_AUDIO_API_KEY=your_fish_audio_key
```

### 方案2: ElevenLabs

首先需要克隆声音创建voice_id（需要单独调用API），然后：

```typescript
const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "xi-api-key": process.env.ELEVENLABS_API_KEY!,
  },
  body: JSON.stringify({
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  }),
});

const audioBuffer = await response.arrayBuffer();

return new NextResponse(audioBuffer, {
  headers: {
    "Content-Type": "audio/mpeg",
  },
});
```

环境变量：
```bash
ELEVENLABS_API_KEY=your_elevenlabs_key
```

### 方案3: OpenAI TTS（不支持语音克隆）

```typescript
const response = await fetch("https://api.openai.com/v1/audio/speech", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "tts-1",
    voice: "alloy", // 可选: alloy, echo, fable, onyx, nova, shimmer
    input: text,
  }),
});

const audioBuffer = await response.arrayBuffer();

return new NextResponse(audioBuffer, {
  headers: {
    "Content-Type": "audio/mpeg",
  },
});
```

环境变量：
```bash
OPENAI_API_KEY=your_openai_key
```

## 测试流程

1. 启动开发服务器：`bun run dev`
2. 访问 http://localhost:3000
3. 点击"开始录音"，录制一段你的声音（10-30秒）
4. 在文本框输入你想吐槽的内容
5. 点击"开骂！"按钮
6. 查看生成的吐槽文本
7. 如果配置了TTS，会生成并播放语音

## 常见问题

### 麦克风权限
- 浏览器会提示麦克风权限，需要允许
- 只在HTTPS或localhost环境下可用

### API调用失败
- 检查环境变量是否正确配置
- 查看浏览器控制台和服务器日志
- 确认API密钥有效且有足够额度

### 语音质量
- Fish Audio和ElevenLabs需要较长的参考音频（10-30秒）
- 录制时环境要安静，发音要清晰
- 不同TTS服务对中文支持程度不同

## 生产部署提示

- 添加用户认证
- 限制API调用频率（防止滥用）
- 添加内容审核（防止生成不当内容）
- 监控API使用量和费用
- 考虑缓存常见吐槽内容
