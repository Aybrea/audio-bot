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
import { getBook, updateLastReadTime } from "@/lib/epub-db";
import ePub from "epubjs";

const VIEWER_CONTAINER_ID = "epub-viewer-container";

interface EpubReaderProps {
  bookId?: string;
  onClose?: () => void;
}

export default function EpubReader({ bookId, onClose }: EpubReaderProps = {}) {
  const loadedSettings = loadInitialSettings();
  const [state, dispatch] = useReducer(readerReducer, {
    ...initialReaderState,
    settings: loadedSettings,
    // If fixedFooter is false, footer should be hidden initially
    footerVisible: loadedSettings.fixedFooter,
  });
  const renditionInitialized = useRef(false);
  const containerReady = useRef(false);
  const [currentChapter, setCurrentChapter] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);

  // Animated page navigation
  const navigateWithAnimation = useCallback(
    async (direction: "next" | "prev") => {
      if (!state.rendition || isAnimating) return;

      setIsAnimating(true);

      // Wait for fade out animation
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Navigate to next/prev page
      if (direction === "next") {
        state.rendition.next();
      } else {
        state.rendition.prev();
      }

      // Wait for page to load and fade in
      await new Promise((resolve) => setTimeout(resolve, 150));

      setIsAnimating(false);
    },
    [state.rendition, isAnimating],
  );

  // Handle click navigation (left side = prev, right side = next)
  const handleViewerClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!state.rendition || isAnimating) return;

      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const width = rect.width;
      const clickRatio = clickX / width;

      // Left 40% = previous page, Right 40% = next page, Middle 20% = no action
      if (clickRatio < 0.4) {
        navigateWithAnimation("prev");
      } else if (clickRatio > 0.6) {
        navigateWithAnimation("next");
      }
      // Middle area (0.4 - 0.6) does nothing to avoid accidental page turns
    },
    [state.rendition, isAnimating, navigateWithAnimation],
  );

  // Click navigation for iframe content using epub.js hooks
  useEffect(() => {
    if (state.status !== "ready" || !state.rendition) return;

    const handleContentClick = (event: MouseEvent) => {
      console.log("Click detected:", {
        clientX: event.clientX,
        viewportWidth: window.innerWidth,
        target: event.target,
        isAnimating,
      });

      if (isAnimating) return;

      // Get click position relative to the viewport
      const clickX = event.clientX;
      const viewportWidth = window.innerWidth;
      const clickRatio = clickX / viewportWidth;

      console.log("Click ratio:", clickRatio);

      // Left 40% = previous page, Right 40% = next page, Middle 20% = no action
      if (clickRatio < 0.4) {
        console.log("Navigating to previous page");
        event.preventDefault();
        event.stopPropagation();
        navigateWithAnimation("prev");
      } else if (clickRatio > 0.6) {
        console.log("Navigating to next page");
        event.preventDefault();
        event.stopPropagation();
        navigateWithAnimation("next");
      } else {
        console.log("Click in middle area, no action");
      }
    };

    // Use epub.js hooks to attach event to rendered content
    const attachClickHandler = () => {
      const iframe = state.rendition.manager?.container?.querySelector("iframe");

      if (iframe?.contentDocument?.body) {
        // Remove existing listener first to avoid duplicates
        iframe.contentDocument.body.removeEventListener(
          "click",
          handleContentClick,
        );
        // Add new listener
        iframe.contentDocument.body.addEventListener(
          "click",
          handleContentClick,
          true,
        ); // Use capture phase
      }
    };

    // Attach after a short delay to ensure iframe is ready
    const timer = setTimeout(attachClickHandler, 100);

    // Re-attach when page changes
    const handleDisplayed = () => {
      setTimeout(attachClickHandler, 100);
    };

    state.rendition.on("displayed", handleDisplayed);

    return () => {
      clearTimeout(timer);
      state.rendition.off("displayed", handleDisplayed);

      const iframe = state.rendition.manager?.container?.querySelector("iframe");

      if (iframe?.contentDocument?.body) {
        iframe.contentDocument.body.removeEventListener(
          "click",
          handleContentClick,
        );
      }
    };
  }, [state.status, state.rendition, isAnimating, navigateWithAnimation]);

  // Native touch event handlers (inspired by 2048 game)
  useEffect(() => {
    if (state.status !== "ready" || !state.rendition) return;

    // Get the actual epub viewer container element (like 2048 gets game-container)
    const viewerElement = document.getElementById(VIEWER_CONTAINER_ID);

    if (!viewerElement) return;

    let touchStartX: number;
    let touchStartY: number;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 1) return; // Ignore multi-touch

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;

      // Prevent browser gestures immediately
      event.preventDefault();
    };

    const handleTouchMove = (event: TouchEvent) => {
      // Prevent browser gestures during move
      event.preventDefault();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length > 0) return; // Ignore if still touching

      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const absDx = Math.abs(dx);

      const dy = touchEndY - touchStartY;
      const absDy = Math.abs(dy);

      const totalMovement = Math.max(absDx, absDy);

      // Distinguish between tap and swipe
      if (totalMovement < 10) {
        // This is a tap (not a swipe)
        const viewportWidth = window.innerWidth;
        const tapRatio = touchEndX / viewportWidth;

        console.log("Tap detected:", {
          touchEndX,
          viewportWidth,
          tapRatio,
        });

        // Left 30% = previous page, Right 30% = next page, Middle 40% = toggle footer or no action
        if (tapRatio < 0.3) {
          console.log("Tap on left side -> previous page");
          navigateWithAnimation("prev");
        } else if (tapRatio > 0.7) {
          console.log("Tap on right side -> next page");
          navigateWithAnimation("next");
        } else {
          // Middle area: toggle footer if not fixed
          if (!state.settings.fixedFooter) {
            console.log("Tap in middle area -> toggle footer");
            dispatch({ type: "TOGGLE_FOOTER" });
          } else {
            console.log("Tap in middle area -> no action (fixed footer mode)");
          }
        }
      } else if (totalMovement > 50) {
        // This is a swipe
        // Horizontal swipe is dominant
        if (absDx > absDy) {
          if (dx > 0) {
            console.log("Swipe right -> previous page");
            // Swipe right -> previous page
            navigateWithAnimation("prev");
          } else {
            console.log("Swipe left -> next page");
            // Swipe left -> next page
            navigateWithAnimation("next");
          }
        }
      }
      // Movement between 10-50px: ignore (might be accidental)
    };

    // Attach to container element
    viewerElement.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    viewerElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    viewerElement.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });

    // Also attach to iframe content (epub.js renders in iframe)
    const attachToIframe = () => {
      const iframe = viewerElement.querySelector("iframe");

      if (iframe && iframe.contentDocument) {
        const iframeDoc = iframe.contentDocument;

        iframeDoc.addEventListener("touchstart", handleTouchStart, {
          passive: false,
        });
        iframeDoc.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
        iframeDoc.addEventListener("touchend", handleTouchEnd, {
          passive: false,
        });
      }
    };

    // Attach immediately if iframe exists
    attachToIframe();

    // Also attach when rendition relocates (new page might create new iframe)
    const handleRelocated = () => {
      attachToIframe();
    };

    state.rendition.on("relocated", handleRelocated);

    return () => {
      viewerElement.removeEventListener("touchstart", handleTouchStart);
      viewerElement.removeEventListener("touchmove", handleTouchMove);
      viewerElement.removeEventListener("touchend", handleTouchEnd);

      // Remove from iframe if it exists
      const iframe = viewerElement.querySelector("iframe");

      if (iframe && iframe.contentDocument) {
        const iframeDoc = iframe.contentDocument;

        iframeDoc.removeEventListener("touchstart", handleTouchStart);
        iframeDoc.removeEventListener("touchmove", handleTouchMove);
        iframeDoc.removeEventListener("touchend", handleTouchEnd);
      }

      state.rendition.off("relocated", handleRelocated);
    };
  }, [state.status, state.rendition]);

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

  // Load book from IndexedDB if bookId is provided
  useEffect(() => {
    if (!bookId) return;

    const loadBookFromDB = async () => {
      dispatch({ type: "UPLOAD_START" });

      try {
        // Get book from IndexedDB
        const storedBook = await getBook(bookId);

        if (!storedBook) {
          throw new Error("Book not found");
        }

        // Create book instance from ArrayBuffer
        const book = ePub(storedBook.arrayBuffer);

        // Wait for metadata and navigation to load
        await book.loaded.metadata;
        await book.loaded.navigation;

        // Extract metadata
        let coverUrl: string | undefined;

        try {
          if (typeof book.coverUrl === "function") {
            coverUrl = (await book.coverUrl()) || undefined;
          }
        } catch (error) {
          coverUrl = undefined;
        }

        const metadata = {
          title: book.packaging.metadata.title || "Unknown Title",
          author: book.packaging.metadata.creator || "Unknown Author",
          identifier: storedBook.id,
          cover: coverUrl || storedBook.cover,
        };

        // Parse TOC
        const toc = book.navigation.toc.map((item: any) => ({
          id: item.id || item.href,
          label: item.label,
          href: item.href,
          subitems: item.subitems
            ? item.subitems.map((sub: any) => ({
                id: sub.id || sub.href,
                label: sub.label,
                href: sub.href,
              }))
            : undefined,
        }));

        dispatch({
          type: "UPLOAD_SUCCESS",
          book,
          metadata,
          toc,
        });

        // Update last read time
        await updateLastReadTime(bookId);
      } catch (error) {
        console.error("Failed to load book from IndexedDB:", error);
        dispatch({
          type: "UPLOAD_ERROR",
          error:
            error instanceof Error ? error.message : "Failed to load book",
        });
      }
    };

    loadBookFromDB();
  }, [bookId]);

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

  // Disable browser gestures globally when reader is active
  useEffect(() => {
    if (state.status === "ready") {
      // Save original styles
      const originalHtmlStyle = {
        overscrollBehaviorX: document.documentElement.style.overscrollBehaviorX,
        touchAction: document.documentElement.style.touchAction,
      };
      const originalBodyStyle = {
        overscrollBehaviorX: document.body.style.overscrollBehaviorX,
        touchAction: document.body.style.touchAction,
      };

      // Apply styles to disable gestures
      document.documentElement.style.overscrollBehaviorX = "none";
      document.documentElement.style.touchAction = "pan-y";
      document.body.style.overscrollBehaviorX = "none";
      document.body.style.touchAction = "pan-y";

      // Cleanup on unmount
      return () => {
        document.documentElement.style.overscrollBehaviorX =
          originalHtmlStyle.overscrollBehaviorX;
        document.documentElement.style.touchAction =
          originalHtmlStyle.touchAction;
        document.body.style.overscrollBehaviorX =
          originalBodyStyle.overscrollBehaviorX;
        document.body.style.touchAction = originalBodyStyle.touchAction;
      };
    }
  }, [state.status]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.status !== "ready" || !state.rendition) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigateWithAnimation("prev");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigateWithAnimation("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.status, state.rendition, navigateWithAnimation]);

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
            isLoading={false}
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
        <div
          className="fixed inset-0 flex flex-col bg-background"
          style={{
            overscrollBehaviorX: "none",
            touchAction: "pan-y",
          }}
        >
          {/* Header - Mobile Optimized */}
          {(state.settings.fixedFooter || state.footerVisible) && (
            <header
              className={`
                ${
                  state.settings.fixedFooter
                    ? "flex-shrink-0"
                    : "absolute top-0 left-0 right-0 z-50 shadow-lg"
                }
                border-b border-divider px-3 py-2 md:px-4 md:py-3
                bg-background transition-all duration-300
                ${state.footerVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
              `}
            >
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
                  onPress={() => {
                    // Reset refs before closing
                    renditionInitialized.current = false;
                    containerReady.current = false;
                    setCurrentChapter("");
                    dispatch({ type: "CLOSE_BOOK" });
                    // Call onClose callback if provided
                    onClose?.();
                  }}
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
          )}

          {/* Viewer - Full Height with Native Touch Support */}
          <div
            className="flex-1 overflow-hidden transition-opacity duration-300 cursor-pointer"
            style={{ opacity: isAnimating ? 0 : 1 }}
            onClick={handleViewerClick}
          >
            <EpubViewer
              containerId={VIEWER_CONTAINER_ID}
              onReady={handleContainerReady}
            />
          </div>

          {/* Footer - Mobile Optimized */}
          {(state.settings.fixedFooter || state.footerVisible) && (
            <footer
              className={`
                ${
                  state.settings.fixedFooter
                    ? "flex-shrink-0"
                    : "absolute bottom-0 left-0 right-0 z-50 shadow-lg"
                }
                border-t border-divider px-3 py-2 md:px-4 md:py-3 safe-area-inset-bottom
                bg-background transition-all duration-300
                ${state.footerVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
              `}
            >
              <EpubControls
                onNext={() => navigateWithAnimation("next")}
                onPrev={() => navigateWithAnimation("prev")}
                onToggleToc={() => dispatch({ type: "TOGGLE_TOC" })}
                onToggleSettings={() => dispatch({ type: "TOGGLE_SETTINGS" })}
              />
            </footer>
          )}

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
            onFixedFooterChange={(fixedFooter) =>
              dispatch({ type: "UPDATE_FIXED_FOOTER", fixedFooter })
            }
          />
        </div>
      )}
    </div>
  );
}
