/**
 * Triton Text-to-Speech (TTS) gRPC Client
 *
 * TTS客户端 - 根据文本和声音样本生成语音
 */

import * as path from "path";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

export interface TTSConfig {
  serverAddress: string;
  serverPort: number;
  modelName: string;
  targetSampleRate: number;
}

export interface SynthesisResult {
  audio: Float32Array;
  latency: number;
}

/**
 * Triton TTS Client
 */
export class TritonTTSClient {
  private config: TTSConfig;
  private grpcClient: any = null;

  constructor(config: Partial<TTSConfig> = {}) {
    this.config = {
      serverAddress:
        config.serverAddress ||
        "speechlab-tunnel.southeastasia.cloudapp.azure.com",
      serverPort: config.serverPort || 8000,
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

      // 配置gRPC channel options
      const channelOptions = {
        "grpc.max_receive_message_length": 1024 * 1024 * 100, // 100MB
        "grpc.max_send_message_length": 1024 * 1024 * 100, // 100MB
        "grpc.keepalive_time_ms": 30000,
        "grpc.keepalive_timeout_ms": 10000,
        "grpc.keepalive_permit_without_calls": 1,
        "grpc.http2.max_pings_without_data": 0,
        "grpc.http2.min_time_between_pings_ms": 10000,
        "grpc.http2.min_ping_interval_without_data_ms": 5000,
      };

      this.grpcClient = new inference.GRPCInferenceService(
        serverUrl,
        grpc.credentials.createInsecure(),
        channelOptions,
      );

      // eslint-disable-next-line no-console
      console.log("✅ TTS Client initialized successfully:", serverUrl);
      // eslint-disable-next-line no-console
      console.log("✅ gRPC client ready, will use real TTS service");

      // 测试连接 - 调用ServerLive检查服务器是否可达
      try {
        await new Promise((resolve, reject) => {
          this.grpcClient.ServerLive({}, (error: any, response: any) => {
            if (error) {
              // eslint-disable-next-line no-console
              console.warn("⚠️  ServerLive check failed:", error.message);
              reject(error);
            } else {
              // eslint-disable-next-line no-console
              console.log("✅ ServerLive check passed:", response);
              resolve(response);
            }
          });
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("❌ Failed to connect to server:", error);
        throw error;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to initialize gRPC client - using MOCK mode");
      // eslint-disable-next-line no-console
      console.error("❌ Proto file not found or invalid:", error);
      // eslint-disable-next-line no-console
      console.error(
        "❌ Expected proto file at:",
        path.join(process.cwd(), "proto", "grpc_service.proto"),
      );
    }
  }

  /**
   * TTS语音合成
   *
   * @param text 要说的文本
   * @param referenceAudio 声音样本（可选，用于克隆声音）
   * @param referenceText 声音样本的转录文本（可选）
   */
  async synthesize(
    text: string,
    referenceAudio: Float32Array | null = null,
    referenceText: string | null = null,
  ): Promise<SynthesisResult> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const startTime = Date.now();

    // eslint-disable-next-line no-console
    console.log("TTS synthesis request:", {
      text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
      hasReferenceAudio: !!referenceAudio,
      referenceText: referenceText
        ? referenceText.substring(0, 50) +
          (referenceText.length > 50 ? "..." : "")
        : "none",
      model: this.config.modelName,
    });

    if (this.grpcClient) {
      // eslint-disable-next-line no-console
      console.log("📡 Calling real TTS service via gRPC...");

      try {
        return await this.grpcSynthesize(text, referenceAudio, referenceText);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("❌ gRPC synthesis failed:", error);
        throw error;
      }
    }

    // Mock 模式 - 抛出错误
    // eslint-disable-next-line no-console
    console.error("⚠️  MOCK MODE - gRPC client not initialized!");
    // eslint-disable-next-line no-console
    console.error(
      "⚠️  Cannot generate audio. Proto file or server connection failed.",
    );

    throw new Error("TTS服务未初始化。请检查proto文件和服务器连接。");
  }

  /**
   * gRPC 调用实现
   */
  private async grpcSynthesize(
    text: string,
    referenceAudio: Float32Array | null,
    referenceText: string | null,
  ): Promise<SynthesisResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const requestId = `tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 构建输入
      const inputs: any[] = [
        {
          name: "target_text",
          datatype: "BYTES",
          shape: [1, 1],
          contents: {
            bytes_contents: [Buffer.from(text, "utf-8")],
          },
        },
      ];

      // 如果提供了参考音频和文本，添加到输入
      if (referenceAudio && referenceText) {
        inputs.push({
          name: "reference_wav",
          datatype: "FP32",
          shape: [1, referenceAudio.length],
          contents: {
            fp32_contents: Array.from(referenceAudio),
          },
        });
        inputs.push({
          name: "reference_wav_len",
          datatype: "INT32",
          shape: [1, 1],
          contents: {
            int_contents: [referenceAudio.length],
          },
        });
        inputs.push({
          name: "reference_text",
          datatype: "BYTES",
          shape: [1, 1],
          contents: {
            bytes_contents: [Buffer.from(referenceText, "utf-8")],
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

      // eslint-disable-next-line no-console
      console.log("📤 Sending request:", {
        model_name: request.model_name,
        id: request.id,
        inputCount: request.inputs.length,
        outputCount: request.outputs.length,
      });

      const audioChunks: Float32Array[] = [];
      const call = this.grpcClient.ModelStreamInfer();

      call.on("data", (response: any) => {
        // eslint-disable-next-line no-console
        console.log("📦 Received response chunk:", {
          hasInferResponse: !!response.infer_response,
          hasOutputs: !!response.infer_response?.outputs,
          outputCount: response.infer_response?.outputs?.length || 0,
          hasRawOutputContents: !!response.infer_response?.raw_output_contents,
          rawOutputContentsLength:
            response.infer_response?.raw_output_contents?.length || 0,
        });

        // 打印完整的响应结构以便调试
        // eslint-disable-next-line no-console
        console.log(
          "🔍 Full response structure:",
          JSON.stringify(response, null, 2).substring(0, 500),
        );

        const isFinal =
          response.infer_response?.parameters?.triton_final_response
            ?.bool_param;

        if (isFinal) {
          // eslint-disable-next-line no-console
          console.log("🏁 Received final response marker");

          return;
        }

        const outputs = response.infer_response?.outputs;

        if (outputs) {
          for (const output of outputs) {
            // eslint-disable-next-line no-console
            console.log("🎵 Processing output:", {
              name: output.name,
              hasRawData: !!response.infer_response?.raw_output_contents?.[0],
              rawDataLength:
                response.infer_response?.raw_output_contents?.[0]?.length || 0,
            });

            if (output.name === "waveform") {
              const rawData = response.infer_response?.raw_output_contents?.[0];

              if (rawData) {
                // 创建一个新的对齐的ArrayBuffer副本
                // 这样可以避免byteOffset不对齐的问题
                const alignedBuffer = rawData.buffer.slice(
                  rawData.byteOffset,
                  rawData.byteOffset + rawData.byteLength,
                );
                const chunk = new Float32Array(alignedBuffer);

                audioChunks.push(chunk);
                // eslint-disable-next-line no-console
                console.log(
                  `✅ Added audio chunk: ${chunk.length} samples (total chunks: ${audioChunks.length})`,
                );
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

      // 直接发送请求对象，不需要包装
      call.write(request);
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
