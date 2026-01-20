import { extractAttachmentsFromContent } from "../utils/file";
import { CONFIG } from "../clientConfig";

// ───────────────────────────────────────────────────────────────────────────────
// LocalStorage Keys
// ───────────────────────────────────────────────────────────────────────────────
const CHAT_HISTORY_KEY = "cycls_chat_history";
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
// Chat History Manager
// ───────────────────────────────────────────────────────────────────────────────
export class ChatHistoryManager {
  static getAllChats() {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error loading chat history:", e);
      return [];
    }
  }

  static saveAllChats(chats) {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error("Error saving chat history:", e);
    }
  }

  static getActiveChat() {
    try {
      return localStorage.getItem(ACTIVE_CHAT_KEY);
    } catch (e) {
      return null;
    }
  }

  static setActiveChat(chatId) {
    try {
      localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
    } catch (e) {
      console.error("Error saving active chat:", e);
    }
  }

  static createChat(messages = []) {
    const chats = this.getAllChats();
    const newChat = {
      id: Date.now().toString(),
      title: this.generateTitle(messages),
      messages: messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If we have max chats, remove the oldest
    if (chats.length >= CONFIG.MAX_CHATS) {
      chats.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      chats.shift(); // Remove oldest
    }

    chats.push(newChat);
    this.saveAllChats(chats);
    this.setActiveChat(newChat.id);
    return newChat;
  }

  static updateChat(chatId, messages) {
    const chats = this.getAllChats();
    const chatIndex = chats.findIndex((c) => c.id === chatId);

    if (chatIndex !== -1) {
      chats[chatIndex].messages = messages;
      chats[chatIndex].updatedAt = new Date().toISOString();
      chats[chatIndex].title = this.generateTitle(messages);
      this.saveAllChats(chats);
    }
  }

  static deleteChat(chatId) {
    const chats = this.getAllChats();
    const filtered = chats.filter((c) => c.id !== chatId);
    this.saveAllChats(filtered);

    // If we deleted the active chat, clear active chat
    if (this.getActiveChat() === chatId) {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  }

  static getChat(chatId) {
    const chats = this.getAllChats();
    return chats.find((c) => c.id === chatId);
  }

  static generateTitle(messages) {
    if (!messages || messages.length === 0) {
      return "New Chat";
    }

    // Find first user message (supports both old format with type and new format with role)
    const firstUserMsg = messages.find((m) => m.type === "request" || m.role === "user");
    if (!firstUserMsg) {
      return "New Chat";
    }

    // Extract clean content (without attachments)
    const { clean } = extractAttachmentsFromContent(firstUserMsg.content);
    const title = clean.trim().slice(0, 50);
    return title || "New Chat";
  }

  static clearAll() {
    try {
      localStorage.removeItem(CHAT_HISTORY_KEY);
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    } catch (e) {
      console.error("Error clearing chat history:", e);
    }
  }
}
