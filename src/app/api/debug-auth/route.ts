/**
 * Debug endpoint to test authentication methods in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { authenticateApiRequest } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: [] as any[]
    };

    // Test 1: Raw Clerk auth()
    try {
      const authResult = await auth();
      results.tests.push({
        method: 'clerk_auth',
        success: !!authResult.userId,
        userId: authResult.userId?.substring(0, 8) + '...' || null,
        sessionId: authResult.sessionId?.substring(0, 8) + '...' || null,
        error: null
      });
    } catch (error) {
      results.tests.push({
        method: 'clerk_auth',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Test 2: Clerk currentUser()
    try {
      const user = await currentUser();
      results.tests.push({
        method: 'clerk_currentUser',
        success: !!user?.id,
        userId: user?.id?.substring(0, 8) + '...' || null,
        email: user?.emailAddresses?.[0]?.emailAddress || null,
        error: null
      });
    } catch (error) {
      results.tests.push({
        method: 'clerk_currentUser',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Test 3: Our authentication utility
    try {
      const authUtilResult = await authenticateApiRequest(request);
      results.tests.push({
        method: 'authenticateApiRequest',
        success: authUtilResult.success,
        userId: authUtilResult.userId?.substring(0, 8) + '...' || null,
        authMethod: authUtilResult.authMethod,
        error: authUtilResult.error || null
      });
    } catch (error) {
      results.tests.push({
        method: 'authenticateApiRequest',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Test 4: Check headers
    const headers = {
      'x-clerk-user-id': request.headers.get('x-clerk-user-id'),
      'authorization': request.headers.get('authorization') ? 'present' : 'missing',
      'cookie': request.headers.get('cookie') ? 'present' : 'missing',
      'user-agent': request.headers.get('user-agent')?.substring(0, 50) + '...' || null
    };

    results.tests.push({
      method: 'headers_check',
      success: true,
      headers: headers,
      error: null
    });

    // Calculate overall status
    const successful = results.tests.filter(t => t.success).length;
    const total = results.tests.length;

    return NextResponse.json({
      ...results,
      summary: {
        successful,
        total,
        authenticated: successful > 0,
        primaryMethod: results.tests.find(t => t.success)?.method || 'none'
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Same as GET but allows testing with different request methods
  return GET(request);
}