"use client";

import type { GameAction } from "@/types/tetris";
import type { Dispatch } from "react";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

interface TetrisControlsProps {
  dispatch: Dispatch<GameAction>;
  isPaused: boolean;
}

export function TetrisControls({ dispatch, isPaused }: TetrisControlsProps) {
  return (
    <Card className="w-full md:w-64 lg:hidden">
      <CardBody className="gap-3">
        <div className="grid grid-cols-3 gap-2">
          <Button
            className="text-2xl font-bold"
            color="danger"
            isDisabled={isPaused}
            size="lg"
            variant="flat"
            onPress={() => dispatch({ type: "MOVE_LEFT" })}
          >
            ←
          </Button>
          <Button
            className="text-2xl font-bold"
            color="danger"
            isDisabled={isPaused}
            size="lg"
            variant="flat"
            onPress={() => dispatch({ type: "ROTATE" })}
          >
            ↻
          </Button>
          <Button
            className="text-2xl font-bold"
            color="danger"
            isDisabled={isPaused}
            size="lg"
            variant="flat"
            onPress={() => dispatch({ type: "MOVE_RIGHT" })}
          >
            →
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="text-sm"
            color="danger"
            isDisabled={isPaused}
            size="lg"
            variant="flat"
            onPress={() => dispatch({ type: "MOVE_DOWN" })}
          >
            ↓ Soft
          </Button>
          <Button
            className="text-sm"
            color="danger"
            isDisabled={isPaused}
            size="lg"
            onPress={() => dispatch({ type: "HARD_DROP" })}
          >
            ⇓ Hard
          </Button>
        </div>
        <Button
          color="default"
          size="lg"
          variant="bordered"
          onPress={() =>
            dispatch({ type: isPaused ? "RESUME_GAME" : "PAUSE_GAME" })
          }
        >
          {isPaused ? "Resume (P)" : "Pause (P)"}
        </Button>
      </CardBody>
    </Card>
  );
}
