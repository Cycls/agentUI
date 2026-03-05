import { useState, useCallback, useEffect, useRef } from "react";
import { useOutletContext, useLocation } from "react-router";
import {
  useUser,
  useAuth,
  useOrganization,
  useOrganizationList,
  PricingTable,
} from "@clerk/clerk-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  Zap,
  Check,
  User,
  Building2,
  Camera,
  Loader2,
} from "lucide-react";

// ── Profile Section ──
const ProfileSection = () => {
  const { user, isLoaded } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const avatarInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return;
    setIsUploadingAvatar(true);
    try {
      await user.setProfileImage({ file });
    } catch (err) {
      console.error("Failed to upload photo:", err);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Profile
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            Your public profile information.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
    );
  }

  const initials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Profile
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Your public profile information.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Avatar
            className="h-16 w-16"
            style={{ boxShadow: "0 0 0 2px var(--border-primary)" }}
          >
            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
            <AvatarFallback
              className="text-lg"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isUploadingAvatar ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {user?.fullName || "—"}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            {user?.primaryEmailAddress?.emailAddress}
          </p>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="text-sm mt-1 cursor-pointer transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            Change photo
          </button>
        </div>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setIsDirty(true);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setIsDirty(true);
            }}
          />
        </div>
      </div>

      {/* Email addresses */}
      {user?.emailAddresses?.length > 0 && (
        <div className="space-y-2">
          <Label>Email addresses</Label>
          <div className="space-y-2">
            {user.emailAddresses.map((ea) => (
              <div
                key={ea.id}
                className="flex items-center justify-between rounded-lg px-4 py-3"
                style={{
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {ea.emailAddress}
                </span>
                {ea.id === user.primaryEmailAddressId && (
                  <Badge
                    className="text-xs px-2 py-0.5 rounded-full border-0"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Primary
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected accounts */}
      {user?.externalAccounts?.length > 0 && (
        <div className="space-y-2">
          <Label>Connected accounts</Label>
          <div className="space-y-2">
            {user.externalAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                <div className="h-5 w-5 shrink-0 flex items-center justify-center">
                  <User
                    className="h-4 w-4"
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm capitalize"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {acc.provider}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {acc.emailAddress || acc.username}
                  </p>
                </div>
                <Badge className="border border-green-500/30 text-green-400 text-xs px-2.5 py-0.5 rounded-full bg-green-500/10">
                  Connected
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid var(--border-secondary)",
          margin: "2.5rem 0",
        }}
      />

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-primary)",
          }}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Account Page ──
export const SettingsAccountPage = () => {
  const { isPass, isOrg, isPaid, planLabel } = useOutletContext();
  const { user } = useUser();
  const { orgId } = useAuth();
  useOrganization();
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const location = useLocation();
  const plansRef = useRef(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (location.hash === "#plans" && plansRef.current) {
      plansRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    setDeleteLoading(true);
    try {
      await user.delete();
    } catch (err) {
      console.error("Failed to delete account:", err);
      setDeleteLoading(false);
    }
  }, [user]);

  const handleSwitchContext = useCallback(
    async (orgIdToSwitch) => {
      if (!setActive) return;
      try {
        await setActive({ organization: orgIdToSwitch });
      } catch (err) {
        console.error("Failed to switch context:", err);
      }
    },
    [setActive]
  );

  return (
    <div className="space-y-6">
      {/* ── Profile ── */}
      <ProfileSection />

      {/* ── Accounts (Pass only) ── */}
      {isPass && userMemberships?.data && userMemberships.data.length > 0 && (
        <>
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
              Accounts
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Switch between personal and organization contexts.
            </p>
          </div>
          <div className="space-y-1">
            {/* Personal */}
            <button
              type="button"
              onClick={() => handleSwitchContext(null)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 hover:bg-[var(--bg-hover)]"
              style={{
                backgroundColor: !orgId ? "var(--bg-hover)" : "transparent",
              }}
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/10 grid place-items-center">
                <User size={16} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user?.fullName || user?.firstName || "Personal"}
                </div>
                <div
                  className="text-xs truncate"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Personal account
                </div>
              </div>
              {!orgId && (
                <Check
                  size={16}
                  className="shrink-0"
                  style={{ color: "var(--accent-primary)" }}
                />
              )}
            </button>

            {/* Orgs */}
            {userMemberships.data.map((mem) => (
              <button
                key={mem.organization.id}
                type="button"
                onClick={() => handleSwitchContext(mem.organization.id)}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 hover:bg-[var(--bg-hover)]"
                style={{
                  backgroundColor:
                    orgId === mem.organization.id
                      ? "var(--bg-hover)"
                      : "transparent",
                }}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={mem.organization.imageUrl}
                    alt={mem.organization.name}
                  />
                  <AvatarFallback
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Building2 size={16} />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {mem.organization.name}
                  </div>
                  <div
                    className="text-xs truncate capitalize"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {mem.role?.replace("org:", "") || "Member"}
                  </div>
                </div>
                {orgId === mem.organization.id && (
                  <Check
                    size={16}
                    className="shrink-0"
                    style={{ color: "var(--accent-primary)" }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Plans (Pass only) ── */}
      {isPass && (
        <>
          <div
            style={{
              borderTop: "1px solid var(--border-secondary)",
              margin: "2.5rem 0",
            }}
          />
          <div ref={plansRef} id="plans">
            <div className="mb-6">
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Choose Your Plan
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                {isOrg
                  ? "Select a plan for your organization."
                  : "Select a plan for your personal account."}
              </p>
            </div>

            {!isPaid && (
              <div className="flex items-center gap-4 p-4 rounded-xl mb-5 bg-blue-500/[0.06] border border-blue-500/10">
                <div className="shrink-0 w-10 h-10 rounded-xl grid place-items-center bg-blue-500/10">
                  <Zap
                    size={18}
                    className="text-blue-400"
                    fill="currentColor"
                    stroke="none"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    You&apos;re on the Trial plan
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Upgrade for unlimited access across all agents.
                  </p>
                </div>
                <Badge className="shrink-0 text-[10px] px-2.5 py-1 bg-blue-500/10 text-blue-400 border-0">
                  Trial
                </Badge>
              </div>
            )}

            {isPaid && (
              <div className="flex items-center gap-4 p-4 rounded-xl mb-5 bg-green-500/[0.06] border border-green-500/10">
                <div className="shrink-0 w-10 h-10 rounded-xl grid place-items-center bg-green-500/10">
                  <Check size={18} className="text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    You&apos;re on the {planLabel} plan
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Unlimited access enabled.
                  </p>
                </div>
                <Badge className="shrink-0 text-[10px] px-2.5 py-1 bg-green-500/10 text-green-400 border-0">
                  Active
                </Badge>
              </div>
            )}

            <div className="clerk-theme-override">
              <PricingTable for={isOrg ? "organization" : undefined} />
            </div>
          </div>
        </>
      )}

      {/* ── Danger Zone ── */}
      <div
        style={{
          borderTop: "1px solid var(--border-secondary)",
          margin: "2.5rem 0",
        }}
      />
      <div
        className="rounded-xl p-4 flex items-center justify-between gap-4"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid rgba(239,68,68,0.15)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-lg grid place-items-center bg-red-500/10">
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Delete account
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              Permanently delete your account and all data.
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Delete
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/10 grid place-items-center">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription className="mt-1">
                    This action is permanent and cannot be undone. All your
                    data, chats, and files will be deleted.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
