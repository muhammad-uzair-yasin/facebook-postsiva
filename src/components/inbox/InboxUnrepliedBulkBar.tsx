"use client";

interface InboxUnrepliedBulkBarProps {
  targetCount: number;
  readyCount: number;
  busy: boolean;
  generating: boolean;
  posting: boolean;
  onGenerateAll: () => void;
  onPostAll: () => void;
}

export function InboxUnrepliedBulkBar({
  targetCount,
  readyCount,
  busy,
  generating,
  posting,
  onGenerateAll,
  onPostAll,
}: InboxUnrepliedBulkBarProps) {
  if (targetCount === 0) return null;

  return (
    <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-primary/5 via-white to-slate-50 px-4 py-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">
        Bulk replies
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        {targetCount} unreplied comment{targetCount === 1 ? "" : "s"}. Generate fills drafts; edit
        then post all.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onGenerateAll}
          className="rounded-xl bg-primary/15 px-3 py-2 text-xs font-bold text-primary disabled:opacity-40"
        >
          {generating ? "Generating…" : `Generate for all (${targetCount})`}
        </button>
        <button
          type="button"
          disabled={busy || readyCount === 0}
          onClick={onPostAll}
          className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
        >
          {posting ? "Posting…" : `Post all (${readyCount})`}
        </button>
      </div>
    </div>
  );
}
