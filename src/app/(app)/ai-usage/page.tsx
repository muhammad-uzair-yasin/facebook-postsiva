"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AiUsageRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/ai-usage");
  }, [router]);
  return <p className="p-8 text-sm text-slate-500">Redirecting…</p>;
}
