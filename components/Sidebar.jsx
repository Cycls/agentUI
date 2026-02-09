import { useMemo, useState, useRef, useEffect, useId, useCallback } from "react";
import { CONFIG } from "../clientConfig";
import { getPinnedChats, pinChat, unpinChat } from "../services/storage";

// ── Constants ──
export const SIDEBAR_WIDTH = {
  collapsed: 56,
  expanded: 275,
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

// ── Icons (thinner stroke, consistent sizing) ──
const IconWrap = ({ children }) => (
  <span className="grid place-items-center w-5 h-5">{children}</span>
);

const NewChatIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={cx("w-5 h-5", props?.className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a9 9 0 1 1-6.22 15.5" />
    <path d="M12 8v8" />
    <path d="M16 12H8" />
  </svg>
);

const PanelIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={cx("w-[18px] h-[18px]", props?.className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

const ChevronRightIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={cx("w-5 h-5", props?.className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 7l5 5-5 5" />
  </svg>
);

const TrashIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={cx("w-4 h-4", props?.className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const FolderIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={cx("w-[18px] h-[18px]", props?.className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
);

const DotsIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cx(
      "lucide lucide-ellipsis-icon lucide-ellipsis",
      props?.className
    )}
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const PinIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={cx("w-4 h-4", props?.className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </svg>
);

const PinOffIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={cx("w-4 h-4", props?.className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 17v5" />
    <path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" />
    <path d="m2 2 20 20" />
    <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11" />
  </svg>
);

// ── Hooks ──
function useOnClickOutside(refs, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const listener = (e) => {
      const list = Array.isArray(refs) ? refs : [refs];
      const isInside = list.some(
        (r) => r?.current && r.current.contains(e.target)
      );
      if (!isInside) handler(e);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener, { passive: true });
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler, enabled]);
}

// ── Components ──
const SidebarButton = ({ icon, children, isCollapsed, ...props }) => {
  return (
    <button
      {...props}
      className={cx(
        "group w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left",
        "hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20",
        "theme-transition",
        isCollapsed && "justify-center px-2"
      )}
      style={{ color: "var(--text-primary)" }}
    >
      <span className="shrink-0" style={{ color: "var(--text-primary)" }}>
        {icon}
      </span>
      {!isCollapsed && (
        <span className="text-sm font-medium leading-5">{children}</span>
      )}
    </button>
  );
};

const SectionLabel = ({ children }) => (
  <div
    className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wide uppercase"
    style={{ color: "var(--text-tertiary)" }}
  >
    {children}
  </div>
);

const ChatItem = ({ chat, isActive, isPinned, onSelect, onDelete, onPin, onUnpin, pinLimitReached }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const menuId = useId();

  useOnClickOutside([menuRef, btnRef], () => setOpen(false), open);

  return (
    <div className="relative">
      <button
        onClick={() => onSelect(chat.id)}
        className={cx(
          "group w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left",
          "hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20",
          "theme-transition"
        )}
        style={{
          backgroundColor: isActive ? "var(--bg-active)" : "transparent",
        }}
        aria-current={isActive ? "page" : undefined}
      >
        {isPinned && (
          <span className="shrink-0 opacity-40" style={{ color: "var(--text-tertiary)" }}>
            <PinIcon />
          </span>
        )}
        <span
          className="min-w-0 flex-1 truncate text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          {chat.title || "Untitled"}
        </span>

        <button
          ref={btnRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className={cx(
            "shrink-0 rounded-lg p-1.5",
            "hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
            "opacity-0 group-hover:opacity-100 focus:opacity-100",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20",
            "theme-transition"
          )}
          style={{ color: "var(--text-tertiary)" }}
          aria-label="Chat options"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
        >
          <DotsIcon />
        </button>
      </button>

      {open && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          className={cx(
            "absolute right-2 top-[calc(100%+6px)] z-50 min-w-[170px]",
            "rounded-xl shadow-lg",
            "overflow-hidden dropdown-menu"
          )}
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-primary)",
          }}
        >
          {/* Pin / Unpin */}
          {isPinned ? (
            <button
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                onUnpin(chat.id);
                setOpen(false);
              }}
              className={cx(
                "w-full flex items-center gap-2 px-3 py-2.5 text-sm",
                "hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)]",
                "focus:outline-none theme-transition"
              )}
              style={{ color: "var(--text-primary)" }}
            >
              <PinOffIcon />
              Unpin
            </button>
          ) : (
            <button
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                if (!pinLimitReached) onPin(chat.id);
                setOpen(false);
              }}
              className={cx(
                "w-full flex items-center gap-2 px-3 py-2.5 text-sm",
                "hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)]",
                "focus:outline-none theme-transition",
                pinLimitReached && "opacity-40 cursor-not-allowed"
              )}
              style={{ color: "var(--text-primary)" }}
              title={pinLimitReached ? "Maximum 3 pins" : "Pin this chat"}
            >
              <PinIcon />
              Pin{pinLimitReached ? " (max 3)" : ""}
            </button>
          )}

          {/* Delete */}
          <button
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chat.id);
              setOpen(false);
            }}
            className={cx(
              "w-full flex items-center gap-2 px-3 py-2.5 text-sm",
              "text-red-500 hover:bg-red-500/10 focus:bg-red-500/10",
              "focus:outline-none theme-transition"
            )}
          >
            <TrashIcon />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

const UserProfileExpanded = ({
  user,
  isOnPaidPlan,
  tierName,
  UserButtonComponent,
}) => {
  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "User";
  const subscriptionLabel = isOnPaidPlan ? tierName || "Pro" : "Free plan";

  return (
    <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--bg-hover)] transition-colors theme-transition">
      <div className="shrink-0">{UserButtonComponent}</div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {displayName}
        </div>
        <div
          className="truncate text-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          {subscriptionLabel}
        </div>
      </div>
    </div>
  );
};

const UserProfileCollapsed = ({ UserButtonComponent }) => (
  <div className="grid place-items-center p-1">{UserButtonComponent}</div>
);

// ── Main Sidebar ──
export const ChatHistorySidebar = ({
  isOpen,
  onClose,
  onToggle,
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenFiles,
  user,
  isOnPaidPlan,
  tierName,
  UserButtonComponent,
  isAuthenticated,
}) => {
  const [pinnedIds, setPinnedIds] = useState(() => getPinnedChats());

  const handlePin = useCallback((chatId) => {
    const updated = pinChat(chatId);
    setPinnedIds(updated);
  }, []);

  const handleUnpin = useCallback((chatId) => {
    const updated = unpinChat(chatId);
    setPinnedIds(updated);
  }, []);

  const sortedChats = useMemo(() => {
    return [...(chats || [])].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }, [chats]);

  // Separate pinned from unpinned
  const pinnedChats = useMemo(() => {
    return pinnedIds
      .map((id) => sortedChats.find((c) => c.id === id))
      .filter(Boolean);
  }, [pinnedIds, sortedChats]);

  const unpinnedChats = useMemo(() => {
    const pinSet = new Set(pinnedIds);
    return sortedChats.filter((c) => !pinSet.has(c.id));
  }, [sortedChats, pinnedIds]);

  const groupedChats = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      previous7Days: [],
      previous30Days: [],
      older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    unpinnedChats.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt);
      if (chatDate >= today) groups.today.push(chat);
      else if (chatDate >= yesterday) groups.yesterday.push(chat);
      else if (chatDate >= weekAgo) groups.previous7Days.push(chat);
      else if (chatDate >= monthAgo) groups.previous30Days.push(chat);
      else groups.older.push(chat);
    });

    return groups;
  }, [unpinnedChats]);

  const pinLimitReached = pinnedIds.length >= 3;

  const renderChatItem = (chat) => (
    <ChatItem
      key={chat.id}
      chat={chat}
      isActive={activeChat === chat.id}
      isPinned={pinnedIds.includes(chat.id)}
      onSelect={onSelectChat}
      onDelete={onDeleteChat}
      onPin={handlePin}
      onUnpin={handleUnpin}
      pinLimitReached={pinLimitReached}
    />
  );

  const renderGroup = (title, list) => {
    if (!list?.length) return null;
    return (
      <div className="mb-4">
        <SectionLabel>{title}</SectionLabel>
        <div className="space-y-1">
          {list.map(renderChatItem)}
        </div>
      </div>
    );
  };

  const hasChats = sortedChats.length > 0;

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className={cx(
          "fixed inset-0 z-40 md:hidden transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ backgroundColor: "var(--bg-overlay)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cx(
          "fixed left-0 top-0 z-50 h-full",
          "backdrop-blur supports-[backdrop-filter]:backdrop-blur-xl",
          "transition-all duration-300 ease-in-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{
          width: `${isOpen ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed}px`,
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-primary)",
        }}
      >
        {/* Expanded */}
        <div
          className={cx(
            "flex h-full w-full flex-col",
            "transition-opacity duration-200",
            isOpen
              ? "opacity-100"
              : "opacity-0 pointer-events-none absolute inset-0"
          )}
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between px-2">
            <div className="flex items-center gap-1">
              <button
                onClick={onNewChat}
                className={cx(
                  "inline-flex items-center gap-2 rounded-xl px-2.5 py-2",
                  "hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20",
                  "theme-transition"
                )}
                style={{ color: "var(--text-primary)" }}
                aria-label="New chat"
                title="New chat"
              >
                <IconWrap>
                  <NewChatIcon />
                </IconWrap>
                <span className="text-sm font-semibold">New</span>
              </button>

              {onOpenFiles && (
                <button
                  onClick={onOpenFiles}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-xl px-2.5 py-2",
                    "hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20",
                    "theme-transition"
                  )}
                  style={{ color: "var(--text-primary)" }}
                  aria-label="Files"
                  title="Files"
                >
                  <IconWrap>
                    <FolderIcon />
                  </IconWrap>
                  <span className="text-sm font-semibold">Files</span>
                </button>
              )}
            </div>

            <button
              onClick={onToggle}
              className={cx(
                "rounded-xl p-2 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20",
                "theme-transition"
              )}
              style={{ color: "var(--text-primary)" }}
              aria-label="Collapse sidebar"
              title="Collapse"
            >
              <PanelIcon />
            </button>
          </div>

          <div
            className="mx-3"
            style={{ borderTop: "1px solid var(--border-primary)" }}
          />

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
            {!hasChats ? (
              <div
                className="px-2 py-10 text-center text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                No chats yet
              </div>
            ) : (
              <>
                {/* Pinned section */}
                {pinnedChats.length > 0 && (
                  <div className="mb-4">
                    <SectionLabel>Pinned</SectionLabel>
                    <div className="space-y-1">
                      {pinnedChats.map(renderChatItem)}
                    </div>
                  </div>
                )}
                {renderGroup("Today", groupedChats.today)}
                {renderGroup("Yesterday", groupedChats.yesterday)}
                {renderGroup("Previous 7 days", groupedChats.previous7Days)}
                {renderGroup("Previous 30 days", groupedChats.previous30Days)}
                {renderGroup("Older", groupedChats.older)}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="p-2"
            style={{ borderTop: "1px solid var(--border-primary)" }}
          >
            {isAuthenticated && user ? (
              <UserProfileExpanded
                user={user}
                isOnPaidPlan={isOnPaidPlan}
                tierName={tierName}
                UserButtonComponent={UserButtonComponent}
              />
            ) : (
              <div
                className="px-2 py-2 text-center text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                {chats.length} / {CONFIG.MAX_CHATS} chats
              </div>
            )}
          </div>
        </div>

        {/* Collapsed (desktop) */}
        <div
          className={cx(
            "hidden md:flex h-full w-full flex-col",
            "transition-opacity duration-200",
            !isOpen
              ? "opacity-100"
              : "opacity-0 pointer-events-none absolute inset-0"
          )}
        >
          <div className="flex h-14 items-center justify-center">
            <button
              onClick={onToggle}
              className={cx(
                "rounded-xl p-2 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20",
                "theme-transition"
              )}
              style={{ color: "var(--text-primary)" }}
              aria-label="Expand sidebar"
              title="Expand"
            >
              <PanelIcon />
            </button>
          </div>

          <div className="px-1 py-2 space-y-1">
            <SidebarButton
              onClick={onNewChat}
              icon={
                <IconWrap>
                  <NewChatIcon />
                </IconWrap>
              }
              isCollapsed
              aria-label="New chat"
              title="New chat"
            />
            {onOpenFiles && (
              <SidebarButton
                onClick={onOpenFiles}
                icon={
                  <IconWrap>
                    <FolderIcon />
                  </IconWrap>
                }
                isCollapsed
                aria-label="Files"
                title="Files"
              />
            )}
          </div>

          <div className="flex-1" />

          {isAuthenticated && UserButtonComponent && (
            <div
              className="p-2"
              style={{ borderTop: "1px solid var(--border-primary)" }}
            >
              <UserProfileCollapsed UserButtonComponent={UserButtonComponent} />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile open button (when sidebar hidden) */}
      <button
        onClick={onToggle}
        className={cx(
          "fixed left-3 top-3 z-30 md:hidden",
          "rounded-xl backdrop-blur",
          "p-2 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20",
          "theme-transition transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        style={{
          backgroundColor: "var(--bg-sidebar)",
          border: "1px solid var(--border-primary)",
          color: "var(--text-primary)",
        }}
        aria-label="Open sidebar"
        title="Open"
      >
        <ChevronRightIcon />
      </button>
    </>
  );
};
