import { useState, useCallback, useMemo } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { AuthToast } from "./AuthToast";
import { mapClerkError } from "./authErrors";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";

// ── Icons ──
const Spinner = () => <Loader2 className="animate-spin w-5 h-5" />;

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

// ── Password strength logic ──
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

// ── Password requirement check ──
const PasswordRequirement = ({ met, label }) => (
  <div
    className="flex items-center gap-2 text-[12px] transition-all duration-300"
    style={{
      color: met ? "#22c55e" : "var(--text-muted)",
      opacity: met ? 1 : 0.7,
    }}
  >
    {met ? (
      <Check size={13} strokeWidth={2.5} />
    ) : (
      <X size={13} strokeWidth={2} />
    )}
    <span>{label}</span>
  </div>
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
  const [passwordFocused, setPasswordFocused] = useState(false);

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
      const result = await signUp.create({
        emailAddress: email,
        password,
      });

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
      title="Create your account"
      subtitle="Start your journey with us today."
    >
      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleOAuth}
        disabled={oauthLoading}
        className="auth-btn-oauth w-full"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1.5px solid var(--border-primary)",
          color: "var(--text-primary)",
        }}
      >
        {oauthLoading ? (
          <Spinner />
        ) : (
          <>
            <GoogleIcon />
            <span className="font-medium">Continue with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "var(--border-primary)" }}
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-muted)" }}
        >
          or continue with email
        </span>
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "var(--border-primary)" }}
        />
      </div>

      {/* Sign-up form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name row */}
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

        {/* Email */}
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

        {/* Password */}
        <div>
          <label htmlFor="sign-up-password" className="auth-label">
            Password
          </label>
          <div className="relative group">
            <input
              id="sign-up-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              disabled={loading}
              className="auth-input"
              style={{ paddingRight: 48 }}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all hover:scale-110"
              style={{
                color: "var(--text-muted)",
                backgroundColor: "transparent",
              }}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff size={17} strokeWidth={1.5} />
              ) : (
                <Eye size={17} strokeWidth={1.5} />
              )}
            </button>
          </div>

          {/* Password strength indicator */}
          {password.length > 0 && (
            <div
              className="mt-3 space-y-2.5 overflow-hidden"
              style={{
                animation: "slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Strength bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-[3px] flex-1 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor:
                          i <= strength.score
                            ? strength.color
                            : "var(--border-primary)",
                        transform:
                          i <= strength.score ? "scaleY(1)" : "scaleY(0.7)",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[11px] font-semibold tracking-wide uppercase min-w-[48px] text-right transition-colors duration-300"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>

              {/* Requirements (show on focus or if weak) */}
              {(passwordFocused || strength.score < 3) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <PasswordRequirement
                    met={password.length >= 8}
                    label="8+ characters"
                  />
                  <PasswordRequirement
                    met={/[A-Z]/.test(password) && /[a-z]/.test(password)}
                    label="Mixed case"
                  />
                  <PasswordRequirement
                    met={/\d/.test(password)}
                    label="Number"
                  />
                  <PasswordRequirement
                    met={/[^A-Za-z0-9]/.test(password)}
                    label="Symbol"
                  />
                </div>
              )}
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
        className="text-center text-[12px] mt-6 leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        By creating an account, you agree to our{" "}
        <Link
          to="/terms"
          className="underline underline-offset-2 transition-colors hover:opacity-80"
          style={{ color: "var(--text-tertiary)" }}
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          to="/privacy"
          className="underline underline-offset-2 transition-colors hover:opacity-80"
          style={{ color: "var(--text-tertiary)" }}
        >
          Privacy Policy
        </Link>
      </p>

      {/* Footer */}
      <p
        className="text-center text-[14px] mt-5"
        style={{ color: "var(--text-tertiary)" }}
      >
        Already have an account?{" "}
        <Link
          to="/auth/sign-in"
          className="font-semibold transition-all hover:opacity-80"
          style={{ color: "var(--accent-primary)" }}
        >
          Sign in
        </Link>
      </p>

      {toast && <AuthToast {...toast} onDismiss={() => setToast(null)} />}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; transform: translateY(-4px); }
          to { opacity: 1; max-height: 120px; transform: translateY(0); }
        }
      `}</style>
    </AuthLayout>
  );
};
