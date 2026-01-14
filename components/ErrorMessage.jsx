export const ErrorMessage = ({ error, onRetry, isRetrying }) => {
  const getErrorMessage = (error) => {
    if (!error) return "An unexpected error occurred";

    if (error.type === "network") {
      return "Network error. Please check your connection and try again.";
    }

    if (error.type === "timeout") {
      return "Request timed out. The server took too long to respond.";
    }

    if (error.type === "rate_limit") {
      return (
        error.message ||
        "Too many requests. Please wait a moment and try again."
      );
    }

    if (error.type === "server") {
      return `Server error (${
        error.status || "unknown"
      }). Please try again later.`;
    }

    if (error.type === "abort") {
      return "Request was cancelled.";
    }

    return error.message || "An error occurred while processing your request.";
  };

  return (
    <div
      className="rounded-lg p-4 my-2 theme-transition"
      style={{
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="h-5 w-5 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-500">Error</p>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {getErrorMessage(error)}
          </p>

          {onRetry && error.type !== "abort" && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 hover:text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed theme-transition"
              style={{ backgroundColor: "var(--bg-primary)" }}
            >
              {isRetrying ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  <span>Retry</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
