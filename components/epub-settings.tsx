"use client";

import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/modal";
import { Switch } from "@heroui/switch";

import type { ReaderSettings } from "@/types/epub";

interface EpubSettingsProps {
  isOpen: boolean;
  settings: ReaderSettings;
  onClose: () => void;
  onFontSizeChange: (fontSize: number) => void;
  onFixedFooterChange: (fixedFooter: boolean) => void;
}

export function EpubSettings({
  isOpen,
  settings,
  onClose,
  onFontSizeChange,
  onFixedFooterChange,
}: EpubSettingsProps) {
  const handleIncrease = () => {
    const newSize = Math.min(settings.fontSize + 2, 32);

    onFontSizeChange(newSize);
  };

  const handleDecrease = () => {
    const newSize = Math.max(settings.fontSize - 2, 12);

    onFontSizeChange(newSize);
  };

  return (
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">阅读设置</h2>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-6">
            {/* Font Size Control */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">字体大小</label>
              <div className="flex items-center justify-between gap-4">
                <Button
                  color="default"
                  size="lg"
                  variant="flat"
                  onPress={handleDecrease}
                >
                  A-
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold">
                    {settings.fontSize}px
                  </span>
                </div>
                <Button
                  color="default"
                  size="lg"
                  variant="flat"
                  onPress={handleIncrease}
                >
                  A+
                </Button>
              </div>
              <p className="text-xs text-default-400 text-center">
                范围: 12px - 32px
              </p>
            </div>

            {/* Fixed Footer Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">固定控制栏</label>
                  <p className="text-xs text-default-400">
                    关闭后，点击屏幕中央呼出控制栏
                  </p>
                </div>
                <Switch
                  isSelected={settings.fixedFooter}
                  onValueChange={onFixedFooterChange}
                />
              </div>
            </div>

            {/* Preview Text */}
            <div className="border border-default-200 rounded-lg p-4">
              <p
                className="text-center"
                style={{ fontSize: `${settings.fontSize}px` }}
              >
                预览文字效果
              </p>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
