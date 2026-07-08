"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Edit3,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useFacebookDrafts } from "@/lib/hooks/facebook/drafts/useFacebookDrafts";
import { useSelectedPage } from "@/lib/hooks/facebook/selectedPage/SelectedPageContext";
import type { FacebookDraft } from "@/lib/hooks/facebook/drafts/types";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DraftsPostsPage() {
  const router = useRouter();
  const { selectedPage } = useSelectedPage();
  const pageId = selectedPage?.page_id ?? "";
  const { drafts, loading, error, load, patch, remove, save } = useFacebookDrafts();
  const [editing, setEditing] = useState<FacebookDraft | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    if (!pageId) return;
    void load(pageId).catch(() => undefined);
  }, [pageId, load]);

  const handleSaveNew = async () => {
    if (!pageId) return;
    await save({ page_id: pageId, content: newContent });
    setShowNew(false);
    setNewContent("");
  };

  const handleUpdate = async () => {
    if (!editing) return;
    await patch(editing.id, { content: editContent }, pageId);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Drafts</h2>
          <p className="text-sm font-medium text-slate-500">
            Saved posts for {selectedPage?.page_name ?? "selected page"} — edit or publish later
          </p>
        </div>
        <Button
          type="button"
          className="rounded-xl"
          disabled={!pageId || loading}
          onClick={() => setShowNew(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New draft
        </Button>
      </div>

      {!pageId ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5" />
          Select a Facebook page from the header to manage drafts.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {showNew ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900">New draft</h3>
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your post draft…"
            className="mb-4 min-h-[120px]"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" disabled={loading} onClick={() => void handleSaveNew()}>
              Save draft
            </Button>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <h3 className="mb-3 font-bold text-slate-900">Edit draft #{editing.id}</h3>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="mb-4 min-h-[120px]"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" disabled={loading} onClick={() => void handleUpdate()}>
              Save changes
            </Button>
          </div>
        </div>
      ) : null}

      {loading && drafts.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : drafts.length === 0 && pageId ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-bold text-slate-600">No drafts yet</p>
          <p className="mt-1 text-sm text-slate-400">Save a draft from Create Post or add one here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <motion.div
              key={draft.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {draft.source_type ?? "manual"} · {formatDate(draft.updated_at ?? draft.created_at)}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => {
                      setEditing(draft);
                      setEditContent(draft.content ?? "");
                    }}
                  >
                    <Edit3 className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => router.push(`/create?draftId=${draft.id}`)}
                  >
                    Open in composer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-red-600"
                    onClick={() => {
                      if (confirm("Delete this draft?")) void remove(draft.id, pageId);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-700">
                {draft.content || "(empty draft)"}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
