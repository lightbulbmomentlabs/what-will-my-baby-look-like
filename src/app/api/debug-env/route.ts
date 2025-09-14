/**
 * Debug API endpoint to check environment variable status
 * Helps diagnose production deployment issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Get current authentication status
    const { userId } = await auth();
    
    // Check all required environment variables
    const envStatus = {
      // Supabase environment variables
      supabase: {
        url: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
          source: 'NEXT_PUBLIC_SUPABASE_URL'
        },
        anonKey: {
          exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
          source: 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        },
        serviceKey: {
          exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          value: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
          source: 'SUPABASE_SERVICE_ROLE_KEY'
        }
      },
      
      // Clerk environment variables
      clerk: {
        publishableKey: {
          exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...',
          source: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
        },
        secretKey: {
          exists: !!process.env.CLERK_SECRET_KEY,
          value: process.env.CLERK_SECRET_KEY?.substring(0, 20) + '...',
          source: 'CLERK_SECRET_KEY'
        }
      },

      // Replicate environment variables
      replicate: {
        apiToken: {
          exists: !!process.env.REPLICATE_API_TOKEN,
          value: process.env.REPLICATE_API_TOKEN?.substring(0, 20) + '...',
          source: 'REPLICATE_API_TOKEN'
        }
      },

      // Deployment environment
      deployment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        environment: process.env.ENVIRONMENT || 'unknown'
      }
    };

    // Calculate overall health status
    const supabaseConfigured = envStatus.supabase.url.exists && 
                               envStatus.supabase.anonKey.exists && 
                               envStatus.supabase.serviceKey.exists;
    
    const clerkConfigured = envStatus.clerk.publishableKey.exists && 
                           envStatus.clerk.secretKey.exists;

    const healthStatus = {
      overall: supabaseConfigured && clerkConfigured ? 'healthy' : 'unhealthy',
      issues: [],
      user: {
        authenticated: !!userId,
        userId: userId || 'not authenticated'
      }
    };

    // Identify specific issues
    if (!supabaseConfigured) {
      healthStatus.issues.push('Supabase configuration incomplete - database operations will fail');
    }
    if (!clerkConfigured) {
      healthStatus.issues.push('Clerk configuration incomplete - authentication may not work');
    }
    if (!envStatus.replicate.apiToken.exists) {
      healthStatus.issues.push('Replicate API token missing - image generation will fail');
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: healthStatus,
      environment: envStatus,
      recommendations: generateRecommendations(envStatus)
    });

  } catch (error) {
    console.error('Environment debug error:', error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check environment status'
    }, { status: 500 });
  }
}

function generateRecommendations(envStatus: any): string[] {
  const recommendations: string[] = [];

  if (!envStatus.supabase.url.exists) {
    recommendations.push('Add NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!envStatus.supabase.anonKey.exists) {
    recommendations.push('Add NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  if (!envStatus.supabase.serviceKey.exists) {
    recommendations.push('Add SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  if (!envStatus.clerk.publishableKey.exists) {
    recommendations.push('Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable');
  }
  if (!envStatus.clerk.secretKey.exists) {
    recommendations.push('Add CLERK_SECRET_KEY environment variable');
  }
  if (!envStatus.replicate.apiToken.exists) {
    recommendations.push('Add REPLICATE_API_TOKEN environment variable');
  }

  if (recommendations.length === 0) {
    recommendations.push('All environment variables are configured correctly');
    recommendations.push('Check network connectivity and service status if issues persist');
  }

  return recommendations;
}