import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Copy, Check, Download, Printer } from "lucide-react";
import { useCanvas } from "../../contexts/CanvasContext";
import {
  copyToClipboard,
  downloadAsMarkdown,
  downloadAsDocx,
  downloadAsPdf,
  printDocument,
} from "../../utils/canvasExport";

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
        <MoreHorizontal size={18} strokeWidth={1.7} />
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
            {copied ? <Check size={16} /> : <Copy size={16} strokeWidth={1.7} />}
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
            <Download size={16} strokeWidth={1.7} />
            <span>Download as .md</span>
          </button>

          {/* Download as Word */}
          <button
            onClick={handleDownloadDocx}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: "var(--text-primary)" }}
            role="menuitem"
          >
            <Download size={16} strokeWidth={1.7} />
            <span>Download as .docx</span>
          </button>

          {/* Download as PDF */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: "var(--text-primary)" }}
            role="menuitem"
          >
            <Download size={16} strokeWidth={1.7} />
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
            <Printer size={16} strokeWidth={1.7} />
            <span>Print</span>
          </button>
        </div>
      )}
    </div>
  );
};
