import { readdir, readFile } from "fs/promises";
import { join } from "path";

import { NextResponse } from "next/server";

interface SampleMetadata {
  [key: string]: {
    name: string;
    referenceText?: string;
    description?: string;
  };
}

export async function GET() {
  try {
    const samplesDir = join(process.cwd(), "public", "sample");
    const files = await readdir(samplesDir);

    // 读取元数据
    let metadata: SampleMetadata = {};

    try {
      const metadataPath = join(samplesDir, "metadata.json");
      const metadataContent = await readFile(metadataPath, "utf-8");

      metadata = JSON.parse(metadataContent);
    } catch {
      // eslint-disable-next-line no-console
      console.warn("No metadata.json found, using default metadata");
    }

    // 过滤音频文件
    const audioFiles = files.filter((file) => {
      const ext = file.toLowerCase().split(".").pop();

      return ["wav", "mp3", "ogg", "m4a"].includes(ext || "");
    });

    // 返回文件信息和元数据
    const fileList = audioFiles.map((file) => ({
      name: file,
      path: `/sample/${file}`,
      displayName: metadata[file]?.name || file,
      referenceText: metadata[file]?.referenceText || "",
      description: metadata[file]?.description || "",
    }));

    return NextResponse.json(fileList);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to read samples directory:", error);

    return NextResponse.json(
      { error: "Failed to read samples directory" },
      { status: 500 },
    );
  }
}
