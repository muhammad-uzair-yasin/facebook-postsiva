'use client';

import { useCallback, useReducer } from 'react';
import { personaReducer, initialPersonaState } from './reducers';
import {
  buildPersona,
  getPersona,
  updatePersona,
  patchPersona,
  deletePersona,
  regeneratePersona,
} from './api';
import type {
  PersonaData,
  PersonaUpdateRequest,
  PersonaPatchRequest,
  PersonaRegenerateRequest,
} from './types';

export function usePersona() {
  const [state, dispatch] = useReducer(personaReducer, initialPersonaState);

  const build = useCallback(async (pageId: string, postsLimit: number = 30) => {
    dispatch({ type: 'PERSONA_START' });
    try {
      const res = await buildPersona(pageId, postsLimit);
      if (!res.success) {
        throw new Error(res.error || res.message || 'Failed to build persona');
      }
      dispatch({
        type: 'PERSONA_SUCCESS',
        payload: { persona: res.data, personaId: res.persona_id ?? null },
      });
      return res;
    } catch (err: any) {
      dispatch({
        type: 'PERSONA_ERROR',
        payload: err.message ?? 'Failed to build persona',
      });
      throw err;
    }
  }, []);

  const load = useCallback(async (pageId: string, forceRefresh: boolean = false) => {
    dispatch({ type: 'PERSONA_START' });
    try {
      const res = await getPersona(pageId, forceRefresh);
      if (!res.success) {
        const msg = res.error || res.message || '';
        if (/not found/i.test(msg)) {
          dispatch({
            type: 'PERSONA_SUCCESS',
            payload: { persona: null, personaId: res.persona_id ?? null },
          });
          return res;
        }
        throw new Error(msg || 'Failed to load persona');
      }
      dispatch({
        type: 'PERSONA_SUCCESS',
        payload: { persona: res.data, personaId: res.persona_id ?? null },
      });
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load persona';
      dispatch({ type: 'PERSONA_ERROR', payload: message });
      throw err;
    }
  }, []);

  const save = useCallback(async (pageId: string, personaData: PersonaData) => {
    dispatch({ type: 'PERSONA_START' });
    try {
      const res = await updatePersona(pageId, { persona_data: personaData });
      if (!res.success) {
        throw new Error(res.error || res.message || 'Failed to save persona');
      }
      dispatch({
        type: 'PERSONA_SUCCESS',
        payload: { persona: res.data, personaId: res.persona_id ?? null },
      });
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save persona';
      dispatch({ type: 'PERSONA_ERROR', payload: message });
      throw err;
    }
  }, []);

  const update = useCallback(async (pageId: string, request: PersonaUpdateRequest) => {
    dispatch({ type: 'PERSONA_START' });
    try {
      const res = await updatePersona(pageId, request);
      if (!res.success) {
        throw new Error(res.error || res.message || 'Failed to update persona');
      }
      dispatch({
        type: 'PERSONA_SUCCESS',
        payload: { persona: res.data, personaId: res.persona_id ?? null },
      });
      return res;
    } catch (err: any) {
      dispatch({
        type: 'PERSONA_ERROR',
        payload: err.message ?? 'Failed to update persona',
      });
      throw err;
    }
  }, []);

  const patch = useCallback(async (pageId: string, request: PersonaPatchRequest) => {
    dispatch({ type: 'PERSONA_START' });
    try {
      const res = await patchPersona(pageId, request);
      if (!res.success) {
        throw new Error(res.error || res.message || 'Failed to patch persona');
      }
      dispatch({
        type: 'PERSONA_SUCCESS',
        payload: { persona: res.data, personaId: res.persona_id ?? null },
      });
      return res;
    } catch (err: any) {
      dispatch({
        type: 'PERSONA_ERROR',
        payload: err.message ?? 'Failed to patch persona',
      });
      throw err;
    }
  }, []);

  const remove = useCallback(async (pageId: string) => {
    dispatch({ type: 'PERSONA_START' });
    try {
      const res = await deletePersona(pageId);
      if (!res.success) {
        throw new Error(res.error || res.message || 'Failed to delete persona');
      }
      dispatch({ type: 'PERSONA_RESET' });
      return res;
    } catch (err: any) {
      dispatch({
        type: 'PERSONA_ERROR',
        payload: err.message ?? 'Failed to delete persona',
      });
      throw err;
    }
  }, []);

  const regenerate = useCallback(
    async (
      pageId: string,
      request: PersonaRegenerateRequest,
      postsLimit: number = 30,
    ) => {
      dispatch({ type: 'PERSONA_START' });
      try {
        const res = await regeneratePersona(pageId, request, postsLimit);
        if (!res.success) {
          throw new Error(res.error || res.message || 'Failed to regenerate persona');
        }
        dispatch({
          type: 'PERSONA_SUCCESS',
          payload: { persona: res.data, personaId: res.persona_id ?? null },
        });
        return res;
      } catch (err: any) {
        dispatch({
          type: 'PERSONA_ERROR',
          payload: err.message ?? 'Failed to regenerate persona',
        });
        throw err;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    dispatch({ type: 'PERSONA_RESET' });
  }, []);

  return {
    ...state,
    build,
    load,
    save,
    update,
    patch,
    remove,
    regenerate,
    reset,
  };
}
