import type { Board, Piece } from "@/types/tetris";

import { getPieceShape } from "./tetris-pieces";

// Check if a piece position is valid (within bounds and no collisions)
export function isValidPosition(
  board: Board,
  piece: Piece,
  x: number,
  y: number,
  rotation: 0 | 1 | 2 | 3,
): boolean {
  const shape = getPieceShape(piece.type, rotation);

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;

        // Check boundaries
        if (newX < 0 || newX >= 10 || newY >= 20) {
          return false;
        }

        // Check collision with existing pieces (but allow negative Y for spawning)
        if (newY >= 0 && board[newY][newX]) {
          return false;
        }
      }
    }
  }

  return true;
}

// Check if current piece collides with board
export function checkCollision(board: Board, piece: Piece): boolean {
  return !isValidPosition(board, piece, piece.x, piece.y, piece.rotation);
}

// Calculate the Y position where the piece would land (for ghost piece preview)
export function getGhostPieceY(board: Board, piece: Piece): number {
  let ghostY = piece.y;

  while (isValidPosition(board, piece, piece.x, ghostY + 1, piece.rotation)) {
    ghostY++;
  }

  return ghostY;
}

// Wall kick offsets for rotation (Super Rotation System - SRS)
const WALL_KICK_OFFSETS: Record<string, Array<[number, number]>> = {
  // I piece has special wall kicks
  I: [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 0],
    [2, 0],
  ],
  // Other pieces use standard wall kicks
  default: [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
};

// Try to rotate piece with wall kicks
export function wallKick(
  board: Board,
  piece: Piece,
  newRotation: 0 | 1 | 2 | 3,
): { x: number; y: number } | null {
  const offsets =
    piece.type === "I" ? WALL_KICK_OFFSETS.I : WALL_KICK_OFFSETS.default;

  // Try each wall kick offset
  for (const [offsetX, offsetY] of offsets) {
    const newX = piece.x + offsetX;
    const newY = piece.y + offsetY;

    if (isValidPosition(board, piece, newX, newY, newRotation)) {
      return { x: newX, y: newY };
    }
  }

  return null;
}
