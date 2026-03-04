'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { handleGoogleCallbackFromSearch } from '@/lib/hooks/googleoauth/api';

/**
 * Google OAuth Callback Page (Client-side)
 * 
 * This page handles the redirect from the backend after Google OAuth.
 * The backend redirects here with token in URL params: ?token=...&user=...&email=...&success=true
 * 
 * This page will:
 * 1. Extract token from URL params
 * 2. Store the token in localStorage
 * 3. Check for Facebook token
 * 4. Redirect to appropriate page (profile or facebook-connect)
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      try {
        const search = window.location.search;
        const params = new URLSearchParams(search);
        
        // Check for error parameters first
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        
        if (error) {
          console.error('Google OAuth error:', error, errorDescription);
          const errorMsg = errorDescription || error;
          router.replace(`/login?error=${encodeURIComponent(errorMsg)}`);
          return;
        }
        
        // Check if we have the required success parameters
        const token = params.get('token');
        const success = params.get('success');
        
        if (!token || success !== 'true') {
          console.error('Missing token or success flag. Params:', Object.fromEntries(params));
          router.replace('/login?error=Authentication%20failed%20-%20missing%20token');
          return;
        }
        
        // Process the callback - this stores token and checks Facebook token
        const result = await handleGoogleCallbackFromSearch(search);

        if (result) {
          router.replace(result.redirectPath);
        } else {
          // Invalid or missing parameters
          console.error('Invalid Google OAuth callback parameters:', Object.fromEntries(params));
          router.replace('/login?error=Invalid%20authentication%20parameters');
        }
      } catch (error) {
        console.error('Error processing Google OAuth callback:', error);
        const errorMsg = error instanceof Error ? error.message : 'Authentication failed';
        router.replace(`/login?error=${encodeURIComponent(errorMsg)}`);
      }
    };

    processCallback();
  }, [router]);

  // Show loading state while processing
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 font-medium">Completing authentication...</p>
      </div>
    </div>
  );
}
