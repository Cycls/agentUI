import React, { useMemo } from "react";
import { AttachmentPreview } from "./AttachmentPreview";
import { ErrorMessage } from "./ErrorMessage";
import { MessageActions } from "./MessageActions";
import { extractAttachmentsFromContent } from "../utils/file";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { PartRenderer } from "./PartRenderer";

export const MessageList = React.memo(
  ({
    messages,
    onSend,
    onRegenerate,
    isGenerating,
    onRetry,
    retryingIndex,
  }) => {
    const renderedMessages = useMemo(
      () =>
        messages.map((message, index) => {
          // Handle user messages (both old and new format)
          const isUserMessage = message.type === "request" || message.role === "user";

          if (isUserMessage) {
            const content = message.content || "";
            const { clean, attachments } = extractAttachmentsFromContent(content);

            // RTL detection
            const isRTL = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(
              clean
            );

            return (
              <div
                key={index}
                className={`flex mb-4 ${
                  isRTL ? "justify-start" : "justify-end"
                }`}
              >
                <div className="max-w-[85%] md:max-w-[75%]">
                  {/* Attachments rendered ABOVE the message bubble */}
                  {attachments.length > 0 && (
                    <div className="mb-1">
                      <AttachmentPreview attachments={attachments} />
                    </div>
                  )}

                  {/* Message bubble - only show if there's text content */}
                  {clean && (
                    <div
                      className="px-4 py-2 rounded-3xl shadow-sm theme-transition"
                      style={{
                        backgroundColor: "var(--msg-user-bg)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <div
                        dir="auto"
                        className="text-[15px] leading-relaxed whitespace-pre-wrap"
                      >
                        {clean}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Assistant response - check if it uses new parts format
          const isLastAssistant =
            (message.type === "response" || message.role === "assistant") &&
            index === messages.length - 1 &&
            !isGenerating;

          const hasParts = message.parts && Array.isArray(message.parts);
          const hasContent = !hasParts && (message.content || message.content === "");

          return (
            <div key={index} className="flex mb-4 justify-start group">
              <div className="w-full">
                {/* Show error if present */}
                {message.error ? (
                  <ErrorMessage
                    error={message.error}
                    onRetry={() => onRetry(index)}
                    isRetrying={retryingIndex === index}
                  />
                ) : (
                  <>
                    {/* New format: render parts */}
                    {hasParts && (
                      <div className="space-y-2">
                        {message.parts.map((part, partIndex) => (
                          <PartRenderer
                            key={partIndex}
                            part={part}
                            onSend={onSend}
                          />
                        ))}
                        {message.parts.length === 0 && (
                          <div
                            className="h-4 w-32 rounded animate-pulse"
                            style={{ backgroundColor: "var(--bg-tertiary)" }}
                          ></div>
                        )}
                      </div>
                    )}

                    {/* Old format: render markdown content */}
                    {hasContent && (
                      <div className="prose prose-sm max-w-none">
                        <MarkdownRenderer
                          markdown={message.content}
                          onSend={onSend}
                        />
                        {message.content === "" && (
                          <div
                            className="h-4 w-32 rounded animate-pulse"
                            style={{ backgroundColor: "var(--bg-tertiary)" }}
                          ></div>
                        )}
                      </div>
                    )}

                    {/* Message Actions - only show if message has content or parts */}
                    {((hasParts && message.parts.length > 0) ||
                      (hasContent && message.content && message.content !== "")) && (
                      <MessageActions
                        message={message}
                        onRegenerate={() => onRegenerate(index)}
                        isLastAssistant={isLastAssistant}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          );
        }),
      [messages, onSend, onRegenerate, isGenerating, onRetry, retryingIndex]
    );

    return <div className="space-y-1">{renderedMessages}</div>;
  }
);

MessageList.displayName = "MessageList";
