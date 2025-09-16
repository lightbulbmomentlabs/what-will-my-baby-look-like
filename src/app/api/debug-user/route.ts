/**
 * Debug API endpoint to check user synchronization status
 * Helps diagnose account sync and credit issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { getOrCreateUser } from '@/lib/credits';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Try to authenticate, but also allow access for debugging purposes
    const authResult = await authenticateApiRequest(request);

    // If authentication completely fails, provide diagnostic info
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed - showing diagnostic info',
        debug: {
          authMethod: authResult.authMethod,
          authError: authResult.error,
          message: 'All authentication methods failed. This suggests either Clerk configuration issues or the user is not properly signed in.',
          troubleshooting: {
            step1: 'Verify you are signed in to the website',
            step2: 'Check if Clerk authentication is working on other parts of the site',
            step3: 'Try signing out and back in',
            step4: 'Contact support if issue persists'
          }
        }
      }, { status: 200 }); // Return 200 so browser shows the debug info
    }

    const { userId, authMethod } = authResult;

    // Get Supabase admin client
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    // Get Clerk user information
    let clerkUser = null;
    try {
      clerkUser = await currentUser();
    } catch (error) {
      console.log('Failed to get Clerk user info:', error);
    }

    // Check if user exists in Supabase
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId);

    const existingUser = existingUsers?.[0] || null;

    // Try to get or create user
    const userResult = await getOrCreateUser(userId, clerkUser ? {
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || undefined,
      lastName: clerkUser.lastName || undefined,
    } : undefined);

    // Check user's generated images count
    let imagesCount = 0;
    if (userResult.success && userResult.user) {
      const { count } = await supabase
        .from('generated_images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userResult.user.id);
      imagesCount = count || 0;
    }

    return NextResponse.json({
      success: true,
      debug: {
        authMethod,
        userId: userId.substring(0, 8) + '...',
        clerkUser: clerkUser ? {
          id: clerkUser.id.substring(0, 8) + '...',
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          createdAt: clerkUser.createdAt
        } : null,
        supabaseUser: {
          exists: !!existingUser && !fetchError,
          user: existingUser ? {
            id: (existingUser as any).id,
            email: (existingUser as any).email,
            credits: (existingUser as any).credits,
            createdAt: (existingUser as any).created_at
          } : null,
          fetchError: fetchError?.message
        },
        userCreation: {
          success: userResult.success,
          error: userResult.error,
          finalUser: userResult.user ? {
            id: userResult.user.id,
            email: userResult.user.email,
            credits: userResult.user.credits,
            createdAt: userResult.user.created_at
          } : null
        },
        imagesCount
      }
    });

  } catch (error) {
    console.error('User debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}