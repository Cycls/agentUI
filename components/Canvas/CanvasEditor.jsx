import { useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useCanvas } from "../../contexts/CanvasContext";

// ───────────────────────────────────────────────────────────────────────────────
// RTL Detection - checks for Arabic/Hebrew characters
// ───────────────────────────────────────────────────────────────────────────────
function detectRTL(text) {
  if (!text) return false;
  const sample = text.replace(/\s/g, "").slice(0, 100);
  const rtlRegex = /[\u0600-\u06FF\u0590-\u05FF]/;
  return rtlRegex.test(sample);
}

// ───────────────────────────────────────────────────────────────────────────────
// Canvas Renderer - react-markdown display
// ───────────────────────────────────────────────────────────────────────────────
export const CanvasEditor = () => {
  const { state } = useCanvas();
  const isRTL = useMemo(() => detectRTL(state.content), [state.content]);

  if (!state.content) {
    return (
      <div
        className="flex-1 overflow-y-auto scrollbar-thin canvas-editor"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div className="p-6 max-w-3xl mx-auto">
          <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
            <span style={{ color: "var(--text-tertiary)" }}>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-thin canvas-editor"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div
        className="p-6 max-w-3xl mx-auto min-h-[calc(100vh-120px)] prose prose-sm max-w-none"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {state.content}
        </Markdown>

        {/* Streaming cursor indicator */}
        {state.isStreaming && (
          <span
            className="inline-block w-0.5 h-5 ml-0.5 animate-pulse"
            style={{ backgroundColor: "var(--text-primary)" }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};
