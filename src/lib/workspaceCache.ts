import { setCachedValue } from "@/lib/cache";

export const WORKSPACES_CACHE_KEY = "workspaces_list:v1";
export const WORKSPACES_TTL_MS = 1000 * 60 * 30;

/** Prime workspace cache (e.g. from login or refresh response) so listWorkspaces() skips the API. */
export function setWorkspacesCache(workspaces: unknown[]): void {
  if (Array.isArray(workspaces)) {
    setCachedValue(WORKSPACES_CACHE_KEY, workspaces, WORKSPACES_TTL_MS);
  }
}
