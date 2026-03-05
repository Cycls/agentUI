import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
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
      let textToCopy = "";

      if (message.parts && Array.isArray(message.parts)) {
        // New format: extract text from parts
        textToCopy = message.parts
          .filter((p) => p.type === "text" && p.text)
          .map((p) => p.text)
          .join("\n\n");
      } else if (message.content) {
        // Old format: use content directly
        const { clean } = extractAttachmentsFromContent(message.content);
        textToCopy = clean;
      }

      await navigator.clipboard.writeText(textToCopy);
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
            <Check size={14} />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy size={14} />
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
          <RefreshCw size={14} />
          <span>Regenerate</span>
        </button>
      )}
    </div>
  );
};
