// Parse streaming response - handles both SSE and plain text formats
async function readOpenAIStream(response, onDelta, { signal } = {}) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const contentType = response.headers.get("content-type") || "";

  // Check if it's SSE format
  const isSSE =
    contentType.includes("text/event-stream") || contentType.includes("stream");

  let buffer = "";
  let fullContent = "";
  let detectedSSE = null; // Auto-detect SSE format from content

  while (true) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const { value, done } = await reader.read();
    if (done) break;

    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Auto-detect SSE format on first chunk if not specified in headers
      if (detectedSSE === null && buffer.length > 0) {
        detectedSSE = buffer.trimStart().startsWith("data: ");
      }

      // Use SSE parsing if detected or specified in headers
      if (isSSE || detectedSSE) {
        // Process complete lines
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);

          // Skip empty lines
          if (!line) continue;

          // Parse SSE data lines
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove 'data: ' prefix

            // Check for [DONE] signal
            if (data === "[DONE]") {
              onDelta(fullContent);
              return fullContent;
            }

            try {
              const json = JSON.parse(data);
              const token = json?.choices?.[0]?.delta?.content || "";
              if (token) {
                fullContent += token;
                onDelta(fullContent);
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e, data);
            }
          }
        }
      } else {
        // Plain text mode - just append chunks directly
        fullContent += chunk;
        onDelta(fullContent);
        buffer = ""; // Clear buffer since we're not line-buffering
      }
    }
  }

  // Process any remaining buffer for SSE mode
  if ((isSSE || detectedSSE) && buffer.trim()) {
    const line = buffer.trim();
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      if (data !== "[DONE]") {
        try {
          const json = JSON.parse(data);
          const token = json?.choices?.[0]?.delta?.content || "";
          if (token) {
            fullContent += token;
          }
        } catch (e) {
          console.error("Failed to parse final SSE data:", e, data);
        }
      }
    }
  }

  // Final update to ensure everything is captured
  onDelta(fullContent);
  return fullContent;
}

// Optional: hide <think> blocks from user-visible rendering (keep for logs if needed).
function stripThinkTags(s) {
  return s.replace(/<think>[\s\S]*?<\/think>/g, "");
}

// ───────────────────────────────────────────────────────────────────────────────
// Cycls SSE Stream Reader
// ───────────────────────────────────────────────────────────────────────────────
async function readCyclsSSEStream(response, onPart, { signal } = {}) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const { value, done } = await reader.read();
    if (done) break;

    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete lines
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        // Skip empty lines and non-data lines
        if (!line || !line.startsWith("data: ")) continue;

        const data = line.slice(6); // Remove 'data: ' prefix

        // Check for [DONE] signal
        if (data === "[DONE]") {
          return;
        }

        try {
          const payload = JSON.parse(data);
          onPart(payload);
        } catch (e) {
          console.error("Failed to parse SSE payload:", e, data);
        }
      }
    }
  }
}

export { readOpenAIStream, stripThinkTags, readCyclsSSEStream };
