import { useState, useEffect, useCallback, useRef } from "react";
import {
  listFiles,
  fetchBlob,
  uploadFile,
  renameItem,
  createDir,
  deleteItem,
} from "../services/files";

const cx = (...classes) => classes.filter(Boolean).join(" ");

// ── Icons ──
const FolderIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      fill="var(--finder-folder-fill)"
      stroke="var(--finder-folder-stroke)"
      strokeWidth="1.5"
    />
  </svg>
);

const FileIcon = ({ name = "" }) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const palette = {
    pdf: { fill: "#FEE2E2", stroke: "#EF4444", label: "PDF" },
    doc: { fill: "#DBEAFE", stroke: "#3B82F6", label: "DOC" },
    docx: { fill: "#DBEAFE", stroke: "#3B82F6", label: "DOC" },
    xls: { fill: "#D1FAE5", stroke: "#10B981", label: "XLS" },
    xlsx: { fill: "#D1FAE5", stroke: "#10B981", label: "XLS" },
    csv: { fill: "#D1FAE5", stroke: "#10B981", label: "CSV" },
    png: { fill: "#FEF3C7", stroke: "#F59E0B", label: "IMG" },
    jpg: { fill: "#FEF3C7", stroke: "#F59E0B", label: "IMG" },
    jpeg: { fill: "#FEF3C7", stroke: "#F59E0B", label: "IMG" },
    gif: { fill: "#FEF3C7", stroke: "#F59E0B", label: "IMG" },
    svg: { fill: "#FEF3C7", stroke: "#F59E0B", label: "SVG" },
    mp4: { fill: "#EDE9FE", stroke: "#8B5CF6", label: "VID" },
    mp3: { fill: "#EDE9FE", stroke: "#8B5CF6", label: "MP3" },
    zip: {
      fill: "var(--bg-tertiary)",
      stroke: "var(--text-tertiary)",
      label: "ZIP",
    },
    js: { fill: "#FEF9C3", stroke: "#CA8A04", label: "JS" },
    jsx: { fill: "#FEF9C3", stroke: "#CA8A04", label: "JSX" },
    ts: { fill: "#DBEAFE", stroke: "#2563EB", label: "TS" },
    tsx: { fill: "#DBEAFE", stroke: "#2563EB", label: "TSX" },
    json: { fill: "#F0FDF4", stroke: "#16A34A", label: "{ }" },
    md: {
      fill: "var(--bg-tertiary)",
      stroke: "var(--text-tertiary)",
      label: "MD",
    },
    txt: {
      fill: "var(--bg-tertiary)",
      stroke: "var(--text-tertiary)",
      label: "TXT",
    },
    py: { fill: "#DBEAFE", stroke: "#3B82F6", label: "PY" },
    html: { fill: "#FFEDD5", stroke: "#EA580C", label: "HTM" },
    css: { fill: "#DBEAFE", stroke: "#2563EB", label: "CSS" },
  };
  const c = palette[ext] || {
    fill: "var(--bg-tertiary)",
    stroke: "var(--text-tertiary)",
    label: "",
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.2"
      />
      <path
        d="M14 2v4a2 2 0 0 0 2 2h4"
        stroke={c.stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {c.label && (
        <text
          x="12"
          y="17.5"
          textAnchor="middle"
          fill={c.stroke}
          fontSize="5.5"
          fontWeight="700"
          fontFamily="system-ui"
        >
          {c.label}
        </text>
      )}
    </svg>
  );
};

const ChevronRight = () => (
  <svg
    width="7"
    height="12"
    viewBox="0 0 7 12"
    fill="none"
    stroke="var(--text-muted)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 1l5 5-5 5" />
  </svg>
);

const ActionIcon = ({ children, ...props }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + units[i];
}

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + " min ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STYLES — Uses your CSS variables for automatic light/dark adaptation.
   Dark mode appearance is preserved exactly as the screenshot.
   ═══════════════════════════════════════════════════════════════════════════════ */
const styles = `
  /* ── Finder theme tokens (light mode — derived from your CSS vars) ── */
  .finder-modal {
    --finder-folder-fill: rgba(56,132,254,0.08);
    --finder-folder-stroke: #3B82F6;
    --finder-accent: #3B82F6;
    --finder-accent-soft: rgba(59,130,246,0.1);
    --finder-accent-border: rgba(59,130,246,0.28);
    --finder-titlebar-from: var(--bg-secondary);
    --finder-titlebar-to: var(--bg-tertiary);
    --finder-toolbar-bg: var(--bg-secondary);
    --finder-row-hover: var(--bg-hover);
    --finder-row-active: var(--bg-active);
    --finder-text: var(--text-primary);
    --finder-text-secondary: var(--text-secondary);
    --finder-text-dim: var(--text-tertiary);
    --finder-text-muted: var(--text-muted);
    --finder-border: var(--border-primary);
    --finder-border-subtle: var(--border-secondary);
    --finder-surface: var(--bg-primary);
    --finder-surface-raised: var(--bg-secondary);
  }

  /* ── Dark overrides (exact match to your screenshot) ── */
  .dark .finder-modal,
  [data-theme="dark"] .finder-modal {
    --finder-folder-fill: rgba(56,132,254,0.12);
    --finder-folder-stroke: #3884FE;
    --finder-titlebar-from: #2D2D2D;
    --finder-titlebar-to: #272727;
    --finder-toolbar-bg: #232323;
    --finder-surface: #1E1E1E;
    --finder-surface-raised: #1A1A1A;
  }
  @media (prefers-color-scheme: dark) {
    :root:not(.light):not([data-theme="light"]) .finder-modal {
      --finder-folder-fill: rgba(56,132,254,0.12);
      --finder-folder-stroke: #3884FE;
      --finder-titlebar-from: #2D2D2D;
      --finder-titlebar-to: #272727;
      --finder-toolbar-bg: #232323;
      --finder-surface: #1E1E1E;
      --finder-surface-raised: #1A1A1A;
    }
  }

  /* ── Backdrop ── */
  .finder-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-overlay);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    animation: finderFadeIn 0.18s ease-out;
    padding: 16px;
  }
  @keyframes finderFadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes finderSlideUp {
    from { opacity: 0; transform: scale(0.97) translateY(8px) }
    to { opacity: 1; transform: scale(1) translateY(0) }
  }

  /* ── Window ── */
  .finder-window {
    position: relative; width: 100%; max-width: 720px;
    max-height: min(640px, 82vh);
    border-radius: 12px; overflow: hidden;
    display: flex; flex-direction: column;
    background: var(--finder-surface);
    border: 0.5px solid var(--finder-border);
    box-shadow:
      0 0 0 0.5px rgba(0,0,0,0.06),
      0 24px 80px rgba(0,0,0,0.12),
      0 8px 24px rgba(0,0,0,0.08);
    animation: finderSlideUp 0.22s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  }
  .dark .finder-window, [data-theme="dark"] .finder-window {
    box-shadow:
      0 0 0 0.5px rgba(0,0,0,0.3),
      0 24px 80px rgba(0,0,0,0.55),
      0 8px 24px rgba(0,0,0,0.3),
      inset 0 0.5px 0 rgba(255,255,255,0.06);
  }
  @media (prefers-color-scheme: dark) {
    :root:not(.light):not([data-theme="light"]) .finder-window {
      box-shadow:
        0 0 0 0.5px rgba(0,0,0,0.3),
        0 24px 80px rgba(0,0,0,0.55),
        0 8px 24px rgba(0,0,0,0.3),
        inset 0 0.5px 0 rgba(255,255,255,0.06);
    }
  }

  /* ── Title bar ── */
  .finder-titlebar {
    display: flex; align-items: center; height: 52px; padding: 0 16px;
    background: linear-gradient(180deg, var(--finder-titlebar-from), var(--finder-titlebar-to));
    border-bottom: 0.5px solid var(--finder-border);
    position: relative; flex-shrink: 0;
  }
  .traffic-lights { display: flex; gap: 8px; align-items: center; z-index: 1; }
  .traffic-light {
    width: 12px; height: 12px; border-radius: 50%; cursor: pointer;
    border: none; padding: 0; display: flex; align-items: center;
    justify-content: center; transition: filter 0.15s;
  }
  .traffic-light:hover { filter: brightness(1.15); }
  .traffic-light.red    { background: #FF5F57; box-shadow: inset 0 -0.5px 1px rgba(0,0,0,0.15); }
  .traffic-light.yellow { background: #FEBC2E; box-shadow: inset 0 -0.5px 1px rgba(0,0,0,0.12); }
  .traffic-light.green  { background: #28C840; box-shadow: inset 0 -0.5px 1px rgba(0,0,0,0.12); }
  .traffic-light svg { opacity: 0; width: 6px; height: 6px; transition: opacity 0.1s; }
  .traffic-lights:hover .traffic-light svg { opacity: 1; }
  .titlebar-text {
    position: absolute; left: 50%; transform: translateX(-50%);
    font-size: 13px; font-weight: 600; color: var(--finder-text);
    white-space: nowrap; letter-spacing: -0.01em;
  }

  /* ── Toolbar ── */
  .finder-toolbar {
    display: flex; align-items: center; gap: 2px; padding: 8px 12px;
    background: var(--finder-toolbar-bg);
    border-bottom: 0.5px solid var(--finder-border); flex-shrink: 0;
  }
  .toolbar-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 6px; border: none;
    background: transparent; color: var(--finder-text-secondary);
    font-size: 12px; font-weight: 500; cursor: pointer;
    transition: all 0.12s; white-space: nowrap;
    letter-spacing: -0.01em; font-family: inherit;
  }
  .toolbar-btn:hover { background: var(--finder-row-hover); color: var(--finder-text); }
  .toolbar-btn:active { background: var(--finder-row-active); transform: scale(0.98); }
  .toolbar-btn:disabled { opacity: 0.35; pointer-events: none; }
  .toolbar-separator {
    width: 1px; height: 18px; background: var(--finder-border);
    margin: 0 4px; flex-shrink: 0;
  }

  /* ── Breadcrumbs ── */
  .finder-breadcrumbs {
    display: flex; align-items: center; gap: 2px; padding: 6px 16px;
    background: var(--finder-surface);
    border-bottom: 0.5px solid var(--finder-border);
    overflow-x: auto; flex-shrink: 0;
  }
  .finder-breadcrumbs::-webkit-scrollbar { display: none; }
  .crumb-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 5px; border: none;
    background: transparent; color: var(--finder-text-muted);
    font-size: 12px; font-weight: 500; cursor: pointer;
    transition: all 0.12s; white-space: nowrap;
    letter-spacing: -0.01em; font-family: inherit;
  }
  .crumb-btn:hover { background: var(--finder-row-hover); color: var(--finder-text-secondary); }
  .crumb-btn.active { color: var(--finder-text); background: var(--finder-row-active); }
  .crumb-sep { color: var(--finder-text-muted); display: flex; align-items: center; flex-shrink: 0; }

  /* ── Column headers ── */
  .finder-colheader {
    display: flex; align-items: center; padding: 0 20px; height: 26px;
    background: var(--finder-surface-raised);
    border-bottom: 0.5px solid var(--finder-border); flex-shrink: 0;
  }
  .colheader-label {
    font-size: 11px; font-weight: 500; color: var(--finder-text-muted);
    letter-spacing: 0.03em; text-transform: uppercase; font-family: inherit;
  }

  /* ── File list body ── */
  .finder-body {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    background: var(--finder-surface);
  }
  .finder-body::-webkit-scrollbar { width: 6px; }
  .finder-body::-webkit-scrollbar-track { background: transparent; }
  .finder-body::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }
  .finder-body::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

  /* ── File row ── */
  .file-row {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 20px; cursor: default;
    border: 1.5px solid transparent; border-radius: 8px;
    margin: 1px 6px; transition: all 0.08s;
    position: relative; min-height: 36px;
  }
  .file-row:hover { background: var(--finder-row-hover); }
  .file-row:active { background: var(--finder-accent-soft); border-color: var(--finder-accent-border); }
  .file-row.selected { background: var(--finder-accent-soft); border-color: var(--finder-accent-border); }
  .file-row.deleting { background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.15); }
  .file-name {
    flex: 1; min-width: 0; font-size: 13px; color: var(--finder-text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }
  .file-meta {
    font-size: 11px; color: var(--finder-text-dim);
    white-space: nowrap; font-variant-numeric: tabular-nums;
  }

  /* ── Action buttons ── */
  .file-actions {
    display: flex; align-items: center; gap: 1px;
    opacity: 0; transition: opacity 0.12s; flex-shrink: 0;
  }
  .file-row:hover .file-actions { opacity: 1; }
  .action-btn {
    display: flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 5px; border: none;
    background: transparent; color: var(--finder-text-dim);
    cursor: pointer; transition: all 0.1s; padding: 0;
  }
  .action-btn:hover { background: var(--finder-row-active); color: var(--finder-text); }
  .action-btn.danger:hover { background: rgba(239,68,68,0.1); color: #EF4444; }

  /* ── Inline input ── */
  .finder-inline-input {
    flex: 1; min-width: 0; font-size: 13px; padding: 2px 8px;
    border-radius: 5px; border: 1.5px solid var(--finder-accent);
    background: var(--finder-accent-soft); color: var(--finder-text);
    outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    font-family: inherit; letter-spacing: -0.01em;
  }
  .finder-inline-input::placeholder { color: var(--finder-text-muted); }

  /* ── Delete banner ── */
  .delete-banner {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 8px 16px;
    background: rgba(239,68,68,0.05);
    border-bottom: 0.5px solid rgba(239,68,68,0.12); flex-shrink: 0;
  }
  .delete-banner-text {
    font-size: 12.5px; color: var(--finder-text);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .delete-banner-text strong { font-weight: 600; }
  .delete-banner-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .btn-cancel {
    padding: 4px 12px; border-radius: 5px; border: none;
    background: var(--finder-row-hover); color: var(--finder-text-secondary);
    font-size: 12px; font-weight: 500; cursor: pointer;
    transition: all 0.12s; font-family: inherit;
  }
  .btn-cancel:hover { background: var(--finder-row-active); color: var(--finder-text); }
  .btn-delete {
    padding: 4px 14px; border-radius: 5px; border: none;
    background: #EF4444; color: #fff; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.12s;
    letter-spacing: -0.01em; font-family: inherit;
  }
  .btn-delete:hover { background: #DC2626; }

  /* ── Empty / Loading ── */
  .finder-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 56px 24px; gap: 10px;
  }
  .finder-empty-icon { color: var(--finder-text-muted); opacity: 0.35; }
  .finder-empty-title { font-size: 13px; color: var(--finder-text-dim); font-weight: 500; }
  .finder-empty-hint { font-size: 11.5px; color: var(--finder-text-muted); }

  .finder-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 64px 24px; gap: 10px;
  }
  .finder-spinner {
    width: 18px; height: 18px;
    border: 2px solid var(--finder-border);
    border-top-color: var(--finder-text-secondary);
    border-radius: 50%; animation: finderSpin 0.7s linear infinite;
  }
  @keyframes finderSpin { to { transform: rotate(360deg) } }

  /* ── Drag overlay ── */
  .finder-drop-overlay {
    position: absolute; inset: 0; z-index: 20;
    display: flex; align-items: center; justify-content: center;
    background: var(--finder-accent-soft);
    border: 2px dashed var(--finder-accent);
    border-radius: 10px; margin: 4px; backdrop-filter: blur(4px);
  }
  .finder-drop-text {
    font-size: 13px; font-weight: 600; color: var(--finder-accent);
    letter-spacing: -0.01em;
  }

  /* ── Upload bar ── */
  .finder-upload-bar {
    height: 2px; width: 100%; background: var(--finder-border);
    flex-shrink: 0; overflow: hidden;
  }
  .finder-upload-fill {
    height: 100%; width: 100%;
    background: linear-gradient(90deg, var(--finder-accent), #60A5FA);
    animation: finderPulse 1.2s ease-in-out infinite;
  }
  @keyframes finderPulse { 0%,100% { opacity: 0.6 } 50% { opacity: 1 } }

  /* ── Status bar ── */
  .finder-statusbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 16px; background: var(--finder-surface-raised);
    border-top: 0.5px solid var(--finder-border); flex-shrink: 0;
  }
  .statusbar-text {
    font-size: 11px; color: var(--finder-text-muted); letter-spacing: -0.01em;
  }

  @media (prefers-reduced-motion: reduce) {
    .finder-backdrop, .finder-window { animation: none; }
    .finder-spinner { animation-duration: 1.5s; }
  }
`;

export const FileModal = ({ open, onClose, getToken }) => {
  const [path, setPath] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renamingItem, setRenamingItem] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [deletingItem, setDeletingItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const fileInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const newFolderInputRef = useRef(null);
  const dragCountRef = useRef(0);

  const load = useCallback(
    async (p) => {
      setLoading(true);
      const items = await listFiles(p, getToken);
      setFiles(items);
      setLoading(false);
    },
    [getToken]
  );

  useEffect(() => {
    if (open) load(path);
  }, [open, path, load]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (renamingItem) {
          setRenamingItem(null);
          setRenameValue("");
        } else if (creatingFolder) {
          setCreatingFolder(false);
          setNewFolderName("");
        } else if (deletingItem) {
          setDeletingItem(null);
        } else onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, renamingItem, creatingFolder, deletingItem]);

  useEffect(() => {
    if (renamingItem && renameInputRef.current) {
      renameInputRef.current.focus();
      if (renamingItem.type !== "directory") {
        const dotIdx = renameValue.lastIndexOf(".");
        renameInputRef.current.setSelectionRange(
          0,
          dotIdx > 0 ? dotIdx : renameValue.length
        );
      } else {
        renameInputRef.current.select();
      }
    }
  }, [renamingItem]);

  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current)
      newFolderInputRef.current.focus();
  }, [creatingFolder]);

  const fullPath = (name) => (path ? path + "/" + name : name);

  const handleDelete = (name, e) => {
    e?.stopPropagation();
    setDeletingItem(name);
  };
  const confirmDelete = async () => {
    if (!deletingItem) return;
    await deleteItem(fullPath(deletingItem), getToken);
    setDeletingItem(null);
    load(path);
  };

  const handleDownload = async (name, e) => {
    e.stopPropagation();
    const url = await fetchBlob(fullPath(name), getToken);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClick = async (item) => {
    if (renamingItem || creatingFolder) return;
    if (item.type === "directory") {
      setPath(fullPath(item.name));
      setSelectedItem(null);
    } else {
      setSelectedItem(item.name);
    }
  };

  const handleDoubleClick = async (item) => {
    if (item.type !== "directory") {
      const url = await fetchBlob(fullPath(item.name), getToken);
      if (url) window.open(url, "_blank");
    }
  };

  const doUpload = async (fileList) => {
    if (fileList.length === 0) return;
    setUploading(true);
    await Promise.all(fileList.map((f) => uploadFile(path, f, getToken)));
    setUploading(false);
    load(path);
  };

  const handleUpload = async (e) => {
    const uploadFiles = Array.from(e.target.files || []);
    fileInputRef.current.value = "";
    await doUpload(uploadFiles);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    if (dragCountRef.current === 1) setDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) setDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current = 0;
    setDragging(false);
    await doUpload(Array.from(e.dataTransfer.files || []));
  };

  const handleNewFolder = () => {
    setCreatingFolder(true);
    setNewFolderName("");
  };
  const commitNewFolder = async () => {
    const name = newFolderName.trim();
    if (name) {
      await createDir(fullPath(name), getToken);
      load(path);
    }
    setCreatingFolder(false);
    setNewFolderName("");
  };

  const startRename = (item, e) => {
    e.stopPropagation();
    setRenamingItem(item);
    setRenameValue(item.name);
  };
  const commitRename = async () => {
    if (!renamingItem) return;
    const newName = renameValue.trim();
    if (newName && newName !== renamingItem.name) {
      await renameItem(
        fullPath(renamingItem.name),
        fullPath(newName),
        getToken
      );
      load(path);
    }
    setRenamingItem(null);
    setRenameValue("");
  };

  const segments = path ? path.split("/") : [];
  if (!open) return null;

  const sorted = [...files].sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });

  const folderCount = sorted.filter((i) => i.type === "directory").length;
  const fileCount = sorted.length - folderCount;
  const currentFolder =
    segments.length > 0 ? segments[segments.length - 1] : "Files";

  return (
    <>
      <style>{styles}</style>
      <div className="finder-modal finder-backdrop" onClick={onClose}>
        <div
          className="finder-window"
          onClick={(e) => e.stopPropagation()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* ── Title bar ── */}
          <div className="finder-titlebar">
            <div className="traffic-lights">
              <button
                className="traffic-light red"
                onClick={onClose}
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 6 6"
                  fill="none"
                  stroke="#4D0000"
                  strokeWidth="1.2"
                >
                  <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" />
                </svg>
              </button>
              <button
                className="traffic-light yellow"
                onClick={onClose}
                aria-label="Minimize"
              >
                <svg
                  viewBox="0 0 6 6"
                  fill="none"
                  stroke="#995700"
                  strokeWidth="1.2"
                >
                  <path d="M0.5 3H5.5" />
                </svg>
              </button>
              <button className="traffic-light green" aria-label="Zoom">
                <svg
                  viewBox="0 0 6 6"
                  fill="none"
                  stroke="#006400"
                  strokeWidth="1.2"
                >
                  <path d="M1 1L3 3L1 5M5 1L3 3L5 5" />
                </svg>
              </button>
            </div>
            <span className="titlebar-text">{currentFolder}</span>
          </div>

          {/* ── Toolbar ── */}
          <div className="finder-toolbar">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="toolbar-btn"
              disabled={uploading}
            >
              <ActionIcon>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </ActionIcon>
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <button
              onClick={handleNewFolder}
              className="toolbar-btn"
              disabled={creatingFolder}
            >
              <ActionIcon>
                <path d="M12 10v6" />
                <path d="M9 13h6" />
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </ActionIcon>
              New Folder
            </button>
            <div className="toolbar-separator" />
            {path && (
              <button
                onClick={() => setPath(segments.slice(0, -1).join("/"))}
                className="toolbar-btn"
              >
                <ActionIcon>
                  <polyline points="15 18 9 12 15 6" />
                </ActionIcon>
                Back
              </button>
            )}
          </div>

          {/* ── Breadcrumbs ── */}
          <div className="finder-breadcrumbs">
            <button
              onClick={() => setPath("")}
              className={cx("crumb-btn", !path && "active")}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
              </svg>
              Home
            </button>
            {segments.map((seg, i) => {
              const segPath = segments.slice(0, i + 1).join("/");
              const isLast = i === segments.length - 1;
              return (
                <span
                  key={segPath}
                  style={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <span className="crumb-sep">
                    <ChevronRight />
                  </span>
                  <button
                    onClick={() => setPath(segPath)}
                    className={cx("crumb-btn", isLast && "active")}
                  >
                    {seg}
                  </button>
                </span>
              );
            })}
          </div>

          {/* ── Column headers ── */}
          <div className="finder-colheader">
            <span className="colheader-label" style={{ flex: 1 }}>
              Name
            </span>
            <span
              className="colheader-label"
              style={{ width: 70, textAlign: "right" }}
            >
              Size
            </span>
            <span
              className="colheader-label"
              style={{ width: 80, textAlign: "right", marginRight: 80 }}
            >
              Modified
            </span>
          </div>

          {/* ── Delete confirmation ── */}
          {deletingItem && (
            <div className="delete-banner">
              <span className="delete-banner-text">
                Move <strong>{deletingItem}</strong> to Trash?
              </span>
              <span className="delete-banner-actions">
                <button
                  onClick={() => setDeletingItem(null)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button onClick={confirmDelete} className="btn-delete">
                  Delete
                </button>
              </span>
            </div>
          )}

          {/* ── Body ── */}
          <div className="finder-body" style={{ position: "relative" }}>
            {dragging && (
              <div className="finder-drop-overlay">
                <span className="finder-drop-text">Drop files to upload</span>
              </div>
            )}

            {loading ? (
              <div className="finder-loading">
                <div className="finder-spinner" />
                <span
                  style={{ fontSize: 12, color: "var(--finder-text-muted)" }}
                >
                  Loading…
                </span>
              </div>
            ) : sorted.length === 0 && !creatingFolder ? (
              <div className="finder-empty">
                <span className="finder-empty-icon">
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                  </svg>
                </span>
                <span className="finder-empty-title">This folder is empty</span>
                <span className="finder-empty-hint">
                  Drop files here or click Upload
                </span>
              </div>
            ) : (
              <div style={{ padding: "4px 0" }}>
                {creatingFolder && (
                  <div className="file-row">
                    <FolderIcon />
                    <input
                      ref={newFolderInputRef}
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={commitNewFolder}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitNewFolder();
                        if (e.key === "Escape") {
                          setCreatingFolder(false);
                          setNewFolderName("");
                        }
                      }}
                      placeholder="untitled folder"
                      className="finder-inline-input"
                    />
                  </div>
                )}

                {sorted.map((item) => (
                  <div
                    key={item.name}
                    className={cx(
                      "file-row",
                      selectedItem === item.name && "selected",
                      deletingItem === item.name && "deleting"
                    )}
                    onClick={() => handleClick(item)}
                    onDoubleClick={() => handleDoubleClick(item)}
                  >
                    {item.type === "directory" ? (
                      <FolderIcon />
                    ) : (
                      <FileIcon name={item.name} />
                    )}

                    {renamingItem?.name === item.name ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") {
                            setRenamingItem(null);
                            setRenameValue("");
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="finder-inline-input"
                      />
                    ) : (
                      <span className="file-name">{item.name}</span>
                    )}

                    {item.type !== "directory" && (
                      <span
                        className="file-meta"
                        style={{ width: 60, textAlign: "right" }}
                      >
                        {formatSize(item.size)}
                      </span>
                    )}

                    <span
                      className="file-meta"
                      style={{ width: 80, textAlign: "right" }}
                    >
                      {formatDate(item.modified)}
                    </span>

                    <span className="file-actions">
                      {item.type !== "directory" && (
                        <button
                          onClick={(e) => handleDownload(item.name, e)}
                          className="action-btn"
                          title="Download"
                        >
                          <ActionIcon>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </ActionIcon>
                        </button>
                      )}
                      <button
                        onClick={(e) => startRename(item, e)}
                        className="action-btn"
                        title="Rename"
                      >
                        <ActionIcon>
                          <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </ActionIcon>
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.name, e)}
                        className="action-btn danger"
                        title="Delete"
                      >
                        <ActionIcon>
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </ActionIcon>
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Upload progress ── */}
          {uploading && (
            <div className="finder-upload-bar">
              <div className="finder-upload-fill" />
            </div>
          )}

          {/* ── Status bar ── */}
          <div className="finder-statusbar">
            <span className="statusbar-text">
              {sorted.length === 0
                ? "Empty folder"
                : [
                    folderCount > 0 &&
                      `${folderCount} folder${folderCount !== 1 ? "s" : ""}`,
                    fileCount > 0 &&
                      `${fileCount} file${fileCount !== 1 ? "s" : ""}`,
                  ]
                    .filter(Boolean)
                    .join(", ")}
            </span>
            <span className="statusbar-text">{path || "/"}</span>
          </div>
        </div>
      </div>
    </>
  );
};
