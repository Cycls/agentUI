// src/utils/posthog.js
import posthog from "posthog-js";
import { CONFIG } from "../clientConfig";

// ───────────────────────────────────────────────────────────────────────────────
// PostHog Initialization
// ───────────────────────────────────────────────────────────────────────────────
let isInitialized = false;

export function initPostHog() {
  if (isInitialized || !CONFIG.POSTHOG_KEY) {
    return;
  }

  posthog.init("phc_2qafhOCTgCnygXsPEHOA0RBtJf5nvVsi7yIene4DWaF", {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // We'll manually track events for better control
    persistence: "localStorage",
    loaded: (posthog) => {
      // Debug mode in development
      if (import.meta?.env?.DEV) {
        console.log("[PostHog] Initialized in development mode");
      }
    },
  });

  isInitialized = true;
}

// ───────────────────────────────────────────────────────────────────────────────
// User Identification (Clerk Integration)
// ───────────────────────────────────────────────────────────────────────────────
export function identifyUser(user, additionalProperties = {}) {
  if (!user || !isInitialized) return;

  const properties = {
    email:
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress,
    name:
      user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    first_name: user.firstName,
    last_name: user.lastName,
    avatar_url: user.imageUrl,
    created_at: user.createdAt,
    ...additionalProperties,
  };

  // Filter out undefined/null values
  const cleanProperties = Object.fromEntries(
    Object.entries(properties).filter(([_, v]) => v != null && v !== "")
  );

  posthog.identify(user.id, cleanProperties);

  if (import.meta?.env?.DEV) {
    console.log("[PostHog] User identified:", user.id, cleanProperties);
  }
}

// Reset user on sign out
export function resetUser() {
  if (!isInitialized) return;
  posthog.reset();

  if (import.meta?.env?.DEV) {
    console.log("[PostHog] User reset");
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Agent Domain Tracking
// ───────────────────────────────────────────────────────────────────────────────
export function getAgentDomain() {
  if (typeof window === "undefined") return "unknown";
  return window.location.hostname;
}

// Set agent domain as a super property (attached to all events)
export function setAgentDomain() {
  if (!isInitialized) return;

  const domain = getAgentDomain();
  posthog.register({
    agent_domain: domain,
    agent_subdomain: domain.split(".")[0], // e.g., "stock" from "stock.cycls.ai"
  });

  if (import.meta?.env?.DEV) {
    console.log("[PostHog] Agent domain set:", domain);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Event Tracking Functions
// ───────────────────────────────────────────────────────────────────────────────

// Generic track function with automatic domain inclusion
export function track(eventName, properties = {}) {
  if (!isInitialized) return;

  posthog.capture(eventName, {
    ...properties,
    agent_domain: getAgentDomain(),
  });

  if (import.meta?.env?.DEV) {
    console.log("[PostHog] Event:", eventName, properties);
  }
}

// ── Auth Events ──
export function trackSignIn() {
  track("user_signed_in");
}

export function trackSignUp() {
  track("user_signed_up");
}

export function trackSignOut() {
  track("user_signed_out");
}

// ── Chat Events ──
export function trackMessageSent(properties = {}) {
  track("message_sent", {
    has_attachments: properties.hasAttachments || false,
    attachment_count: properties.attachmentCount || 0,
    message_length: properties.messageLength || 0,
    chat_id: properties.chatId,
    is_new_chat: properties.isNewChat || false,
  });
}

export function trackChatCreated(chatId) {
  track("chat_created", { chat_id: chatId });
}

export function trackChatSelected(chatId) {
  track("chat_selected", { chat_id: chatId });
}

export function trackChatDeleted(chatId) {
  track("chat_deleted", { chat_id: chatId });
}

export function trackNewChatStarted() {
  track("new_chat_started");
}

// ── Message Actions ──
export function trackMessageRegenerated(messageIndex) {
  track("message_regenerated", { message_index: messageIndex });
}

export function trackMessageRetried(messageIndex) {
  track("message_retried", { message_index: messageIndex });
}

export function trackGenerationStopped() {
  track("generation_stopped");
}

// ── File Events ──
export function trackFileUploadStarted(fileName, fileType) {
  track("file_upload_started", {
    file_name: fileName,
    file_type: fileType,
  });
}

export function trackFileUploadCompleted(fileName, fileType) {
  track("file_upload_completed", {
    file_name: fileName,
    file_type: fileType,
  });
}

export function trackFileUploadFailed(fileName, error) {
  track("file_upload_failed", {
    file_name: fileName,
    error_message: error,
  });
}

// ── Subscription/Tier Events ──
export function trackTierModalShown(tier) {
  track("tier_modal_shown", { tier });
}

export function trackTierModalDismissed(tier) {
  track("tier_modal_dismissed", { tier });
}

export function trackUpgradeClicked(tier) {
  track("upgrade_clicked", { tier });
}

export function trackFreeLimitReached(messageCount) {
  track("free_limit_reached", { message_count: messageCount });
}

// ── Error Events ──
export function trackError(errorType, errorMessage, context = {}) {
  track("error_occurred", {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
  });
}

// ── Sidebar Events ──
export function trackSidebarOpened() {
  track("sidebar_opened");
}

export function trackSidebarClosed() {
  track("sidebar_closed");
}

// ── Page View (manual) ──
export function trackPageView(pageName) {
  track("$pageview", {
    page_name: pageName,
    url: window.location.href,
    path: window.location.pathname,
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Export PostHog instance for advanced usage
// ───────────────────────────────────────────────────────────────────────────────
export { posthog };
