import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import {
  ClerkProvider,
  UserButton,
  OrganizationSwitcher,
  useAuth,
  useOrganization,
  useUser,
} from "@clerk/clerk-react";

import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { MessageList } from "./components/MessageList";
import { Composer } from "./components/Composer";
import { ChatHistorySidebar } from "./components/Sidebar";
import { TierModal } from "./components/TierModal";
import { FileModal } from "./components/FileModal";
import { ThemeToggle } from "./components/ThemeContext";
import { AuthPage, RequireAuth } from "./components/AuthPage";
import { SEOHead } from "./components/SEOHead";

import { useAnalytics } from "./contexts/AnalyticsContext";
import {
  useSubscriptionContext,
  SubscriptionProvider,
} from "./contexts/SubscriptionContext";
import { CanvasProvider, useCanvas } from "./contexts/CanvasContext";
import { CanvasPanel } from "./components/Canvas";
import { useCanvasWidth } from "./hooks/useCanvasWidth";

import { useChatSend } from "./hooks/useChatSend";
import { useSidebarWidth } from "./hooks/useSidebarWidth";
import { usePostHogIdentify } from "./hooks/usePostHogIdentify";

import {
  getMessageCount,
  incrementMessageCount,
  clearMessageCount,
  setActiveChat,
  generateTitle,
} from "./services/storage";
import {
  listSessions,
  getSession,
  saveSession,
  deleteSession,
} from "./services/sessions";
import { sendCyclsChatMessage } from "./services/api";

import {
  trackChatSelected,
  trackChatDeleted,
  trackNewChatStarted,
  trackMessageRegenerated,
  trackMessageRetried,
  trackGenerationStopped,
  trackTierModalShown,
  trackTierModalDismissed,
  trackUpgradeClicked,
  trackFreeLimitReached,
  trackSidebarOpened,
  trackSidebarClosed,
} from "./analytics/posthog";

// ═══════════════════════════════════════════════════════════════════════════════
//  App Component (Without Auth)
// ═══════════════════════════════════════════════════════════════════════════════
const AppWithoutAuth = ({ HEADER, INTRO, AUTH, TITLE, TIER }) => {
  return (
    <AppContent
      HEADER={HEADER}
      INTRO={INTRO}
      AUTH={AUTH}
      TITLE={TITLE}
      TIER={TIER}
      authApi={null}
      userApi={{ user: null, isLoaded: true }}
      orgId={null}
      subscription={null}
      isSubscriptionLoading={false}
      subscriptionError={null}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  App Component (With Auth)
// ═══════════════════════════════════════════════════════════════════════════════
const AppWithAuth = ({ HEADER, INTRO, AUTH, TITLE, TIER }) => {
  const authApi = useAuth();
  const userApi = useUser();
  const { organization } = useOrganization();

  const {
    subscription,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
  } = useSubscriptionContext();

  return (
    <AppContent
      HEADER={HEADER}
      INTRO={INTRO}
      AUTH={AUTH}
      TITLE={TITLE}
      TIER={TIER}
      authApi={authApi}
      userApi={userApi}
      orgId={organization?.id || null}
      subscription={subscription}
      isSubscriptionLoading={isSubscriptionLoading}
      subscriptionError={subscriptionError}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  Main App Component
// ═══════════════════════════════════════════════════════════════════════════════
export const App = (props) => {
  return (
    <CanvasProvider>
      {props.AUTH ? <AppWithAuth {...props} /> : <AppWithoutAuth {...props} />}
    </CanvasProvider>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  App Content Component (Shared Logic)
// ═══════════════════════════════════════════════════════════════════════════════
const AppContent = ({
  HEADER,
  INTRO,
  AUTH,
  TITLE,
  TIER,
  authApi,
  userApi,
  orgId,
  subscription,
  isSubscriptionLoading,
  subscriptionError,
}) => {
  const analyticsEnabled = useAnalytics();
  const {
    state: canvasState,
    openCanvas,
    appendContent,
    markDone,
    closeCanvas,
    resetCanvas,
  } = useCanvas();
  const { chatWidthPercent, isMobile: isCanvasMobile } = useCanvasWidth(
    canvasState.isOpen
  );

  const [messages, setMessages] = useState([]);
  const [shouldFocus, setShouldFocus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBegun, setHasBegun] = useState(false);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [retryingIndex, setRetryingIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);
  const isLoadingChatRef = useRef(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // Get responsive sidebar width
  const sidebarWidth = useSidebarWidth(isSidebarOpen);

  const [showTierModal, setShowTierModal] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const FREE_MESSAGE_LIMIT = 5;

  const handleDismissTierModal = useCallback(() => {
    setShowTierModal(false);
    if (analyticsEnabled) trackTierModalDismissed(TIER);
  }, [TIER, analyticsEnabled]);

  const isOnPaidPlan = useMemo(() => {
    if (!subscription) return false;
    return subscription?.subscriptionItems?.[0]?.plan?.name === "Cycls Pass";
  }, [subscription]);

  const tierName = useMemo(() => {
    if (!subscription) return null;
    return subscription?.subscriptionItems?.[0]?.plan?.name || null;
  }, [subscription]);

  const planInfo = useMemo(() => {
    const plan = subscription?.subscriptionItems?.[0]?.plan;
    if (!plan) return null;
    return { plan_name: plan.name, plan_id: plan.id, plan_slug: plan.slug };
  }, [subscription]);

  // PostHog identify hook - safely receives user data as props
  usePostHogIdentify(
    AUTH && isOnPaidPlan,
    analyticsEnabled && AUTH,
    userApi?.user || null,
    userApi?.isLoaded ?? true
  );

  const hasReachedFreeLimit = useMemo(() => {
    if (!AUTH || TIER !== "cycls_pass") return false;
    if (isOnPaidPlan) return false;
    return messageCount >= FREE_MESSAGE_LIMIT;
  }, [AUTH, TIER, isOnPaidPlan, messageCount, FREE_MESSAGE_LIMIT]);

  useEffect(() => {
    if (isOnPaidPlan) {
      clearMessageCount();
      setMessageCount(0);
      setShowTierModal(false);
    }
  }, [isOnPaidPlan]);

  useEffect(() => {
    setMessageCount(getMessageCount());
    // Load chat history from server
    listSessions(authApi?.getToken).then((chats) => setChatHistory(chats));
  }, []);

  // Re-fetch sessions when the active organization changes
  const prevOrgIdRef = useRef(orgId);
  useEffect(() => {
    if (prevOrgIdRef.current === orgId) return;
    prevOrgIdRef.current = orgId;

    // Clear current chat and reload sessions for the new org context
    setMessages([]);
    setActiveChatId(null);
    setHasBegun(false);
    listSessions(authApi?.getToken).then((chats) => setChatHistory(chats));
  }, [orgId, authApi?.getToken]);

  useEffect(() => {
    messagesRef.current = messages;
    // Also reset the flag when loading a chat from sidebar
    if (isLoadingChatRef.current) {
      isLoadingChatRef.current = false;
    }
  }, [messages]);

  // Save the current session and refresh the sidebar chat list
  const saveAndRefresh = useCallback(
    async (chatId, msgs) => {
      await saveSession(
        { id: chatId, title: generateTitle(msgs), messages: msgs },
        authApi?.getToken
      );
      const chats = await listSessions(authApi?.getToken);
      setChatHistory(chats);
    },
    [authApi?.getToken]
  );

  useEffect(() => {
    document.title = TITLE;
  }, [TITLE]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsUserScrolled(!isAtBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isUserScrolled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isUserScrolled]);

  useEffect(() => {
    if (shouldFocus) {
      const textarea = document.querySelector("textarea");
      textarea?.focus();
      setShouldFocus(false);
    }
  }, [shouldFocus]);

  const handleMessageSuccess = useCallback(() => {
    if (!AUTH || TIER !== "cycls_pass" || isOnPaidPlan) return;
    const newCount = incrementMessageCount();
    setMessageCount(newCount);
    if (newCount >= FREE_MESSAGE_LIMIT) {
      setShowTierModal(true);
      if (analyticsEnabled) trackFreeLimitReached(newCount);
      if (analyticsEnabled) trackTierModalShown(TIER);
    }
  }, [AUTH, TIER, isOnPaidPlan, FREE_MESSAGE_LIMIT, analyticsEnabled]);

  // Handle canvas events from streaming
  const handleCanvasEvent = useCallback(
    (item) => {
      if (item.open === true) {
        openCanvas({ title: item.title || "Untitled" });
      }
      if (item.content) {
        appendContent(item.content);
      }
      if (item.done === true) {
        markDone();
      }
      if (item.open === false) {
        closeCanvas();
      }
    },
    [openCanvas, appendContent, markDone, closeCanvas]
  );

  const { send, handleStop } = useChatSend({
    messages,
    setMessages,
    setShouldFocus,
    setIsLoading,
    setIsUserScrolled,
    onFirstSend: () => setHasBegun(true),
    auth: AUTH,
    getToken: authApi?.getToken,
    plan: planInfo,
    activeChatId,
    setActiveChatId,
    setChatHistory,
    onMessageSuccess: handleMessageSuccess,
    analyticsEnabled,
    onCanvasEvent: handleCanvasEvent,
  });

  const handleNewChat = useCallback(() => {
    handleStop();
    setIsLoading(false);
    setMessages([]);
    setActiveChatId(null);
    setHasBegun(false);
    resetCanvas();
    setActiveChat("");
    window.scrollTo(0, 0);
    if (analyticsEnabled) trackNewChatStarted();
  }, [analyticsEnabled, resetCanvas, handleStop]);

  const handleSelectChat = useCallback(
    async (chatId) => {
      handleStop();
      setIsLoading(false);
      const chat = await getSession(chatId, authApi?.getToken);
      if (chat) {
        isLoadingChatRef.current = true;
        setMessages(chat.messages || []);
        setActiveChatId(chatId);
        setHasBegun((chat.messages || []).length > 0);
        resetCanvas();
        setActiveChat(chatId);
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
        window.scrollTo(0, 0);
        if (analyticsEnabled) trackChatSelected(chatId);
      }
    },
    [analyticsEnabled, resetCanvas, handleStop, authApi?.getToken]
  );

  const handleDeleteChat = useCallback(
    async (chatId) => {
      await deleteSession(chatId, authApi?.getToken);
      const chats = await listSessions(authApi?.getToken);
      setChatHistory(chats);
      if (analyticsEnabled) trackChatDeleted(chatId);
      if (chatId === activeChatId) {
        handleNewChat();
      }
    },
    [activeChatId, handleNewChat, analyticsEnabled, authApi?.getToken]
  );

  const handleSidebarToggle = useCallback(() => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    if (analyticsEnabled) {
      if (newState) trackSidebarOpened();
      else trackSidebarClosed();
    }
  }, [isSidebarOpen, analyticsEnabled]);

  const handleSidebarClose = useCallback(() => {
    setIsSidebarOpen(false);
    if (analyticsEnabled) trackSidebarClosed();
  }, [analyticsEnabled]);

  const handleRegenerate = useCallback(
    async (messageIndex) => {
      const userMessageIndex = messageIndex - 1;
      if (userMessageIndex < 0) return;

      if (analyticsEnabled) trackMessageRegenerated(messageIndex);

      setMessages((prev) => {
        const updated = [...prev];
        const msg = updated[messageIndex];
        if (msg?.type === "response" || msg?.role === "assistant") {
          updated[messageIndex] = { role: "assistant", parts: [] };
        }
        return updated;
      });

      const userMessage = messages[userMessageIndex];
      const isUserMsg =
        userMessage.type === "request" || userMessage.role === "user";
      if (!isUserMsg) return;

      const contextMessages = messages.slice(0, messageIndex);
      setIsLoading(true);
      setIsUserScrolled(false);

      const ctrl = new AbortController();
      let isTimeout = false;
      let timeoutId = null;

      const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          isTimeout = true;
          ctrl.abort();
        }, 300000);
      };

      resetTimeout();

      try {
        let currentPart = null;
        let stepsPart = null;

        await sendCyclsChatMessage({
          messages: contextMessages,
          auth: AUTH,
          getToken: authApi?.getToken,
          plan: planInfo,
          onPart: (item) => {
            resetTimeout();

            setMessages((prev) => {
              const updated = [...prev];
              const assistantMsg = updated[messageIndex];

              if (!assistantMsg.parts) {
                assistantMsg.parts = [];
              }

              // Handle step events - aggregate into current "steps" part
              // Each step event is treated as a complete step.
              // A new steps block is created when steps come after a non-step part.
              if (item.type === "step") {
                if (!stepsPart) {
                  stepsPart = { type: "steps", steps: [] };
                  assistantMsg.parts.push(stepsPart);
                }

                // Each step event creates a new step entry
                if (item.step || item.data !== undefined) {
                  stepsPart.steps.push({
                    step: item.step || "",
                    data: item.data !== undefined ? item.data : null,
                    result: item.result,
                    _complete: true,
                  });
                }

                currentPart = null;
                return updated;
              }

              // Non-step part received - reset stepsPart so next steps create a new block
              stepsPart = null;

              if (currentPart && currentPart.type === item.type) {
                if (item.row) {
                  currentPart.rows.push(item.row);
                } else if (item.type === "text" && item.text) {
                  currentPart.text += item.text;
                } else if (item.type === "thinking" && item.thinking) {
                  currentPart.thinking += item.thinking;
                } else if (item.type === "code" && item.code) {
                  currentPart.code += item.code;
                }
              } else {
                // Mark previous thinking part as complete when switching away
                if (currentPart && currentPart.type === "thinking") {
                  currentPart._complete = true;
                  if (currentPart._startTime) {
                    currentPart._duration = Math.round(
                      (Date.now() - currentPart._startTime) / 1000
                    );
                  }
                }

                currentPart = { ...item };
                if (item.headers) {
                  currentPart.rows = [];
                }
                // Add start time for thinking parts
                if (item.type === "thinking") {
                  currentPart._startTime = Date.now();
                }
                assistantMsg.parts.push(currentPart);
              }

              return updated;
            });
          },
          signal: ctrl.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        // Mark any in-progress thinking parts as complete with duration
        setMessages((prev) => {
          const updated = [...prev];
          const msg = updated[messageIndex];
          if (msg?.parts) {
            msg.parts.forEach((part) => {
              if (part.type === "thinking" && !part._complete) {
                part._complete = true;
                if (part._startTime) {
                  part._duration = Math.round(
                    (Date.now() - part._startTime) / 1000
                  );
                }
              }
            });
          }
          return updated;
        });

        if (activeChatId) {
          saveAndRefresh(activeChatId, messagesRef.current);
        }
        setIsLoading(false);
        setShouldFocus(true);
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        if (err.name === "AbortError" && !isTimeout) {
          if (analyticsEnabled) trackGenerationStopped();
          setMessages((prev) => {
            const updated = [...prev];
            const msg = updated[messageIndex];
            if (msg?.parts) {
              msg.parts.push({
                type: "text",
                text: "\n\n*[Generation stopped]*",
              });
            }
            return updated;
          });
          if (activeChatId) saveAndRefresh(activeChatId, messagesRef.current);
          setIsLoading(false);
          setShouldFocus(true);
          return;
        }
        console.error("Regeneration error:", err);
        setMessages((prev) => {
          const updated = [...prev];
          updated[messageIndex].error = {
            type: "server",
            message: err.message || "Error",
          };
          return updated;
        });
        setIsLoading(false);
      }
    },
    [
      messages,
      AUTH,
      authApi?.getToken,
      planInfo,
      activeChatId,
      analyticsEnabled,
      saveAndRefresh,
    ]
  );

  const handleRetry = useCallback(
    async (messageIndex) => {
      const userMessageIndex = messageIndex - 1;
      if (userMessageIndex < 0) return;

      if (analyticsEnabled) trackMessageRetried(messageIndex);
      setRetryingIndex(messageIndex);

      setMessages((prev) => {
        const updated = [...prev];
        const msg = updated[messageIndex];
        if (msg?.type === "response" || msg?.role === "assistant") {
          updated[messageIndex] = { role: "assistant", parts: [] };
        }
        return updated;
      });

      const userMessage = messages[userMessageIndex];
      const isUserMsg =
        userMessage.type === "request" || userMessage.role === "user";
      if (!isUserMsg) {
        setRetryingIndex(null);
        return;
      }

      const contextMessages = messages.slice(0, messageIndex);
      setIsLoading(true);
      setIsUserScrolled(false);

      const ctrl = new AbortController();
      let isTimeout = false;
      let timeoutId = null;

      const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          isTimeout = true;
          ctrl.abort();
        }, 300000);
      };

      resetTimeout();

      try {
        let currentPart = null;
        let stepsPart = null;

        await sendCyclsChatMessage({
          messages: contextMessages,
          auth: AUTH,
          getToken: authApi?.getToken,
          plan: planInfo,
          onPart: (item) => {
            resetTimeout();

            setMessages((prev) => {
              const updated = [...prev];
              const assistantMsg = updated[messageIndex];

              if (!assistantMsg.parts) {
                assistantMsg.parts = [];
              }

              // Handle step events - aggregate into current "steps" part
              // Each step event is treated as a complete step.
              // A new steps block is created when steps come after a non-step part.
              if (item.type === "step") {
                if (!stepsPart) {
                  stepsPart = { type: "steps", steps: [] };
                  assistantMsg.parts.push(stepsPart);
                }

                // Each step event creates a new step entry
                if (item.step || item.data !== undefined) {
                  stepsPart.steps.push({
                    step: item.step || "",
                    data: item.data !== undefined ? item.data : null,
                    result: item.result,
                    _complete: true,
                  });
                }

                currentPart = null;
                return updated;
              }

              // Non-step part received - reset stepsPart so next steps create a new block
              stepsPart = null;

              if (currentPart && currentPart.type === item.type) {
                if (item.row) {
                  currentPart.rows.push(item.row);
                } else if (item.type === "text" && item.text) {
                  currentPart.text += item.text;
                } else if (item.type === "thinking" && item.thinking) {
                  currentPart.thinking += item.thinking;
                } else if (item.type === "code" && item.code) {
                  currentPart.code += item.code;
                }
              } else {
                // Mark previous thinking part as complete when switching away
                if (currentPart && currentPart.type === "thinking") {
                  currentPart._complete = true;
                  if (currentPart._startTime) {
                    currentPart._duration = Math.round(
                      (Date.now() - currentPart._startTime) / 1000
                    );
                  }
                }

                currentPart = { ...item };
                if (item.headers) {
                  currentPart.rows = [];
                }
                // Add start time for thinking parts
                if (item.type === "thinking") {
                  currentPart._startTime = Date.now();
                }
                assistantMsg.parts.push(currentPart);
              }

              return updated;
            });
          },
          signal: ctrl.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        // Mark any in-progress thinking parts as complete with duration
        setMessages((prev) => {
          const updated = [...prev];
          const msg = updated[messageIndex];
          if (msg?.parts) {
            msg.parts.forEach((part) => {
              if (part.type === "thinking" && !part._complete) {
                part._complete = true;
                if (part._startTime) {
                  part._duration = Math.round(
                    (Date.now() - part._startTime) / 1000
                  );
                }
              }
            });
          }
          return updated;
        });

        if (activeChatId) {
          saveAndRefresh(activeChatId, messagesRef.current);
        }
        setIsLoading(false);
        setRetryingIndex(null);
        setShouldFocus(true);
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        if (err.name === "AbortError" && !isTimeout) {
          if (analyticsEnabled) trackGenerationStopped();
          setMessages((prev) => {
            const updated = [...prev];
            const msg = updated[messageIndex];
            if (msg?.parts) {
              msg.parts.push({
                type: "text",
                text: "\n\n*[Generation stopped]*",
              });
            }
            return updated;
          });
          if (activeChatId) saveAndRefresh(activeChatId, messagesRef.current);
          setIsLoading(false);
          setRetryingIndex(null);
          setShouldFocus(true);
          return;
        }
        console.error("Retry error:", err);
        setMessages((prev) => {
          const updated = [...prev];
          updated[messageIndex].error = {
            type: "server",
            message: err.message || "Error",
          };
          return updated;
        });
        setIsLoading(false);
        setRetryingIndex(null);
      }
    },
    [
      messages,
      AUTH,
      authApi?.getToken,
      planInfo,
      activeChatId,
      analyticsEnabled,
      saveAndRefresh,
    ]
  );

  const handleUpgradeClick = useCallback(() => {
    setShowTierModal(true);
    if (analyticsEnabled) {
      trackUpgradeClicked(TIER);
      trackTierModalShown(TIER);
    }
  }, [TIER, analyticsEnabled]);

  const empty = messages.length === 0;

  const userButtonComponent = AUTH ? (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-6 h-6",
          userButtonTrigger: "focus:shadow-none",
        },
      }}
    />
  ) : null;

  const orgSwitcherComponent = AUTH ? (
    <OrganizationSwitcher
      hidePersonal={false}
      afterCreateOrganizationUrl="/"
      afterSelectOrganizationUrl="/"
      appearance={{
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger:
            "focus:shadow-none w-full justify-between gap-2 px-0 rounded-lg transition-colors",
          organizationPreviewMainIdentifier: "font-semibold",
        },
      }}
    />
  ) : null;

  return (
    <div
      className="min-h-screen theme-transition"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* SEO Meta Tags */}
      <SEOHead
        isAuthenticated={AUTH && authApi?.isSignedIn}
        isPublic={!AUTH}
        meta={{ title: TITLE, description: HEADER }}
      />

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
        onToggle={handleSidebarToggle}
        chats={chatHistory}
        activeChat={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenFiles={() => setIsFileModalOpen(true)}
        user={userApi?.user}
        isOnPaidPlan={isOnPaidPlan}
        tierName={tierName}
        UserButtonComponent={userButtonComponent}
        OrgSwitcherComponent={orgSwitcherComponent}
        isAuthenticated={AUTH}
      />

      {/* Billing tier modal */}
      <TierModal
        open={showTierModal && TIER === "cycls_pass"}
        onClose={handleDismissTierModal}
        tier={TIER || "Pro"}
      />

      {/* File browser modal */}
      <FileModal
        open={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        getToken={authApi?.getToken}
      />

      {/* Main content area - slides based on sidebar state and canvas */}
      <main
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{
          marginLeft: `${sidebarWidth}px`,
          width:
            canvasState.isOpen && !isCanvasMobile
              ? `calc(${chatWidthPercent}% - ${sidebarWidth}px)`
              : `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        <div className="p-10">
          {/* Top-right actions: Theme toggle + Home link */}
          <div className="fixed max-sm:top-[2%] max-sm:right-3 top-3 right-4 flex items-center gap-2 z-20">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Home button */}
            {TIER === "cycls_pass" && (
              <a
                href="https://cycls.ai/"
                type="button"
                className="
                inline-flex items-center gap-2
                rounded-xl backdrop-blur px-3 py-2
                text-sm font-medium
                hover:bg-[var(--bg-hover)]
                active:bg-[var(--bg-active)]
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20
                theme-transition
              "
                style={{
                  backgroundColor: "var(--bg-sidebar)",
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                <span>Home</span>
              </a>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-[200px] md:pb-[180px]">
          {/* Header */}
          <div className="prose m-2 mx-auto max-w-3xl p-2 prose-pre:p-0 pt-14 md:pt-2">
            <MarkdownRenderer markdown={HEADER} onSend={send} />
          </div>

          {!empty && (
            <div
              className={`transition-opacity duration-500 ${
                hasBegun ? "opacity-100" : "opacity-0"
              }`}
            >
              <MessageList
                messages={messages}
                onSend={send}
                onRegenerate={handleRegenerate}
                onRetry={handleRetry}
                retryingIndex={retryingIndex}
                isGenerating={isLoading}
              />
              <div ref={messagesEndRef} />
            </div>
          )}

          {empty && !hasBegun && INTRO && INTRO.trim() !== "" && (
            <div className="mx-auto max-w-3xl prose prose-sm prose-pre:p-0">
              <MarkdownRenderer markdown={INTRO} onSend={send} />
            </div>
          )}
        </div>
      </main>

      {/* Document Canvas Panel */}
      <CanvasPanel />

      {/* Composer - positioned fixed with sidebar and canvas awareness */}
      <Composer
        onSend={send}
        isLoading={isLoading}
        onStop={handleStop}
        disabled={hasReachedFreeLimit}
        onUpgradeClick={handleUpgradeClick}
        sidebarWidth={sidebarWidth}
        canvasOpen={canvasState.isOpen}
        canvasWidthPercent={
          canvasState.isOpen && !isCanvasMobile ? 100 - chatWidthPercent : 0
        }
        getToken={authApi?.getToken}
      />
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// Shell Component
// ───────────────────────────────────────────────────────────────────────────────
export const Shell = ({ meta }) => {
  const PROD = Boolean(meta.prod);
  const AUTH = Boolean(meta.auth);
  const HEADER = String(meta.header ?? "");
  const INTRO = String(meta.intro ?? "");
  const TITLE = String(meta.title ?? "AI Agent");
  const TIER = meta.plan || null;
  const PUBLISHABLE_KEY = meta.pk;
  const AFTER_URL =
    typeof window !== "undefined" ? window.location.origin + "/" : "/";

  if (!AUTH) {
    return (
      <App
        HEADER={HEADER}
        INTRO={INTRO}
        AUTH={AUTH}
        TITLE={TITLE}
        TIER={TIER}
      />
    );
  }

  const clerkProps = PROD
    ? {
        isSatellite: false,
        domain: "cycls.ai",
        fallbackRedirectUrl: AFTER_URL,
        forceRedirectUrl: AFTER_URL,
      }
    : { fallbackRedirectUrl: AFTER_URL, forceRedirectUrl: AFTER_URL };

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} {...clerkProps}>
      <SubscriptionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage afterUrl={AFTER_URL} />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <App
                    HEADER={HEADER}
                    INTRO={INTRO}
                    AUTH={AUTH}
                    TITLE={TITLE}
                    TIER={TIER}
                  />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SubscriptionProvider>
    </ClerkProvider>
  );
};
