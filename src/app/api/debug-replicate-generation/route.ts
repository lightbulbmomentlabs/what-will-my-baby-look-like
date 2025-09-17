/**
 * Debug endpoint to test Replicate image generation with detailed logging
 * Shows exactly what Replicate returns and why URL extraction fails
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { generateBabyImage } from '@/lib/replicate-client';

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

    console.log('🧪 === DEBUG REPLICATE GENERATION ===');

    // Create minimal test request with proper typing
    const testRequest: {
      parentImage1: string;
      parentImage2: string;
      similarity: number;
      age: number;
      gender: 'male' | 'female' | 'random';
      parent1Name: string;
      parent2Name: string;
    } = {
      parentImage1: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', // 1x1 pixel test image
      parentImage2: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', // 1x1 pixel test image
      similarity: 50,
      age: 2,
      gender: 'random' as const,
      parent1Name: 'Test Parent 1',
      parent2Name: 'Test Parent 2'
    };

    console.log('🧪 Starting test generation with minimal images...');

    // Call the actual generation function
    const result = await generateBabyImage(testRequest);

    console.log('🧪 Generation result received:', {
      success: result.success,
      hasImageUrl: !!result.imageUrl,
      imageUrlType: typeof result.imageUrl,
      imageUrlLength: result.imageUrl?.length || 0,
      imageUrlStart: result.imageUrl?.substring(0, 100) || 'N/A',
      error: result.error,
      processingTime: result.processingTime
    });

    // Enhanced response with debugging info
    return NextResponse.json({
      testType: 'debug-replicate-generation',
      success: result.success,
      originalResult: result,
      debug: {
        imageUrlPresent: !!result.imageUrl,
        imageUrlType: typeof result.imageUrl,
        imageUrlValid: result.imageUrl ? result.imageUrl.startsWith('http') || result.imageUrl.startsWith('data:') : false,
        imageUrlSample: result.imageUrl?.substring(0, 100) || null,
        error: result.error,
        processingTime: result.processingTime
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🧪 Debug generation error:', error);

    return NextResponse.json({
      testType: 'debug-replicate-generation',
      success: false,
      error: 'Debug generation failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Debug Replicate Generation endpoint ready',
    usage: 'Send POST request with authentication to test generation',
    note: 'This endpoint uses minimal test images to debug the generation process'
  });
}