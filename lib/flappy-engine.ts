import type { Bird, Pipe, GameState, GameAction } from "@/types/flappy";

import { updateBirdPosition, applyFlap } from "./flappy-physics";
import { checkCollisions } from "./flappy-collision";

// Game constants
const GRAVITY = 0.5;
const FLAP_VELOCITY = -8;
const MAX_VELOCITY = 10;
const BIRD_X = 100;
const BIRD_RADIUS = 15;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const PIPE_SPACING = 300;
const INITIAL_SPEED = 2;
const GROUND_HEIGHT = 80;

// Create initial bird
export function createBird(canvasHeight: number): Bird {
  return {
    x: BIRD_X,
    y: canvasHeight / 2,
    velocity: 0,
    radius: BIRD_RADIUS,
  };
}

// Create initial pipes (3 pipes off-screen)
export function createInitialPipes(
  canvasWidth: number,
  canvasHeight: number,
): Pipe[] {
  const pipes: Pipe[] = [];

  for (let i = 0; i < 3; i++) {
    pipes.push(generatePipe(canvasWidth + i * PIPE_SPACING, canvasHeight));
  }

  return pipes;
}

// Generate new pipe with random gap position
export function generatePipe(x: number, canvasHeight: number): Pipe {
  const minGapY = canvasHeight * 0.2 + PIPE_GAP / 2;
  const maxGapY = canvasHeight * 0.8 - PIPE_GAP / 2 - GROUND_HEIGHT;
  const gapY = minGapY + Math.random() * (maxGapY - minGapY);

  return {
    x,
    gapY,
    gapHeight: PIPE_GAP,
    width: PIPE_WIDTH,
    passed: false,
  };
}

// Calculate game speed based on score
export function getGameSpeed(score: number): number {
  const speedIncrease = Math.floor(score / 10) * 0.2;

  return Math.min(INITIAL_SPEED + speedIncrease, 4);
}

// Update bird physics
export function updateBird(bird: Bird, deltaTime: number): Bird {
  return updateBirdPosition(bird, deltaTime);
}

// Update pipes (scroll left, remove off-screen, add new)
export function updatePipes(
  pipes: Pipe[],
  gameSpeed: number,
  deltaTime: number,
  canvasWidth: number,
  canvasHeight: number,
): { pipes: Pipe[]; newPipe: boolean } {
  let newPipe = false;

  // Scroll pipes left
  const updatedPipes = pipes.map((pipe) => ({
    ...pipe,
    x: pipe.x - gameSpeed * deltaTime,
  }));

  // Remove pipes that are off-screen left
  const filteredPipes = updatedPipes.filter(
    (pipe) => pipe.x + pipe.width > -100,
  );

  // Add new pipe if needed
  const lastPipe = filteredPipes[filteredPipes.length - 1];

  if (lastPipe && lastPipe.x < canvasWidth - PIPE_SPACING) {
    filteredPipes.push(generatePipe(canvasWidth + PIPE_WIDTH, canvasHeight));
    newPipe = true;
  }

  return { pipes: filteredPipes, newPipe };
}

// Check if bird passed a pipe (for scoring)
export function checkPipePassed(
  bird: Bird,
  pipes: Pipe[],
): { pipes: Pipe[]; scoreIncrease: number } {
  let scoreIncrease = 0;

  const updatedPipes = pipes.map((pipe) => {
    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      scoreIncrease += 1;

      return { ...pipe, passed: true };
    }

    return pipe;
  });

  return { pipes: updatedPipes, scoreIncrease };
}

// Initial game state
export const initialGameState: GameState = {
  bird: {
    x: BIRD_X,
    y: 300,
    velocity: 0,
    radius: BIRD_RADIUS,
  },
  pipes: [],
  score: 0,
  highScore: 0,
  gameStatus: "menu",
  lastUpdateTime: 0,
  gameSpeed: INITIAL_SPEED,
  canvasWidth: 600,
  canvasHeight: 800,
};

// Main game reducer
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const bird = createBird(action.canvasHeight);
      const pipes = createInitialPipes(action.canvasWidth, action.canvasHeight);

      return {
        ...state,
        bird,
        pipes,
        score: 0,
        gameStatus: "playing",
        lastUpdateTime: Date.now(),
        gameSpeed: INITIAL_SPEED,
        canvasWidth: action.canvasWidth,
        canvasHeight: action.canvasHeight,
      };
    }

    case "FLAP": {
      if (state.gameStatus !== "playing") return state;

      return {
        ...state,
        bird: {
          ...state.bird,
          velocity: applyFlap(),
        },
      };
    }

    case "PAUSE_GAME": {
      if (state.gameStatus !== "playing") return state;

      return {
        ...state,
        gameStatus: "paused",
      };
    }

    case "RESUME_GAME": {
      if (state.gameStatus !== "paused") return state;

      return {
        ...state,
        gameStatus: "playing",
        lastUpdateTime: Date.now(),
      };
    }

    case "GAME_OVER": {
      return {
        ...state,
        gameStatus: "gameOver",
        highScore: Math.max(state.score, state.highScore),
      };
    }

    case "TICK": {
      if (state.gameStatus !== "playing") return state;

      // Update bird physics
      const updatedBird = updateBird(state.bird, action.deltaTime);

      // Update pipes
      const { pipes: updatedPipes } = updatePipes(
        state.pipes,
        state.gameSpeed,
        action.deltaTime,
        state.canvasWidth,
        state.canvasHeight,
      );

      // Check for pipe passing (scoring)
      const { pipes: scoredPipes, scoreIncrease } = checkPipePassed(
        updatedBird,
        updatedPipes,
      );

      const newScore = state.score + scoreIncrease;
      const newGameSpeed = getGameSpeed(newScore);

      // Check collisions
      const hasCollision = checkCollisions(
        updatedBird,
        scoredPipes,
        state.canvasHeight,
        GROUND_HEIGHT,
      );

      if (hasCollision) {
        return gameReducer(state, { type: "GAME_OVER" });
      }

      return {
        ...state,
        bird: updatedBird,
        pipes: scoredPipes,
        score: newScore,
        gameSpeed: newGameSpeed,
        lastUpdateTime: action.timestamp,
      };
    }

    case "RESIZE": {
      return {
        ...state,
        canvasWidth: action.canvasWidth,
        canvasHeight: action.canvasHeight,
      };
    }

    default:
      return state;
  }
}

// Export constants for use in other files
export { GROUND_HEIGHT, BIRD_X, BIRD_RADIUS, PIPE_WIDTH, PIPE_GAP };
