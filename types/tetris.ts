// Tetris game type definitions

export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Cell = string | null;

export type Board = Cell[][];

export interface Piece {
  type: TetrominoType;
  rotation: 0 | 1 | 2 | 3;
  x: number;
  y: number;
  color: string;
}

export type GameStatus = "menu" | "playing" | "paused" | "gameOver";

export interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextPiece: TetrominoType;
  score: number;
  level: number;
  lines: number;
  gameStatus: GameStatus;
  lastMoveTime: number;
  dropSpeed: number;
}

export type GameAction =
  | { type: "START_GAME" }
  | { type: "PAUSE_GAME" }
  | { type: "RESUME_GAME" }
  | { type: "GAME_OVER" }
  | { type: "MOVE_LEFT" }
  | { type: "MOVE_RIGHT" }
  | { type: "MOVE_DOWN" }
  | { type: "ROTATE" }
  | { type: "HARD_DROP" }
  | { type: "TICK"; timestamp: number };
