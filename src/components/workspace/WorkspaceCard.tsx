"use client";

import { Facebook, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Workspace } from "@/lib/hooks/workspace/types";
import { cn } from "@/lib/utils";

export interface WorkspaceCardProps {
  workspace: Workspace;
  memberCount: number;
  onSelect: (workspace: Workspace) => void;
  selecting: boolean;
}

export function WorkspaceCard({
  workspace,
  memberCount,
  onSelect,
  selecting,
}: WorkspaceCardProps) {
  const connected = workspace.facebook_connected === true;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:border-slate-300",
        "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      )}
    >
      <div className="h-24 shrink-0 bg-gradient-to-br from-slate-100 via-white to-primary/5" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-slate-900">
              {workspace.name}
            </h3>
            {workspace.slug ? (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {workspace.slug}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          {connected && workspace.facebook_profile?.profile_picture_url ? (
            <img
              src={workspace.facebook_profile.profile_picture_url}
              alt={workspace.facebook_profile.name ?? "Facebook profile"}
              className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover bg-white"
              width={40}
              height={40}
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-primary">
              <Facebook className="h-5 w-5" aria-hidden />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              {connected
                ? workspace.facebook_profile?.name ?? "Facebook connected"
                : "Not connected"}
            </p>
            <p className="text-xs text-slate-500">
              {connected ? "Connect to manage pages" : "Connect Facebook"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        <div className="mt-5">
          <Button
            type="button"
            size="default"
            className="w-full min-w-[120px] transition-colors duration-200"
            onClick={() => onSelect(workspace)}
            disabled={selecting}
          >
            {selecting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              "Enter workspace"
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
