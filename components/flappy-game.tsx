"use client";

import { useEffect, useReducer, useRef } from "react";
import { Button } from "@heroui/button";

import { FlappyCanvas } from "./flappy-canvas";
import { FlappyStats } from "./flappy-stats";
import { FlappyControls } from "./flappy-controls";
import { FlappyGameOver } from "./flappy-game-over";

import { gameReducer, initialGameState } from "@/lib/flappy-engine";

export default function FlappyGame() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);

  // Game loop with requestAnimationFrame
  useEffect(() => {
    if (gameState.gameStatus !== "playing") {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }

      return;
    }

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTimeRef.current;

      lastFrameTimeRef.current = timestamp;

      // Normalize to 60fps (16.67ms per frame)
      dispatch({
        type: "TICK",
        timestamp,
        deltaTime: deltaTime / 16.67,
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    lastFrameTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStatus]);

  // Input handling (keyboard + mouse)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameStatus === "menu") {
        if (e.key === " " || e.key === "ArrowUp") {
          e.preventDefault();
          dispatch({
            type: "START_GAME",
            canvasWidth: gameState.canvasWidth,
            canvasHeight: gameState.canvasHeight,
          });
        }
      } else if (gameState.gameStatus === "playing") {
        if (e.key === " " || e.key === "ArrowUp") {
          e.preventDefault();
          dispatch({ type: "FLAP" });
        } else if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          dispatch({ type: "PAUSE_GAME" });
        }
      } else if (gameState.gameStatus === "paused") {
        if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          dispatch({ type: "RESUME_GAME" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState.gameStatus, gameState.canvasWidth, gameState.canvasHeight]);

  // Responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(600, window.innerWidth - 32);
      const height = Math.min(800, window.innerHeight - 200);

      dispatch({
        type: "RESIZE",
        canvasWidth: width,
        canvasHeight: height,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleStart = () => {
    dispatch({
      type: "START_GAME",
      canvasWidth: gameState.canvasWidth,
      canvasHeight: gameState.canvasHeight,
    });
  };

  const handlePause = () => {
    if (gameState.gameStatus === "playing") {
      dispatch({ type: "PAUSE_GAME" });
    } else if (gameState.gameStatus === "paused") {
      dispatch({ type: "RESUME_GAME" });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 md:gap-6">
      {/* Stats */}
      <FlappyStats
        gameStatus={gameState.gameStatus}
        highScore={gameState.highScore}
        score={gameState.score}
      />

      {/* Game Canvas */}
      <div className="relative">
        <FlappyCanvas
          bird={gameState.bird}
          canvasHeight={gameState.canvasHeight}
          canvasWidth={gameState.canvasWidth}
          pipes={gameState.pipes}
          score={gameState.score}
        />

        {/* Menu Overlay */}
        {gameState.gameStatus === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                Flappy Bird
              </h2>
              <Button
                className="font-bold"
                color="warning"
                size="lg"
                onPress={handleStart}
              >
                Start Game
              </Button>
              <p className="text-white text-sm mt-4">
                Press SPACE or Click to start
              </p>
            </div>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState.gameStatus === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                Paused
              </h2>
              <Button
                className="font-bold"
                color="warning"
                size="lg"
                onPress={handlePause}
              >
                Resume
              </Button>
              <p className="text-white text-sm mt-4">Press P to resume</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <FlappyControls
        gameStatus={gameState.gameStatus}
        onFlap={() => dispatch({ type: "FLAP" })}
        onPause={handlePause}
        onStart={handleStart}
      />

      {/* Game Over Modal */}
      <FlappyGameOver
        highScore={gameState.highScore}
        isOpen={gameState.gameStatus === "gameOver"}
        score={gameState.score}
        onPlayAgain={handleStart}
      />
    </div>
  );
}
