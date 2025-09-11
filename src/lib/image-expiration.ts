/**
 * Image expiration management utilities
 */

import { supabaseAdmin } from '@/lib/supabase-admin';

// Configuration
const EXPIRATION_DAYS = 30;
const NOTIFICATION_DAYS = [7, 3, 1]; // Days before expiration to send notifications

export interface ImageExpirationInfo {
  id: string;
  baby_name: string;
  expires_at: string;
  days_until_expiration: number;
  is_expired: boolean;
  notification_sent: boolean;
}

/**
 * Check which images are expiring soon or have expired
 */
export async function getExpirationStatus(userId: string): Promise<{
  success: boolean;
  expiring_soon: ImageExpirationInfo[];
  expired: ImageExpirationInfo[];
  total_images: number;
  error?: string;
}> {
  try {
    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return { success: false, expiring_soon: [], expired: [], total_images: 0, error: 'User not found' };
    }

    // Get all user images with expiration info
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('generated_images')
      .select('id, baby_name, expires_at, expiration_notified, created_at')
      .eq('user_id', user.id)
      .eq('generation_success', true)
      .not('original_image_url', 'is', null)
      .not('original_image_url', 'eq', '')
      .order('expires_at', { ascending: true });

    if (imagesError) {
      return { success: false, expiring_soon: [], expired: [], total_images: 0, error: imagesError.message };
    }

    if (!images || images.length === 0) {
      return { success: true, expiring_soon: [], expired: [], total_images: 0 };
    }

    const now = new Date();
    const expiring_soon: ImageExpirationInfo[] = [];
    const expired: ImageExpirationInfo[] = [];

    for (const image of images) {
      const expiresAt = new Date(image.expires_at);
      const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysUntilExpiration <= 0;

      const imageInfo: ImageExpirationInfo = {
        id: image.id,
        baby_name: image.baby_name,
        expires_at: image.expires_at,
        days_until_expiration: daysUntilExpiration,
        is_expired: isExpired,
        notification_sent: image.expiration_notified,
      };

      if (isExpired) {
        expired.push(imageInfo);
      } else if (daysUntilExpiration <= 7) {
        expiring_soon.push(imageInfo);
      }
    }

    return {
      success: true,
      expiring_soon,
      expired,
      total_images: images.length,
    };
  } catch (error) {
    return {
      success: false,
      expiring_soon: [],
      expired: [],
      total_images: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clean up expired images
 */
export async function cleanupExpiredImages(userId?: string): Promise<{
  success: boolean;
  cleaned_count: number;
  error?: string;
}> {
  try {
    let query = supabaseAdmin
      .from('generated_images')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('auto_delete_enabled', true);

    // If userId provided, only clean up that user's images
    if (userId) {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_user_id', userId)
        .single();

      if (userError || !user) {
        return { success: false, cleaned_count: 0, error: 'User not found' };
      }

      query = query.eq('user_id', user.id);
    }

    const { data: deletedImages, error: deleteError } = await query
      .select('id, baby_name, expires_at');

    if (deleteError) {
      return { success: false, cleaned_count: 0, error: deleteError.message };
    }

    const cleanedCount = deletedImages?.length || 0;
    console.log(`🗑️ Cleaned up ${cleanedCount} expired images`);

    return { success: true, cleaned_count: cleanedCount };
  } catch (error) {
    return {
      success: false,
      cleaned_count: 0,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    };
  }
}

/**
 * Extend expiration for specific images
 */
export async function extendImageExpiration(
  userId: string, 
  imageIds: string[], 
  additionalDays: number = 30
): Promise<{ success: boolean; updated_count: number; error?: string }> {
  try {
    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return { success: false, updated_count: 0, error: 'User not found' };
    }

    // Extend expiration for specified images
    const { data: updatedImages, error: updateError } = await supabaseAdmin
      .from('generated_images')
      .update({
        expires_at: `NOW() + INTERVAL '${additionalDays} days'`,
        expiration_notified: false, // Reset notification flag
      })
      .eq('user_id', user.id)
      .in('id', imageIds)
      .select('id, baby_name, expires_at');

    if (updateError) {
      return { success: false, updated_count: 0, error: updateError.message };
    }

    return { success: true, updated_count: updatedImages?.length || 0 };
  } catch (error) {
    return {
      success: false,
      updated_count: 0,
      error: error instanceof Error ? error.message : 'Extension failed',
    };
  }
}

/**
 * Get images that need expiration notifications
 */
export async function getImagesNeedingNotification(): Promise<{
  success: boolean;
  notifications: Array<{
    user_id: string;
    clerk_user_id: string;
    email?: string;
    images: Array<{
      id: string;
      baby_name: string;
      expires_at: string;
      days_until_expiration: number;
    }>;
  }>;
  error?: string;
}> {
  try {
    // Get images expiring in the next 7 days that haven't been notified
    const { data: expiringImages, error: imagesError } = await supabaseAdmin
      .from('generated_images')
      .select(`
        id, 
        baby_name, 
        expires_at, 
        user_id,
        users!inner (
          clerk_user_id,
          email
        )
      `)
      .eq('generation_success', true)
      .eq('expiration_notified', false)
      .gte('expires_at', new Date().toISOString())
      .lte('expires_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('original_image_url', 'is', null)
      .not('original_image_url', 'eq', '');

    if (imagesError) {
      return { success: false, notifications: [], error: imagesError.message };
    }

    if (!expiringImages || expiringImages.length === 0) {
      return { success: true, notifications: [] };
    }

    // Group by user
    const userGroups = new Map();
    const now = new Date();

    for (const image of expiringImages) {
      const userId = image.user_id;
      const expiresAt = new Date(image.expires_at);
      const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (!userGroups.has(userId)) {
        userGroups.set(userId, {
          user_id: userId,
          clerk_user_id: image.users.clerk_user_id,
          email: image.users.email,
          images: [],
        });
      }

      userGroups.get(userId).images.push({
        id: image.id,
        baby_name: image.baby_name,
        expires_at: image.expires_at,
        days_until_expiration: daysUntilExpiration,
      });
    }

    return {
      success: true,
      notifications: Array.from(userGroups.values()),
    };
  } catch (error) {
    return {
      success: false,
      notifications: [],
      error: error instanceof Error ? error.message : 'Notification query failed',
    };
  }
}

/**
 * Mark images as notified
 */
export async function markImagesAsNotified(imageIds: string[]): Promise<{
  success: boolean;
  updated_count: number;
  error?: string;
}> {
  try {
    const { data: updatedImages, error: updateError } = await supabaseAdmin
      .from('generated_images')
      .update({ expiration_notified: true })
      .in('id', imageIds)
      .select('id');

    if (updateError) {
      return { success: false, updated_count: 0, error: updateError.message };
    }

    return { success: true, updated_count: updatedImages?.length || 0 };
  } catch (error) {
    return {
      success: false,
      updated_count: 0,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}