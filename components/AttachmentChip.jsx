import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, X } from "lucide-react";
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
            <Loader2 className="animate-spin h-5 w-5" style={{ color: "var(--text-primary)" }} />
          </div>
        )}
        {/* Error indicator */}
        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-md">
            <AlertTriangle className="h-5 w-5 text-red-500" />
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
        <X size={12} strokeWidth={1.5} />
      </button>
    </div>
  );
};
