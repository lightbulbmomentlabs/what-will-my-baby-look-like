import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Validate Supabase configuration and provide helpful debugging
export function validateSupabaseConfig() {
  const config = {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    urlFormat: supabaseUrl ? supabaseUrl.includes('supabase.co') : false,
    environment: process.env.NODE_ENV,
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase Configuration Check:', {
      ...config,
      url: supabaseUrl?.substring(0, 30) + '...',
      keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
    });
  }

  return config;
}

// Create client only if configured, otherwise create a mock client
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false, // Since we're not using user authentication
      },
    })
  : null;

/**
 * Analytics functions for tracking usage
 */
export async function trackEvent(
  event: string,
  metadata?: Record<string, unknown>,
) {
  // Skip tracking if Supabase is not configured
  if (!isSupabaseConfigured || !supabase) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics tracking skipped: Supabase not configured');
    }
    return;
  }

  try {
    const sessionId =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem('baby_predictor_session') ||
          generateSessionId()
        : generateSessionId();

    const { error } = await supabase.from('analytics_events').insert({
      event,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
      user_agent:
        typeof window !== 'undefined' ? window.navigator.userAgent : null,
      url: typeof window !== 'undefined' ? window.location.href : null,
    });

    if (error) {
      // Only log analytics errors in development to avoid console spam in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to track event:', error);
      }
      // In production, silently fail - analytics shouldn't break user experience
    }
  } catch (error) {
    // Only log analytics errors in development to avoid console spam in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to track event:', error);
    }
    // In production, silently fail - analytics shouldn't break user experience
  }
}

export async function trackGeneration(params: {
  similarity: number;
  age: number;
  generation_time: number;
  success: boolean;
  error?: string;
}) {
  return trackEvent('baby_generation', params);
}

export async function trackPageView(page: string) {
  return trackEvent('page_view', { page });
}

export async function trackShare(platform: string) {
  return trackEvent('share', { platform });
}

function generateSessionId(): string {
  const sessionId = Math.random().toString(36).substring(2, 15);
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('baby_predictor_session', sessionId);
  }
  return sessionId;
}

/**
 * Generated image storage and metadata functions
 */
export interface GeneratedImageData {
  sessionId: string;
  babyName?: string;
  babyNameExplanation?: string;
  similarity: number;
  age: number;
  gender: 'male' | 'female' | 'random';
  parent1Name?: string;
  parent2Name?: string;
  originalImageUrl: string;
  watermarkedImageUrl?: string;
  processingTime?: number;
  success: boolean;
  error?: string;
  userId?: string; // User ID for authenticated users
  creditsUsed?: number; // Credits used for this generation
}

/**
 * Save generated image metadata to database
 */
export async function saveGeneratedImage(data: GeneratedImageData) {
  // Skip saving if Supabase is not configured
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Image metadata save skipped: Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Set expiration date to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error } = await supabase.from('generated_images').insert({
      session_id: data.sessionId,
      baby_name: data.babyName,
      baby_name_explanation: data.babyNameExplanation,
      similarity_percentage: data.similarity,
      baby_age: data.age,
      baby_gender: data.gender,
      parent1_name: data.parent1Name,
      parent2_name: data.parent2Name,
      original_image_url: data.originalImageUrl,
      watermarked_image_url: data.watermarkedImageUrl,
      processing_time_ms: data.processingTime || 0,
      generation_success: data.success,
      generation_error: data.error,
      user_id: data.userId, // Add user ID for authenticated users
      credits_used: data.creditsUsed || 0, // Add credits used
      expires_at: expiresAt.toISOString(), // Set expiration date
      expiration_notified: false, // Initialize notification flag
      auto_delete_enabled: true, // Enable automatic deletion
    });

    if (error) {
      console.error('Failed to save generated image metadata:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to save generated image metadata:', error);
    return { success: false, error: 'Database error occurred' };
  }
}

/**
 * Upload image blob to Supabase storage
 */
export async function uploadImageToStorage(
  imageBlob: Blob,
  filename: string,
  bucket: string = 'generated-images'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured. Please check environment variables.' };
    }

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Failed to upload image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Download and store generated image from external URL
 */
export async function storeGeneratedImage(
  imageUrl: string,
  metadata: Omit<GeneratedImageData, 'originalImageUrl' | 'watermarkedImageUrl'>
): Promise<{ success: boolean; storedUrl?: string; error?: string }> {
  try {
    // Fetch the image from the external URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBlob = await response.blob();
    
    // Generate a unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
    
    // Upload to Supabase storage
    const uploadResult = await uploadImageToStorage(imageBlob, filename);
    
    if (!uploadResult.success) {
      return uploadResult;
    }

    // Save metadata to database
    const saveResult = await saveGeneratedImage({
      ...metadata,
      originalImageUrl: imageUrl,
      watermarkedImageUrl: uploadResult.url,
    });

    if (!saveResult.success) {
      console.error('Failed to save metadata, but image was uploaded');
    }

    return {
      success: true,
      storedUrl: uploadResult.url,
    };
  } catch (error) {
    console.error('Failed to store generated image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Storage failed',
    };
  }
}

/**
 * Get analytics data for generated images
 */
export async function getGenerationAnalytics(
  startDate?: string,
  endDate?: string
) {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured. Please check environment variables.' };
    }

    let query = supabase
      .from('generated_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch analytics:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return { success: false, error: 'Analytics query failed' };
  }
}

/**
 * Get generation statistics
 */
export async function getGenerationStats() {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured. Please check environment variables.' };
    }

    const { data, error } = await supabase.rpc('get_generation_stats');

    if (error) {
      console.error('Failed to fetch generation stats:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch generation stats:', error);
    return { success: false, error: 'Stats query failed' };
  }
}