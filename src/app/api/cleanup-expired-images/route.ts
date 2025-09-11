/**
 * API endpoint for cleaning up expired images
 * This can be called manually or by a cron job/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cleanupExpiredImages, getImagesNeedingNotification, markImagesAsNotified } from '@/lib/image-expiration';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CLEANUP_API_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const startTime = Date.now();
    
    // 1. Clean up expired images
    console.log('🗑️ Starting expired image cleanup...');
    const cleanupResult = await cleanupExpiredImages();
    
    if (!cleanupResult.success) {
      console.error('❌ Cleanup failed:', cleanupResult.error);
      return NextResponse.json({
        success: false,
        error: 'Cleanup failed: ' + cleanupResult.error,
      }, { status: 500 });
    }

    // 2. Get images needing expiration notifications
    console.log('📧 Checking for images needing expiration notifications...');
    const notificationResult = await getImagesNeedingNotification();
    
    if (!notificationResult.success) {
      console.error('❌ Notification check failed:', notificationResult.error);
    }

    // 3. Log notification candidates (in a real app, you'd send actual emails here)
    let notificationsSent = 0;
    const notificationEmails: string[] = [];
    
    if (notificationResult.success && notificationResult.notifications.length > 0) {
      console.log(`📧 Found ${notificationResult.notifications.length} users with expiring images`);
      
      for (const notification of notificationResult.notifications) {
        console.log(`📧 User ${notification.clerk_user_id} has ${notification.images.length} expiring images:`);
        
        for (const image of notification.images) {
          console.log(`  - "${image.baby_name}" expires in ${image.days_until_expiration} days`);
        }
        
        // In a real implementation, you would send an email here
        notificationEmails.push(notification.email || 'No email');
        
        // Mark images as notified
        const imageIds = notification.images.map(img => img.id);
        const markResult = await markImagesAsNotified(imageIds);
        
        if (markResult.success) {
          notificationsSent += markResult.updated_count;
        }
      }
    }

    const processingTime = Date.now() - startTime;
    
    const result = {
      success: true,
      cleanup: {
        images_deleted: cleanupResult.cleaned_count,
        success: cleanupResult.success,
      },
      notifications: {
        users_notified: notificationResult.notifications?.length || 0,
        images_marked: notificationsSent,
        emails: notificationEmails,
      },
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ Cleanup completed:', result);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Cleanup API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also allow GET requests for easy manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Image cleanup endpoint - use POST to trigger cleanup',
    usage: 'POST /api/cleanup-expired-images',
    auth: 'Optional: Add Authorization: Bearer <token> header if CLEANUP_API_TOKEN env var is set',
  });
}