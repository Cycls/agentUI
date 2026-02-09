// ───────────────────────────────────────────────────────────────────────────────
// Shared authenticated fetch helper
// ───────────────────────────────────────────────────────────────────────────────

export async function authFetch(url, options = {}, getToken) {
  const headers = { ...options.headers };
  if (getToken) {
    try {
      const token = await getToken({ template: "template" });
      if (token) headers["Authorization"] = "Bearer " + token;
    } catch (_) {
      // Auth not available — proceed without token
    }
  }
  return fetch(url, { ...options, headers });
}
