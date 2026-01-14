import React, { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router";
import { SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { ThemeToggle, useTheme } from "./ThemeContext";
import { SEOHead } from "./SEOHead";

// ───────────────────────────────────────────────────────────────────────────────
// Auth Page (/auth)
// ───────────────────────────────────────────────────────────────────────────────
export const AuthPage = ({ afterUrl }) => {
  const location = useLocation();
  const { resolvedTheme } = useTheme();

  // Derive mode from location.hash instead of using state
  const mode =
    location.hash === "#sign-up/" || location.hash === "#sign-up"
      ? "sign-up"
      : "sign-in";

  const sharedAppearance = {
    elements: {
      card: "shadow-none border-none",
      footer: "hidden",
      formButtonPrimary: "py-2.5 rounded-lg transition-colors",
      formFieldInput:
        "border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg",
      formFieldLabel: "text-gray-700 font-medium text-sm",
      dividerLine: "bg-gray-200",
      dividerText: "text-gray-500 text-sm",
    },
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 theme-transition"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      {/* SEO Meta Tags - Mark auth pages as noindex */}
      <SEOHead
        isAuthenticated={false}
        isPublic={false}
        meta={{ title: "Sign In", description: "Authentication page" }}
      />

      {/* Theme toggle on auth page */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {mode === "sign-in" ? (
          <div className="space-y-4">
            <SignIn
              routing="virtual"
              fallbackRedirectUrl={afterUrl}
              signUpUrl="#sign-up"
              appearance={sharedAppearance}
            />
            <div style={{ marginLeft: "-30px" }} className="text-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Don&apos;t have an account?{" "}
                <a
                  href="#sign-up/"
                  className="font-medium hover:underline transition-colors"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SignUp
              routing="virtual"
              fallbackRedirectUrl={afterUrl}
              signInUrl="#sign-in"
              appearance={sharedAppearance}
            />
            <div style={{ marginLeft: "-40px" }} className="text-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Already have an account?{" "}
                <a
                  href="#sign-in/"
                  className="font-medium hover:underline transition-colors"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// RequireAuth Component
// ───────────────────────────────────────────────────────────────────────────────
export const RequireAuth = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <Navigate to="/auth" replace />
    </SignedOut>
  </>
);
