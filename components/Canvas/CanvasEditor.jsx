import { useEffect, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCanvas } from "../../contexts/CanvasContext";

// ───────────────────────────────────────────────────────────────────────────────
// Simple markdown to HTML converter for Tiptap
// ───────────────────────────────────────────────────────────────────────────────
function markdownToHtml(markdown) {
  if (!markdown) return "";

  let html = markdown
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers (must be at start of line)
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    .replace(/^\*\*\*$/gm, "<hr>")
    // Unordered lists (simple handling)
    .replace(/^[\-\*] (.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Paragraphs (double newlines)
    .replace(/\n\n/g, "</p><p>")
    // Single newlines to br (within paragraphs)
    .replace(/\n/g, "<br>");

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<ol") && !html.startsWith("<blockquote")) {
    html = "<p>" + html + "</p>";
  }

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, "");

  // Wrap consecutive li elements in ul (avoid 's' flag for Safari compatibility)
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);

  return html;
}

// ───────────────────────────────────────────────────────────────────────────────
// RTL Detection - checks for Arabic/Hebrew characters
// ───────────────────────────────────────────────────────────────────────────────
function detectRTL(text) {
  if (!text) return false;
  // Check first 100 non-whitespace characters for RTL scripts
  const sample = text.replace(/\s/g, "").slice(0, 100);
  // Arabic: \u0600-\u06FF, Hebrew: \u0590-\u05FF
  const rtlRegex = /[\u0600-\u06FF\u0590-\u05FF]/;
  return rtlRegex.test(sample);
}

// ───────────────────────────────────────────────────────────────────────────────
// Canvas Renderer - Read-only Tiptap display
// ───────────────────────────────────────────────────────────────────────────────
export const CanvasEditor = () => {
  const { state } = useCanvas();
  const lastContentRef = useRef(state.content);
  const isRTL = useMemo(() => detectRTL(state.content), [state.content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: markdownToHtml(state.content),
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-full",
        dir: isRTL ? "rtl" : "ltr",
      },
    },
  });

  // Update editor content when streaming new content
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    if (state.isStreaming && state.content !== lastContentRef.current) {
      try {
        const html = markdownToHtml(state.content);
        editor.commands.setContent(html);
        lastContentRef.current = state.content;

        // Scroll to bottom while streaming
        const editorElement = editor.view?.dom;
        if (editorElement) {
          editorElement.scrollTop = editorElement.scrollHeight;
        }
      } catch (e) {
        console.error("Error updating editor content:", e);
      }
    }
  }, [editor, state.content, state.isStreaming]);

  // Update RTL direction when content changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    try {
      const dom = editor.view?.dom;
      if (dom) {
        dom.setAttribute("dir", isRTL ? "rtl" : "ltr");
      }
    } catch (e) {
      console.error("Error setting RTL direction:", e);
    }
  }, [editor, isRTL]);

  // Don't render until editor is ready
  if (!editor) {
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
      <div className="p-6 max-w-3xl mx-auto">
        <EditorContent
          editor={editor}
          className="min-h-[calc(100vh-120px)]"
        />

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
