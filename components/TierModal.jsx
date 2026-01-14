import { PricingTable } from "@clerk/clerk-react";

export const TierModal = ({ open, onClose, tier }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md px-4"
      style={{ backgroundColor: "var(--bg-overlay)" }}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden theme-transition"
        style={{
          background:
            "linear-gradient(to bottom, var(--bg-primary), var(--bg-secondary))",
          border: "1px solid var(--border-primary)",
        }}
      >
        {/* Decorative gradient background */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-50"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.05), transparent)",
          }}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 shadow-sm theme-transition"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-primary)",
            color: "var(--text-tertiary)",
          }}
          aria-label="Close"
        >
          <span className="text-xl leading-none">&times;</span>
        </button>

        <div className="relative p-8 md:p-10">
          {/* Header section */}
          <div className="space-y-3 pr-8 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wide">
                Upgrade Available
              </span>
            </div>

            <h2
              className="text-2xl md:text-3xl font-bold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Unlock{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Cycls Pass
              </span>{" "}
              features
            </h2>

            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              You&apos;ve reached your free message limit. Upgrade to access the
              full{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Cycls Pass
              </span>{" "}
              experience, priority AI, and unlimited messages.
            </p>
          </div>

          {/* Billing UI with enhanced container */}
          <div className="relative -mx-2 mb-6">
            <div
              className="max-h-[420px] overflow-y-auto rounded-2xl backdrop-blur-sm shadow-inner scrollbar-thin"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
              }}
            >
              <PricingTable />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-[var(--bg-hover)] theme-transition"
              style={{ color: "var(--text-secondary)" }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
