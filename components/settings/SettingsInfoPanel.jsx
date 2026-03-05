import { NavLink } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Check, Crown, Sparkles, User, CreditCard, Users, Database, Mail } from "lucide-react";

const iconMap = {
  account: User,
  billing: CreditCard,
  team: Users,
  data: Database,
  contact: Mail,
};

// ── Settings Sidebar (left column) ──
export const SettingsInfoPanel = ({ planLabel, isPaid, tabs = [], currentSegment }) => {
  const { user, isLoaded } = useUser();

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
    "U";

  // Group tabs into sections
  const generalTabs = tabs.filter((t) => t.visible && ["account", "data"].includes(t.path));
  const teamTabs = tabs.filter((t) => t.visible && ["team"].includes(t.path));
  const billingTabs = tabs.filter((t) => t.visible && ["billing", "contact"].includes(t.path));

  const renderNavSection = (label, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest px-3 mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </p>
        {items.map((tab) => {
          const Icon = iconMap[tab.path] || User;
          const isActive = currentSegment === tab.path;
          return (
            <NavLink
              key={tab.path}
              to={`/settings/${tab.path}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            >
              <Icon size={15} strokeWidth={1.8} />
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      className="w-[240px] shrink-0 sticky top-[57px] self-start hidden lg:block min-h-[calc(100vh-57px)]"
      style={{ borderRight: "1px solid var(--border-secondary)" }}
    >
      <div className="py-6 px-4 space-y-6">
        {/* ── Profile ── */}
        {!isLoaded ? (
          <div className="flex items-center gap-3 px-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-10 w-10" style={{ boxShadow: "0 0 0 2px var(--border-primary)" }}>
              <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
              <AvatarFallback
                className="text-sm font-semibold"
                style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {user?.fullName || user?.firstName || "User"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        )}

        {/* Plan badge */}
        <div className="px-2">
          {isPaid ? (
            <div className="flex items-center gap-2.5 rounded-lg p-2.5 bg-green-500/[0.06] border border-green-500/10">
              <div className="shrink-0 w-7 h-7 rounded-md grid place-items-center bg-green-500/10">
                <Crown size={13} className="text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{planLabel}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Check size={9} className="text-green-400" />
                  <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Unlimited</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg p-2.5 bg-blue-500/[0.06] border border-blue-500/10">
              <div className="shrink-0 w-7 h-7 rounded-md grid place-items-center bg-blue-500/10">
                <Zap size={13} className="text-blue-400" fill="currentColor" stroke="none" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>Free Trial</p>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Limited usage</span>
              </div>
              <Sparkles size={11} className="shrink-0" style={{ color: "var(--text-muted)" }} />
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="space-y-6">
          {renderNavSection("GENERAL", generalTabs)}
          {renderNavSection("TEAM", teamTabs)}
          {renderNavSection("USAGE & BILLING", billingTabs)}
        </div>
      </div>
    </aside>
  );
};
