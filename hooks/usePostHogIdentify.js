import { useEffect, useRef } from "react";
import {
  identifyUser,
  resetUser,
  trackSignIn,
  trackSignOut,
} from "../analytics/posthog";

// ───────────────────────────────────────────────────────────────────────────────
// PostHog User Identification Hook (for Clerk integration)
// ───────────────────────────────────────────────────────────────────────────────
export const usePostHogIdentify = (isOnPaidPlan, analyticsEnabled, user = null, isLoaded = true) => {
  const prevUserIdRef = useRef(null);

  useEffect(() => {
    if (!analyticsEnabled || !isLoaded) return;

    if (user) {
      if (prevUserIdRef.current !== user.id) {
        identifyUser(user, {
          subscription_status: isOnPaidPlan ? "paid" : "free",
        });
        if (prevUserIdRef.current === null) {
          trackSignIn();
        }
        prevUserIdRef.current = user.id;
      }
    } else if (prevUserIdRef.current !== null) {
      trackSignOut();
      resetUser();
      prevUserIdRef.current = null;
    }
  }, [user, isLoaded, isOnPaidPlan, analyticsEnabled]);
};
