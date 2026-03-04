'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserUsage, type UsageResponse } from './api';

const STORAGE_KEY = 'postsiva_subscription';

export interface SubscriptionInfo {
  platform: string;
  tier_name: string;
  is_paid: boolean;
  is_unlimited: boolean;
  credits_expire_at: string | null;
  is_expired: boolean;
  usage: UsageResponse | null;
}

export interface UseSubscriptionOptions {
  /** When true, do not call GET /usage on mount; use only localStorage until refresh. Use in layout/sidebar so entering workspace does not trigger usage API. */
  skipFetchOnMount?: boolean;
}

/**
 * Hook to check and manage user subscription status
 * Silently checks subscription on mount and stores in localStorage (unless skipFetchOnMount).
 */
export function useSubscription(platform: string = 'facebook', options: UseSubscriptionOptions = {}) {
  const { skipFetchOnMount = true } = options;
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLocal, setHasLocal] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getUserUsage(platform);
      
      if (response.success && response.usage) {
        const usage = response.usage;
        const isPaid = usage.current_tier_name !== 'free';
        
        const subscriptionInfo: SubscriptionInfo = {
          platform,
          tier_name: usage.current_tier_name,
          is_paid: isPaid,
          is_unlimited: usage.is_unlimited,
          credits_expire_at: usage.credits_expire_at,
          is_expired: usage.is_expired,
          usage,
        };

        setSubscription(subscriptionInfo);
        
        // Store in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptionInfo));
        }
      } else {
        // Default to free tier if no usage record
        const defaultSubscription: SubscriptionInfo = {
          platform,
          tier_name: 'free',
          is_paid: false,
          is_unlimited: false,
          credits_expire_at: null,
          is_expired: false,
          usage: null,
        };
        setSubscription(defaultSubscription);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSubscription));
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check subscription';
      setError(errorMessage);
      console.error('Error checking subscription:', err);
      
      // Try to load from localStorage as fallback
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            setSubscription(JSON.parse(stored));
          } catch {
            // Ignore parse errors
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [platform]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSubscription(parsed);
          setHasLocal(true);
          setLoading(false);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Check subscription on mount (skip when skipFetchOnMount to avoid API call on entering workspace)
  useEffect(() => {
    if (skipFetchOnMount || hasLocal) return;
    checkSubscription();
  }, [checkSubscription, hasLocal, skipFetchOnMount]);

  return {
    subscription,
    loading,
    error,
    checkSubscription,
    refreshSubscription: checkSubscription,
  };
}

/**
 * Get subscription from localStorage (for non-hook usage)
 */
export function getStoredSubscription(): SubscriptionInfo | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
