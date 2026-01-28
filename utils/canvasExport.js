// ───────────────────────────────────────────────────────────────────────────────
// Canvas Export Utilities
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Sanitize filename by removing/replacing invalid characters
 */
function sanitizeFilename(name) {
  return (name || "document")
    .replace(/[^a-z0-9\s\-_]/gi, "")
    .replace(/\s+/g, "_")
    .substring(0, 50) || "document";
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
  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

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
 * Download content as Word document (.docx)
 */
export async function downloadAsDocx(content, title) {
  try {
    const htmlToDocx = (await import("html-to-docx")).default;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title || "Document"}</title>
          <style>
            body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
            h1 { font-size: 18pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
            h2 { font-size: 14pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
            h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
            p { margin-top: 0; margin-bottom: 6pt; }
            ul, ol { margin-left: 18pt; }
            li { margin-bottom: 3pt; }
            blockquote { margin-left: 18pt; font-style: italic; color: #666; }
            code { font-family: 'Consolas', monospace; background-color: #f5f5f5; padding: 1pt 3pt; }
          </style>
        </head>
        <body>
          ${markdownToHtml(content)}
        </body>
      </html>
    `;

    const blob = await htmlToDocx(html, null, {
      table: { row: { cantSplit: true } },
      footer: false,
      header: false,
    });

    const filename = sanitizeFilename(title) + ".docx";
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to generate DOCX:", err);
    // Fallback to markdown download
    downloadAsMarkdown(content, title);
  }
}

/**
 * Download content as PDF
 */
export async function downloadAsPdf(content, title) {
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
    // Fallback to markdown download
    downloadAsMarkdown(content, title);
  }
}

/**
 * Print document
 */
export function printDocument(content, title) {
  const html = markdownToHtml(content);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.error("Failed to open print window");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title || "Document"}</title>
        <style>
          @media print {
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
              max-width: 100%;
              margin: 0;
              padding: 20mm;
            }
            h1 { font-size: 18pt; margin-top: 12pt; margin-bottom: 6pt; }
            h2 { font-size: 14pt; margin-top: 12pt; margin-bottom: 6pt; }
            h3 { font-size: 12pt; margin-top: 12pt; margin-bottom: 6pt; }
            p { margin-bottom: 6pt; }
            ul, ol { margin-left: 18pt; }
            blockquote { margin-left: 18pt; font-style: italic; border-left: 2pt solid #ccc; padding-left: 12pt; }
            code { font-family: 'Consolas', monospace; background-color: #f5f5f5; padding: 1pt 3pt; }
            a { color: #000; text-decoration: underline; }
          }
          @page {
            margin: 20mm;
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
