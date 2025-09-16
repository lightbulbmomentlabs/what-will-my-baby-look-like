/**
 * SSO Callback Page
 * Handles OAuth callbacks from Google and other providers via Clerk
 */

'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function SSOCallbackPage() {
  useEffect(() => {
    console.log('SSO Callback page loaded');
  }, []);

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