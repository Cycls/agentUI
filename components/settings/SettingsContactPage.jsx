import { useEffect, useRef } from "react";
import { Mail, ExternalLink } from "lucide-react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

// ── Social Icons ──
const XIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cx("w-4 h-4", props?.className)}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cx("w-4 h-4", props?.className)}
    aria-hidden="true"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// ── Contact Page ──
export const SettingsContactPage = () => {
  const iframeContainerRef = useRef(null);

  useEffect(() => {
    const handleMessage = (e) => {
      if (
        typeof e.data === "object" &&
        e.data !== null &&
        e.data.event === "Tally.ResizeForm" &&
        e.data.payload?.height
      ) {
        const iframe = iframeContainerRef.current?.querySelector("iframe");
        if (iframe) {
          iframe.style.height = `${e.data.payload.height}px`;
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const contacts = [
    {
      label: "Email",
      value: "hello@cycls.ai",
      href: "mailto:hello@cycls.ai",
      icon: <Mail size={16} />,
    },
    {
      label: "X (Twitter)",
      value: "@cyclsai",
      href: "https://x.com/cyclsai",
      icon: <XIcon />,
    },
    {
      label: "LinkedIn",
      value: "Cycls",
      href: "https://linkedin.com/company/cycls",
      icon: <LinkedInIcon />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Contact Info ── */}
      <div>
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Contact Us
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Reach out through any of these channels.
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        {contacts.map((c, i) => (
          <div key={c.label}>
            {i > 0 && (
              <div
                className="mx-4"
                style={{ borderTop: "1px solid var(--border-secondary)" }}
              />
            )}
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-all duration-150 group"
            >
              <span
                className="shrink-0 w-8 h-8 rounded-full grid place-items-center"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-tertiary)",
                }}
              >
                {c.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {c.label}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {c.value}
                </p>
              </div>
              <ExternalLink
                size={14}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--text-muted)" }}
              />
            </a>
          </div>
        ))}
      </div>

      {/* ── Feedback Form ── */}
      <div
        style={{
          borderTop: "1px solid var(--border-secondary)",
          margin: "2.5rem 0",
        }}
      />
      <div>
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Send Feedback
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Let us know how we can improve.
        </p>
      </div>

      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        <div ref={iframeContainerRef}>
          <iframe
            src="https://tally.so/embed/J9Az8K?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            width="100%"
            height="400"
            frameBorder="0"
            title="Feedback Form"
            style={{
              border: "none",
              borderRadius: "12px",
              minHeight: "300px",
            }}
          />
        </div>
      </div>
    </div>
  );
};
