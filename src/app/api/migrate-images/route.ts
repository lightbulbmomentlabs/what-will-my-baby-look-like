/**
 * API Route to migrate existing Replicate URLs to permanent storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { migrateExistingImages } from '@/lib/image-storage';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

    // Get user from database to get the internal user ID
    const { data: user, error: userError } = await supabaseAdmin()
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

    console.log('🔄 Starting image migration for user:', userId, 'internal ID:', (user as any).id);

    // Migrate existing images
    const migrationResult = await migrateExistingImages((user as any).id);

    if (!migrationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Migration failed',
        details: migrationResult.errors,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      migrated: migrationResult.migrated,
      errors: migrationResult.errors,
      message: `Successfully migrated ${migrationResult.migrated} images to permanent storage`,
    });

  } catch (error) {
    console.error('Migration API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during migration',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check - show how many images need migration
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin()
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

    // Count images that need migration (still have Replicate URLs)
    const { data: replicateImages, error: replicateError } = await supabaseAdmin()
      .from('generated_images')
      .select('id, original_image_url, baby_name, created_at')
      .eq('user_id', (user as any).id)
      .eq('generation_success', true)
      .not('original_image_url', 'is', null)
      .like('original_image_url', '%replicate.delivery%');

    // Count images that are already migrated (have Supabase URLs)
    const { data: supabaseImages, error: supabaseError } = await supabaseAdmin()
      .from('generated_images')
      .select('id, original_image_url, baby_name, created_at')
      .eq('user_id', (user as any).id)
      .eq('generation_success', true)
      .not('original_image_url', 'is', null)
      .like('original_image_url', '%supabase%');

    return NextResponse.json({
      success: true,
      status: {
        needsMigration: replicateImages?.length || 0,
        alreadyMigrated: supabaseImages?.length || 0,
        total: (replicateImages?.length || 0) + (supabaseImages?.length || 0),
      },
      replicateImages: replicateImages?.map((img: any) => ({
        id: img.id,
        name: img.baby_name,
        created_at: img.created_at,
        urlPreview: img.original_image_url.substring(0, 50) + '...',
      })) || [],
    });

  } catch (error) {
    console.error('Migration Status API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check migration status',
    }, { status: 500 });
  }
}