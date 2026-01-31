// ───────────────────────────────────────────────────────────────────────────────
// Canvas Export Utilities
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Sanitize filename by removing/replacing invalid characters
 * Preserves Unicode characters (including Arabic, Hebrew, etc.)
 */
function sanitizeFilename(name) {
  if (!name) return "document";

  // Remove only filesystem-unsafe characters, preserve Unicode
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 100) || "document";
}

/**
 * Detect RTL content (Arabic/Hebrew)
 */
function isRTLContent(text) {
  if (!text) return false;
  const sample = text.replace(/\s/g, "").slice(0, 200);
  // Arabic: \u0600-\u06FF, Hebrew: \u0590-\u05FF
  const rtlRegex = /[\u0600-\u06FF\u0590-\u05FF]/;
  return rtlRegex.test(sample);
}

/**
 * Simple markdown to HTML converter for exports
 */
function markdownToHtml(markdown) {
  if (!markdown) return "";

  let html = markdown
    // Escape HTML entities
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    // Lists
    .replace(/^[\-\*] (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  // Wrap in paragraph
  html = "<p>" + html + "</p>";
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);

  return html;
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content) {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch (fallbackErr) {
      console.error("Fallback copy failed:", fallbackErr);
      return false;
    }
  }
}

/**
 * Download content as Markdown file
 */
export function downloadAsMarkdown(content, title) {
  const filename = sanitizeFilename(title) + ".md";
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse markdown content into structured elements for docx
 */
function parseMarkdownToElements(content) {
  const lines = content.split("\n");
  const elements = [];
  let currentList = [];
  let inList = false;

  for (const line of lines) {
    // Check for headers
    if (line.startsWith("### ")) {
      if (inList && currentList.length > 0) {
        elements.push({ type: "list", items: currentList });
        currentList = [];
        inList = false;
      }
      elements.push({ type: "h3", text: line.substring(4) });
    } else if (line.startsWith("## ")) {
      if (inList && currentList.length > 0) {
        elements.push({ type: "list", items: currentList });
        currentList = [];
        inList = false;
      }
      elements.push({ type: "h2", text: line.substring(3) });
    } else if (line.startsWith("# ")) {
      if (inList && currentList.length > 0) {
        elements.push({ type: "list", items: currentList });
        currentList = [];
        inList = false;
      }
      elements.push({ type: "h1", text: line.substring(2) });
    } else if (line.match(/^[\-\*] /)) {
      // Unordered list item
      inList = true;
      currentList.push(line.substring(2));
    } else if (line.match(/^\d+\. /)) {
      // Ordered list item
      inList = true;
      currentList.push(line.replace(/^\d+\. /, ""));
    } else if (line.startsWith("> ")) {
      if (inList && currentList.length > 0) {
        elements.push({ type: "list", items: currentList });
        currentList = [];
        inList = false;
      }
      elements.push({ type: "blockquote", text: line.substring(2) });
    } else if (line.trim() === "---" || line.trim() === "***") {
      if (inList && currentList.length > 0) {
        elements.push({ type: "list", items: currentList });
        currentList = [];
        inList = false;
      }
      elements.push({ type: "hr" });
    } else if (line.trim() === "") {
      if (inList && currentList.length > 0) {
        elements.push({ type: "list", items: currentList });
        currentList = [];
        inList = false;
      }
    } else {
      if (inList && currentList.length > 0) {
        elements.push({ type: "list", items: currentList });
        currentList = [];
        inList = false;
      }
      elements.push({ type: "paragraph", text: line });
    }
  }

  // Handle remaining list items
  if (inList && currentList.length > 0) {
    elements.push({ type: "list", items: currentList });
  }

  return elements;
}

/**
 * Convert inline markdown to TextRun array
 */
function parseInlineMarkdown(text, docx) {
  // Strip markdown formatting and return plain text
  const plainText = text
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/___(.+?)___/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  return [new docx.TextRun({ text: plainText })];
}

/**
 * Download content as Word document (.docx)
 */
export async function downloadAsDocx(content, title) {
  try {
    const docx = await import("docx");
    const { saveAs } = await import("file-saver");

    const isRTL = isRTLContent(content);
    const elements = parseMarkdownToElements(content);
    const children = [];

    // Add title
    children.push(
      new docx.Paragraph({
        children: [new docx.TextRun({ text: title || "Document", bold: true, size: 36 })],
        heading: docx.HeadingLevel.TITLE,
        spacing: { after: 400 },
        bidirectional: isRTL,
      })
    );

    // Convert elements to docx paragraphs
    for (const el of elements) {
      switch (el.type) {
        case "h1":
          children.push(
            new docx.Paragraph({
              children: parseInlineMarkdown(el.text, docx),
              heading: docx.HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
              bidirectional: isRTL,
            })
          );
          break;
        case "h2":
          children.push(
            new docx.Paragraph({
              children: parseInlineMarkdown(el.text, docx),
              heading: docx.HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              bidirectional: isRTL,
            })
          );
          break;
        case "h3":
          children.push(
            new docx.Paragraph({
              children: parseInlineMarkdown(el.text, docx),
              heading: docx.HeadingLevel.HEADING_3,
              spacing: { before: 160, after: 80 },
              bidirectional: isRTL,
            })
          );
          break;
        case "paragraph":
          children.push(
            new docx.Paragraph({
              children: parseInlineMarkdown(el.text, docx),
              spacing: { after: 120 },
              bidirectional: isRTL,
            })
          );
          break;
        case "list":
          for (const item of el.items) {
            children.push(
              new docx.Paragraph({
                children: parseInlineMarkdown(item, docx),
                bullet: { level: 0 },
                spacing: { after: 60 },
                bidirectional: isRTL,
              })
            );
          }
          break;
        case "blockquote":
          children.push(
            new docx.Paragraph({
              children: parseInlineMarkdown(el.text, docx),
              indent: { left: 720 },
              style: "IntenseQuote",
              spacing: { after: 120 },
              bidirectional: isRTL,
            })
          );
          break;
        case "hr":
          children.push(
            new docx.Paragraph({
              children: [],
              border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
              spacing: { before: 200, after: 200 },
            })
          );
          break;
      }
    }

    const doc = new docx.Document({
      sections: [
        {
          properties: {
            // Set RTL for the entire section if content is RTL
            ...(isRTL && { textDirection: docx.TextDirection.RIGHT_TO_LEFT }),
          },
          children,
        },
      ],
    });

    const blob = await docx.Packer.toBlob(doc);
    const filename = sanitizeFilename(title) + ".docx";
    saveAs(blob, filename);
  } catch (err) {
    console.error("Failed to generate DOCX:", err);
    // Fallback to markdown download
    downloadAsMarkdown(content, title);
  }
}

/**
 * Download content as PDF
 * For RTL content (Arabic/Hebrew), uses browser print dialog for proper font support
 */
export async function downloadAsPdf(content, title) {
  // For RTL content, use browser print which handles Arabic fonts correctly
  if (isRTLContent(content)) {
    printToPdf(content, title);
    return;
  }

  try {
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set up document properties
    doc.setProperties({
      title: title || "Document",
      creator: "Canvas Export",
    });

    // Add title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(title || "Document", 20, 20);

    // Add content
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    // Split content into lines that fit the page
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // Simple text rendering - split by newlines and wrap long lines
    const lines = content.split("\n");
    let y = 35;
    const lineHeight = 6;
    const pageHeight = doc.internal.pageSize.getHeight();

    for (const line of lines) {
      // Check for headers (simple detection)
      if (line.startsWith("# ")) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const text = line.substring(2);
        const wrappedLines = doc.splitTextToSize(text, maxWidth);
        for (const wLine of wrappedLines) {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(wLine, margin, y);
          y += lineHeight + 2;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
      } else if (line.startsWith("## ")) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const text = line.substring(3);
        const wrappedLines = doc.splitTextToSize(text, maxWidth);
        for (const wLine of wrappedLines) {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(wLine, margin, y);
          y += lineHeight + 1;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
      } else if (line.startsWith("### ")) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const text = line.substring(4);
        const wrappedLines = doc.splitTextToSize(text, maxWidth);
        for (const wLine of wrappedLines) {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(wLine, margin, y);
          y += lineHeight;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
      } else if (line.trim() === "") {
        y += lineHeight / 2;
      } else {
        // Regular paragraph - remove markdown formatting for PDF
        let text = line
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/\*(.+?)\*/g, "$1")
          .replace(/`(.+?)`/g, "$1")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

        const wrappedLines = doc.splitTextToSize(text, maxWidth);
        for (const wLine of wrappedLines) {
          if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
          }
          doc.text(wLine, margin, y);
          y += lineHeight;
        }
      }
    }

    const filename = sanitizeFilename(title) + ".pdf";
    doc.save(filename);
  } catch (err) {
    console.error("Failed to generate PDF:", err);
    // Fallback to print dialog for PDF
    printToPdf(content, title);
  }
}

/**
 * Open print dialog configured for PDF export
 * This properly handles RTL languages like Arabic and Hebrew
 */
function printToPdf(content, title) {
  const html = markdownToHtml(content);
  const isRTL = isRTLContent(content);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.error("Failed to open print window - popup blocked");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="${isRTL ? "rtl" : "ltr"}" lang="${isRTL ? "ar" : "en"}">
      <head>
        <meta charset="utf-8">
        <title>${title || "Document"}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: ${isRTL ? "'Noto Sans Arabic', 'Arial', 'Tahoma', sans-serif" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
            font-size: 12pt;
            line-height: 1.8;
            color: #000;
            max-width: 100%;
            margin: 0;
            padding: 0;
            direction: ${isRTL ? "rtl" : "ltr"};
            text-align: ${isRTL ? "right" : "left"};
          }
          h1 { font-size: 20pt; margin-top: 0; margin-bottom: 12pt; font-weight: bold; }
          h2 { font-size: 16pt; margin-top: 16pt; margin-bottom: 8pt; font-weight: bold; }
          h3 { font-size: 14pt; margin-top: 14pt; margin-bottom: 6pt; font-weight: bold; }
          p { margin-bottom: 8pt; }
          ul, ol {
            margin-${isRTL ? "right" : "left"}: 18pt;
            padding-${isRTL ? "right" : "left"}: 0;
          }
          li { margin-bottom: 4pt; }
          blockquote {
            margin-${isRTL ? "right" : "left"}: 18pt;
            padding-${isRTL ? "right" : "left"}: 12pt;
            border-${isRTL ? "right" : "left"}: 3pt solid #ccc;
            font-style: italic;
            color: #555;
          }
          code { font-family: 'Consolas', 'Courier New', monospace; background-color: #f5f5f5; padding: 2pt 4pt; }
          a { color: #0066cc; text-decoration: underline; }
          hr { border: none; border-top: 1px solid #ccc; margin: 16pt 0; }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h1>${title || "Document"}</h1>
        ${html}
        <script>
          // Auto-trigger print dialog and close window after
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Don't auto-close - let user save as PDF
            }, 100);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Print document
 */
export function printDocument(content, title) {
  const html = markdownToHtml(content);
  const isRTL = isRTLContent(content);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.error("Failed to open print window");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="${isRTL ? "rtl" : "ltr"}" lang="${isRTL ? "ar" : "en"}">
      <head>
        <meta charset="utf-8">
        <title>${title || "Document"}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          @media print {
            body {
              font-family: ${isRTL ? "'Noto Sans Arabic', 'Arial', 'Tahoma', sans-serif" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
              font-size: 12pt;
              line-height: 1.8;
              color: #000;
              max-width: 100%;
              margin: 0;
              padding: 0;
              direction: ${isRTL ? "rtl" : "ltr"};
              text-align: ${isRTL ? "right" : "left"};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h1 { font-size: 20pt; margin-top: 0; margin-bottom: 12pt; font-weight: bold; }
            h2 { font-size: 16pt; margin-top: 16pt; margin-bottom: 8pt; font-weight: bold; }
            h3 { font-size: 14pt; margin-top: 14pt; margin-bottom: 6pt; font-weight: bold; }
            p { margin-bottom: 8pt; }
            ul, ol {
              margin-${isRTL ? "right" : "left"}: 18pt;
              padding-${isRTL ? "right" : "left"}: 0;
            }
            li { margin-bottom: 4pt; }
            blockquote {
              margin-${isRTL ? "right" : "left"}: 18pt;
              padding-${isRTL ? "right" : "left"}: 12pt;
              border-${isRTL ? "right" : "left"}: 3pt solid #ccc;
              font-style: italic;
              color: #555;
            }
            code { font-family: 'Consolas', 'Courier New', monospace; background-color: #f5f5f5; padding: 2pt 4pt; }
            a { color: #000; text-decoration: underline; }
            hr { border: none; border-top: 1px solid #ccc; margin: 16pt 0; }
          }
        </style>
      </head>
      <body>
        <h1>${title || "Document"}</h1>
        ${html}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
}
