import React, { useState } from "react";
import { useCanvas } from "../../contexts/CanvasContext";
import { CanvasExportMenu } from "./CanvasExportMenu";

// ───────────────────────────────────────────────────────────────────────────────
// Canvas Header - Title bar with actions
// ───────────────────────────────────────────────────────────────────────────────

// Document icon
const DocumentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

// Close icon
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

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
  const { state, closeCanvas, updateContent } = useCanvas();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(state.title);

  const handleTitleClick = () => {
    if (state.isDone) {
      setEditedTitle(state.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    // Title editing would need to be added to context if needed
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEditingTitle(false);
    } else if (e.key === "Escape") {
      setEditedTitle(state.title);
      setIsEditingTitle(false);
    }
  };

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
          <DocumentIcon />
        </div>

        {isEditingTitle ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-base font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] rounded px-1 min-w-0 flex-1"
            style={{ color: "var(--text-primary)" }}
          />
        ) : (
          <h2
            onClick={handleTitleClick}
            className={`text-base font-medium truncate ${
              state.isDone ? "cursor-text hover:bg-[var(--bg-hover)] rounded px-1 -mx-1" : ""
            }`}
            style={{ color: "var(--text-primary)" }}
            title={state.title}
          >
            {state.title || "Untitled"}
          </h2>
        )}

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
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};
