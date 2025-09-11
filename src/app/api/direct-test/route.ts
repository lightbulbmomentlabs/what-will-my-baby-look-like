import { NextRequest, NextResponse } from 'next/server';
import { generateBabyImage } from '@/lib/replicate-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Direct baby generation test...');
    
    const result = await generateBabyImage({
      parentImage1: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", // 1x1 pixel
      parentImage2: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", // 1x1 pixel  
      similarity: 50,
      age: 2,
      gender: 'random' as const,
      parent1Name: 'Test',
      parent2Name: 'User',
    });
    
    return NextResponse.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Direct test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}