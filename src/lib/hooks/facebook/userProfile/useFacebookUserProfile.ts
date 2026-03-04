'use client';

import { useCallback, useEffect, useReducer } from 'react';
import {
  facebookUserProfileReducer,
  initialFacebookUserProfileState,
} from './reducers';
import { fetchFacebookUserProfile } from './api';
import type { FacebookUserProfile } from './types';

export interface UseFacebookUserProfileOptions {
  /** When true, fetch profile on mount. Skip when initialProfile is provided. */
  autoLoad?: boolean;
  /** Initial profile from workspace (login response); skips GET on load when set. */
  initialProfile?: FacebookUserProfile | null;
}

function getInitialProfileState(initialProfile: FacebookUserProfile | null | undefined) {
  return {
    ...initialFacebookUserProfileState,
    profile: initialProfile ?? null,
  };
}

export function useFacebookUserProfile(options: UseFacebookUserProfileOptions = {}) {
  const { autoLoad = true, initialProfile } = options;
  const [state, dispatch] = useReducer(
    facebookUserProfileReducer,
    initialProfile ?? null,
    getInitialProfileState,
  );

  const loadProfile = useCallback(
    async ({ refresh }: { refresh?: boolean } = {}) => {
      dispatch({ type: 'FB_PROFILE_START' });
      try {
        const res = await fetchFacebookUserProfile(refresh);
        if (!res.success) {
          throw new Error(res.error || res.message ?? 'Failed to load Facebook profile');
        }
        dispatch({ type: 'FB_PROFILE_SUCCESS', payload: res.profile });
        return res;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load Facebook profile';
        dispatch({ type: 'FB_PROFILE_ERROR', payload: message });
        throw err;
      }
    },
    [],
  );

  useEffect(() => {
    if (initialProfile != null) {
      dispatch({ type: 'FB_PROFILE_SUCCESS', payload: initialProfile as FacebookUserProfile });
    }
  }, [initialProfile]);

  useEffect(() => {
    if (!autoLoad || initialProfile != null) return;
    loadProfile().catch(() => undefined);
  }, [autoLoad, initialProfile, loadProfile]);

  return {
    ...state,
    loadProfile,
  };
}

