/**
 * Simple authentication test that works from direct browser URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {} as any
  };

  // Test 1: Basic auth() function
  try {
    const authResult = await auth();
    results.tests.basicAuth = {
      success: !!authResult.userId,
      userId: authResult.userId?.substring(0, 8) + '...' || null,
      fullAuthResult: authResult
    };
  } catch (error) {
    results.tests.basicAuth = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Test 2: currentUser() function
  try {
    const user = await currentUser();
    results.tests.currentUser = {
      success: !!user,
      userId: user?.id?.substring(0, 8) + '...' || null,
      email: user?.emailAddresses?.[0]?.emailAddress || null,
      firstName: user?.firstName || null,
      lastName: user?.lastName || null
    };
  } catch (error) {
    results.tests.currentUser = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Test 3: Check headers sent by client
  results.tests.headers = {
    clerkUserId: request.headers.get('x-clerk-user-id'),
    userAgent: request.headers.get('user-agent'),
    allHeaders: Object.fromEntries(request.headers.entries())
  };

  // Test 4: Environment check
  results.tests.environment = {
    nodeEnv: process.env.NODE_ENV,
    clerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: !!process.env.CLERK_SECRET_KEY,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  // Overall assessment
  const authWorking = results.tests.basicAuth.success || results.tests.currentUser.success;

  return NextResponse.json({
    success: authWorking,
    message: authWorking ? 'Authentication working' : 'Authentication not working',
    ...results
  });
}