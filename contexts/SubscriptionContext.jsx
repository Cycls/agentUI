import React, { createContext, useContext, useMemo } from "react";
import { useSubscription } from "@clerk/clerk-react/experimental";
import { useOrganization } from "@clerk/clerk-react";

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
// Subscription Provider - checks org subscription when active, else personal
// ───────────────────────────────────────────────────────────────────────────────
export const SubscriptionProvider = ({ children }) => {
  const { organization } = useOrganization();

  const {
    data: subscription,
    isLoading,
    error,
    revalidate,
  } = useSubscription(organization ? { for: "organization" } : {});

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
