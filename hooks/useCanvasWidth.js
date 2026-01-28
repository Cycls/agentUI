import { useState, useEffect } from "react";

// ───────────────────────────────────────────────────────────────────────────────
// Custom hook for responsive canvas width calculations
// ───────────────────────────────────────────────────────────────────────────────
export const CANVAS_WIDTH = {
  desktop: 60, // percentage
  chat: 40, // percentage when canvas is open
};

export const useCanvasWidth = (isCanvasOpen) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // On mobile, canvas is full-screen overlay
  // On desktop, canvas takes 60% and chat takes 40%
  if (!isCanvasOpen) {
    return {
      chatWidthPercent: 100,
      canvasWidthPercent: 0,
      isMobile,
    };
  }

  if (isMobile) {
    return {
      chatWidthPercent: 100,
      canvasWidthPercent: 100,
      isMobile,
    };
  }

  return {
    chatWidthPercent: CANVAS_WIDTH.chat,
    canvasWidthPercent: CANVAS_WIDTH.desktop,
    isMobile,
  };
};
