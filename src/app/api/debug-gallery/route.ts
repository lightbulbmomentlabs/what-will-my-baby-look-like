import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get ALL generated images for this user (including failed ones)
    const { data: allImages, error: allImagesError } = await supabaseAdmin
      .from('generated_images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Get only successful images with non-empty URLs
    const { data: successImages, error: successError } = await supabaseAdmin
      .from('generated_images')
      .select('*')
      .eq('user_id', user.id)
      .eq('generation_success', true)
      .not('original_image_url', 'is', null)
      .not('original_image_url', 'eq', '')
      .order('created_at', { ascending: false });

    // Categorize images by URL type
    const replicateImages = successImages?.filter(img => img.original_image_url?.includes('replicate.delivery')) || [];
    const supabaseImages = successImages?.filter(img => img.original_image_url?.includes('supabase')) || [];

    return NextResponse.json({
      userId,
      internalUserId: user.id,
      totalImages: allImages?.length || 0,
      successImages: successImages?.length || 0,
      urlAnalysis: {
        replicateUrls: replicateImages.length,
        supabaseUrls: supabaseImages.length,
        other: (successImages?.length || 0) - replicateImages.length - supabaseImages.length,
      },
      replicateImages: replicateImages.map(img => ({
        id: img.id,
        baby_name: img.baby_name,
        created_at: img.created_at,
        urlPreview: img.original_image_url.substring(0, 50) + '...',
        status: 'likely_expired'
      })),
      allImages: allImages?.map(img => ({
        id: img.id,
        baby_name: img.baby_name,
        success: img.generation_success,
        hasUrl: !!img.original_image_url,
        urlPreview: img.original_image_url ? img.original_image_url.substring(0, 100) + '...' : 'NO URL',
        created_at: img.created_at,
        error: img.generation_error
      })) || [],
    });

  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('🧹 Cleaning up expired Replicate URLs for user:', userId);

    // Delete images with expired Replicate URLs
    const { data: deletedImages, error: deleteError } = await supabaseAdmin
      .from('generated_images')
      .delete()
      .eq('user_id', user.id)
      .like('original_image_url', '%replicate.delivery%')
      .select('id, baby_name, original_image_url, created_at');

    if (deleteError) {
      console.error('Error deleting expired images:', deleteError);
      return NextResponse.json({ error: 'Failed to clean up images' }, { status: 500 });
    }

    console.log(`✅ Cleaned up ${deletedImages?.length || 0} expired images`);

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${deletedImages?.length || 0} expired images`,
      removedCount: deletedImages?.length || 0,
      removedImages: deletedImages?.map(img => ({
        id: img.id,
        name: img.baby_name,
        created_at: img.created_at,
      })) || [],
    });

  } catch (error) {
    console.error('Cleanup Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}