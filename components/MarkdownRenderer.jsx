import React, { useCallback, useMemo, useState, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { CodeBlock } from "./CodeBlock";

// ───────────────────────────────────────────────────────────────────────────────
// Helper Components
// ───────────────────────────────────────────────────────────────────────────────
const RawComponent = ({ children }) => (
  <div className="not-prose">{children}</div>
);

const ImageComponent = ({ src, alt, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = useCallback(async () => {
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
      className="relative inline-block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={src} alt={alt} {...props} />
      {isHovered && (
        <button
          onClick={handleDownload}
          className="absolute top-8 right-2 p-2 rounded-lg transition-all duration-200"
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
};

const LinkComponent = ({ href, onSend, ...props }) => {
  const handleClick = useCallback(
    (e) => {
      onSend(decodeURIComponent(href.slice("https://cycls.com/send/".length)));
      e.preventDefault();
    },
    [href, onSend]
  );

  return href.startsWith("https://cycls.com/send/") ? (
    <a
      {...props}
      className={
        props.className ||
        "underline decoration-[var(--text-tertiary)]/40 decoration-2 hover:decoration-[var(--text-tertiary)]/60"
      }
      href="#"
      onClick={handleClick}
    />
  ) : (
    <a {...props} href={href} target="_blank" rel="noreferrer" />
  );
};

const TableComponent = ({ children, ...props }) => {
  const tableRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleExportCSV = useCallback(() => {
    try {
      if (!tableRef.current) return;

      const rows = [];
      const table = tableRef.current;

      // Extract headers
      const headers = Array.from(table.querySelectorAll("thead th")).map(
        (th) => th.textContent?.trim() || ""
      );
      if (headers.length > 0) {
        rows.push(headers);
      }

      // Extract body rows
      const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
      bodyRows.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("td")).map(
          (td) => td.textContent?.trim() || ""
        );
        if (cells.length > 0) {
          rows.push(cells);
        }
      });

      // Convert to CSV format
      const csvContent = rows
        .map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell);
              if (
                cellStr.includes(",") ||
                cellStr.includes('"') ||
                cellStr.includes("\n")
              ) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(",")
        )
        .join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `table-export-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export table as CSV:", error);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (!tableRef.current) return;

      const rows = [];
      const table = tableRef.current;

      // Extract headers
      const headers = Array.from(table.querySelectorAll("thead th")).map(
        (th) => th.textContent?.trim() || ""
      );
      if (headers.length > 0) {
        rows.push(headers.join("\t"));
      }

      // Extract body rows
      const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
      bodyRows.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("td")).map(
          (td) => td.textContent?.trim() || ""
        );
        if (cells.length > 0) {
          rows.push(cells.join("\t"));
        }
      });

      await navigator.clipboard.writeText(rows.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy table:", error);
    }
  }, []);

  return (
    <div className="table-wrapper">
      <table ref={tableRef} {...props}>
        {children}
      </table>
      <div
        className="!-mt-2"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          marginTop: "8px",
          borderRadius: "8px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <button
          onClick={handleExportCSV}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--text-secondary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0",
          }}
          aria-label="Export table as CSV"
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span>Export as CSV</span>
        </button>
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px",
            borderRadius: "4px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: copied
              ? "var(--text-success, #22c55e)"
              : "var(--text-tertiary)",
          }}
          title={copied ? "Copied!" : "Copy table"}
          aria-label="Copy table"
        >
          {copied ? (
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
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
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// Markdown Renderer Component
// ───────────────────────────────────────────────────────────────────────────────
export const MarkdownRenderer = React.memo(({ markdown, onSend }) => {
  const components = useMemo(
    () => ({
      raw: RawComponent,
      a: (props) => <LinkComponent {...props} onSend={onSend} />,
      code: CodeBlock,
      img: ImageComponent,
      table: TableComponent,
    }),
    [onSend]
  );

  return (
    <div dir="auto">
      <Markdown
        components={components}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          rehypeKatex,
          [rehypeHighlight, { ignoreMissing: true, detect: true }],
        ]}
      >
        {markdown}
      </Markdown>
    </div>
  );
});

MarkdownRenderer.displayName = "MarkdownRenderer";
