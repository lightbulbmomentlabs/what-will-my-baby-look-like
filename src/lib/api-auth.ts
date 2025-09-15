/**
 * Robust API Authentication Utility
 * Provides consistent authentication handling across all API routes
 */

import { NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export interface AuthResult {
  success: boolean;
  userId?: string;
  authMethod?: string;
  error?: string;
}

/**
 * Attempts to authenticate a user using multiple fallback methods
 * Returns the user ID and authentication method used
 */
export async function authenticateApiRequest(request: NextRequest): Promise<AuthResult> {
  let userId: string | null = null;
  let authMethod = 'none';

  try {
    // Method 1: Server-side Clerk auth (preferred)
    try {
      const authResult = await auth();
      if (authResult.userId) {
        userId = authResult.userId;
        authMethod = 'server-clerk-auth';
        console.log('API Auth: Successfully authenticated via server-side Clerk auth');
        return { success: true, userId, authMethod };
      }
    } catch (error) {
      console.log('API Auth: Server-side Clerk auth failed:', error);
    }

    // Method 2: Client-provided header (fallback)
    const clientUserId = request.headers.get('x-clerk-user-id');
    if (clientUserId) {
      userId = clientUserId;
      authMethod = 'client-header';
      console.log('API Auth: Using client-provided userId header');
      return { success: true, userId, authMethod };
    }

    // Method 3: Clerk currentUser (last resort)
    try {
      const clerkUser = await currentUser();
      if (clerkUser?.id) {
        userId = clerkUser.id;
        authMethod = 'clerk-current-user';
        console.log('API Auth: Using Clerk currentUser');
        return { success: true, userId, authMethod };
      }
    } catch (error) {
      console.log('API Auth: Clerk currentUser failed:', error);
    }

    console.log('API Auth: All authentication methods failed');
    return {
      success: false,
      error: 'Authentication required. Please sign in.',
      authMethod: 'failed'
    };

  } catch (error) {
    console.error('API Auth: Unexpected error during authentication:', error);
    return {
      success: false,
      error: 'Authentication service error',
      authMethod: 'error'
    };
  }
}

/**
 * Standard authentication error response
 */
export function createAuthErrorResponse(authResult: AuthResult) {
  return {
    success: false,
    error: authResult.error || 'Authentication required',
    requiresAuth: true,
    debug: { authMethod: authResult.authMethod }
  };
}