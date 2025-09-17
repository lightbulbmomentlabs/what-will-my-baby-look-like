/**
 * Comprehensive debug endpoint for testing baby generation in production
 * Tests each component step by step to identify failure points
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { hasEnoughCredits, getOrCreateUser } from '@/lib/credits';
import { checkReplicateStatus } from '@/lib/replicate-client';
import Replicate from 'replicate';

interface DebugStep {
  step: string;
  status: 'success' | 'error' | 'skip';
  message: string;
  data?: any;
  error?: string;
  duration?: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const debugResults: DebugStep[] = [];

  function addDebugStep(step: string, status: 'success' | 'error' | 'skip', message: string, data?: any, error?: string) {
    debugResults.push({
      step,
      status,
      message,
      data,
      error,
      duration: Date.now() - startTime
    });
    console.log(`🔍 DEBUG [${status.toUpperCase()}] ${step}: ${message}`);
    if (error) console.error(`🔍 ERROR: ${error}`);
  }

  try {
    // Step 1: Environment Check
    addDebugStep(
      'environment',
      'success',
      'Environment variables checked',
      {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
        replicateTokenLength: process.env.REPLICATE_API_TOKEN?.length || 0,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasClerkKey: !!process.env.CLERK_SECRET_KEY
      }
    );

    // Step 2: Authentication Test
    let userId: string | null = null;
    try {
      const authResult = await authenticateApiRequest(request);
      if (authResult.success && authResult.userId) {
        userId = authResult.userId;
        addDebugStep(
          'authentication',
          'success',
          `Authentication successful via ${authResult.authMethod}`,
          { userId: userId.substring(0, 8) + '...' }
        );
      } else {
        addDebugStep('authentication', 'error', 'Authentication failed', undefined, authResult.error);
        return NextResponse.json({ debugResults, overallStatus: 'failed' });
      }
    } catch (authError) {
      addDebugStep('authentication', 'error', 'Authentication threw exception', undefined, String(authError));
      return NextResponse.json({ debugResults, overallStatus: 'failed' });
    }

    // Step 3: User and Credits Check
    try {
      const userResult = await getOrCreateUser(userId);
      if (userResult.success) {
        addDebugStep('user_creation', 'success', 'User found/created successfully');

        const creditsCheck = await hasEnoughCredits(userId, 1);
        if (creditsCheck.success) {
          addDebugStep(
            'credits_check',
            creditsCheck.hasCredits ? 'success' : 'error',
            `Credits check: ${creditsCheck.currentCredits} available`,
            { currentCredits: creditsCheck.currentCredits, hasCredits: creditsCheck.hasCredits }
          );
        } else {
          addDebugStep('credits_check', 'error', 'Credits check failed', undefined, creditsCheck.error);
        }
      } else {
        addDebugStep('user_creation', 'error', 'User creation failed', undefined, userResult.error);
      }
    } catch (userError) {
      addDebugStep('user_creation', 'error', 'User operations threw exception', undefined, String(userError));
    }

    // Step 4: Replicate Service Check
    try {
      const serviceStatus = await checkReplicateStatus();
      addDebugStep(
        'replicate_service',
        serviceStatus.available ? 'success' : 'error',
        serviceStatus.available ? 'Replicate service is available' : 'Replicate service unavailable',
        { available: serviceStatus.available },
        serviceStatus.error
      );
    } catch (serviceError) {
      addDebugStep('replicate_service', 'error', 'Replicate service check threw exception', undefined, String(serviceError));
    }

    // Step 5: Direct Replicate API Test
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const replicate = new Replicate({
          auth: process.env.REPLICATE_API_TOKEN,
        });

        // Test account access
        const account = await replicate.accounts.current();
        addDebugStep(
          'replicate_account',
          'success',
          'Replicate account access successful',
          { username: account.username }
        );

        // Test simple model
        const simpleOutput = await replicate.run(
          "replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
          { input: { text: "test" } }
        );
        addDebugStep(
          'replicate_simple_model',
          'success',
          'Simple model test successful',
          { output: String(simpleOutput).substring(0, 100) }
        );

      } catch (replicateError) {
        addDebugStep(
          'replicate_direct',
          'error',
          'Direct Replicate API test failed',
          undefined,
          replicateError instanceof Error ? replicateError.message : String(replicateError)
        );
      }
    } else {
      addDebugStep('replicate_direct', 'skip', 'No Replicate API token available');
    }

    // Step 6: Test Image Generation Flow (if request has images)
    const body = await request.json().catch(() => null);
    if (body && body.parentImage1 && body.parentImage2) {
      try {
        addDebugStep('image_validation', 'success', 'Parent images provided for testing');

        // Test parent feature analysis (this might fail but we want to see how)
        const replicate = new Replicate({
          auth: process.env.REPLICATE_API_TOKEN!,
        });

        try {
          const visionOutput = await replicate.run(
            "yorickvp/llava-13b:b5f6212d032508382d61ff00469ddda3e32fd8a0e75dc39d8a4191bb742157fb",
            {
              input: {
                image: body.parentImage1,
                prompt: "Describe this person briefly: skin tone, eye color, hair color."
              }
            }
          );
          addDebugStep(
            'vision_analysis',
            'success',
            'Vision analysis completed',
            { output: String(visionOutput).substring(0, 100) }
          );
        } catch (visionError) {
          addDebugStep(
            'vision_analysis',
            'error',
            'Vision analysis failed',
            undefined,
            visionError instanceof Error ? visionError.message : String(visionError)
          );
        }

      } catch (imageError) {
        addDebugStep('image_validation', 'error', 'Image processing failed', undefined, String(imageError));
      }
    } else {
      addDebugStep('image_validation', 'skip', 'No images provided for testing');
    }

    // Calculate overall status
    const hasErrors = debugResults.some(result => result.status === 'error');
    const overallStatus = hasErrors ? 'failed' : 'success';

    return NextResponse.json({
      debugResults,
      overallStatus,
      totalDuration: Date.now() - startTime,
      summary: {
        totalSteps: debugResults.length,
        successfulSteps: debugResults.filter(r => r.status === 'success').length,
        failedSteps: debugResults.filter(r => r.status === 'error').length,
        skippedSteps: debugResults.filter(r => r.status === 'skip').length
      }
    });

  } catch (globalError) {
    addDebugStep(
      'global_error',
      'error',
      'Unexpected error during debug testing',
      undefined,
      globalError instanceof Error ? globalError.message : String(globalError)
    );

    return NextResponse.json({
      debugResults,
      overallStatus: 'failed',
      totalDuration: Date.now() - startTime,
      globalError: globalError instanceof Error ? globalError.message : String(globalError)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Simple health check version
  try {
    const authResult = await authenticateApiRequest(request);

    return NextResponse.json({
      status: 'ready',
      message: 'Debug endpoint is ready. Send a POST request to run comprehensive tests.',
      authenticated: authResult.success,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Debug endpoint not ready',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}