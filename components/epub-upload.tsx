"use client";

import { useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import { isValidEpubFile } from "@/lib/epub-utils";

interface EpubUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function EpubUpload({ onFileSelect, isLoading = false }: EpubUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    setError(null);

    if (!file) return;

    if (!isValidEpubFile(file)) {
      setError("请选择有效的 EPUB 文件");

      return;
    }

    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    handleFileChange(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0] || null;

    handleFileChange(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardBody>
        <div
          className={`
            relative flex flex-col items-center justify-center
            min-h-[300px] p-8 rounded-lg border-2 border-dashed
            transition-colors cursor-pointer
            ${dragActive ? "border-primary bg-primary/10" : "border-default-300"}
            ${isLoading ? "opacity-50 pointer-events-none" : "hover:border-primary"}
          `}
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            accept=".epub,application/epub+zip"
            className="hidden"
            disabled={isLoading}
            type="file"
            onChange={handleInputChange}
          />

          <div className="text-center space-y-4">
            <div className="text-6xl">📚</div>

            <div>
              <h3 className="text-xl font-semibold mb-2">
                {isLoading ? "正在加载..." : "上传 EPUB 文件"}
              </h3>
              <p className="text-default-500 text-sm">
                点击或拖拽 EPUB 文件到此处
              </p>
            </div>

            {!isLoading && (
              <Button color="primary" size="lg" onPress={handleClick}>
                选择文件
              </Button>
            )}

            {error && (
              <p className="text-danger text-sm mt-2">{error}</p>
            )}
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-default-500">
          <p>支持的格式: .epub</p>
          <p className="mt-1">文件将在浏览器本地处理，不会上传到服务器</p>
        </div>
      </CardBody>
    </Card>
  );
}
