"use client";

import { useRef, useState } from "react";
import type { Workspace } from "@/lib/hooks/workspace/types";
import {
  updateWorkspace,
  uploadWorkspaceImage,
} from "@/lib/hooks/workspace/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ImagePlus, X, Trash2 } from "lucide-react";

function slugifyPreview(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export interface WorkspaceEditFormProps {
  workspace: Workspace;
  isOwner: boolean;
  deleting?: boolean;
  onSaved: (workspace: Workspace) => void;
  onCancel: () => void;
  onDelete?: (workspace: Workspace) => void;
}

export function WorkspaceEditForm({
  workspace,
  isOwner,
  deleting = false,
  onSaved,
  onCancel,
  onDelete,
}: WorkspaceEditFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [description, setDescription] = useState(workspace.description ?? "");
  const [imageUrl, setImageUrl] = useState(workspace.image_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const busy = saving || uploading || deleting;

  const handleImagePick = async (file: File | null) => {
    if (!file || !isOwner) return;
    setError(null);
    setUploading(true);
    try {
      const updated = await uploadWorkspaceImage(workspace.id, file);
      setImageUrl(updated.image_url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!isOwner) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await updateWorkspace(workspace.id, { image_url: null });
      setImageUrl(updated.image_url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove image.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setError(null);
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim() || slugifyPreview(trimmedName);
    if (!trimmedName) {
      setError("Enter a workspace name.");
      return;
    }
    if (!trimmedSlug) {
      setError("Enter a slug.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateWorkspace(workspace.id, {
        name: trimmedName,
        slug: trimmedSlug,
        description: description.trim() === "" ? null : description.trim(),
      });
      onSaved({
        ...workspace,
        ...updated,
        image_url: updated.image_url ?? imageUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save workspace.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {!isOwner ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You can view this workspace. Only the owner can change settings or delete it.
          </p>
        ) : null}

        <div className="flex items-start gap-5">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImagePlus className="h-7 w-7" />
              </div>
            )}
          </div>
          {isOwner ? (
            <div className="flex flex-1 flex-wrap gap-2 pt-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => void handleImagePick(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload image"}
              </Button>
              {imageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void handleRemoveImage()}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Workspace name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy || !isOwner}
              readOnly={!isOwner}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Slug
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={busy || !isOwner}
              readOnly={!isOwner}
              placeholder="my-workspace"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy || !isOwner}
              readOnly={!isOwner}
              rows={3}
              placeholder="Optional"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 read-only:opacity-80"
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isOwner && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onDelete(workspace)}
              className="justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete workspace
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !isOwner}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
