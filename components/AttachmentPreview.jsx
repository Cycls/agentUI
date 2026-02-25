import { fileKind } from "../utils/file";
import { useAuthSrc } from "../hooks/useAuthSrc";

function AttachmentItem({ f, getToken }) {
  const kind = fileKind(f.mime);
  const { src, loading } = useAuthSrc(f.url, getToken);

  if (kind === "image") {
    if (loading || !src) {
      return (
        <div
          className="w-40 h-28 rounded-lg animate-pulse"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        />
      );
    }
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative overflow-hidden rounded-lg shadow-sm transition-all duration-200 theme-transition"
        style={{ border: "1px solid var(--border-primary)" }}
      >
        <img
          src={src}
          alt={f.name || ""}
          loading="lazy"
          className="mb-1 w-40 rounded-md"
        />
      </a>
    );
  }

  // Document chip with emoji icons
  const icon =
    {
      pdf: "\u{1F4C4}",
      csv: "\u{1F4CA}",
      md: "\u{1F4DD}",
      txt: "\u{1F4DD}",
      video: "\u{1F3AC}",
    }[kind] || "\u{1F4CE}";

  const handleClick = (e) => {
    // For auth-protected paths, download via blob URL
    if (src && f.url && !f.url.startsWith("http")) {
      e.preventDefault();
      const a = document.createElement("a");
      a.href = src;
      a.download = f.name || "file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <a
      href={src || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center gap-2.5 rounded-xl backdrop-blur-sm px-4 py-2.5 text-sm transition-all shadow-sm hover:bg-[var(--bg-hover)] theme-transition"
      style={{
        border: "1px solid var(--border-primary)",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <span className="text-xl">{icon}</span>
      <span
        className="text-xs uppercase font-semibold tracking-wide"
        style={{ color: "var(--text-tertiary)" }}
      >
        {kind || "file"}
      </span>
    </a>
  );
}

export const AttachmentPreview = ({ attachments = [], getToken }) => {
  if (!attachments.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((f, i) => (
        <AttachmentItem key={i} f={f} getToken={getToken} />
      ))}
    </div>
  );
};
