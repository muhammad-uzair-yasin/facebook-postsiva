"use client";

import type { DetectedLead, WatcherRun } from "@/lib/hooks/aiWatcher/api";

export function WatcherLeadsPanel({
  leads,
}: {
  leads?: DetectedLead[];
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
      <h4 className="text-xs font-black uppercase tracking-wide text-slate-500">Detected leads</h4>
      {!leads ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="text-xs text-slate-500">No leads yet.</p>
      ) : (
        leads.map((lead) => (
          <div key={lead.id} className="rounded-xl border border-slate-100 bg-white p-3 text-sm">
            <p className="font-bold text-slate-800">{lead.comment_author || "Anonymous"}</p>
            <p className="text-slate-600">{lead.comment_text}</p>
            {lead.ai_reply_text ? (
              <p className="mt-2 text-xs text-primary">AI: {lead.ai_reply_text}</p>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

export function WatcherRunsPanel({ runs }: { runs?: WatcherRun[] }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
      <h4 className="text-xs font-black uppercase tracking-wide text-slate-500">Previous runs</h4>
      {!runs ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : runs.length === 0 ? (
        <p className="text-xs text-slate-500">No runs yet.</p>
      ) : (
        runs.map((run) => (
          <div key={run.id} className="rounded-xl border border-slate-100 bg-white p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                {run.ran_at ? new Date(run.ran_at).toLocaleString() : "—"}
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {run.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {run.comments_fetched} fetched · {run.leads_detected} leads · {run.comments_replied}{" "}
              replied
              {run.errors > 0 ? ` · ${run.errors} errors` : ""}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
