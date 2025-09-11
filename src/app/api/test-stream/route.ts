import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing stream handling...');
    
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: "A cute baby portrait, simple test",
          width: 512,
          height: 512,
          num_outputs: 1,
          num_inference_steps: 20,
        }
      }
    );

    console.log('📊 Stream Test Response:');
    console.log('Type:', typeof output);
    console.log('Constructor:', output?.constructor?.name);
    console.log('Is Array:', Array.isArray(output));
    
    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      console.log('First item type:', typeof firstItem);
      console.log('First item constructor:', firstItem?.constructor?.name);
      
      // Try different approaches to get URL from FileOutput or ReadableStream
      if (firstItem && firstItem.constructor && firstItem.constructor.name === 'FileOutput') {
        console.log('📁 Found FileOutput, testing approaches...');
        
        // Approach 1: Check for url property
        console.log('Approach 1 - url property:', firstItem.url);
        
        // Approach 2: toString method
        console.log('Approach 2 - toString():', firstItem.toString());
        
        // Approach 3: All properties
        console.log('Approach 3 - Object.keys:', Object.keys(firstItem));
        console.log('Approach 3 - getOwnPropertyNames:', Object.getOwnPropertyNames(firstItem));
        
        // Approach 4: Direct property access
        const commonProps = ['url', 'href', 'download_url', 'file_url', 'path', 'src'];
        for (const prop of commonProps) {
          if (prop in firstItem) {
            console.log(`Approach 4 - ${prop}:`, firstItem[prop]);
          }
        }
        
      } else if (firstItem && firstItem.constructor && firstItem.constructor.name === 'ReadableStream') {
        console.log('🌊 Found ReadableStream, testing approaches...');
        
        // Approach 1: Direct toString
        console.log('Approach 1 - toString():', firstItem.toString());
        
        // Approach 2: Try to read the stream
        try {
          const reader = firstItem.getReader();
          const { done, value } = await reader.read();
          console.log('Approach 2 - Stream read:', { done, value });
          
          if (value) {
            if (value instanceof Uint8Array) {
              const decoded = new TextDecoder().decode(value);
              console.log('Approach 2 - Decoded:', decoded);
            } else {
              console.log('Approach 2 - Raw value:', value);
            }
          }
          
          reader.releaseLock();
        } catch (streamError) {
          console.log('Approach 2 - Stream error:', streamError);
        }
        
        // Approach 3: Check if it has URL properties
        console.log('Approach 3 - Object.keys:', Object.keys(firstItem));
        console.log('Approach 3 - Object.getOwnPropertyNames:', Object.getOwnPropertyNames(firstItem));
      }
    }
    
    return NextResponse.json({
      success: true,
      rawOutput: output,
      analysis: {
        type: typeof output,
        isArray: Array.isArray(output),
        length: Array.isArray(output) ? output.length : undefined,
        firstItemType: Array.isArray(output) && output.length > 0 ? typeof output[0] : undefined,
        firstItemConstructor: Array.isArray(output) && output.length > 0 ? output[0]?.constructor?.name : undefined,
      }
    });
    
  } catch (error) {
    console.error('❌ Stream test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}