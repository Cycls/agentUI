import { ThemeToggle } from "../ThemeContext";
import { SEOHead } from "../SEOHead";

export const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center theme-transition"
      style={{ backgroundColor: "var(--auth-page-bg)" }}
    >
      <SEOHead
        isAuthenticated={false}
        isPublic={false}
        meta={{ title: title || "Sign In", description: "Authentication" }}
      />

      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[440px] mx-auto px-5 py-12 auth-card-enter">
        <div
          className="rounded-2xl p-8 sm:p-10 theme-transition"
          style={{
            backgroundColor: "var(--auth-card-bg)",
            border: "1px solid var(--auth-card-border)",
            boxShadow: "var(--auth-card-shadow)",
          }}
        >
          {title && (
            <div className="text-center mb-8">
              <h1
                className="text-[26px] font-semibold tracking-[-0.02em]"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="text-[14px] mt-1"
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
