import React, { useState, useCallback, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { CheckCircle, AlertCircle } from "lucide-react";
import { CONFIG } from "../clientConfig";
import { useTheme } from "./ThemeContext";

// Module-level singleton — only created once
const stripePromise = CONFIG.STRIPE_PUBLISHABLE_KEY
  ? loadStripe(CONFIG.STRIPE_PUBLISHABLE_KEY)
  : null;

if (!CONFIG.STRIPE_PUBLISHABLE_KEY && import.meta.env.DEV) {
  console.warn(
    "[PaymentBlock] VITE_STRIPE_PUBLISHABLE_KEY is not set. Payment will not work."
  );
}

function ErrorState({ message }) {
  return (
    <div
      className="my-3 rounded-lg border flex items-center gap-3 px-4 py-4 theme-transition"
      style={{
        borderColor: "var(--border-primary)",
        backgroundColor: "rgba(239, 68, 68, 0.06)",
      }}
    >
      <AlertCircle
        size={18}
        strokeWidth={1.7}
        className="flex-shrink-0"
        style={{ color: "var(--text-error, #ef4444)" }}
      />
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {message}
      </span>
    </div>
  );
}

function SuccessState() {
  return (
    <div
      className="my-3 rounded-lg border flex items-center gap-3 px-4 py-4 theme-transition"
      style={{
        borderColor: "var(--border-primary)",
        backgroundColor: "rgba(16, 163, 127, 0.06)",
      }}
    >
      <CheckCircle
        size={18}
        strokeWidth={1.7}
        className="flex-shrink-0"
        style={{ color: "var(--text-success, #309454)" }}
      />
      <div className="flex-1">
        <span
          className="text-sm font-medium block"
          style={{ color: "var(--text-primary)" }}
        >
          Payment successful
        </span>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          You can now continue the conversation.
        </span>
      </div>
    </div>
  );
}

export default function PaymentBlock({ clientSecret, onSend }) {
  const [status, setStatus] = useState("checkout");
  const sentRef = useRef(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const onComplete = useCallback(() => {
    setStatus("complete");
  }, []);

  useEffect(() => {
    if (status === "complete" && !sentRef.current && onSend) {
      sentRef.current = true;
      onSend({ text: "Payment successful", hidden: true });
    }
  }, [status, onSend]);

  if (!stripePromise) {
    return <ErrorState message="Payment is not configured." />;
  }

  if (!clientSecret) {
    return <ErrorState message="Payment session is missing or invalid." />;
  }

  if (status === "complete") {
    return <SuccessState />;
  }

  return (
    <div
      className="my-3 rounded-lg border overflow-hidden theme-transition"
      style={{
        borderColor: "var(--border-primary)",
        backgroundColor: isDark ? "var(--bg-tertiary)" : "#ffffff",
        colorScheme: isDark ? "dark" : "light",
        minHeight: 400,
      }}
    >
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret, onComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
