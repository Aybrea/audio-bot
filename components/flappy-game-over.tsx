"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";

interface FlappyGameOverProps {
  isOpen: boolean;
  score: number;
  highScore: number;
  onPlayAgain: () => void;
}

export function FlappyGameOver({
  isOpen,
  score,
  highScore,
  onPlayAgain,
}: FlappyGameOverProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onPlayAgain}
      placement="center"
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-warning">Game Over!</h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg text-default-600">Your Score:</span>
              <span className="text-3xl font-bold text-warning">{score}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg text-default-600">High Score:</span>
              <span className="text-3xl font-bold text-warning-600">
                {highScore}
              </span>
            </div>
            {score === highScore && score > 0 && (
              <div className="text-center">
                <span className="text-success font-bold">
                  🎉 New High Score! 🎉
                </span>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="warning"
            size="lg"
            onPress={onPlayAgain}
            className="w-full font-bold"
          >
            Play Again
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
