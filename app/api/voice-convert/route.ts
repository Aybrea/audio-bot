import { NextRequest, NextResponse } from "next/server";

import { TritonTTSClient } from "@/lib/triton-tts-client";
import { parseWavBuffer } from "@/lib/audio-utils";

// TTS服务配置
const ttsConfig = {
  serverAddress:
    process.env.VC_SERVER_ADDRESS ||
    "speechlab-tunnel.southeastasia.cloudapp.azure.com",
  serverPort: parseInt(process.env.VC_SERVER_PORT || "8000"),
  modelName: process.env.VC_MODEL_NAME || "cosyvoice2",
  targetSampleRate: parseInt(process.env.VC_SAMPLE_RATE || "24000"),
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const text = formData.get("text") as string;
    const referenceAudio = formData.get("referenceAudio") as Blob | null;
    const referenceText = formData.get("referenceText") as string | null;

    if (!text) {
      return NextResponse.json({ error: "缺少文本内容" }, { status: 400 });
    }

    // eslint-disable-next-line no-console
    console.log("TTS请求:", {
      text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
      hasReferenceAudio: !!referenceAudio,
      referenceText: referenceText
        ? referenceText.substring(0, 50) +
          (referenceText.length > 50 ? "..." : "")
        : "none",
    });

    // 解析参考音频（如果提供）
    let referenceSamples: Float32Array | null = null;

    if (referenceAudio) {
      const referenceBuffer = Buffer.from(await referenceAudio.arrayBuffer());
      let referenceSampleRate: number;

      try {
        const parsed = parseWavBuffer(referenceBuffer);

        referenceSamples = parsed.samples;
        referenceSampleRate = parsed.sampleRate;
      } catch {
        // 如果不是 WAV 格式，需要转换
        // eslint-disable-next-line no-console
        console.warn("参考音频不是WAV格式，尝试直接处理");
        // TODO: 实现 WebM 到 PCM 的转换
        referenceSamples = new Float32Array(16000 * 3); // 3秒占位
        referenceSampleRate = 16000;
      }

      // 重采样到 16kHz（如果需要）
      if (referenceSampleRate !== 16000) {
        referenceSamples = resampleAudio(
          referenceSamples,
          referenceSampleRate,
          16000,
        );
      }
    }

    // 初始化TTS客户端
    const ttsClient = new TritonTTSClient(ttsConfig);

    await ttsClient.initialize();

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const audioChunks: Float32Array[] = [];

          // 使用流式合成
          for await (const chunk of ttsClient.synthesizeStream(
            text,
            referenceSamples,
            referenceText,
          )) {
            // eslint-disable-next-line no-console
            console.log(`📤 Sending chunk: ${chunk.length} samples`);

            // 收集所有块用于最后生成完整 WAV
            audioChunks.push(chunk);

            // 将 Float32Array 转换为 Buffer 并发送
            const buffer = Buffer.from(chunk.buffer);

            controller.enqueue(buffer);
          }

          // 所有块发送完成后，发送一个特殊的结束标记
          // 使用一个空的 Float32Array 作为结束标记
          const endMarker = new Float32Array(0);

          controller.enqueue(Buffer.from(endMarker.buffer));

          // eslint-disable-next-line no-console
          console.log("✅ All chunks sent, total chunks:", audioChunks.length);

          controller.close();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("❌ Streaming error:", error);
          controller.error(error);
        } finally {
          ttsClient.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("TTS生成失败:", error);

    return NextResponse.json({ error: "TTS生成失败" }, { status: 500 });
  }
}

// 重采样函数
function resampleAudio(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return input;

  const ratio = toRate / fromRate;
  const outputLength = Math.floor(input.length * ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i / ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
    const t = srcIndex - srcIndexFloor;

    output[i] = input[srcIndexFloor] * (1 - t) + input[srcIndexCeil] * t;
  }

  return output;
}
