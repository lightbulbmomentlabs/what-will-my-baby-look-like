/**
 * API Route to clean up unavailable/expired images from the gallery
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Check if an image URL is accessible
 */
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`❌ Image not accessible: ${url.substring(0, 50)}... - ${error}`);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        requiresAuth: true,
      }, { status: 401 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    console.log('🧹 Starting cleanup for user:', userId);

    // Get all user's generated images
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('generated_images')
      .select('id, original_image_url, baby_name, created_at')
      .eq('user_id', user.id)
      .eq('generation_success', true)
      .not('original_image_url', 'is', null)
      .not('original_image_url', 'eq', '');

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch images',
      }, { status: 500 });
    }

    if (!images || images.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images found to clean up',
        removed: 0,
        checked: 0,
      });
    }

    console.log(`🔍 Checking ${images.length} images for accessibility...`);
    
    const unavailableImages: typeof images = [];
    const checkPromises = images.map(async (image) => {
      const isAccessible = await isImageAccessible(image.original_image_url);
      if (!isAccessible) {
        unavailableImages.push(image);
      }
      return { image, isAccessible };
    });

    // Wait for all accessibility checks to complete
    await Promise.all(checkPromises);

    console.log(`📊 Found ${unavailableImages.length} unavailable images out of ${images.length}`);

    if (unavailableImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All images are accessible - no cleanup needed',
        removed: 0,
        checked: images.length,
      });
    }

    // Remove unavailable images from database
    const imageIdsToRemove = unavailableImages.map(img => img.id);
    const { error: deleteError } = await supabaseAdmin
      .from('generated_images')
      .delete()
      .in('id', imageIdsToRemove);

    if (deleteError) {
      console.error('Error removing unavailable images:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to remove unavailable images',
      }, { status: 500 });
    }

    console.log(`✅ Successfully removed ${unavailableImages.length} unavailable images`);

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${unavailableImages.length} unavailable images`,
      removed: unavailableImages.length,
      checked: images.length,
      removedImages: unavailableImages.map(img => ({
        id: img.id,
        name: img.baby_name,
        created_at: img.created_at,
        url_preview: img.original_image_url.substring(0, 50) + '...',
      })),
    });

  } catch (error) {
    console.error('Cleanup API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during cleanup',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check what images would be removed without actually removing them
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Get all user's images
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('generated_images')
      .select('id, original_image_url, baby_name, created_at')
      .eq('user_id', user.id)
      .eq('generation_success', true)
      .not('original_image_url', 'is', null)
      .not('original_image_url', 'eq', '');

    if (imagesError || !images) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch images',
      }, { status: 500 });
    }

    // Separate by URL type for analysis
    const replicateImages = images.filter(img => img.original_image_url.includes('replicate.delivery'));
    const supabaseImages = images.filter(img => img.original_image_url.includes('supabase'));
    const otherImages = images.filter(img => 
      !img.original_image_url.includes('replicate.delivery') && 
      !img.original_image_url.includes('supabase')
    );

    return NextResponse.json({
      success: true,
      analysis: {
        total: images.length,
        replicate_urls: replicateImages.length,
        supabase_urls: supabaseImages.length,
        other_urls: otherImages.length,
      },
      preview: {
        replicate_images: replicateImages.slice(0, 3).map(img => ({
          id: img.id,
          name: img.baby_name,
          created_at: img.created_at,
          url_type: 'replicate (likely expired)',
        })),
        supabase_images: supabaseImages.slice(0, 3).map(img => ({
          id: img.id,
          name: img.baby_name,
          created_at: img.created_at,
          url_type: 'supabase (permanent)',
        })),
      }
    });

  } catch (error) {
    console.error('Cleanup Preview API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze images',
    }, { status: 500 });
  }
}