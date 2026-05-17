// app/routes/fruits_.vault.tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useRevalidator } from "react-router";
import { useRef, useState, useCallback } from "react";
import { getUser } from "../modules/auth/auth.server";
// Types live in a server-free file — safe to import on the client.
import type { FileRef, VaultFolder } from "../data/vault.types";
// Server functions are only used inside `loader`; React Router strips them
// from the client bundle automatically.
import {
  getFileRefsByHuman,
  getFoldersByHuman,
  getSharedFoldersForHuman,
  getFileRefsByFolderIds,
} from "../data/vault.server";
import { getHumansById } from "../data/humans.server";
import { AppLayout } from "../components/AppLayout";

/** Client-safe lock check — no server imports needed. */
function isFileRefLocked(file: FileRef): boolean {
  if (file.source !== "daily_log") return false;
  const today = new Date().toISOString().slice(0, 10);
  return file.created_at.slice(0, 10) !== today;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SharedFolder = VaultFolder & {
  ownerName: string;
  ownerHumanId: string;
};

type PanelTarget =
  | { kind: "my-root" }
  | { kind: "my-folder"; folderId: string }
  | { kind: "shared-folder"; folderId: string; ownerName: string };

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const [myFiles, myFolders, sharedFolders] = await Promise.all([
    getFileRefsByHuman(user._id),
    getFoldersByHuman(user._id),
    getSharedFoldersForHuman(user._id),
  ]);

  const sharedFolderIds = sharedFolders.map((f) => f._id);
  const sharedFiles = await getFileRefsByFolderIds(sharedFolderIds);

  const ownerIds = [...new Set(sharedFolders.map((f) => f.human_id))];
  const owners = await getHumansById(ownerIds);
  const ownerMap = Object.fromEntries(owners.map((o) => [o._id, o]));

  const sharedFoldersWithOwner: SharedFolder[] = sharedFolders.map((f) => ({
    ...f,
    ownerName:
      ownerMap[f.human_id]?.name ?? ownerMap[f.human_id]?.email ?? "Unknown",
    ownerHumanId: f.human_id,
  }));

  return {
    user,
    myFiles,
    myFolders,
    sharedFolders: sharedFoldersWithOwner,
    sharedFiles,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType === "application/pdf") return "📄";
  if (contentType === "text/markdown") return "📝";
  if (contentType.startsWith("video/")) return "🎬";
  return "📎";
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({
  folder,
  onClose,
  onSave,
}: {
  folder: VaultFolder;
  onClose: () => void;
  onSave: (shared_with: string[] | "everyone") => void;
}) {
  const current = folder.shared_with;
  const [mode, setMode] = useState<"private" | "everyone">(
    current === "everyone" ? "everyone" : "private",
  );

  const handleSave = () => {
    onSave(mode === "everyone" ? "everyone" : []);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--background)",
          border: "1px solid var(--midground)",
          borderRadius: "8px",
          padding: "24px",
          minWidth: "280px",
          maxWidth: "360px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="font-bold text-sm font-mono mb-4"
          style={{ color: "var(--purple)" }}
        >
          Share "{folder.name}"
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              checked={mode === "private"}
              onChange={() => setMode("private")}
              style={{ accentColor: "var(--purple)" }}
            />
            <span className="text-sm font-mono">Private (only me)</span>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              checked={mode === "everyone"}
              onChange={() => setMode("everyone")}
              style={{ accentColor: "var(--purple)" }}
            />
            <span className="text-sm font-mono">Everyone in the app</span>
          </label>
        </div>
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button
            onClick={onClose}
            className="text-xs font-mono px-3 py-1.5 rounded"
            style={{
              background: "var(--farground)",
              border: "1px solid var(--midground)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-xs font-mono px-3 py-1.5 rounded"
            style={{
              background: "var(--purple)",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Move File Modal ──────────────────────────────────────────────────────────

function MoveModal({
  file,
  myFolders,
  onClose,
  onMove,
}: {
  file: FileRef;
  myFolders: VaultFolder[];
  onClose: () => void;
  onMove: (folderId: string | null) => void;
}) {
  const [selected, setSelected] = useState<string | null>(file.folder_id);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--background)",
          border: "1px solid var(--midground)",
          borderRadius: "8px",
          padding: "24px",
          minWidth: "280px",
          maxWidth: "360px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="font-bold text-sm font-mono mb-4"
          style={{ color: "var(--purple)" }}
        >
          Move "{file.name}"
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              checked={selected === null}
              onChange={() => setSelected(null)}
              style={{ accentColor: "var(--purple)" }}
            />
            <span className="text-sm font-mono">Root (no folder)</span>
          </label>
          {myFolders.map((f) => (
            <label
              key={f._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                checked={selected === f._id}
                onChange={() => setSelected(f._id)}
                style={{ accentColor: "var(--purple)" }}
              />
              <span className="text-sm font-mono">{f.name}</span>
            </label>
          ))}
        </div>
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}
        >
          <button
            onClick={onClose}
            className="text-xs font-mono px-3 py-1.5 rounded"
            style={{
              background: "var(--farground)",
              border: "1px solid var(--midground)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onMove(selected);
              onClose();
            }}
            className="text-xs font-mono px-3 py-1.5 rounded"
            style={{
              background: "var(--purple)",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Folder Tree Item ─────────────────────────────────────────────────────────

function FolderTreeItem({
  folder,
  allFolders,
  activeFolderId,
  depth,
  onSelect,
  onRename,
  onShare,
  onDelete,
}: {
  folder: VaultFolder;
  allFolders: VaultFolder[];
  /** The _id of whichever folder is currently selected (or null). Passed down unchanged so children can highlight themselves. */
  activeFolderId: string | null;
  depth: number;
  onSelect: (f: VaultFolder) => void;
  onRename: (folder: VaultFolder) => void;
  onShare: (folder: VaultFolder) => void;
  onDelete: (folder: VaultFolder) => void;
}) {
  const children = allFolders.filter((f) => f.parent_folder_id === folder._id);
  const hasChildren = children.length > 0;
  const active = activeFolderId === folder._id;
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ marginLeft: depth * 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          borderRadius: "5px",
          background: active ? "var(--farground)" : "transparent",
          padding: "2px 4px",
          position: "relative",
        }}
        className="group"
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((x) => !x)}
          style={{
            background: "none",
            border: "none",
            cursor: hasChildren ? "pointer" : "default",
            color: hasChildren ? "var(--purple-light)" : "transparent",
            padding: "0 2px",
            fontSize: "10px",
            lineHeight: 1,
            flexShrink: 0,
          }}
          tabIndex={-1}
        >
          {hasChildren ? (expanded ? "▼" : "▶") : "·"}
        </button>

        {/* Folder name */}
        <button
          onClick={() => onSelect(folder)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            flex: 1,
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "13px",
            color: active ? "var(--purple)" : "var(--text-subtle)",
            fontWeight: active ? "bold" : "normal",
            padding: "3px 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          📁 {folder.name}
        </button>

        {/* "..." menu */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((x) => !x);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-subtle)",
              fontSize: "14px",
              padding: "0 4px",
              opacity: menuOpen ? 1 : 0,
              transition: "opacity 150ms",
            }}
            className="folder-menu-btn"
          >
            ···
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                background: "var(--background)",
                border: "1px solid var(--midground)",
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 50,
                minWidth: "120px",
                overflow: "hidden",
              }}
            >
              {[
                {
                  label: "Rename",
                  action: () => {
                    setMenuOpen(false);
                    onRename(folder);
                  },
                },
                {
                  label: "Share",
                  action: () => {
                    setMenuOpen(false);
                    onShare(folder);
                  },
                },
                {
                  label: "Delete",
                  action: () => {
                    setMenuOpen(false);
                    onDelete(folder);
                  },
                },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "12px",
                    color: label === "Delete" ? "#e05" : "var(--foreground)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "var(--farground)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "none";
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {expanded &&
        hasChildren &&
        children.map((child) => (
          <FolderTreeItem
            key={child._id}
            folder={child}
            allFolders={allFolders}
            activeFolderId={activeFolderId}
            depth={depth + 1}
            onSelect={onSelect}
            onRename={onRename}
            onShare={onShare}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

// ─── File Card ────────────────────────────────────────────────────────────────

function FileCard({
  file,
  myFolders,
  isOwned,
  isLocked,
  onRename,
  onDelete,
  onMove,
  onEditMd,
}: {
  file: FileRef;
  myFolders: VaultFolder[];
  isOwned: boolean;
  isLocked: boolean;
  onRename: (file: FileRef) => void;
  onDelete: (file: FileRef) => void;
  onMove: (file: FileRef) => void;
  onEditMd: (file: FileRef) => void;
}) {
  const isMd = file.content_type === "text/markdown";

  return (
    <div
      className="group"
      style={{
        border: "1px solid var(--midground)",
        borderRadius: "8px",
        padding: "12px",
        background: "var(--farground)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        position: "relative",
        cursor: isMd ? "pointer" : "default",
      }}
      onClick={isMd ? () => onEditMd(file) : undefined}
    >
      {/* Icon + name */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "20px", flexShrink: 0 }}>
          {fileIcon(file.content_type)}
        </span>
        <span
          className="text-sm font-mono"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            color: "var(--foreground)",
          }}
          title={file.name}
        >
          {file.name}
        </span>
      </div>

      {/* Meta */}
      <div
        className="text-xs font-mono"
        style={{
          color: "var(--text-subtle)",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {file.size && <span>{formatSize(file.size)}</span>}
        <span>{formatDate(file.created_at)}</span>
        {isLocked && (
          <span
            title="Uploaded from Daily Log — read-only after today"
            style={{ color: "var(--text-subtle)", opacity: 0.6 }}
          >
            🔒
          </span>
        )}
      </div>

      {/* s3 link for non-md */}
      {!isMd && file.s3_url && (
        <a
          href={file.s3_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-mono"
          style={{ color: "var(--purple-light)", textDecoration: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          Open ↗
        </a>
      )}

      {/* Action buttons (hover) — hidden for locked daily-log files */}
      {isOwned && !isLocked && (
        <div
          className="file-actions"
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            display: "flex",
            gap: "4px",
            opacity: 0,
            transition: "opacity 150ms",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename(file);
            }}
            title="Rename"
            style={actionBtnStyle}
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove(file);
            }}
            title="Move"
            style={actionBtnStyle}
          >
            📂
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file);
            }}
            title="Delete"
            style={{ ...actionBtnStyle, color: "#e05" }}
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  background: "var(--background)",
  border: "1px solid var(--midground)",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "13px",
  padding: "2px 5px",
  lineHeight: 1.2,
};

// ─── Markdown Editor Modal ────────────────────────────────────────────────────

function MdEditorModal({
  file,
  onClose,
  onSave,
}: {
  file: FileRef;
  onClose: () => void;
  onSave: (content: string) => void;
}) {
  const [content, setContent] = useState(file.content ?? "");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        zIndex: 100,
        padding: "32px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--background)",
          border: "1px solid var(--midground)",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "760px",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--midground)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            className="text-sm font-mono font-bold"
            style={{ color: "var(--purple)" }}
          >
            📝 {file.name}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                onSave(content);
                onClose();
              }}
              className="text-xs font-mono px-3 py-1.5 rounded"
              style={{
                background: "var(--purple)",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="text-xs font-mono px-3 py-1.5 rounded"
              style={{
                background: "var(--farground)",
                border: "1px solid var(--midground)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Editor */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            outline: "none",
            padding: "20px",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "13px",
            lineHeight: 1.65,
            background: "var(--background)",
            color: "var(--foreground)",
          }}
          autoFocus
        />
      </div>
    </div>
  );
}

// ─── New Folder Input ─────────────────────────────────────────────────────────

function NewFolderInput({
  parentFolderId,
  onDone,
}: {
  parentFolderId: string | null;
  onDone: (name: string) => void;
}) {
  const [val, setVal] = useState("");

  const submit = () => {
    const name = val.trim();
    if (name) onDone(name);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 4px",
      }}
    >
      <span style={{ fontSize: "12px" }}>📁</span>
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onDone("");
        }}
        onBlur={() => {
          if (val.trim()) submit();
          else onDone("");
        }}
        placeholder="Folder name"
        className="font-mono text-xs"
        style={{
          flex: 1,
          border: "1px solid var(--purple)",
          borderRadius: "4px",
          padding: "3px 6px",
          background: "var(--farground)",
          color: "var(--foreground)",
          outline: "none",
        }}
      />
    </div>
  );
}

// ─── Rename Input ─────────────────────────────────────────────────────────────

function RenameInput({
  initialValue,
  onDone,
}: {
  initialValue: string;
  onDone: (name: string) => void;
}) {
  const [val, setVal] = useState(initialValue);

  const submit = () => {
    const name = val.trim();
    if (name && name !== initialValue) onDone(name);
    else onDone("");
  };

  return (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") onDone("");
      }}
      onBlur={submit}
      className="font-mono text-xs"
      style={{
        border: "1px solid var(--purple)",
        borderRadius: "4px",
        padding: "3px 8px",
        background: "var(--farground)",
        color: "var(--foreground)",
        outline: "none",
        width: "100%",
      }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VaultPage() {
  const { myFiles, myFolders, sharedFolders, sharedFiles } =
    useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();

  // ── Panel selection state ──────────────────────────────────────────────────
  const [panel, setPanel] = useState<PanelTarget>({ kind: "my-root" });

  // ── Modals / inline UI ────────────────────────────────────────────────────
  const [shareFolder, setShareFolder] = useState<VaultFolder | null>(null);
  const [moveFile, setMoveFile] = useState<FileRef | null>(null);
  const [editMdFile, setEditMdFile] = useState<FileRef | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [addingFolder, setAddingFolder] = useState(false);

  // ── Collapsibles ──────────────────────────────────────────────────────────
  const [myFilesOpen, setMyFilesOpen] = useState(true);
  const [sharedOpen, setSharedOpen] = useState(true);
  const [expandedOwners, setExpandedOwners] = useState<Set<string>>(new Set());

  // ── File upload ref ───────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // ─── Derived data ──────────────────────────────────────────────────────────

  const currentFolderId = panel.kind === "my-folder" ? panel.folderId : null;

  const visibleFiles: FileRef[] = (() => {
    if (panel.kind === "my-root") return myFiles.filter((f) => !f.folder_id);
    if (panel.kind === "my-folder")
      return myFiles.filter((f) => f.folder_id === panel.folderId);
    if (panel.kind === "shared-folder")
      return sharedFiles.filter((f) => f.folder_id === panel.folderId);
    return [];
  })();

  const breadcrumb = (() => {
    if (panel.kind === "my-root") return "My Files / Root";
    if (panel.kind === "my-folder") {
      const folder = myFolders.find((f) => f._id === panel.folderId);
      return `My Files / ${folder?.name ?? "Folder"}`;
    }
    if (panel.kind === "shared-folder") {
      return `Shared / ${panel.ownerName} / ${sharedFolders.find((f) => f._id === panel.folderId)?.name ?? "Folder"}`;
    }
    return "";
  })();

  const isMyPanel = panel.kind === "my-root" || panel.kind === "my-folder";

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const apiFetch = useCallback(async (url: string, options: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }, []);

  const createFolder = async (name: string) => {
    await apiFetch("/api/vault/folders", {
      method: "POST",
      body: JSON.stringify({ name, parent_folder_id: currentFolderId }),
    });
    revalidate();
  };

  const renameFolder = async (folderId: string, name: string) => {
    await apiFetch(`/api/vault/folders/${folderId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    revalidate();
  };

  const shareFolder_ = async (
    folderId: string,
    shared_with: string[] | "everyone",
  ) => {
    await apiFetch(`/api/vault/folders/${folderId}`, {
      method: "PATCH",
      body: JSON.stringify({ shared_with }),
    });
    revalidate();
  };

  const deleteFolder = async (folderId: string) => {
    if (
      !window.confirm(
        "Delete this folder and all its contents? This cannot be undone.",
      )
    )
      return;
    await apiFetch(`/api/vault/folders/${folderId}`, { method: "DELETE" });
    if (panel.kind === "my-folder" && panel.folderId === folderId) {
      setPanel({ kind: "my-root" });
    }
    revalidate();
  };

  const renameFile = async (fileId: string, name: string) => {
    await apiFetch(`/api/vault/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    revalidate();
  };

  const moveFile_ = async (fileId: string, folder_id: string | null) => {
    await apiFetch(`/api/vault/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify({ folder_id }),
    });
    revalidate();
  };

  const deleteFile = async (fileId: string) => {
    if (!window.confirm("Delete this file? This cannot be undone.")) return;
    await apiFetch(`/api/vault/${fileId}`, { method: "DELETE" });
    revalidate();
  };

  const saveMdFile = async (fileId: string, content: string) => {
    await apiFetch(`/api/vault/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
    revalidate();
  };

  const createMdFile = async () => {
    const name = window.prompt("File name (without extension):");
    if (!name?.trim()) return;
    const fullName = name.trim().endsWith(".md")
      ? name.trim()
      : `${name.trim()}.md`;
    await apiFetch("/api/vault", {
      method: "POST",
      body: JSON.stringify({
        name: fullName,
        content: "",
        content_type: "text/markdown",
        folder_id: currentFolderId,
      }),
    });
    revalidate();
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { presignedUrl, publicUrl, s3Key } = await apiFetch(
        "/api/vault/presign",
        {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            folderId: currentFolderId,
          }),
        },
      );

      await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      await apiFetch("/api/vault", {
        method: "POST",
        body: JSON.stringify({
          name: file.name,
          s3_url: publicUrl,
          s3_key: s3Key,
          content_type: file.type || "application/octet-stream",
          folder_id: currentFolderId,
          size: file.size,
        }),
      });

      revalidate();
    } catch (err) {
      console.error("Upload failed:", err);
      window.alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─── Owner groupings for shared section ───────────────────────────────────
  const sharedByOwner = sharedFolders.reduce<
    Record<string, { ownerName: string; folders: SharedFolder[] }>
  >((acc, f) => {
    const key = f.ownerHumanId;
    if (!acc[key]) acc[key] = { ownerName: f.ownerName, folders: [] };
    acc[key].folders.push(f);
    return acc;
  }, {});

  // ─── Styles ────────────────────────────────────────────────────────────────

  const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: "6px 4px",
    width: "100%",
    textAlign: "left",
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "var(--text-subtle)",
  };

  const rootItemStyle = (active: boolean): React.CSSProperties => ({
    display: "block",
    width: "100%",
    background: active ? "var(--farground)" : "none",
    border: "none",
    borderRadius: "5px",
    padding: "4px 8px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "13px",
    color: active ? "var(--purple)" : "var(--text-subtle)",
    fontWeight: active ? "bold" : "normal",
  });

  const actionBtnBarStyle: React.CSSProperties = {
    background: "var(--farground)",
    border: "1px solid var(--midground)",
    borderRadius: "6px",
    padding: "5px 10px",
    cursor: "pointer",
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "12px",
    color: "var(--purple-light)",
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      {/* Hover-reveal file action buttons via CSS */}
      <style>{`
        .group:hover .file-actions { opacity: 1 !important; }
        .group:hover .folder-menu-btn { opacity: 1 !important; }
      `}</style>

      <div
        style={{
          display: "flex",
          height: "100%",
          minHeight: "calc(100vh - 60px)",
          overflow: "hidden",
        }}
      >
        {/* ═══ LEFT PANEL: Folder Tree ══════════════════════════════════════ */}
        <div
          style={{
            width: "240px",
            flexShrink: 0,
            borderRight: "1px solid var(--midground)",
            overflowY: "auto",
            padding: "16px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {/* ── My Files ─────────────────────────────────────────────── */}
          <button
            style={sectionHeaderStyle}
            onClick={() => setMyFilesOpen((x) => !x)}
          >
            <span>{myFilesOpen ? "▼" : "▶"}</span>
            My Files
          </button>

          {myFilesOpen && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1px" }}
            >
              {/* Root item */}
              <button
                style={rootItemStyle(panel.kind === "my-root")}
                onClick={() => setPanel({ kind: "my-root" })}
              >
                📂 Root
              </button>

              {/* My folders (top-level only) */}
              {myFolders
                .filter((f) => !f.parent_folder_id)
                .map((folder) =>
                  renamingFolderId === folder._id ? (
                    <div key={folder._id} style={{ padding: "2px 4px" }}>
                      <RenameInput
                        initialValue={folder.name}
                        onDone={(name) => {
                          setRenamingFolderId(null);
                          if (name) renameFolder(folder._id, name);
                        }}
                      />
                    </div>
                  ) : (
                    <FolderTreeItem
                      key={folder._id}
                      folder={folder}
                      allFolders={myFolders}
                      activeFolderId={
                        panel.kind === "my-folder" ? panel.folderId : null
                      }
                      depth={0}
                      onSelect={(f) =>
                        setPanel({ kind: "my-folder", folderId: f._id })
                      }
                      onRename={(f) => setRenamingFolderId(f._id)}
                      onShare={(f) => setShareFolder(f)}
                      onDelete={(f) => deleteFolder(f._id)}
                    />
                  ),
                )}

              {/* New folder inline input */}
              {addingFolder && (
                <NewFolderInput
                  parentFolderId={currentFolderId}
                  onDone={(name) => {
                    setAddingFolder(false);
                    if (name) createFolder(name);
                  }}
                />
              )}
            </div>
          )}

          {/* ── Shared with me ────────────────────────────────────── */}
          {sharedFolders.length > 0 && (
            <>
              <button
                style={{ ...sectionHeaderStyle, marginTop: "12px" }}
                onClick={() => setSharedOpen((x) => !x)}
              >
                <span>{sharedOpen ? "▼" : "▶"}</span>
                Shared with me
              </button>

              {sharedOpen &&
                Object.entries(sharedByOwner).map(
                  ([ownerId, { ownerName, folders }]) => {
                    const isExpanded = expandedOwners.has(ownerId);
                    return (
                      <div key={ownerId}>
                        <button
                          style={{
                            ...rootItemStyle(false),
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                          onClick={() =>
                            setExpandedOwners((prev) => {
                              const next = new Set(prev);
                              if (next.has(ownerId)) next.delete(ownerId);
                              else next.add(ownerId);
                              return next;
                            })
                          }
                        >
                          <span style={{ fontSize: "10px" }}>
                            {isExpanded ? "▼" : "▶"}
                          </span>
                          👤 {ownerName}
                        </button>
                        {isExpanded &&
                          folders.map((f) => (
                            <div key={f._id} style={{ marginLeft: "16px" }}>
                              <button
                                style={rootItemStyle(
                                  panel.kind === "shared-folder" &&
                                    panel.folderId === f._id,
                                )}
                                onClick={() =>
                                  setPanel({
                                    kind: "shared-folder",
                                    folderId: f._id,
                                    ownerName,
                                  })
                                }
                              >
                                📁 {f.name}
                              </button>
                            </div>
                          ))}
                      </div>
                    );
                  },
                )}
            </>
          )}
        </div>

        {/* ═══ RIGHT PANEL: File List ════════════════════════════════════════ */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {/* Breadcrumb */}
            <h2
              className="font-mono font-bold text-sm"
              style={{ color: "var(--purple)", margin: 0 }}
            >
              {breadcrumb}
            </h2>

            {/* Actions */}
            {isMyPanel && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  style={actionBtnBarStyle}
                  onClick={() => setAddingFolder(true)}
                >
                  + New Folder
                </button>
                <button style={actionBtnBarStyle} onClick={createMdFile}>
                  + New .md File
                </button>
                <button
                  style={{
                    ...actionBtnBarStyle,
                    opacity: uploading ? 0.6 : 1,
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading…" : "↑ Upload File"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                />
              </div>
            )}
          </div>

          {/* File grid */}
          {visibleFiles.length === 0 ? (
            <div
              className="text-sm font-mono"
              style={{
                color: "var(--text-subtle)",
                padding: "40px 0",
                textAlign: "center",
              }}
            >
              {isMyPanel
                ? "No files here yet. Upload one or create a .md file."
                : "No files in this shared folder."}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "12px",
              }}
            >
              {visibleFiles.map((file) => {
                const locked = isFileRefLocked(file);
                // Don't allow the inline rename widget for locked files
                return renamingFileId === file._id && !locked ? (
                  <div
                    key={file._id}
                    style={{
                      border: "1px solid var(--purple)",
                      borderRadius: "8px",
                      padding: "12px",
                      background: "var(--farground)",
                    }}
                  >
                    <RenameInput
                      initialValue={file.name}
                      onDone={(name) => {
                        setRenamingFileId(null);
                        if (name) renameFile(file._id, name);
                      }}
                    />
                  </div>
                ) : (
                  <FileCard
                    key={file._id}
                    file={file}
                    myFolders={myFolders}
                    isOwned={isMyPanel}
                    isLocked={locked}
                    onRename={(f) => setRenamingFileId(f._id)}
                    onDelete={(f) => deleteFile(f._id)}
                    onMove={(f) => setMoveFile(f)}
                    onEditMd={(f) => setEditMdFile(f)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {shareFolder && (
        <ShareModal
          folder={shareFolder}
          onClose={() => setShareFolder(null)}
          onSave={(shared_with) => shareFolder_(shareFolder._id, shared_with)}
        />
      )}

      {moveFile && (
        <MoveModal
          file={moveFile}
          myFolders={myFolders}
          onClose={() => setMoveFile(null)}
          onMove={(folderId) => moveFile_(moveFile._id, folderId)}
        />
      )}

      {editMdFile && (
        <MdEditorModal
          file={editMdFile}
          onClose={() => setEditMdFile(null)}
          onSave={(content) => saveMdFile(editMdFile._id, content)}
        />
      )}
    </AppLayout>
  );
}
