"use client";

import { Card, CardBody, CardFooter } from "@heroui/card";
import { Progress } from "@heroui/progress";

interface EpubBookCardProps {
  id: string;
  title: string;
  author: string;
  cover?: string;
  progress?: number; // 0-100
  lastReadAt: number;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function EpubBookCard({
  id,
  title,
  author,
  cover,
  progress = 0,
  lastReadAt,
  onOpen,
  onDelete,
}: EpubBookCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "今天";
    } else if (diffDays === 1) {
      return "昨天";
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString("zh-CN");
    }
  };

  return (
    <div className="w-full cursor-pointer" onClick={() => onOpen(id)}>
      <Card className="w-full">
        <CardBody className="p-0">
          {/* Cover Image */}
          <div className="relative w-full aspect-[2/3] bg-default-100">
            {cover ? (
              <img
                alt={title}
                className="object-cover w-full h-full"
                src={cover}
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <span className="text-6xl">📖</span>
              </div>
            )}
            {/* Delete Button */}
            {onDelete && (
              <div
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-danger/90 hover:bg-danger flex items-center justify-center text-white cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
              >
                ✕
              </div>
            )}
          </div>
        </CardBody>
        <CardFooter className="flex flex-col items-start gap-2 p-3">
          {/* Title */}
          <h3 className="text-sm font-semibold line-clamp-2 w-full">{title}</h3>
          {/* Author */}
          <p className="text-xs text-default-500 line-clamp-1 w-full">
            {author}
          </p>
          {/* Progress */}
          {progress > 0 && (
            <div className="w-full">
              <Progress
                aria-label="Reading progress"
                className="w-full"
                color="primary"
                size="sm"
                value={progress}
              />
              <p className="text-xs text-default-400 mt-1">已读 {progress}%</p>
            </div>
          )}
          {/* Last Read */}
          <p className="text-xs text-default-400">{formatDate(lastReadAt)}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
