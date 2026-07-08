"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createWorkspaceApiKey,
  listWorkspaceApiKeys,
  revokeWorkspaceApiKey,
  type WorkspaceAPIKeyListItem,
} from "@/lib/settings/workspaceApiKeysApi";
import { Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";

export default function ApiKeysSettingsClient() {
  const [keys, setKeys] = useState<WorkspaceAPIKeyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setKeys(await listWorkspaceApiKeys());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await createWorkspaceApiKey(nameDraft.trim() || null);
      setRevealedSecret(created.secret);
      setCreateOpen(false);
      setNameDraft("");
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    setBusy(true);
    try {
      await revokeWorkspaceApiKey(id);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete key");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900">API Keys</h2>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        Workspace-scoped keys for API, MCP, Zapier, and messaging verification. The full secret is
        shown only once when you create a key.
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : null}

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {revealedSecret ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">Copy your key now — it won’t be shown again</p>
          <code className="mt-2 block break-all rounded-xl bg-white px-3 py-2 text-xs text-slate-800">
            {revealedSecret}
          </code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 rounded-lg"
            onClick={() => {
              void navigator.clipboard.writeText(revealedSecret);
            }}
          >
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-2 mt-3 rounded-lg"
            onClick={() => setRevealedSecret(null)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      {!loading && keys.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">No keys yet. Generate one to get started.</p>
      ) : null}

      <ul className="mb-4 space-y-2">
        {keys.map((k) => (
          <li
            key={k.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <KeyRound className="h-4 w-4 text-primary" />
                {k.name || "Unnamed key"}
              </p>
              <p className="mt-0.5 font-mono text-xs text-slate-500">
                {k.key_prefix}… · {new Date(k.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg text-red-600"
              disabled={busy}
              onClick={() => void handleRevoke(k.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      {createOpen ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <label className="mb-1 block text-xs font-bold text-slate-500">Key name (optional)</label>
          <Input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Zapier production"
            className="mb-3 rounded-xl"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" disabled={busy} onClick={() => void handleCreate()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create key"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          className="rounded-xl"
          disabled={busy || loading}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Generate API key
        </Button>
      )}
    </div>
  );
}
