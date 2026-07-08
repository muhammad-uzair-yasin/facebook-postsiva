import { apiFetch, WORKSPACE_ID_KEY } from "@/lib/apiClient";
import { clearCachedValue, getCachedValue, setCachedValue } from "@/lib/cache";
import { setWorkspacesCache, WORKSPACES_TTL_MS } from "@/lib/workspaceCache";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceCreateBody,
  WorkspaceUpdateBody,
  WorkspaceAddMemberBody,
} from "./types";

const WORKSPACES_FB_CACHE_KEY = "workspaces_list:facebook:v1";

function filterWorkspacesForFacebook(workspaces: Workspace[]): Workspace[] {
  return workspaces.filter(
    (w) => w.source_product === "facebook" || w.facebook_connected === true,
  );
}

function invalidateFacebookWorkspacesCache(): void {
  clearCachedValue(WORKSPACES_FB_CACHE_KEY);
}

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
    const cached = getCachedValue<Workspace[]>(WORKSPACES_FB_CACHE_KEY);
    if (cached) return cached;
  }
  const data = await apiFetch<Workspace[]>(
    "/workspaces?product=facebook",
    { method: "GET" },
    { withAuth: true },
  );
  const list = Array.isArray(data) ? filterWorkspacesForFacebook(data) : [];
  setCachedValue(WORKSPACES_FB_CACHE_KEY, list, WORKSPACES_TTL_MS);
  return list;
}

export async function createWorkspace(body: WorkspaceCreateBody): Promise<Workspace> {
  const res = await apiFetch<Workspace>(
    "/workspaces",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: body.name.trim() || "My Workspace",
        slug: body.slug?.trim() || undefined,
        source_product: body.source_product ?? "facebook",
      }),
    },
    { withAuth: true }
  );
  invalidateFacebookWorkspacesCache();
  return res;
}

export async function getWorkspaceById(workspaceId: string): Promise<Workspace> {
  const res = await apiFetch<Workspace>(
    `/workspaces/${encodeURIComponent(workspaceId)}`,
    { method: "GET" },
    { withAuth: true },
  );
  return res;
}

export async function updateWorkspace(
  workspaceId: string,
  body: WorkspaceUpdateBody
): Promise<Workspace> {
  const payload: Record<string, string | null> = {};
  if (body.name !== undefined) {
    payload.name = body.name == null ? null : body.name.trim();
  }
  if (body.slug !== undefined) {
    payload.slug = body.slug == null ? null : body.slug.trim();
  }
  if (body.description !== undefined) {
    const trimmed = body.description == null ? null : body.description.trim();
    payload.description = trimmed === "" ? null : trimmed;
  }
  if (body.image_url !== undefined) {
    payload.image_url = body.image_url;
  }

  const res = await apiFetch<Workspace>(
    `/workspaces/${encodeURIComponent(workspaceId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { withAuth: true }
  );
  invalidateFacebookWorkspacesCache();
  return res;
}

export async function uploadWorkspaceImage(
  workspaceId: string,
  file: File,
): Promise<Workspace> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch<Workspace>(
    `/workspaces/${encodeURIComponent(workspaceId)}/image`,
    {
      method: "POST",
      body: form,
      headers: {},
    },
    { withAuth: true },
  );
  invalidateFacebookWorkspacesCache();
  return res;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await apiFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}`,
    { method: "DELETE" },
    { withAuth: true },
  );
  invalidateFacebookWorkspacesCache();
  if (getCurrentWorkspaceId() === workspaceId) {
    setCurrentWorkspaceId(null);
  }
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
