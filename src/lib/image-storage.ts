/**
 * Utilities for permanent image storage in Supabase Storage
 */

import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Download an image from a URL and store it permanently in Supabase Storage
 */
export async function storeImagePermanently(
  imageUrl: string,
  userId: string,
  metadata: {
    babyName?: string;
    age: number;
    gender: string;
  }
): Promise<{ success: boolean; permanentUrl?: string; error?: string }> {
  try {
    console.log('📸 Downloading image from:', imageUrl);
    
    // Fetch the image from Replicate
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const imageBlob = await response.blob();
    console.log('📸 Downloaded image blob, size:', imageBlob.size, 'bytes');

    // Generate a unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${userId}/${timestamp}-${randomSuffix}.jpg`;

    console.log('📸 Uploading to Supabase Storage with filename:', filename);

    // Check if Supabase is configured
    const supabase = supabaseAdmin();
    if (!supabase) {
      return { success: false, error: 'Database not configured. Please check environment variables.' };
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(filename, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Supabase Storage upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    console.log('✅ Successfully uploaded to storage:', uploadData.path);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(uploadData.path);

    const permanentUrl = urlData.publicUrl;
    console.log('✅ Permanent URL created:', permanentUrl);

    return {
      success: true,
      permanentUrl,
    };
  } catch (error) {
    console.error('❌ Failed to store image permanently:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Storage failed',
    };
  }
}

/**
 * Clean up expired Replicate URLs by replacing them with permanent storage URLs
 */
export async function migrateExistingImages(userId: string): Promise<{
  success: boolean;
  migrated: number;
  errors: string[];
}> {
  try {
    // Check if Supabase is configured
    const supabase2 = supabaseAdmin();
    if (!supabase2) {
      return { success: false, migrated: 0, errors: ['Database not configured. Please check environment variables.'] };
    }

    // Get all user images that still have Replicate URLs
    const { data: images, error: queryError } = await supabase2
      .from('generated_images')
      .select('id, original_image_url, baby_name, baby_age, baby_gender')
      .eq('user_id', userId)
      .eq('generation_success', true)
      .not('original_image_url', 'is', null)
      .like('original_image_url', '%replicate.delivery%');

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    if (!images || images.length === 0) {
      return { success: true, migrated: 0, errors: [] };
    }

    const errors: string[] = [];
    let migrated = 0;

    // Process each image
    for (const image of (images as any[])) {
      try {
        const storageResult = await storeImagePermanently(
          (image as any).original_image_url,
          userId,
          {
            babyName: (image as any).baby_name,
            age: (image as any).baby_age,
            gender: (image as any).baby_gender,
          }
        );

        if (storageResult.success && storageResult.permanentUrl) {
          // Update the database with the new permanent URL
          const { error: updateError } = await (supabase2 as any)
            .from('generated_images')
            .update({ original_image_url: storageResult.permanentUrl })
            .eq('id', (image as any).id);

          if (updateError) {
            errors.push(`Failed to update database for image ${(image as any).id}: ${updateError.message}`);
          } else {
            migrated++;
            console.log(`✅ Migrated image ${(image as any).id} to permanent storage`);
          }
        } else {
          errors.push(`Failed to store image ${(image as any).id}: ${storageResult.error}`);
        }
      } catch (error) {
        errors.push(`Error processing image ${(image as any).id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: true,
      migrated,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      migrated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}