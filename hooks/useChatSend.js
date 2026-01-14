import { useCallback, useRef } from "react";
import { extractAttachmentsFromContent, uploadOne } from "../utils/file";
import { sendChatMessage, sendCyclsChatMessage } from "../services/api";
import { ChatHistoryManager } from "../services/storage";
import {
  trackFileUploadStarted,
  trackFileUploadCompleted,
  trackFileUploadFailed,
  trackMessageSent,
  trackChatCreated,
  trackGenerationStopped,
  trackError,
} from "../analytics/posthog";

// ───────────────────────────────────────────────────────────────────────────────
// Send pipeline with error handling
// ───────────────────────────────────────────────────────────────────────────────
export const useChatSend = ({
  messages,
  setMessages,
  setShouldFocus,
  setIsLoading,
  setUploadProgress,
  setIsUserScrolled,
  onFirstSend,
  auth,
  org,
  getToken,
  setActive,
  activeChatId,
  setActiveChatId,
  onMessageSuccess,
  analyticsEnabled,
}) => {
  const abortControllerRef = useRef(null);

  const send = useCallback(
    async (payload) => {
      const hasPayload = typeof payload === "object" && payload !== null;
      const text = hasPayload ? payload.text || "" : String(payload || "");
      const pendingFiles = hasPayload ? payload.files || [] : [];

      if (!text.trim() && pendingFiles.length === 0) {
        setShouldFocus(true);
        return;
      }

      if (text === ":clear" && pendingFiles.length === 0) {
        setMessages([]);
        setActiveChatId(null);
        ChatHistoryManager.setActiveChat("");
        window.scrollTo(0, 0);
        return;
      }

      if (messages.length === 0) onFirstSend();

      setIsLoading(true);
      setIsUserScrolled(false);

      const attachments = [];
      for (let i = 0; i < pendingFiles.length; i++) {
        const f = pendingFiles[i];
        try {
          setUploadProgress({ fileName: f.name, progress: 0 });
          if (analyticsEnabled) trackFileUploadStarted(f.name, f.type);
          const meta = await uploadOne(f);
          setUploadProgress({ fileName: f.name, progress: 100 });
          if (analyticsEnabled) trackFileUploadCompleted(f.name, f.type);
          attachments.push(meta);
          setTimeout(() => setUploadProgress(null), 500);
        } catch (e) {
          console.error("Upload error:", e);
          if (analyticsEnabled) trackFileUploadFailed(f.name, e.message);
          setUploadProgress(null);
          setIsLoading(false);
          setMessages((prev) => [
            ...prev,
            { role: "user", content: text },
            {
              role: "assistant",
              parts: [],
              error: {
                type: "server",
                message: "Failed to upload " + f.name + ": " + e.message,
                status: null,
              },
            },
          ]);
          return;
        }
      }

      let finalContent = text;
      if (attachments.length > 0) {
        const manifest =
          "<!--cycls:attachments\n" +
          JSON.stringify(attachments) +
          "\ncycls:attachments-->";
        finalContent = text + "\n\n" + manifest;
      }

      const newUserMessage = { role: "user", content: finalContent };
      const newAssistantMessage = { role: "assistant", parts: [] };

      setMessages((prev) => [...prev, newUserMessage, newAssistantMessage]);

      const newMessages = [...messages, newUserMessage];

      let chatId = activeChatId;
      const isNewChat = !chatId;
      if (!chatId) {
        const newChat = ChatHistoryManager.createChat(newMessages);
        chatId = newChat.id;
        setActiveChatId(chatId);
        if (analyticsEnabled) trackChatCreated(chatId);
      } else {
        ChatHistoryManager.updateChat(chatId, newMessages);
      }

      if (analyticsEnabled) {
        trackMessageSent({
          hasAttachments: attachments.length > 0,
          attachmentCount: attachments.length,
          messageLength: text.length,
          chatId: chatId,
          isNewChat: isNewChat,
        });
      }

      abortControllerRef.current = new AbortController();
      let isTimeout = false;
      let timeoutId = null;

      const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            isTimeout = true;
            abortControllerRef.current.abort();
          }
        }, 120000);
      };

      // Set initial timeout
      resetTimeout();

      try {
        // Track current part for aggregation
        let currentPart = null;

        await sendCyclsChatMessage({
          messages: newMessages,
          auth,
          getToken,
          setActive,
          org,
          onPart: (item) => {
            // Reset timeout on every chunk received
            resetTimeout();

            setMessages((prev) => {
              const updated = [...prev];
              const assistantMsg = updated[updated.length - 1];

              // Initialize parts array if needed
              if (!assistantMsg.parts) {
                assistantMsg.parts = [];
              }

              // Check if we can aggregate with current part
              if (currentPart && currentPart.type === item.type) {
                // Aggregate based on type
                if (item.row) {
                  // Table row streaming
                  currentPart.rows.push(item.row);
                } else if (item.type === "text" && item.text) {
                  // Text delta
                  currentPart.text += item.text;
                } else if (item.type === "thinking" && item.thinking) {
                  // Thinking delta
                  currentPart.thinking += item.thinking;
                } else if (item.type === "code" && item.code) {
                  // Code delta
                  currentPart.code += item.code;
                }
              } else {
                // Create new part
                currentPart = { ...item };

                // Initialize rows array for table headers
                if (item.headers) {
                  currentPart.rows = [];
                }

                assistantMsg.parts.push(currentPart);
              }

              return updated;
            });
          },
          signal: abortControllerRef.current.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        const finalMessages = [...newMessages, newAssistantMessage];
        ChatHistoryManager.updateChat(chatId, finalMessages);

        if (onMessageSuccess) {
          onMessageSuccess();
        }

        setIsLoading(false);
        setShouldFocus(true);
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);

        let errorInfo = {
          type: "server",
          message: "An unexpected error occurred",
          status: null,
        };

        if (err.name === "AbortError") {
          if (isTimeout) {
            errorInfo = {
              type: "timeout",
              message:
                "Request timed out. The server took too long to respond.",
            };
            if (analyticsEnabled) trackError("timeout", errorInfo.message);
          } else {
            console.log("Generation stopped by user");
            if (analyticsEnabled) trackGenerationStopped();
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg?.role === "assistant" && lastMsg.parts) {
                // Add a text part indicating generation stopped
                lastMsg.parts.push({
                  type: "text",
                  text: "\n\n*[Generation stopped]*",
                });
                const finalMessages = messages.concat([
                  newUserMessage,
                  lastMsg,
                ]);
                if (chatId) {
                  ChatHistoryManager.updateChat(chatId, finalMessages);
                }
              }
              return updated;
            });
            setIsLoading(false);
            setShouldFocus(true);
            return;
          }
        } else if (err instanceof TypeError && err.message.includes("fetch")) {
          errorInfo = {
            type: "network",
            message:
              "Network error. Please check your connection and try again.",
          };
          if (analyticsEnabled) trackError("network", errorInfo.message);
        } else if (err.type) {
          errorInfo = err;
          if (analyticsEnabled)
            trackError(err.type, err.message, { status: err.status });
        }

        console.error("Request error:", err);

        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg?.role === "assistant") {
            lastMsg.error = errorInfo;
          }
          return updated;
        });

        setIsLoading(false);
        setShouldFocus(true);
      }
    },
    [
      messages,
      auth,
      org,
      getToken,
      setActive,
      activeChatId,
      setActiveChatId,
      onMessageSuccess,
      analyticsEnabled,
      setMessages,
      setShouldFocus,
      setIsLoading,
      setUploadProgress,
      setIsUserScrolled,
      onFirstSend,
    ]
  );

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { send, handleStop };
};
