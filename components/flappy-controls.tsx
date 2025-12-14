"use client";

import type { GameStatus } from "@/types/flappy";

import { Button } from "@heroui/button";

interface FlappyControlsProps {
  gameStatus: GameStatus;
  onFlap: () => void;
  onPause: () => void;
  onStart: () => void;
}

export function FlappyControls({
  gameStatus,
  onFlap,
  onPause,
  onStart,
}: FlappyControlsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center lg:hidden">
      {gameStatus === "menu" && (
        <Button className="w-40" color="warning" size="lg" onPress={onStart}>
          Start Game
        </Button>
      )}

      {gameStatus === "playing" && (
        <>
          <Button
            className="w-40 font-bold"
            color="warning"
            size="lg"
            onPress={onFlap}
          >
            FLAP
          </Button>
          <Button className="w-40" color="default" size="lg" onPress={onPause}>
            Pause
          </Button>
        </>
      )}

      {gameStatus === "paused" && (
        <Button className="w-40" color="warning" size="lg" onPress={onPause}>
          Resume
        </Button>
      )}
    </div>
  );
}
