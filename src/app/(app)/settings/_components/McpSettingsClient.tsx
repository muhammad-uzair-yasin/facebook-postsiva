"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MCP_SERVER_URL } from "@/lib/settings/integrationsData";
import { Copy } from "lucide-react";

export default function McpSettingsClient() {
  const [copied, setCopied] = useState(false);
  const configSnippet = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            postsiva: {
              url: MCP_SERVER_URL,
              headers: { "X-API-Key": "<your workspace API key>" },
            },
          },
        },
        null,
        2,
      ),
    [],
  );

  return (
    <div>
      <Link href="/settings/integrations" className="mb-4 inline-block text-xs font-bold text-primary">
        ← Integrations
      </Link>
      <h2 className="text-2xl font-black text-slate-900">MCP</h2>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        Connect MCP-compatible clients (Claude, Cursor, n8n, Zapier) to Postsiva.
      </p>

      <p className="mb-2 text-sm font-bold text-slate-900">Server URL</p>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <code className="break-all text-xs text-primary">{MCP_SERVER_URL}</code>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3 rounded-lg"
        onClick={() => {
          void navigator.clipboard.writeText(MCP_SERVER_URL);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        <Copy className="mr-1 h-3.5 w-3.5" />
        {copied ? "Copied" : "Copy URL"}
      </Button>

      <p className="mb-2 mt-8 text-sm font-bold text-slate-900">Example client config</p>
      <pre className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-900 p-4 text-xs text-slate-100">
        {configSnippet}
      </pre>
      <p className="mt-3 text-sm text-slate-500">
        Create a key under{" "}
        <Link href="/settings/api-keys" className="font-bold text-primary hover:underline">
          API Keys
        </Link>{" "}
        and replace the placeholder.
      </p>
    </div>
  );
}
