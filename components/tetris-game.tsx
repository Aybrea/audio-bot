"use client";

import { useEffect, useReducer, useRef } from "react";
import { Button } from "@heroui/button";

import { TetrisBoard } from "./tetris-board";
import { TetrisStats } from "./tetris-stats";
import { TetrisNextPiece } from "./tetris-next-piece";
import { TetrisControls } from "./tetris-controls";
import { TetrisGameOver } from "./tetris-game-over";

import { gameReducer, initialGameState } from "@/lib/tetris-engine";

export default function TetrisGame() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();

  // Game loop with requestAnimationFrame
  useEffect(() => {
    if (gameState.gameStatus !== "playing") {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }

      return;
    }

    const gameLoop = (timestamp: number) => {
      dispatch({ type: "TICK", timestamp });
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStatus]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameStatus === "menu") return;

      // Prevent default for game keys to avoid page scrolling
      if (
        ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (gameState.gameStatus === "paused") {
        if (e.key === "p" || e.key === "P") {
          dispatch({ type: "RESUME_GAME" });
        }

        return;
      }

      if (gameState.gameStatus !== "playing") return;

      switch (e.key) {
        case "ArrowLeft":
          dispatch({ type: "MOVE_LEFT" });
          break;
        case "ArrowRight":
          dispatch({ type: "MOVE_RIGHT" });
          break;
        case "ArrowDown":
          dispatch({ type: "MOVE_DOWN" });
          break;
        case "ArrowUp":
          dispatch({ type: "ROTATE" });
          break;
        case " ":
          dispatch({ type: "HARD_DROP" });
          break;
        case "p":
        case "P":
          dispatch({ type: "PAUSE_GAME" });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.gameStatus]);

  return (
    <div className="w-full">
      {gameState.gameStatus === "menu" ? (
        <div className="flex flex-col items-center justify-center gap-4 md:gap-6 py-8 md:py-12">
          <div className="text-center px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              Ready to Play?
            </h2>
            <p className="text-sm md:text-base text-default-600 mb-4 md:mb-6">
              Use arrow keys to move and rotate pieces
            </p>
          </div>
          <Button
            color="danger"
            size="lg"
            onPress={() => dispatch({ type: "START_GAME" })}
          >
            Start Game
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-3 md:gap-6 items-start justify-center">
          {/* Game board */}
          <div className="flex justify-center w-full lg:w-auto">
            <TetrisBoard
              board={gameState.board}
              canvasRef={canvasRef}
              currentPiece={gameState.currentPiece}
            />
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-3 md:gap-4 w-full lg:w-auto">
            <TetrisStats
              level={gameState.level}
              lines={gameState.lines}
              score={gameState.score}
            />
            <TetrisNextPiece nextPiece={gameState.nextPiece} />
            <TetrisControls
              dispatch={dispatch}
              isPaused={gameState.gameStatus === "paused"}
            />

            {/* Desktop pause button */}
            <Button
              className="hidden lg:flex"
              color="default"
              variant="bordered"
              onPress={() =>
                dispatch({
                  type:
                    gameState.gameStatus === "paused"
                      ? "RESUME_GAME"
                      : "PAUSE_GAME",
                })
              }
            >
              {gameState.gameStatus === "paused" ? "Resume (P)" : "Pause (P)"}
            </Button>
          </div>
        </div>
      )}

      {/* Game over modal */}
      {gameState.gameStatus === "gameOver" && (
        <TetrisGameOver
          lines={gameState.lines}
          score={gameState.score}
          onRestart={() => dispatch({ type: "START_GAME" })}
        />
      )}

      {/* Paused overlay */}
      {gameState.gameStatus === "paused" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-default-100 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Paused</h2>
            <p className="text-default-600 mb-6">Press P to resume</p>
            <Button
              color="danger"
              onPress={() => dispatch({ type: "RESUME_GAME" })}
            >
              Resume
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
