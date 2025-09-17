/**
 * Simple Replicate test endpoint without authentication to debug output format
 */

import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 === SIMPLE REPLICATE TEST ===');

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    console.log('🔑 API Token exists:', !!process.env.REPLICATE_API_TOKEN);
    console.log('🌟 Testing with simple stable diffusion model...');

    // Test with simple stable diffusion model
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: "A cute baby portrait, professional photography",
          width: 512,
          height: 768,
          num_outputs: 1,
          num_inference_steps: 20,
          guidance_scale: 7.5,
        }
      }
    );

    console.log('📊 === REPLICATE OUTPUT ANALYSIS ===');
    console.log('Type:', typeof output);
    console.log('Is Array:', Array.isArray(output));
    console.log('Array length:', Array.isArray(output) ? output.length : 'N/A');
    console.log('Constructor name:', output?.constructor?.name);
    console.log('Own properties:', Object.getOwnPropertyNames(output || {}));
    console.log('Keys:', Object.keys(output || {}));

    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      console.log('📋 First array item:');
      console.log('  Type:', typeof firstItem);
      console.log('  Constructor:', firstItem?.constructor?.name);
      console.log('  Own properties:', Object.getOwnPropertyNames(firstItem || {}));
      console.log('  Keys:', Object.keys(firstItem || {}));

      // Try toString
      if (firstItem && typeof firstItem.toString === 'function') {
        try {
          const stringified = firstItem.toString();
          console.log('  toString():', stringified);
          console.log('  toString() starts with http:', stringified.startsWith('http'));
        } catch (e) {
          console.log('  toString() error:', e);
        }
      }

      // Check if it's a FileOutput object
      if (firstItem && firstItem.constructor && firstItem.constructor.name === 'FileOutput') {
        console.log('  📁 FileOutput detected');

        // Try url property
        if ('url' in firstItem) {
          console.log('  url property type:', typeof firstItem.url);
          if (typeof firstItem.url === 'string') {
            console.log('  url property value:', firstItem.url);
          } else if (typeof firstItem.url === 'function') {
            try {
              const urlResult = firstItem.url();
              console.log('  url() function result:', urlResult);
            } catch (e) {
              console.log('  url() function error:', e);
            }
          }
        }
      }
    }

    return NextResponse.json({
      testType: 'simple-replicate-test',
      success: true,
      rawOutput: {
        type: typeof output,
        isArray: Array.isArray(output),
        arrayLength: Array.isArray(output) ? output.length : null,
        constructorName: output?.constructor?.name,
        keys: Object.keys(output || {}),
        ownProperties: Object.getOwnPropertyNames(output || {}),
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
          })()
        } : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🧪 Simple Replicate test error:', error);

    return NextResponse.json({
      testType: 'simple-replicate-test',
      success: false,
      error: 'Simple test failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}