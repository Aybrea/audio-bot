"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

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

      // Convert blob URL to base64 if needed
      if (metadata.cover && metadata.cover.startsWith("blob:")) {
        try {
          const response = await fetch(metadata.cover);
          const blob = await response.blob();
          const reader = new FileReader();

          metadata.cover = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Failed to convert cover to base64:", error);
          metadata.cover = undefined;
        }
      }

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

  // Handle delete book - show confirmation modal
  const handleDeleteBook = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);

    if (book) {
      setBookToDelete({ id: book.id, title: book.title });
      setDeleteConfirmOpen(true);
    }
  };

  // Confirm delete book
  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;

    try {
      await deleteBook(bookToDelete.id);
      await loadBooks();
      setDeleteConfirmOpen(false);
      setBookToDelete(null);
    } catch (error) {
      console.error("Failed to delete book:", error);
      alert("删除失败");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="加载中" size="lg" />
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        placement="center"
        onClose={() => {
          setDeleteConfirmOpen(false);
          setBookToDelete(null);
        }}
      >
        <ModalContent>
          <ModalHeader className="flex justify-center">确认删除</ModalHeader>
          <ModalBody className="text-center">
            <p>确定要删除《{bookToDelete?.title}》吗？</p>
          </ModalBody>
          <ModalFooter className="flex justify-center gap-2">
            <Button
              color="default"
              variant="flat"
              onPress={() => {
                setDeleteConfirmOpen(false);
                setBookToDelete(null);
              }}
            >
              取消
            </Button>
            <Button color="danger" onPress={confirmDeleteBook}>
              删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
