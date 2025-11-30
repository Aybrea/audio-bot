# 快速参考卡

## 🚀 一键启动

```bash
# 1. 安装
bun install

# 2. 配置环境变量（可选，有默认值）
cp .env.example .env.local

# 3. 运行
bun run dev
```

访问: http://localhost:3000

---

## 📋 项目状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 前端UI | ✅ 完成 | 录音、输入、播放界面 |
| 语音录制 | ✅ 完成 | MediaRecorder API |
| 音频播放 | ✅ 完成 | 自定义播放器 |
| **Triton TTS** | ✅ 完成 | gRPC流式合成 |
| LLM吐槽生成 | ⚠️ 待集成 | Mock数据可测试 |

---

## 🔑 关键文件

### 需要修改的文件
- `app/api/generate-roast/route.ts` - 集成你的LLM
- `.env.local` - 配置API密钥

### 核心实现文件
- `lib/triton-tts-client.ts` - Triton TTS客户端 ⭐
- `lib/audio-utils.ts` - 音频处理工具
- `app/api/text-to-speech/route.ts` - TTS API路由
- `app/page.tsx` - 主界面
- `components/voice-recorder.tsx` - 录音组件
- `components/audio-player.tsx` - 播放器组件

### 文档文件
- `TRITON_TTS.md` - TTS集成详细文档 ⭐
- `PROJECT_SUMMARY.md` - 项目总结
- `README.md` - 项目说明
- `INTEGRATION.md` - 集成指南

---

## 🎯 核心功能流程

```
[用户] → 录音 → [浏览器MediaRecorder] → WebM
                                           ↓
                                    [前端] 上传
                                           ↓
              ┌────────────────────────────┴────────────────────────────┐
              │                                                          │
    [吐槽生成API]                                              [TTS API]
    Mock数据(待集成LLM)                                  Triton gRPC客户端
              │                                                          │
              └───────────→ 吐槽文本 ─────────→ 文本分段 ────────────────┤
                                                                         ↓
                                                              并发流式合成
                                                                         ↓
                                                              拼接音频片段
                                                                         ↓
                                                              编码WAV格式
                                                                         ↓
              ┌──────────────────────────────────────────────────────────┘
              ↓
    [前端] 音频播放器 → 播放给用户
```

---

## 🛠️ Triton TTS 配置

### 环境变量 (.env.local)
```bash
TTS_SERVER_ADDRESS=speechlab-tunnel.southeastasia.cloudapp.azure.com
TTS_SERVER_PORT=8001
TTS_MODEL_NAME=cosyvoice2  # 或 f5_tts, spark_tts
TTS_SAMPLE_RATE=24000      # cosyvoice2用24000，其他用16000
```

### 支持的模型
| 模型 | 采样率 | 特点 |
|------|--------|------|
| cosyvoice2 | 24kHz | 推荐，质量高 |
| f5_tts | 16kHz | 快速 |
| spark_tts | 16kHz | 需要交叉淡化 |

---

## 🔧 LLM 集成（唯一待办）

编辑 `app/api/generate-roast/route.ts`，第30行左右：

```typescript
// 替换这段Mock代码
const mockRoast = generateMockRoast(complaint);
return NextResponse.json({ roast: mockRoast });

// 改为真实API调用
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

配置环境变量:
```bash
MODEL_API_URL=https://your-api.com
MODEL_API_KEY=sk-xxxxx
MODEL_NAME=your-model-name
```

---

## 📝 常用命令

```bash
bun run dev      # 开发模式（带热更新）
bun run build    # 构建生产版本
bun run start    # 运行生产服务器
bun run lint     # 代码检查
```

---

## 🐛 快速故障排查

| 问题 | 原因 | 解决 |
|------|------|------|
| Proto文件找不到 | 缺少grpc_service.proto | 正常，会用Mock模式 |
| 音频格式不支持 | WebM格式未转换 | 暂用占位数据，不影响测试 |
| Mock吐槽显示 | LLM未集成 | 正常，集成后会显示真实内容 |
| gRPC连接失败 | 服务器不可达 | 检查服务器地址、端口、网络 |

---

## 📚 了解更多

- **Triton TTS详解**: 查看 `TRITON_TTS.md`
- **项目总结**: 查看 `PROJECT_SUMMARY.md`
- **集成指南**: 查看 `INTEGRATION.md`
- **基础说明**: 查看 `README.md`

---

## ⚡ 技术亮点

1. **流式TTS** - 实时接收音频块，低延迟
2. **智能分段** - 长文本自动分段并发处理
3. **完整音频链路** - WebM → PCM → WAV 全流程
4. **TypeScript** - 类型安全，减少bug
5. **组件化** - 易维护易扩展
6. **Mock模式** - 无需后端即可测试UI

---

制作: Claude Code
版本: 1.0.0
更新: 2025-11-20
