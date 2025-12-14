import type { Metadata } from "next";

import { EpubPageContent } from "@/components/epub-page-content";

export const metadata: Metadata = {
  title: "EPUB 阅读器",
  description: "在线 EPUB 电子书阅读器，支持目录导航、阅读进度保存和字体调整",
};

export default function EpubPage() {
  return <EpubPageContent />;
}
