import "./index.css";
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";

import { ThemeProvider } from "./components/ThemeContext";
import { AnalyticsContext } from "./contexts/AnalyticsContext";
import { Shell } from "./App";

import { fetchMetadata } from "./services/api";
import { initPostHog, setAgentDomain } from "./analytics/posthog";

// ───────────────────────────────────────────────────────────────────────────────
// App Metadata Hook
// ───────────────────────────────────────────────────────────────────────────────
function useAppMetadata() {
  const [state, setState] = React.useState({ status: "loading" });

  React.useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      try {
        const data = await fetchMetadata(ctrl.signal);
        setState({ status: "ready", data });
      } catch (e) {
        setState({ status: "error", error: e });
      }
    })();

    return () => ctrl.abort();
  }, []);

  return state;
}

// ───────────────────────────────────────────────────────────────────────────────
// Root Component
// ───────────────────────────────────────────────────────────────────────────────
const Root = () => {
  const meta = useAppMetadata();

  useEffect(() => {
    if (meta.status === "ready" && meta.data?.analytics === true) {
      initPostHog();
      setAgentDomain();
    }
  }, [meta.status, meta.data?.analytics]);

  if (meta.status === "loading") {
    return (
      <ThemeProvider>
        <div
          className="min-h-screen grid place-items-center text-sm"
          style={{
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-tertiary)",
          }}
        >
          Loading…
        </div>
      </ThemeProvider>
    );
  }

  if (meta.status === "error") {
    console.error("Failed to load /metadata:", meta.error);
    const fallback = {
      header: "",
      intro: "",
      prod: import.meta?.env?.PROD || false,
      auth: false,
      title: "AI Agent",
      tier: null,
      analytics: false,
    };
    return (
      <ThemeProvider>
        <AnalyticsContext.Provider value={false}>
          <Shell meta={fallback} />
        </AnalyticsContext.Provider>
      </ThemeProvider>
    );
  }

  const analyticsEnabled = meta.data?.analytics === true;

  return (
    <ThemeProvider>
      <AnalyticsContext.Provider value={analyticsEnabled}>
        <Shell meta={meta.data} />
      </AnalyticsContext.Provider>
    </ThemeProvider>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ───────────────────────────────────────────────────────────────────────────────
const container = document.getElementById("root");

if (!container._reactRoot) {
  container._reactRoot = createRoot(container);
}
container._reactRoot.render(<Root />);
