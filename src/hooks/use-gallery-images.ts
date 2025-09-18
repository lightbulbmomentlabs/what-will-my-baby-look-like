/**
 * Hook for fetching and managing user's gallery images
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useAuthenticatedFetch } from '@/lib/api-client';

export interface GalleryImage {
  id: string;
  baby_name: string;
  baby_name_explanation?: string;
  original_image_url: string;
  similarity_percentage: number;
  baby_age: number;
  baby_gender: 'male' | 'female' | 'random';
  parent1_name?: string;
  parent2_name?: string;
  created_at: string;
  processing_time_ms?: number;
}

export interface GalleryState {
  isLoading: boolean;
  images: GalleryImage[];
  error: string | null;
  count: number;
}

export function useGalleryImages() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { fetchWithAuth } = useAuthenticatedFetch();
  const [state, setState] = useState<GalleryState>({
    isLoading: true,
    images: [],
    error: null,
    count: 0,
  });

  const fetchGalleryImages = useCallback(async () => {
    console.log('🖼️ [useGalleryImages] Starting fetchGalleryImages...');
    console.log('🖼️ [useGalleryImages] User state:', { userId: user?.id, email: user?.emailAddresses?.[0]?.emailAddress });

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🖼️ [useGalleryImages] Making API call to /api/gallery');
      const response = await fetchWithAuth('/api/gallery');
      console.log('🖼️ [useGalleryImages] API response status:', response.status, response.ok);

      const data = await response.json();
      console.log('🖼️ [useGalleryImages] API response data:', data);

      if (!response.ok) {
        console.error('🖼️ [useGalleryImages] API request failed:', response.status, data);
        throw new Error(data.error || 'Failed to fetch gallery images');
      }

      console.log('🖼️ [useGalleryImages] Successfully fetched images:', {
        count: data.count || 0,
        imagesLength: data.images?.length || 0,
        hasImages: !!(data.images && data.images.length > 0),
        firstImageId: data.images?.[0]?.id || 'N/A'
      });

      setState({
        isLoading: false,
        images: data.images || [],
        error: null,
        count: data.count || 0,
      });
    } catch (error) {
      console.error('🖼️ [useGalleryImages] Error fetching gallery images:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gallery images',
      }));
    }
  }, [fetchWithAuth, user?.id, user?.emailAddresses]);

  useEffect(() => {
    console.log('🖼️ [useGalleryImages useEffect] Auth state:', {
      isLoaded,
      isSignedIn,
      hasUser: !!user,
      userId: user?.id,
    });

    if (!isLoaded || !user) {
      console.log('🖼️ [useGalleryImages useEffect] Waiting for auth to load or user object...');
      return;
    }

    if (!isSignedIn) {
      console.log('🖼️ [useGalleryImages useEffect] User not signed in, setting error state');
      setState({
        isLoading: false,
        images: [],
        error: 'User not authenticated',
        count: 0,
      });
      return;
    }

    console.log('🖼️ [useGalleryImages useEffect] All conditions met, calling fetchGalleryImages');
    fetchGalleryImages();
  }, [isSignedIn, isLoaded, user, fetchGalleryImages]);

  const refetch = () => {
    if (isSignedIn && user?.id) {
      fetchGalleryImages();
    }
  };

  return {
    ...state,
    refetch,
  };
}