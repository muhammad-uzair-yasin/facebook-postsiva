"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsMcpRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/integrations/mcp");
  }, [router]);
  return <p className="text-sm text-slate-500">Redirecting to MCP…</p>;
}
