"use client";

import type { TetrominoType } from "@/types/tetris";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { useEffect, useRef, useState } from "react";

import { getPieceColor, getPieceShape } from "@/lib/tetris-pieces";

interface TetrisNextPieceProps {
  nextPiece: TetrominoType;
}

function getPreviewCellSize(): number {
  if (typeof window === "undefined") return 20;

  const width = window.innerWidth;

  // Mobile: smaller preview
  if (width < 640) return 16;
  // Tablet: medium preview
  if (width < 1024) return 18;

  // Desktop: full size
  return 20;
}

export function TetrisNextPiece({ nextPiece }: TetrisNextPieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellSize, setCellSize] = useState(getPreviewCellSize);

  useEffect(() => {
    const handleResize = () => setCellSize(getPreviewCellSize());

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const PREVIEW_SIZE = 4 * cellSize;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    canvas.width = PREVIEW_SIZE * dpr;
    canvas.height = PREVIEW_SIZE * dpr;
    canvas.style.width = `${PREVIEW_SIZE}px`;
    canvas.style.height = `${PREVIEW_SIZE}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = "#0f172a"; // slate-900
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    // Get piece shape and color
    const shape = getPieceShape(nextPiece, 0);
    const color = getPieceColor(nextPiece);

    // Calculate centering offset
    const pieceWidth = shape[0].length;
    const pieceHeight = shape.length;
    const offsetX = (4 - pieceWidth) / 2;
    const offsetY = (4 - pieceHeight) / 2;

    // Draw piece
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = (offsetX + col) * cellSize;
          const y = (offsetY + row) * cellSize;

          // Create gradient
          const gradient = ctx.createLinearGradient(
            x,
            y,
            x + cellSize,
            y + cellSize,
          );

          gradient.addColorStop(0, color);
          gradient.addColorStop(1, adjustBrightness(color, -20));

          ctx.fillStyle = gradient;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

          // Add highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fillRect(x + 2, y + 2, cellSize - 4, 3);
        }
      }
    }
  }, [nextPiece, cellSize]);

  return (
    <Card className="w-full md:w-64">
      <CardHeader>
        <h3 className="text-lg font-semibold">Next Piece</h3>
      </CardHeader>
      <CardBody className="flex items-center justify-center">
        <canvas
          ref={canvasRef}
          aria-label="Next tetromino piece preview"
          className="rounded border border-default-200"
        />
      </CardBody>
    </Card>
  );
}

// Adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
