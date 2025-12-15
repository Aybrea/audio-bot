"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@heroui/spinner";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";

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

// 角色配置
const characters = [
  {
    id: "shizuku",
    name: "Shizuku",
    modelUrl: "/models/hiyori/shizuku.model.json",
    description: "可爱的女孩角色",
  },
  {
    id: "haru",
    name: "Haru",
    modelUrl: "/models/haru/haru_greeter_t03.model3.json",
    description: "活泼的招待员",
  },
];

export default function Live2DPage() {
  const [selectedCharacter, setSelectedCharacter] = useState("shizuku");

  const currentCharacter = characters.find((c) => c.id === selectedCharacter);

  return (
    <section className="flex flex-col items-center justify-center gap-4 md:gap-6 py-4 md:py-8 px-2 md:px-4">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title({ color: "violet" })}>Live2D 角色</h1>
        <p className="mt-2 md:mt-4 text-sm md:text-base text-default-600">
          与可爱的 2D 角色互动
        </p>
      </div>

      {/* 角色选择器 */}
      <Card className="w-full max-w-4xl">
        <CardBody className="p-4 md:p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-base md:text-lg font-semibold">选择角色</h3>
            <Tabs
              selectedKey={selectedCharacter}
              size="lg"
              onSelectionChange={(key) => setSelectedCharacter(key as string)}
            >
              {characters.map((character) => (
                <Tab
                  key={character.id}
                  title={
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold">{character.name}</span>
                      <span className="text-xs text-default-500">
                        {character.description}
                      </span>
                    </div>
                  }
                />
              ))}
            </Tabs>
          </div>
        </CardBody>
      </Card>

      {/* Live2D 角色显示 */}
      {currentCharacter && (
        <Live2DCharacter
          key={currentCharacter.id}
          modelUrl={currentCharacter.modelUrl}
        />
      )}
    </section>
  );
}
