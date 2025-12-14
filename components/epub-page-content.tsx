"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@heroui/spinner";

import { EpubLibrary } from "./epub-library";

// 懒加载 EpubReader 组件（包含 epubjs 库）
const EpubReader = dynamic(() => import("./epub-reader"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spinner color="primary" size="lg" />
        <p className="mt-4 text-default-600">加载阅读器中...</p>
      </div>
    </div>
  ),
  ssr: false, // EPUB 阅读器依赖浏览器 API，禁用 SSR
});

export function EpubPageContent() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  if (selectedBookId) {
    return (
      <EpubReader
        bookId={selectedBookId}
        onClose={() => setSelectedBookId(null)}
      />
    );
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="w-full px-4">
        <EpubLibrary onOpenBook={(bookId) => setSelectedBookId(bookId)} />
      </div>
    </section>
  );
}
