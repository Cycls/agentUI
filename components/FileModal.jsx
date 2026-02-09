import { useState, useEffect, useCallback, useRef } from "react";
import { listFiles, fetchBlob, uploadFile, renameItem, createDir, deleteItem } from "../services/files";

const cx = (...classes) => classes.filter(Boolean).join(" ");

// ── Icons ──
const FolderIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
);

const FileIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const TrashIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const DownloadIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const PencilIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const UploadIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FolderPlusIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10v6" />
    <path d="M9 13h6" />
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
);

const CloseIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const EmptyFolderIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    <path d="M12 10v6" opacity="0.4" />
    <path d="M9 13h6" opacity="0.4" />
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
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const toolbarBtn = cx(
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
  "hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
  "transition-colors theme-transition"
);

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
  const fileInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const newFolderInputRef = useRef(null);
  const dragCountRef = useRef(0);

  const load = useCallback(async (p) => {
    setLoading(true);
    const items = await listFiles(p, getToken);
    setFiles(items);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    if (open) load(path);
  }, [open, path, load]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (renamingItem) { setRenamingItem(null); setRenameValue(""); }
        else if (creatingFolder) { setCreatingFolder(false); setNewFolderName(""); }
        else if (deletingItem) { setDeletingItem(null); }
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, renamingItem, creatingFolder, deletingItem]);

  // Focus rename input
  useEffect(() => {
    if (renamingItem && renameInputRef.current) {
      renameInputRef.current.focus();
      if (renamingItem.type !== "directory") {
        const dotIdx = renameValue.lastIndexOf(".");
        renameInputRef.current.setSelectionRange(0, dotIdx > 0 ? dotIdx : renameValue.length);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [renamingItem]);

  // Focus new folder input
  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [creatingFolder]);

  const fullPath = (name) => path ? path + "/" + name : name;

  const handleDelete = async (name, e) => {
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
    } else {
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

  // Drag and drop handlers
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
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    await doUpload(droppedFiles);
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
      await renameItem(fullPath(renamingItem.name), fullPath(newName), getToken);
      load(path);
    }
    setRenamingItem(null);
    setRenameValue("");
  };

  const cancelRename = () => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md px-4"
      style={{ backgroundColor: "var(--bg-overlay)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden theme-transition flex flex-col animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border-primary)",
          maxHeight: "min(620px, 80vh)",
        }}
        onClick={(e) => e.stopPropagation()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: "1px solid var(--border-primary)" }}
        >
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 min-w-0 flex-1 text-sm overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setPath("")}
              className={cx(
                "shrink-0 px-1.5 py-0.5 rounded-lg font-semibold",
                "hover:bg-[var(--bg-hover)] transition-colors"
              )}
              style={{ color: path ? "var(--text-secondary)" : "var(--text-primary)" }}
            >
              Files
            </button>
            {segments.map((seg, i) => {
              const segPath = segments.slice(0, i + 1).join("/");
              const isLast = i === segments.length - 1;
              return (
                <span key={segPath} className="flex items-center gap-1">
                  <span style={{ color: "var(--text-tertiary)" }}>/</span>
                  <button
                    onClick={() => setPath(segPath)}
                    className={cx(
                      "shrink-0 px-1.5 py-0.5 rounded-lg truncate max-w-[120px]",
                      "hover:bg-[var(--bg-hover)] transition-colors",
                      isLast && "font-medium"
                    )}
                    style={{ color: isLast ? "var(--text-primary)" : "var(--text-secondary)" }}
                  >
                    {seg}
                  </button>
                </span>
              );
            })}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="shrink-0 ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--bg-hover)] transition-colors theme-transition"
            style={{ color: "var(--text-tertiary)" }}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Toolbar */}
        <div
          className="flex items-center gap-1 px-4 py-2 shrink-0"
          style={{ borderBottom: "1px solid var(--border-primary)" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={toolbarBtn}
            style={{ color: "var(--text-secondary)" }}
            disabled={uploading}
          >
            <UploadIcon /> {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            onClick={handleNewFolder}
            className={toolbarBtn}
            style={{ color: "var(--text-secondary)" }}
            disabled={creatingFolder}
          >
            <FolderPlusIcon /> New folder
          </button>
        </div>

        {/* Delete confirmation banner */}
        {deletingItem && (
          <div
            className="flex items-center justify-between gap-3 px-5 py-2.5 shrink-0"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.06)",
              borderBottom: "1px solid var(--border-primary)",
            }}
          >
            <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
              Delete <strong className="font-medium">{deletingItem}</strong>?
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setDeletingItem(null)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg px-2.5 py-1 text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Drag overlay */}
          {dragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg m-2"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "2px dashed var(--accent-primary)",
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <UploadIcon />
                <span className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>
                  Drop files to upload
                </span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--border-primary)",
                  borderTopColor: "var(--text-secondary)",
                }}
              />
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading...</span>
            </div>
          ) : sorted.length === 0 && !creatingFolder ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <span style={{ color: "var(--text-tertiary)", opacity: 0.5 }}>
                <EmptyFolderIcon />
              </span>
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                This folder is empty
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Drop files here or use the upload button
              </span>
            </div>
          ) : (
            <div className="py-1">
              {/* Inline new folder row */}
              {creatingFolder && (
                <div className="flex items-center gap-3 px-5 py-2.5">
                  <span className="shrink-0" style={{ color: "var(--text-secondary)" }}>
                    <FolderIcon />
                  </span>
                  <input
                    ref={newFolderInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onBlur={commitNewFolder}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitNewFolder();
                      if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
                    }}
                    placeholder="Folder name"
                    className="flex-1 min-w-0 text-sm bg-transparent outline-none rounded-md px-2 py-1"
                    style={{
                      color: "var(--text-primary)",
                      border: "1px solid var(--accent-primary)",
                      boxShadow: "0 0 0 1px var(--accent-primary)",
                    }}
                  />
                </div>
              )}

              {sorted.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleClick(item)}
                  className={cx(
                    "group w-full flex items-center gap-3 px-5 py-2.5 text-left",
                    "hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)] transition-colors theme-transition",
                    deletingItem === item.name && "bg-red-500/5"
                  )}
                >
                  <span
                    className="shrink-0"
                    style={{ color: item.type === "directory" ? "var(--text-secondary)" : "var(--text-tertiary)" }}
                  >
                    {item.type === "directory" ? <FolderIcon /> : <FileIcon />}
                  </span>

                  {renamingItem?.name === item.name ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 text-sm bg-transparent outline-none rounded-md px-2 py-0.5"
                      style={{
                        color: "var(--text-primary)",
                        border: "1px solid var(--accent-primary)",
                        boxShadow: "0 0 0 1px var(--accent-primary)",
                      }}
                    />
                  ) : (
                    <span
                      className="flex-1 min-w-0 truncate text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </span>
                  )}

                  {item.type !== "directory" && (
                    <span
                      className="shrink-0 text-xs tabular-nums hidden sm:inline"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {formatSize(item.size)}
                    </span>
                  )}

                  <span
                    className="shrink-0 text-xs w-16 text-right hidden sm:inline"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {formatDate(item.modified)}
                  </span>

                  {/* Action buttons */}
                  <span className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.type !== "directory" && (
                      <button
                        onClick={(e) => handleDownload(item.name, e)}
                        className="rounded-lg p-1.5 hover:bg-[var(--bg-active)] transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        aria-label={`Download ${item.name}`}
                      >
                        <DownloadIcon />
                      </button>
                    )}
                    <button
                      onClick={(e) => startRename(item, e)}
                      className="rounded-lg p-1.5 hover:bg-[var(--bg-active)] transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      aria-label={`Rename ${item.name}`}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.name, e)}
                      className="rounded-lg p-1.5 hover:bg-red-500/10 transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      aria-label={`Delete ${item.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload progress bar */}
        {uploading && (
          <div className="shrink-0 h-0.5 w-full overflow-hidden" style={{ backgroundColor: "var(--border-primary)" }}>
            <div
              className="h-full animate-pulse"
              style={{ backgroundColor: "var(--accent-primary)", width: "100%" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
