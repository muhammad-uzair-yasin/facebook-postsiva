"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/hooks/auth/AuthContext";
import { useWorkspaceContext } from "@/lib/hooks/workspace/WorkspaceContext";
import type { Workspace } from "@/lib/hooks/workspace/types";
import {
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from "@/lib/hooks/workspace/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Users,
  Facebook,
  CheckCircle2,
  Building2,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Reusable Modal backdrop + card
──────────────────────────────────────────────────────────── */
function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Create Workspace Popup
──────────────────────────────────────────────────────────── */
function CreateWorkspaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (ws: Workspace) => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const ws = await createWorkspace({ name: name.trim() });
      onCreated(ws);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Create workspace</h2>
          <p className="text-sm text-slate-500">Set up a new workspace</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Workspace name <span className="text-red-500">*</span>
          </label>
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Brand"
            className="rounded-xl border-slate-200"
            disabled={loading}
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl border-slate-200"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-xl gap-2"
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {loading ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────
   Edit Workspace Popup
──────────────────────────────────────────────────────────── */
function EditWorkspaceModal({
  workspace,
  onClose,
  onUpdated,
}: {
  workspace: Workspace;
  onClose: () => void;
  onUpdated: (ws: Workspace) => void;
}) {
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug ?? "");
  const [description, setDescription] = useState(workspace.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updated = await updateWorkspace(workspace.id, {
        name: name.trim() || workspace.name,
        slug: slug.trim() || null,
        description: description.trim() || null,
      });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Pencil className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Edit workspace</h2>
          <p className="text-sm text-slate-500 truncate max-w-[220px]">{workspace.name}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workspace name"
            className="rounded-xl border-slate-200"
            disabled={loading}
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Slug
          </label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-workspace"
            className="rounded-xl border-slate-200 font-mono text-sm"
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this workspace for?"
            rows={3}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-60"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl border-slate-200"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1 rounded-xl gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────
   Delete Confirmation Popup
──────────────────────────────────────────────────────────── */
function DeleteWorkspaceModal({
  workspace,
  onClose,
  onDeleted,
}: {
  workspace: Workspace;
  onClose: () => void;
  onDeleted: (workspaceId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteWorkspace(workspace.id);
      onDeleted(workspace.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workspace");
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Delete workspace</h2>
          <p className="text-sm text-slate-500">This action cannot be undone</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm text-slate-600 mb-6">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-slate-900">{workspace.name}</span>? All data
        associated with this workspace will be permanently removed.
      </p>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl border-slate-200"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="flex-1 rounded-xl gap-2"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {loading ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────
   Workspace Card
──────────────────────────────────────────────────────────── */
function WorkspaceCard({
  workspace,
  isCurrent,
  selecting,
  onSelect,
  onEdit,
  onDelete,
}: {
  workspace: Workspace;
  isCurrent: boolean;
  selecting: boolean;
  onSelect: (ws: Workspace) => void;
  onEdit: (ws: Workspace) => void;
  onDelete: (ws: Workspace) => void;
}) {
  const connected = workspace.facebook_connected === true;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 border-slate-200">
      {/* Top bar */}
      <div className="h-20 shrink-0 bg-gradient-to-br from-slate-100 via-white to-primary/5" />

      {/* Current badge */}
      {isCurrent && (
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Current
        </div>
      )}

      {/* Edit / Delete buttons — top-right */}
      <div className="absolute top-3 right-3 flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(workspace); }}
          className="p-1.5 rounded-lg bg-white/80 border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 transition-colors shadow-sm"
          title="Edit workspace"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(workspace); }}
          className="p-1.5 rounded-lg bg-white/80 border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
          title="Delete workspace"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-slate-900">{workspace.name}</h3>
          {workspace.slug && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{workspace.slug}</p>
          )}
          {workspace.description && (
            <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{workspace.description}</p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          {connected && workspace.facebook_profile?.profile_picture_url ? (
            <img
              src={workspace.facebook_profile.profile_picture_url}
              alt={workspace.facebook_profile.name ?? "Facebook profile"}
              className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover bg-white"
              width={36}
              height={36}
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-primary">
              <Facebook className="h-4 w-4" aria-hidden />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">
              {connected ? (workspace.facebook_profile?.name ?? "Facebook connected") : "Not connected"}
            </p>
            <p className="text-xs text-slate-500">
              {connected ? "Facebook connected" : "Connect Facebook"}
            </p>
          </div>
        </div>

        {(workspace.member_count ?? 0) > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              {workspace.member_count} {workspace.member_count === 1 ? "member" : "members"}
            </span>
          </div>
        )}

        <div className="mt-5">
          <Button
            type="button"
            size="default"
            variant={isCurrent ? "outline" : "default"}
            className="w-full min-w-[120px] transition-colors duration-200 rounded-xl"
            onClick={() => onSelect(workspace)}
            disabled={selecting}
          >
            {selecting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : isCurrent ? (
              "Switch to this"
            ) : (
              "Enter workspace"
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

/* ────────────────────────────────────────────────────────────
   Main Page
──────────────────────────────────────────────────────────── */
export default function SelectWorkspacePage() {
  const router = useRouter();
  const { user, isHydrated, logout, checkFacebookToken, setFacebookTokenFromWorkspace } =
    useAuthContext();
  const { workspaces, isLoading, error, currentWorkspace, setCurrentWorkspace, refreshWorkspaces } =
    useWorkspaceContext();

  const [selectingWorkspace, setSelectingWorkspace] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const [localWorkspaces, setLocalWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    setLocalWorkspaces(workspaces);
  }, [workspaces]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  const handleSelectWorkspace = async (workspace: Workspace) => {
    setSelectingWorkspace(workspace.id);
    try {
      setCurrentWorkspace(workspace);
      if (workspace.facebook_connected !== undefined) {
        setFacebookTokenFromWorkspace(workspace.facebook_connected);
        router.push(workspace.facebook_connected ? "/profile" : "/facebook-connect");
      } else {
        const hasToken = await checkFacebookToken(true);
        router.push(hasToken ? "/profile" : "/facebook-connect");
      }
    } catch {
      setSelectingWorkspace(null);
    }
  };

  const handleCreated = (ws: Workspace) => {
    setLocalWorkspaces((prev) => [ws, ...prev]);
    setShowCreate(false);
    refreshWorkspaces(true);
  };

  const handleUpdated = (ws: Workspace) => {
    setLocalWorkspaces((prev) => prev.map((w) => (w.id === ws.id ? ws : w)));
    setEditingWorkspace(null);
    refreshWorkspaces(true);
  };

  const handleDeleted = (workspaceId: string) => {
    setLocalWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
    setDeletingWorkspace(null);
    refreshWorkspaces(true);
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Loading workspaces…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {/* Modals */}
      {showCreate && (
        <CreateWorkspaceModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {editingWorkspace && (
        <EditWorkspaceModal
          workspace={editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
          onUpdated={handleUpdated}
        />
      )}
      {deletingWorkspace && (
        <DeleteWorkspaceModal
          workspace={deletingWorkspace}
          onClose={() => setDeletingWorkspace(null)}
          onDeleted={handleDeleted}
        />
      )}

      <div className="min-h-screen bg-[#F5F7FA] pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20 -z-10" />

        <div className="mx-auto max-w-6xl pt-16">
          {/* Header */}
          <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              {/* Brand */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">
                  P
                </div>
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  Post<span className="text-primary">siva</span>
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                Your <span className="text-primary">workspaces</span>
              </h1>
              <p className="mt-2 text-sm md:text-base text-slate-600">
                Logged in as{" "}
                <span className="font-semibold text-slate-900">{user.email}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                className="rounded-xl gap-2 shadow-sm"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="w-4 h-4" />
                New workspace
              </Button>
              <Button
                variant="ghost"
                className="rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => logout()}
              >
                Log out
              </Button>
            </div>
          </header>

          {error && (
            <div
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Workspace grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {localWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                isCurrent={currentWorkspace?.id === workspace.id}
                selecting={selectingWorkspace === workspace.id}
                onSelect={handleSelectWorkspace}
                onEdit={setEditingWorkspace}
                onDelete={setDeletingWorkspace}
              />
            ))}

            {/* Create card (shortcut) */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 hover:border-primary hover:bg-primary/5 transition-all duration-200 min-h-[200px] group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-semibold text-slate-500 group-hover:text-primary transition-colors">
                Create workspace
              </span>
            </button>
          </div>

          {!isLoading && localWorkspaces.length === 0 && !error && (
            <p className="mt-10 text-center text-slate-600">
              No workspaces yet. Click &ldquo;New workspace&rdquo; to get started.
            </p>
          )}
        </div>

        <style jsx global>{`
          .grid-bg {
            background-image: radial-gradient(#e5e7eb 0.5px, transparent 0.5px);
            background-size: 28px 28px;
          }
        `}</style>
      </div>
    </>
  );
}
