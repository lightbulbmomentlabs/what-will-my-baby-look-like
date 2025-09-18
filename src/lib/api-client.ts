/**
 * Client-side API utility with automatic authentication headers
 * Ensures consistent authentication handling across all client-side API calls
 */

import { useUser } from '@clerk/nextjs';
import { useCallback } from 'react';

/**
 * Creates authenticated headers for API requests
 */
export function getAuthHeaders(userId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userId) {
    headers['x-clerk-user-id'] = userId;
  }

  return headers;
}

/**
 * Hook for making authenticated API requests with robust user ID detection
 */
export function useAuthenticatedFetch() {
  const { user } = useUser();

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    // Try multiple methods to get user ID for robust authentication
    let userId = user?.id;

    // Fallback: If user.id is undefined, try to get from session or JWT
    if (!userId && typeof window !== 'undefined') {
      // Try to get user ID from Clerk session in cookies
      const cookies = document.cookie.split(';').map(c => c.trim());
      const clerkCookie = cookies.find(c => c.includes('__clerk_db_jwt'));

      if (clerkCookie) {
        try {
          // Extract user ID from JWT payload (this is safe for user ID)
          const jwtPart = clerkCookie.split('=')[1];
          if (jwtPart) {
            const payload = JSON.parse(atob(jwtPart.split('.')[1]));
            userId = payload.sub;
          }
        } catch (e) {
          // Silent fallback failure
        }
      }
    }

    const headers = getAuthHeaders(userId);

    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
  }, [user?.id]);

  return { fetchWithAuth, userId: user?.id };
}

/**
 * Standalone function for authenticated API requests
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}, userId?: string) {
  const headers = getAuthHeaders(userId);

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
}