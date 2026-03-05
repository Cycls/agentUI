import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

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
          <AlertCircle className="h-5 w-5 text-red-500" />
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
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
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
