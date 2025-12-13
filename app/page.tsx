"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Textarea } from "@heroui/input";
import { addToast } from "@heroui/toast";

import { title } from "@/components/primitives";
import { VoiceRecorder } from "@/components/voice-recorder";
import { WaveformPlayer } from "@/components/waveform-player";
import { LiveAudioVisualizer } from "@/components/live-audio-visualizer";
import { playStreamingAudio } from "@/lib/streaming-audio-player";

interface SampleFile {
  name: string;
  path: string;
  displayName: string;
  referenceText: string;
  description: string;
}

type VoiceMode =
  | { type: "default" }
  | { type: "sample"; file: SampleFile }
  | { type: "record" };

export default function Home() {
  const DEFAULT_REFERENCE_TEXT = "大家好，今天天气真不错，心情也很愉快。";

  const [textToSpeak, setTextToSpeak] = useState(
    "阳光透过稠密的枝叶洒落下来，那一片宁静的森林仿佛被金色丝线所包围。清风拂过，满眼绿意化作层层涟漪，在心头荡漾。",
  );
  const [voiceMode, setVoiceMode] = useState<VoiceMode>({ type: "default" });
  const [sampleFiles, setSampleFiles] = useState<SampleFile[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [referenceAudio, setReferenceAudio] = useState<Blob | null>(null);
  const [referenceText, setReferenceText] = useState(DEFAULT_REFERENCE_TEXT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null);
  const [analyserData, setAnalyserData] = useState<{
    timeDomain: Uint8Array | null;
    frequency: Uint8Array | null;
  }>({ timeDomain: null, frequency: null });
  const [playingSample, setPlayingSample] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [referenceAudioUrl, setReferenceAudioUrl] = useState<string | null>(
    null,
  );

  // 获取样本文件列表
  useEffect(() => {
    fetch("/api/samples")
      .then((res) => res.json())
      .then((data) => {
        setSampleFiles(data);
        setLoadingSamples(false);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load samples:", error);
        setLoadingSamples(false);
      });
  }, []);

  // 初始化音频元素
  useEffect(() => {
    const audio = new Audio();

    audio.addEventListener("ended", () => {
      setPlayingSample(null);
    });

    setAudioElement(audio);

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // 管理录音 URL
  useEffect(() => {
    if (referenceAudio) {
      const url = URL.createObjectURL(referenceAudio);

      setReferenceAudioUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setReferenceAudioUrl(null);
    }
  }, [referenceAudio]);

  const handleReferenceRecorded = (blob: Blob) => {
    setReferenceAudio(blob);
  };

  // 处理播放样本
  const handlePlaySample = (
    file: SampleFile,
    event: React.MouseEvent | React.TouchEvent,
  ) => {
    // 阻止事件冒泡和默认行为，避免触发卡片的选择
    event.stopPropagation();
    event.preventDefault();

    if (!audioElement) return;

    if (playingSample === file.path) {
      // 如果正在播放这个文件，则暂停
      audioElement.pause();
      setPlayingSample(null);
    } else {
      // 播放新文件
      audioElement.src = file.path;
      audioElement.play();
      setPlayingSample(file.path);
    }
  };

  // 处理选择默认声音
  const handleSelectDefault = () => {
    setVoiceMode({ type: "default" });
    setReferenceAudio(null);
    setReferenceText("");
  };

  // 处理选择样本文件
  const handleSelectSample = async (file: SampleFile) => {
    try {
      // 从 URL 获取文件
      const response = await fetch(file.path);
      const blob = await response.blob();

      setVoiceMode({ type: "sample", file });
      setReferenceAudio(blob);
      setReferenceText(file.referenceText);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load sample file:", error);
      addToast({
        title: "加载失败",
        description: "无法加载样本文件",
        color: "danger",
      });
    }
  };

  // 处理选择自行录音
  const handleSelectRecord = () => {
    setVoiceMode({ type: "record" });
    setReferenceAudio(null);
  };

  // 将任意音频格式转换为 WAV Blob
  const convertToWav = async (
    audioBlob: Blob,
    targetSampleRate: number = 16000,
  ): Promise<Blob> => {
    try {
      // 使用 Web Audio API 解码音频
      const audioContext = new AudioContext({ sampleRate: targetSampleRate });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // 获取第一个声道的数据
      const samples = audioBuffer.getChannelData(0);

      // 如果采样率不匹配，需要重采样
      let finalSamples = samples;

      if (audioBuffer.sampleRate !== targetSampleRate) {
        // 简单的线性插值重采样
        const ratio = targetSampleRate / audioBuffer.sampleRate;
        const outputLength = Math.floor(samples.length * ratio);
        const resampled = new Float32Array(outputLength);

        for (let i = 0; i < outputLength; i++) {
          const srcIndex = i / ratio;
          const srcIndexFloor = Math.floor(srcIndex);
          const srcIndexCeil = Math.min(srcIndexFloor + 1, samples.length - 1);
          const t = srcIndex - srcIndexFloor;

          resampled[i] =
            samples[srcIndexFloor] * (1 - t) + samples[srcIndexCeil] * t;
        }
        finalSamples = resampled;
      }

      // 关闭 AudioContext
      await audioContext.close();

      // 创建 WAV Blob
      return createWavBlob(finalSamples, targetSampleRate);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("音频转换失败:", error);
      throw error;
    }
  };

  // 将 Float32Array 转换为 WAV Blob
  const createWavBlob = (samples: Float32Array, sampleRate: number): Blob => {
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV 文件头
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    // 写入音频数据
    let offset = 44;

    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7fff;

      view.setInt16(offset, val, true);
      offset += 2;
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  const handleGenerate = async () => {
    if (!textToSpeak.trim()) return;

    // 如果选择样本音源，必须提供音频
    if (voiceMode.type === "sample" && !referenceAudio) {
      return;
    }

    // 如果选择自行录音，必须提供音频
    if (voiceMode.type === "record" && !referenceAudio) {
      return;
    }

    setIsGenerating(true);
    setIsStreaming(false);
    setResultAudioUrl(null);
    setAnalyserData({ timeDomain: null, frequency: null });

    try {
      const formData = new FormData();

      formData.append("text", textToSpeak);

      // 样本音源或自行录音模式时添加参考音频和文本
      if (
        (voiceMode.type === "sample" || voiceMode.type === "record") &&
        referenceAudio
      ) {
        // 转换为 WAV 格式（16kHz 采样率）
        const wavBlob = await convertToWav(referenceAudio, 16000);

        formData.append("referenceAudio", wavBlob, "reference.wav");
        formData.append(
          "referenceText",
          referenceText.trim() || DEFAULT_REFERENCE_TEXT,
        );
      }

      const response = await fetch("/api/voice-convert", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // 流式播放音频并获取完整数据
        const audioData = await playStreamingAudio(
          response,
          24000,
          (bytesReceived) => {
            // eslint-disable-next-line no-console
            console.log(`📊 Received ${bytesReceived} bytes`);
          },
          undefined,
          (timeDomain, frequency) => {
            // 实时更新分析器数据
            setAnalyserData({ timeDomain, frequency });
          },
          () => {
            // 缓冲完成，开始播放
            setIsStreaming(true);
            addToast({
              title: "开始播放语音",
              description: "正在实时生成并播放语音",
              color: "success",
            });
          },
          1.0,
        );

        // 生成完整的 WAV 文件
        const wavBlob = createWavBlob(audioData, 24000);
        const audioUrl = URL.createObjectURL(wavBlob);

        setResultAudioUrl(audioUrl);
        setIsStreaming(false);

        addToast({
          title: "转换完成",
          description: "语音生成完毕",
          color: "success",
        });
      } else {
        const error = await response.text();

        // eslint-disable-next-line no-console
        console.error("语音生成失败:", error);
        addToast({
          title: "语音生成失败",
          description: "请检查输入内容或稍后重试",
          color: "danger",
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("请求失败:", error);
      addToast({
        title: "请求失败",
        description: "请检查网络连接或服务器状态",
        color: "danger",
      });
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  const canGenerate =
    textToSpeak.trim() !== "" &&
    (voiceMode.type === "default" ||
      (voiceMode.type === "sample" && referenceAudio !== null) ||
      (voiceMode.type === "record" && referenceAudio !== null));

  // 下载生成的音频
  const handleDownload = () => {
    if (!resultAudioUrl) return;

    const a = document.createElement("a");

    a.href = resultAudioUrl;
    a.download = `voice-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 下载录音样本
  const handleDownloadRecording = () => {
    if (!referenceAudioUrl) return;

    const a = document.createElement("a");

    a.href = referenceAudioUrl;
    a.download = `recording-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title()}>嘴替机器人</h1>
        <p className="mt-4 text-default-600">输入文字，转换语音</p>
      </div>

      {/* 第一步：输入要说的文字 */}
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">第一步：输入内容</h2>
          <p className="text-sm text-default-500">
            请输入中文文字内容（当前服务仅支持中文）
          </p>
        </CardHeader>
        <CardBody suppressHydrationWarning className="gap-3">
          <Textarea
            isClearable
            description={`已输入 ${textToSpeak.length} 字`}
            label="要说的内容（中文）"
            minRows={4}
            placeholder="请在这里输入中文内容，例如：大家好，今天天气真不错..."
            value={textToSpeak}
            onValueChange={setTextToSpeak}
          />
        </CardBody>
      </Card>

      {/* 第二步：选择声音模式 */}
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">第二步：选择声音</h2>
        </CardHeader>
        <CardBody className="gap-4">
          {loadingSamples ? (
            <div className="flex items-center justify-center py-8">
              <Spinner color="danger" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 默认声音卡片 */}
              <Card
                className={`cursor-pointer transition-all ${
                  voiceMode.type === "default"
                    ? "border-2 border-danger bg-danger-50"
                    : "border-2 border-transparent hover:border-default-300"
                }`}
              >
                <CardBody className="gap-2" onClick={handleSelectDefault}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        voiceMode.type === "default"
                          ? "border-danger bg-danger"
                          : "border-default-300"
                      }`}
                    >
                      {voiceMode.type === "default" && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <h3 className="text-base font-semibold">默认声音</h3>
                  </div>
                  <p className="text-sm text-default-500">
                    使用系统预设的默认声音
                  </p>
                </CardBody>
              </Card>

              {/* 自行录音卡片 */}
              <Card
                className={`cursor-pointer transition-all ${
                  voiceMode.type === "record"
                    ? "border-2 border-danger bg-danger-50"
                    : "border-2 border-transparent hover:border-default-300"
                }`}
              >
                <CardBody className="gap-2" onClick={handleSelectRecord}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        voiceMode.type === "record"
                          ? "border-danger bg-danger"
                          : "border-default-300"
                      }`}
                    >
                      {voiceMode.type === "record" && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <h3 className="text-base font-semibold">自行录音</h3>
                  </div>
                  <p className="text-sm text-default-500">
                    录制你自己的声音样本
                  </p>
                </CardBody>
              </Card>

              {/* 样本文件卡片 */}
              {sampleFiles.map((file) => (
                <Card
                  key={file.path}
                  className={`cursor-pointer transition-all ${
                    voiceMode.type === "sample" &&
                    voiceMode.file.path === file.path
                      ? "border-2 border-danger bg-danger-50"
                      : "border-2 border-transparent hover:border-default-300"
                  }`}
                >
                  <CardBody
                    className="gap-2"
                    onClick={() => handleSelectSample(file)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            voiceMode.type === "sample" &&
                            voiceMode.file.path === file.path
                              ? "border-danger bg-danger"
                              : "border-default-300"
                          }`}
                        >
                          {voiceMode.type === "sample" &&
                            voiceMode.file.path === file.path && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                        </div>
                        <h3 className="text-base font-semibold">
                          {file.displayName}
                        </h3>
                      </div>
                      <button
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                          playingSample === file.path
                            ? "bg-danger text-white hover:bg-danger-600"
                            : "bg-default-100 text-default-600 hover:bg-default-200"
                        }`}
                        type="button"
                        onClick={(e) => handlePlaySample(file, e)}
                      >
                        {playingSample === file.path ? (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {file.description && (
                      <p className="text-sm text-default-500">
                        {file.description}
                      </p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {/* 自行录音模式的额外输入 */}
          {voiceMode.type === "record" && (
            <div className="flex flex-col gap-4 mt-2">
              <div>
                <p className="mb-2 text-sm text-default-500">
                  录制你的声音样本
                </p>
                <div className="mb-3 flex flex-col gap-1">
                  <p className="text-xs text-default-400">
                    ⏱️ 建议录制 3-5 秒的音频以获得最佳效果
                  </p>
                  <p className="text-xs text-default-400">
                    💡 您的录音将用于生成语音，处理完成后不会被永久保存
                  </p>
                </div>
                <VoiceRecorder onRecorded={handleReferenceRecorded} />
                {referenceAudio && referenceAudioUrl && (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-success">✓ 声音已录制</p>
                      <Button
                        color="default"
                        size="sm"
                        variant="flat"
                        onPress={() => {
                          setReferenceAudio(null);
                          setReferenceText("");
                        }}
                      >
                        清除
                      </Button>
                    </div>
                    <WaveformPlayer
                      src={referenceAudioUrl}
                      onDownload={handleDownloadRecording}
                    />
                  </div>
                )}
              </div>

              <div suppressHydrationWarning>
                <Textarea
                  isClearable
                  description="⚠️ 录音时请朗读此处填写的文本内容，确保录音与文本完全一致"
                  label="声音样本的文字内容"
                  minRows={3}
                  placeholder="大家好，今天天气真不错，心情也很愉快。"
                  value={referenceText}
                  onValueChange={setReferenceText}
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 生成按钮 */}
      <div className="w-full max-w-2xl flex flex-col gap-2">
        <Button
          className="w-full"
          color="danger"
          isDisabled={!canGenerate || isGenerating}
          isLoading={isGenerating}
          size="lg"
          onPress={handleGenerate}
        >
          {isGenerating ? "正在转换" : resultAudioUrl ? "重新转换" : "转换语音"}
        </Button>
        {!canGenerate && !isGenerating && (
          <p className="text-xs text-default-400 text-center">
            {voiceMode.type === "sample" && !referenceAudio
              ? "请选择样本音源"
              : voiceMode.type === "record" && !referenceAudio
                ? "请先录制声音样本"
                : !textToSpeak.trim()
                  ? "请先输入要说的内容"
                  : ""}
          </p>
        )}
      </div>

      {/* 播放状态和控件 */}
      {(isGenerating || isStreaming || resultAudioUrl) && (
        <Card className="w-full max-w-2xl">
          <CardBody className="gap-4">
            {isGenerating && !isStreaming ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Spinner color="danger" size="lg" />
                <div className="flex flex-col items-center gap-2">
                  <p className="text-default-500 font-medium">
                    正在连接服务器...
                  </p>
                  <p className="text-xs text-default-400">
                    ⏳ 准备开始生成语音
                  </p>
                </div>
              </div>
            ) : isStreaming ? (
              <LiveAudioVisualizer
                frequencyData={analyserData.frequency}
                isPlaying={true}
                timeDomainData={analyserData.timeDomain}
              />
            ) : resultAudioUrl ? (
              <WaveformPlayer
                src={resultAudioUrl}
                onDownload={handleDownload}
              />
            ) : null}
          </CardBody>
        </Card>
      )}
    </section>
  );
}
