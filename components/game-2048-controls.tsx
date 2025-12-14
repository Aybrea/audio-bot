"use client";

import type { Dispatch } from "react";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import type { GameAction } from "@/lib/game-2048-engine";

interface Game2048ControlsProps {
  dispatch: Dispatch<GameAction>;
  isDisabled: boolean;
}

export function Game2048Controls({
  dispatch,
  isDisabled,
}: Game2048ControlsProps) {
  return (
    <Card className="w-full max-w-xs lg:hidden">
      <CardBody className="gap-3">
        <div className="grid grid-cols-3 gap-2">
          <div />
          <Button
            className="text-2xl font-bold"
            color="warning"
            isDisabled={isDisabled}
            size="lg"
            variant="flat"
            onPress={() => dispatch({ type: "MOVE", direction: 0 })}
          >
            ↑
          </Button>
          <div />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            className="text-2xl font-bold"
            color="warning"
            isDisabled={isDisabled}
            size="lg"
            variant="flat"
            onPress={() => dispatch({ type: "MOVE", direction: 3 })}
          >
            ←
          </Button>
          <div />
          <Button
            className="text-2xl font-bold"
            color="warning"
            isDisabled={isDisabled}
            size="lg"
            variant="flat"
            onPress={() => dispatch({ type: "MOVE", direction: 1 })}
          >
            →
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div />
          <Button
            className="text-2xl font-bold"
            color="warning"
            isDisabled={isDisabled}
            size="lg"
            variant="flat"
            onPress={() => dispatch({ type: "MOVE", direction: 2 })}
          >
            ↓
          </Button>
          <div />
        </div>
      </CardBody>
    </Card>
  );
}
