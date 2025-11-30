/**
 * Triton Voice Conversion (VC) gRPC Client
 *
 * 语音转换客户端 - 将源语音转换为目标声音
 */

import * as path from "path";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

export interface VCConfig {
  serverAddress: string;
  serverPort: number;
  modelName: string;
  targetSampleRate: number;
}

export interface ConversionResult {
  audio: Float32Array;
  latency: number;
}

/**
 * Triton Voice Conversion Client
 */
export class TritonVCClient {
  private config: VCConfig;
  private grpcClient: any = null;

  constructor(config: Partial<VCConfig> = {}) {
    this.config = {
      serverAddress:
        config.serverAddress ||
        "speechlab-tunnel.southeastasia.cloudapp.azure.com",
      serverPort: config.serverPort || 8001,
      modelName: config.modelName || "cosyvoice2",
      targetSampleRate: config.targetSampleRate || 24000,
    };
  }

  /**
   * 初始化 gRPC 客户端
   */
  async initialize() {
    const PROTO_PATH = path.join(process.cwd(), "proto", "grpc_service.proto");

    try {
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      const inference = protoDescriptor.inference as any;

      if (!inference?.GRPCInferenceService) {
        throw new Error("Could not find GRPCInferenceService in proto");
      }

      const serverUrl = `${this.config.serverAddress}:${this.config.serverPort}`;

      this.grpcClient = new inference.GRPCInferenceService(
        serverUrl,
        grpc.credentials.createInsecure(),
      );

      // eslint-disable-next-line no-console
      console.log("VC Client initialized:", serverUrl);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Proto not found, using mock mode:", error);
    }
  }

  /**
   * 语音转换
   *
   * @param sourceAudio 源语音 (用户录制的吐槽)
   * @param targetAudio 目标声音样本 (可选，不提供则使用服务端默认)
   * @param presetVoice 预设声音名称 (当 targetAudio 为空时使用)
   */
  async convert(
    sourceAudio: Float32Array,
    targetAudio: Float32Array | null,
    presetVoice: string = "default",
  ): Promise<ConversionResult> {
    const startTime = Date.now();

    // eslint-disable-next-line no-console
    console.log("Voice conversion request:", {
      sourceLength: sourceAudio.length,
      hasTarget: !!targetAudio,
      preset: presetVoice,
      model: this.config.modelName,
    });

    if (this.grpcClient) {
      try {
        return await this.grpcConvert(sourceAudio, targetAudio, presetVoice);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("gRPC conversion failed:", error);
        throw error;
      }
    }

    // Mock 模式 - 返回源音频（实际上没有转换）
    // eslint-disable-next-line no-console
    console.warn("Using mock mode - returning processed source audio");

    // 模拟处理：简单返回源音频
    const latency = (Date.now() - startTime) / 1000;

    return {
      audio: sourceAudio,
      latency,
    };
  }

  /**
   * gRPC 调用实现
   */
  private async grpcConvert(
    sourceAudio: Float32Array,
    targetAudio: Float32Array | null,
    presetVoice: string,
  ): Promise<ConversionResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const requestId = `vc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 构建输入
      const inputs: any[] = [
        {
          name: "source_wav",
          datatype: "FP32",
          shape: [1, sourceAudio.length],
          contents: {
            fp32_contents: Array.from(sourceAudio),
          },
        },
        {
          name: "source_wav_len",
          datatype: "INT32",
          shape: [1, 1],
          contents: {
            int_contents: [sourceAudio.length],
          },
        },
      ];

      // 如果有目标音频，添加到输入
      if (targetAudio) {
        inputs.push({
          name: "reference_wav",
          datatype: "FP32",
          shape: [1, targetAudio.length],
          contents: {
            fp32_contents: Array.from(targetAudio),
          },
        });
        inputs.push({
          name: "reference_wav_len",
          datatype: "INT32",
          shape: [1, 1],
          contents: {
            int_contents: [targetAudio.length],
          },
        });
      } else {
        // 使用预设声音
        inputs.push({
          name: "preset_voice",
          datatype: "BYTES",
          shape: [1, 1],
          contents: {
            bytes_contents: [Buffer.from(presetVoice)],
          },
        });
      }

      const request = {
        model_name: this.config.modelName,
        model_version: "",
        id: requestId,
        inputs,
        outputs: [{ name: "waveform" }],
      };

      const audioChunks: Float32Array[] = [];
      const call = this.grpcClient.ModelStreamInfer();

      call.on("data", (response: any) => {
        const isFinal =
          response.infer_response?.parameters?.triton_final_response
            ?.bool_param;

        if (isFinal) return;

        const outputs = response.infer_response?.outputs;

        if (outputs) {
          for (const output of outputs) {
            if (output.name === "waveform") {
              const rawData = response.infer_response?.raw_output_contents?.[0];

              if (rawData) {
                audioChunks.push(new Float32Array(rawData.buffer));
              }
            }
          }
        }
      });

      call.on("end", () => {
        const totalLength = audioChunks.reduce(
          (sum, chunk) => sum + chunk.length,
          0,
        );
        const combined = new Float32Array(totalLength);
        let offset = 0;

        for (const chunk of audioChunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }

        resolve({
          audio: combined,
          latency: (Date.now() - startTime) / 1000,
        });
      });

      call.on("error", (error: any) => {
        reject(error);
      });

      call.write({ model_infer_request: request });
      call.end();
    });
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.grpcClient) {
      grpc.closeClient(this.grpcClient);
      this.grpcClient = null;
    }
  }
}

/**
 * 编码为 WAV 格式
 */
export function encodeWAV(
  samples: Float32Array,
  sampleRate: number,
  numChannels: number = 1,
): Buffer {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;

    buffer.writeInt16LE(val, offset);
    offset += 2;
  }

  return buffer;
}
