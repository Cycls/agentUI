import React, { useEffect, useRef } from "react";
import { useCanvas } from "../../contexts/CanvasContext";
import { useCanvasWidth } from "../../hooks/useCanvasWidth";
import { CanvasHeader } from "./CanvasHeader";
import { CanvasEditor } from "./CanvasEditor";

// ───────────────────────────────────────────────────────────────────────────────
// Document Canvas Panel
// ───────────────────────────────────────────────────────────────────────────────
export const CanvasPanel = () => {
  const { state, closeCanvas } = useCanvas();
  const { canvasWidthPercent, isMobile } = useCanvasWidth(state.isOpen);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && state.isOpen) {
        closeCanvas();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, closeCanvas]);

  // Focus management - focus close button when canvas opens
  useEffect(() => {
    if (state.isOpen && closeButtonRef.current) {
      // Small delay to allow animation to start
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [state.isOpen]);

  if (!state.isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300 ease-in-out"
          style={{ backgroundColor: "var(--bg-overlay)" }}
          onClick={closeCanvas}
          aria-hidden="true"
        />
      )}

      {/* Canvas Panel */}
      <aside
        ref={panelRef}
        role={isMobile ? "dialog" : "complementary"}
        aria-label="Document Canvas"
        aria-modal={isMobile ? "true" : undefined}
        className={`
          fixed top-0 right-0 h-full z-50
          flex flex-col
          canvas-panel
          ${state.isOpen ? "canvas-panel-open" : ""}
        `}
        style={{
          width: isMobile ? "100%" : `${canvasWidthPercent}%`,
          backgroundColor: "var(--bg-primary)",
          borderLeft: isMobile ? "none" : "1px solid var(--border-primary)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <CanvasHeader closeButtonRef={closeButtonRef} />
        <CanvasEditor />
      </aside>
    </>
  );
};

export default CanvasPanel;
