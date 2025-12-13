"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";

interface TetrisGameOverProps {
  score: number;
  lines: number;
  onRestart: () => void;
}

export function TetrisGameOver({
  score,
  lines,
  onRestart,
}: TetrisGameOverProps) {
  return (
    <Modal hideCloseButton isDismissable={false} isOpen={true}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-danger">Game Over</h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4 text-center">
            <div>
              <p className="text-default-600">Final Score</p>
              <p className="text-4xl font-bold text-danger">
                {score.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-default-600">Lines Cleared</p>
              <p className="text-2xl font-semibold">{lines}</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button fullWidth color="danger" size="lg" onPress={onRestart}>
            Play Again
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
