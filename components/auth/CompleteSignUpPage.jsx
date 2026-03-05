import { useState, useEffect, useCallback } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { AuthToast } from "./AuthToast";
import { mapClerkError } from "./authErrors";

const Spinner = () => (
  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export const CompleteSignUpPage = ({ afterUrl = "/" }) => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [missingFields, setMissingFields] = useState([]);

  const showError = useCallback((msg) => {
    setToast({ message: msg, type: "error" });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (signUp?.status === "complete") {
      if (signUp.createdSessionId) {
        setActive({ session: signUp.createdSessionId }).then(() =>
          navigate(afterUrl, { replace: true })
        );
      } else {
        navigate(afterUrl, { replace: true });
      }
      return;
    }

    if (!signUp?.id) {
      navigate("/auth/sign-up", { replace: true });
      return;
    }

    const missing = signUp.missingFields || [];
    setMissingFields(missing);

    if (signUp.firstName) setFirstName(signUp.firstName);
    if (signUp.lastName) setLastName(signUp.lastName);
    if (signUp.username) setUsername(signUp.username);
  }, [isLoaded, signUp, setActive, navigate, afterUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    setLoading(true);
    setToast(null);

    try {
      const updateData = {};
      if (missingFields.includes("username") && username.trim()) {
        updateData.username = username.trim();
      }
      if (missingFields.includes("first_name") && firstName.trim()) {
        updateData.firstName = firstName.trim();
      }
      if (missingFields.includes("last_name") && lastName.trim()) {
        updateData.lastName = lastName.trim();
      }

      const result = await signUp.update(updateData);

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate(afterUrl, { replace: true });
      } else if (
        result.verifications?.emailAddress?.status === "unverified"
      ) {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        navigate("/auth/verify-email", { replace: true });
      } else {
        showError("Could not complete sign-up. Please try again.");
        console.warn("Unhandled signUp status:", result.status);
      }
    } catch (err) {
      showError(mapClerkError(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;

  const showUsername = missingFields.includes("username");
  const showFirstName = missingFields.includes("first_name");
  const showLastName = missingFields.includes("last_name");

  return (
    <AuthLayout
      title="Complete your profile"
      subtitle="Just a few more details to finish setting up your account."
    >
      {/* Profile icon */}
      <div className="flex justify-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {showUsername && (
          <div>
            <label htmlFor="complete-username" className="auth-label">
              Username
            </label>
            <input
              id="complete-username"
              type="text"
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="auth-input"
              placeholder="Choose a username"
            />
          </div>
        )}

        {(showFirstName || showLastName) && (
          <div className="grid grid-cols-2 gap-3">
            {showFirstName && (
              <div>
                <label htmlFor="complete-first-name" className="auth-label">
                  First name
                </label>
                <input
                  id="complete-first-name"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="auth-input"
                  placeholder="Jane"
                />
              </div>
            )}
            {showLastName && (
              <div>
                <label htmlFor="complete-last-name" className="auth-label">
                  Last name
                </label>
                <input
                  id="complete-last-name"
                  type="text"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="auth-input"
                  placeholder="Doe"
                />
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="auth-btn-primary w-full"
          style={{
            backgroundColor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
          }}
        >
          {loading ? <Spinner /> : "Continue"}
        </button>
      </form>

      <div className="pt-6 text-center">
        <Link
          to="/auth/sign-in"
          className="inline-flex items-center gap-1.5 text-sm transition-colors hover:underline"
          style={{ color: "var(--text-tertiary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to sign in
        </Link>
      </div>

      {toast && <AuthToast {...toast} onDismiss={() => setToast(null)} />}
    </AuthLayout>
  );
};
