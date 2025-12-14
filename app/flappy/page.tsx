"use client";

import dynamic from "next/dynamic";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/spinner";

import { title } from "@/components/primitives";

// 懒加载 Flappy Bird 游戏组件
const FlappyGame = dynamic(() => import("@/components/flappy-game"), {
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

export default function FlappyPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 md:gap-6 py-4 md:py-8 px-2 md:px-4">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title({ color: "yellow" })}>Flappy Bird</h1>
        <p className="mt-2 md:mt-4 text-sm md:text-base text-default-600">
          Tap to flap and avoid the pipes!
        </p>
      </div>

      <div className="w-full max-w-4xl">
        <FlappyGame />
      </div>

      {/* Instructions */}
      <div className="w-full max-w-2xl mt-4 md:mt-8 px-2">
        <Card>
          <CardHeader>
            <h3 className="text-base md:text-lg font-semibold">How to Play</h3>
          </CardHeader>
          <CardBody className="gap-2">
            <p className="text-xs md:text-sm text-default-600">
              <strong>Desktop:</strong> Press SPACE, UP ARROW, or CLICK to flap.
              Press P to pause.
            </p>
            <p className="text-xs md:text-sm text-default-600">
              <strong>Mobile:</strong> Tap anywhere on the canvas or use the
              flap button.
            </p>
            <p className="text-xs md:text-sm text-default-600">
              <strong>Goal:</strong> Navigate through pipes without hitting
              them. Game speeds up as you score!
            </p>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
