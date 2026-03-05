import { useState, useCallback } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { useLocation, useNavigate, Link } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { AuthToast } from "./AuthToast";
import { OTPInput } from "./OTPInput";
import { mapClerkError } from "./authErrors";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";

// ── Shared Icons ──
const EyeIcon = () => <Eye size={18} strokeWidth={1.5} />;
const EyeOffIcon = () => <EyeOff size={18} strokeWidth={1.5} />;
const Spinner = () => <Loader2 className="animate-spin w-5 h-5" />;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const SignInPage = ({ afterUrl = "/" }) => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || afterUrl;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // 2FA state
  const [needs2FA, setNeeds2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);

  const showError = useCallback((msg) => {
    setToast({ message: msg, type: "error" });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    setLoading(true);
    setToast(null);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate(redirectTo, { replace: true });
      } else if (result.status === "needs_second_factor") {
        await signIn.prepareSecondFactor({ strategy: "email_code" });
        setNeeds2FA(true);
      } else if (result.status === "needs_first_factor") {
        showError("Additional verification is required. Please try again.");
      } else {
        showError("Sign in could not be completed. Please try again.");
        console.warn("Unhandled signIn status:", result.status);
      }
    } catch (err) {
      showError(mapClerkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (code) => {
    if (!isLoaded || twoFALoading) return;

    const submitCode = code || twoFACode;
    if (submitCode.length < 6) return;

    setTwoFALoading(true);
    setToast(null);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: submitCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate(redirectTo, { replace: true });
      } else {
        showError("Verification could not be completed. Please try again.");
      }
    } catch (err) {
      showError(mapClerkError(err));
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    if (!isLoaded || oauthLoading) return;
    setOauthLoading(true);
    setToast(null);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectTo,
      });
    } catch (err) {
      showError(mapClerkError(err));
      setOauthLoading(false);
    }
  };

  if (!isLoaded) return null;

  // ── 2FA View ──
  if (needs2FA) {
    return (
      <AuthLayout title="Two-factor authentication" subtitle="Enter the verification code sent to your email.">
        <div className="space-y-6">
          {/* Email icon */}
          <div className="flex justify-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <Mail size={28} strokeWidth={1.5} stroke="var(--accent-primary)" />
            </div>
          </div>

          <OTPInput
            value={twoFACode}
            onChange={(code) => {
              setTwoFACode(code);
              if (code.replace(/\s/g, "").length === 6) {
                handle2FASubmit(code);
              }
            }}
            disabled={twoFALoading}
          />

          <button
            type="button"
            onClick={() => handle2FASubmit()}
            disabled={twoFALoading || twoFACode.length < 6}
            className="auth-btn-primary w-full"
            style={{
              backgroundColor: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
            }}
          >
            {twoFALoading ? <Spinner /> : "Verify"}
          </button>

          <button
            type="button"
            onClick={() => {
              setNeeds2FA(false);
              setTwoFACode("");
            }}
            className="w-full text-sm text-center py-1 hover:underline transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            Back to sign in
          </button>
        </div>
        {toast && <AuthToast {...toast} onDismiss={() => setToast(null)} />}
      </AuthLayout>
    );
  }

  // ── Main Sign-In View ──
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue.">
      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleOAuth}
        disabled={oauthLoading}
        className="auth-btn-oauth w-full"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-primary)",
          color: "var(--text-primary)",
        }}
      >
        {oauthLoading ? <Spinner /> : <><GoogleIcon /><span>Continue with Google</span></>}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-7">
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-primary)" }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-primary)" }} />
      </div>

      {/* Email + Password form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="sign-in-email" className="auth-label">
            Email address
          </label>
          <input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="auth-input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="sign-in-password" className="auth-label">
            Password
          </label>
          <div className="relative">
            <input
              id="sign-in-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="auth-input"
              style={{ paddingRight: 44 }}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
              style={{ color: "var(--text-muted)" }}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="auth-btn-primary w-full"
          style={{
            backgroundColor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
          }}
        >
          {loading ? <Spinner /> : "Sign in"}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm mt-8" style={{ color: "var(--text-tertiary)" }}>
        Don&apos;t have an account?{" "}
        <Link
          to="/auth/sign-up"
          className="font-medium hover:underline transition-colors"
          style={{ color: "var(--accent-primary)" }}
        >
          Sign up
        </Link>
      </p>

      {toast && <AuthToast {...toast} onDismiss={() => setToast(null)} />}
    </AuthLayout>
  );
};
