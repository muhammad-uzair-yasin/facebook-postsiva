"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/hooks/auth/AuthContext";
import { useWorkspaceContext } from "@/lib/hooks/workspace/WorkspaceContext";
import type { Workspace } from "@/lib/hooks/workspace/types";
import { createWorkspace, deleteWorkspace } from "@/lib/hooks/workspace/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/sections/navbar";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { WorkspaceEditModal } from "@/components/workspace/WorkspaceEditModal";
import { Loader2, Plus } from "lucide-react";

export default function SelectWorkspacePage() {
  const router = useRouter();
  const { user, isHydrated, logout, checkFacebookToken, setFacebookTokenFromWorkspace } =
    useAuthContext();
  const {
    workspaces,
    currentWorkspace,
    isLoading,
    error,
    setCurrentWorkspace,
    refreshWorkspaces,
  } = useWorkspaceContext();
  const [selectingWorkspace, setSelectingWorkspace] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [isHydrated, user, router]);

  const enterWorkspace = async (workspace: Workspace) => {
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

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const name = newName.trim();
    if (!name) {
      setCreateError("Enter a workspace name.");
      return;
    }
    setCreating(true);
    try {
      const workspace = await createWorkspace({
        name,
        source_product: "facebook",
      });
      await refreshWorkspaces(true);
      setShowCreate(false);
      setNewName("");
      await enterWorkspace(workspace);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create workspace.");
      setCreating(false);
    }
  };

  const openEdit = (workspace: Workspace) => {
    setActionError(null);
    setShowCreate(false);
    setEditingWorkspace(workspace);
  };

  const handleEditSaved = async (updated: Workspace) => {
    setEditingWorkspace(null);
    await refreshWorkspaces(true);
    if (currentWorkspace?.id === updated.id) {
      setCurrentWorkspace({ ...currentWorkspace, ...updated });
    }
  };

  const handleDeleteWorkspace = async (workspace: Workspace) => {
    setActionError(null);
    const ok = window.confirm(
      `Delete workspace "${workspace.name}"? This cannot be undone.`,
    );
    if (!ok) return;
    setDeletingId(workspace.id);
    try {
      await deleteWorkspace(workspace.id);
      if (currentWorkspace?.id === workspace.id) {
        setCurrentWorkspace(null);
      }
      if (editingWorkspace?.id === workspace.id) {
        setEditingWorkspace(null);
      }
      await refreshWorkspaces(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete workspace.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F5F7FA] pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20 -z-10" />
        <div className="mx-auto max-w-6xl">
          <header className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Select your <span className="text-primary">workspace</span>
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-600">
              You are logged in as{" "}
              <span className="font-semibold text-slate-900">{user.email}</span>.
            </p>
          </header>

          {error && (
            <div
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
          {actionError && (
            <div
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {actionError}
            </div>
          )}

          <div className="mb-8 flex justify-center">
            {!showCreate ? (
              <Button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setShowCreate(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create workspace
              </Button>
            ) : (
              <form
                onSubmit={handleCreateWorkspace}
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
              >
                <h2 className="text-lg font-bold text-slate-900">New workspace</h2>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. My Facebook Page"
                  disabled={creating}
                  autoFocus
                />
                {createError && (
                  <p className="text-sm text-red-600" role="alert">
                    {createError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={creating}
                    onClick={() => {
                      setShowCreate(false);
                      setNewName("");
                      setCreateError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                memberCount={workspace.member_count ?? 0}
                onSelect={enterWorkspace}
                selecting={selectingWorkspace === workspace.id}
                onEdit={openEdit}
                deleting={deletingId === workspace.id}
              />
            ))}
          </div>

          {editingWorkspace ? (
            <WorkspaceEditModal
              workspace={editingWorkspace}
              userId={user.id}
              open
              deleting={deletingId === editingWorkspace.id}
              onClose={() => setEditingWorkspace(null)}
              onSaved={handleEditSaved}
              onDelete={handleDeleteWorkspace}
            />
          ) : null}

          {!isLoading && workspaces.length === 0 && !error && !showCreate && (
            <p className="mt-10 text-center text-slate-600">
              No workspaces yet. Create one to get started.
            </p>
          )}

          <div className="mt-14 flex justify-center sm:hidden">
            <Button
              variant="ghost"
              className="rounded-xl text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => logout()}
            >
              Log out
            </Button>
          </div>
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
