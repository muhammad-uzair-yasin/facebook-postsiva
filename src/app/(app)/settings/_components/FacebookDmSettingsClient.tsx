"use client";

import Link from "next/link";

export default function FacebookDmSettingsClient() {
  return (
    <div>
      <Link href="/settings/integrations" className="mb-4 inline-block text-xs font-bold text-primary">
        ← Integrations
      </Link>
      <h2 className="text-2xl font-black text-slate-900">Facebook DM</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        Link the workspace agent by messaging the Postsiva Facebook Page and verifying your API key.
      </p>

      <ol className="mt-6 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-slate-800">
        <li>Open Facebook or Messenger.</li>
        <li>Start a conversation with the Postsiva Page (page messages, not a personal profile).</li>
        <li>Send your workspace API key in that chat so we can link this workspace to your Page inbox.</li>
        <li>After verification, use the Postsiva workspace agent from Facebook / Messenger.</li>
      </ol>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-900">API key</p>
        <p className="mt-2 text-sm text-slate-500">
          Create or copy a key under{" "}
          <Link href="/settings/api-keys" className="font-bold text-primary hover:underline">
            API Keys
          </Link>
          . Treat it like a password.
        </p>
      </div>
    </div>
  );
}
