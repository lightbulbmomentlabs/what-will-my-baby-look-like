/**
 * API Route for fetching user's generated baby images gallery
 * Enhanced with robust authentication and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getOrCreateUser } from '@/lib/credits';
import { authenticateApiRequest, createAuthErrorResponse } from '@/lib/api-auth';

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

    // Authenticate the request using robust multi-method approach
    const authResult = await authenticateApiRequest(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(createAuthErrorResponse(authResult), { status: 401 });
    }

    const { userId, authMethod } = authResult;
    console.log(`Gallery API: Authenticated via ${authMethod}, userId: ${userId}`);

    // Get or create user in database (handles case where webhook didn't fire)
    let userResult = await getOrCreateUser(userId);

    // If user doesn't exist and we need to create them, get user info from Clerk
    if (!userResult.success && userResult.error?.includes('User not found')) {
      console.log('Gallery API: User not found, attempting to get info from Clerk');
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          const primaryEmail = clerkUser.emailAddresses.find(email => email.id === clerkUser.primaryEmailAddressId);
          const emailAddress = primaryEmail?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

          if (emailAddress) {
            userResult = await getOrCreateUser(userId, {
              email: emailAddress,
              firstName: clerkUser.firstName || undefined,
              lastName: clerkUser.lastName || undefined,
            });
            console.log('Gallery API: Created user with Clerk info');
          }
        }
      } catch (error) {
        console.log('Gallery API: Failed to get Clerk user info:', error);
      }

      // If still no user and Clerk is failing, create with minimal data
      if (!userResult.success && userResult.error?.includes('User not found')) {
        console.log('Gallery API: Creating user with minimal data due to auth issues');
        try {
          const { data: newUser, error: createError } = await (supabase as any)
            .from('users')
            .insert({
              clerk_user_id: userId,
              email: `user-${userId.substring(5, 15)}@temp.placeholder`,
              first_name: 'User',
              last_name: 'Account',
              credits: 1,
            })
            .select()
            .single();

          if (!createError) {
            userResult = { success: true, user: newUser };
            console.log('Gallery API: Successfully created user with minimal data');
          }
        } catch (error) {
          console.log('Gallery API: Failed to create user with minimal data:', error);
        }
      }
    }

    if (!userResult.success || !userResult.user) {
      console.log('Gallery API: Failed to get/create user for clerk_user_id:', userId);
      console.log('Gallery API: User error:', userResult.error);
      return NextResponse.json({
        success: false,
        error: 'Unable to access user profile. Please try signing out and back in.',
        debug: {
          authMethod,
          userId,
          userError: userResult.error
        }
      }, { status: 404 });
    }

    const user = userResult.user;
    console.log('Gallery API: Found/created user with internal ID:', user.id);

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
      .eq('user_id', user.id)
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
      .eq('user_id', user.id);

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
      debug: {
        authMethod,
        stats,
        userId: userId.substring(0, 8) + '...' // Partial user ID for debugging
      }
    });

  } catch (error) {
    console.error('Gallery API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
    }, { status: 500 });
  }
}