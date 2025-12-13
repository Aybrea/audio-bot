/**
 * 流式音频播放器
 * 使用 Web Audio API 实现实时音频流播放
 */

export class StreamingAudioPlayer {
  private audioContext: AudioContext;
  private sampleRate: number;
  private nextStartTime: number = 0;
  private isPlaying: boolean = false;
  private scheduledBuffers: AudioBufferSourceNode[] = [];
  private analyser: AnalyserNode;
  private gainNode: GainNode;
  private frequencyDataArray!: Uint8Array;
  private timeDomainDataArray!: Uint8Array;
  private isBuffering: boolean = true;
  private bufferThreshold: number;
  private bufferedChunks: Float32Array[] = [];
  private bufferedDuration: number = 0;

  constructor(sampleRate: number = 24000, bufferThreshold: number = 1.0) {
    this.audioContext = new AudioContext({ sampleRate });
    this.sampleRate = sampleRate;
    this.bufferThreshold = bufferThreshold;

    // 创建分析器节点
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // 创建增益节点
    this.gainNode = this.audioContext.createGain();

    // 连接：gainNode -> analyser -> destination
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    // 预分配数组以避免频繁创建
    const bufferLength = this.analyser.frequencyBinCount;

    this.frequencyDataArray = new Uint8Array(new ArrayBuffer(bufferLength));
    this.timeDomainDataArray = new Uint8Array(new ArrayBuffer(bufferLength));
  }

  /**
   * 播放音频块
   * @returns true 如果缓冲完成或已经在播放，false 如果仍在缓冲中
   */
  playChunk(audioData: Float32Array): boolean {
    if (audioData.length === 0) {
      // 空数据，可能是结束标记
      return !this.isBuffering;
    }

    if (this.isBuffering) {
      // 缓冲模式：累积音频块
      this.bufferedChunks.push(audioData);
      const duration = audioData.length / this.sampleRate;

      this.bufferedDuration += duration;

      // eslint-disable-next-line no-console
      console.log(
        `📦 Buffering chunk: ${audioData.length} samples, duration: ${duration.toFixed(2)}s, total buffered: ${this.bufferedDuration.toFixed(2)}s`,
      );

      // 检查是否达到缓冲阈值
      if (this.bufferedDuration >= this.bufferThreshold) {
        // eslint-disable-next-line no-console
        console.log(
          `✅ Buffer threshold reached (${this.bufferedDuration.toFixed(2)}s >= ${this.bufferThreshold}s), starting playback`,
        );
        this.isBuffering = false;

        // 播放所有缓冲的音频块
        for (const chunk of this.bufferedChunks) {
          this.playChunkInternal(chunk);
        }
        this.bufferedChunks = [];

        return true; // 缓冲完成
      }

      return false; // 仍在缓冲中
    } else {
      // 正常播放模式：立即播放
      this.playChunkInternal(audioData);

      return true;
    }
  }

  /**
   * 内部方法：实际播放音频块
   */
  private playChunkInternal(audioData: Float32Array) {
    // 创建 AudioBuffer
    const audioBuffer = this.audioContext.createBuffer(
      1, // 单声道
      audioData.length,
      this.sampleRate,
    );

    // 将数据复制到 AudioBuffer
    audioBuffer.getChannelData(0).set(audioData);

    // 创建 AudioBufferSourceNode
    const source = this.audioContext.createBufferSource();

    source.buffer = audioBuffer;
    // 连接到 gainNode，然后通过 analyser 到 destination
    source.connect(this.gainNode);

    // 计算开始时间
    const currentTime = this.audioContext.currentTime;

    if (!this.isPlaying || this.nextStartTime < currentTime) {
      // 第一个块或者播放已经结束，立即开始
      this.nextStartTime = currentTime;
      this.isPlaying = true;
    }

    // 调度播放
    source.start(this.nextStartTime);

    // 更新下一个块的开始时间
    const duration = audioData.length / this.sampleRate;

    this.nextStartTime += duration;

    // 保存引用以便后续清理
    this.scheduledBuffers.push(source);

    // 当播放结束时清理
    source.onended = () => {
      const index = this.scheduledBuffers.indexOf(source);

      if (index > -1) {
        this.scheduledBuffers.splice(index, 1);
      }

      // 如果没有更多的缓冲区，标记为停止
      if (this.scheduledBuffers.length === 0) {
        this.isPlaying = false;
      }
    };

    // eslint-disable-next-line no-console
    console.log(
      `🎵 Scheduled audio chunk: ${audioData.length} samples, duration: ${duration.toFixed(2)}s, start at: ${this.nextStartTime.toFixed(2)}s`,
    );
  }

  /**
   * 停止播放
   */
  stop() {
    for (const source of this.scheduledBuffers) {
      try {
        source.stop();
      } catch {
        // 忽略已经停止的源
      }
    }
    this.scheduledBuffers = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
  }

  /**
   * 关闭音频上下文
   */
  close() {
    this.stop();
    this.audioContext.close();
  }

  /**
   * 获取当前播放状态
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 获取分析器实例
   */
  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  /**
   * 获取频域数据（频谱）
   * 复用预分配的数组以提高性能
   */
  getFrequencyData(): Uint8Array {
    // @ts-expect-error - TypeScript incorrectly infers Uint8Array<ArrayBufferLike> instead of Uint8Array<ArrayBuffer>
    // This is a known TypeScript type system limitation with Web Audio API types
    this.analyser.getByteFrequencyData(this.frequencyDataArray);

    return this.frequencyDataArray;
  }

  /**
   * 获取时域数据（波形）
   * 复用预分配的数组以提高性能
   */
  getTimeDomainData(): Uint8Array {
    // @ts-expect-error - TypeScript incorrectly infers Uint8Array<ArrayBufferLike> instead of Uint8Array<ArrayBuffer>
    // This is a known TypeScript type system limitation with Web Audio API types
    this.analyser.getByteTimeDomainData(this.timeDomainDataArray);

    return this.timeDomainDataArray;
  }
}

/**
 * 从流式响应中读取并播放音频
 * 返回收集到的所有音频数据
 */
export async function playStreamingAudio(
  response: Response,
  sampleRate: number = 24000,
  onProgress?: (bytesReceived: number) => void,
  onChunk?: (chunk: Float32Array) => void,
  onAnalyserUpdate?: (
    timeDomainData: Uint8Array,
    frequencyData: Uint8Array,
  ) => void,
  onBufferingComplete?: () => void,
  bufferThreshold: number = 1.0,
): Promise<Float32Array> {
  if (!response.body) {
    throw new Error("Response body is null");
  }

  const player = new StreamingAudioPlayer(sampleRate, bufferThreshold);
  const reader = response.body.getReader();
  let buffer = new Uint8Array(0);
  const allChunks: Float32Array[] = [];
  let animationId: number | null = null;
  let bufferingCompleteCallbackCalled = false;

  // 启动分析器数据更新循环（节流到约 30fps）
  if (onAnalyserUpdate) {
    let lastUpdateTime = 0;
    const updateInterval = 1000 / 30; // 30fps，约 33ms

    const updateAnalyser = (currentTime: number) => {
      if (player.getIsPlaying()) {
        // 节流：只在间隔时间后才更新
        if (currentTime - lastUpdateTime >= updateInterval) {
          const timeDomainData = player.getTimeDomainData();
          const frequencyData = player.getFrequencyData();

          // 创建数组副本以确保 React 能检测到变化
          onAnalyserUpdate(
            new Uint8Array(timeDomainData),
            new Uint8Array(frequencyData),
          );
          lastUpdateTime = currentTime;
        }
      }
      animationId = requestAnimationFrame(updateAnalyser);
    };

    animationId = requestAnimationFrame(updateAnalyser);
  }

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // eslint-disable-next-line no-console
        console.log("✅ Stream reading completed");
        break;
      }

      // 将新数据追加到缓冲区
      const newBuffer = new Uint8Array(buffer.length + value.length);

      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;

      if (onProgress) {
        onProgress(buffer.length);
      }

      // 尝试解析完整的 Float32Array 块
      // 每个 Float32 是 4 字节
      while (buffer.length >= 4) {
        // 检查是否有足够的数据来读取长度
        // 我们需要至少 4 字节来确定这是否是一个有效的块

        // 尝试将当前缓冲区转换为 Float32Array
        // 注意：我们需要确保字节对齐
        const alignedLength = Math.floor(buffer.length / 4) * 4;

        if (alignedLength === 0) {
          break;
        }

        // 创建对齐的 ArrayBuffer
        const alignedBuffer = buffer.slice(0, alignedLength).buffer;
        const floatArray = new Float32Array(alignedBuffer);

        // 播放这个块
        const bufferingComplete = player.playChunk(floatArray);

        // 如果缓冲完成且回调未被调用，则调用回调
        if (
          bufferingComplete &&
          !bufferingCompleteCallbackCalled &&
          onBufferingComplete
        ) {
          bufferingCompleteCallbackCalled = true;
          onBufferingComplete();
          // eslint-disable-next-line no-console
          console.log("🎉 Buffering complete callback triggered");
        }

        // 收集这个块用于后续生成完整文件
        allChunks.push(floatArray);

        // 通知新的音频块（用于实时波形显示）
        if (onChunk) {
          onChunk(floatArray);
        }

        // 从缓冲区中移除已处理的数据
        buffer = buffer.slice(alignedLength);

        // eslint-disable-next-line no-console
        console.log(
          `📦 Processed chunk: ${floatArray.length} samples, remaining buffer: ${buffer.length} bytes`,
        );
      }
    }

    // 处理剩余的缓冲区数据
    if (buffer.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `⚠️  Remaining buffer: ${buffer.length} bytes (not aligned)`,
      );
    }

    // 等待所有音频播放完成
    // eslint-disable-next-line no-console
    console.log("⏳ Waiting for audio playback to complete...");

    // 等待播放完成
    while (player.getIsPlaying()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // eslint-disable-next-line no-console
    console.log("✅ Audio playback completed");

    // 合并所有音频块
    const totalLength = allChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;

    for (const chunk of allChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // eslint-disable-next-line no-console
    console.log(`✅ Combined audio: ${combined.length} samples`);

    return combined;
  } finally {
    // 停止分析器更新循环
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
    player.close();
  }
}
