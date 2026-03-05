import React from "react";
import { FileText, X } from "lucide-react";
import { useCanvas } from "../../contexts/CanvasContext";
import { CanvasExportMenu } from "./CanvasExportMenu";

// Streaming indicator - simplified version for header
const StreamingDots = () => (
  <div className="flex items-center gap-1" aria-label="Streaming content">
    <span
      className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce motion-reduce:animate-none [animation-duration:900ms] [animation-delay:0ms] opacity-90"
    />
    <span
      className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce motion-reduce:animate-none [animation-duration:900ms] [animation-delay:140ms] opacity-90"
    />
    <span
      className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] animate-bounce motion-reduce:animate-none [animation-duration:900ms] [animation-delay:280ms] opacity-90"
    />
  </div>
);

export const CanvasHeader = ({ closeButtonRef }) => {
  const { state, closeCanvas } = useCanvas();

  return (
    <div
      className="flex h-14 items-center justify-between px-4 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border-primary)" }}
    >
      {/* Left side: Icon + Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="flex-shrink-0"
          style={{ color: "var(--text-secondary)" }}
        >
          <FileText size={18} strokeWidth={1.7} />
        </div>

        <h2
          className="text-base font-medium truncate"
          style={{ color: "var(--text-primary)" }}
          title={state.title}
        >
          {state.title || "Untitled"}
        </h2>

        {/* Streaming indicator */}
        {state.isStreaming && (
          <div className="flex-shrink-0 ml-2">
            <StreamingDots />
          </div>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Export menu - only visible after streaming complete */}
        <CanvasExportMenu />

        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={closeCanvas}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Close canvas"
        >
          <X size={18} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
};
