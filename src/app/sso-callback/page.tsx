/**
 * SSO Callback Page
 * Handles OAuth callbacks from Google and other providers via Clerk
 */

'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SSOCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('SSO Callback page loaded');

    // Check if we're on a hash-fragmented URL and fix it
    if (typeof window !== 'undefined' && window.location.hash.includes('/sso-callback')) {
      console.log('Hash fragment detected, fixing URL...');
      // Extract the query params from the hash
      const hashPart = window.location.hash.substring(1); // Remove the #
      const newUrl = window.location.origin + '/' + hashPart;
      console.log('Redirecting to:', newUrl);
      window.location.replace(newUrl);
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>

      {/* Clerk's component to handle the OAuth callback */}
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        redirectUrl="/"
      />
    </div>
  );
}