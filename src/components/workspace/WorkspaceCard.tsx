"use client";

import { Facebook, Users, Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Workspace } from "@/lib/hooks/workspace/types";
import { cn } from "@/lib/utils";

export interface WorkspaceCardProps {
  workspace: Workspace;
  memberCount: number;
  onSelect: (workspace: Workspace) => void;
  selecting: boolean;
  onEdit?: (workspace: Workspace) => void;
  deleting?: boolean;
}

function getFacebookConnectionDisplay(workspace: Workspace): {
  title: string;
  subtitle: string;
  avatarUrl: string | null;
} {
  if (!workspace.facebook_connected) {
    return {
      title: "Not connected",
      subtitle: "Connect Facebook to get started",
      avatarUrl: null,
    };
  }

  const profile = workspace.facebook_profile;
  const pages = workspace.facebook_pages ?? [];
  const profileName =
    profile?.name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    null;
  const pageNames = pages.map((p) => p.name?.trim()).filter(Boolean) as string[];

  if (pageNames.length === 1) {
    return {
      title: pageNames[0],
      subtitle: profileName ? `Facebook account · ${profileName}` : "Facebook page connected",
      avatarUrl: profile?.profile_picture_url ?? null,
    };
  }

  if (pageNames.length > 1) {
    const preview = pageNames.slice(0, 2).join(", ");
    const suffix = pageNames.length > 2 ? "…" : "";
    return {
      title: profileName || "Facebook connected",
      subtitle: `${pageNames.length} pages · ${preview}${suffix}`,
      avatarUrl: profile?.profile_picture_url ?? null,
    };
  }

  return {
    title: profileName || "Facebook connected",
    subtitle: profile?.email?.trim() || "Facebook account connected",
    avatarUrl: profile?.profile_picture_url ?? null,
  };
}

export function WorkspaceCard({
  workspace,
  memberCount,
  onSelect,
  selecting,
  onEdit,
  deleting = false,
}: WorkspaceCardProps) {
  const busy = selecting || deleting;
  const fb = getFacebookConnectionDisplay(workspace);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:border-slate-300",
      )}
    >
      <div className="relative h-28 shrink-0 overflow-hidden border-b border-slate-100 bg-slate-50">
        {workspace.image_url ? (
          <div className="flex h-full w-full items-center justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={workspace.image_url}
              alt=""
              className="block max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-100 via-white to-primary/5" />
        )}
      </div>

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
            ) : (
              <p className="mt-0.5 text-xs text-transparent select-none" aria-hidden>
                —
              </p>
            )}
          </div>
          {onEdit ? (
            <button
              type="button"
              aria-label={`Edit ${workspace.name}`}
              disabled={busy}
              onClick={() => onEdit(workspace)}
              className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs text-slate-500">
          {workspace.description?.trim() || "\u00a0"}
        </p>

        <div className="mt-4 flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          {fb.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fb.avatarUrl}
              alt=""
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
            <p className="truncate text-sm font-semibold text-slate-900">{fb.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{fb.subtitle}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
          <Users className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        <div className="mt-auto pt-5">
          <Button
            type="button"
            size="default"
            className="w-full min-w-[120px] transition-colors duration-200"
            onClick={() => onSelect(workspace)}
            disabled={busy}
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
