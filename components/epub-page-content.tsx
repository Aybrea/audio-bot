"use client";

import { useState } from "react";

import { EpubLibrary } from "./epub-library";
import EpubReader from "./epub-reader";

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
