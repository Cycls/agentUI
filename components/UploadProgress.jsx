import { Loader2 } from "lucide-react";

export const UploadProgress = ({ fileName, progress }) => {
  return (
    <div
      className="fixed bottom-40 left-1/2 transform -translate-x-1/2 rounded-xl shadow-lg px-4 py-3 min-w-[280px] theme-transition"
      style={{
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border-primary)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Loader2 className="animate-spin h-5 w-5" style={{ color: "var(--text-secondary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {fileName}
          </p>
          <div
            className="mt-1 w-full rounded-full h-1.5"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <div
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: "var(--text-primary)",
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
