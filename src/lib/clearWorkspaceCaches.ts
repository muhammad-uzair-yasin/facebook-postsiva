/**
 * Clear all workspace-scoped caches when the user switches workspace.
 * Ensures the next fetch for posts, profile, etc. uses the new workspace (X-Workspace-Id).
 */
import { clearCachedValue, clearCachedByPrefix } from "@/lib/cache";

const WORKSPACE_SCOPED_PREFIXES_AND_KEYS: (string | { prefix: string })[] = [
  "facebook_token:v1",
  "facebook_user_profile:v1",
  { prefix: "facebook_posts:" },
];

export function clearWorkspaceScopedCaches(): void {
  for (const keyOrPrefix of WORKSPACE_SCOPED_PREFIXES_AND_KEYS) {
    if (typeof keyOrPrefix === "string") {
      clearCachedValue(keyOrPrefix);
    } else {
      clearCachedByPrefix(keyOrPrefix.prefix);
    }
  }
}
