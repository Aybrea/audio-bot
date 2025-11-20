"use client";

import { useState, useRef } from "react";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";

interface VoiceRecorderProps {
  onRecorded: (blob: Blob) => void;
}

export function VoiceRecorder({ onRecorded }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);

        setAudioUrl(url);
        onRecorded(blob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("无法访问麦克风:", error);
      alert("无法访问麦克风，请检查权限设置");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <Button color="primary" variant="flat" onPress={startRecording}>
            开始录音
          </Button>
        ) : (
          <Button color="danger" variant="flat" onPress={stopRecording}>
            停止录音
          </Button>
        )}
        {isRecording && (
          <span className="text-sm text-default-500">
            录音中... {formatTime(recordingTime)}
          </span>
        )}
      </div>

      {isRecording && (
        <Progress
          isIndeterminate
          aria-label="录音进度"
          className="max-w-md"
          color="danger"
          size="sm"
        />
      )}

      {audioUrl && !isRecording && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-default-500">录音预览:</p>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls className="w-full max-w-md" src={audioUrl} />
        </div>
      )}
    </div>
  );
}
