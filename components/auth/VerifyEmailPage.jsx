import { useState, useCallback, useEffect } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, useLocation, Link } from "react-router";
import { AuthLayout } from "./AuthLayout";
import { AuthToast } from "./AuthToast";
import { OTPInput } from "./OTPInput";
import { mapClerkError } from "./authErrors";
import { Loader2, Mail, ChevronLeft } from "lucide-react";

const Spinner = () => <Loader2 className="animate-spin w-5 h-5" />;

const RESEND_COOLDOWN = 30;

export const VerifyEmailPage = ({ afterUrl = "/" }) => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const showError = useCallback((msg) => {
    setToast({ message: msg, type: "error" });
  }, []);

  // Redirect if no sign-up in progress
  useEffect(() => {
    if (isLoaded && !signUp?.id) {
      navigate("/auth/sign-up", { replace: true });
    }
  }, [isLoaded, signUp?.id, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleVerify = async (verifyCode) => {
    if (!isLoaded || loading) return;

    const submitCode = verifyCode || code;
    if (submitCode.replace(/\s/g, "").length < 6) return;

    setLoading(true);
    setToast(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: submitCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate(afterUrl, { replace: true });
      } else if (result.status === "missing_requirements") {
        navigate("/auth/complete-signup", { replace: true });
      } else {
        showError("Verification could not be completed. Please try again.");
        console.warn("Unhandled signUp status:", result.status);
      }
    } catch (err) {
      showError(mapClerkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || resendCooldown > 0) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendCooldown(RESEND_COOLDOWN);
      setToast({ message: "Verification code sent!", type: "success" });
    } catch (err) {
      showError(mapClerkError(err));
    }
  };

  if (!isLoaded) return null;

  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        emailFromState
          ? `We sent a 6-digit code to ${emailFromState}`
          : "Enter the 6-digit code sent to your email."
      }
    >
      <div className="space-y-6">
        {/* Email icon */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <Mail size={32} strokeWidth={1.5} stroke="var(--accent-primary)" />
          </div>
        </div>

        <OTPInput
          value={code}
          onChange={(newCode) => {
            setCode(newCode);
            if (newCode.replace(/\s/g, "").length === 6) {
              handleVerify(newCode);
            }
          }}
          disabled={loading}
        />

        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={loading || code.replace(/\s/g, "").length < 6}
          className="auth-btn-primary w-full"
          style={{
            backgroundColor: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
          }}
        >
          {loading ? <Spinner /> : "Verify email"}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-sm transition-colors disabled:cursor-not-allowed"
            style={{ color: resendCooldown > 0 ? "var(--text-muted)" : "var(--accent-primary)" }}
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Didn\u2019t receive a code? Resend"}
          </button>
        </div>

        <div className="pt-2 text-center">
          <Link
            to="/auth/sign-up"
            className="inline-flex items-center gap-1.5 text-sm transition-colors hover:underline"
            style={{ color: "var(--text-tertiary)" }}
          >
            <ChevronLeft size={14} />
            Back to sign up
          </Link>
        </div>
      </div>

      {toast && <AuthToast {...toast} onDismiss={() => setToast(null)} />}
    </AuthLayout>
  );
};
