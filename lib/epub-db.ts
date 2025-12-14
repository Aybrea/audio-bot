// IndexedDB storage for EPUB files
import type { BookMetadata } from "@/types/epub";

const DB_NAME = "epub-library";
const DB_VERSION = 1;
const STORE_NAME = "books";

export interface StoredBook {
  id: string;
  title: string;
  author: string;
  cover?: string;
  arrayBuffer: ArrayBuffer;
  addedAt: number;
  lastReadAt: number;
}

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });

        objectStore.createIndex("addedAt", "addedAt", { unique: false });
        objectStore.createIndex("lastReadAt", "lastReadAt", { unique: false });
      }
    };
  });
}

// Save EPUB book to IndexedDB
export async function saveBook(
  metadata: BookMetadata,
  arrayBuffer: ArrayBuffer,
): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  const book: StoredBook = {
    id: metadata.identifier,
    title: metadata.title,
    author: metadata.author,
    cover: metadata.cover,
    arrayBuffer,
    addedAt: Date.now(),
    lastReadAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.put(book);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get all books from IndexedDB
export async function getAllBooks(): Promise<
  Omit<StoredBook, "arrayBuffer">[]
> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      // Exclude arrayBuffer from the result to save memory
      const books = request.result.map((book: StoredBook) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        cover: book.cover,
        addedAt: book.addedAt,
        lastReadAt: book.lastReadAt,
      }));

      resolve(books);
    };
    request.onerror = () => reject(request.error);
  });
}

// Get a single book by ID
export async function getBook(id: string): Promise<StoredBook | null> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Update last read time
export async function updateLastReadTime(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const book = getRequest.result;

      if (book) {
        book.lastReadAt = Date.now();
        const putRequest = store.put(book);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Delete a book
export async function deleteBook(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
