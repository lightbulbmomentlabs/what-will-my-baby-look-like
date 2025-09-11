/**
 * Temporary test endpoint to manually create a user and verify the credits system is working
 * This will be removed after we confirm everything works
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/credits';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    // Get user data from Clerk
    const user = await currentUser();
    const primaryEmail = user?.emailAddresses.find(email => 
      email.id === user.primaryEmailAddressId
    ) || user?.emailAddresses[0];

    console.log('Test endpoint - Clerk User ID:', userId);
    console.log('Test endpoint - Clerk User Email:', primaryEmail?.emailAddress);
    console.log('Test endpoint - Clerk User Name:', user?.firstName, user?.lastName);

    if (!primaryEmail?.emailAddress) {
      return NextResponse.json({
        success: false,
        error: 'No email address found in Clerk user data',
        clerkUserId: userId,
      });
    }

    // Try to create/get user with real Clerk data
    const result = await getOrCreateUser(userId, {
      email: primaryEmail.emailAddress,
      firstName: user?.firstName || undefined,
      lastName: user?.lastName || undefined,
    });

    return NextResponse.json({
      success: result.success,
      user: result.user,
      error: result.error,
    });

  } catch (error) {
    console.error('Test user creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}