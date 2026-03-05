import { useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useOrganization, useUser, PricingTable } from "@clerk/clerk-react";
import { SubscriptionDetailsButton } from "@clerk/clerk-react/experimental";
import { useSubscriptionContext } from "../../contexts/SubscriptionContext";
import { getPlanLabel, getPlanSlug } from "../../utils/passAgent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  ExternalLink,
  Receipt,
  ArrowUpRight,
  Crown,
  Check,
  Building2,
  Sparkles,
} from "lucide-react";

// ── Billing Page ──
export const SettingsBillingPage = () => {
  const { isOrg, isPaid } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useUser();
  const { organization } = useOrganization();
  const { subscription } = useSubscriptionContext();

  const planLabel = getPlanLabel(subscription);
  const planSlug = getPlanSlug(subscription);

  useEffect(() => {
    if (!isOrg && !isPaid) {
      navigate("/settings/account", { replace: true });
    }
  }, [isOrg, isPaid, navigate]);

  if (!isOrg && !isPaid) return null;

  const displayName = isOrg
    ? organization?.name || "Organization"
    : user?.fullName || user?.firstName || "User";
  const avatarUrl = isOrg ? organization?.imageUrl : user?.imageUrl;
  const isEnterprise = planSlug === "enterprise";

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Billing
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Manage your subscription and payment methods.
        </p>
      </div>

      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        <div className="flex items-center gap-4 mb-5">
          <Avatar
            className="h-12 w-12"
            style={{ boxShadow: "0 0 0 2px var(--border-primary)" }}
          >
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback
              className="text-sm font-semibold"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
              }}
            >
              {isOrg ? (
                <Building2 size={18} />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p
              className="text-base font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {displayName}
            </p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {isOrg ? "Organization billing" : "Personal billing"}
            </p>
          </div>
        </div>

        <div
          className={`rounded-xl p-4 ${isPaid ? "bg-green-500/[0.06] border border-green-500/10" : "bg-blue-500/[0.06] border border-blue-500/10"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`shrink-0 w-9 h-9 rounded-lg grid place-items-center ${isPaid ? "bg-green-500/10" : "bg-blue-500/10"}`}
              >
                {isPaid ? (
                  <Crown size={16} className="text-green-400" />
                ) : (
                  <Sparkles size={16} className="text-blue-400" />
                )}
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {planLabel} Plan
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isPaid && <Check size={12} className="text-green-400" />}
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {isPaid ? "Active subscription" : "Free tier"}
                  </span>
                </div>
              </div>
            </div>
            <Badge
              className={`text-[10px] px-2.5 py-1 border-0 ${isPaid ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}
            >
              {isPaid ? "Active" : "Free"}
            </Badge>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border-secondary)",
          margin: "2.5rem 0",
        }}
      />

      <div>
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Billing Management
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Manage your subscription, payment methods, and invoices.
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        {isEnterprise ? (
          <a
            href="https://cycls.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-all duration-150 group"
          >
            <div
              className="shrink-0 w-9 h-9 rounded-lg grid place-items-center"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <ExternalLink
                size={16}
                style={{ color: "var(--text-tertiary)" }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Contact Sales
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Enterprise plans are managed by your account team.
              </p>
            </div>
            <ArrowUpRight
              size={14}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-muted)" }}
            />
          </a>
        ) : (
          <>
            <SubscriptionDetailsButton for={isOrg ? "organization" : undefined}>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-all duration-150 group text-left"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg grid place-items-center bg-green-500/[0.08]">
                  <CreditCard size={16} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Manage Subscription
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Update payment method or cancel subscription.
                  </p>
                </div>
                <ArrowUpRight
                  size={14}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                />
              </button>
            </SubscriptionDetailsButton>

            <div
              className="mx-4"
              style={{ borderTop: "1px solid var(--border-secondary)" }}
            />

            <SubscriptionDetailsButton for={isOrg ? "organization" : undefined}>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--bg-hover)] transition-all duration-150 group text-left"
              >
                <div
                  className="shrink-0 w-9 h-9 rounded-lg grid place-items-center"
                  style={{ backgroundColor: "var(--bg-tertiary)" }}
                >
                  <Receipt
                    size={16}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Invoices &amp; Receipts
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    View billing history and download invoices.
                  </p>
                </div>
                <ArrowUpRight
                  size={14}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                />
              </button>
            </SubscriptionDetailsButton>
          </>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border-secondary)",
          margin: "2.5rem 0",
        }}
      />

      <div>
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Change Plan
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          {isEnterprise
            ? "You're on a custom Enterprise plan. Contact sales for changes."
            : "Upgrade or downgrade your plan at any time."}
        </p>
      </div>

      {isEnterprise ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-500/[0.06] border border-purple-500/10">
          <div className="shrink-0 w-10 h-10 rounded-xl grid place-items-center bg-purple-500/[0.08]">
            <Building2 size={18} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Enterprise plan
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              Reach out at{" "}
              <a
                href="https://cycls.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--accent-primary)" }}
              >
                cycls.com/contact
              </a>{" "}
              for any changes.
            </p>
          </div>
        </div>
      ) : (
        <div className="clerk-theme-override">
          <PricingTable for={isOrg ? "organization" : undefined} />
        </div>
      )}
    </div>
  );
};
