"use client";

import type { Tile } from "@/lib/game-2048-engine";

interface Game2048BoardProps {
  tiles: Tile[];
  size: number;
}

export function Game2048Board({ tiles, size }: Game2048BoardProps) {
  // Calculate cell size and gap based on screen size
  // Desktop: 106.25px cells, 15px gap
  // Mobile: 57.5px cells, 10px gap
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const cellSize = isMobile ? 57.5 : 106.25;
  const gap = isMobile ? 10 : 15;
  const containerSize = isMobile ? 280 : 530;
  const containerPadding = isMobile ? 10 : 15;

  // Get tile position in pixels
  const getTilePosition = (x: number, y: number) => {
    const translateX = x * (cellSize + gap);
    const translateY = y * (cellSize + gap);

    return `translate(${translateX}px, ${translateY}px)`;
  };

  // Get tile color class
  const getTileColorClass = (value: number) => {
    const colorMap: Record<number, string> = {
      2: "bg-[#eee4da] text-[#776e65]",
      4: "bg-[#ede0c8] text-[#776e65]",
      8: "bg-[#f2b179] text-[#f9f6f2]",
      16: "bg-[#f59563] text-[#f9f6f2]",
      32: "bg-[#f67c5f] text-[#f9f6f2]",
      64: "bg-[#f65e3b] text-[#f9f6f2]",
      128: "bg-[#edcf72] text-[#f9f6f2]",
      256: "bg-[#edcc61] text-[#f9f6f2]",
      512: "bg-[#edc850] text-[#f9f6f2]",
      1024: "bg-[#edc53f] text-[#f9f6f2]",
      2048: "bg-[#edc22e] text-[#f9f6f2]",
    };

    return colorMap[value] || "bg-[#3c3a32] text-[#f9f6f2]";
  };

  // Get font size based on value
  const getFontSize = (value: number) => {
    if (value < 100) return "text-5xl";
    if (value < 1000) return "text-4xl";
    if (value < 10000) return "text-3xl";

    return "text-2xl";
  };

  return (
    <div
      className="relative bg-[#bbada0] rounded-md mx-auto"
      style={{
        padding: `${containerPadding}px`,
        width: `${containerSize}px`,
        height: `${containerSize}px`,
      }}
    >
      {/* Background grid */}
      <div className="relative z-[1]">
        {Array.from({ length: size }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex last:mb-0"
            style={{
              gap: `${gap}px`,
              marginBottom: rowIndex < size - 1 ? `${gap}px` : "0",
            }}
          >
            {Array.from({ length: size }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="rounded-[3px] bg-[rgba(238,228,218,0.35)]"
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tiles */}
      <div
        className="absolute z-[2]"
        style={{
          top: `${containerPadding}px`,
          left: `${containerPadding}px`,
        }}
      >
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className="absolute transition-transform duration-100 ease-in-out"
            style={{
              transform: getTilePosition(tile.x, tile.y),
            }}
          >
            <div
              className={`rounded-[3px] flex items-center justify-center font-bold ${getTileColorClass(tile.value)} ${getFontSize(tile.value)} ${tile.isNew ? "animate-tile-appear" : ""} ${tile.mergedFrom ? "animate-tile-pop" : ""}`}
              style={{
                width: `${cellSize + 1}px`,
                height: `${cellSize + 1}px`,
                lineHeight: `${cellSize + 1}px`,
              }}
            >
              {tile.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
