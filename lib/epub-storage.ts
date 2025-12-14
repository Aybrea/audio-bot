import type { ReaderSettings, ReadingLocation } from "@/types/epub";

// Storage keys
const SETTINGS_KEY = "epub-reader-settings";
const RECENT_BOOKS_KEY = "epub-reader-recent";

interface StoredBook {
  identifier: string;
  title: string;
  author: string;
  lastRead: number;
  location: string;
  percentage: number;
}

// Save reading progress for a specific book
export function saveReadingProgress(
  bookId: string,
  location: ReadingLocation,
): void {
  if (typeof window === "undefined") return;

  try {
    const key = `epub-reader-book-${bookId}`;

    localStorage.setItem(
      key,
      JSON.stringify({
        cfi: location.cfi,
        percentage: location.percentage,
        chapter: location.chapter,
        lastRead: Date.now(),
      }),
    );
  } catch (error) {
    console.error("Failed to save reading progress:", error);
  }
}

// Load reading progress for a specific book
export function loadReadingProgress(bookId: string): ReadingLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const key = `epub-reader-book-${bookId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const data = JSON.parse(stored);

    return {
      cfi: data.cfi,
      percentage: data.percentage,
      chapter: data.chapter,
    };
  } catch (error) {
    console.error("Failed to load reading progress:", error);

    return null;
  }
}

// Save reader settings
export function saveSettings(settings: ReaderSettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

// Load reader settings
export function loadSettings(): ReaderSettings | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);

    if (!stored) return null;

    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load settings:", error);

    return null;
  }
}

// Get recent books
export function getRecentBooks(): StoredBook[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(RECENT_BOOKS_KEY);

    if (!stored) return [];

    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load recent books:", error);

    return [];
  }
}

// Add book to recent list
export function addRecentBook(
  identifier: string,
  title: string,
  author: string,
  location: ReadingLocation,
): void {
  if (typeof window === "undefined") return;

  try {
    const recent = getRecentBooks();
    const existing = recent.findIndex((b) => b.identifier === identifier);

    const bookData: StoredBook = {
      identifier,
      title,
      author,
      lastRead: Date.now(),
      location: location.cfi,
      percentage: location.percentage,
    };

    if (existing >= 0) {
      recent[existing] = bookData;
    } else {
      recent.unshift(bookData);
    }

    // Keep only last 10 books
    const trimmed = recent.slice(0, 10);

    localStorage.setItem(RECENT_BOOKS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to add recent book:", error);
  }
}

// Remove book from storage
export function removeBook(bookId: string): void {
  if (typeof window === "undefined") return;

  try {
    const key = `epub-reader-book-${bookId}`;

    localStorage.removeItem(key);

    // Also remove from recent list
    const recent = getRecentBooks();
    const filtered = recent.filter((b) => b.identifier !== bookId);

    localStorage.setItem(RECENT_BOOKS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove book:", error);
  }
}
