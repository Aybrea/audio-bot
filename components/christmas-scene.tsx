"use client";

import { useEffect, useState } from "react";

import ChristmasSceneMobile from "./christmas-scene-mobile";
import ChristmasSceneDesktop from "./christmas-scene-desktop";

export default function ChristmasScene() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show nothing during initial render to avoid hydration mismatch
  if (isMobile === null) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800" />
    );
  }

  // Use lightweight mobile version for better performance
  return isMobile ? <ChristmasSceneMobile /> : <ChristmasSceneDesktop />;
}
