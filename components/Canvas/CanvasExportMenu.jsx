import React, { useState, useRef, useEffect } from "react";
import { useCanvas } from "../../contexts/CanvasContext";
import {
  copyToClipboard,
  downloadAsMarkdown,
  downloadAsDocx,
  downloadAsPdf,
  printDocument,
} from "../../utils/canvasExport";

// ───────────────────────────────────────────────────────────────────────────────
// Icons
// ───────────────────────────────────────────────────────────────────────────────
const MoreIcon = () => (
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
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
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
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const PrintIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

// ───────────────────────────────────────────────────────────────────────────────
// Canvas Export Menu
// ───────────────────────────────────────────────────────────────────────────────
export const CanvasExportMenu = () => {
  const { state } = useCanvas();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleCopy = async () => {
    const success = await copyToClipboard(state.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setIsOpen(false);
  };

  const handleDownloadMd = () => {
    downloadAsMarkdown(state.content, state.title);
    setIsOpen(false);
  };

  const handleDownloadDocx = async () => {
    await downloadAsDocx(state.content, state.title);
    setIsOpen(false);
  };

  const handleDownloadPdf = async () => {
    await downloadAsPdf(state.content, state.title);
    setIsOpen(false);
  };

  const handlePrint = () => {
    printDocument(state.content, state.title);
    setIsOpen(false);
  };

  // Don't show menu until streaming is complete
  if (!state.isDone) {
    return null;
  }

  return (
    <div className="relative">
      {/* Menu trigger button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Export options"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreIcon />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg dropdown-menu z-50"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-primary)",
          }}
          role="menu"
        >
          {/* Copy to clipboard */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors first:rounded-t-xl"
            style={{ color: copied ? "var(--text-success, #22c55e)" : "var(--text-primary)" }}
            role="menuitem"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span>{copied ? "Copied!" : "Copy to clipboard"}</span>
          </button>

          {/* Divider */}
          <div
            className="mx-3 my-1"
            style={{ borderTop: "1px solid var(--border-primary)" }}
          />

          {/* Download as Markdown */}
          <button
            onClick={handleDownloadMd}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: "var(--text-primary)" }}
            role="menuitem"
          >
            <DownloadIcon />
            <span>Download as .md</span>
          </button>

          {/* Download as Word */}
          <button
            onClick={handleDownloadDocx}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: "var(--text-primary)" }}
            role="menuitem"
          >
            <DownloadIcon />
            <span>Download as .docx</span>
          </button>

          {/* Download as PDF */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: "var(--text-primary)" }}
            role="menuitem"
          >
            <DownloadIcon />
            <span>Download as .pdf</span>
          </button>

          {/* Divider */}
          <div
            className="mx-3 my-1"
            style={{ borderTop: "1px solid var(--border-primary)" }}
          />

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors last:rounded-b-xl"
            style={{ color: "var(--text-primary)" }}
            role="menuitem"
          >
            <PrintIcon />
            <span>Print</span>
          </button>
        </div>
      )}
    </div>
  );
};
