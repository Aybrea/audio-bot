"use client";

import { Card, CardBody } from "@heroui/card";
import type { GameStatus } from "@/types/flappy";

interface FlappyStatsProps {
  score: number;
  highScore: number;
  gameStatus: GameStatus;
}

export function FlappyStats({
  score,
  highScore,
  gameStatus,
}: FlappyStatsProps) {
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardBody className="flex flex-row items-center justify-between gap-4 p-4">
          <div className="flex flex-col items-center">
            <span className="text-xs md:text-sm text-default-600">Score</span>
            <span className="text-2xl md:text-3xl font-bold text-warning">
              {score}
            </span>
          </div>

          <div className="h-12 w-px bg-default-200" />

          <div className="flex flex-col items-center">
            <span className="text-xs md:text-sm text-default-600">
              High Score
            </span>
            <span className="text-2xl md:text-3xl font-bold text-warning-600">
              {highScore}
            </span>
          </div>

          <div className="h-12 w-px bg-default-200" />

          <div className="flex flex-col items-center">
            <span className="text-xs md:text-sm text-default-600">Status</span>
            <span
              className={`text-sm md:text-base font-semibold ${
                gameStatus === "playing"
                  ? "text-success"
                  : gameStatus === "paused"
                    ? "text-warning"
                    : "text-default-500"
              }`}
            >
              {gameStatus === "menu"
                ? "Ready"
                : gameStatus === "playing"
                  ? "Playing"
                  : gameStatus === "paused"
                    ? "Paused"
                    : "Game Over"}
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
