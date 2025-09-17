/**
 * Debug endpoint to see exactly what models return in production vs localhost
 * This will help us understand the difference in behavior
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import Replicate from 'replicate';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiRequest(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({
        error: 'Authentication required',
        authMethod: authResult.authMethod
      }, { status: 401 });
    }

    console.log('🧪 === DEBUG MODEL OUTPUT ===');

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    console.log('🔑 API Token exists:', !!process.env.REPLICATE_API_TOKEN);
    console.log('🔑 Token length:', process.env.REPLICATE_API_TOKEN?.length);
    console.log('🌟 Testing SDXL model output in detail...');

    // Test with the same SDXL model that's failing
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: "RAW photo, cute baby portrait, professional photography",
          negative_prompt: "cartoon, anime, drawing",
          width: 768,
          height: 1024,
          num_outputs: 1,
          num_inference_steps: 30,
          guidance_scale: 6.0,
          refine: "expert_ensemble_refiner",
          scheduler: "K_EULER",
          apply_watermark: false,
        }
      }
    );

    console.log('📊 === DETAILED OUTPUT ANALYSIS ===');
    console.log('Raw output:', output);
    console.log('Type:', typeof output);
    console.log('Is Array:', Array.isArray(output));
    console.log('Array length:', Array.isArray(output) ? output.length : 'N/A');
    console.log('Constructor name:', output?.constructor?.name);
    console.log('JSON.stringify attempt:', (() => {
      try {
        return JSON.stringify(output, null, 2);
      } catch (e) {
        return `JSON stringify failed: ${e}`;
      }
    })());

    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      console.log('📋 First array item details:');
      console.log('  Type:', typeof firstItem);
      console.log('  Constructor:', firstItem?.constructor?.name);
      console.log('  Own properties:', Object.getOwnPropertyNames(firstItem || {}));
      console.log('  Enumerable keys:', Object.keys(firstItem || {}));
      console.log('  Has toString:', typeof firstItem?.toString === 'function');

      // Test toString method
      if (firstItem && typeof firstItem.toString === 'function') {
        try {
          const stringResult = firstItem.toString();
          console.log('  toString() result:', stringResult);
          console.log('  toString() type:', typeof stringResult);
          console.log('  toString() length:', stringResult?.length);
          console.log('  toString() starts with http:', stringResult?.startsWith?.('http'));
          console.log('  toString() trimmed starts with http:', stringResult?.trim?.()?.startsWith?.('http'));
        } catch (e) {
          console.log('  toString() error:', e);
        }
      }

      // Test direct property access
      if ('url' in firstItem) {
        console.log('  Has url property:', typeof firstItem.url);
        if (typeof firstItem.url === 'string') {
          console.log('  url property value:', firstItem.url);
        }
      }

      // Deep inspection for debugging
      console.log('  Object.getOwnPropertyDescriptors:', Object.getOwnPropertyDescriptors(firstItem || {}));
    }

    // Return detailed analysis
    return NextResponse.json({
      testType: 'debug-model-output',
      success: true,
      environment: process.env.NODE_ENV,
      rawOutput: {
        type: typeof output,
        isArray: Array.isArray(output),
        arrayLength: Array.isArray(output) ? output.length : null,
        constructorName: output?.constructor?.name,
        keys: Object.keys(output || {}),
        ownProperties: Object.getOwnPropertyNames(output || {}),
        canStringify: (() => {
          try {
            JSON.stringify(output);
            return true;
          } catch {
            return false;
          }
        })(),
        firstItemAnalysis: Array.isArray(output) && output.length > 0 ? {
          type: typeof output[0],
          constructorName: output[0]?.constructor?.name,
          keys: Object.keys(output[0] || {}),
          ownProperties: Object.getOwnPropertyNames(output[0] || {}),
          hasToString: typeof output[0]?.toString === 'function',
          toStringResult: (() => {
            try {
              return output[0]?.toString?.();
            } catch (e) {
              return `ERROR: ${e}`;
            }
          })(),
          hasUrlProperty: 'url' in (output[0] || {}),
          urlPropertyType: typeof (output[0] || {}).url,
          descriptors: Object.getOwnPropertyDescriptors(output[0] || {})
        } : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🧪 Debug model output error:', error);

    return NextResponse.json({
      testType: 'debug-model-output',
      success: false,
      error: 'Debug model output failed',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Debug Model Output endpoint ready',
    usage: 'Send POST request with authentication to analyze exact model output',
    note: 'This endpoint provides detailed analysis of what SDXL model returns'
  });
}