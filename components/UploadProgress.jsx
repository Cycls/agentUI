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
          <svg
            className="animate-spin h-5 w-5"
            style={{ color: "var(--text-secondary)" }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
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
