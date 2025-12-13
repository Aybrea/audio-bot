"use client";

import { Button } from "@heroui/button";
import type { GameStatus } from "@/types/flappy";

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
        <Button color="warning" size="lg" onPress={onStart} className="w-40">
          Start Game
        </Button>
      )}

      {gameStatus === "playing" && (
        <>
          <Button
            color="warning"
            size="lg"
            onPress={onFlap}
            className="w-40 font-bold"
          >
            FLAP
          </Button>
          <Button color="default" size="lg" onPress={onPause} className="w-40">
            Pause
          </Button>
        </>
      )}

      {gameStatus === "paused" && (
        <Button color="warning" size="lg" onPress={onPause} className="w-40">
          Resume
        </Button>
      )}
    </div>
  );
}
