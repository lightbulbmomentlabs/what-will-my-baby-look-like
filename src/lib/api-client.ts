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
 * Hook for making authenticated API requests
 */
export function useAuthenticatedFetch() {
  const { user } = useUser();

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = getAuthHeaders(user?.id);

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