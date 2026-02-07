import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useCanvas } from "../contexts/CanvasContext";

const cx = (...cls) => cls.filter(Boolean).join(" ");

// Simple chevron icon
function ChevronIcon({ isOpen }) {
  return (
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
      className={cx(
        "transition-transform duration-200",
        isOpen ? "rotate-180" : "rotate-0"
      )}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Globe icon for search steps
function GlobeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--text-tertiary)" }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// Simple dot for non-search steps
function StepDot() {
  return (
    <div
      className="w-1.5 h-1.5 rounded-full"
      style={{ backgroundColor: "var(--text-tertiary)" }}
    />
  );
}

// Activity indicator - shows work is happening with orbiting dots and pulse
function ActivityIndicator() {
  return (
    <div className="step-activity-container">
      {/* Pulsing ring */}
      <div className="step-pulse-ring" />
      <div className="step-pulse-ring step-pulse-ring-delayed" />
      {/* Orbiting dots */}
      <div className="step-orbit">
        <div className="step-orbit-dot" />
      </div>
      <div className="step-orbit step-orbit-reverse">
        <div className="step-orbit-dot step-orbit-dot-alt" />
      </div>
    </div>
  );
}

// Document icon for canvas
function DocumentIcon() {
  return (
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
}

// External link icon
function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// Canvas block - allows reopening the document canvas
function CanvasBlock({ title, content, isComplete }) {
  const { openExistingCanvas } = useCanvas();

  const handleOpen = React.useCallback(() => {
    // Open canvas with the saved content (already complete, editable)
    openExistingCanvas({
      title: title || "Untitled",
      content: content || "",
    });
  }, [title, content, openExistingCanvas]);

  return (
    <div
      className="my-3 rounded-lg border"
      style={{ borderColor: "var(--border-primary)" }}
    >
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0"
            style={{ color: "var(--text-secondary)" }}
          >
            <DocumentIcon />
          </div>
          <div className="min-w-0">
            <span
              className="text-sm font-medium truncate block"
              style={{ color: "var(--text-primary)" }}
            >
              {title || "Untitled Document"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {isComplete ? "Click to view document" : "Generating..."}
            </span>
          </div>
        </div>
        <div
          className="flex-shrink-0 flex items-center gap-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span className="text-xs">Open</span>
          <ExternalLinkIcon />
        </div>
      </button>
    </div>
  );
}

// Image block with download functionality
function ImageBlock({ src, alt }) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleDownload = React.useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = alt || "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  }, [src, alt]);

  return (
    <div
      className="relative md:w-[60%] inline-block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={src} alt={alt || ""} />
      {isHovered && (
        <button
          onClick={handleDownload}
          className="absolute top-6 right-2 p-2 rounded-lg transition-all duration-200"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-primary)",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-md)",
          }}
          title="Download image"
          aria-label="Download image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Format seconds to display string (e.g., "5s" or "1m 23s")
function formatThinkingTime(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// Thinking block - Claude style with border, no background
function ThinkingBlock({ thinking, onSend, isActive, startTime, duration }) {
  const [open, setOpen] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(() => {
    // Initialize with duration if available (from saved state)
    if (duration != null) return duration;
    if (startTime && !isActive)
      return Math.round((Date.now() - startTime) / 1000);
    return 0;
  });

  // Timer effect - runs while thinking is active
  React.useEffect(() => {
    // If we have a saved duration, use it (from persisted state after refresh)
    if (duration != null) {
      setElapsed(duration);
      return;
    }

    // If not active and no duration, don't run timer
    if (!isActive) {
      return;
    }

    // Set initial elapsed while active
    if (startTime) {
      setElapsed(Math.round((Date.now() - startTime) / 1000));
    }

    // Update every second while active
    const interval = setInterval(() => {
      if (startTime) {
        setElapsed(Math.round((Date.now() - startTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime, duration]);

  return (
    <div
      className="my-3 rounded-lg border"
      style={{
        borderColor: "var(--border-primary)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left rounded-2xl transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Thinking
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {(elapsed > 0 || isActive) && (
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {formatThinkingTime(elapsed)}
            </span>
          )}
          <span style={{ color: "var(--text-tertiary)" }}>
            <ChevronIcon isOpen={open} />
          </span>
        </div>
      </button>

      {open && (
        <div
          className="px-4 pb-0"
          style={{ borderTop: "1px solid var(--border-primary)" }}
        >
          <div
            className="mt-3 prose prose-sm max-w-none"
            style={{ color: "var(--text-tertiary)" }}
          >
            <MarkdownRenderer markdown={thinking} onSend={onSend} />
          </div>
        </div>
      )}
    </div>
  );
}

// Steps block - Claude style with border and timeline
function StepsBlock({ steps, onSend, isGenerating }) {
  const [expanded, setExpanded] = React.useState(false);
  const [expandedSteps, setExpandedSteps] = React.useState({});

  if (!steps || steps.length === 0) return null;

  const DEFAULT_VISIBLE = 2;
  const hiddenCount = expanded
    ? 0
    : Math.max(0, steps.length - DEFAULT_VISIBLE);
  const visibleSteps = expanded ? steps : steps.slice(-DEFAULT_VISIBLE);

  const toggleStepData = (index) => {
    setExpandedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Determine if a step is a search step
  const isSearchStep = (step) => {
    return (
      step.result ||
      step.type === "search" ||
      (step.step &&
        (step.step.toLowerCase().includes("search") ||
          step.step.toLowerCase().includes("fetch")))
    );
  };

  return (
    <div
      className="my-3 rounded-lg border"
      style={{
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left rounded-2xl transition-colors"
        style={{ color: "var(--text-secondary)" }}
      >
        <span
          className="flex-shrink-0"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ChevronIcon isOpen={expanded} />
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {steps.length} step{steps.length !== 1 ? "s" : ""}
        </span>
      </button>

      {/* Steps list - always visible */}
      <div className="px-4 pb-4">
        {/* "+N more steps" row when collapsed */}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full text-left py-2 pl-5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-tertiary)" }}
          >
            +{hiddenCount} more step{hiddenCount !== 1 ? "s" : ""}
          </button>
        )}

        {/* Visible steps */}
        <div className="relative">
          {visibleSteps.map((step, index) => {
            const actualIndex = expanded
              ? index
              : steps.length - DEFAULT_VISIBLE + index;
            const hasData = step.data != null;
            const isStepExpanded = expandedSteps[actualIndex];
            const isLastStep = index === visibleSteps.length - 1;
            const isSearch = isSearchStep(step);

            return (
              <div key={actualIndex} className="relative">
                {/* Vertical connector line */}
                {!isLastStep && (
                  <div
                    className="absolute left-[7px] top-5 w-px -mt-0.5"
                    style={{
                      backgroundColor: "var(--border-primary)",
                      height: "calc(100% + 1px)",
                    }}
                  />
                )}

                <div className="flex items-start gap-3 py-1.5">
                  {/* Icon - globe for search, dot for others, with activity indicator for active step */}
                  <div className="flex-shrink-0 mt-0.5 flex items-center justify-center w-4 h-4 relative">
                    {isSearch ? <GlobeIcon /> : <StepDot />}
                    {isGenerating && isLastStep && <ActivityIndicator />}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={
                        hasData ? () => toggleStepData(actualIndex) : undefined
                      }
                      disabled={!hasData}
                      className={cx(
                        "flex-1 min-w-0 text-left text-sm leading-relaxed",
                        hasData && "cursor-pointer hover:opacity-80",
                        isGenerating && isLastStep && "step-text-shimmer"
                      )}
                      style={{
                        color: isGenerating && isLastStep ? undefined : "var(--text-secondary)",
                        wordBreak: "break-all",
                      }}
                    >
                      {step.step}
                    </button>

                    {/* Right side: result count and/or chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {step.result && (
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {step.result}
                        </span>
                      )}
                      {hasData && (
                        <button
                          type="button"
                          onClick={() => toggleStepData(actualIndex)}
                          className="p-1 -m-1 hover:opacity-70"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <ChevronIcon isOpen={isStepExpanded} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded step data */}
                {hasData && isStepExpanded && (
                  <div className="ml-7 mt-1 mb-2">
                    <div
                      className="rounded-lg border px-2 prose prose-sm max-w-none"
                      style={{
                        borderColor: "var(--border-primary)",
                        color: "var(--text-tertiary)",
                        wordBreak: "break-all",
                      }}
                    >
                      <MarkdownRenderer
                        markdown={
                          typeof step.data === "string"
                            ? step.data
                            : "```json\n" +
                              JSON.stringify(step.data, null, 2) +
                              "\n```"
                        }
                        onSend={onSend}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Render a single part based on its type
export const PartRenderer = React.memo(function PartRenderer({
  part,
  onSend,
  isGenerating,
}) {
  if (!part || !part.type) return null;

  // Canvas block - shows document info and allows reopening
  if (part.type === "canvas") {
    return (
      <CanvasBlock
        title={part.title}
        content={part.content}
        isComplete={part._complete}
      />
    );
  }

  // Handle thinking type
  if (part.type === "thinking") {
    return (
      <ThinkingBlock
        thinking={part.thinking || ""}
        onSend={onSend}
        isActive={isGenerating && !part._complete}
        startTime={part._startTime}
        duration={part._duration}
      />
    );
  }

  // Handle steps type (aggregated steps array)
  if (part.type === "steps") {
    return <StepsBlock steps={part.steps || []} onSend={onSend} isGenerating={isGenerating} />;
  }

  // Handle image type with native download UI (format: {type: "image", image: "url"})
  if (part.type === "image" && part.image) {
    return <ImageBlock src={part.image} alt={part.alt} />;
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
