"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@heroui/spinner";

import { title } from "@/components/primitives";

// 懒加载 Live2D 组件
const Live2DCharacter = dynamic(
  () => import("@/components/live2d-character"),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Spinner color="primary" size="lg" />
          <p className="mt-4 text-default-600">加载 Live2D 引擎中...</p>
        </div>
      </div>
    ),
    ssr: false, // Live2D 依赖浏览器 API，禁用 SSR
  },
);

export default function Live2DPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 md:gap-6 py-4 md:py-8 px-2 md:px-4">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title({ color: "violet" })}>Live2D 角色</h1>
        <p className="mt-2 md:mt-4 text-sm md:text-base text-default-600">
          与可爱的 2D 角色互动
        </p>
      </div>

      <Live2DCharacter />
    </section>
  );
}
