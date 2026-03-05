import { useEffect, useState, useMemo } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useSubscriptionContext } from "../../contexts/SubscriptionContext";
import { isPassAgent, getPlanLabel } from "../../utils/passAgent";
import { SettingsInfoPanel } from "./SettingsInfoPanel";
import { ThemeToggle } from "../ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut } from "lucide-react";

// ── Toast (auto-dismiss after 4s) ──
const SettingsToast = ({ message, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-secondary)",
      }}
    >
      {message}
    </div>
  );
};

// ── Settings Layout ──
export const SettingsLayout = ({ TIER }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orgId, signOut } = useAuth();
  const { user } = useUser();
  const { subscription } = useSubscriptionContext();

  const [toast, setToast] = useState(null);

  const isPass = isPassAgent(TIER);
  const isOrg = Boolean(orgId);
  const planLabel = getPlanLabel(subscription);
  const isPaid = planLabel !== "Trial";

  // ── Tab definitions ──
  const tabs = useMemo(
    () => [
      { label: "Account", path: "account", visible: true },
      { label: "Billing", path: "billing", visible: isPass && (isOrg || isPaid) },
      { label: "Team", path: "team", visible: isPass && isOrg },
      { label: "Data", path: "data", visible: true },
      { label: "Contact", path: "contact", visible: isPass },
    ],
    [isPass, isOrg, isPaid]
  );

  // ── Route guard ──
  const currentSegment = location.pathname.split("/").pop();

  useEffect(() => {
    const matchedTab = tabs.find((t) => t.path === currentSegment);
    if (matchedTab && !matchedTab.visible) {
      navigate("/settings/account", { replace: true });
      queueMicrotask(() => setToast("Not available for this agent."));
    }
  }, [currentSegment, tabs, navigate]);

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
    "U";

  return (
    <div
      className="min-h-screen theme-transition"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      {/* ── Top Bar ── */}
      <header
        className="sticky top-0 z-30"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-secondary)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 hover:bg-[var(--bg-hover)] transition-all duration-150"
            style={{ color: "var(--text-primary)" }}
          >
            <ArrowLeft size={18} strokeWidth={1.7} />
            <span className="hidden sm:inline">Back to Chat</span>
          </button>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/auth/sign-in" })}
              className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 hover:bg-[var(--bg-hover)] transition-all duration-150"
              style={{ color: "var(--text-tertiary)" }}
            >
              <LogOut size={16} strokeWidth={1.7} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Two-Column Body ── */}
      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar (desktop only) */}
        <SettingsInfoPanel
          planLabel={planLabel}
          isPaid={isPaid}
          tabs={tabs}
          currentSegment={currentSegment}
        />

        {/* Right Main Content */}
        <div className="flex-1 min-w-0 px-6 sm:px-10 py-8">
          {/* Mobile profile summary */}
          <div className="lg:hidden mb-5 flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0" style={{ boxShadow: "0 0 0 2px var(--border-primary)" }}>
              <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
              <AvatarFallback className="text-sm" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {user?.fullName || user?.firstName || "User"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <Badge
              className="shrink-0 text-[10px]"
              style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
            >
              {planLabel}
            </Badge>
          </div>

          {/* Mobile Tab Navigation */}
          <nav
            className="flex lg:hidden gap-1 p-1 rounded-xl mb-6 overflow-x-auto"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-secondary)",
            }}
          >
            {tabs
              .filter((t) => t.visible)
              .map((tab) => (
                <NavLink
                  key={tab.path}
                  to={`/settings/${tab.path}`}
                  className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150"
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                  })}
                >
                  {tab.label}
                </NavLink>
              ))}
          </nav>

          {/* Page Content */}
          <div className="max-w-2xl">
            <Outlet
              context={{ TIER, isPass, isOrg, subscription, planLabel, isPaid }}
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <SettingsToast message={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
};
