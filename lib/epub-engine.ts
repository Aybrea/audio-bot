import type {
  BookMetadata,
  ReaderAction,
  ReaderState,
  TOCItem,
} from "@/types/epub";

import ePub from "epubjs";

import { generateBookId, readFileAsArrayBuffer } from "@/lib/epub-utils";
import {
  addRecentBook,
  loadReadingProgress,
  loadSettings,
  saveReadingProgress,
  saveSettings,
} from "@/lib/epub-storage";

// Initial state
export const initialReaderState: ReaderState = {
  status: "idle",
  book: null,
  rendition: null,
  metadata: null,
  toc: [],
  currentLocation: null,
  settings: {
    fontSize: 18,
    fontFamily: "serif",
    theme: "light",
    fixedFooter: true, // Default to fixed footer
  },
  tocOpen: false,
  settingsOpen: false,
  footerVisible: true, // Default to visible
  errorMessage: null,
};

// Load EPUB from uploaded file
export async function loadEpubFromFile(file: File): Promise<{
  book: any;
  metadata: BookMetadata;
  toc: TOCItem[];
}> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(file);

    // Create book instance
    const book = ePub(arrayBuffer);

    // Wait for metadata and navigation to load
    await book.loaded.metadata;
    await book.loaded.navigation;

    // Extract metadata
    let coverUrl: string | undefined;

    try {
      // coverUrl is a method that returns a Promise
      if (typeof book.coverUrl === "function") {
        coverUrl = (await book.coverUrl()) || undefined;
      }
    } catch (error) {
      // Cover is optional, ignore errors
      coverUrl = undefined;
    }

    const metadata: BookMetadata = {
      title: book.packaging.metadata.title || "Unknown Title",
      author: book.packaging.metadata.creator || "Unknown Author",
      identifier: generateBookId(book.packaging.metadata),
      cover: coverUrl,
    };

    // Parse table of contents
    const toc = parseTOC(book.navigation.toc);

    return { book, metadata, toc };
  } catch (error) {
    console.error("Failed to load EPUB:", error);
    throw new Error("Failed to load EPUB file. Please check the file format.");
  }
}

// Parse TOC from epub.js navigation
function parseTOC(navItems: any[]): TOCItem[] {
  return navItems.map((item) => ({
    id: item.id || item.href,
    label: item.label,
    href: item.href,
    subitems: item.subitems ? parseTOC(item.subitems) : undefined,
  }));
}

// Initialize rendition and restore progress
export async function initializeRendition(
  book: any,
  containerId: string,
  bookId: string,
  settings: ReaderState["settings"],
  onLocationChange?: (location: any) => void,
): Promise<{ rendition: any }> {
  // Create rendition
  const rendition = book.renderTo(containerId, {
    width: "100%",
    height: "100%",
    spread: "none",
    flow: "paginated",
    allowScriptedContent: true,
    snap: true, // Enable snapping for smoother transitions
  });

  // Register animation theme
  rendition.themes.register("animated", {
    body: {
      transition: "opacity 0.3s ease-in-out !important",
    },
    "*": {
      transition: "opacity 0.3s ease-in-out !important",
    },
  });

  // Apply animation theme
  rendition.themes.select("animated");

  // Apply settings
  rendition.themes.fontSize(`${settings.fontSize}px`);

  if (settings.fontFamily) {
    rendition.themes.font(settings.fontFamily);
  }

  // Attach location change listener BEFORE displaying
  if (onLocationChange) {
    rendition.on("relocated", onLocationChange);
  }

  // Try to restore previous reading position
  const savedProgress = loadReadingProgress(bookId);

  if (savedProgress && savedProgress.cfi) {
    await rendition.display(savedProgress.cfi);
  } else {
    await rendition.display();
  }

  return { rendition };
}

// Reducer
export function readerReducer(
  state: ReaderState,
  action: ReaderAction,
): ReaderState {
  switch (action.type) {
    case "UPLOAD_START":
      return {
        ...state,
        status: "loading",
        errorMessage: null,
      };

    case "UPLOAD_SUCCESS":
      return {
        ...state,
        status: "ready",
        book: action.book,
        metadata: action.metadata,
        toc: action.toc,
        errorMessage: null,
      };

    case "UPLOAD_ERROR":
      return {
        ...state,
        status: "error",
        errorMessage: action.error,
      };

    case "RENDITION_READY":
      return {
        ...state,
        rendition: action.rendition,
      };

    case "LOCATION_CHANGED": {
      // Save progress to localStorage
      if (state.metadata) {
        const bookId = state.metadata.identifier;

        saveReadingProgress(bookId, action.location);
        addRecentBook(
          bookId,
          state.metadata.title,
          state.metadata.author,
          action.location,
        );
      }

      return {
        ...state,
        currentLocation: action.location,
      };
    }

    case "NAVIGATE_PREV":
      if (state.rendition) {
        state.rendition.prev();
      }

      return state;

    case "NAVIGATE_NEXT":
      if (state.rendition) {
        state.rendition.next();
      }

      return state;

    case "NAVIGATE_TO":
      if (state.rendition) {
        state.rendition.display(action.href);
      }

      return {
        ...state,
        tocOpen: false,
      };

    case "TOGGLE_TOC":
      return {
        ...state,
        tocOpen: !state.tocOpen,
        settingsOpen: false,
      };

    case "TOGGLE_SETTINGS":
      return {
        ...state,
        settingsOpen: !state.settingsOpen,
        tocOpen: false,
      };

    case "UPDATE_FONT_SIZE": {
      const newSettings = {
        ...state.settings,
        fontSize: action.fontSize,
      };

      // Apply to rendition
      if (state.rendition) {
        state.rendition.themes.fontSize(`${action.fontSize}px`);
      }

      // Save to localStorage
      saveSettings(newSettings);

      return {
        ...state,
        settings: newSettings,
      };
    }

    case "UPDATE_FIXED_FOOTER": {
      const newSettings = {
        ...state.settings,
        fixedFooter: action.fixedFooter,
      };

      // Save to localStorage
      saveSettings(newSettings);

      return {
        ...state,
        settings: newSettings,
        // If switching to fixed mode, make footer visible
        footerVisible: action.fixedFooter ? true : state.footerVisible,
      };
    }

    case "TOGGLE_FOOTER":
      return {
        ...state,
        footerVisible: !state.footerVisible,
      };

    case "CLOSE_BOOK":
      // Clean up rendition
      if (state.rendition) {
        state.rendition.destroy();
      }

      return {
        ...initialReaderState,
        settings: state.settings, // Preserve settings
      };

    case "RESTORE_PROGRESS":
      if (state.rendition) {
        state.rendition.display(action.location);
      }

      return state;

    default:
      return state;
  }
}

// Load initial settings from localStorage
export function loadInitialSettings(): ReaderState["settings"] {
  const saved = loadSettings();

  return saved || initialReaderState.settings;
}
