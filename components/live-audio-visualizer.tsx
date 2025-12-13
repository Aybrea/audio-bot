"use client";

import { useRef, useEffect, useState, memo } from "react";

interface LiveAudioVisualizerProps {
  timeDomainData: Uint8Array | null;
  frequencyData: Uint8Array | null;
  isPlaying: boolean;
}

export const LiveAudioVisualizer = memo(function LiveAudioVisualizer({
  timeDomainData,
  frequencyData,
  isPlaying,
}: LiveAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizationType] = useState<"frequency" | "waveform">("frequency");
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0, dpr: 1 });

  // 初始化 canvas（只执行一次）
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });

    if (!ctx) return;

    ctxRef.current = ctx;

    // 设置 canvas 尺寸
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    dimensionsRef.current = {
      width: rect.width,
      height: rect.height,
      dpr,
    };
  }, []);

  // 绘制可视化（数据更新时执行）
  useEffect(() => {
    const ctx = ctxRef.current;

    if (!ctx) return;

    const { width, height } = dimensionsRef.current;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    if (!isPlaying || !frequencyData || !timeDomainData) {
      // 显示等待状态
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        isPlaying ? "正在播放..." : "等待播放",
        width / 2,
        height / 2,
      );

      return;
    }

    if (visualizationType === "frequency") {
      // 绘制频谱（类似均衡器）
      const barCount = 64; // 显示的柱子数量
      const barWidth = width / barCount;
      const dataStep = Math.floor(frequencyData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        // 获取这个频段的平均值
        let sum = 0;

        for (let j = 0; j < dataStep; j++) {
          sum += frequencyData[i * dataStep + j];
        }
        const average = sum / dataStep;

        // 计算柱子高度（0-255 映射到 0-height）
        const barHeight = (average / 255) * height;

        // 绘制柱子
        const x = i * barWidth;
        const y = height - barHeight;

        // 创建渐变色（从柱子顶部到底部）
        const gradient = ctx.createLinearGradient(0, y, 0, height);

        gradient.addColorStop(0, "#f43f5e");
        gradient.addColorStop(0.5, "#fb7185");
        gradient.addColorStop(1, "#fda4af");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }
    } else {
      // 绘制波形
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = width / timeDomainData.length;
      let x = 0;

      for (let i = 0; i < timeDomainData.length; i++) {
        const v = timeDomainData[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
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
});
