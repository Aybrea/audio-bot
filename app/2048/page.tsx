"use client";

import dynamic from "next/dynamic";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";

import { title } from "@/components/primitives";

// 懒加载 2048 游戏组件
const Game2048 = dynamic(() => import("@/components/game-2048"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center">
        <Spinner color="warning" size="lg" />
        <p className="mt-4 text-default-600">加载游戏中...</p>
      </div>
    </div>
  ),
  ssr: false, // 游戏依赖浏览器 API，禁用 SSR
});

export default function Game2048Page() {
  return (
    <section className="flex flex-col items-center justify-center gap-2 md:gap-6 py-2 md:py-8 px-2 md:px-4">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title({ color: "yellow" })}>2048</h1>
        <p className="mt-1 md:mt-4 text-xs md:text-base text-default-600">
          Join the numbers and get to the 2048 tile!
        </p>
      </div>

      <div className="w-full max-w-4xl">
        <Game2048 />
      </div>

      {/* Instructions - Hidden on mobile */}
      <div className="hidden lg:block w-full max-w-2xl mt-4 md:mt-8 px-2">
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">How to Play</h3>
          </CardHeader>
          <CardBody className="gap-2">
            <p className="text-xs md:text-sm text-default-600">
              <strong>Controls:</strong> Use your arrow keys (↑ ↓ ← →) to move
              the tiles.
            </p>
            <p className="text-xs md:text-sm text-default-600">
              <strong>Goal:</strong> When two tiles with the same number touch,
              they merge into one! Keep merging to reach the 2048 tile.
            </p>
            <p className="text-xs md:text-sm text-default-600">
              <strong>Tip:</strong> Plan your moves carefully - the game ends
              when you can&apos;t make any more moves!
            </p>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
