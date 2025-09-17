/**
 * Comprehensive Clerk configuration diagnostic endpoint
 * Helps identify domain, environment, and configuration issues
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      url: request.url,
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,

      // Clerk Environment Variables Analysis
      clerkConfig: {
        publishableKey: {
          exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          prefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 8) || null,
          isLive: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_') || false,
          isTest: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_') || false,
          length: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length || 0
        },
        secretKey: {
          exists: !!process.env.CLERK_SECRET_KEY,
          prefix: process.env.CLERK_SECRET_KEY?.substring(0, 8) || null,
          isLive: process.env.CLERK_SECRET_KEY?.startsWith('sk_live_') || false,
          isTest: process.env.CLERK_SECRET_KEY?.startsWith('sk_test_') || false,
          length: process.env.CLERK_SECRET_KEY?.length || 0
        },
        // Check for common configuration issues
        keyMismatch: {
          bothLive: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_') &&
                   process.env.CLERK_SECRET_KEY?.startsWith('sk_live_'),
          bothTest: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_') &&
                   process.env.CLERK_SECRET_KEY?.startsWith('sk_test_'),
          mixed: (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_') &&
                 process.env.CLERK_SECRET_KEY?.startsWith('sk_test_')) ||
                (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_') &&
                 process.env.CLERK_SECRET_KEY?.startsWith('sk_live_'))
        }
      },

      // Request Analysis
      requestInfo: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent')?.substring(0, 100) + '...',
        xForwardedHost: request.headers.get('x-forwarded-host'),
        xForwardedProto: request.headers.get('x-forwarded-proto')
      },

      // Cookie Analysis
      cookies: {
        hasCookies: !!request.headers.get('cookie'),
        clerkCookies: extractClerkCookies(request.headers.get('cookie') || ''),
        sessionCookie: request.headers.get('cookie')?.includes('__session') || false,
        clerkSessionCookie: request.headers.get('cookie')?.includes('__clerk') || false
      },

      // Domain Analysis
      domainAnalysis: {
        currentDomain: request.headers.get('host'),
        expectedDomain: 'whatwillmybabylooklike.com',
        isCorrectDomain: request.headers.get('host') === 'whatwillmybabylooklike.com',
        hasSubdomain: request.headers.get('host')?.includes('clerk.') || false,
        protocol: request.headers.get('x-forwarded-proto') || 'http'
      }
    };

    // Generate recommendations
    const recommendations = generateRecommendations(diagnostics);

    return NextResponse.json({
      ...diagnostics,
      recommendations,
      status: determineOverallStatus(diagnostics)
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Clerk diagnostics failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function extractClerkCookies(cookieString: string): any {
  const cookies = cookieString.split(';').map(c => c.trim());
  const clerkCookies = cookies.filter(c =>
    c.includes('clerk') ||
    c.includes('__session') ||
    c.includes('__clerk_db_jwt')
  );

  return {
    count: clerkCookies.length,
    cookieNames: clerkCookies.map(c => c.split('=')[0]).slice(0, 5), // Limit for security
    hasClerkSession: clerkCookies.some(c => c.includes('__clerk_db_jwt')),
    hasDevSession: clerkCookies.some(c => c.includes('__clerk_dev_session'))
  };
}

function generateRecommendations(diagnostics: any): string[] {
  const recommendations: string[] = [];

  // Check key configuration
  if (!diagnostics.clerkConfig.publishableKey.exists) {
    recommendations.push('❌ CRITICAL: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing');
  }
  if (!diagnostics.clerkConfig.secretKey.exists) {
    recommendations.push('❌ CRITICAL: CLERK_SECRET_KEY is missing');
  }

  // Check key type consistency
  if (diagnostics.clerkConfig.keyMismatch.mixed) {
    recommendations.push('❌ CRITICAL: Mixed live/test keys detected - use matching key types');
  }

  // Check production readiness
  if (diagnostics.environment === 'production' && !diagnostics.clerkConfig.keyMismatch.bothLive) {
    recommendations.push('⚠️ WARNING: Production environment should use pk_live_ and sk_live_ keys');
  }

  // Check domain issues
  if (diagnostics.domainAnalysis.hasSubdomain) {
    recommendations.push('❌ CRITICAL: Subdomain detected - this causes authentication failures');
  }

  if (!diagnostics.domainAnalysis.isCorrectDomain) {
    recommendations.push(`❌ CRITICAL: Domain mismatch. Current: ${diagnostics.domainAnalysis.currentDomain}, Expected: ${diagnostics.domainAnalysis.expectedDomain}`);
  }

  // Check protocol
  if (diagnostics.domainAnalysis.protocol !== 'https' && diagnostics.environment === 'production') {
    recommendations.push('⚠️ WARNING: Production should use HTTPS');
  }

  // Success case
  if (recommendations.length === 0) {
    recommendations.push('✅ Clerk configuration appears correct');
    recommendations.push('✅ Domain configuration is valid');
    recommendations.push('ℹ️ If authentication still fails, check Clerk Dashboard domain settings');
  }

  return recommendations;
}

function determineOverallStatus(diagnostics: any): string {
  if (!diagnostics.clerkConfig.publishableKey.exists || !diagnostics.clerkConfig.secretKey.exists) {
    return 'CRITICAL_ERROR';
  }
  if (diagnostics.clerkConfig.keyMismatch.mixed) {
    return 'CONFIGURATION_ERROR';
  }
  if (diagnostics.domainAnalysis.hasSubdomain || !diagnostics.domainAnalysis.isCorrectDomain) {
    return 'DOMAIN_ERROR';
  }
  return 'OK';
}