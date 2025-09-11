/**
 * Automated cleanup job for expired images
 * This endpoint can be called by cron jobs or similar automated systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredImages, getImagesNeedingNotification, markImagesAsNotified } from '@/lib/image-expiration';

// Simple API key authentication for cron jobs
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid cron secret',
      }, { status: 401 });
    }

    console.log('🚀 Starting automated cleanup job...');
    
    // 1. Clean up expired images
    const cleanupResult = await cleanupExpiredImages();
    
    // 2. Get images that need expiration notifications
    const notificationResult = await getImagesNeedingNotification();
    
    let notificationsSent = 0;
    let notificationErrors: string[] = [];

    if (notificationResult.success && notificationResult.notifications.length > 0) {
      console.log(`📧 Found ${notificationResult.notifications.length} users needing expiration notifications`);
      
      // Here you would integrate with your email service
      // For now, just log the notifications that would be sent
      for (const notification of notificationResult.notifications) {
        try {
          console.log(`📧 Would send email to ${notification.email || 'no-email'} about ${notification.images.length} expiring images`);
          
          // TODO: Send actual email notification here
          // await sendExpirationEmail(notification);
          
          // Mark images as notified
          const imageIds = notification.images.map(img => img.id);
          const markResult = await markImagesAsNotified(imageIds);
          
          if (markResult.success) {
            notificationsSent += markResult.updated_count;
          } else {
            notificationErrors.push(`Failed to mark images as notified for user ${notification.clerk_user_id}: ${markResult.error}`);
          }
        } catch (error) {
          const errorMsg = `Failed to process notification for user ${notification.clerk_user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          notificationErrors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      cleanup: {
        images_deleted: cleanupResult.cleaned_count,
        cleanup_success: cleanupResult.success,
        cleanup_error: cleanupResult.error,
      },
      notifications: {
        users_processed: notificationResult.notifications?.length || 0,
        images_marked_notified: notificationsSent,
        notification_errors: notificationErrors,
      },
    };

    console.log('✅ Cleanup job completed:', summary);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ Cleanup job failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Cleanup job failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check for the cron job
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Invalid secret',
      }, { status: 401 });
    }

    // Get a preview of what would be cleaned up
    const notificationResult = await getImagesNeedingNotification();
    
    return NextResponse.json({
      success: true,
      preview: {
        users_needing_notifications: notificationResult.notifications?.length || 0,
        total_images_expiring: notificationResult.notifications?.reduce(
          (total, user) => total + user.images.length, 
          0
        ) || 0,
      },
      status: 'Cleanup job is ready to run',
      next_steps: [
        'POST to this endpoint with Bearer token to run cleanup',
        'Set up CRON_SECRET environment variable',
        'Configure email service for notifications',
      ],
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}