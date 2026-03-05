// Maps Clerk error codes to user-friendly messages
const ERROR_MAP = {
  form_identifier_not_found: "No account found with that email address.",
  form_password_incorrect: "Incorrect password. Please try again.",
  form_password_pwned:
    "This password has been found in a data breach. Please choose a different one.",
  form_password_length_too_short: "Password must be at least 8 characters.",
  form_identifier_exists: "An account with this email already exists.",
  form_code_incorrect: "Invalid verification code. Please try again.",
  form_code_expired: "Verification code expired. Please request a new one.",
  too_many_attempts: "Too many attempts. Please try again later.",
  too_many_requests: "Too many requests. Please wait a moment and try again.",
  session_exists: "You are already signed in.",
  strategy_for_user_invalid:
    "This sign-in method is not available for your account.",
  form_param_nil: "Please fill in all required fields.",
  form_password_not_strong_enough:
    "Password is not strong enough. Use a mix of letters, numbers, and symbols.",
  form_param_format_invalid: "Please enter a valid email address.",
  verification_failed: "Verification failed. Please try again.",
  verification_expired: "Verification expired. Please start over.",
  external_account_not_found: "No account found. Please sign up first.",
  external_account_exists:
    "An account with this external provider already exists.",
  oauth_access_denied: "Access was denied. Please try again.",
  oauth_failure: "Authentication failed. Please try again.",
  not_allowed_access:
    "You are not allowed to access this application. Please contact the administrator.",
};

export function mapClerkError(err) {
  if (err?.errors?.length) {
    const e = err.errors[0];
    return ERROR_MAP[e.code] || e.longMessage || e.message || "Something went wrong.";
  }
  if (err?.code) {
    return ERROR_MAP[err.code] || err.longMessage || err.message || "Something went wrong.";
  }
  if (err?.message) {
    // Network errors
    if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
      return "Network error. Please check your connection and try again.";
    }
    return err.message;
  }
  return "Something went wrong. Please try again.";
}
