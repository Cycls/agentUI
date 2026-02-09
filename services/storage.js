// ───────────────────────────────────────────────────────────────────────────────
// LocalStorage Keys
// ───────────────────────────────────────────────────────────────────────────────
const ACTIVE_CHAT_KEY = "cycls_active_chat";
const MESSAGE_COUNT_KEY = "cycls_message_count";

// ───────────────────────────────────────────────────────────────────────────────
// Message Count Helpers
// ───────────────────────────────────────────────────────────────────────────────
export function getMessageCount() {
  try {
    const count = localStorage.getItem(MESSAGE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementMessageCount() {
  try {
    const current = getMessageCount();
    localStorage.setItem(MESSAGE_COUNT_KEY, String(current + 1));
    return current + 1;
  } catch {
    return 0;
  }
}

export function clearMessageCount() {
  try {
    localStorage.removeItem(MESSAGE_COUNT_KEY);
  } catch (_error) {
    // Silently ignore localStorage errors
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Active Chat Helpers (local-only concern)
// ───────────────────────────────────────────────────────────────────────────────
export function getActiveChat() {
  try {
    return localStorage.getItem(ACTIVE_CHAT_KEY);
  } catch {
    return null;
  }
}

export function setActiveChat(chatId) {
  try {
    localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
  } catch (_) {
    // Silently ignore
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Pinned Chats Helpers (local-only, max 3)
// ───────────────────────────────────────────────────────────────────────────────
const PINNED_CHATS_KEY = "cycls_pinned_chats";
const MAX_PINS = 3;

export function getPinnedChats() {
  try {
    const stored = localStorage.getItem(PINNED_CHATS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function pinChat(chatId) {
  const pins = getPinnedChats();
  if (pins.includes(chatId)) return pins;
  const updated = [chatId, ...pins].slice(0, MAX_PINS);
  try { localStorage.setItem(PINNED_CHATS_KEY, JSON.stringify(updated)); } catch {}
  return updated;
}

export function unpinChat(chatId) {
  const pins = getPinnedChats();
  const updated = pins.filter((id) => id !== chatId);
  try { localStorage.setItem(PINNED_CHATS_KEY, JSON.stringify(updated)); } catch {}
  return updated;
}

export function isPinned(chatId) {
  return getPinnedChats().includes(chatId);
}

// ───────────────────────────────────────────────────────────────────────────────
// Title generation helper (moved from ChatHistoryManager)
// ───────────────────────────────────────────────────────────────────────────────
export function generateTitle(messages) {
  if (!messages || messages.length === 0) return "New Chat";
  const firstUserMsg = messages.find(
    (m) => m.type === "request" || m.role === "user"
  );
  if (!firstUserMsg) return "New Chat";
  // Extract clean content (strip attachment manifests)
  const re = /<!--\s*cycls:attachments\s*[\s\S]*?\s*cycls:attachments\s*-->/m;
  const clean = (firstUserMsg.content || "").replace(re, "").trim();
  const title = clean.slice(0, 50);
  return title || "New Chat";
}
