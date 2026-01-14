import React, { createContext, useContext, useMemo } from "react";
import { useSubscription } from "@clerk/clerk-react/experimental";

// ───────────────────────────────────────────────────────────────────────────────
// Subscription Context - to share subscription state from Clerk when AUTH enabled
// ───────────────────────────────────────────────────────────────────────────────
const SubscriptionContext = createContext({
  subscription: null,
  isLoading: false,
  error: null,
  revalidate: () => {},
});

export const useSubscriptionContext = () => useContext(SubscriptionContext);

// ───────────────────────────────────────────────────────────────────────────────
// Subscription Provider - only renders when inside ClerkProvider
// ───────────────────────────────────────────────────────────────────────────────
export const SubscriptionProvider = ({ tier, children }) => {
  const {
    data: subscription,
    isLoading,
    error,
    revalidate,
  } = useSubscription({
    enabled: tier === "cycls_pass",
  });

  const value = useMemo(
    () => ({
      subscription,
      isLoading,
      error,
      revalidate,
    }),
    [subscription, isLoading, error, revalidate]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
