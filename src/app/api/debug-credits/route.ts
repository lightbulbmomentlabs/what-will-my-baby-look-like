/**
 * Debug endpoint to check user credits and force refresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { getOrCreateUser } from '@/lib/credits';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiRequest(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({
        error: 'Authentication required',
        authMethod: authResult.authMethod
      }, { status: 401 });
    }

    console.log('🔍 Debug Credits: Checking credits for user:', authResult.userId);

    // Get user from database
    const userResult = await getOrCreateUser(authResult.userId);

    if (!userResult.success || !userResult.user) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get user data',
        debug: {
          authMethod: authResult.authMethod,
          userId: authResult.userId,
          userError: userResult.error
        }
      }, { status: 404 });
    }

    const user = userResult.user;
    console.log('💰 User credits found:', user.credits);

    return NextResponse.json({
      success: true,
      credits: user.credits,
      user: {
        id: user.id,
        email: user.email,
        credits: user.credits,
        updated_at: user.updated_at
      },
      debug: {
        authMethod: authResult.authMethod,
        userId: authResult.userId.substring(0, 8) + '...'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔍 Debug credits error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check credits',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Debug Credits endpoint',
    usage: 'Send GET request with authentication to check current credits',
    note: 'This endpoint forces a fresh database lookup of user credits'
  });
}