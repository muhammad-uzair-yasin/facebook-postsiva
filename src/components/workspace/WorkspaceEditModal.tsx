"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Workspace } from "@/lib/hooks/workspace/types";
import { getWorkspaceById } from "@/lib/hooks/workspace/api";
import { userIdsEqual } from "@/lib/userIdsEqual";
import { WorkspaceEditForm } from "./WorkspaceEditForm";

export interface WorkspaceEditModalProps {
  workspace: Workspace;
  userId: string;
  open: boolean;
  deleting?: boolean;
  onClose: () => void;
  onSaved: (workspace: Workspace) => void;
  onDelete?: (workspace: Workspace) => void;
}

export function WorkspaceEditModal({
  workspace,
  userId,
  open,
  deleting = false,
  onClose,
  onSaved,
  onDelete,
}: WorkspaceEditModalProps) {
  const [fetchedOwnerId, setFetchedOwnerId] = useState<string | undefined>();

  useEffect(() => {
    if (!open || !workspace.id) {
      setFetchedOwnerId(undefined);
      return;
    }
    let cancelled = false;
    void getWorkspaceById(workspace.id)
      .then((w) => {
        if (!cancelled) setFetchedOwnerId(w.owner_id);
      })
      .catch(() => {
        if (!cancelled) setFetchedOwnerId(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [open, workspace.id]);

  const ownerId = fetchedOwnerId ?? workspace.owner_id;
  const isOwner = Boolean(userId && ownerId && userIdsEqual(userId, ownerId));

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="workspace-edit-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-edit-title"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-5">
              <div className="min-w-0 pr-4">
                <h2
                  id="workspace-edit-title"
                  className="text-xl font-bold tracking-tight text-slate-900"
                >
                  Edit workspace settings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {workspace.name
                    ? `Editing “${workspace.name}”. Update identity and access.`
                    : "Update your workspace identity."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <WorkspaceEditForm
              key={workspace.id}
              workspace={workspace}
              isOwner={isOwner}
              deleting={deleting}
              onSaved={onSaved}
              onCancel={onClose}
              onDelete={isOwner ? onDelete : undefined}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
