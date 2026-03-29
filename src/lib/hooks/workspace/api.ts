import { apiFetch, WORKSPACE_ID_KEY } from "@/lib/apiClient";
import { getCachedValue } from "@/lib/cache";
import { setWorkspacesCache, WORKSPACES_CACHE_KEY, WORKSPACES_TTL_MS } from "@/lib/workspaceCache";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceCreateBody,
  WorkspaceUpdateBody,
  WorkspaceAddMemberBody,
} from "./types";

export function getCurrentWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WORKSPACE_ID_KEY);
}

export function setCurrentWorkspaceId(workspaceId: string | null): void {
  if (typeof window === "undefined") return;
  if (workspaceId) {
    localStorage.setItem(WORKSPACE_ID_KEY, workspaceId);
  } else {
    localStorage.removeItem(WORKSPACE_ID_KEY);
  }
}
export { setWorkspacesCache };

export async function listWorkspaces(options?: { forceRefresh?: boolean }): Promise<Workspace[]> {
  const forceRefresh = options?.forceRefresh === true;
  if (!forceRefresh) {
    const cached = getCachedValue<Workspace[]>(WORKSPACES_CACHE_KEY);
    if (cached) return cached;
  }
  const data = await apiFetch<Workspace[]>("/workspaces", { method: "GET" }, { withAuth: true });
  if (Array.isArray(data)) setWorkspacesCache(data);
  return data;
}

export async function createWorkspace(body: WorkspaceCreateBody): Promise<Workspace> {
  const res = await apiFetch<Workspace>(
    "/workspaces",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: body.name.trim() || "My Workspace", slug: body.slug?.trim() || undefined }),
    },
    { withAuth: true }
  );
  return res;
}

export async function updateWorkspace(
  workspaceId: string,
  body: WorkspaceUpdateBody
): Promise<Workspace> {
  const res = await apiFetch<Workspace>(
    `/workspaces/${encodeURIComponent(workspaceId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(body.name != null && { name: body.name.trim() }),
        ...(body.slug != null && { slug: body.slug.trim() }),
        ...(body.description != null && { description: body.description.trim() }),
      }),
    },
    { withAuth: true }
  );
  return res;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await apiFetch<void>(
    `/workspaces/${encodeURIComponent(workspaceId)}`,
    { method: "DELETE" },
    { withAuth: true }
  );
}

export async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const data = await apiFetch<WorkspaceMember[]>(
    `/workspaces/${encodeURIComponent(workspaceId)}/members`,
    { method: "GET" },
    { withAuth: true }
  );
  return Array.isArray(data) ? data : [];
}

export async function addWorkspaceMember(
  workspaceId: string,
  body: WorkspaceAddMemberBody
): Promise<WorkspaceMember> {
  return apiFetch<WorkspaceMember>(
    `/workspaces/${encodeURIComponent(workspaceId)}/members`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: body.email?.trim() || undefined,
        user_id: body.user_id ?? undefined,
        role_id: body.role_id,
      }),
    },
    { withAuth: true }
  );
}
