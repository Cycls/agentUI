import { AttachmentChip } from "./AttachmentChip";
import { FileErrorToast } from "./Toast";
import { formatFileSize, validateFile } from "../utils/file";
import { CONFIG } from "../clientConfig";
import { useCallback, useEffect, useRef, useState } from "react";

export const Composer = ({
  onSend,
  isLoading = false,
  onStop,
  disabled = false,
  onUpgradeClick,
  sidebarWidth = 0,
}) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Handle file validation and adding
  const addFiles = useCallback(
    (newFiles) => {
      if (disabled) return;

      const validFiles = [];
      for (const file of newFiles) {
        const validation = validateFile(file);
        if (!validation.valid) {
          setFileError(validation.error);
          break;
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [disabled]
  );

  // Drag and drop handlers
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current++;
      if (e.dataTransfer.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files || []);
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [addFiles, disabled]);

  // Paste handler for images
  useEffect(() => {
    const handlePaste = (e) => {
      if (disabled) return;

      const isTextareaFocused = document.activeElement === textareaRef.current;
      if (!isTextareaFocused) return;

      const items = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));

      if (imageItems.length > 0) {
        e.preventDefault();

        const imageFiles = imageItems
          .map((item) => item.getAsFile())
          .filter((file) => file !== null);

        if (imageFiles.length > 0) {
          addFiles(imageFiles);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [addFiles, disabled]);

  const pickFiles = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const onPick = (e) => {
    if (disabled) return;
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
    e.target.value = "";
  };

  const removeFile = (i) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSend = async () => {
    if (isLoading || disabled) return;
    onSend({ text: message, files });
    setMessage("");
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !isMobile &&
      !isLoading &&
      !disabled
    ) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {fileError && (
        <FileErrorToast
          error={fileError}
          onDismiss={() => setFileError(null)}
        />
      )}

      {/* Drag & Drop Overlay - only show when not disabled */}
      {isDragging && !disabled && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: "var(--bg-overlay)" }}
        >
          <div
            className="rounded-2xl shadow-2xl p-8 max-w-md mx-4 border-2 border-dashed theme-transition"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--text-primary)",
            }}
          >
            <div className="text-center">
              <div
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: "var(--text-primary)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Drop files to upload
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Images, PDFs, and text files supported
              </p>
              <p
                className="text-xs mt-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                Max {formatFileSize(CONFIG.MAX_FILE_BYTES)} per file
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fixed composer container with sidebar-aware positioning */}
      <div
        className="fixed right-0 z-40 transition-all duration-300 ease-in-out bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-[max(1rem,env(safe-area-inset-bottom))]"
        style={{
          left: isMobile ? "0px" : `${sidebarWidth}px`,
        }}
      >
        <div className="mx-auto max-w-3xl px-3 md:px-4">
          <div
            className={`cursor-text rounded-3xl relative p-0 pt-1 backdrop-blur-xl w-full theme-transition ${
              disabled ? "opacity-75" : ""
            }`}
            style={{
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border-primary)",
            }}
          >
            {files.length > 0 && (
              <div className="px-3 pt-3">
                <div className="flex flex-wrap gap-2">
                  {files.map((file, i) => (
                    <AttachmentChip
                      key={i}
                      file={file}
                      onRemove={() => removeFile(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="px-3 pb-3 pt-2">
              <textarea
                ref={textareaRef}
                className={`w-full resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-base leading-6 max-h-40 mb-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  disabled ? "cursor-not-allowed" : ""
                }`}
                style={{
                  color: "var(--text-primary)",
                  caretColor: "var(--accent-primary)",
                }}
                dir="auto"
                autoFocus={!disabled}
                tabIndex={0}
                rows={Math.max(1, Math.min(6, message.split("\n").length))}
                placeholder={
                  disabled
                    ? "Upgrade to continue chatting..."
                    : isLoading
                      ? "Waiting for response..."
                      : "What's on your mind?"
                }
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                value={message}
                disabled={isLoading || disabled}
              />

              <div className="flex items-center gap-2">
                {/* Attach file button */}
                <button
                  onClick={pickFiles}
                  disabled={disabled}
                  className={`rounded-full w-8 h-8 inline-flex items-center justify-center p-1 theme-transition ${
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[var(--bg-hover)] active:scale-[0.98]"
                  }`}
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                  aria-label="Attach file"
                  title={disabled ? "Upgrade to attach files" : "Attach files"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" />
                  </svg>
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={onPick}
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.md,.csv"
                  disabled={disabled}
                />

                <div className="flex-1" />

                {/* Stop Button - show when loading */}
                {isLoading && !disabled && (
                  <button
                    onClick={onStop}
                    className="rounded-full hover:bg-[var(--bg-hover)] active:scale-95 transition-all inline-flex items-center justify-center w-8 h-8 flex-shrink-0 theme-transition"
                    style={{
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-primary)",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                    aria-label="Stop generating"
                    title="Stop"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                    </svg>
                  </button>
                )}

                {/* Upgrade Button - show when disabled (free limit reached) */}
                {disabled && (
                  <button
                    onClick={onUpgradeClick}
                    className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 px-4 h-9 flex-shrink-0 shadow-md font-medium text-sm"
                    aria-label="Upgrade to continue"
                    title="Upgrade"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Upgrade
                  </button>
                )}

                {/* Send Button - show when not loading and not disabled */}
                {!isLoading && !disabled && (
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="rounded-full hover:opacity-90 active:scale-[0.98] inline-flex items-center justify-center w-9 h-9 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 theme-transition"
                    style={{
                      backgroundColor: "var(--btn-primary-bg)",
                      color: "var(--btn-primary-text)",
                    }}
                    aria-label="Send message"
                    title="Send"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Free limit message - show when disabled */}
          {disabled && (
            <p
              className="text-xs text-center mt-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              You&apos;ve reached your free message limit
            </p>
          )}
        </div>
      </div>

      {/* Add placeholder style for textarea */}
      <style>{`
        textarea::placeholder {
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
};
