import { apiFetch } from "@/lib/apiClient";
import { getCurrentWorkspaceId } from "@/lib/hooks/workspace/api";

export interface WorkspaceAPIKeyListItem {
  id: string;
  workspace_id: string;
  key_prefix: string;
  name: string | null;
  scope: string;
  created_at: string;
}

export interface CreateWorkspaceAPIKeyResponse extends WorkspaceAPIKeyListItem {
  workspace_name: string;
  created_by: string;
  secret: string;
}

function keysPath(workspaceId: string): string {
  return `/workspaces/${encodeURIComponent(workspaceId)}/api-keys`;
}

function requireWorkspaceId(): string {
  const id = getCurrentWorkspaceId();
  if (!id) throw new Error("Select a workspace first");
  return id;
}

export async function listWorkspaceApiKeys(): Promise<WorkspaceAPIKeyListItem[]> {
  const workspaceId = requireWorkspaceId();
  const body = await apiFetch<WorkspaceAPIKeyListItem[]>(
    keysPath(workspaceId),
    { method: "GET" },
    { withAuth: true },
  );
  return Array.isArray(body) ? body : [];
}

export async function createWorkspaceApiKey(name?: string | null): Promise<CreateWorkspaceAPIKeyResponse> {
  const workspaceId = requireWorkspaceId();
  return apiFetch<CreateWorkspaceAPIKeyResponse>(
    keysPath(workspaceId),
    {
      method: "POST",
      body: JSON.stringify({ name: name ?? null, scope: "full" }),
    },
    { withAuth: true },
  );
}

export async function revokeWorkspaceApiKey(keyId: string): Promise<void> {
  const workspaceId = requireWorkspaceId();
  await apiFetch<void>(
    `${keysPath(workspaceId)}/${encodeURIComponent(keyId)}`,
    { method: "DELETE" },
    { withAuth: true },
  );
}
