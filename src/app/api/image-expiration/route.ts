/**
 * API Route for managing image expiration
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getExpirationStatus, 
  cleanupExpiredImages, 
  extendImageExpiration 
} from '@/lib/image-expiration';

export async function GET(request: NextRequest) {
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

    // Get expiration status for user
    const expirationStatus = await getExpirationStatus(userId);

    if (!expirationStatus.success) {
      return NextResponse.json({
        success: false,
        error: expirationStatus.error || 'Failed to check expiration status',
      }, { status: 500 });
    }

    return NextResponse.json({
      ...expirationStatus,
    });

  } catch (error) {
    console.error('Image Expiration API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
    }, { status: 500 });
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

    const body = await request.json();
    const { action, imageIds, additionalDays } = body;

    switch (action) {
      case 'cleanup_expired':
        const cleanupResult = await cleanupExpiredImages(userId);
        return NextResponse.json(cleanupResult);

      case 'extend_expiration':
        if (!imageIds || !Array.isArray(imageIds)) {
          return NextResponse.json({
            success: false,
            error: 'imageIds array is required for extension',
          }, { status: 400 });
        }

        const extensionResult = await extendImageExpiration(
          userId, 
          imageIds, 
          additionalDays || 30
        );
        return NextResponse.json(extensionResult);

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "cleanup_expired" or "extend_expiration"',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Image Expiration Action API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    // Clean up expired images for this user
    const cleanupResult = await cleanupExpiredImages(userId);

    return NextResponse.json({
      success: cleanupResult.success,
      message: `Cleaned up ${cleanupResult.cleaned_count} expired images`,
      cleaned_count: cleanupResult.cleaned_count,
      error: cleanupResult.error,
    });

  } catch (error) {
    console.error('Image Cleanup API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during cleanup',
    }, { status: 500 });
  }
}