import { fileKind } from "../utils/file";

export const AttachmentPreview = ({ attachments = [] }) => {
  if (!attachments.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((f, i) => {
        const kind = fileKind(f.mime);

        if (kind === "image") {
          return (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-lg shadow-sm transition-all duration-200 theme-transition"
              style={{ border: "1px solid var(--border-primary)" }}
            >
              <img
                src={f.url}
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
            pdf: "📄",
            csv: "📊",
            md: "📝",
            txt: "📝",
            video: "🎬",
          }[kind] || "📎";

        return (
          <a
            key={i}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
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
      })}
    </div>
  );
};
