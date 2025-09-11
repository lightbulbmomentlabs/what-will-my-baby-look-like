import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    console.log('=== REPLICATE DEBUG TEST ===');
    console.log('API Token exists:', !!process.env.REPLICATE_API_TOKEN);
    console.log('API Token length:', process.env.REPLICATE_API_TOKEN?.length);
    
    // Test 1: Check account status
    console.log('Testing account access...');
    try {
      const account = await replicate.accounts.current();
      console.log('Account access successful:', account.username);
    } catch (accountError) {
      console.error('Account access failed:', accountError);
      return NextResponse.json({
        success: false,
        error: 'Account access failed',
        details: accountError instanceof Error ? accountError.message : String(accountError)
      });
    }
    
    // Test 2: Try a simple, free model first
    console.log('Testing with a simple model...');
    try {
      const output = await replicate.run(
        "replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
        {
          input: {
            text: "hello"
          }
        }
      );
      console.log('Hello world model successful:', output);
    } catch (helloError) {
      console.error('Hello world model failed:', helloError);
    }
    
    // Test 3: Try our target model with ReadableStream handling
    console.log('Testing target stable diffusion model...');
    try {
      const output = await replicate.run(
        "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
        {
          input: {
            prompt: "a simple test image",
            width: 512,
            height: 512,
            num_outputs: 1,
            num_inference_steps: 20,
          }
        }
      );
      
      console.log('Target model successful!');
      console.log('Output type:', typeof output);
      console.log('Output array length:', Array.isArray(output) ? output.length : 'N/A');
      
      if (Array.isArray(output) && output.length > 0) {
        const firstItem = output[0];
        console.log('First item constructor:', firstItem?.constructor?.name);
        
        // Handle ReadableStream
        if (firstItem && firstItem.constructor && firstItem.constructor.name === 'ReadableStream') {
          console.log('🌊 ReadableStream detected - attempting to convert');
          try {
            const reader = firstItem.getReader();
            const chunks = [];
            
            // Read all chunks
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
            
            reader.releaseLock();
            
            // Combine chunks
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
              combined.set(chunk, offset);
              offset += chunk.length;
            }
            
            // Convert to base64
            const base64Data = Buffer.from(combined).toString('base64');
            const imageUrl = `data:image/png;base64,${base64Data}`;
            
            console.log('✅ Successfully converted ReadableStream to base64');
            console.log('Base64 length:', base64Data.length);
            
            return NextResponse.json({
              success: true,
              message: 'ReadableStream converted successfully',
              imageUrl: imageUrl.substring(0, 100) + '...' // Truncate for display
            });
            
          } catch (streamError) {
            console.error('❌ Failed to read ReadableStream:', streamError);
            return NextResponse.json({
              success: false,
              error: 'Failed to read ReadableStream',
              details: streamError instanceof Error ? streamError.message : String(streamError)
            });
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'All tests passed - no ReadableStream detected',
        outputType: typeof output,
        isArray: Array.isArray(output)
      });
      
    } catch (targetError) {
      console.error('Target model failed:', targetError);
      
      if (targetError instanceof Error) {
        return NextResponse.json({
          success: false,
          error: 'Target model failed',
          details: targetError.message,
          name: targetError.name
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Target model failed',
        details: String(targetError)
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}