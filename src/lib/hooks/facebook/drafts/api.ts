import { apiFetch } from "../../../apiClient";
import { buildApiUrl, API_ENDPOINTS } from "../../../config";
import type { DraftListResponse, FacebookDraft } from "./types";

const base = () => buildApiUrl(API_ENDPOINTS.FACEBOOK.DRAFTS);

export async function listDrafts(pageId?: string): Promise<DraftListResponse> {
  const params = new URLSearchParams();
  if (pageId) params.set("page_id", pageId);
  const qs = params.toString();
  return apiFetch<DraftListResponse>(`${base()}${qs ? `?${qs}` : ""}`, { method: "GET" }, { withAuth: true });
}

export async function getDraft(draftId: number): Promise<FacebookDraft> {
  return apiFetch<FacebookDraft>(`${base()}/${draftId}`, { method: "GET" }, { withAuth: true });
}

export async function createDraft(body: {
  page_id: string;
  content?: string;
  image_url?: string;
  media_id?: string;
  source_type?: string;
}): Promise<FacebookDraft> {
  return apiFetch<FacebookDraft>(
    base(),
    { method: "POST", body: JSON.stringify({ ...body, source_type: body.source_type ?? "manual" }) },
    { withAuth: true },
  );
}

export async function updateDraft(
  draftId: number,
  body: { content?: string; image_url?: string; media_id?: string },
): Promise<FacebookDraft> {
  return apiFetch<FacebookDraft>(
    `${base()}/${draftId}`,
    { method: "PATCH", body: JSON.stringify(body) },
    { withAuth: true },
  );
}

export async function deleteDraft(draftId: number): Promise<void> {
  await apiFetch<void>(`${base()}/${draftId}`, { method: "DELETE" }, { withAuth: true });
}
