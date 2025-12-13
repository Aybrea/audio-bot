"use client";

import { Button } from "@heroui/button";

interface EpubControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onToggleToc: () => void;
  onToggleSettings: () => void;
}

export function EpubControls({
  onPrev,
  onNext,
  onToggleToc,
  onToggleSettings,
}: EpubControlsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 md:justify-center md:gap-4">
        {/* Previous Button */}
        <Button
          color="primary"
          size="lg"
          variant="flat"
          className="flex-1 md:flex-none"
          onPress={onPrev}
        >
          <span className="md:hidden">←</span>
          <span className="hidden md:inline">← 上一页</span>
        </Button>

        {/* Feature Controls */}
        <div className="flex items-center gap-2">
          <Button
            color="default"
            variant="bordered"
            size="md"
            isIconOnly
            onPress={onToggleToc}
          >
            📑
          </Button>
          <Button
            color="default"
            variant="bordered"
            size="md"
            isIconOnly
            onPress={onToggleSettings}
          >
            ⚙️
          </Button>
        </div>

        {/* Next Button */}
        <Button
          color="primary"
          size="lg"
          variant="flat"
          className="flex-1 md:flex-none"
          onPress={onNext}
        >
          <span className="md:hidden">→</span>
          <span className="hidden md:inline">下一页 →</span>
        </Button>
      </div>

      {/* Keyboard Hints - Desktop Only */}
      <div className="hidden md:block text-center text-xs text-default-400 mt-2">
        <p>使用 ← → 方向键翻页</p>
      </div>
    </div>
  );
}
