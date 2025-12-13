"use client";

import { useEffect, useState } from "react";

export default function ChristmasSceneMobile() {
  const [stars, setStars] = useState<
    Array<{ id: number; size: number; left: number; top: number }>
  >([]);
  const [snowflakes, setSnowflakes] = useState<
    Array<{
      id: number;
      size: number;
      left: number;
      top: number;
      duration: number;
      delay: number;
    }>
  >([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        size: Math.random() * 2 + 1,
        left: Math.random() * 100,
        top: Math.random() * 60,
      })),
    );

    setSnowflakes(
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        size: Math.random() * 6 + 3,
        left: Math.random() * 100,
        top: Math.random() * -20,
        duration: Math.random() * 8 + 12,
        delay: Math.random() * 5,
      })),
    );
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800">
      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes snowfall {
          from {
            transform: translateY(-10vh);
          }
          to {
            transform: translateY(110vh);
          }
        }
      `}</style>

      {/* Static stars */}
      {stars.map((star) => (
        <div
          key={`star-${star.id}`}
          className="absolute bg-white rounded-full"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.left}%`,
            top: `${star.top}%`,
            animation: "twinkle 3s ease-in-out infinite",
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Simple falling snow */}
      {snowflakes.map((flake) => (
        <div
          key={`snow-${flake.id}`}
          className="absolute bg-white rounded-full opacity-70"
          style={{
            width: flake.size,
            height: flake.size,
            left: `${flake.left}%`,
            top: `${flake.top}%`,
            animation: `snowfall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}

      {/* Static moon */}
      <div className="absolute top-8 right-8 w-20 h-20">
        <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full shadow-lg" />
      </div>

      {/* Static ground */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg
          className="w-full h-auto"
          preserveAspectRatio="none"
          viewBox="0 0 1200 200"
        >
          <defs>
            <linearGradient id="snowGradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path
            d="M0,80 Q300,60 600,80 T1200,80 L1200,200 L0,200 Z"
            fill="url(#snowGradient)"
          />
        </svg>
      </div>

      {/* Simple static tree */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 scale-75">
        <div className="relative flex flex-col items-center">
          {/* Star */}
          <div className="relative mb-2">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-yellow-400" />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-400" />
          </div>

          {/* Tree layers */}
          <div className="w-0 h-0 border-l-[50px] border-r-[50px] border-b-[70px] border-l-transparent border-r-transparent border-b-green-700" />
          <div className="w-0 h-0 border-l-[70px] border-r-[70px] border-b-[90px] border-l-transparent border-r-transparent border-b-green-600 -mt-3" />
          <div className="w-0 h-0 border-l-[90px] border-r-[90px] border-b-[110px] border-l-transparent border-r-transparent border-b-green-700 -mt-3" />

          {/* Trunk */}
          <div className="w-10 h-14 bg-gradient-to-b from-amber-800 to-amber-950 border-2 border-amber-950" />
        </div>
      </div>

      {/* Simple house */}
      <div className="absolute bottom-24 left-4 scale-75">
        <div className="relative">
          <div className="w-28 h-32 bg-gradient-to-b from-red-600 to-red-800 border-2 border-red-900">
            <div className="absolute top-6 left-4 w-6 h-8 bg-yellow-300 border-2 border-yellow-600" />
            <div className="absolute top-6 right-4 w-6 h-8 bg-yellow-300 border-2 border-yellow-600" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-16 bg-amber-900 border-2 border-amber-950" />
          </div>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[60px] border-r-[60px] border-b-[40px] border-l-transparent border-r-transparent border-b-gray-700" />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-3 bg-white rounded-t-full" />
        </div>
      </div>

      {/* Simple snowman */}
      <div className="absolute bottom-24 right-8 scale-75">
        <div className="relative flex flex-col items-center">
          <div className="relative w-14 h-14 bg-white rounded-full border-2 border-gray-200">
            <div className="absolute top-4 left-3 w-1.5 h-1.5 bg-black rounded-full" />
            <div className="absolute top-4 right-3 w-1.5 h-1.5 bg-black rounded-full" />
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-t-[3px] border-b-[3px] border-l-[10px] border-t-transparent border-b-transparent border-l-orange-500" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-6 bg-black rounded-t-lg" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-2 bg-black" />
          </div>
          <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-200 -mt-2" />
          <div className="w-20 h-20 bg-white rounded-full border-2 border-gray-200 -mt-2" />
        </div>
      </div>

      {/* Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center px-4">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
          Merry Christmas
        </h1>
        <p className="text-2xl text-red-400 font-semibold drop-shadow-md">
          圣诞快乐
        </p>
      </div>
    </div>
  );
}
