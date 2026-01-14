import { useEffect, useState } from "react";
import { formatFileSize } from "../utils/file";

export const AttachmentChip = ({ file, onRemove }) => {
  const [preview, setPreview] = useState(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }, [file, isImage]);

  return (
    <div
      className="group inline-flex items-start gap-2 rounded-xl shadow-sm px-2.5 py-1 theme-transition"
      style={{
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border-primary)",
      }}
      title={file.name}
    >
      <div
        className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        {isImage && preview ? (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs">📄</span>
        )}
      </div>
      <div className="min-w-0 leading-tight">
        <div
          className="text-xs font-medium truncate max-w-[100px]"
          style={{ color: "var(--text-primary)" }}
        >
          {file.name}
        </div>
        <div
          className="text-xs text-left"
          style={{ color: "var(--text-tertiary)" }}
        >
          {formatFileSize(file.size)}
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
