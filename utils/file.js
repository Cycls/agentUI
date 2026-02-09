import { CONFIG } from "../clientConfig";

// Extract and remove the manifest from message content
function extractAttachmentsFromContent(content) {
  const re = /<!--\s*cycls:attachments\s*([\s\S]*?)\s*cycls:attachments\s*-->/m;
  const m = content.match(re);
  if (!m) return { clean: content, attachments: [] };
  let attachments = [];
  try {
    attachments = JSON.parse(m[1]);
  } catch (_) {
    attachments = [];
  }
  const clean = content.replace(re, "").trimEnd();
  return { clean, attachments };
}

// Derive a display "kind" from MIME for icons/thumbnails
function fileKind(mime) {
  if (!mime) return "file";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/csv") return "csv";
  if (mime === "text/markdown") return "md";
  if (mime === "text/plain") return "txt";
  return "file";
}

// Upload a single file via the attachments API
async function uploadOne(file, getToken) {
  if (file.size > CONFIG.MAX_FILE_BYTES)
    throw new Error("File too large (max 10MB)");
  // All file types accepted

  const fd = new FormData();
  fd.append("file", file);

  const headers = {};
  if (getToken) {
    const token = await getToken({ template: "template" });
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch("/attachments", {
    method: "POST",
    headers,
    body: fd,
  });

  if (!res.ok) throw new Error(`Upload failed (${res.status})`);

  const data = await res.json(); // { url: "https://...signed-url.../photo.png" }

  // Return metadata compatible with existing attachment format
  return {
    name: file.name,
    url: data.url,
    mime: file.type,
    size: file.size,
  };
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}kB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
};

// Validate file before adding to state
const validateFile = (file) => {
  if (file.size > CONFIG.MAX_FILE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" is too large (${formatFileSize(
        file.size
      )}). Maximum size is ${formatFileSize(CONFIG.MAX_FILE_BYTES)}.`,
    };
  }

  // All file types accepted

  return { valid: true };
};

export {
  extractAttachmentsFromContent,
  fileKind,
  formatFileSize,
  uploadOne,
  validateFile,
};
