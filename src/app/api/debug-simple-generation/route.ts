/**
 * Debug endpoint to test the same models used in baby generation but with simple prompts
 * This will help isolate if the issue is with the models or the complex prompt generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import Replicate from 'replicate';
import { extractImageUrl } from '@/lib/replicate-test';

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

    console.log('🧪 === DEBUG SIMPLE GENERATION ===');

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // Test the same models used in baby generation but with simple prompts
    const models = [
      {
        name: 'SDXL (Primary)',
        id: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
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
      },
      {
        name: 'Stable Diffusion (Fallback 1)',
        id: "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        input: {
          prompt: "professional portrait photography, cute baby portrait",
          negative_prompt: "cartoon, anime, drawing",
          width: 512,
          height: 768,
          num_outputs: 1,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        }
      }
    ];

    const results = [];

    for (const modelConfig of models) {
      console.log(`🎨 Testing ${modelConfig.name}...`);
      const startTime = Date.now();

      try {
        const output = await replicate.run(modelConfig.id as `${string}/${string}:${string}`, {
          input: modelConfig.input
        });

        console.log(`📊 ${modelConfig.name} output type:`, typeof output);
        console.log(`📊 ${modelConfig.name} is array:`, Array.isArray(output));
        console.log(`📊 ${modelConfig.name} constructor:`, output?.constructor?.name);

        // Try to extract URL
        const imageUrl = await extractImageUrl(output);
        const processingTime = Date.now() - startTime;

        const result = {
          model: modelConfig.name,
          success: !!imageUrl,
          processingTime,
          imageUrl: imageUrl,
          outputAnalysis: {
            type: typeof output,
            isArray: Array.isArray(output),
            constructorName: output?.constructor?.name,
            arrayLength: Array.isArray(output) ? output.length : null,
            firstItemType: Array.isArray(output) && output.length > 0 ? typeof output[0] : null,
            firstItemConstructor: Array.isArray(output) && output.length > 0 ? output[0]?.constructor?.name : null
          }
        };

        results.push(result);
        console.log(`✅ ${modelConfig.name} completed:`, result.success ? 'SUCCESS' : 'FAILED');

        // If this model succeeded, we can stop testing
        if (result.success) {
          console.log(`🎯 Found working model: ${modelConfig.name}`);
          break;
        }

      } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`❌ ${modelConfig.name} failed:`, error);

        results.push({
          model: modelConfig.name,
          success: false,
          processingTime,
          error: error instanceof Error ? error.message : String(error),
          outputAnalysis: null
        });
      }
    }

    return NextResponse.json({
      testType: 'debug-simple-generation',
      success: results.some(r => r.success),
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🧪 Debug simple generation error:', error);

    return NextResponse.json({
      testType: 'debug-simple-generation',
      success: false,
      error: 'Debug simple generation failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Debug Simple Generation endpoint ready',
    usage: 'Send POST request with authentication to test model generation with simple prompts',
    note: 'This endpoint tests the same models as baby generation but with simple prompts'
  });
}