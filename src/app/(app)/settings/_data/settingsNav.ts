export type SettingsNavItem = {
  href: string;
  label: string;
};

export type SettingsNavGroup = {
  id: string;
  title: string;
  items: readonly SettingsNavItem[];
};

export const SETTINGS_NAV_GROUPS: readonly SettingsNavGroup[] = [
  {
    id: "account",
    title: "Account",
    items: [{ href: "/settings/profile", label: "Profile" }],
  },
  {
    id: "workspace",
    title: "Workspace",
    items: [{ href: "/settings/persona", label: "Persona" }],
  },
  {
    id: "developers",
    title: "Integrations & API",
    items: [
      { href: "/settings/integrations", label: "Integrations" },
      { href: "/settings/api-keys", label: "API Keys" },
      { href: "/settings/integrations/mcp", label: "MCP" },
    ],
  },
  {
    id: "messaging",
    title: "Messaging",
    items: [
      { href: "/settings/whatsapp", label: "WhatsApp" },
      { href: "/settings/facebook-dm", label: "Facebook DM" },
    ],
  },
  {
    id: "usage",
    title: "Usage",
    items: [{ href: "/settings/ai-usage", label: "AI Usage" }],
  },
];

export function isSettingsNavActive(pathname: string, itemHref: string): boolean {
  if (itemHref === "/settings/integrations") {
    return (
      pathname === "/settings/integrations" ||
      (pathname.startsWith("/settings/integrations/") &&
        pathname !== "/settings/integrations/mcp")
    );
  }
  return pathname === itemHref;
}
