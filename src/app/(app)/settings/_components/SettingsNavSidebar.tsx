"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SETTINGS_NAV_GROUPS,
  isSettingsNavActive,
} from "../_data/settingsNav";

export function SettingsNavSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5"
      aria-label="Settings sections"
    >
      <div className="flex flex-col gap-7">
        {SETTINGS_NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1.5">
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {group.title}
            </p>
            <ul className="space-y-0.5" role="list">
              {group.items.map((item) => {
                const active = isSettingsNavActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary/10 font-bold text-primary shadow-sm ring-1 ring-primary/20"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
