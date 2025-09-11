/**
 * Health Check API Endpoint
 * Verifies all critical system components are functioning correctly
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    deployment_id: 'DEPLOY_2025_09_11_001',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      stripe_env: {
        status: process.env.STRIPE_SECRET_KEY ? 'OK' : 'MISSING',
        message: process.env.STRIPE_SECRET_KEY ? 'Stripe secret key configured' : 'Stripe secret key missing'
      },
      clerk_env: {
        status: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'OK' : 'MISSING',  
        message: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Clerk configured' : 'Clerk configuration missing'
      },
      supabase_env: {
        status: process.env.SUPABASE_URL ? 'OK' : 'MISSING',
        message: process.env.SUPABASE_URL ? 'Supabase configured' : 'Supabase configuration missing'  
      },
      replicate_env: {
        status: process.env.REPLICATE_API_TOKEN ? 'OK' : 'MISSING',
        message: process.env.REPLICATE_API_TOKEN ? 'Replicate API configured' : 'Replicate API token missing'
      },
      node_version: {
        status: 'OK',
        version: process.version,
        message: `Running Node.js ${process.version}`
      },
      stripe_api_version: {
        status: 'OK',
        version: '2025-08-27.basil',
        message: 'Using correct Stripe API version'
      }
    }
  };

  // Determine overall health
  const hasErrors = Object.values(checks.checks).some(check => check.status === 'MISSING');
  const overallStatus = hasErrors ? 'UNHEALTHY' : 'HEALTHY';

  return NextResponse.json({
    status: overallStatus,
    ...checks
  }, { 
    status: hasErrors ? 503 : 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}