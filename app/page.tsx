"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Radio, RadioGroup } from "@heroui/radio";
import { Spinner } from "@heroui/spinner";
import { Textarea } from "@heroui/input";
import { addToast } from "@heroui/toast";

import { title } from "@/components/primitives";
import { VoiceRecorder } from "@/components/voice-recorder";
import { WaveformPlayer } from "@/components/waveform-player";
import { StreamingWaveform } from "@/components/streaming-waveform";
import { playStreamingAudio } from "@/lib/streaming-audio-player";

export default function Home() {
  const [textToSpeak, setTextToSpeak] = useState(
    "阳光透过稠密的枝叶洒落下来，那一片宁静的森林仿佛被金色丝线所包围。清风拂过，满眼绿意化作层层涟漪，在心头荡漾。",
  );
  const [voiceMode, setVoiceMode] = useState<"default" | "custom">("default");
  const [referenceAudio, setReferenceAudio] = useState<Blob | null>(null);
  const [referenceText, setReferenceText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null);
  const [streamingChunks, setStreamingChunks] = useState<Float32Array[]>([]);

  const handleReferenceRecorded = (blob: Blob) => {
    setReferenceAudio(blob);
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

    // 如果选择自定义声音，必须提供音频和转录文本
    if (voiceMode === "custom" && (!referenceAudio || !referenceText.trim())) {
      return;
    }

    setIsGenerating(true);
    setIsStreaming(false);
    setResultAudioUrl(null);
    setStreamingChunks([]);

    try {
      const formData = new FormData();

      formData.append("text", textToSpeak);

      // 只有选择自定义声音时才添加参考音频和文本
      if (voiceMode === "custom" && referenceAudio && referenceText.trim()) {
        formData.append("referenceAudio", referenceAudio);
        formData.append("referenceText", referenceText);
      }

      const response = await fetch("/api/voice-convert", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // 开始流式播放
        setIsStreaming(true);
        addToast({
          title: "开始播放语音",
          description: "正在实时生成并播放语音",
          color: "success",
        });

        // 流式播放音频并获取完整数据
        const audioData = await playStreamingAudio(
          response,
          24000,
          (bytesReceived) => {
            // eslint-disable-next-line no-console
            console.log(`📊 Received ${bytesReceived} bytes`);
          },
          (chunk) => {
            // 实时更新波形数据
            setStreamingChunks((prev) => [...prev, chunk]);
          },
        );

        // 生成完整的 WAV 文件
        const wavBlob = createWavBlob(audioData, 24000);
        const audioUrl = URL.createObjectURL(wavBlob);

        setResultAudioUrl(audioUrl);
        setIsStreaming(false);

        addToast({
          title: "播放完成",
          description: "可以使用下方控件重新播放",
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
    (voiceMode === "default" ||
      (referenceAudio !== null && referenceText.trim() !== ""));

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title()}>嘴替机器人</h1>
        <p className="mt-4 text-default-600">输入文字，转换为语音</p>
      </div>

      {/* 第一步：输入要说的文字 */}
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">第一步：输入要说的内容</h2>
          <p className="text-sm text-default-500">
            请输入中文文字内容（当前服务仅支持中文）
          </p>
        </CardHeader>
        <CardBody className="gap-3">
          <Textarea
            label="要说的内容（中文）"
            minRows={4}
            placeholder="请在这里输入中文内容，例如：大家好，今天天气真不错..."
            value={textToSpeak}
            onValueChange={setTextToSpeak}
          />
        </CardBody>
      </Card>

      {/* 第二步：选择声音模式（可选） */}
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">第二步：选择声音（可选）</h2>
          <p className="text-sm text-default-500">
            使用默认声音或上传自定义声音样本
          </p>
        </CardHeader>
        <CardBody className="gap-4">
          <RadioGroup
            value={voiceMode}
            onValueChange={(value) =>
              setVoiceMode(value as "default" | "custom")
            }
          >
            <Radio value="default">使用默认声音</Radio>
            <Radio isDisabled value="custom">
              使用自定义声音（暂不可用）
            </Radio>
          </RadioGroup>

          {voiceMode === "custom" && (
            <div className="ml-6 flex flex-col gap-4">
              <div>
                <p className="mb-2 text-sm text-default-500">
                  录制你的声音样本
                </p>
                <VoiceRecorder onRecorded={handleReferenceRecorded} />
                {referenceAudio && (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-sm text-success">✓ 声音样本已录制</p>
                    <Button
                      color="default"
                      size="sm"
                      variant="flat"
                      onPress={() => setReferenceAudio(null)}
                    >
                      重新录制
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Textarea
                  label="声音样本的文字内容"
                  minRows={3}
                  placeholder="输入你在声音样本中说的话..."
                  value={referenceText}
                  onValueChange={setReferenceText}
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 生成按钮 */}
      <Button
        className="w-full max-w-2xl"
        color="danger"
        isDisabled={!canGenerate || isGenerating}
        isLoading={isGenerating}
        size="lg"
        onPress={handleGenerate}
      >
        {isGenerating ? "正在转换" : resultAudioUrl ? "重新转换" : "转换语音"}
      </Button>

      {/* 播放状态和控件 */}
      {(isGenerating || isStreaming || resultAudioUrl) && (
        <Card className="w-full max-w-2xl">
          {(isGenerating || isStreaming) && (
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {isGenerating && !isStreaming ? "正在连接" : "正在播放"}
              </h2>
            </CardHeader>
          )}
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
              <StreamingWaveform audioData={streamingChunks} isPlaying={true} />
            ) : resultAudioUrl ? (
              <WaveformPlayer src={resultAudioUrl} />
            ) : null}
          </CardBody>
        </Card>
      )}
    </section>
  );
}
