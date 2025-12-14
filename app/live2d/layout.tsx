import type { Metadata } from "next";

import Script from "next/script";

export const metadata: Metadata = {
  title: "Live2D 角色互动",
  description: "与可爱的 2D 角色进行实时互动，支持鼠标跟踪和点击交互",
};

export default function Live2DLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 加载 Cubism 2 核心库 */}
      <Script
        src="https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js"
        strategy="beforeInteractive"
      />
      {/* 加载 Cubism 4 核心库 */}
      <Script
        src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"
        strategy="beforeInteractive"
      />
      {/* 加载 PIXI.js 7.x */}
      <Script
        id="pixi-loader"
        src="https://cdn.jsdelivr.net/npm/pixi.js@7.4.3/dist/pixi.min.js"
        strategy="beforeInteractive"
      />
      {/* 清理 PIXI 扩展注册表（解决热重载问题）*/}
      <Script
        id="pixi-cleanup"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && window.PIXI) {
              // 清除可能导致冲突的扩展注册
              try {
                if (window.PIXI.extensions && window.PIXI.extensions._addHandlers) {
                  // 清空扩展处理器以避免重复注册错误
                  window.PIXI.extensions._addHandlers = {};
                }
              } catch (e) {
                console.warn('Failed to clear PIXI extensions:', e);
              }
            }
          `,
        }}
      />
      {/* 加载 pixi-live2d-display */}
      <Script
        id="pixi-live2d-loader"
        src="https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/index.min.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}
