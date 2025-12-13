"use client";

import { Card, CardBody } from "@heroui/card";
import { useRef, useState } from "react";

import { VideoLyricsOverlay } from "@/components/video-lyrics-overlay";

export default function RazePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showEndAnimation, setShowEndAnimation] = useState(false);

  const handleVideoEnd = () => {
    setShowEndAnimation(true);
  };

  const handleAnimationEnd = () => {
    setShowEndAnimation(false);
  };

  return (
    <section className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-5xl">
        <Card className="overflow-hidden">
          <CardBody className="p-0 flex items-center justify-center relative">
            <video
              ref={videoRef}
              className="w-full h-auto"
              controls
              preload="metadata"
              poster="/video/cover.jpg"
              onEnded={handleVideoEnd}
            >
              <source src="/video/Chainsaw-Man-RezeDance.mp4" type="video/mp4" />
              您的浏览器不支持视频播放。
            </video>
            <VideoLyricsOverlay
              videoRef={videoRef}
              lrcPath="/video/IRIS OUT - segment.lrc"
            />
          </CardBody>
        </Card>
      </div>

      {showEndAnimation && (
        <div
          className="fixed inset-0 pointer-events-none z-50 flex items-end justify-center overflow-hidden"
          onAnimationEnd={handleAnimationEnd}
        >
          <img
            src="/video/end.webp"
            alt="End animation"
            className="w-auto h-auto max-w-full animate-rise-up"
          />
        </div>
      )}

      <style jsx>{`
        @keyframes rise-up {
          from {
            transform: translateY(100vh);
          }
          to {
            transform: translateY(-100vh);
          }
        }

        .animate-rise-up {
          animation: rise-up 3s linear forwards;
        }
      `}</style>
    </section>
  );
}
