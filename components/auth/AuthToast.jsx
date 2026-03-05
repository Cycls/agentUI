import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ICONS = {
  error: <AlertCircle className="w-5 h-5" />,
  success: <CheckCircle2 className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const COLORS = {
  error: { icon: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)" },
  success: { icon: "var(--accent-primary)", bg: "rgba(16,163,127,0.06)", border: "rgba(16,163,127,0.15)" },
  info: { icon: "#3b82f6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.15)" },
};

export const AuthToast = ({ message, type = "error", onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!message) return null;

  const colors = COLORS[type] || COLORS.error;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 auth-toast-enter"
      style={{ minWidth: 340, maxWidth: "90vw" }}
    >
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3.5"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: `1px solid ${colors.border}`,
          color: "var(--text-primary)",
          boxShadow: "0 8px 30px -8px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)",
        }}
      >
        <span className="shrink-0 mt-0.5" style={{ color: colors.icon }}>
          {ICONS[type] || ICONS.error}
        </span>
        <p className="text-sm flex-1 leading-relaxed">{message}</p>
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: "var(--text-muted)" }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
