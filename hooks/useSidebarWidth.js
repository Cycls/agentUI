import { useState, useEffect } from "react";
import { SIDEBAR_WIDTH } from "../components/Sidebar";

// ───────────────────────────────────────────────────────────────────────────────
// Custom hook for responsive sidebar width
// ───────────────────────────────────────────────────────────────────────────────
export const useSidebarWidth = (isOpen) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // On mobile, sidebar overlays (no offset needed)
  // On desktop, return the appropriate width
  if (isMobile) {
    return 0;
  }
  return isOpen ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed;
};
