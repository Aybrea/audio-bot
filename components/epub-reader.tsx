"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Button } from "@heroui/button";

import { EpubUpload } from "./epub-upload";
import { EpubViewer } from "./epub-viewer";
import { EpubControls } from "./epub-controls";
import { EpubToc } from "./epub-toc";
import { EpubSettings } from "./epub-settings";

import {
  initialReaderState,
  initializeRendition,
  loadEpubFromFile,
  loadInitialSettings,
  readerReducer,
} from "@/lib/epub-engine";
import type { ReadingLocation } from "@/types/epub";

const VIEWER_CONTAINER_ID = "epub-viewer-container";

export default function EpubReader() {
  const [state, dispatch] = useReducer(readerReducer, {
    ...initialReaderState,
    settings: loadInitialSettings(),
  });
  const renditionInitialized = useRef(false);
  const containerReady = useRef(false);
  const [currentChapter, setCurrentChapter] = useState<string>("");

  // Helper function to find chapter name from TOC
  const findChapterName = (href: string, toc: any[]): string => {
    for (const item of toc) {
      if (item.href && href.includes(item.href)) {
        return item.label;
      }
      if (item.subitems) {
        const found = findChapterName(href, item.subitems);

        if (found) return found;
      }
    }

    return "";
  };

  // Handle file upload
  const handleFileSelect = async (file: File) => {
    dispatch({ type: "UPLOAD_START" });

    try {
      const { book, metadata, toc } = await loadEpubFromFile(file);

      dispatch({
        type: "UPLOAD_SUCCESS",
        book,
        metadata,
        toc,
      });
    } catch (error) {
      dispatch({
        type: "UPLOAD_ERROR",
        error: error instanceof Error ? error.message : "Failed to load EPUB",
      });
    }
  };

  // Initialize rendition when book is loaded AND container is ready
  useEffect(() => {
    if (
      state.status === "ready" &&
      state.book &&
      state.metadata &&
      containerReady.current &&
      !renditionInitialized.current
    ) {
      const initRendition = async () => {
        try {
          // Small delay to ensure DOM is fully ready
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Location change handler
          const handleLocationChange = (location: any) => {
            // Calculate percentage using multiple methods
            let percentage = 0;

            // Method 1: Calculate from displayed page numbers (PRIORITY)
            if (
              location.start.displayed?.page &&
              location.start.displayed?.total
            ) {
              percentage = Math.round(
                (location.start.displayed.page /
                  location.start.displayed.total) *
                  100,
              );
            }
            // Method 2: Use location.start.percentage (fallback)
            else if (
              location.start.percentage !== undefined &&
              location.start.percentage > 0
            ) {
              percentage = Math.round(location.start.percentage * 100);
            }

            // Find chapter name from TOC
            const chapterName = state.toc
              ? findChapterName(location.start.href, state.toc)
              : "";

            setCurrentChapter(chapterName);

            const readingLocation: ReadingLocation = {
              cfi: location.start.cfi,
              percentage: percentage,
              chapter: location.start.displayed?.page || "1",
            };

            dispatch({
              type: "LOCATION_CHANGED",
              location: readingLocation,
            });
          };

          const { rendition } = await initializeRendition(
            state.book,
            VIEWER_CONTAINER_ID,
            state.metadata!.identifier,
            state.settings,
            handleLocationChange,
          );

          renditionInitialized.current = true;

          dispatch({
            type: "RENDITION_READY",
            rendition,
          });
        } catch (error) {
          console.error("Failed to initialize rendition:", error);
          dispatch({
            type: "UPLOAD_ERROR",
            error: "Failed to display book content",
          });
        }
      };

      initRendition();
    }
  }, [state.status, state.book, state.metadata, state.settings]);

  // Handle container ready
  const handleContainerReady = useCallback(() => {
    if (containerReady.current) return; // Prevent multiple calls
    containerReady.current = true;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.status !== "ready" || !state.rendition) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        state.rendition.prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        state.rendition.next();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.status, state.rendition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.rendition) {
        state.rendition.destroy();
      }
    };
  }, [state.rendition]);

  return (
    <div className="flex flex-col items-center gap-4 md:gap-6 w-full">
      {/* Upload or Error State */}
      {(state.status === "idle" || state.status === "error") && (
        <div className="w-full flex flex-col items-center gap-4">
          <EpubUpload
            isLoading={state.status === "loading"}
            onFileSelect={handleFileSelect}
          />
          {state.errorMessage && (
            <div className="text-danger text-center max-w-2xl">
              <p className="font-semibold">错误</p>
              <p className="text-sm">{state.errorMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {state.status === "loading" && (
        <div className="w-full flex flex-col items-center gap-4">
          <EpubUpload isLoading={true} onFileSelect={handleFileSelect} />
        </div>
      )}

      {/* Reader State - Full Screen Layout */}
      {state.status === "ready" && state.metadata && (
        <div className="fixed inset-0 flex flex-col bg-background">
          {/* Header - Mobile Optimized */}
          <header className="flex-shrink-0 border-b border-divider px-3 py-2 md:px-4 md:py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-sm md:text-lg font-semibold truncate">
                  {state.metadata.title}
                </h1>
                <div className="flex items-center gap-2 text-xs md:text-sm text-default-500">
                  <span className="truncate">{state.metadata.author}</span>
                  {state.currentLocation && (
                    <>
                      <span>•</span>
                      <span>{state.currentLocation.percentage}%</span>
                    </>
                  )}
                </div>
              </div>
              <Button
                color="default"
                size="sm"
                variant="flat"
                isIconOnly
                className="md:w-auto md:px-4"
                onPress={() => dispatch({ type: "CLOSE_BOOK" })}
              >
                <span className="hidden md:inline">关闭</span>
                <span className="md:hidden">✕</span>
              </Button>
            </div>
            {/* Chapter info - Hidden on mobile, shown on desktop */}
            {currentChapter && (
              <p className="hidden md:block text-xs text-default-400 truncate mt-1">
                {currentChapter}
              </p>
            )}
          </header>

          {/* Viewer - Full Height */}
          <div className="flex-1 overflow-hidden">
            <EpubViewer
              containerId={VIEWER_CONTAINER_ID}
              onReady={handleContainerReady}
            />
          </div>

          {/* Footer - Mobile Optimized */}
          <footer className="flex-shrink-0 border-t border-divider px-3 py-2 md:px-4 md:py-3 safe-area-inset-bottom">
            <EpubControls
              onNext={() => {
                if (state.rendition) {
                  state.rendition.next();
                }
              }}
              onPrev={() => {
                if (state.rendition) {
                  state.rendition.prev();
                }
              }}
              onToggleToc={() => dispatch({ type: "TOGGLE_TOC" })}
              onToggleSettings={() => dispatch({ type: "TOGGLE_SETTINGS" })}
            />
          </footer>

          {/* TOC Modal */}
          <EpubToc
            isOpen={state.tocOpen}
            toc={state.toc}
            onClose={() => dispatch({ type: "TOGGLE_TOC" })}
            onNavigate={(href) => dispatch({ type: "NAVIGATE_TO", href })}
          />

          {/* Settings Modal */}
          <EpubSettings
            isOpen={state.settingsOpen}
            settings={state.settings}
            onClose={() => dispatch({ type: "TOGGLE_SETTINGS" })}
            onFontSizeChange={(fontSize) =>
              dispatch({ type: "UPDATE_FONT_SIZE", fontSize })
            }
          />
        </div>
      )}
    </div>
  );
}
