import { useState } from "react";
import { useOutletContext } from "react-router";
import { useAuth, useOrganization } from "@clerk/clerk-react";
import { FileModal } from "../FileModal";
import { Badge } from "@/components/ui/badge";
import { Folder, Download, Trash2, Database } from "lucide-react";

// helper badge for "Coming soon"
const ComingSoonBadge = () => (
  <Badge
    className="text-xs px-2 py-0.5 rounded-full"
    style={{
      backgroundColor: "var(--bg-tertiary)",
      color: "var(--text-tertiary)",
      border: "1px solid var(--border-primary)",
    }}
  >
    Coming soon
  </Badge>
);

// ── Data Page ──
export const SettingsDataPage = () => {
  const { isOrg } = useOutletContext();
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* ── File Storage ── */}
      <div>
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          File Storage
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Browse and manage your uploaded files.
        </p>
      </div>

      <div
        className="rounded-xl p-6 space-y-4"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        <button
          onClick={() => setIsFileModalOpen(true)}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-2 hover:opacity-80"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <Folder size={16} strokeWidth={1.7} />
          Open File Browser
        </button>

        <div
          className="flex items-center gap-2 p-3 rounded-lg"
          style={{
            backgroundColor: "var(--input-bg)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <Database
            size={16}
            className="shrink-0"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Storage usage details coming soon.
          </p>
        </div>
      </div>

      {/* ── Shared Workspace (Org only) ── */}
      {isOrg && (
        <>
          <div
            style={{
              borderTop: "1px solid var(--border-secondary)",
              margin: "2.5rem 0",
            }}
          />
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Shared Workspace
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Share files and conversations with your{" "}
                {organization?.name || "organization"} team.
              </p>
            </div>
            <ComingSoonBadge />
          </div>
        </>
      )}

      {/* ── Export & Delete Data ── */}
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
          Data Management
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Export or delete your conversations and files.
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-secondary)",
        }}
      >
        {/* Export conversations */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Download size={16} style={{ color: "var(--text-tertiary)" }} />
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Export conversations
            </span>
          </div>
          <ComingSoonBadge />
        </div>

        <div
          className="mx-4"
          style={{ borderTop: "1px solid var(--border-secondary)" }}
        />

        {/* Export files */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Download size={16} style={{ color: "var(--text-tertiary)" }} />
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Export all files
            </span>
          </div>
          <ComingSoonBadge />
        </div>

        <div
          className="mx-4"
          style={{ borderTop: "1px solid var(--border-secondary)" }}
        />

        {/* Delete conversations */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Trash2 size={16} style={{ color: "var(--text-tertiary)" }} />
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Delete all conversations
            </span>
          </div>
          <ComingSoonBadge />
        </div>
      </div>

      {/* File Modal */}
      <FileModal
        open={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        getToken={getToken}
      />
    </div>
  );
};
