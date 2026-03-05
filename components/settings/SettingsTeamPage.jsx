import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useUser, useOrganization } from "@clerk/clerk-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Mail,
  Clock,
  MoreHorizontal,
  Loader2,
  XCircle,
  Building2,
  Shield,
  UserMinus,
  AlertTriangle,
} from "lucide-react";

// ── Invite Member Dialog ──
const InviteMemberDialog = ({ isOpen, onOpenChange, organization, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("org:member");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState(null);

  const handleInvite = async () => {
    if (!email.trim() || !organization) return;
    setIsInviting(true);
    setError(null);
    try {
      await organization.inviteMember({
        emailAddress: email.trim(),
        role,
      });
      setEmail("");
      setRole("org:member");
      onSuccess?.();
    } catch (err) {
      setError(
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Failed to send invitation"
      );
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-primary)" }}>
            Invite a member
          </DialogTitle>
          <DialogDescription style={{ color: "var(--text-tertiary)" }}>
            Send an invitation to join {organization?.name || "your organization"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label style={{ color: "var(--text-secondary)" }}>
              Email address
            </Label>
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
          </div>

          <div className="space-y-2">
            <Label style={{ color: "var(--text-secondary)" }}>Role</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole("org:member")}
                className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
                style={{
                  backgroundColor:
                    role === "org:member" ? "var(--bg-hover)" : "transparent",
                  color:
                    role === "org:member"
                      ? "var(--text-primary)"
                      : "var(--text-tertiary)",
                  border:
                    role === "org:member"
                      ? "1px solid var(--accent-primary)"
                      : "1px solid var(--border-secondary)",
                }}
              >
                <Users size={14} />
                Member
              </button>
              <button
                type="button"
                onClick={() => setRole("org:admin")}
                className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
                style={{
                  backgroundColor:
                    role === "org:admin" ? "var(--bg-hover)" : "transparent",
                  color:
                    role === "org:admin"
                      ? "var(--text-primary)"
                      : "var(--text-tertiary)",
                  border:
                    role === "org:admin"
                      ? "1px solid var(--accent-primary)"
                      : "1px solid var(--border-secondary)",
                }}
              >
                <Shield size={14} />
                Admin
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!email.trim() || isInviting}
            className="text-sm"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "#fff",
            }}
          >
            {isInviting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-3.5 w-3.5 mr-2" />
                Send invite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Team Page ──
export const SettingsTeamPage = () => {
  const { isOrg } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useUser();
  const {
    organization,
    membership,
    isLoaded,
    memberships,
    invitations,
  } = useOrganization({
    memberships: { infinite: true, pageSize: 50 },
    invitations: { infinite: true, pageSize: 50 },
  });

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  // Route guard
  useEffect(() => {
    if (!isOrg) {
      navigate("/settings/account", { replace: true });
    }
  }, [isOrg, navigate]);

  if (!isOrg) return null;

  const isAdmin = membership?.role === "org:admin";
  const memberList = memberships?.data ?? [];
  const pendingInvitations = (invitations?.data ?? []).filter(
    (inv) => inv.status === "pending"
  );

  // ── Loading state ──
  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Team
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            Manage who has access to this organization.
          </p>
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-secondary)",
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{
                borderBottom: i < 2 ? "1px solid var(--border-secondary)" : "none",
              }}
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await removeTarget.destroy();
      setRemoveTarget(null);
      memberships?.revalidate?.();
    } catch (err) {
      console.error("Failed to remove member:", err);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRevoke = async (invitation) => {
    setRevokingId(invitation.id);
    try {
      await invitation.revoke();
      invitations?.revalidate?.();
    } catch (err) {
      console.error("Failed to revoke invitation:", err);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Team
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            Manage who has access to this organization.
          </p>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            className="shrink-0 text-sm"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "#fff",
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add member
          </Button>
        )}
      </div>

      {/* ── Org Header Card ── */}
      <div
        className="flex items-center gap-4 rounded-xl p-4"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        <Avatar
          className="h-11 w-11"
          style={{ boxShadow: "0 0 0 2px var(--border-primary)" }}
        >
          <AvatarImage src={organization?.imageUrl} alt={organization?.name} />
          <AvatarFallback
            style={{
              backgroundColor: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
            }}
          >
            <Building2 size={18} />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {organization?.name || "Organization"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {organization?.membersCount || 0} member
            {(organization?.membersCount || 0) !== 1 ? "s" : ""}
            {pendingInvitations.length > 0 &&
              ` · ${pendingInvitations.length} pending`}
          </p>
        </div>
        <Badge
          className="text-[10px] px-2.5 py-1 border-0 bg-green-500/10 text-green-400"
        >
          Active
        </Badge>
      </div>

      {/* ── Member List ── */}
      <div>
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Members ({memberList.length})
        </h3>

        {memberList.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px dashed var(--border-secondary)",
            }}
          >
            <div
              className="h-12 w-12 rounded-full grid place-items-center mx-auto mb-4"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <Users size={22} style={{ color: "var(--text-muted)" }} />
            </div>
            <h3
              className="text-sm font-semibold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              No members yet
            </h3>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Invite your team to collaborate in this organization.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-secondary)",
            }}
          >
            {memberList.map((mem, i) => {
              const publicData = mem.publicUserData;
              const isCurrentUser = publicData?.userId === user?.id;
              const memberName =
                [publicData?.firstName, publicData?.lastName]
                  .filter(Boolean)
                  .join(" ") ||
                publicData?.identifier ||
                "Unknown";
              const initials = memberName.slice(0, 2).toUpperCase();

              return (
                <div
                  key={mem.id}
                  className="flex items-center gap-3 px-4 py-3.5 group transition-colors duration-150 hover:bg-[var(--bg-hover)]"
                  style={{
                    borderTop:
                      i > 0 ? "1px solid var(--border-secondary)" : "none",
                  }}
                >
                  <Avatar
                    className="h-8 w-8 shrink-0"
                    style={{ boxShadow: "0 0 0 1.5px var(--border-primary)" }}
                  >
                    <AvatarImage src={publicData?.imageUrl ?? undefined} />
                    <AvatarFallback
                      className="text-xs font-medium"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {memberName}
                      </span>
                      {isCurrentUser && (
                        <Badge
                          className="text-[10px] px-1.5 py-0 border-0"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            color: "var(--text-muted)",
                          }}
                        >
                          You
                        </Badge>
                      )}
                    </div>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {publicData?.identifier}
                    </p>
                  </div>

                  <Badge
                    className="text-[10px] px-2 py-0.5 shrink-0 border-0"
                    style={
                      mem.role === "org:admin"
                        ? {
                            backgroundColor: "rgba(16,163,127,0.1)",
                            color: "var(--accent-primary)",
                          }
                        : {
                            backgroundColor: "var(--bg-tertiary)",
                            color: "var(--text-muted)",
                          }
                    }
                  >
                    {mem.role === "org:admin" ? "Admin" : "Member"}
                  </Badge>

                  {/* Actions (admin only, not on self) */}
                  {isAdmin && !isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-8 w-8 shrink-0 rounded-lg grid place-items-center opacity-0 group-hover:opacity-100 transition-all duration-150 hover:bg-[var(--bg-tertiary)]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          border: "1px solid var(--border-secondary)",
                        }}
                      >
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer text-sm gap-2"
                          onClick={() => setRemoveTarget(mem)}
                        >
                          <UserMinus size={14} />
                          Remove member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pending Invitations ── */}
      {pendingInvitations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} style={{ color: "var(--text-muted)" }} />
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Pending invitations ({pendingInvitations.length})
            </h3>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-secondary)",
            }}
          >
            {pendingInvitations.map((inv, i) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 px-4 py-3.5 group"
                style={{
                  borderTop:
                    i > 0 ? "1px solid var(--border-secondary)" : "none",
                }}
              >
                <div
                  className="h-8 w-8 shrink-0 rounded-full grid place-items-center"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                  }}
                >
                  <Mail
                    size={14}
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {inv.emailAddress}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Invited{" "}
                    {new Date(inv.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <Badge
                  className="text-[10px] px-2 py-0.5 shrink-0 border-0"
                  style={
                    inv.role === "org:admin"
                      ? {
                          backgroundColor: "rgba(16,163,127,0.1)",
                          color: "var(--accent-primary)",
                        }
                      : {
                          backgroundColor: "var(--bg-tertiary)",
                          color: "var(--text-muted)",
                        }
                  }
                >
                  {inv.role === "org:admin" ? "Admin" : "Member"}
                </Badge>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(inv)}
                    disabled={revokingId === inv.id}
                    className="h-8 w-8 shrink-0 rounded-lg grid place-items-center opacity-0 group-hover:opacity-100 transition-all duration-150 hover:bg-red-500/10 disabled:opacity-50"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {revokingId === inv.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} className="hover:text-red-400" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Invite Dialog ── */}
      <InviteMemberDialog
        isOpen={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        organization={organization}
        onSuccess={() => {
          memberships?.revalidate?.();
          invitations?.revalidate?.();
          setIsInviteOpen(false);
        }}
      />

      {/* ── Remove Confirmation ── */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <AlertDialogContent
          style={{
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-secondary)",
          }}
        >
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/10 grid place-items-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <AlertDialogTitle style={{ color: "var(--text-primary)" }}>
                  Remove member?
                </AlertDialogTitle>
                <AlertDialogDescription
                  className="mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Remove this member from &ldquo;{organization?.name}&rdquo;?
                  They will lose access immediately.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isRemoving ? "Removing..." : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
