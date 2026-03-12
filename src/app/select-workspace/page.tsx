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
      <div className="min-h-screen bg-[#F5F7FA] pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20 -z-10" />
        <div className="mx-auto max-w-6xl">
          <header className="mb-14 text-center">
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-14 flex justify-center">
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
