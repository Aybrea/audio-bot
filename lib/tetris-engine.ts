import type {
  Board,
  GameAction,
  GameState,
  Piece,
  TetrominoType,
} from "@/types/tetris";

import { getPieceColor, getPieceShape, getRandomPiece } from "./tetris-pieces";
import { getGhostPieceY, isValidPosition, wallKick } from "./tetris-collision";

// Create an empty 10x20 board
export function createEmptyBoard(): Board {
  return Array.from({ length: 20 }, () => Array(10).fill(null));
}

// Spawn a new piece at the top center of the board
export function spawnPiece(type: TetrominoType): Piece {
  return {
    type,
    rotation: 0,
    x: 3, // Center of 10-wide board (accounting for piece width)
    y: 0,
    color: getPieceColor(type),
  };
}

// Calculate drop speed based on level (in milliseconds)
export function getDropSpeed(level: number): number {
  return Math.max(100, 1000 - level * 50);
}

// Calculate score based on lines cleared and level
export function calculateScore(linesCleared: number, level: number): number {
  const baseScores: Record<number, number> = {
    1: 100, // Single
    2: 300, // Double
    3: 500, // Triple
    4: 800, // Tetris
  };

  return (baseScores[linesCleared] || 0) * level;
}

// Lock the current piece onto the board
export function lockPiece(board: Board, piece: Piece): Board {
  const newBoard = board.map((row) => [...row]);
  const shape = getPieceShape(piece.type, piece.rotation);

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const y = piece.y + row;
        const x = piece.x + col;

        if (y >= 0 && y < 20 && x >= 0 && x < 10) {
          newBoard[y][x] = piece.color;
        }
      }
    }
  }

  return newBoard;
}

// Clear completed lines and return new board with lines cleared count
export function clearLines(board: Board): {
  board: Board;
  linesCleared: number;
} {
  const newBoard: Board = [];
  let linesCleared = 0;

  for (let row = 0; row < board.length; row++) {
    if (board[row].every((cell) => cell !== null)) {
      linesCleared++;
    } else {
      newBoard.push([...board[row]]);
    }
  }

  // Add empty rows at the top
  while (newBoard.length < 20) {
    newBoard.unshift(Array(10).fill(null));
  }

  return { board: newBoard, linesCleared };
}

// Initial game state
export const initialGameState: GameState = {
  board: createEmptyBoard(),
  currentPiece: null,
  nextPiece: getRandomPiece(),
  score: 0,
  level: 1,
  lines: 0,
  gameStatus: "menu",
  lastMoveTime: 0,
  dropSpeed: getDropSpeed(1),
};

// Main game reducer
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const nextPiece = getRandomPiece();

      return {
        ...initialGameState,
        currentPiece: spawnPiece(state.nextPiece),
        nextPiece,
        gameStatus: "playing",
        lastMoveTime: 0,
      };
    }

    case "PAUSE_GAME": {
      if (state.gameStatus === "playing") {
        return { ...state, gameStatus: "paused" };
      }

      return state;
    }

    case "RESUME_GAME": {
      if (state.gameStatus === "paused") {
        return { ...state, gameStatus: "playing", lastMoveTime: 0 };
      }

      return state;
    }

    case "GAME_OVER": {
      return { ...state, gameStatus: "gameOver" };
    }

    case "MOVE_LEFT": {
      if (!state.currentPiece || state.gameStatus !== "playing") return state;

      const newX = state.currentPiece.x - 1;

      if (
        isValidPosition(
          state.board,
          state.currentPiece,
          newX,
          state.currentPiece.y,
          state.currentPiece.rotation,
        )
      ) {
        return {
          ...state,
          currentPiece: { ...state.currentPiece, x: newX },
        };
      }

      return state;
    }

    case "MOVE_RIGHT": {
      if (!state.currentPiece || state.gameStatus !== "playing") return state;

      const newX = state.currentPiece.x + 1;

      if (
        isValidPosition(
          state.board,
          state.currentPiece,
          newX,
          state.currentPiece.y,
          state.currentPiece.rotation,
        )
      ) {
        return {
          ...state,
          currentPiece: { ...state.currentPiece, x: newX },
        };
      }

      return state;
    }

    case "MOVE_DOWN": {
      if (!state.currentPiece || state.gameStatus !== "playing") return state;

      const newY = state.currentPiece.y + 1;

      if (
        isValidPosition(
          state.board,
          state.currentPiece,
          state.currentPiece.x,
          newY,
          state.currentPiece.rotation,
        )
      ) {
        return {
          ...state,
          currentPiece: { ...state.currentPiece, y: newY },
          score: state.score + 1, // Soft drop bonus
        };
      }

      // Lock piece and spawn new one
      const lockedBoard = lockPiece(state.board, state.currentPiece);
      const { board: clearedBoard, linesCleared } = clearLines(lockedBoard);
      const newLines = state.lines + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      const newScore = state.score + calculateScore(linesCleared, state.level);
      const nextPiece = getRandomPiece();
      const newCurrentPiece = spawnPiece(state.nextPiece);

      // Check if new piece can spawn (game over check)
      if (
        !isValidPosition(
          clearedBoard,
          newCurrentPiece,
          newCurrentPiece.x,
          newCurrentPiece.y,
          newCurrentPiece.rotation,
        )
      ) {
        return {
          ...state,
          board: clearedBoard,
          currentPiece: null,
          gameStatus: "gameOver",
          score: newScore,
          lines: newLines,
          level: newLevel,
        };
      }

      return {
        ...state,
        board: clearedBoard,
        currentPiece: newCurrentPiece,
        nextPiece,
        score: newScore,
        lines: newLines,
        level: newLevel,
        dropSpeed: getDropSpeed(newLevel),
      };
    }

    case "ROTATE": {
      if (!state.currentPiece || state.gameStatus !== "playing") return state;

      const newRotation = ((state.currentPiece.rotation + 1) % 4) as
        | 0
        | 1
        | 2
        | 3;

      // Try rotation with wall kicks
      const kickResult = wallKick(state.board, state.currentPiece, newRotation);

      if (kickResult) {
        return {
          ...state,
          currentPiece: {
            ...state.currentPiece,
            rotation: newRotation,
            x: kickResult.x,
            y: kickResult.y,
          },
        };
      }

      return state;
    }

    case "HARD_DROP": {
      if (!state.currentPiece || state.gameStatus !== "playing") return state;

      const dropY = getGhostPieceY(state.board, state.currentPiece);
      const dropDistance = dropY - state.currentPiece.y;
      const droppedPiece = { ...state.currentPiece, y: dropY };

      // Lock piece immediately
      const lockedBoard = lockPiece(state.board, droppedPiece);
      const { board: clearedBoard, linesCleared } = clearLines(lockedBoard);
      const newLines = state.lines + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      const newScore =
        state.score +
        calculateScore(linesCleared, state.level) +
        dropDistance * 2; // Hard drop bonus
      const nextPiece = getRandomPiece();
      const newCurrentPiece = spawnPiece(state.nextPiece);

      // Check if new piece can spawn (game over check)
      if (
        !isValidPosition(
          clearedBoard,
          newCurrentPiece,
          newCurrentPiece.x,
          newCurrentPiece.y,
          newCurrentPiece.rotation,
        )
      ) {
        return {
          ...state,
          board: clearedBoard,
          currentPiece: null,
          gameStatus: "gameOver",
          score: newScore,
          lines: newLines,
          level: newLevel,
        };
      }

      return {
        ...state,
        board: clearedBoard,
        currentPiece: newCurrentPiece,
        nextPiece,
        score: newScore,
        lines: newLines,
        level: newLevel,
        dropSpeed: getDropSpeed(newLevel),
      };
    }

    case "TICK": {
      if (state.gameStatus !== "playing" || !state.currentPiece) return state;

      const timeSinceLastMove = action.timestamp - state.lastMoveTime;

      if (timeSinceLastMove >= state.dropSpeed) {
        // Auto-drop piece
        const newY = state.currentPiece.y + 1;

        if (
          isValidPosition(
            state.board,
            state.currentPiece,
            state.currentPiece.x,
            newY,
            state.currentPiece.rotation,
          )
        ) {
          return {
            ...state,
            currentPiece: { ...state.currentPiece, y: newY },
            lastMoveTime: action.timestamp,
          };
        }

        // Lock piece and spawn new one
        const lockedBoard = lockPiece(state.board, state.currentPiece);
        const { board: clearedBoard, linesCleared } = clearLines(lockedBoard);
        const newLines = state.lines + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;
        const newScore =
          state.score + calculateScore(linesCleared, state.level);
        const nextPiece = getRandomPiece();
        const newCurrentPiece = spawnPiece(state.nextPiece);

        // Check if new piece can spawn (game over check)
        if (
          !isValidPosition(
            clearedBoard,
            newCurrentPiece,
            newCurrentPiece.x,
            newCurrentPiece.y,
            newCurrentPiece.rotation,
          )
        ) {
          return {
            ...state,
            board: clearedBoard,
            currentPiece: null,
            gameStatus: "gameOver",
            score: newScore,
            lines: newLines,
            level: newLevel,
          };
        }

        return {
          ...state,
          board: clearedBoard,
          currentPiece: newCurrentPiece,
          nextPiece,
          score: newScore,
          lines: newLines,
          level: newLevel,
          dropSpeed: getDropSpeed(newLevel),
          lastMoveTime: action.timestamp,
        };
      }

      return state;
    }

    default:
      return state;
  }
}
