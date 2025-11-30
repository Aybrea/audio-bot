"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Radio, RadioGroup } from "@heroui/radio";

import { title } from "@/components/primitives";
import { VoiceRecorder } from "@/components/voice-recorder";
import { AudioPlayer } from "@/components/audio-player";

export default function Home() {
  const [sourceAudio, setSourceAudio] = useState<Blob | null>(null);
  const [targetAudio, setTargetAudio] = useState<Blob | null>(null);
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [targetMode, setTargetMode] = useState<"preset" | "custom">("preset");
  const [presetVoice, setPresetVoice] = useState("default");

  const handleSourceRecorded = (blob: Blob) => {
    setSourceAudio(blob);
  };

  const handleTargetRecorded = (blob: Blob) => {
    setTargetAudio(blob);
  };

  const handleConvert = async () => {
    if (!sourceAudio) return;

    setIsConverting(true);
    setResultAudioUrl(null);

    try {
      const formData = new FormData();

      formData.append("sourceAudio", sourceAudio);

      // 如果是自定义目标声音，上传目标音频
      if (targetMode === "custom" && targetAudio) {
        formData.append("targetAudio", targetAudio);
      } else {
        // 使用预设声音
        formData.append("presetVoice", presetVoice);
      }

      const response = await fetch("/api/voice-convert", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const audioBlob = await response.blob();

        setResultAudioUrl(URL.createObjectURL(audioBlob));
      } else {
        const error = await response.text();

        // eslint-disable-next-line no-console
        console.error("语音转换失败:", error);
        alert("语音转换失败，请重试");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("请求失败:", error);
      alert("请求失败，请检查网络连接");
    } finally {
      setIsConverting(false);
    }
  };

  const canConvert = sourceAudio && (targetMode === "preset" || targetAudio);

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title()}>嘴替机器人</h1>
        <p className="mt-4 text-default-600">
          录制你的吐槽，用别人的声音说出来
        </p>
      </div>

      {/* 第一步：录制吐槽语音 */}
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">第一步：录制你的吐槽</h2>
          <p className="text-sm text-default-500">
            说出你想吐槽的内容，尽情发挥
          </p>
        </CardHeader>
        <CardBody className="gap-3">
          <VoiceRecorder onRecorded={handleSourceRecorded} />
          {sourceAudio && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-success">✓ 吐槽语音已录制</p>
              <Button
                color="default"
                size="sm"
                variant="flat"
                onPress={() => setSourceAudio(null)}
              >
                重新录制
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 第二步：选择目标声音 */}
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">第二步：选择目标声音</h2>
          <p className="text-sm text-default-500">
            选择你想用谁的声音来说这段话
          </p>
        </CardHeader>
        <CardBody className="gap-4">
          <RadioGroup
            value={targetMode}
            onValueChange={(value) =>
              setTargetMode(value as "preset" | "custom")
            }
          >
            <Radio value="preset">使用预设声音</Radio>
            <Radio value="custom">上传自定义声音</Radio>
          </RadioGroup>

          {targetMode === "preset" && (
            <RadioGroup
              className="ml-6"
              label="选择预设声音"
              value={presetVoice}
              onValueChange={setPresetVoice}
            >
              <Radio value="default">默认声音</Radio>
              <Radio value="male1">男声 1</Radio>
              <Radio value="male2">男声 2</Radio>
              <Radio value="female1">女声 1</Radio>
              <Radio value="female2">女声 2</Radio>
            </RadioGroup>
          )}

          {targetMode === "custom" && (
            <div className="ml-6">
              <p className="mb-2 text-sm text-default-500">
                录制或上传目标声音样本
              </p>
              <VoiceRecorder onRecorded={handleTargetRecorded} />
              {targetAudio && (
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-sm text-success">✓ 目标声音已录制</p>
                  <Button
                    color="default"
                    size="sm"
                    variant="flat"
                    onPress={() => setTargetAudio(null)}
                  >
                    重新录制
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 转换按钮 */}
      <Button
        className="w-full max-w-2xl"
        color="danger"
        isDisabled={!canConvert || isConverting}
        isLoading={isConverting}
        size="lg"
        onPress={handleConvert}
      >
        {isConverting ? "正在转换声音..." : "开始转换！"}
      </Button>

      {/* 结果展示 */}
      {(resultAudioUrl || isConverting) && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <h2 className="text-lg font-semibold">转换结果</h2>
          </CardHeader>
          <CardBody className="gap-4">
            {isConverting ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Spinner color="danger" size="lg" />
                <p className="text-default-500">正在转换声音，请稍候...</p>
              </div>
            ) : resultAudioUrl ? (
              <AudioPlayer src={resultAudioUrl} />
            ) : null}
          </CardBody>
        </Card>
      )}
    </section>
  );
}
