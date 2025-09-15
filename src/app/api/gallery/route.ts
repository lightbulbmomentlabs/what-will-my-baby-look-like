/**
 * API Route for fetching user's generated baby images gallery
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured. Please check environment variables.',
        images: [],
        count: 0,
      }, { status: 503 });
    }

    // Try multiple auth methods to handle server-side auth issues
    let userId: string | null = null;

    try {
      // Method 1: Try auth() function
      const authResult = await auth();
      userId = authResult.userId;
      console.log('Gallery API: auth() result:', userId ? 'found userId' : 'no userId');
    } catch (error) {
      console.log('Gallery API: auth() failed:', error);
    }

    // Method 2: Try currentUser() if auth() didn't work
    if (!userId) {
      try {
        const user = await currentUser();
        userId = user?.id || null;
        console.log('Gallery API: currentUser() result:', userId ? 'found userId' : 'no userId');
      } catch (error) {
        console.log('Gallery API: currentUser() failed:', error);
      }
    }

    // Method 3: Check Authorization header as fallback
    if (!userId) {
      const authorization = request.headers.get('authorization');
      console.log('Gallery API: Authorization header present:', !!authorization);

      if (authorization) {
        // This is a temporary debug - in production we'd validate the token properly
        console.log('Gallery API: Found authorization header, but need proper token validation');
      }
    }

    if (!userId) {
      console.log('Gallery API: All auth methods failed - returning 401');
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to view your gallery.',
        requiresAuth: true,
      }, { status: 401 });
    }

    console.log('Gallery API: User authenticated with ID:', userId);

    // Get user from database to get the internal user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      console.log('Gallery API: User lookup failed for clerk_user_id:', userId);
      console.log('Gallery API: User error:', userError);
      return NextResponse.json({
        success: false,
        error: 'User profile not found. Please contact support if this persists.',
      }, { status: 404 });
    }

    console.log('Gallery API: Found user with internal ID:', (user as any).id);

    // Fetch user's generated images - only include images with permanent storage URLs
    const { data: images, error: imagesError } = await supabase
      .from('generated_images')
      .select(`
        id,
        baby_name,
        baby_name_explanation,
        original_image_url,
        similarity_percentage,
        baby_age,
        baby_gender,
        parent1_name,
        parent2_name,
        created_at,
        processing_time_ms
      `)
      .eq('user_id', (user as any).id)
      .eq('generation_success', true)
      .not('original_image_url', 'is', null)
      .not('original_image_url', 'eq', '')
      // Only include images with permanent Supabase storage URLs, not temporary Replicate URLs
      .like('original_image_url', '%supabase%')
      .order('created_at', { ascending: false });

    if (imagesError) {
      console.error('Error fetching gallery images:', imagesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch gallery images',
      }, { status: 500 });
    }

    // Get statistics for debugging
    const { data: allUserImages } = await supabase
      .from('generated_images')
      .select('generation_success, original_image_url')
      .eq('user_id', (user as any).id);

    const stats = {
      total: allUserImages?.length || 0,
      successful: allUserImages?.filter((img: any) => img.generation_success).length || 0,
      withUrls: allUserImages?.filter((img: any) => img.original_image_url && img.original_image_url !== '').length || 0,
      successfulWithUrls: allUserImages?.filter((img: any) => img.generation_success && img.original_image_url && img.original_image_url !== '').length || 0,
    };

    console.log('Gallery Debug Stats:', stats);

    // Debug: Log first few image URLs to help diagnose the issue
    if (images && images.length > 0) {
      console.log('Gallery images found:', images.length);
      images.slice(0, 3).forEach((img: any, index: number) => {
        console.log(`Image ${index + 1}: ${img.baby_name} - URL: ${img.original_image_url?.substring(0, 100)}...`);
      });
    } else {
      console.log('No gallery images found for user');
    }

    return NextResponse.json({
      success: true,
      images: images || [],
      count: images?.length || 0,
      debug: stats, // Temporary debug info
    });

  } catch (error) {
    console.error('Gallery API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
    }, { status: 500 });
  }
}