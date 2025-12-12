"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Radio, RadioGroup } from "@heroui/radio";
import { Spinner } from "@heroui/spinner";
import { Textarea } from "@heroui/input";

import { title } from "@/components/primitives";
import { VoiceRecorder } from "@/components/voice-recorder";
import { AudioPlayer } from "@/components/audio-player";

export default function Home() {
  const [textToSpeak, setTextToSpeak] = useState(
    "大家好，我是一个语音合成测试机器人。今天天气真不错，适合出去走走。希望这段测试文本能够帮助你验证服务是否正常工作。",
  );
  const [voiceMode, setVoiceMode] = useState<"default" | "custom">("default");
  const [referenceAudio, setReferenceAudio] = useState<Blob | null>(null);
  const [referenceText, setReferenceText] = useState("");
  const [resultAudioUrl, setResultAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleReferenceRecorded = (blob: Blob) => {
    setReferenceAudio(blob);
  };

  const handleGenerate = async () => {
    if (!textToSpeak.trim()) return;

    // 如果选择自定义声音，必须提供音频和转录文本
    if (voiceMode === "custom" && (!referenceAudio || !referenceText.trim())) {
      return;
    }

    setIsGenerating(true);
    setResultAudioUrl(null);

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
        const audioBlob = await response.blob();

        setResultAudioUrl(URL.createObjectURL(audioBlob));
      } else {
        const error = await response.text();

        // eslint-disable-next-line no-console
        console.error("语音生成失败:", error);
        alert("语音生成失败，请重试");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("请求失败:", error);
      alert("请求失败，请检查网络连接");
    } finally {
      setIsGenerating(false);
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
          <p className="text-sm text-default-500">输入你想说的文字内容</p>
        </CardHeader>
        <CardBody className="gap-3">
          <Textarea
            label="要说的内容"
            minRows={4}
            placeholder="在这里输入你想说的话..."
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
            <Radio value="custom">使用自定义声音</Radio>
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
        {isGenerating ? "正在生成语音..." : "生成语音！"}
      </Button>

      {/* 结果展示 */}
      {(resultAudioUrl || isGenerating) && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <h2 className="text-lg font-semibold">生成结果</h2>
          </CardHeader>
          <CardBody className="gap-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Spinner color="danger" size="lg" />
                <p className="text-default-500">正在生成语音，请稍候...</p>
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
