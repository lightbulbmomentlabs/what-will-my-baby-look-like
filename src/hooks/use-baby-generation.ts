/**
 * Hook for baby image generation with progress tracking
 */

import { useState, useCallback } from 'react';
import type { UploadedImage } from '@/types';

export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  stage: 'preparing' | 'uploading' | 'processing' | 'downloading' | 'complete' | 'error';
  error: string | null;
  result: BabyGenerationResult | null;
  retryCount: number;
}

export interface BabyGenerationResult {
  success: boolean;
  imageUrl?: string;
  babyName?: {
    name: string;
    explanation: string;
  };
  error?: string;
  processingTime?: number;
}

export interface GenerationParams {
  youImage: UploadedImage;
  partnerImage: UploadedImage;
  similarity: number;
  age: number;
  gender: 'male' | 'female' | 'random';
  yourName?: string;
  partnerName?: string;
}

export interface DailyLimitInfo {
  current: number;
  max: number;
  remaining: number;
  resetTime: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const GENERATION_TIMEOUT = 60000; // 60 seconds

/**
 * Convert File to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert file to base64'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get daily generation count from cookies
 */
function getDailyGenerationCount(): number {
  if (typeof window === 'undefined') return 0;
  
  const today = new Date().toDateString();
  const limitKey = `baby_limit_${today}`;
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${limitKey}=`));
  
  return cookie ? parseInt(cookie.split('=')[1]) : 0;
}

/**
 * Increment daily generation count in cookies
 */
function incrementDailyCount(): void {
  if (typeof window === 'undefined') return;
  
  const today = new Date().toDateString();
  const limitKey = `baby_limit_${today}`;
  const currentCount = getDailyGenerationCount();
  const newCount = currentCount + 1;
  
  // Set cookie to expire at midnight
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  document.cookie = `${limitKey}=${newCount}; expires=${tomorrow.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Check if user has reached daily limit
 */
function checkDailyLimit(): { withinLimit: boolean; count: number; remaining: number } {
  const dailyMax = 10;
  const currentCount = getDailyGenerationCount();
  
  return {
    withinLimit: currentCount < dailyMax,
    count: currentCount,
    remaining: Math.max(0, dailyMax - currentCount),
  };
}

/**
 * Custom hook for baby generation
 */
export function useBabyGeneration(onGenerationSuccess?: () => void) {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    stage: 'preparing',
    error: null,
    result: null,
    retryCount: 0,
  });

  // Check daily limit
  const dailyLimit = checkDailyLimit();

  // Generate baby image
  const generateBaby = useCallback(async (params: GenerationParams): Promise<void> => {
    // Check daily limit
    if (!dailyLimit.withinLimit) {
      setState(prev => ({
        ...prev,
        error: `Daily limit of 10 generations reached. You can generate 10 more images after midnight.`,
        stage: 'error',
      }));
      return;
    }

    setState({
      isGenerating: true,
      progress: 0,
      stage: 'preparing',
      error: null,
      result: null,
      retryCount: 0,
    });

    let attempt = 0;
    const maxAttempts = MAX_RETRY_ATTEMPTS;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        
        setState(prev => ({
          ...prev,
          retryCount: attempt - 1,
          stage: 'preparing',
          progress: 10,
        }));

        // Convert images to base64
        setState(prev => ({ ...prev, stage: 'uploading', progress: 20 }));
        
        const parentImage1 = await fileToBase64(params.youImage.croppedFile || params.youImage.file);
        const parentImage2 = await fileToBase64(params.partnerImage.croppedFile || params.partnerImage.file);

        setState(prev => ({ ...prev, progress: 40 }));

        // Prepare API request
        const requestBody = {
          parentImage1,
          parentImage2,
          similarity: params.similarity,
          age: params.age,
          gender: params.gender,
          parent1Name: params.yourName,
          parent2Name: params.partnerName,
        };

        setState(prev => ({ ...prev, stage: 'processing', progress: 50 }));

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT);

        try {
          // Call generation API
          const response = await fetch('/api/generate-baby', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json();
            
            // Handle specific error types
            if (response.status === 429) {
              if (errorData.dailyLimitReached) {
                setState(prev => ({
                  ...prev,
                  error: errorData.error,
                  stage: 'error',
                  isGenerating: false,
                }));
                return;
              }
              
              if (errorData.rateLimited) {
                // Wait and retry for rate limiting
                if (attempt < maxAttempts) {
                  setState(prev => ({ ...prev, progress: 60 }));
                  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                  continue;
                }
              }
            }

            throw new Error(errorData.error || `Server error: ${response.status}`);
          }

          setState(prev => ({ ...prev, stage: 'downloading', progress: 80 }));

          const result: BabyGenerationResult = await response.json();

          if (result.success) {
            // Increment daily count on successful generation
            incrementDailyCount();
            
            setState(prev => ({
              ...prev,
              result,
              stage: 'complete',
              progress: 100,
              isGenerating: false,
            }));
            
            // Call success callback to refresh credits
            if (onGenerationSuccess) {
              console.log('🎉 Generation success - calling refetchCredits');
              onGenerationSuccess();
            }
            
            return;
          } else {
            throw new Error(result.error || 'Generation failed');
          }

        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              throw new Error('Generation timed out. Please try again.');
            }
            throw fetchError;
          }
          throw new Error('Network error occurred');
        }

      } catch (error) {
        console.error(`Generation attempt ${attempt} failed:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // If this was the last attempt, show error
        if (attempt >= maxAttempts) {
          setState(prev => ({
            ...prev,
            error: `Generation failed after ${maxAttempts} attempts. ${errorMessage}`,
            stage: 'error',
            isGenerating: false,
          }));
          return;
        }
        
        // Update state for retry
        setState(prev => ({
          ...prev,
          retryCount: attempt,
          progress: 30 + (attempt * 10),
        }));
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 + (attempt * 1000))); // Exponential backoff
      }
    }
  }, [dailyLimit.withinLimit, onGenerationSuccess]);

  // Reset generation state
  const resetGeneration = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      stage: 'preparing',
      error: null,
      result: null,
      retryCount: 0,
    });
  }, []);

  // Get service health info
  const checkServiceHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/generate-baby');
      return await response.json();
    } catch (error) {
      return { status: 'error', error: 'Service unavailable' };
    }
  }, []);

  return {
    ...state,
    generateBaby,
    resetGeneration,
    checkServiceHealth,
    dailyLimit: {
      current: dailyLimit.count,
      max: 10,
      remaining: dailyLimit.remaining,
      withinLimit: dailyLimit.withinLimit,
    },
    canGenerate: dailyLimit.withinLimit && !state.isGenerating,
  };
}