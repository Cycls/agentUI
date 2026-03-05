import { useState, useCallback } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { AuthToast } from "./AuthToast";
import { mapClerkError } from "./authErrors";

// ── Icons ──
const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export const SignUpPage = ({ afterUrl = "/" }) => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showError = useCallback((msg) => {
    setToast({ message: msg, type: "error" });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    setLoading(true);
    setToast(null);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        // fullName: firstName.trim() + lastName.trim() || undefined,
      });

      if (result.status === "complete") {
        // Sign-up completed immediately (no verification required)
        await setActive({ session: result.createdSessionId });
        navigate(afterUrl, { replace: true });
      } else if (result.status === "missing_requirements") {
        navigate("/auth/complete-signup", { replace: true });
      } else {
        // Needs email verification
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        navigate("/auth/verify-email", { state: { email } });
      }
    } catch (err) {
      showError(mapClerkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    if (!isLoaded || oauthLoading) return;
    setOauthLoading(true);
    setToast(null);

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: afterUrl,
      });
    } catch (err) {
      showError(mapClerkError(err));
      setOauthLoading(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Get started with your free account today."
    >
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
        {oauthLoading ? (
          <Spinner />
        ) : (
          <>
            <GoogleIcon />
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-7">
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "var(--border-primary)" }}
        />
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          or
        </span>
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "var(--border-primary)" }}
        />
      </div>

      {/* Sign-up form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sign-up-first-name" className="auth-label">
              First name
            </label>
            <input
              id="sign-up-first-name"
              type="text"
              autoComplete="given-name"
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              className="auth-input"
              placeholder="Jane"
            />
          </div>
          <div>
            <label htmlFor="sign-up-last-name" className="auth-label">
              Last name
            </label>
            <input
              id="sign-up-last-name"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              className="auth-input"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="sign-up-email" className="auth-label">
            Email address
          </label>
          <input
            id="sign-up-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="auth-input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="sign-up-password" className="auth-label">
            Password
          </label>
          <div className="relative">
            <input
              id="sign-up-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="auth-input"
              style={{ paddingRight: 44 }}
              placeholder="Create a password"
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
          {loading ? <Spinner /> : "Create account"}
        </button>
      </form>

      {/* Footer */}
      <p
        className="text-center text-sm mt-8"
        style={{ color: "var(--text-tertiary)" }}
      >
        Already have an account?{" "}
        <Link
          to="/auth/sign-in"
          className="font-medium hover:underline transition-colors"
          style={{ color: "var(--accent-primary)" }}
        >
          Sign in
        </Link>
      </p>

      {toast && <AuthToast {...toast} onDismiss={() => setToast(null)} />}
    </AuthLayout>
  );
};
