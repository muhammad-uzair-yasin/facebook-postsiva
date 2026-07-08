import type { FacebookDraft } from "./types";
import {
  listDrafts,
  createDraft,
  updateDraft,
  deleteDraft,
  getDraft,
} from "./api";

import { useCallback, useReducer } from "react";

interface DraftsState {
  loading: boolean;
  error: string | null;
  drafts: FacebookDraft[];
}

type Action =
  | { type: "START" }
  | { type: "SUCCESS"; drafts: FacebookDraft[] }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

const initial: DraftsState = { loading: false, error: null, drafts: [] };

function reducer(state: DraftsState, action: Action): DraftsState {
  switch (action.type) {
    case "START":
      return { ...state, loading: true, error: null };
    case "SUCCESS":
      return { ...state, loading: false, drafts: action.drafts };
    case "ERROR":
      return { ...state, loading: false, error: action.message };
    case "RESET":
      return initial;
    default:
      return state;
  }
}

export function useFacebookDrafts() {
  const [state, dispatch] = useReducer(reducer, initial);

  const load = useCallback(async (pageId?: string) => {
    dispatch({ type: "START" });
    try {
      const res = await listDrafts(pageId);
      dispatch({ type: "SUCCESS", drafts: res.drafts });
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load drafts";
      dispatch({ type: "ERROR", message });
      throw err;
    }
  }, []);

  const save = useCallback(
    async (body: {
      page_id: string;
      content?: string;
      image_url?: string;
      media_id?: string;
    }) => {
      dispatch({ type: "START" });
      try {
        const draft = await createDraft(body);
        await load(body.page_id);
        return draft;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save draft";
        dispatch({ type: "ERROR", message });
        throw err;
      }
    },
    [load],
  );

  const patch = useCallback(
    async (
      draftId: number,
      body: { content?: string; image_url?: string; media_id?: string },
      pageId?: string,
    ) => {
      dispatch({ type: "START" });
      try {
        const draft = await updateDraft(draftId, body);
        await load(pageId);
        return draft;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update draft";
        dispatch({ type: "ERROR", message });
        throw err;
      }
    },
    [load],
  );

  const remove = useCallback(
    async (draftId: number, pageId?: string) => {
      dispatch({ type: "START" });
      try {
        await deleteDraft(draftId);
        await load(pageId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to delete draft";
        dispatch({ type: "ERROR", message });
        throw err;
      }
    },
    [load],
  );

  const fetchOne = useCallback(async (draftId: number) => getDraft(draftId), []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { ...state, load, save, patch, remove, fetchOne, reset };
}
