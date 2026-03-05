import { ThemeToggle } from "../ThemeContext";
import { SEOHead } from "../SEOHead";

export const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 theme-transition"
      style={{ backgroundColor: "var(--auth-page-bg)" }}
    >
      <SEOHead
        isAuthenticated={false}
        isPublic={false}
        meta={{ title: title || "Sign In", description: "Authentication" }}
      />

      <div className="fixed top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[440px] auth-card-enter">
        <div
          className="rounded-2xl px-10 py-10 theme-transition"
          style={{
            backgroundColor: "var(--auth-card-bg)",
            border: "1px solid var(--auth-card-border)",
            boxShadow: "var(--auth-card-shadow)",
          }}
        >
          {title && (
            <div className="text-center mb-8">
              <h1
                className="text-[26px] font-semibold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="text-[15px] leading-relaxed"
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
  );
};
