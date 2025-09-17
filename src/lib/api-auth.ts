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

  console.log('🔐 API Auth: Starting authentication process');

  try {
    // Method 1: Server-side Clerk auth (preferred)
    try {
      const authResult = await auth();
      console.log('🔐 API Auth: Clerk auth result:', { userId: authResult.userId?.substring(0, 8) + '...', sessionId: !!authResult.sessionId });
      if (authResult.userId) {
        userId = authResult.userId;
        authMethod = 'server-clerk-auth';
        console.log('🔐 API Auth: Successfully authenticated via server-side Clerk auth');
        return { success: true, userId, authMethod };
      }
    } catch (error) {
      console.log('🔐 API Auth: Server-side Clerk auth failed:', error);
    }

    // Method 2: Client-provided header (fallback)
    const clientUserId = request.headers.get('x-clerk-user-id');
    console.log('🔐 API Auth: Client header userId:', clientUserId?.substring(0, 8) + '...' || 'null');
    if (clientUserId) {
      userId = clientUserId;
      authMethod = 'client-header';
      console.log('🔐 API Auth: Using client-provided userId header');
      return { success: true, userId, authMethod };
    }

    // Method 3: Extract from cookies (Clerk session cookies)
    try {
      const cookieHeader = request.headers.get('cookie');
      console.log('🔐 API Auth: Cookie header present:', !!cookieHeader);

      if (cookieHeader) {
        // Try to extract user ID from Clerk JWT in cookies
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const clerkCookie = cookies.find(c => c.includes('__clerk_db_jwt'));

        if (clerkCookie) {
          try {
            const jwtPart = clerkCookie.split('=')[1];
            if (jwtPart) {
              const payload = JSON.parse(Buffer.from(jwtPart.split('.')[1], 'base64').toString());
              const extractedUserId = payload.sub;
              if (extractedUserId && typeof extractedUserId === 'string') {
                userId = extractedUserId;
                authMethod = 'cookie-jwt';
                console.log('🔐 API Auth: Extracted user ID from JWT cookie:', extractedUserId.substring(0, 8) + '...');
                return { success: true, userId, authMethod };
              }
            }
          } catch (e) {
            console.log('🔐 API Auth: Could not parse JWT from cookie:', e);
          }
        }
      }
    } catch (error) {
      console.log('🔐 API Auth: Cookie extraction failed:', error);
    }

    // Method 4: Clerk currentUser (last resort)
    try {
      const clerkUser = await currentUser();
      console.log('🔐 API Auth: currentUser result:', { id: !!clerkUser?.id, email: clerkUser?.emailAddresses?.[0]?.emailAddress });
      if (clerkUser?.id) {
        userId = clerkUser.id;
        authMethod = 'clerk-current-user';
        console.log('🔐 API Auth: Using Clerk currentUser');
        return { success: true, userId, authMethod };
      }
    } catch (error) {
      console.log('🔐 API Auth: Clerk currentUser failed:', error);
    }

    console.log('🔐 API Auth: All authentication methods failed');
    return {
      success: false,
      error: 'Authentication required. Please sign in.',
      authMethod: 'failed'
    };

  } catch (error) {
    console.error('🔐 API Auth: Unexpected error during authentication:', error);
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