"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Clock, CheckCircle2 } from "lucide-react";

const tabs = [
  { href: "/posts/published", label: "Published", icon: CheckCircle2 },
  { href: "/posts/scheduled", label: "Scheduled", icon: Clock },
  { href: "/posts/drafts", label: "Drafts", icon: FileText },
];

export function PostsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors",
              active
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
