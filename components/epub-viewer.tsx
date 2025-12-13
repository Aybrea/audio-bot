"use client";

import { useEffect, useRef } from "react";

interface EpubViewerProps {
  containerId: string;
  onReady?: () => void;
}

export function EpubViewer({ containerId, onReady }: EpubViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && onReady) {
      onReady();
    }
  }, [onReady]);

  return (
    <div
      ref={containerRef}
      className="epub-viewer-container w-full h-full overflow-auto"
      id={containerId}
      style={{
        backgroundColor: "var(--heroui-background)",
      }}
    />
  );
}
