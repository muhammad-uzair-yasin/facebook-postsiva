"use client";

import type { FacebookPage } from "@/lib/hooks/facebookoauth/types";

interface PageHeaderProps {
  page: FacebookPage | { page_id: string; page_name: string };
  postCount: number;
}

export function PageHeader({ page, postCount }: PageHeaderProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">{page.page_name}</h2>
          <p className="text-sm text-slate-500 font-bold">
            {postCount} {postCount === 1 ? 'post' : 'posts'}
          </p>
        </div>
        {/* {page.page_id && page.page_id !== 'unknown' && (
          <div className="px-4 py-2 bg-primary/10 rounded-xl">
            <p className="text-xs font-black text-primary uppercase tracking-wider">Page ID: {page.page_id}</p>
          </div>
        )} */}
      </div>
    </div>
  );
}
