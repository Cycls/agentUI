import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { AuthLayout } from "./AuthLayout";

export const SSOCallbackPage = () => {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-5 py-10">
        {/* Animated spinner */}
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--border-primary)",
              borderTopColor: "var(--accent-primary)",
            }}
          />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Completing sign in
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Please wait&hellip;
          </p>
        </div>
      </div>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/auth/complete-signup"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/auth/complete-signup"
      />
    </AuthLayout>
  );
};
