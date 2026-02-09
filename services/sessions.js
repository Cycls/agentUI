// ───────────────────────────────────────────────────────────────────────────────
// Server-side Sessions API client
// ───────────────────────────────────────────────────────────────────────────────

import { authFetch } from "./authFetch";

export async function listSessions(getToken) {
  const res = await authFetch("/sessions", {}, getToken);
  if (!res.ok) return [];
  return res.json();
}

export async function getSession(id, getToken) {
  const res = await authFetch(`/sessions/${id}`, {}, getToken);
  if (!res.ok) return null;
  return res.json();
}

export async function saveSession(session, getToken) {
  const res = await authFetch(`/sessions/${session.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  }, getToken);
  if (!res.ok) return null;
  return res.json();
}

export async function deleteSession(id, getToken) {
  const res = await authFetch(`/sessions/${id}`, { method: "DELETE" }, getToken);
  return res.ok;
}
