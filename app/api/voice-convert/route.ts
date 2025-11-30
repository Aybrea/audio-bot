import { NextRequest, NextResponse } from "next/server";

import { TritonVCClient, encodeWAV } from "@/lib/triton-vc-client";
import { parseWavBuffer } from "@/lib/audio-utils";

// 语音转换服务配置
const vcConfig = {
  serverAddress:
    process.env.VC_SERVER_ADDRESS ||
    "speechlab-tunnel.southeastasia.cloudapp.azure.com",
  serverPort: parseInt(process.env.VC_SERVER_PORT || "8001"),
  modelName: process.env.VC_MODEL_NAME || "cosyvoice2",
  targetSampleRate: parseInt(process.env.VC_SAMPLE_RATE || "24000"),
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sourceAudio = formData.get("sourceAudio") as Blob;
    const targetAudio = formData.get("targetAudio") as Blob | null;
    const presetVoice = formData.get("presetVoice") as string | null;

    if (!sourceAudio) {
      return NextResponse.json({ error: "缺少源语音" }, { status: 400 });
    }

    // eslint-disable-next-line no-console
    console.log("语音转换请求:", {
      sourceAudioSize: sourceAudio.size,
      hasTargetAudio: !!targetAudio,
      presetVoice: presetVoice || "none",
    });

    // 解析源语音
    const sourceBuffer = Buffer.from(await sourceAudio.arrayBuffer());
    let sourceSamples: Float32Array;
    let sourceSampleRate: number;

    try {
      const parsed = parseWavBuffer(sourceBuffer);

      sourceSamples = parsed.samples;
      sourceSampleRate = parsed.sampleRate;
    } catch {
      // 如果不是 WAV 格式，需要转换
      // eslint-disable-next-line no-console
      console.warn("源语音不是WAV格式，尝试直接处理");
      // TODO: 实现 WebM 到 PCM 的转换
      sourceSamples = new Float32Array(16000 * 3); // 3秒占位
      sourceSampleRate = 16000;
    }

    // 重采样到 16kHz（如果需要）
    if (sourceSampleRate !== 16000) {
      sourceSamples = resampleAudio(sourceSamples, sourceSampleRate, 16000);
    }

    // 解析目标声音（如果有）
    let targetSamples: Float32Array | null = null;

    if (targetAudio) {
      const targetBuffer = Buffer.from(await targetAudio.arrayBuffer());

      try {
        const parsed = parseWavBuffer(targetBuffer);

        targetSamples = parsed.samples;

        if (parsed.sampleRate !== 16000) {
          targetSamples = resampleAudio(
            targetSamples,
            parsed.sampleRate,
            16000,
          );
        }
      } catch {
        // eslint-disable-next-line no-console
        console.warn("目标语音不是WAV格式");
      }
    }

    // 初始化语音转换客户端
    const vcClient = new TritonVCClient(vcConfig);

    await vcClient.initialize();

    try {
      // 执行语音转换
      const result = await vcClient.convert(
        sourceSamples,
        targetSamples,
        presetVoice || "default",
      );

      // eslint-disable-next-line no-console
      console.log("语音转换完成:", {
        outputSamples: result.audio.length,
        latency: result.latency.toFixed(2) + "s",
      });

      // 编码为 WAV 格式
      const wavBuffer = encodeWAV(result.audio, vcConfig.targetSampleRate);

      return new NextResponse(wavBuffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": wavBuffer.length.toString(),
        },
      });
    } finally {
      vcClient.close();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("语音转换失败:", error);

    return NextResponse.json({ error: "语音转换失败" }, { status: 500 });
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
