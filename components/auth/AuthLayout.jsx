import { ThemeToggle } from "../ThemeContext";
import { SEOHead } from "../SEOHead";

export const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div
      className="min-h-screen flex theme-transition relative overflow-hidden"
      style={{ backgroundColor: "var(--auth-page-bg)" }}
    >
      <SEOHead
        isAuthenticated={false}
        isPublic={false}
        meta={{ title: title || "Sign In", description: "Authentication" }}
      />

      {/* ── Decorative background layer ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Gradient orbs */}
        <div
          className="absolute -top-[30%] -right-[15%] w-[700px] h-[700px] rounded-full opacity-[0.07] blur-[120px]"
          style={{ background: "var(--accent-primary)" }}
        />
        <div
          className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.05] blur-[100px]"
          style={{ background: "var(--accent-primary)" }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(var(--text-primary) 1px, transparent 1px),
                              linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* ── Theme toggle ── */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 w-full flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[460px] auth-card-enter">
          {/* Card */}
          <div
            className="rounded-3xl px-8 sm:px-11 py-10 sm:py-12 theme-transition relative"
            style={{
              backgroundColor: "var(--auth-card-bg)",
              border: "1px solid var(--auth-card-border)",
              boxShadow: "var(--auth-card-shadow)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Decorative accent line at top of card */}
            <div
              className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, var(--accent-primary), transparent)`,
                opacity: 0.5,
              }}
            />

            {title && (
              <div className="text-center mb-9">
                <h1
                  className="text-[28px] sm:text-[32px] font-bold tracking-[-0.03em] leading-tight"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily:
                      "'Instrument Sans', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                  }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p
                    className="text-[15px] mt-2 leading-relaxed font-normal"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>

      {/* ── Scoped animation styles ── */}
      <style>{`

        .auth-card-enter {
          animation: authCardReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          font-family: inherit;
        }

        @keyframes authCardReveal {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
            filter: blur(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        /* ── Input base ── */
        .auth-input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 400;
          outline: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          background-color: var(--bg-secondary, #f5f5f5);
          border: 1.5px solid var(--border-primary, #e0e0e0);
          color: var(--text-primary);
        }
        .auth-input::placeholder {
          color: var(--text-muted);
          font-weight: 400;
        }
        .auth-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 12%, transparent);
          background-color: var(--bg-primary, #fff);
        }
        .auth-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Label ── */
        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          letter-spacing: 0.01em;
          color: var(--text-secondary);
        }

        /* ── Primary button ── */
        .auth-btn-primary {
          height: 50px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          border: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          letter-spacing: -0.01em;
          position: relative;
          overflow: hidden;
        }
        .auth-btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.2s;
          background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%);
        }
        .auth-btn-primary:hover:not(:disabled)::after {
          opacity: 1;
        }
        .auth-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px color-mix(in srgb, var(--btn-primary-bg) 35%, transparent);
        }
        .auth-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .auth-btn-primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* ── OAuth button ── */
        .auth-btn-oauth {
          height: 50px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .auth-btn-oauth:hover:not(:disabled) {
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-hover, var(--border-primary)) !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .auth-btn-oauth:active:not(:disabled) {
          transform: translateY(0);
        }
        .auth-btn-oauth:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
