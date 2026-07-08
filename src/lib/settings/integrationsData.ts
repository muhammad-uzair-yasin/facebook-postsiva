export type Integration = {
  slug: string;
  name: string;
  description: string;
};

/** Automation & AI integrations (FB settings studio). */
export const INTEGRATIONS: Integration[] = [
  {
    slug: "zapier",
    name: "Zapier",
    description: "Automate workflows with Zapier + Postsiva MCP",
  },
  {
    slug: "mcp",
    name: "MCP",
    description: "Connect any MCP-compatible AI tool to Postsiva",
  },
  {
    slug: "n8n",
    name: "n8n",
    description: "Workflow automation with n8n + Postsiva MCP",
  },
  {
    slug: "chatgpt",
    name: "ChatGPT",
    description: "Manage content from ChatGPT",
  },
  {
    slug: "claude",
    name: "Claude",
    description: "Manage content from Claude via MCP",
  },
];

export const SETTINGS_MESSAGING_INTEGRATIONS = [
  {
    href: "/settings/whatsapp",
    name: "WhatsApp",
    description: "Link a phone number for WhatsApp posting and agent features.",
  },
  {
    href: "/settings/facebook-dm",
    name: "Facebook DM",
    description: "Connect the workspace agent via Facebook Page messages.",
  },
] as const;

export function getIntegrationBySlug(slug: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.slug === slug);
}

export const MCP_SERVER_URL =
  process.env.NEXT_PUBLIC_POSTSIVA_MCP_URL?.trim() || "https://mcp.postsiva.com/mcp";
