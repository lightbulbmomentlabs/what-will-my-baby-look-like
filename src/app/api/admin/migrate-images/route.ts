/**
 * Admin endpoint to migrate Replicate URLs to permanent Supabase storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { migrateExistingImages } from '@/lib/image-storage';
import { authenticateApiRequest, createAuthErrorResponse } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  console.log('🔄 === IMAGE MIGRATION REQUEST ===');

  try {
    // Authenticate the request
    const authResult = await authenticateApiRequest(request);

    if (!authResult.success || !authResult.userId) {
      console.log('❌ Authentication failed:', authResult.error);
      return NextResponse.json(createAuthErrorResponse(authResult), { status: 401 });
    }

    const { userId } = authResult;
    console.log('✅ Authentication successful, userId:', userId);

    // Run migration for the user
    console.log('🔄 Starting image migration for user:', userId);
    const migrationResult = await migrateExistingImages(userId);

    console.log('🔄 Migration result:', {
      success: migrationResult.success,
      migrated: migrationResult.migrated,
      errorCount: migrationResult.errors.length
    });

    if (migrationResult.errors.length > 0) {
      console.log('⚠️ Migration errors:', migrationResult.errors);
    }

    return NextResponse.json({
      success: migrationResult.success,
      message: `Successfully migrated ${migrationResult.migrated} images`,
      migrated: migrationResult.migrated,
      errors: migrationResult.errors,
    });

  } catch (error) {
    console.error('💥 Migration API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      debug: {
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Health check - show migration status
  try {
    const authResult = await authenticateApiRequest(request);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(createAuthErrorResponse(authResult), { status: 401 });
    }

    return NextResponse.json({
      status: 'ready',
      message: 'Image migration endpoint ready',
      userId: authResult.userId,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Migration endpoint error',
    }, { status: 500 });
  }
}