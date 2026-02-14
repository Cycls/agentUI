import { useState, useEffect } from "react";

export function StreamingIndicator({ className = "" }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Determine the text to display based on elapsed time
  const getText = () => {
    if (elapsedSeconds < 2) {
      return <><strong>Cycls</strong>{"\u2026"}</>;
    } else if (elapsedSeconds < 4) {
      return <><strong>Cycls</strong>{"\u2026 (thinking)"}</>;
    } else {
      return <><strong>Cycls</strong>{`\u2026 (thinking ${elapsedSeconds - 4}s)`}</>;
    }
  };

  return (
    <div
      className={`py-1 flex items-center gap-2 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 100 100"
        className="animate-pulse-star motion-reduce:animate-none"
      >
        <path
          d="M50 0
             C50 27.6, 27.6 50, 0 50
             C27.6 50, 50 72.4, 50 100
             C50 72.4, 72.4 50, 100 50
             C72.4 50, 50 27.6, 50 0Z"
          fill="#D4A574"
        />
      </svg>
      <span
        className="text-sm animate-text-pulse"
        style={{ color: "var(--text-primary)" }}
      >
        {getText()}
      </span>

      <style>{`
        @keyframes pulse-star {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.88);
          }
        }

        @keyframes text-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse-star {
          animation: pulse-star 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-text-pulse {
          animation: text-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
