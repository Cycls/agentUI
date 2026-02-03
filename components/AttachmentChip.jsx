import { useEffect, useState } from "react";
import { formatFileSize } from "../utils/file";

export const AttachmentChip = ({ file, status = "complete", error, onRemove }) => {
  const [preview, setPreview] = useState(null);
  const isImage = file.type.startsWith("image/");
  const isUploading = status === "uploading";
  const isError = status === "error";

  useEffect(() => {
    if (!isImage) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }, [file, isImage]);

  return (
    <div
      className={`group inline-flex items-start gap-2 rounded-xl shadow-sm px-2.5 py-1 theme-transition ${isError ? "border-red-400" : ""}`}
      style={{
        backgroundColor: "var(--bg-primary)",
        border: isError ? "1px solid #f87171" : "1px solid var(--border-primary)",
      }}
      title={isError ? `Upload failed: ${error}` : file.name}
    >
      <div
        className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center relative"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        {isImage && preview ? (
          <img
            src={preview}
            alt={file.name}
            className={`w-full h-full object-cover ${isUploading ? "opacity-50" : ""}`}
          />
        ) : (
          <span className={`text-xs ${isUploading ? "opacity-50" : ""}`}>📄</span>
        )}
        {/* Upload spinner overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
            <svg
              className="animate-spin h-5 w-5"
              style={{ color: "var(--text-primary)" }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        {/* Error indicator */}
        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-md">
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 leading-tight">
        <div
          className="text-xs font-medium truncate max-w-[100px]"
          style={{ color: isError ? "#f87171" : "var(--text-primary)" }}
        >
          {file.name}
        </div>
        <div
          className="text-xs text-left"
          style={{ color: isError ? "#f87171" : "var(--text-tertiary)" }}
        >
          {isError ? "Failed" : isUploading ? "Uploading..." : formatFileSize(file.size)}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="ml-1 h-5 w-5 rounded-full grid place-items-center hover:bg-[var(--bg-hover)] theme-transition"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "var(--text-secondary)",
        }}
        aria-label="Remove attachment"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M9 3L3 9M3 3L9 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};
