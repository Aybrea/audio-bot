"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

export default function ChristmasScene() {
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * 60,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
      })),
    [],
  );

  const snowflakes = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        size: Math.random() * 8 + 3,
        left: Math.random() * 100,
        top: Math.random() * -20,
        xOffset: Math.random() * 100 - 50,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800">
      {/* Stars in the sky */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          className="absolute bg-white rounded-full shadow-sm shadow-white/50"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.left}%`,
            top: `${star.top}%`,
          }}
          transition={{
            duration: star.duration,
            ease: "easeInOut",
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}

      {/* Moon */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        className="absolute top-8 right-8 md:top-16 md:right-24 w-20 h-20 md:w-28 md:h-28"
        transition={{
          duration: 6,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full shadow-2xl shadow-yellow-300/60 backdrop-blur-sm" />
        <div className="absolute top-2 right-3 w-6 h-6 bg-yellow-50 rounded-full opacity-40 blur-sm" />
        <div className="absolute top-8 right-8 w-4 h-4 bg-yellow-50 rounded-full opacity-30 blur-sm" />
      </motion.div>

      {/* Falling snowflakes */}
      {snowflakes.map((flake) => (
        <motion.div
          key={`snow-${flake.id}`}
          animate={{
            y: ["-10vh", "110vh"],
            x: [0, flake.xOffset],
            rotate: [0, 360],
          }}
          className="absolute bg-white rounded-full opacity-80 shadow-sm shadow-white/50"
          style={{
            width: flake.size,
            height: flake.size,
            left: `${flake.left}%`,
            top: `${flake.top}%`,
          }}
          transition={{
            duration: flake.duration,
            ease: "linear",
            repeat: Infinity,
            delay: flake.delay,
          }}
        />
      ))}

      {/* Ground snow */}
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
          <motion.path
            animate={{
              d: [
                "M0,80 Q300,60 600,80 T1200,80 L1200,200 L0,200 Z",
                "M0,85 Q300,65 600,85 T1200,85 L1200,200 L0,200 Z",
                "M0,80 Q300,60 600,80 T1200,80 L1200,200 L0,200 Z",
              ],
            }}
            d="M0,80 Q300,60 600,80 T1200,80 L1200,200 L0,200 Z"
            fill="url(#snowGradient)"
            transition={{
              duration: 8,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </svg>
      </div>

      {/* Houses */}
      <motion.div
        className="absolute bottom-24 md:bottom-32 left-4 md:left-20 scale-75 md:scale-100"
        transition={{ type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="relative">
          {/* House 1 */}
          <div className="relative">
            <div className="w-32 h-40 bg-gradient-to-b from-red-600 to-red-800 border-2 border-red-900 shadow-xl">
              {/* Window */}
              <motion.div
                animate={{ opacity: [0.8, 1, 0.8] }}
                className="absolute top-8 left-6 w-8 h-10 bg-gradient-to-br from-yellow-200 to-yellow-400 border-2 border-yellow-600 shadow-lg shadow-yellow-400/50"
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                animate={{ opacity: [0.8, 1, 0.8] }}
                className="absolute top-8 right-6 w-8 h-10 bg-gradient-to-br from-yellow-200 to-yellow-400 border-2 border-yellow-600 shadow-lg shadow-yellow-400/50"
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              {/* Door */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-20 bg-gradient-to-b from-amber-800 to-amber-950 border-2 border-amber-950 shadow-inner" />
            </div>
            {/* Roof */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[70px] border-r-[70px] border-b-[50px] border-l-transparent border-r-transparent border-b-gray-700 drop-shadow-lg" />
            {/* Snow on roof */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-36 h-4 bg-gradient-to-b from-white to-blue-50 rounded-t-full shadow-md" />
            {/* Chimney */}
            <div className="absolute -top-16 right-8 w-8 h-20 bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-900 shadow-lg">
              <div className="absolute -top-1 -left-1 w-10 h-3 bg-gray-700 shadow-md" />
              {/* Smoke */}
              <motion.div
                animate={{ y: [-20, -40], opacity: [0.6, 0], scale: [0.5, 1] }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full blur-sm"
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Christmas Tree */}
      <motion.div
        className="absolute bottom-24 md:bottom-32 left-1/2 -translate-x-1/2 scale-75 md:scale-100"
        transition={{ type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          animate={{
            rotate: [0, 2, -2, 0],
          }}
          className="relative"
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          {/* Tree layers */}
          <div className="relative flex flex-col items-center">
            {/* Star on top */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              className="relative mb-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
              transition={{
                rotate: {
                  duration: 4,
                  ease: "linear",
                  repeat: Infinity,
                },
                scale: {
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                },
              }}
            >
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-yellow-400" />
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400" />
            </motion.div>

            {/* Top layer */}
            <div className="w-0 h-0 border-l-[60px] border-r-[60px] border-b-[80px] border-l-transparent border-r-transparent border-b-green-700 relative drop-shadow-lg">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`ornament-top-${i}`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  className="absolute w-3 h-3 rounded-full shadow-lg"
                  style={{
                    left: (i - 2) * 20 + "px",
                    top: i * 12 + 10 + "px",
                    backgroundColor: [
                      "#ef4444",
                      "#fbbf24",
                      "#3b82f6",
                      "#e5e7eb",
                    ][i % 4],
                    boxShadow: `0 0 10px ${["#ef4444", "#fbbf24", "#3b82f6", "#e5e7eb"][i % 4]}`,
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Middle layer */}
            <div className="w-0 h-0 border-l-[80px] border-r-[80px] border-b-[100px] border-l-transparent border-r-transparent border-b-green-600 -mt-4 relative drop-shadow-lg">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`ornament-mid-${i}`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  className="absolute w-3 h-3 rounded-full shadow-lg"
                  style={{
                    left: (i - 3) * 25 + "px",
                    top: i * 15 + 10 + "px",
                    backgroundColor: [
                      "#ef4444",
                      "#fbbf24",
                      "#3b82f6",
                      "#e5e7eb",
                    ][i % 4],
                    boxShadow: `0 0 10px ${["#ef4444", "#fbbf24", "#3b82f6", "#e5e7eb"][i % 4]}`,
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Bottom layer */}
            <div className="w-0 h-0 border-l-[100px] border-r-[100px] border-b-[120px] border-l-transparent border-r-transparent border-b-green-700 -mt-4 relative drop-shadow-lg">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`ornament-bot-${i}`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  className="absolute w-3 h-3 rounded-full shadow-lg"
                  style={{
                    left: (i - 4) * 30 + "px",
                    top: i * 12 + 10 + "px",
                    backgroundColor: [
                      "#ef4444",
                      "#fbbf24",
                      "#3b82f6",
                      "#e5e7eb",
                    ][i % 4],
                    boxShadow: `0 0 10px ${["#ef4444", "#fbbf24", "#3b82f6", "#e5e7eb"][i % 4]}`,
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Tree trunk */}
            <div className="w-12 h-16 bg-gradient-to-b from-amber-800 to-amber-950 border-2 border-amber-950 shadow-lg" />
          </div>
        </motion.div>
      </motion.div>

      {/* Snowman */}
      <motion.div
        className="absolute bottom-24 md:bottom-32 right-8 md:right-32 scale-75 md:scale-100"
        transition={{ type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          animate={{
            rotate: [0, -3, 3, 0],
          }}
          className="relative flex flex-col items-center"
          transition={{
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          {/* Head */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-white to-blue-50 rounded-full border-2 border-gray-200 shadow-xl">
            {/* Eyes */}
            <div className="absolute top-5 left-4 w-2 h-2 bg-black rounded-full shadow-sm" />
            <div className="absolute top-5 right-4 w-2 h-2 bg-black rounded-full shadow-sm" />
            {/* Nose (carrot) */}
            <div className="absolute top-7 left-1/2 -translate-x-1/2 w-0 h-0 border-t-[4px] border-b-[4px] border-l-[12px] border-t-transparent border-b-transparent border-l-orange-500 drop-shadow-md" />
            {/* Smile */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-black rounded-full" />
              ))}
            </div>
            {/* Hat */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-8 bg-gradient-to-b from-gray-800 to-black rounded-t-lg shadow-lg" />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-black shadow-md" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-3 bg-gradient-to-r from-red-500 to-red-700 shadow-md" />
          </div>

          {/* Middle body */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-white to-blue-50 rounded-full border-2 border-gray-200 -mt-2 shadow-xl">
            {/* Buttons */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rounded-full shadow-sm" />
            <div className="absolute top-9 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rounded-full shadow-sm" />
            <div className="absolute top-14 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rounded-full shadow-sm" />
          </div>

          {/* Bottom body */}
          <div className="w-24 h-24 bg-gradient-to-br from-white to-blue-50 rounded-full border-2 border-gray-200 -mt-2 shadow-xl" />

          {/* Arms */}
          <div className="absolute top-20 -left-12 w-16 h-2 bg-gradient-to-r from-amber-700 to-amber-900 rounded-full -rotate-45 origin-right shadow-lg" />
          <div className="absolute top-20 -right-12 w-16 h-2 bg-gradient-to-l from-amber-700 to-amber-900 rounded-full rotate-45 origin-left shadow-lg" />
        </motion.div>
      </motion.div>

      {/* Gifts */}
      <div className="absolute bottom-24 md:bottom-32 right-16 md:right-64 flex gap-2 md:gap-4 scale-75 md:scale-100">
        {[
          { color: "from-red-500 to-red-700", size: "w-12 h-12", delay: 0 },
          { color: "from-blue-500 to-blue-700", size: "w-16 h-14", delay: 0.3 },
          {
            color: "from-green-500 to-green-700",
            size: "w-10 h-16",
            delay: 0.6,
          },
        ].map((gift, idx) => (
          <motion.div
            key={`gift-${idx}`}
            animate={{
              y: [0, -8, 0],
            }}
            className="relative cursor-pointer"
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              delay: gift.delay,
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <div
              className={`${gift.size} bg-gradient-to-br ${gift.color} border-2 border-gray-700 shadow-xl`}
            >
              {/* Ribbon vertical */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-full bg-gradient-to-b from-yellow-200 to-yellow-400 shadow-md" />
              {/* Ribbon horizontal */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-2 bg-gradient-to-r from-yellow-200 to-yellow-400 shadow-md" />
              {/* Bow */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6">
                <div className="absolute left-0 w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-lg" />
                <div className="absolute right-0 w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full shadow-lg" />
                <div className="absolute left-1/2 -translate-x-1/2 top-1 w-2 h-2 bg-yellow-500 rounded-full shadow-md" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Title */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        className="absolute top-8 md:top-12 left-1/2 -translate-x-1/2 text-center px-4"
        transition={{
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <motion.h1
          animate={{
            textShadow: [
              "0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)",
              "0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.5)",
              "0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)",
            ],
          }}
          className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-2 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text"
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          Merry Christmas
        </motion.h1>
        <motion.p
          animate={{
            textShadow: [
              "0 0 15px rgba(239,68,68,0.5)",
              "0 0 25px rgba(239,68,68,0.8)",
              "0 0 15px rgba(239,68,68,0.5)",
            ],
          }}
          className="text-2xl md:text-3xl text-red-400 font-semibold drop-shadow-lg bg-gradient-to-r from-red-300 via-red-400 to-red-300 bg-clip-text"
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          圣诞快乐
        </motion.p>
      </motion.div>

      {/* Sleigh with Santa (optional, flying across) */}
      <motion.div
        animate={{
          x: ["-20%", "120%"],
          y: [0, -20, 0, -20, 0],
        }}
        className="absolute top-24 md:top-32 flex items-center gap-2 md:gap-4 scale-75 md:scale-100"
        initial={{ x: "-20%" }}
        transition={{
          x: {
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          },
          y: {
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          },
        }}
      >
        {/* Reindeer */}
        <div className="relative drop-shadow-lg">
          <div className="w-8 h-6 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg shadow-lg" />
          <div className="absolute -top-4 left-1 w-2 h-4 bg-gradient-to-b from-amber-600 to-amber-800 rotate-12 shadow-md" />
          <div className="absolute -top-4 right-1 w-2 h-4 bg-gradient-to-b from-amber-600 to-amber-800 -rotate-12 shadow-md" />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              boxShadow: [
                "0 0 5px rgba(239,68,68,0.5)",
                "0 0 15px rgba(239,68,68,1)",
                "0 0 5px rgba(239,68,68,0.5)",
              ],
            }}
            className="absolute -top-5 left-2 w-2 h-2 bg-red-500 rounded-full shadow-lg"
            transition={{
              duration: 1,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </div>

        {/* Sleigh */}
        <div className="relative drop-shadow-xl">
          <div className="w-16 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg border-2 border-red-900 shadow-xl">
            {/* Santa */}
            <div className="absolute -top-8 left-2 w-6 h-6 bg-gradient-to-br from-pink-100 to-pink-300 rounded-full shadow-md" />
            <div className="absolute -top-12 left-2 w-6 h-6 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg" />
            <div className="absolute -top-14 left-3 w-4 h-3 bg-gradient-to-b from-red-500 to-red-700 rounded-t-full shadow-md" />
            <div className="absolute -top-13 left-4 w-2 h-2 bg-white rounded-full shadow-sm" />
          </div>
          <div className="absolute -bottom-1 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-full shadow-lg" />
        </div>
      </motion.div>
    </div>
  );
}
