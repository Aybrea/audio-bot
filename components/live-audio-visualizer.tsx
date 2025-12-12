"use client";

import { useRef, useEffect, useState } from "react";

interface LiveAudioVisualizerProps {
  timeDomainData: Uint8Array | null;
  frequencyData: Uint8Array | null;
  isPlaying: boolean;
}

export function LiveAudioVisualizer({
  timeDomainData,
  frequencyData,
  isPlaying,
}: LiveAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizationType] = useState<"frequency" | "waveform">("frequency");

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // 设置 canvas 尺寸
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 绘制背景
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (!isPlaying || !frequencyData || !timeDomainData) {
      // 显示等待状态
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        isPlaying ? "正在播放..." : "等待播放",
        rect.width / 2,
        rect.height / 2,
      );

      return;
    }

    if (visualizationType === "frequency") {
      // 绘制频谱（类似均衡器）
      const barCount = 64; // 显示的柱子数量
      const barWidth = rect.width / barCount;
      const dataStep = Math.floor(frequencyData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        // 获取这个频段的平均值
        let sum = 0;

        for (let j = 0; j < dataStep; j++) {
          sum += frequencyData[i * dataStep + j];
        }
        const average = sum / dataStep;

        // 计算柱子高度（0-255 映射到 0-height）
        const barHeight = (average / 255) * rect.height;

        // 创建渐变色
        const gradient = ctx.createLinearGradient(
          0,
          rect.height - barHeight,
          0,
          rect.height,
        );

        gradient.addColorStop(0, "#f43f5e");
        gradient.addColorStop(0.5, "#fb7185");
        gradient.addColorStop(1, "#fda4af");

        ctx.fillStyle = gradient;

        // 绘制柱子
        const x = i * barWidth;
        const y = rect.height - barHeight;

        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }
    } else {
      // 绘制波形
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = rect.width / timeDomainData.length;
      let x = 0;

      for (let i = 0; i < timeDomainData.length; i++) {
        const v = timeDomainData[i] / 128.0;
        const y = (v * rect.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(rect.width, rect.height / 2);
      ctx.stroke();
    }
  }, [timeDomainData, frequencyData, isPlaying, visualizationType]);

  return (
    <div className="flex flex-col gap-3 bg-default-100 rounded-lg">
      <canvas
        ref={canvasRef}
        className="w-full h-20 rounded"
        style={{ width: "100%", height: "80px" }}
      />
    </div>
  );
}
