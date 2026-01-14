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

// small helper: uploads a single File via Edge Function
async function uploadOne(file, orgId = "anon", userId = "anon") {
  if (file.size > CONFIG.MAX_FILE_BYTES)
    throw new Error("File too large (max 10MB)");
  if (!CONFIG.ALLOWED_MIME.has(file.type))
    throw new Error(`Type not allowed: ${file.type}`);
  const fd = new FormData();
  fd.append("file", file);
  fd.append("orgId", orgId);
  fd.append("userId", userId);
  const res = await fetch(
    "https://cfywthfcvbajcekvwajz.supabase.co/functions/v1/upload",
    { method: "POST", body: fd }
  );
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return await res.json(); // { name,url,mime,size,sha256,path }
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

  if (!CONFIG.ALLOWED_MIME.has(file.type)) {
    const allowedTypes = Array.from(CONFIG.ALLOWED_MIME)
      .map((type) => type.split("/")[1])
      .join(", ");
    return {
      valid: false,
      error: `File type "${file.type}" is not supported. Allowed types: ${allowedTypes}`,
    };
  }

  return { valid: true };
};

export {
  extractAttachmentsFromContent,
  fileKind,
  formatFileSize,
  uploadOne,
  validateFile,
};
