import { useEffect } from "react";

export const FileErrorToast = ({ error, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-40 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 rounded-xl shadow-lg px-4 py-3 min-w-[320px] max-w-[90vw] z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="h-5 w-5 text-red-600"
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
          <p className="text-sm font-medium text-red-900">Upload Error</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
          aria-label="Dismiss"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
