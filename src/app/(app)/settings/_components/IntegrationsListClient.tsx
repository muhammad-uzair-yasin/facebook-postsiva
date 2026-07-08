"use client";

import Link from "next/link";
import {
  INTEGRATIONS,
  SETTINGS_MESSAGING_INTEGRATIONS,
} from "@/lib/settings/integrationsData";

function Row({
  href,
  name,
  description,
}: {
  href: string;
  name: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 transition hover:border-primary/30 hover:bg-white"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900">{name}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      <span className="shrink-0 text-slate-400">›</span>
    </Link>
  );
}

export default function IntegrationsListClient() {
  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900">Integrations</h2>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        Connect Postsiva to messaging, automation tools, AI assistants, and MCP clients.
      </p>

      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        Messaging
      </h3>
      <ul className="mb-8 flex flex-col gap-2">
        {SETTINGS_MESSAGING_INTEGRATIONS.map((m) => (
          <li key={m.href}>
            <Row href={m.href} name={m.name} description={m.description} />
          </li>
        ))}
      </ul>

      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        Automation &amp; AI
      </h3>
      <ul className="flex flex-col gap-2">
        {INTEGRATIONS.map((i) => (
          <li key={i.slug}>
            <Row
              href={`/settings/integrations/${i.slug}`}
              name={i.name}
              description={i.description}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
