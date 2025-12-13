// Flappy Bird game type definitions

export interface Bird {
  x: number; // X position (fixed, doesn't move horizontally)
  y: number; // Y position (changes with gravity/flap)
  velocity: number; // Vertical velocity (positive = falling, negative = rising)
  radius: number; // Bird hitbox radius
}

export interface Pipe {
  x: number; // X position (scrolls left)
  gapY: number; // Y position of gap center
  gapHeight: number; // Height of the gap
  width: number; // Pipe width
  passed: boolean; // Whether bird has passed this pipe (for scoring)
}

export type GameStatus = "menu" | "playing" | "paused" | "gameOver";

export interface GameState {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  highScore: number;
  gameStatus: GameStatus;
  lastUpdateTime: number;
  gameSpeed: number; // Horizontal scroll speed
  canvasWidth: number;
  canvasHeight: number;
}

export type GameAction =
  | { type: "START_GAME"; canvasWidth: number; canvasHeight: number }
  | { type: "FLAP" }
  | { type: "PAUSE_GAME" }
  | { type: "RESUME_GAME" }
  | { type: "GAME_OVER" }
  | { type: "TICK"; timestamp: number; deltaTime: number }
  | { type: "RESIZE"; canvasWidth: number; canvasHeight: number };
