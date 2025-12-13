"use client";

import type { Board, Piece } from "@/types/tetris";

import { RefObject, useEffect, useState } from "react";

import { getPieceShape } from "@/lib/tetris-pieces";
import { getGhostPieceY } from "@/lib/tetris-collision";

interface TetrisBoardProps {
  board: Board;
  currentPiece: Piece | null;
  canvasRef: RefObject<HTMLCanvasElement>;
}

function getCellSize(): number {
  if (typeof window === "undefined") return 30;

  const width = window.innerWidth;

  // Mobile: smaller cells to fit screen
  if (width < 640) return Math.min(Math.floor((width - 48) / 10), 28);
  // Tablet: medium cells
  if (width < 1024) return 26;

  // Desktop: full size
  return 30;
}

export function TetrisBoard({
  board,
  currentPiece,
  canvasRef,
}: TetrisBoardProps) {
  const [cellSize, setCellSize] = useState(getCellSize);

  useEffect(() => {
    const handleResize = () => setCellSize(getCellSize());

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const BOARD_WIDTH = 10 * cellSize;
    const BOARD_HEIGHT = 20 * cellSize;

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;

    canvas.width = BOARD_WIDTH * dpr;
    canvas.height = BOARD_HEIGHT * dpr;
    canvas.style.width = `${BOARD_WIDTH}px`;
    canvas.style.height = `${BOARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = "#0f172a"; // slate-900 (dark background)
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Draw grid lines
    ctx.strokeStyle = "#1e293b"; // slate-800
    ctx.lineWidth = 1;

    for (let x = 0; x <= 10; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, BOARD_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y <= 20; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(BOARD_WIDTH, y * cellSize);
      ctx.stroke();
    }

    // Draw locked pieces on board
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          drawCell(ctx, x, y, cell, cellSize);
        }
      });
    });

    // Draw ghost piece (drop preview)
    if (currentPiece) {
      const ghostY = getGhostPieceY(board, currentPiece);

      drawPiece(ctx, currentPiece, ghostY, 0.2, cellSize); // Semi-transparent
    }

    // Draw current piece
    if (currentPiece) {
      drawPiece(ctx, currentPiece, currentPiece.y, 1.0, cellSize);
    }
  }, [board, currentPiece, canvasRef, cellSize]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Tetris game board"
      className="rounded-lg shadow-2xl border-2 border-danger"
    />
  );
}

// Draw a single cell with gradient
function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  cellSize: number,
) {
  // Create gradient for depth effect
  const gradient = ctx.createLinearGradient(
    x * cellSize,
    y * cellSize,
    (x + 1) * cellSize,
    (y + 1) * cellSize,
  );

  gradient.addColorStop(0, color);
  gradient.addColorStop(1, adjustBrightness(color, -20));

  ctx.fillStyle = gradient;
  ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);

  // Add highlight for 3D effect
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, 4);
}

// Draw a piece at a specific Y position with opacity
function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  y: number,
  opacity: number,
  cellSize: number,
) {
  const shape = getPieceShape(piece.type, piece.rotation);

  ctx.globalAlpha = opacity;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const cellX = piece.x + col;
        const cellY = y + row;

        if (cellY >= 0 && cellY < 20 && cellX >= 0 && cellX < 10) {
          drawCell(ctx, cellX, cellY, piece.color, cellSize);
        }
      }
    }
  }

  ctx.globalAlpha = 1.0;
}

// Adjust color brightness
function adjustBrightness(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
