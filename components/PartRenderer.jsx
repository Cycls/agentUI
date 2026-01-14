import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

const cx = (...cls) => cls.filter(Boolean).join(" ");

const Icon = {
  spark: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l1.5 6L20 10l-6.5 2L12 20l-1.5-8L4 10l6.5-2L12 2z" />
    </svg>
  ),
};

function Surface({ className, style, children }) {
  return (
    <div
      className={cx(
        "theme-transition rounded-2xl border shadow-sm",
        "backdrop-blur-[2px]",
        className
      )}
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
        color: "var(--text-primary)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children, style, className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        "border",
        className
      )}
      style={{
        borderColor: "var(--border-primary)",
        backgroundColor: "var(--bg-tertiary, var(--bg-secondary))",
        color: "var(--text-secondary)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function ThinkingBlock({ thinking }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Surface className="my-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "w-full text-left p-2 md:p-2.5",
          "flex items-center justify-between gap-3"
        )}
        style={{
          color: "var(--text-primary)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border"
            style={{
              borderColor: "var(--border-primary)",
              backgroundColor: "var(--bg-tertiary, var(--bg-secondary))",
              color: "var(--text-secondary)",
            }}
          >
            {Icon.spark}
          </span>

          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              Reasoning
            </span>
            <span
              className="text-xs leading-tight"
              style={{ color: "var(--text-secondary)" }}
            >
              {open ? "Tap to hide" : "Tap to view"}
            </span>
          </div>

          <div className="ml-2">
            <Pill>Thinking</Pill>
          </div>
        </div>

        <span
          className={cx(
            "inline-flex h-8 w-8 items-center justify-center rounded-xl border",
            "transition-transform duration-200",
            open ? "rotate-180" : "rotate-0"
          )}
          style={{
            borderColor: "var(--border-primary)",
            backgroundColor: "var(--bg-tertiary, var(--bg-secondary))",
            color: "var(--text-secondary)",
          }}
          aria-hidden
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 md:px-4 md:pb-4">
          <div
            className={cx(
              "rounded-xl border p-3 text-sm",
              "whitespace-pre-wrap"
            )}
            style={{
              borderColor: "var(--border-primary)",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-secondary)",
            }}
          >
            <code
              className="font-mono text-[13px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {thinking}
            </code>
          </div>
        </div>
      )}
    </Surface>
  );
}

// Render a single part based on its type
export const PartRenderer = React.memo(function PartRenderer({ part, onSend }) {
  if (!part || !part.type) return null;

  // Only handle "thinking" type - everything else goes to MarkdownRenderer
  if (part.type === "thinking") {
    return <ThinkingBlock thinking={part.thinking || ""} />;
  }

  // For all other types, convert to markdown and use MarkdownRenderer
  let markdown = "";

  switch (part.type) {
    case "text":
      markdown = part.text || "";
      break;

    case "code":
      const lang = part.language || "";
      markdown = "```" + lang + "\n" + (part.code || "") + "\n```";
      break;

    case "table":
      if (part.headers && part.headers.length > 0) {
        markdown += "| " + part.headers.join(" | ") + " |\n";
        markdown += "| " + part.headers.map(() => "---").join(" | ") + " |\n";
      }
      if (part.rows && part.rows.length > 0) {
        part.rows.forEach((row) => {
          markdown += "| " + row.join(" | ") + " |\n";
        });
      }
      break;

    case "callout":
      const emoji =
        {
          info: "ℹ️",
          success: "✅",
          warning: "⚠️",
          error: "❌",
        }[part.style || "info"] || "ℹ️";

      markdown = `> ${emoji} **${part.title || part.style || "Info"}**\n>\n> ${
        part.callout || ""
      }`;
      break;

    case "image":
      markdown = `![${part.alt || ""}](${part.src})`;
      if (part.caption) {
        markdown += `\n\n*${part.caption}*`;
      }
      break;

    default:
      console.warn("Unknown part type:", part.type);
      return null;
  }

  return (
    <div
      className={cx(
        "prose prose-sm max-w-none",
        "prose-headings:scroll-mt-24",
        "prose-pre:p-0",
        "theme-transition"
      )}
      style={{ color: "var(--text-primary)" }}
    >
      <MarkdownRenderer markdown={markdown} onSend={onSend} />
    </div>
  );
});
