"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";

import { EpubBookCard } from "./epub-book-card";
import { EpubUpload } from "./epub-upload";

import { getAllBooks, deleteBook, saveBook } from "@/lib/epub-db";
import { loadReadingProgress } from "@/lib/epub-storage";
import { loadEpubFromFile } from "@/lib/epub-engine";

interface BookWithProgress {
  id: string;
  title: string;
  author: string;
  cover?: string;
  progress: number;
  lastReadAt: number;
}

interface EpubLibraryProps {
  onOpenBook: (bookId: string) => void;
}

export function EpubLibrary({ onOpenBook }: EpubLibraryProps) {
  const [books, setBooks] = useState<BookWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Load books from IndexedDB
  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const storedBooks = await getAllBooks();

      // Add progress information from localStorage
      const booksWithProgress = storedBooks.map((book) => {
        const progress = loadReadingProgress(book.id);

        return {
          ...book,
          progress: progress?.percentage || 0,
        };
      });

      // Sort by last read time (most recent first)
      booksWithProgress.sort((a, b) => b.lastReadAt - a.lastReadAt);

      setBooks(booksWithProgress);
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Handle file upload
  const handleFileSelect = async (file: File) => {
    try {
      setIsUploading(true);

      // Load EPUB file
      const { book, metadata } = await loadEpubFromFile(file);

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Save to IndexedDB
      await saveBook(metadata, arrayBuffer);

      // Reload books list
      await loadBooks();

      setShowUpload(false);
    } catch (error) {
      console.error("Failed to upload book:", error);
      alert("上传失败，请检查文件格式");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle delete book
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("确定要删除这本书吗？")) return;

    try {
      await deleteBook(bookId);
      await loadBooks();
    } catch (error) {
      console.error("Failed to delete book:", error);
      alert("删除失败");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-default-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* Upload Section */}
      {showUpload && (
        <div className="mb-8">
          <EpubUpload
            isLoading={isUploading}
            onFileSelect={handleFileSelect}
          />
        </div>
      )}

      {/* Books Grid */}
      {books.length === 0 && !showUpload ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <span className="text-8xl mb-4">📚</span>
          <h3 className="text-xl font-semibold mb-2">书库是空的</h3>
          <p className="text-default-500 mb-6">
            点击下方按钮上传您的第一本 EPUB 电子书
          </p>
          <Button
            color="primary"
            size="lg"
            onPress={() => setShowUpload(true)}
          >
            + 添加书籍
          </Button>
        </div>
      ) : !showUpload ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Add Book Card */}
          <Card
            isPressable
            className="w-full"
            onPress={() => setShowUpload(true)}
          >
            <CardBody className="p-0">
              <div className="relative w-full aspect-[2/3] bg-default-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-5xl">+</span>
                  <span className="text-sm font-medium">添加书籍</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Book Cards */}
          {books.map((book) => (
            <EpubBookCard
              key={book.id}
              author={book.author}
              cover={book.cover}
              id={book.id}
              lastReadAt={book.lastReadAt}
              progress={book.progress}
              title={book.title}
              onDelete={handleDeleteBook}
              onOpen={onOpenBook}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
