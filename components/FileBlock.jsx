import React, { useState, useEffect, useCallback } from "react";
import { FileText, Download, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { authFetch } from "../services/authFetch";

export default function FileBlock({ path, name, getToken }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) {
      setError("No file path provided");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let url = null;
    setLoading(true);
    setError(null);

    authFetch(`/files/${encodeURIComponent(path)}`, {}, getToken)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setError("File not found");
          return;
        }
        if (!res.ok) {
          setError("Failed to load file preview");
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load file preview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [path, getToken]);

  const handleDownload = useCallback(() => {
    if (!blobUrl) return;
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = name || "file.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [blobUrl, name]);

  if (loading) {
    return (
      <div
        className="my-3 rounded-lg border overflow-hidden"
        style={{ borderColor: "var(--border-secondary)" }}
      >
        <div
          className="flex items-center gap-2 p-3 border-b"
          style={{ borderColor: "var(--border-secondary)" }}
        >
          <div
            className="w-4 h-4 rounded animate-pulse"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          />
          <div
            className="h-4 w-48 rounded animate-pulse"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          />
        </div>
        <div
          className="animate-pulse"
          style={{ backgroundColor: "var(--bg-tertiary)", height: "400px" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="my-3 rounded-lg border p-4 flex items-center gap-2"
        style={{
          borderColor: "var(--border-secondary)",
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text-secondary)",
        }}
      >
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div
      className="my-3 rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--border-secondary)" }}
    >
      <div
        className="flex items-center justify-between p-3 border-b"
        style={{
          borderColor: "var(--border-secondary)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={16} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
          <span
            className="text-sm truncate"
            style={{ color: "var(--text-primary)" }}
            dir="auto"
          >
            {name || path}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDownload}>
          <Download size={14} />
          Download
        </Button>
      </div>
      <iframe
        src={blobUrl}
        type="application/pdf"
        className="w-full border-0"
        style={{ height: "500px" }}
        title={name || "PDF preview"}
      />
    </div>
  );
}
