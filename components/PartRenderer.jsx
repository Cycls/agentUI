import React from "react";
import { ChevronDown, Globe, FileText, ExternalLink, Download } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useCanvas } from "../contexts/CanvasContext";
import { useAuthSrc } from "../hooks/useAuthSrc";
import PaymentBlock from "./PaymentBlock";
import FileBlock from "./FileBlock";

const cx = (...cls) => cls.filter(Boolean).join(" ");

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
            <FileText size={18} strokeWidth={1.7} />
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
          <ExternalLink size={14} />
        </div>
      </button>
    </div>
  );
}

// Image block with download functionality and auth-aware loading
function ImageBlock({ src: rawSrc, alt, getToken }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const { src, loading } = useAuthSrc(rawSrc, getToken);

  const handleDownload = React.useCallback(async () => {
    if (!src) return;
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

  if (loading || !src) {
    return (
      <div
        className="relative md:w-[60%] inline-block rounded-lg animate-pulse"
        style={{ backgroundColor: "var(--bg-tertiary)", height: "200px" }}
      />
    );
  }

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
          <Download size={18} />
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

// Thinking block
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
            <ChevronDown size={16} className={cx("transition-transform duration-200", open ? "rotate-180" : "rotate-0")} />
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

// Steps block
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

  const isSearchStep = (step) => {
    return (
      step.result ||
      step.type === "search" ||
      (step.step &&
        (step.step.toLowerCase().includes("search") ||
          step.step.toLowerCase().includes("fetch")))
    );
  };

  // Determine dot/icon color based on step status
  const getDotColor = (step, isLastStep) => {
    if (step.error || step.status === "error")
      return "var(--text-error, #ef4444)";
    if (step.status === "warning") return "var(--text-warning, #f59e0b)";
    if (isGenerating && isLastStep) return "var(--text-success, #309454)";
    return "var(--text-success, #309454)";
  };

  return (
    <div
      className="my-3 rounded-lg border"
      style={{
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Header - always visible, always collapsible */}
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
          <ChevronDown size={16} className={cx("transition-transform duration-200", expanded ? "rotate-180" : "rotate-0")} />
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {steps.length} step{steps.length !== 1 ? "s" : ""}
        </span>
      </button>

      {/* Steps list - only visible when expanded */}
      {expanded && (
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
              const dotColor = getDotColor(step, isLastStep);
              const isActive = isGenerating && isLastStep;

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
                    {/* Dot/Globe indicator - color conveys status, shape conveys type */}
                    <div className="flex-shrink-0 mt-1 flex items-center justify-center w-4 h-4">
                      {isSearch ? (
                        <div
                          style={{
                            color: dotColor,
                            transition: "color 0.3s ease",
                            ...(isActive
                              ? {
                                  animation:
                                    "step-dot-pulse 2s ease-in-out infinite",
                                }
                              : {}),
                          }}
                        >
                          <Globe size={16} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: dotColor,
                            transition: "background-color 0.3s ease",
                            ...(isActive
                              ? {
                                  animation:
                                    "step-dot-pulse 2s ease-in-out infinite",
                                }
                              : {}),
                          }}
                        />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={
                          hasData
                            ? () => toggleStepData(actualIndex)
                            : undefined
                        }
                        disabled={!hasData}
                        className={cx(
                          "flex-1 min-w-0 text-left text-sm leading-relaxed",
                          hasData && "cursor-pointer hover:opacity-80"
                        )}
                        style={{
                          color: "var(--text-secondary)",
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
                            <ChevronDown size={16} className={cx("transition-transform duration-200", isStepExpanded ? "rotate-180" : "rotate-0")} />
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
      )}
    </div>
  );
}

// Render a single part based on its type
export const PartRenderer = React.memo(function PartRenderer({
  part,
  onSend,
  isGenerating,
  getToken,
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
    return (
      <StepsBlock
        steps={part.steps || []}
        onSend={onSend}
        isGenerating={isGenerating}
      />
    );
  }

  // Handle image type with native download UI (format: {type: "image", image: "url"})
  if (part.type === "image" && part.image) {
    return <ImageBlock src={part.image} alt={part.alt} getToken={getToken} />;
  }

  // Handle payment type - Stripe Embedded Checkout
  if (part.type === "payment") {
    return <PaymentBlock clientSecret={part.clientSecret} paymentId={part.paymentId} onSend={onSend} />;
  }

  // Handle file type - authenticated PDF preview with download
  if (part.type === "file") {
    return <FileBlock path={part.path} name={part.name} getToken={getToken} />;
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
