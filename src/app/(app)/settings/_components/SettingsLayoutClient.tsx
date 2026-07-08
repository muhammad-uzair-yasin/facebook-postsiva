"use client";

import type { ReactNode } from "react";
import { SettingsNavSidebar } from "./SettingsNavSidebar";

export function SettingsLayoutClient({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 md:p-10 xl:p-12 2xl:p-16 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900">Settings</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Account, persona, messaging, and integrations
        </p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="w-full shrink-0 lg:w-[220px] xl:w-56">
          <div className="lg:sticky lg:top-6">
            <SettingsNavSidebar />
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="rounded-2xl border border-slate-100 bg-white/60 p-4 shadow-sm sm:p-5 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
