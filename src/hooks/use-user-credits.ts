/**
 * Hook for managing user authentication and credits state
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export interface UserCreditsState {
  isLoading: boolean;
  isAuthenticated: boolean;
  credits: number | null;
  error: string | null;
}

export function useUserCredits() {
  const { isSignedIn, isLoaded } = useAuth();
  const [state, setState] = useState<UserCreditsState>({
    isLoading: true,
    isAuthenticated: false,
    credits: null,
    error: null,
  });

  useEffect(() => {
    if (!isLoaded) {
      // Still loading authentication state
      return;
    }

    if (!isSignedIn) {
      // User is not authenticated
      setState({
        isLoading: false,
        isAuthenticated: false,
        credits: null,
        error: null,
      });
      return;
    }

    // User is authenticated, fetch their credits with timeout for loading state
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/generate-baby');
        const data = await response.json();
        
        if (response.ok && data.user?.authenticated && typeof data.user.credits === 'number') {
          setState({
            isLoading: false,
            isAuthenticated: true,
            credits: data.user.credits,
            error: null,
          });
        } else if (response.status === 401) {
          // User is not authenticated
          setState({
            isLoading: false,
            isAuthenticated: false,
            credits: null,
            error: null,
          });
        } else {
          setState({
            isLoading: false,
            isAuthenticated: false,
            credits: null,
            error: data.error || 'Failed to fetch user credits',
          });
        }
      } catch (error) {
        console.error('Error fetching user credits:', error);
        setState({
          isLoading: false,
          isAuthenticated: false,
          credits: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // Show loading state if request takes longer than 500ms
    const timeoutId = setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: true }));
    }, 500);

    fetchCredits().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isSignedIn, isLoaded]);

  // Function to refetch credits (useful after purchases or generation)
  const refetchCredits = async () => {
    console.log('🔄 refetchCredits called, isSignedIn:', isSignedIn);
    if (!isSignedIn) return;

    console.log('🔄 Setting loading state and fetching credits...');
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch('/api/generate-baby');
      const data = await response.json();
      
      if (data.user?.authenticated && typeof data.user.credits === 'number') {
        console.log('✅ Successfully fetched updated credits:', data.user.credits);
        setState({
          isLoading: false,
          isAuthenticated: true,
          credits: data.user.credits,
          error: null,
        });
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          credits: null,
          error: data.error || 'Failed to fetch user credits',
        });
      }
    } catch (error) {
      console.error('Error refetching user credits:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  return {
    ...state,
    refetchCredits,
  };
}