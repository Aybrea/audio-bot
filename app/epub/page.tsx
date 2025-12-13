import type { Metadata } from "next";

import EpubReader from "@/components/epub-reader";

export const metadata: Metadata = {
  title: "EPUB 阅读器",
  description: "在线 EPUB 电子书阅读器，支持目录导航、阅读进度保存和字体调整",
};

export default function EpubPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-4xl text-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          EPUB 阅读器
        </h1>
        <p className="text-lg text-default-600 mb-8">
          上传您的 EPUB 文件开始阅读
        </p>
      </div>

      <div className="w-full px-4">
        <EpubReader />
      </div>

      <div className="max-w-2xl text-center mt-8 text-sm text-default-500">
        <p>
          支持功能：翻页导航、目录跳转、阅读进度保存、字体大小调整
        </p>
        <p className="mt-2">
          所有文件在浏览器本地处理，不会上传到服务器
        </p>
      </div>
    </section>
  );
}
