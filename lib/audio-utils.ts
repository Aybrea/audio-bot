/**
 * Audio processing utilities for TTS
 */

/**
 * Convert WebM audio blob to WAV format
 */
export async function webmToWav(webmBlob: Blob): Promise<Buffer> {
  // In Node.js environment, we need to decode the audio
  const arrayBuffer = await webmBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // TODO: Implement proper WebM to WAV conversion
  // For now, return the buffer as-is
  // You may need to use ffmpeg or similar library for proper conversion
  return buffer;
}

/**
 * Decode audio file to Float32Array PCM samples
 */
export async function decodeAudioData(
  audioBuffer: ArrayBuffer,
  targetSampleRate: number = 16000,
): Promise<{ samples: Float32Array; sampleRate: number }> {
  // This needs to be implemented based on your audio library
  // For browser: use Web Audio API
  // For Node.js: use a library like 'node-wav' or 'audio-decode'

  // Placeholder implementation
  const samples = new Float32Array(targetSampleRate); // 1 second of silence

  return {
    samples,
    sampleRate: targetSampleRate,
  };
}

/**
 * Resample audio to target sample rate
 */
export function resampleAudio(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) {
    return input;
  }

  const ratio = toRate / fromRate;
  const outputLength = Math.floor(input.length * ratio);
  const output = new Float32Array(outputLength);

  // Simple linear interpolation resampling
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i / ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
    const t = srcIndex - srcIndexFloor;

    output[i] = input[srcIndexFloor] * (1 - t) + input[srcIndexCeil] * t;
  }

  return output;
}

/**
 * Normalize audio samples to [-1, 1] range
 */
export function normalizeAudio(samples: Float32Array): Float32Array {
  const max = Math.max(...Array.from(samples).map(Math.abs));

  if (max === 0) return samples;

  const normalized = new Float32Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    normalized[i] = samples[i] / max;
  }

  return normalized;
}

/**
 * Convert Float32Array samples to 16-bit PCM Buffer
 */
export function float32ToInt16(samples: Float32Array): Buffer {
  const buffer = Buffer.alloc(samples.length * 2);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;

    buffer.writeInt16LE(val, i * 2);
  }

  return buffer;
}

/**
 * Create WAV file buffer from PCM samples
 */
export function createWavBuffer(
  samples: Float32Array,
  sampleRate: number,
  numChannels: number = 1,
): Buffer {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const pcmData = float32ToInt16(samples);
  const dataSize = pcmData.length;
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Copy PCM data
  // 使用set方法代替copy，避免TypeScript类型问题
  buffer.set(pcmData, 44);

  return buffer;
}

/**
 * Parse WAV file and extract PCM samples
 */
export function parseWavBuffer(buffer: Buffer): {
  samples: Float32Array;
  sampleRate: number;
  numChannels: number;
} {
  // Check RIFF header
  if (buffer.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("Invalid WAV file: missing RIFF header");
  }

  if (buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Invalid WAV file: missing WAVE header");
  }

  // Read format chunk
  const numChannels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bitsPerSample = buffer.readUInt16LE(34);

  // Find data chunk
  let dataOffset = 44; // Standard WAV header size
  const dataSize = buffer.readUInt32LE(40);

  // Convert PCM to Float32Array
  const numSamples = dataSize / (bitsPerSample / 8) / numChannels;
  const samples = new Float32Array(numSamples);

  if (bitsPerSample === 16) {
    for (let i = 0; i < numSamples; i++) {
      const offset = dataOffset + i * 2 * numChannels;
      const val = buffer.readInt16LE(offset);

      samples[i] = val / (val < 0 ? 0x8000 : 0x7fff);
    }
  } else if (bitsPerSample === 8) {
    for (let i = 0; i < numSamples; i++) {
      const offset = dataOffset + i * numChannels;
      const val = buffer.readUInt8(offset) - 128;

      samples[i] = val / 128;
    }
  } else {
    throw new Error(`Unsupported bits per sample: ${bitsPerSample}`);
  }

  return {
    samples,
    sampleRate,
    numChannels,
  };
}
