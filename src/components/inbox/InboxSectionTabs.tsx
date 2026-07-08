"use client";

import { cn } from "@/lib/utils";

export type InboxSection = "all" | "unreplied" | "replied";

interface InboxSectionTabsProps {
  section: InboxSection;
  onChange: (s: InboxSection) => void;
  allCount: number;
  unrepliedCount: number;
  repliedCount: number;
}

export function InboxSectionTabs({
  section,
  onChange,
  allCount,
  unrepliedCount,
  repliedCount,
}: InboxSectionTabsProps) {
  const tabs: { id: InboxSection; label: string; count: number }[] = [
    { id: "all", label: "All", count: allCount },
    { id: "unreplied", label: "Unreplied", count: unrepliedCount },
    { id: "replied", label: "Replied", count: repliedCount },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            section === t.id
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          )}
        >
          {t.label}
          <span className="ml-1 opacity-70">({t.count})</span>
        </button>
      ))}
    </div>
  );
}
