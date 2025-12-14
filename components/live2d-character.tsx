"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";

// 扩展 Window 接口以支持 Live2D 和 PIXI（通过 CDN 加载）
declare global {
  interface Window {
    Live2D?: any;
    PIXI?: any;
    LIVE2D?: any;
  }
}

interface Live2DCharacterProps {
  modelUrl?: string;
  width?: number;
  height?: number;
}

export default function Live2DCharacter({
  modelUrl = "/models/hiyori/shizuku.model.json",
  width = 800,
  height = 600,
}: Live2DCharacterProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;

    const initLive2D = async () => {
      try {
        setLoading(true);
        setError(null);

        // 等待所有库从 CDN 加载完成
        let retries = 0;
        const maxRetries = 100; // 最多等待 10 秒

        while (
          typeof window !== "undefined" &&
          (!window.PIXI || !window.PIXI.live2d || !window.Live2D) &&
          retries < maxRetries
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }

        if (!window.PIXI) {
          throw new Error("Failed to load PIXI.js from CDN");
        }

        if (!window.PIXI.live2d) {
          throw new Error("Failed to load pixi-live2d-display from CDN");
        }

        if (!window.Live2D) {
          throw new Error("Failed to load Cubism runtime from CDN");
        }

        // 使用全局的 PIXI 和 Live2DModel
        const PIXI = window.PIXI;

        // pixi-live2d-display 扩展了 PIXI 对象
        // Live2DModel 在 PIXI.live2d 命名空间下
        const Live2DModel = PIXI.live2d.Live2DModel;

        if (!Live2DModel) {
          throw new Error("Live2DModel not found in PIXI.live2d");
        }

        // 创建 PIXI 应用（PIXI.js 7.x API）
        const app = new PIXI.Application({
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
        });

        if (!mounted) {
          app.destroy(true);

          return;
        }

        appRef.current = app;
        canvasRef.current?.appendChild(app.view);

        // 加载 Live2D 模型
        const model = await Live2DModel.from(modelUrl, {
          autoInteract: true,
        });

        if (!mounted) {
          model.destroy();

          return;
        }

        modelRef.current = model;
        app.stage.addChild(model);

        // 设置模型位置和缩放
        const scale = Math.min(
          width / model.width,
          height / model.height,
        ) * 0.8;

        model.scale.set(scale);
        model.x = width / 2;
        model.y = height / 2;
        model.anchor.set(0.5, 0.5);

        // 鼠标跟踪
        app.stage.eventMode = "static";
        app.stage.hitArea = app.screen;
        app.stage.on("pointermove", (e: any) => {
          if (modelRef.current) {
            const point = e.global;

            modelRef.current.focus(point.x, point.y);
          }
        });

        // 点击交互
        model.on("hit", (hitAreas: string[]) => {
          // eslint-disable-next-line no-console
          console.log("Hit areas:", hitAreas);

          if (hitAreas.includes("body")) {
            model.motion("tap_body");
          } else if (hitAreas.includes("head")) {
            model.expression();
          }
        });

        setModelLoaded(true);
        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load Live2D model",
          );
          setLoading(false);
        }
      }
    };

    initLive2D();

    return () => {
      mounted = false;

      if (modelRef.current) {
        modelRef.current.destroy();
        modelRef.current = null;
      }

      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [modelUrl, width, height]);

  const playRandomMotion = () => {
    if (modelRef.current) {
      modelRef.current.motion("idle");
    }
  };

  const playRandomExpression = () => {
    if (modelRef.current) {
      modelRef.current.expression();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full max-w-4xl">
        <CardBody className="p-0">
          <div
            className="relative flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
            style={{ width, height }}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Spinner color="primary" size="lg" />
                  <p className="mt-4 text-default-600">加载 Live2D 模型中...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-danger">加载失败: {error}</p>
                  <p className="mt-2 text-sm text-default-500">
                    请确保模型文件存在于 public/models 目录
                  </p>
                </div>
              </div>
            )}

            <div ref={canvasRef} />
          </div>
        </CardBody>
      </Card>

      {modelLoaded && (
        <Card className="w-full max-w-4xl">
          <CardBody>
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">交互说明</h3>
                <ul className="text-sm text-default-600 space-y-1">
                  <li>• 移动鼠标：角色眼睛会跟随鼠标移动</li>
                  <li>• 点击角色：触发不同的动作和表情</li>
                  <li>• 使用下方按钮：播放随机动作或表情</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button color="primary" onPress={playRandomMotion}>
                  播放动作
                </Button>
                <Button color="secondary" onPress={playRandomExpression}>
                  切换表情
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
