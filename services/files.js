// ───────────────────────────────────────────────────────────────────────────────
// File API client
// ───────────────────────────────────────────────────────────────────────────────

import { authFetch } from "./authFetch";

export async function listFiles(path, getToken) {
  const params = path ? `?path=${encodeURIComponent(path)}` : "";
  const res = await authFetch(`/files${params}`, {}, getToken);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchBlob(path, getToken) {
  const res = await authFetch(`/files/${encodeURIComponent(path)}`, {}, getToken);
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function uploadFile(dirPath, file, getToken) {
  const fullPath = dirPath ? dirPath + "/" + file.name : file.name;
  const form = new FormData();
  form.append("file", file);
  const res = await authFetch(`/files/${encodeURIComponent(fullPath)}`, { method: "PUT", body: form }, getToken);
  return res.ok;
}

export async function renameItem(oldPath, newPath, getToken) {
  const res = await authFetch(`/files/${encodeURIComponent(oldPath)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: newPath }),
  }, getToken);
  return res.ok;
}

export async function createDir(path, getToken) {
  const res = await authFetch(`/files/${encodeURIComponent(path)}`, { method: "POST" }, getToken);
  return res.ok;
}

export async function deleteItem(path, getToken) {
  const res = await authFetch(`/files/${encodeURIComponent(path)}`, { method: "DELETE" }, getToken);
  return res.ok;
}
