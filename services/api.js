import { extractAttachmentsFromContent } from "../utils/file";
import {
  readOpenAIStream,
  stripThinkTags,
  readCyclsSSEStream,
} from "../utils/stream";

// ───────────────────────────────────────────────────────────────────────────────
// Metadata API
// ───────────────────────────────────────────────────────────────────────────────
export async function fetchMetadata(signal) {
  const res = await fetch("/config", {
    method: "GET",
    credentials: "include",
    signal,
  });
  if (!res.ok) throw new Error("Metadata request failed: " + res.status);
  return res.json();
}

// ───────────────────────────────────────────────────────────────────────────────
// Chat Completions API
// ───────────────────────────────────────────────────────────────────────────────
export async function sendChatMessage({
  messages,
  auth,
  getToken,
  setActive,
  org,
  onDelta,
  signal,
}) {
  const context = messages.map(({ type, content }) => {
    const role = type === "request" ? "user" : "assistant";
    const { clean, attachments: msgAttachments } =
      extractAttachmentsFromContent(content);

    if (msgAttachments.length === 0) {
      return { role, content: clean };
    }

    const contentArray = [];
    if (clean.trim()) {
      contentArray.push({ type: "text", text: clean });
    }

    for (const att of msgAttachments) {
      if (att.mime && att.mime.startsWith("image/")) {
        contentArray.push({
          type: "image",
          image: att.url,
        });
      } else {
        contentArray.push({
          type: "file",
          file: att.url,
        });
      }
    }

    return { role, content: contentArray };
  });

  const headers = { "Content-Type": "application/json" };

  if (auth && getToken) {
    try {
      const sessionToken = await getToken({ template: "template" });
      if (sessionToken) headers["Authorization"] = "Bearer " + sessionToken;
      if (setActive && org) {
        try {
          await setActive({ organization: org });
        } catch (_error) {
          // Silently ignore setActive errors
        }
      }
    } catch (_error) {
      // Silently ignore getToken errors
    }
  }

  const response = await fetch("/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify({ messages: context, stream: true }),
    signal,
  });

  if (!response.ok) {
    let errorType = "server";
    let errorMessage = "Server returned " + response.status;

    if (response.status === 429) {
      errorType = "rate_limit";
      const retryAfter = response.headers.get("Retry-After");
      errorMessage = retryAfter
        ? "Too many requests. Please try again in " + retryAfter + " seconds."
        : "Too many requests. Please wait a moment and try again.";
    } else if (response.status >= 500) {
      errorMessage = "Server error. Please try again later.";
    } else if (response.status === 401 || response.status === 403) {
      errorMessage = "Authentication error. Please refresh and try again.";
    }

    throw {
      type: errorType,
      status: response.status,
      message: errorMessage,
    };
  }

  const wrappedOnDelta = (full) => {
    const display = stripThinkTags(full);
    onDelta(display);
  };

  await readOpenAIStream(response, wrappedOnDelta, { signal });
}

// ───────────────────────────────────────────────────────────────────────────────
// Cycls Chat API (SSE Streaming Protocol)
// ───────────────────────────────────────────────────────────────────────────────
export async function sendCyclsChatMessage({
  messages,
  auth,
  getToken,
  setActive,
  org,
  onPart,
  signal,
}) {
  const context = messages.map(({ role, content, parts }) => {
    // Handle new format (role + parts/content)
    if (role) {
      if (parts) {
        // Assistant message with parts - keep as-is
        return { role, parts };
      }
      // User message or plain content
      const { clean, attachments: msgAttachments } =
        extractAttachmentsFromContent(content);

      if (msgAttachments.length === 0) {
        return { role, content: clean };
      }

      const contentArray = [];
      if (clean.trim()) {
        contentArray.push({ type: "text", text: clean });
      }

      for (const att of msgAttachments) {
        if (att.mime && att.mime.startsWith("image/")) {
          contentArray.push({
            type: "image",
            image: att.url,
          });
        } else {
          contentArray.push({
            type: "file",
            file: att.url,
          });
        }
      }

      return { role, content: contentArray };
    }

    // Fallback: handle old format (type + content)
    const fallbackRole =
      role || (messages.type === "request" ? "user" : "assistant");
    const { clean, attachments: msgAttachments } =
      extractAttachmentsFromContent(content);

    if (msgAttachments.length === 0) {
      return { role: fallbackRole, content: clean };
    }

    const contentArray = [];
    if (clean.trim()) {
      contentArray.push({ type: "text", text: clean });
    }

    for (const att of msgAttachments) {
      if (att.mime && att.mime.startsWith("image/")) {
        contentArray.push({
          type: "image",
          image: att.url,
        });
      } else {
        contentArray.push({
          type: "file",
          file: att.url,
        });
      }
    }

    return { role: fallbackRole, content: contentArray };
  });

  const headers = { "Content-Type": "application/json" };

  if (auth && getToken) {
    try {
      const sessionToken = await getToken({ template: "template" });
      if (sessionToken) headers["Authorization"] = "Bearer " + sessionToken;
      if (setActive && org) {
        try {
          await setActive({ organization: org });
        } catch (_error) {
          // Silently ignore setActive errors
        }
      }
    } catch (_error) {
      // Silently ignore getToken errors
    }
  }

  const response = await fetch("/chat/cycls", {
    method: "POST",
    headers,
    body: JSON.stringify({ messages: context }),
    signal,
  });

  if (!response.ok) {
    let errorType = "server";
    let errorMessage = "Server returned " + response.status;

    if (response.status === 429) {
      errorType = "rate_limit";
      const retryAfter = response.headers.get("Retry-After");
      errorMessage = retryAfter
        ? "Too many requests. Please try again in " + retryAfter + " seconds."
        : "Too many requests. Please wait a moment and try again.";
    } else if (response.status >= 500) {
      errorMessage = "Server error. Please try again later.";
    } else if (response.status === 401 || response.status === 403) {
      errorMessage = "Authentication error. Please refresh and try again.";
    }

    throw {
      type: errorType,
      status: response.status,
      message: errorMessage,
    };
  }

  await readCyclsSSEStream(response, onPart, { signal });
}
