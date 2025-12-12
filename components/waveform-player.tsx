"use client";

import { useRef, useState, useEffect } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { Button } from "@heroui/button";

interface WaveformPlayerProps {
  src: string;
  autoPlay?: boolean;
}

export function WaveformPlayer({ src, autoPlay = false }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { wavesurfer, isReady } = useWavesurfer({
    container: containerRef,
    url: src,
    waveColor: "#f43f5e",
    progressColor: "#be123c",
    cursorColor: "#be123c",
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    height: 80,
    normalize: true,
    backend: "WebAudio",
  });

  useEffect(() => {
    if (!wavesurfer) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = (time: number) => setCurrentTime(time);
    const handleReady = () => {
      setDuration(wavesurfer.getDuration());
      if (autoPlay) {
        wavesurfer.play();
      }
    };

    wavesurfer.on("play", handlePlay);
    wavesurfer.on("pause", handlePause);
    wavesurfer.on("timeupdate", handleTimeUpdate);
    wavesurfer.on("ready", handleReady);

    return () => {
      wavesurfer.un("play", handlePlay);
      wavesurfer.un("pause", handlePause);
      wavesurfer.un("timeupdate", handleTimeUpdate);
      wavesurfer.un("ready", handleReady);
    };
  }, [wavesurfer, autoPlay]);

  const togglePlay = () => {
    if (wavesurfer) {
      wavesurfer.playPause();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-default-100 rounded-lg">
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          color="danger"
          isDisabled={!isReady}
          radius="full"
          size="lg"
          variant="flat"
          onPress={togglePlay}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </Button>
        <span className="text-sm text-default-500 min-w-[80px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
