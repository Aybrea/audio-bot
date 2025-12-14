// EPUB reader type definitions

export interface BookMetadata {
  title: string;
  author: string;
  identifier: string;
  cover?: string;
}

export interface TOCItem {
  id: string;
  label: string;
  href: string;
  subitems?: TOCItem[];
}

export interface ReadingLocation {
  cfi: string;
  percentage: number;
  chapter: string;
}

export type ReaderStatus = "idle" | "loading" | "ready" | "error";

export interface ReaderSettings {
  fontSize: number;
  fontFamily?: string;
  theme?: "light" | "dark" | "sepia";
  fixedFooter: boolean; // Whether to keep footer always visible
}

export interface ReaderState {
  status: ReaderStatus;
  book: any | null;
  rendition: any | null;
  metadata: BookMetadata | null;
  toc: TOCItem[];
  currentLocation: ReadingLocation | null;
  settings: ReaderSettings;
  tocOpen: boolean;
  settingsOpen: boolean;
  footerVisible: boolean; // Whether footer is currently visible (for non-fixed mode)
  errorMessage: string | null;
}

export type ReaderAction =
  | { type: "UPLOAD_START" }
  | {
      type: "UPLOAD_SUCCESS";
      book: any;
      metadata: BookMetadata;
      toc: TOCItem[];
    }
  | { type: "UPLOAD_ERROR"; error: string }
  | { type: "RENDITION_READY"; rendition: any }
  | { type: "LOCATION_CHANGED"; location: ReadingLocation }
  | { type: "NAVIGATE_PREV" }
  | { type: "NAVIGATE_NEXT" }
  | { type: "NAVIGATE_TO"; href: string }
  | { type: "TOGGLE_TOC" }
  | { type: "TOGGLE_SETTINGS" }
  | { type: "UPDATE_FONT_SIZE"; fontSize: number }
  | { type: "UPDATE_FIXED_FOOTER"; fixedFooter: boolean }
  | { type: "TOGGLE_FOOTER" }
  | { type: "CLOSE_BOOK" }
  | { type: "RESTORE_PROGRESS"; location: string };
