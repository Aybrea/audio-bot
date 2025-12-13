"use client";

import { useEffect, useRef } from "react";
import type { Bird, Pipe } from "@/types/flappy";
import { getBirdRotation } from "@/lib/flappy-physics";
import { GROUND_HEIGHT } from "@/lib/flappy-engine";

interface FlappyCanvasProps {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function FlappyCanvas({
  bird,
  pipes,
  score,
  canvasWidth,
  canvasHeight,
}: FlappyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw background
    drawBackground(ctx, canvasWidth, canvasHeight);

    // Draw pipes
    pipes.forEach((pipe) => drawPipe(ctx, pipe, canvasHeight));

    // Draw ground
    drawGround(ctx, canvasWidth, canvasHeight);

    // Draw bird
    drawBird(ctx, bird);

    // Draw score
    drawScore(ctx, score, canvasWidth);
  }, [bird, pipes, score, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="border-2 border-default-200 rounded-lg shadow-lg"
    />
  );
}

// Draw background gradient
function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);

  gradient.addColorStop(0, "#87CEEB"); // Light blue
  gradient.addColorStop(1, "#4A90E2"); // Darker blue

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// Draw ground
function drawGround(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const groundY = height - GROUND_HEIGHT;

  // Ground rectangle
  const gradient = ctx.createLinearGradient(0, groundY, 0, height);

  gradient.addColorStop(0, "#8B4513"); // Brown
  gradient.addColorStop(1, "#654321"); // Darker brown

  ctx.fillStyle = gradient;
  ctx.fillRect(0, groundY, width, GROUND_HEIGHT);

  // Ground border
  ctx.strokeStyle = "#4A2511";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();
}

// Draw pipe (top and bottom segments)
function drawPipe(
  ctx: CanvasRenderingContext2D,
  pipe: Pipe,
  canvasHeight: number,
) {
  const gapTop = pipe.gapY - pipe.gapHeight / 2;
  const gapBottom = pipe.gapY + pipe.gapHeight / 2;
  const groundY = canvasHeight - GROUND_HEIGHT;

  // Pipe gradient
  const gradient = ctx.createLinearGradient(
    pipe.x,
    0,
    pipe.x + pipe.width,
    0,
  );

  gradient.addColorStop(0, "#2ECC71"); // Green
  gradient.addColorStop(0.5, "#27AE60"); // Darker green
  gradient.addColorStop(1, "#2ECC71"); // Green

  // Top pipe
  ctx.fillStyle = gradient;
  ctx.fillRect(pipe.x, 0, pipe.width, gapTop);

  // Top pipe border
  ctx.strokeStyle = "#1E8449";
  ctx.lineWidth = 2;
  ctx.strokeRect(pipe.x, 0, pipe.width, gapTop);

  // Bottom pipe
  ctx.fillStyle = gradient;
  ctx.fillRect(pipe.x, gapBottom, pipe.width, groundY - gapBottom);

  // Bottom pipe border
  ctx.strokeStyle = "#1E8449";
  ctx.lineWidth = 2;
  ctx.strokeRect(pipe.x, gapBottom, pipe.width, groundY - gapBottom);
}

// Draw bird
function drawBird(ctx: CanvasRenderingContext2D, bird: Bird) {
  ctx.save();

  // Translate to bird position
  ctx.translate(bird.x, bird.y);

  // Rotate based on velocity
  const rotation = getBirdRotation(bird.velocity);

  ctx.rotate((rotation * Math.PI) / 180);

  // Bird gradient
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bird.radius);

  gradient.addColorStop(0, "#FFD700"); // Gold
  gradient.addColorStop(0.7, "#FFA500"); // Orange
  gradient.addColorStop(1, "#FF8C00"); // Dark orange

  // Draw bird circle
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  // Bird border
  ctx.strokeStyle = "#FF6347";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw eye
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(bird.radius / 3, -bird.radius / 3, bird.radius / 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw score
function drawScore(
  ctx: CanvasRenderingContext2D,
  score: number,
  width: number,
) {
  ctx.fillStyle = "#FFF";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Draw text with stroke for better visibility
  ctx.strokeText(score.toString(), width / 2, 30);
  ctx.fillText(score.toString(), width / 2, 30);
}
