"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";

interface SampleFile {
  name: string;
  path: string;
  displayName: string;
  referenceText: string;
  description: string;
}

interface SampleFileListProps {
  onSelect?: (file: SampleFile) => void;
}

export function SampleFileList({ onSelect }: SampleFileListProps) {
  const [files, setFiles] = useState<SampleFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingFile, setPlayingFile] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );

  useEffect(() => {
    // 获取样本文件列表
    fetch("/api/samples")
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setLoading(false);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load samples:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // 创建音频元素
    const audio = new Audio();

    audio.addEventListener("ended", () => {
      setPlayingFile(null);
    });

    setAudioElement(audio);

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const handlePlay = (file: SampleFile) => {
    if (!audioElement) return;

    if (playingFile === file.path) {
      // 如果正在播放这个文件，则暂停
      audioElement.pause();
      setPlayingFile(null);
    } else {
      // 播放新文件
      audioElement.src = file.path;
      audioElement.play();
      setPlayingFile(file.path);
    }
  };

  const handleSelect = (file: SampleFile) => {
    if (onSelect) {
      onSelect(file);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center py-8">
          <Spinner color="danger" />
        </CardBody>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="w-full">
        <CardBody className="flex items-center justify-center py-8">
          <p className="text-default-500">没有找到样本文件</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">样本文件</h3>
      </CardHeader>
      <CardBody className="gap-2">
        {files.map((file) => (
          <div
            key={file.path}
            className="flex items-center justify-between p-3 bg-default-50 rounded-lg hover:bg-default-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <Button
                isIconOnly
                color={playingFile === file.path ? "danger" : "default"}
                size="sm"
                variant="flat"
                onPress={() => handlePlay(file)}
              >
                {playingFile === file.path ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </Button>
              <div className="flex flex-col">
                <span className="text-sm text-default-700 font-medium">
                  {file.displayName}
                </span>
                {file.description && (
                  <span className="text-xs text-default-500">
                    {file.description}
                  </span>
                )}
              </div>
            </div>
            <Button
              color="danger"
              size="sm"
              variant="flat"
              onPress={() => handleSelect(file)}
            >
              选择
            </Button>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
