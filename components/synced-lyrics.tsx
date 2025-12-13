"use client";

import { useEffect, useState } from "react";

interface LyricLine {
  time: number;
  lines: string[];
}

interface SyncedLyricsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  lrcPath: string;
}

export function SyncedLyrics({ videoRef, lrcPath }: SyncedLyricsProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);

  // Parse LRC file
  useEffect(() => {
    fetch(lrcPath)
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split("\n");
        const parsedLyrics: Map<number, string[]> = new Map();

        lines.forEach((line) => {
          const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);

          if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const centiseconds = parseInt(match[3]);
            const time = minutes * 60 + seconds + centiseconds / 100;
            const text = match[4];

            if (!parsedLyrics.has(time)) {
              parsedLyrics.set(time, []);
            }
            parsedLyrics.get(time)?.push(text);
          }
        });

        const lyricArray: LyricLine[] = Array.from(parsedLyrics.entries())
          .map(([time, lines]) => ({ time, lines }))
          .sort((a, b) => a.time - b.time);

        setLyrics(lyricArray);
      })
      .catch((err) => console.error("Failed to load lyrics:", err));
  }, [lrcPath]);

  // Sync with video and handle visibility
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      let index = -1;

      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= lyrics[i].time) {
          index = i;
          break;
        }
      }

      setCurrentIndex(index);
    };

    const handlePlay = () => {
      setIsVisible(true);
    };

    const handleEnded = () => {
      setIsVisible(false);
      setCurrentIndex(-1);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("ended", handleEnded);
    };
  }, [videoRef, lyrics]);

  const currentLyric = currentIndex >= 0 ? lyrics[currentIndex] : null;

  if (!isVisible || !currentLyric) {
    return null;
  }

  return (
    <div className="w-full animate-in fade-in duration-500 py-4">
      <div className="text-center space-y-2">
        {currentLyric.lines.map((line, index) => (
          <div
            key={index}
            className={`${
              index === 0
                ? "text-lg md:text-xl font-medium text-primary"
                : "text-sm md:text-base text-default-600"
            }`}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
