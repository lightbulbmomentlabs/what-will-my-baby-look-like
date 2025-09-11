/**
 * Hook for persisting and restoring photo upload state across authentication
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { UploadedImage } from '@/types';

interface PhotoState {
  youImage?: UploadedImage;
  partnerImage?: UploadedImage;
  similarity: number;
  selectedAge: string;
  selectedGender: string;
  timestamp: number;
}

const STORAGE_KEY = 'baby_predictor_photo_state';
const EXPIRY_HOURS = 48; // 48 hours

// Helper to convert File to base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper to convert base64 string back to File
const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Helper to serialize UploadedImage with File objects
const serializeUploadedImage = async (image: UploadedImage): Promise<Record<string, unknown>> => {
  const serialized: Record<string, unknown> = {
    label: image.label,
    name: image.name,
    preview: image.preview,
    croppedPreview: image.croppedPreview,
  };

  if (image.file) {
    serialized.fileBase64 = await fileToBase64(image.file);
    serialized.fileName = image.file.name;
  }

  if (image.croppedFile) {
    serialized.croppedFileBase64 = await fileToBase64(image.croppedFile);
    serialized.croppedFileName = image.croppedFile.name;
  }

  return serialized;
};

// Helper to deserialize UploadedImage with File objects
const deserializeUploadedImage = (data: Record<string, unknown>): UploadedImage => {
  const image: UploadedImage = {
    label: data.label,
    name: data.name,
  };

  if (data.fileBase64 && data.fileName) {
    image.file = base64ToFile(data.fileBase64, data.fileName);
    // Recreate preview URL from the restored file
    image.preview = URL.createObjectURL(image.file);
  }

  if (data.croppedFileBase64 && data.croppedFileName) {
    image.croppedFile = base64ToFile(data.croppedFileBase64, data.croppedFileName);
    // Recreate cropped preview URL from the restored file
    image.croppedPreview = URL.createObjectURL(image.croppedFile);
  }

  return image;
};

// Check if data is expired
const isExpired = (timestamp: number): boolean => {
  const now = Date.now();
  const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
  return (now - timestamp) > expiryMs;
};

export function usePhotoStateStore() {
  const { isSignedIn, isLoaded } = useAuth();

  // Save state to localStorage
  const saveState = useCallback(async (state: Omit<PhotoState, 'timestamp'>) => {
    try {
      const serializedState: Record<string, unknown> = {
        similarity: state.similarity,
        selectedAge: state.selectedAge,
        selectedGender: state.selectedGender,
        timestamp: Date.now(),
      };

      if (state.youImage) {
        serializedState.youImage = await serializeUploadedImage(state.youImage);
      }

      if (state.partnerImage) {
        serializedState.partnerImage = await serializeUploadedImage(state.partnerImage);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedState));
    } catch (error) {
      console.warn('Failed to save photo state:', error);
      // Silently fail - UX is no worse than before
    }
  }, []);

  // Load state from localStorage
  const loadState = useCallback((): PhotoState | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Check if data is expired
      if (isExpired(data.timestamp)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      const state: PhotoState = {
        similarity: data.similarity,
        selectedAge: data.selectedAge,
        selectedGender: data.selectedGender,
        timestamp: data.timestamp,
      };

      if (data.youImage) {
        state.youImage = deserializeUploadedImage(data.youImage);
      }

      if (data.partnerImage) {
        state.partnerImage = deserializeUploadedImage(data.partnerImage);
      }

      return state;
    } catch (error) {
      console.warn('Failed to load photo state:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  // Clear stored state
  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear photo state:', error);
    }
  }, []);

  // Auto-restore state when user becomes authenticated
  const tryRestore = useCallback((): PhotoState | null => {
    if (!isLoaded || !isSignedIn) {
      return null;
    }

    const state = loadState();
    if (state) {
      console.log('Restoring photo state from localStorage');
      // Clear the state after successful restoration
      clearState();
      return state;
    }

    return null;
  }, [isLoaded, isSignedIn, loadState, clearState]);

  // Clean up expired data on mount
  useEffect(() => {
    const cleanupExpiredData = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          if (isExpired(data.timestamp)) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    cleanupExpiredData();
  }, []);

  return {
    saveState,
    loadState,
    clearState,
    tryRestore,
  };
}