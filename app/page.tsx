"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";

import { title } from "@/components/primitives";
import { VoiceRecorder } from "@/components/voice-recorder";
import { AudioPlayer } from "@/components/audio-player";

export default function Home() {
  const [complaint, setComplaint] = useState("");
  const [roastText, setRoastText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voiceSample, setVoiceSample] = useState<Blob | null>(null);

  const handleVoiceRecorded = (blob: Blob) => {
    setVoiceSample(blob);
  };

  const handleGenerate = async () => {
    if (!complaint.trim()) return;

    setIsGenerating(true);
    setRoastText("");
    setAudioUrl(null);

    try {
      // 调用AI生成吐槽内容
      const roastResponse = await fetch("/api/generate-roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint }),
      });

      if (!roastResponse.ok) throw new Error("生成吐槽失败");

      const { roast } = await roastResponse.json();

      setRoastText(roast);

      // 调用TTS生成语音
      if (voiceSample) {
        const formData = new FormData();

        formData.append("text", roast);
        formData.append("voiceSample", voiceSample);

        const ttsResponse = await fetch("/api/text-to-speech", {
          method: "POST",
          body: formData,
        });

        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();

          setAudioUrl(URL.createObjectURL(audioBlob));
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("生成失败:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title()}>嘴替机器人</h1>
        <p className="mt-4 text-default-600">
          说出你想吐槽的事情，让AI用你的声音帮你骂出来
        </p>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">第一步：录制你的声音</h2>
          <p className="text-sm text-default-500">
            录制一段你的声音样本，用于克隆你的声音
          </p>
        </CardHeader>
        <CardBody>
          <VoiceRecorder onRecorded={handleVoiceRecorded} />
          {voiceSample && (
            <p className="mt-2 text-sm text-success">声音样本已录制</p>
          )}
        </CardBody>
      </Card>

      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">第二步：说出你的槽点</h2>
          <p className="text-sm text-default-500">
            描述你想吐槽的事情，越详细越好
          </p>
        </CardHeader>
        <CardBody className="gap-4">
          <Textarea
            minRows={4}
            placeholder="比如：今天老板又让我加班到凌晨，还说这是为我好..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
          />
          <Button
            color="danger"
            isDisabled={!complaint.trim() || isGenerating}
            isLoading={isGenerating}
            size="lg"
            onPress={handleGenerate}
          >
            {isGenerating ? "正在生成国粹..." : "开骂！"}
          </Button>
        </CardBody>
      </Card>

      {(roastText || isGenerating) && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <h2 className="text-lg font-semibold">吐槽结果</h2>
          </CardHeader>
          <CardBody className="gap-4">
            {isGenerating ? (
              <div className="flex justify-center py-8">
                <Spinner color="danger" size="lg" />
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-lg">{roastText}</p>
                {audioUrl && <AudioPlayer src={audioUrl} />}
              </>
            )}
          </CardBody>
        </Card>
      )}
    </section>
  );
}
