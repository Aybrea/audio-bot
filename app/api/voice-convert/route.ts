import { NextRequest, NextResponse } from "next/server";

import { TritonTTSClient, encodeWAV } from "@/lib/triton-tts-client";
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

    try {
      // 执行TTS生成
      const result = await ttsClient.synthesize(
        text,
        referenceSamples,
        referenceText,
      );

      // eslint-disable-next-line no-console
      console.log("TTS生成完成:", {
        outputSamples: result.audio.length,
        latency: result.latency.toFixed(2) + "s",
      });

      // 编码为 WAV 格式
      const wavBuffer = encodeWAV(result.audio, ttsConfig.targetSampleRate);

      return new NextResponse(wavBuffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": wavBuffer.length.toString(),
        },
      });
    } finally {
      ttsClient.close();
    }
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
