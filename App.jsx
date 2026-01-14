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
  useAuth,
  useClerk,
  useUser,
} from "@clerk/clerk-react";

import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { MessageList } from "./components/MessageList";
import { Composer } from "./components/Composer";
import { UploadProgress } from "./components/UploadProgress";
import { ChatHistorySidebar } from "./components/Sidebar";
import { TierModal } from "./components/TierModal";
import { ThemeToggle } from "./components/ThemeContext";
import { AuthPage, RequireAuth } from "./components/AuthPage";

import { useAnalytics } from "./contexts/AnalyticsContext";
import {
  useSubscriptionContext,
  SubscriptionProvider,
} from "./contexts/SubscriptionContext";

import { useChatSend } from "./hooks/useChatSend";
import { useSidebarWidth } from "./hooks/useSidebarWidth";
import { usePostHogIdentify } from "./hooks/usePostHogIdentify";

import {
  ChatHistoryManager,
  getMessageCount,
  incrementMessageCount,
  clearMessageCount,
} from "./services/storage";
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
const AppWithoutAuth = ({ HEADER, INTRO, AUTH, ORG, TITLE, TIER }) => {
  return (
    <AppContent
      HEADER={HEADER}
      INTRO={INTRO}
      AUTH={AUTH}
      ORG={ORG}
      TITLE={TITLE}
      TIER={TIER}
      authApi={null}
      clerkApi={null}
      userApi={{ user: null, isLoaded: true }}
      subscription={null}
      isSubscriptionLoading={false}
      subscriptionError={null}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  App Component (With Auth)
// ═══════════════════════════════════════════════════════════════════════════════
const AppWithAuth = ({ HEADER, INTRO, AUTH, ORG, TITLE, TIER }) => {
  const authApi = useAuth();
  const clerkApi = useClerk();
  const userApi = useUser();

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
      ORG={ORG}
      TITLE={TITLE}
      TIER={TIER}
      authApi={authApi}
      clerkApi={clerkApi}
      userApi={userApi}
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
  return props.AUTH ? (
    <AppWithAuth {...props} />
  ) : (
    <AppWithoutAuth {...props} />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  App Content Component (Shared Logic)
// ═══════════════════════════════════════════════════════════════════════════════
const AppContent = ({
  HEADER,
  INTRO,
  AUTH,
  ORG,
  TITLE,
  TIER,
  authApi,
  clerkApi,
  userApi,
  subscription,
  isSubscriptionLoading,
  subscriptionError,
}) => {
  const analyticsEnabled = useAnalytics();

  const [messages, setMessages] = useState([]);
  const [shouldFocus, setShouldFocus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [hasBegun, setHasBegun] = useState(false);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [retryingIndex, setRetryingIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // Get responsive sidebar width
  const sidebarWidth = useSidebarWidth(isSidebarOpen);

  const [showTierModal, setShowTierModal] = useState(false);
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
    const chats = ChatHistoryManager.getAllChats();
    setChatHistory(chats);
    setMessageCount(getMessageCount());

    // Always start with a new chat (don't restore the last active chat)
    // Users can select from sidebar if they want to continue an old chat
  }, []);

  useEffect(() => {
    if (messages.length > 0 && activeChatId) {
      ChatHistoryManager.updateChat(activeChatId, messages);
      setChatHistory(ChatHistoryManager.getAllChats());
    }
  }, [messages, activeChatId]);

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

  const { send, handleStop } = useChatSend({
    messages,
    setMessages,
    setShouldFocus,
    setIsLoading,
    setUploadProgress,
    setIsUserScrolled,
    onFirstSend: () => setHasBegun(true),
    auth: AUTH,
    org: ORG,
    getToken: authApi?.getToken,
    setActive: clerkApi?.setActive,
    activeChatId,
    setActiveChatId,
    onMessageSuccess: handleMessageSuccess,
    analyticsEnabled,
  });

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setActiveChatId(null);
    setHasBegun(false);
    ChatHistoryManager.setActiveChat("");
    window.scrollTo(0, 0);
    if (analyticsEnabled) trackNewChatStarted();
  }, [analyticsEnabled]);

  const handleSelectChat = useCallback(
    (chatId) => {
      const chat = ChatHistoryManager.getChat(chatId);
      if (chat) {
        setMessages(chat.messages);
        setActiveChatId(chatId);
        setHasBegun(chat.messages.length > 0);
        ChatHistoryManager.setActiveChat(chatId);
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
        window.scrollTo(0, 0);
        if (analyticsEnabled) trackChatSelected(chatId);
      }
    },
    [analyticsEnabled]
  );

  const handleDeleteChat = useCallback(
    (chatId) => {
      ChatHistoryManager.deleteChat(chatId);
      setChatHistory(ChatHistoryManager.getAllChats());
      if (analyticsEnabled) trackChatDeleted(chatId);
      if (chatId === activeChatId) {
        handleNewChat();
      }
    },
    [activeChatId, handleNewChat, analyticsEnabled]
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
        }, 120000);
      };

      // Set initial timeout
      resetTimeout();

      try {
        let currentPart = null;

        await sendCyclsChatMessage({
          messages: contextMessages,
          auth: AUTH,
          getToken: authApi?.getToken,
          setActive: clerkApi?.setActive,
          org: ORG,
          onPart: (item) => {
            // Reset timeout on every chunk received
            resetTimeout();

            setMessages((prev) => {
              const updated = [...prev];
              const assistantMsg = updated[messageIndex];

              if (!assistantMsg.parts) {
                assistantMsg.parts = [];
              }

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
                currentPart = { ...item };
                if (item.headers) {
                  currentPart.rows = [];
                }
                assistantMsg.parts.push(currentPart);
              }

              return updated;
            });
          },
          signal: ctrl.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (activeChatId) {
          setMessages((prev) => {
            ChatHistoryManager.updateChat(activeChatId, prev);
            setChatHistory(ChatHistoryManager.getAllChats());
            return prev;
          });
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
            if (activeChatId)
              ChatHistoryManager.updateChat(activeChatId, updated);
            return updated;
          });
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
      ORG,
      authApi?.getToken,
      clerkApi?.setActive,
      activeChatId,
      analyticsEnabled,
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
        }, 120000);
      };

      // Set initial timeout
      resetTimeout();

      try {
        let currentPart = null;

        await sendCyclsChatMessage({
          messages: contextMessages,
          auth: AUTH,
          getToken: authApi?.getToken,
          setActive: clerkApi?.setActive,
          org: ORG,
          onPart: (item) => {
            // Reset timeout on every chunk received
            resetTimeout();

            setMessages((prev) => {
              const updated = [...prev];
              const assistantMsg = updated[messageIndex];

              if (!assistantMsg.parts) {
                assistantMsg.parts = [];
              }

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
                currentPart = { ...item };
                if (item.headers) {
                  currentPart.rows = [];
                }
                assistantMsg.parts.push(currentPart);
              }

              return updated;
            });
          },
          signal: ctrl.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (activeChatId) {
          setMessages((prev) => {
            ChatHistoryManager.updateChat(activeChatId, prev);
            setChatHistory(ChatHistoryManager.getAllChats());
            return prev;
          });
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
            if (activeChatId)
              ChatHistoryManager.updateChat(activeChatId, updated);
            return updated;
          });
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
      ORG,
      authApi?.getToken,
      clerkApi?.setActive,
      activeChatId,
      analyticsEnabled,
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

  return (
    <div
      className="min-h-screen theme-transition"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
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
        user={userApi?.user}
        isOnPaidPlan={isOnPaidPlan}
        tierName={tierName}
        UserButtonComponent={userButtonComponent}
        isAuthenticated={AUTH}
      />

      {/* Billing tier modal */}
      <TierModal
        open={showTierModal && TIER === "cycls_pass"}
        onClose={handleDismissTierModal}
        tier={TIER || "Pro"}
      />

      {/* Main content area - slides based on sidebar state */}
      <main
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <div className="p-10">
          {/* Top-right actions: Theme toggle + Home link */}
          <div className="fixed max-sm:top-[2%] max-sm:right-1 top-1 right-4 flex items-center gap-1 z-20">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Home button */}
            {AUTH && (
              <a
                href="https://cycls.ai/"
                type="button"
                className="
                inline-flex items-center gap-2
                rounded-xl px-3 py-2
                text-sm font-medium
                hover:bg-[var(--bg-hover)]
                active:bg-[var(--bg-active)]
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20
              "
                style={{ color: "var(--text-primary)" }}
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
        <div className="mx-auto max-w-3xl min-h-screen px-4 pb-[200px] md:pb-[180px]">
          {uploadProgress && (
            <UploadProgress
              fileName={uploadProgress.fileName}
              progress={uploadProgress.progress}
            />
          )}

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

      {/* Composer - positioned fixed with sidebar awareness */}
      <Composer
        onSend={send}
        isLoading={isLoading}
        onStop={handleStop}
        disabled={hasReachedFreeLimit}
        onUpgradeClick={handleUpgradeClick}
        sidebarWidth={sidebarWidth}
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
  const TIER = meta.tier || null;
  const PUBLISHABLE_KEY = meta.pk;
  const ORG = meta.org || undefined;

  const AFTER_URL =
    typeof window !== "undefined" ? window.location.origin + "/" : "/";

  if (!AUTH) {
    return (
      <App
        HEADER={HEADER}
        INTRO={INTRO}
        AUTH={AUTH}
        ORG={ORG}
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
      <SubscriptionProvider tier={TIER}>
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
                    ORG={ORG}
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
