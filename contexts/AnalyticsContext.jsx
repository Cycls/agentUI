import { createContext, useContext } from "react";

// ───────────────────────────────────────────────────────────────────────────────
// Analytics Context - to share analytics enabled state across components
// ───────────────────────────────────────────────────────────────────────────────
export const AnalyticsContext = createContext(false);

export const useAnalytics = () => useContext(AnalyticsContext);
