/**
 * Test utilities for debugging Replicate API responses
 * This helps us understand exactly what format the API returns
 */

import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

interface TestResult {
  success: boolean;
  rawOutput: any;
  outputType: string;
  isArray: boolean;
  arrayLength?: number;
  firstItemType?: string;
  firstItemContent?: any;
  extractedUrl?: string;
  error?: string;
}

/**
 * Test the Replicate API with a simple prompt to see what format we get
 */
export async function testReplicateResponse(): Promise<TestResult> {
  try {
    console.log('🧪 Testing Replicate API response format...');
    
    // Test with the same Stable Diffusion model that works
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

    console.log('📊 Raw API Response:');
    console.log('Type:', typeof output);
    console.log('Is Array:', Array.isArray(output));
    console.log('Content:', JSON.stringify(output, null, 2));

    const result: TestResult = {
      success: true,
      rawOutput: output,
      outputType: typeof output,
      isArray: Array.isArray(output),
    };

    if (Array.isArray(output)) {
      result.arrayLength = output.length;
      if (output.length > 0) {
        result.firstItemType = typeof output[0];
        result.firstItemContent = output[0];
        
        // Try to extract URL using our logic
        const firstOutput = output[0];
        if (typeof firstOutput === 'string') {
          result.extractedUrl = firstOutput;
        } else if (firstOutput && typeof firstOutput === 'object') {
          if ('url' in firstOutput) {
            result.extractedUrl = firstOutput.url as string;
          } else if (firstOutput.toString && firstOutput.toString().startsWith('http')) {
            result.extractedUrl = firstOutput.toString();
          }
        }
      }
    } else if (typeof output === 'string') {
      result.extractedUrl = output;
    }

    console.log('🎯 Extracted URL:', result.extractedUrl);
    console.log('✅ Test completed successfully');

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return {
      success: false,
      rawOutput: null,
      outputType: 'error',
      isArray: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Safe URL extraction that handles all possible response formats
 */
export async function extractImageUrl(output: any): Promise<string | null> {
  console.log('🔍 Extracting URL from:', { type: typeof output, content: output });

  // Handle null/undefined
  if (!output) {
    console.log('❌ Output is null/undefined');
    return null;
  }

  // Handle direct string
  if (typeof output === 'string') {
    const url = output.trim();
    if (url.startsWith('http')) {
      console.log('✅ Found direct string URL:', url);
      return url;
    }
    console.log('❌ String doesn\'t look like URL:', url);
    return null;
  }

  // Handle array responses
  if (Array.isArray(output)) {
    console.log(`📋 Array with ${output.length} items`);
    
    if (output.length === 0) {
      console.log('❌ Empty array');
      return null;
    }

    const firstItem = output[0];
    console.log('🎯 First array item:', { type: typeof firstItem, content: firstItem });

    // Recursively extract from first item
    return await extractImageUrl(firstItem);
  }

  // Handle object responses
  if (typeof output === 'object' && output !== null) {
    console.log('📦 Object response, keys:', Object.keys(output));
    console.log('📦 Own properties:', Object.getOwnPropertyNames(output));
    console.log('📦 Has own properties:', Object.keys(output).length > 0);

    // Check if it's a FileOutput object from Replicate
    if (output.constructor && output.constructor.name === 'FileOutput') {
      console.log('📁 Found FileOutput object, attempting to extract URL...');
      
      // For FileOutput objects, the toString() method returns the URL
      if (typeof output.toString === 'function') {
        const urlString = output.toString();
        console.log('📁 FileOutput.toString() result:', urlString);
        
        if (typeof urlString === 'string' && urlString.startsWith('http')) {
          console.log('✅ Found URL via FileOutput.toString():', urlString);
          return urlString;
        }
      }
      
      // Fallback: check for url property (but avoid the function)
      if ('url' in output && typeof output.url === 'string') {
        console.log('✅ Found URL in FileOutput.url:', output.url);
        return output.url;
      }
      
      // Try other common properties
      const fileProps = ['href', 'download_url', 'file_url', 'path'];
      for (const prop of fileProps) {
        if (prop in output && typeof output[prop] === 'string' && output[prop].startsWith('http')) {
          console.log(`✅ Found URL in FileOutput.${prop}:`, output[prop]);
          return output[prop];
        }
      }
      
      console.log('❌ Could not extract URL from FileOutput object');
      console.log('FileOutput properties:', Object.keys(output));
      return null;
    }

    // Check if it's a ReadableStream
    if (output.constructor && output.constructor.name === 'ReadableStream') {
      console.log('🌊 Found ReadableStream, attempting conversion...');
      
      // ReadableStreams from Replicate are typically URLs in string format
      // We need to read the stream to get the URL
      try {
        const reader = output.getReader();
        const result = await reader.read();
        
        if (!result.done && result.value) {
          // Convert Uint8Array to string if needed
          let streamContent: string;
          if (result.value instanceof Uint8Array) {
            streamContent = new TextDecoder().decode(result.value);
          } else {
            streamContent = String(result.value);
          }
          
          console.log('🌊 Stream content:', streamContent);
          
          // Check if the stream content is a URL
          if (streamContent.startsWith('http')) {
            console.log('✅ Found URL in ReadableStream:', streamContent);
            return streamContent.trim();
          }
        }
        
        reader.releaseLock();
      } catch (streamError) {
        console.log('❌ Error reading stream:', streamError);
      }
      
      // If we can't read the stream, it might be the URL itself
      const streamString = output.toString();
      if (streamString.startsWith('http')) {
        console.log('✅ Found URL via ReadableStream toString():', streamString);
        return streamString;
      }
      
      console.log('❌ ReadableStream does not contain a valid URL');
      return null;
    }

    // If it's an empty object, return null immediately
    if (Object.keys(output).length === 0) {
      console.log('❌ Empty object with no properties');
      return null;
    }

    // Try common URL properties (but check they're not functions!)
    const urlKeys = ['url', 'image', 'src', 'href', 'data', 'imageUrl', 'output_url'];
    
    for (const key of urlKeys) {
      if (output.hasOwnProperty(key)) {  // Only check own properties, not inherited
        const value = output[key];
        console.log(`🔑 Found own property "${key}":`, typeof value, value);
        
        if (typeof value === 'string' && value.startsWith('http')) {
          console.log('✅ Found URL in property:', key, value);
          return value;
        } else if (typeof value === 'function') {
          console.log(`🚫 Skipping "${key}" because it's a function`);
        }
      }
    }

    // Try toString() method
    if (output.toString && typeof output.toString === 'function') {
      try {
        const stringified = output.toString();
        console.log('🔄 toString() result:', stringified);
        
        if (stringified.startsWith('http')) {
          console.log('✅ Found URL via toString():', stringified);
          return stringified;
        }
      } catch (e) {
        console.log('❌ toString() failed:', e);
      }
    }

    console.log('❌ No URL found in object');
    return null;
  }

  console.log('❌ Unknown output type:', typeof output);
  return null;
}