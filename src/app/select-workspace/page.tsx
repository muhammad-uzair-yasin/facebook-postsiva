"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/hooks/auth/AuthContext";
import { useWorkspaceContext } from "@/lib/hooks/workspace/WorkspaceContext";
import type { Workspace } from "@/lib/hooks/workspace/types";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/sections/navbar";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";

export default function SelectWorkspacePage() {
  const router = useRouter();
  const { user, isHydrated, logout, checkFacebookToken, setFacebookTokenFromWorkspace } = useAuthContext();
  const {
    workspaces,
    isLoading,
    error,
    setCurrentWorkspace,
    refreshWorkspaces,
  } = useWorkspaceContext();
  const [selectingWorkspace, setSelectingWorkspace] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
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
      <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Select your workspace
            </h1>
            <p className="mt-2 text-base text-slate-600 sm:text-lg">
              You are logged in as{" "}
              <span className="font-medium text-slate-900">{user.email}</span>.
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                memberCount={workspace.member_count ?? 0}
                onSelect={handleSelectWorkspace}
                selecting={selectingWorkspace === workspace.id}
              />
            ))}
          </div>

          {!isLoading && workspaces.length === 0 && !error && (
            <p className="mt-10 text-center text-slate-600">
              No workspaces yet. Create one from your account to get started.
            </p>
          )}

          <div className="mt-12 flex justify-center">
            <Button
              variant="ghost"
              className="rounded-xl text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => logout()}
            >
              Log out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
