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
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetchWithAuth('/api/gallery');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch gallery images');
      }

      setState({
        isLoading: false,
        images: data.images || [],
        error: null,
        count: data.count || 0,
      });
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gallery images',
      }));
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    if (!isSignedIn) {
      setState({
        isLoading: false,
        images: [],
        error: 'User not authenticated',
        count: 0,
      });
      return;
    }

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