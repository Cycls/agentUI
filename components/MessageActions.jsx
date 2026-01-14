import { useState } from "react";
import { extractAttachmentsFromContent } from "../utils/file";

export const MessageActions = ({
  message,
  onCopy,
  onRegenerate,
  isLastAssistant,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const { clean } = extractAttachmentsFromContent(message.content);
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-[var(--bg-hover)] theme-transition"
        style={{ color: "var(--text-tertiary)" }}
        title="Copy message"
      >
        {copied ? (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Regenerate Button - only show for last assistant message */}
      {isLastAssistant && (
        <button
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-[var(--bg-hover)] theme-transition"
          style={{ color: "var(--text-tertiary)" }}
          title="Regenerate response"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>Regenerate</span>
        </button>
      )}
    </div>
  );
};
