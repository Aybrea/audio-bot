"use client";

import { useRef, useEffect } from "react";

interface StreamingWaveformProps {
  audioData: Float32Array[];
  isPlaying: boolean;
}

export function StreamingWaveform({
  audioData,
  isPlaying,
}: StreamingWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    ctx.fillStyle = "#f43f5e10";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (audioData.length === 0) {
      // 显示等待状态
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("等待音频数据...", rect.width / 2, rect.height / 2);

      return;
    }

    // 合并所有音频数据
    const totalLength = audioData.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;

    for (const chunk of audioData) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // 绘制波形
    const step = Math.ceil(combined.length / rect.width);
    const amp = rect.height / 2;

    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < rect.width; i++) {
      const index = i * step;

      if (index >= combined.length) break;

      // 计算这个区间的最大值
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step && index + j < combined.length; j++) {
        const val = combined[index + j];

        if (val < min) min = val;
        if (val > max) max = val;
      }

      const y1 = (1 + min) * amp;
      const y2 = (1 + max) * amp;

      if (i === 0) {
        ctx.moveTo(i, y1);
      }

      ctx.lineTo(i, y1);
      ctx.lineTo(i, y2);
    }

    ctx.stroke();

    // 绘制中心线
    ctx.strokeStyle = "#94a3b820";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(rect.width, amp);
    ctx.stroke();
  }, [audioData]);

  return (
    <div className="flex flex-col gap-3 p-4 bg-default-100 rounded-lg">
      <div className="flex items-center gap-2">
        {isPlaying && (
          <div className="flex items-center gap-1">
            <div className="w-1 h-4 bg-danger animate-pulse" />
            <div
              className="w-1 h-4 bg-danger animate-pulse"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-1 h-4 bg-danger animate-pulse"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        )}
        <span className="text-sm text-default-500">
          {isPlaying ? "正在播放..." : "等待中..."}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-20 rounded"
        style={{ width: "100%", height: "80px" }}
      />
    </div>
  );
}
