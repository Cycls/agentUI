import { useState, useCallback, useMemo } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { AuthToast } from "./AuthToast";
import { mapClerkError } from "./authErrors";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const Spinner = () => <Loader2 className="animate-spin w-5 h-5" />;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score: 2, label: "Fair", color: "#f59e0b" };
  if (score <= 3) return { score: 3, label: "Good", color: "#3b82f6" };
  return { score: 4, label: "Strong", color: "#22c55e" };
};

export const SignUpPage = ({ afterUrl = "/" }) => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const showError = useCallback((msg) => {
    setToast({ message: msg, type: "error" });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setLoading(true);
    setToast(null);
    try {
      const result = await signUp.create({ emailAddress: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate(afterUrl, { replace: true });
      } else if (result.status === "missing_requirements") {
        navigate("/auth/complete-signup", { replace: true });
      } else {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        navigate("/auth/verify-email", { state: { email } });
      }
    } catch (err) {
      showError(mapClerkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (strategy) => {
    if (!isLoaded || oauthLoading) return;
    setOauthLoading(strategy);
    setToast(null);
    try {
      await signUp.authenticateWithRedirect({
        strategy,
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
    <AuthLayout title="Create an account" subtitle="Get started for free.">
      {/* OAuth */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth("oauth_google")}
          disabled={oauthLoading}
          className="auth-btn-oauth"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1.5px solid var(--border-primary)",
            color: "var(--text-primary)",
          }}
        >
          {oauthLoading === "oauth_google" ? (
            <Spinner />
          ) : (
            <>
              <GoogleIcon />
              <span>Google</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("oauth_apple")}
          disabled={oauthLoading}
          className="auth-btn-oauth"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1.5px solid var(--border-primary)",
            color: "var(--text-primary)",
          }}
        >
          {oauthLoading === "oauth_apple" ? (
            <Spinner />
          ) : (
            <>
              <AppleIcon />
              <span>Apple</span>
            </>
          )}
        </button>
      </div>

      <div className="auth-divider">
        <span>or</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sign-up-email" className="auth-label">
            Email
          </label>
          <input
            id="sign-up-email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="auth-input"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--input-border)",
              color: "var(--text-primary)",
            }}
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
              style={{
                paddingRight: 44,
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--text-primary)",
              }}
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
              style={{ color: "var(--text-muted)" }}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Strength bar */}
          {password && (
            <div className="flex items-center gap-2.5 mt-2.5">
              <div
                className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--border-primary)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${strength.score * 25}%`,
                    backgroundColor: strength.color,
                  }}
                />
              </div>
              <span
                className="text-[11px] font-medium min-w-[38px] text-right"
                style={{ color: strength.color }}
              >
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <div className="pt-1">
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
        </div>
      </form>

      {/* Terms */}
      <p
        className="text-center text-[11px] mt-6 leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        By continuing, you agree to our Terms and Privacy Policy.
      </p>

      {/* Footer */}
      <p
        className="text-center text-[13px] mt-5"
        style={{ color: "var(--text-tertiary)" }}
      >
        Have an account?{" "}
        <Link
          to="/auth/sign-in"
          className="font-semibold hover:opacity-80"
          style={{ color: "var(--text-primary)" }}
        >
          Sign in
        </Link>
      </p>

      {toast && <AuthToast {...toast} onDismiss={() => setToast(null)} />}
    </AuthLayout>
  );
};
