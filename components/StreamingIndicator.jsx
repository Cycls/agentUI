export function StreamingIndicator({ className = "" }) {
  return (
    <div className={`py-1 ${className}`} role="status" aria-label="Loading">
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

        .animate-pulse-star {
          animation: pulse-star 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
