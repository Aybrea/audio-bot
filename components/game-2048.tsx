"use client";

import { useEffect, useReducer } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import { Game2048Board } from "./game-2048-board";

import { gameReducer, initialGameState } from "@/lib/game-2048-engine";

export default function Game2048() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameStatus === "menu") return;

      // Prevent default for arrow keys to avoid page scrolling
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
      }

      if (gameState.gameStatus === "gameOver") return;
      if (gameState.gameStatus === "won" && !gameState.keepPlaying) return;

      switch (e.key) {
        case "ArrowUp":
          dispatch({ type: "MOVE", direction: 0 });
          break;
        case "ArrowRight":
          dispatch({ type: "MOVE", direction: 1 });
          break;
        case "ArrowDown":
          dispatch({ type: "MOVE", direction: 2 });
          break;
        case "ArrowLeft":
          dispatch({ type: "MOVE", direction: 3 });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.gameStatus, gameState.keepPlaying]);

  return (
    <div className="w-full">
      {gameState.gameStatus === "menu" ? (
        <div className="flex flex-col items-center justify-center gap-4 md:gap-6 py-8 md:py-12">
          <div className="text-center px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              Ready to Play?
            </h2>
            <p className="text-sm md:text-base text-default-600 mb-4 md:mb-6">
              Use arrow keys to move tiles. Combine tiles with the same number
              to reach 2048!
            </p>
          </div>
          <Button
            color="warning"
            size="lg"
            onPress={() => dispatch({ type: "START_GAME" })}
          >
            Start Game
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 md:gap-6">
          {/* Score display */}
          <div className="flex gap-4">
            <Card className="bg-[#bbada0]">
              <CardBody className="p-4 text-center min-w-[100px]">
                <div className="text-xs text-[#eee4da] uppercase mb-1">
                  Score
                </div>
                <div className="text-2xl font-bold text-white">
                  {gameState.score}
                </div>
              </CardBody>
            </Card>
            <Card className="bg-[#bbada0]">
              <CardBody className="p-4 text-center min-w-[100px]">
                <div className="text-xs text-[#eee4da] uppercase mb-1">
                  Best
                </div>
                <div className="text-2xl font-bold text-white">
                  {gameState.bestScore}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Game board */}
          <Game2048Board size={gameState.size} tiles={gameState.tiles} />

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              color="default"
              variant="bordered"
              onPress={() => dispatch({ type: "RESTART_GAME" })}
            >
              New Game
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-default-600 max-w-md">
            <p>
              <strong>How to play:</strong> Use your arrow keys to move the
              tiles. When two tiles with the same number touch, they merge into
              one!
            </p>
          </div>
        </div>
      )}

      {/* Game won modal */}
      {gameState.gameStatus === "won" && !gameState.keepPlaying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardBody className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4 text-warning">You Win!</h2>
              <p className="text-lg mb-2">You reached the 2048 tile!</p>
              <p className="text-default-600 mb-6">Score: {gameState.score}</p>
              <div className="flex gap-4 justify-center">
                <Button
                  color="warning"
                  onPress={() => dispatch({ type: "KEEP_PLAYING" })}
                >
                  Keep Playing
                </Button>
                <Button
                  color="default"
                  variant="bordered"
                  onPress={() => dispatch({ type: "RESTART_GAME" })}
                >
                  New Game
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Game over modal */}
      {gameState.gameStatus === "gameOver" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardBody className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4 text-danger">
                Game Over!
              </h2>
              <p className="text-lg mb-2">No more moves available</p>
              <p className="text-default-600 mb-6">
                Final Score: {gameState.score}
              </p>
              <Button
                color="danger"
                onPress={() => dispatch({ type: "RESTART_GAME" })}
              >
                Try Again
              </Button>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
