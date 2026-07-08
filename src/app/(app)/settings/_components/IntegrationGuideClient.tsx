"use client";

import Link from "next/link";
import { getIntegrationBySlug, MCP_SERVER_URL } from "@/lib/settings/integrationsData";
import McpSettingsClient from "./McpSettingsClient";

export default function IntegrationGuideClient({ slug }: { slug: string }) {
  const integration = getIntegrationBySlug(slug);

  if (!integration) {
    return (
      <div>
        <p className="text-sm text-slate-500">Integration not found.</p>
        <Link href="/settings/integrations" className="mt-2 inline-block text-sm font-bold text-primary">
          ← Back
        </Link>
      </div>
    );
  }

  if (slug === "mcp") {
    return <McpSettingsClient />;
  }

  return (
    <div>
      <Link href="/settings/integrations" className="mb-4 inline-block text-xs font-bold text-primary">
        ← Integrations
      </Link>
      <h2 className="text-2xl font-black text-slate-900">{integration.name}</h2>
      <p className="mt-1 text-sm text-slate-500">{integration.description}</p>

      <div className="mt-6 space-y-4 text-sm text-slate-700">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-slate-900">1. Create an API key</p>
          <p className="mt-1 text-slate-500">
            Generate a workspace key under{" "}
            <Link href="/settings/api-keys" className="font-bold text-primary hover:underline">
              API Keys
            </Link>
            .
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-slate-900">2. Connect via MCP</p>
          <p className="mt-1 text-slate-500">
            Most automation tools use the Postsiva MCP server. Server URL:
          </p>
          <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 text-xs text-primary">
            {MCP_SERVER_URL}
          </code>
          <Link
            href="/settings/integrations/mcp"
            className="mt-3 inline-block text-xs font-bold text-primary hover:underline"
          >
            Full MCP setup →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="font-bold text-slate-900">3. Authenticate</p>
          <p className="mt-1 text-slate-500">
            Send <code className="text-xs">Authorization: Bearer YOUR_API_KEY</code> or{" "}
            <code className="text-xs">X-API-Key</code> with requests.
          </p>
        </div>
      </div>
    </div>
  );
}
