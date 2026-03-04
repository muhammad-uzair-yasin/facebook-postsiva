'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Facebook, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/lib/hooks/auth/AuthContext';
import { useWorkspaceContext } from '@/lib/hooks/workspace/WorkspaceContext';
import { getCurrentWorkspaceId } from '@/lib/hooks/workspace/api';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS, buildApiUrl, STORAGE_KEYS } from '@/lib/config';
import { clearSessionData } from '@/lib/auth-helpers';

export default function FacebookConnectPage() {
  const router = useRouter();
  const { user, isHydrated, hasFacebookToken, isLoading, checkFacebookToken, logout } = useAuthContext();
  const { currentWorkspace } = useWorkspaceContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if not authenticated or already has Facebook token
  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (hasFacebookToken) {
      router.replace('/profile');
      return;
    }
  }, [isHydrated, user, hasFacebookToken, router]);

  // Cleanup polling interval and timeout on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, []);

  const handleConnectFacebook = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!accessToken) {
        setError('Session expired. Please login again.');
        router.replace('/login');
        return;
      }

      const workspaceId = currentWorkspace?.id ?? getCurrentWorkspaceId();
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      };
      if (workspaceId) headers['X-Workspace-Id'] = workspaceId;

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.OAUTH.FACEBOOK_CREATE_TOKEN),
        { method: 'POST', headers }
      );

      if (!response.ok) {
        throw new Error('Failed to initiate Facebook connection');
      }

      const data = await response.json();
      const authUrl = data.data?.auth_url || data.auth_url;

      if (!authUrl) {
        throw new Error('No authentication URL received');
      }

      // Open Facebook OAuth in a popup window
      const popup = window.open(
        authUrl,
        'facebook-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes,left=' +
        (window.screen.width / 2 - 300) + ',top=' +
        (window.screen.height / 2 - 350)
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setError('Popup blocked. Please allow popups for this site and try again.');
        setIsConnecting(false);
        return;
      }

      popupRef.current = popup;
      popup.focus();

      // Helper function to cleanup polling
      const cleanupPolling = () => {
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }
        setIsConnecting(false);
      };

      // Start polling for Facebook token with exponential backoff
      const pollAttemptRef = { current: 0 };
      const maxPollInterval = 30000; // Max 30 seconds
      const baseInterval = 2000; // Start with 2 seconds

      const poll = async () => {
        try {
          // Check if popup is closed (user might have closed it manually)
          if (popupRef.current?.closed) {
            cleanupPolling();
            return;
          }

          // Check if Facebook token exists
          const hasToken = await checkFacebookToken();

          if (hasToken) {
            // Token received! Close popup and redirect to profile
            if (popupRef.current && !popupRef.current.closed) {
              popupRef.current.close();
            }

            cleanupPolling();
            router.push('/profile');
          } else {
            // Exponential backoff: 2s, 4s, 8s, 16s, 30s (max)
            pollAttemptRef.current++;
            const nextInterval = Math.min(baseInterval * Math.pow(2, pollAttemptRef.current - 1), maxPollInterval);

            pollIntervalRef.current = setTimeout(poll, nextInterval);
          }
        } catch (err) {
          // Continue polling even if there's an error with exponential backoff
          pollAttemptRef.current++;
          const nextInterval = Math.min(baseInterval * Math.pow(2, pollAttemptRef.current - 1), maxPollInterval);
          pollIntervalRef.current = setTimeout(poll, nextInterval);
        }
      };

      // Start first poll after base interval
      pollIntervalRef.current = setTimeout(poll, baseInterval);

      // Stop polling after 10 minutes (safety timeout)
      pollTimeoutRef.current = setTimeout(() => {
        cleanupPolling();
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        setError('Connection timeout. Please try again.');
      }, 10 * 60 * 1000); // 10 minutes

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect Facebook';
      setError(errorMessage);
      setIsConnecting(false);

      // Cleanup on error
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center relative overflow-hidden px-6">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
              <Facebook className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900">
              Connect Your Facebook Account
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto">
              To get started with Postsiva, we need to connect your Facebook account to schedule and publish posts.
            </p>
          </div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8"
          >
            {[
              {
                title: 'Schedule Posts',
                description: 'Plan your content calendar weeks in advance',
              },
              {
                title: 'Auto-Publish',
                description: 'Posts go live automatically at the right time',
              },
              {
                title: 'Analytics',
                description: 'Track engagement and performance metrics',
              },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="p-6 rounded-2xl border border-slate-100 bg-white hover:border-primary/20 hover:bg-primary/5 transition-all"
              >
                <CheckCircle className="w-5 h-5 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-600">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Button
              onClick={handleConnectFacebook}
              disabled={isConnecting || isLoading}
              className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Facebook className="w-5 h-5" />
              {isConnecting ? 'Connecting...' : 'Connect Facebook'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* User Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="pt-8 border-t border-slate-100 text-center space-y-2"
          >
            <p className="text-sm text-slate-600">
              Logged in as: <span className="font-bold text-slate-900">{user?.email}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/select-workspace"
                className="text-xs font-bold text-primary hover:underline cursor-pointer transition-colors hover:text-primary/80"
              >
                Switch workspace
              </Link>
              <span className="text-slate-300">|</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  clearSessionData();
                  logout();
                }}
                className="text-xs font-bold text-primary hover:underline cursor-pointer transition-colors hover:text-primary/80"
              >
                Use a different account
              </button>
            </div>
          </motion.div>

          {/* Security Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="pt-4 text-center space-y-2 bg-slate-50 p-4 rounded-xl"
          >
            <p className="text-xs text-slate-500 font-medium">
              🔒 Your Facebook data is secure. We only access what&apos;s needed to manage your posts.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
