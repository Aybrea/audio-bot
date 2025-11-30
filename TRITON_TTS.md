# Triton TTS 服务集成指南

本项目已集成基于 Triton Inference Server 的 TTS 服务（参考 `resource/client_grpc_simple.py`）。

## 架构说明

### TTS 服务端
- **服务器**: Triton Inference Server
- **地址**: `speechlab-tunnel.southeastasia.cloudapp.azure.com:8000`
- **支持模型**:
  - `cosyvoice2` (推荐，24kHz采样率)
  - `f5_tts` (16kHz采样率)
  - `spark_tts` (16kHz采样率)
- **通信协议**: gRPC Streaming

### 客户端实现
- **文件**: `lib/triton-tts-client.ts`
- **功能**:
  - 流式语音合成
  - 文本分段处理
  - 音频拼接
  - WAV 格式编码

## 快速开始

### 1. 环境变量配置

编辑 `.env.local`：

```bash
# Triton TTS服务配置
TTS_SERVER_ADDRESS=speechlab-tunnel.southeastasia.cloudapp.azure.com
TTS_SERVER_PORT=8000
TTS_MODEL_NAME=cosyvoice2
TTS_SAMPLE_RATE=24000
```

### 2. gRPC Proto 文件（可选）

如果你有 Triton 的 `.proto` 文件，可以放在 `proto/grpc_service.proto`：

```bash
mkdir proto
# 将 grpc_service.proto 放入 proto/ 目录
```

如果没有 proto 文件，客户端会自动使用 Mock 模式进行测试。

### 3. 使用方法

TTS 服务已集成到 `/api/text-to-speech` 路由中，无需额外配置。

## 工作流程

```
用户录制声音样本
       ↓
   上传到服务器
       ↓
解析音频 (WebM → PCM)
       ↓
  重采样到 16kHz
       ↓
文本分段 (按标点符号)
       ↓
Triton gRPC 流式合成
   (每个分段并发)
       ↓
  拼接音频片段
       ↓
 编码为 WAV 格式
       ↓
   返回给前端
```

## 文本分段策略

为了优化长文本的合成效率，系统会自动将文本按标点符号分段：

```typescript
// 参数
minWords: 5   // 最少5个词才分段
maxWords: 20  // 最多20个词一段

// 示例
输入: "今天老板又让我加班了，真的很烦！我明明都做完了，还要我改这改那。"

分段结果:
- "今天老板又让我加班了，真的很烦！"
- "我明明都做完了，还要我改这改那。"
```

## API 接口说明

### POST /api/text-to-speech

**请求参数** (FormData):
- `text`: string - 要合成的文本
- `voiceSample`: Blob - 用户录制的语音样本
- `referenceText`: string (可选) - 语音样本对应的文本

**响应**:
- Content-Type: `audio/wav`
- 流式返回 WAV 格式音频

**示例**:
```javascript
const formData = new FormData();
formData.append("text", "这是要合成的文本");
formData.append("voiceSample", voiceBlob);
formData.append("referenceText", "这是参考音频的文本");

const response = await fetch("/api/text-to-speech", {
  method: "POST",
  body: formData,
});

const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);
```

## 核心类和函数

### TritonTTSClient 类

```typescript
const client = new TritonTTSClient({
  serverAddress: "your-server.com",
  serverPort: 8000,
  modelName: "cosyvoice2",
  targetSampleRate: 24000,
});

await client.initialize();

const result = await client.synthesizeWithSplitting(
  referenceAudioSamples,  // Float32Array
  "参考文本",
  "要合成的文本",
  5,   // minWords
  20   // maxWords
);

// result.audio: Float32Array - 合成的音频
// result.totalLatency: number - 总耗时(秒)
// result.firstChunkLatency: number - 首块延迟(秒)
```

### 文本分段函数

```typescript
import { splitTextByPunctuation } from "@/lib/triton-tts-client";

const segments = splitTextByPunctuation(
  "长文本...",
  10,  // minWords
  30   // maxWords
);
```

### 音频工具函数

```typescript
import { parseWavBuffer, createWavBuffer } from "@/lib/audio-utils";

// 解析 WAV 文件
const { samples, sampleRate } = parseWavBuffer(buffer);

// 创建 WAV 文件
const wavBuffer = createWavBuffer(samples, 24000);
```

## 性能优化

### 1. 使用 Speaker Cache
启用 `useSpeakerCache` 可以避免重复发送参考音频：

```typescript
const client = new TritonTTSClient({
  useSpeakerCache: true,  // 默认值
});
```

### 2. 并发合成
文本分段后会并发请求 Triton 服务，显著提升长文本合成速度。

### 3. 流式处理
使用 gRPC Streaming 接收音频块，边生成边返回，降低 TTFB (Time To First Byte)。

## 故障排查

### 问题1: Proto 文件找不到
```
Error: Proto file not found, using HTTP fallback
```

**解决方案**:
- 从 Triton 服务器获取 `grpc_service.proto` 文件
- 放入项目根目录的 `proto/` 文件夹
- 或者使用 Mock 模式测试（会生成测试音频）

### 问题2: gRPC 连接失败
```
Error: gRPC stream error
```

**解决方案**:
- 检查服务器地址和端口是否正确
- 确认 Triton 服务器正在运行
- 检查网络连接和防火墙设置

### 问题3: 音频格式不支持
```
Warning: 无法解析音频格式，使用占位数据
```

**解决方案**:
- 浏览器录音格式为 WebM，需要转换为 WAV
- 目前代码会警告并使用占位数据
- 可以添加 ffmpeg 或其他音频库进行转换

## 与 Python 客户端的对应关系

| Python | TypeScript | 说明 |
|--------|-----------|------|
| `client_grpc_simple.py` | `lib/triton-tts-client.ts` | 主客户端 |
| `split_text_by_punctuation()` | `splitTextByPunctuation()` | 文本分段 |
| `prepare_request_input_output()` | `prepareInputs()` + `createInferRequest()` | 准备请求 |
| `run_sync_streaming_inference()` | `synthesize()` | 流式合成 |
| `synthesize_with_splitting()` | `synthesizeWithSplitting()` | 分段合成 |

## 下一步改进

1. **WebM 转 WAV**: 添加浏览器录音格式的转换
2. **实时流式播放**: 前端接收音频流后立即播放
3. **错误重试**: 添加自动重试机制
4. **音频缓存**: 缓存已合成的音频片段
5. **多语言支持**: 根据语言选择不同的模型

## 参考资料

- Triton Inference Server: https://github.com/triton-inference-server
- CosyVoice2 模型: https://github.com/FunAudioLLM/CosyVoice
- gRPC Node.js: https://grpc.io/docs/languages/node/
