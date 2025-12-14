"use client";

import dynamic from "next/dynamic";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";

import { title } from "@/components/primitives";

// 懒加载 Tetris 游戏组件
const TetrisGame = dynamic(() => import("@/components/tetris-game"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center">
        <Spinner color="pink" size="lg" />
        <p className="mt-4 text-default-600">加载游戏中...</p>
      </div>
    </div>
  ),
  ssr: false, // 游戏依赖浏览器 API，禁用 SSR
});

export default function TetrisPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 md:gap-6 py-4 md:py-8 px-2 md:px-4">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title({ color: "pink" })}>Tetris</h1>
        <p className="mt-2 md:mt-4 text-sm md:text-base text-default-600">
          Classic block-stacking puzzle game
        </p>
      </div>

      <div className="w-full max-w-6xl">
        <TetrisGame />
      </div>

      {/* Instructions */}
      <div className="w-full max-w-2xl mt-4 md:mt-8 px-2">
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">How to Play</h3>
          </CardHeader>
          <CardBody className="gap-2">
            <p className="text-xs md:text-sm text-default-600">
              <strong>Desktop:</strong> Use arrow keys to move (←/→), rotate
              (↑), and drop (↓). Press SPACE for hard drop, P to pause.
            </p>
            <p className="text-xs md:text-sm text-default-600">
              <strong>Mobile:</strong> Use the on-screen buttons to control the
              pieces.
            </p>
            <p className="text-xs md:text-sm text-default-600">
              <strong>Goal:</strong> Clear lines by filling rows completely.
              Game speeds up as you level up!
            </p>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
