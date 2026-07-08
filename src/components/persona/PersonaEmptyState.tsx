"use client";

import { Loader2, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PersonaEmptyStateProps {
  postsLimit: number;
  onPostsLimitChange: (n: number) => void;
  onBuildWithAi: () => void;
  onWriteYourself: () => void;
  loading?: boolean;
}

export function PersonaEmptyState({
  postsLimit,
  onPostsLimitChange,
  onBuildWithAi,
  onWriteYourself,
  loading,
}: PersonaEmptyStateProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Let AI write your persona</h3>
        <p className="mt-2 text-sm text-slate-500">
          Analyzes your recent Facebook posts (minimum 3 with content) and builds audience, style,
          topics, and patterns automatically.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <label className="text-sm font-bold text-slate-700">Posts to analyze</label>
          <input
            type="number"
            min={1}
            max={50}
            value={postsLimit}
            onChange={(e) => onPostsLimitChange(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold focus:border-primary focus:outline-none"
          />
        </div>
        <Button
          type="button"
          className="mt-5 w-full rounded-xl"
          disabled={loading}
          onClick={onBuildWithAi}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate with AI"}
        </Button>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
          <PenLine className="h-6 w-6 text-slate-700" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Write it yourself</h3>
        <p className="mt-2 text-sm text-slate-500">
          Start from a default template with suggested values. Edit every field, pick from chips,
          and save when ready — no posts required.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5 w-full rounded-xl bg-white"
          disabled={loading}
          onClick={onWriteYourself}
        >
          Create manual persona
        </Button>
      </div>
    </div>
  );
}
