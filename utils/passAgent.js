// ───────────────────────────────────────────────────────────────────────────────
// Pass Agent Detection Utilities
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the agent config tier indicates a Cycls Pass agent.
 * If config is missing, defaults to Private agent behavior.
 */
export const isPassAgent = (tier) => {
  if (!tier) {
    if (import.meta.env.DEV) {
      console.warn(
        "[Cycls] Agent tier is missing from config — defaulting to Private agent behavior."
      );
    }
    return false;
  }
  return tier === "cycls_pass";
};

/**
 * Derive a plan slug from the Clerk subscription object.
 * Returns: "trial" | "pass" | "passmax" | "org" | "enterprise"
 */
export const getPlanSlug = (subscription) => {
  const planName = subscription?.subscriptionItems?.[0]?.plan?.name;
  if (!planName) return "trial";
  const lower = planName.toLowerCase();
  if (lower.includes("enterprise")) return "enterprise";
  if (lower.includes("max")) return "passmax";
  if (lower.includes("org")) return "org";
  if (lower.includes("pass")) return "pass";
  return "trial";
};

/**
 * Human-readable plan label for badges.
 */
export const getPlanLabel = (subscription) => {
  const slug = getPlanSlug(subscription);
  const labels = {
    trial: "Trial",
    pass: "Pass",
    passmax: "Pass Max",
    org: "Org",
    enterprise: "Enterprise",
  };
  return labels[slug] || "Trial";
};
