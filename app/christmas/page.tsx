"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@heroui/spinner";

// 懒加载 Christmas 场景组件
const ChristmasScene = dynamic(() => import("@/components/christmas-scene"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-950">
      <div className="text-center">
        <Spinner color="danger" size="lg" />
        <p className="mt-4 text-white">加载圣诞场景中...</p>
      </div>
    </div>
  ),
  ssr: false, // 动画场景依赖浏览器 API，禁用 SSR
});

export default function ChristmasPage() {
  return <ChristmasScene />;
}
