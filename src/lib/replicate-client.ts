/**
 * Replicate AI client and prompt generation utilities
 */

import Replicate from 'replicate';
import { generateBabyName } from './baby-name-generator';
import { extractImageUrl } from './replicate-test';

interface ParentFeatures {
  skinTone: string;
  eyeColor: string;
  hairColor: string;
  faceShape: string;
  features: string;
}

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export interface BabyGenerationRequest {
  parentImage1: string; // base64 string
  parentImage2: string; // base64 string
  similarity: number; // 0-100
  age: number; // 1-5
  gender: 'male' | 'female' | 'random';
  parent1Name?: string;
  parent2Name?: string;
}

export interface BabyGenerationResponse {
  success: boolean;
  imageUrl?: string;
  babyName?: {
    name: string;
    explanation: string;
  };
  error?: string;
  processingTime?: number;
  remainingCredits?: number;
}

/**
 * Analyze parent image to extract visual characteristics with retry logic
 */
async function analyzeParentFeatures(imageBase64: string, retryCount: number = 0): Promise<ParentFeatures> {
  const maxRetries = 2;
  
  try {
    console.log(`🔍 Analyzing parent features (attempt ${retryCount + 1})...`);
    
    const output = await replicate.run(
      "yorickvp/llava-13b:b5f6212d032508382d61ff00469ddda3e32fd8a0e75dc39d8a4191bb742157fb",
      {
        input: {
          image: imageBase64,
          prompt: "Analyze this person's physical features for genetic inheritance. Describe: 1) Skin tone and ethnicity (be specific: light/fair/olive/medium/brown/dark/black, African/Caucasian/Asian/Hispanic/Latino/Mixed), 2) Eye color (brown/blue/green/hazel/amber), 3) Hair color and texture (black/brown/blonde/red/gray, straight/wavy/curly), 4) Face shape (round/oval/square/heart/long/angular), 5) Other distinctive features that a child might inherit."
        }
      }
    );

    const description = Array.isArray(output) ? output.join('') : String(output);
    console.log('👤 Parent analysis result:', description);
    
    // Enhanced feature extraction with better parsing
    const features = extractFeaturesFromDescription(description);
    
    // Validate that we got meaningful features
    if (features.skinTone === 'unknown' && features.eyeColor === 'unknown' && retryCount < maxRetries) {
      console.log('⚠️ Analysis returned unclear results, retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return analyzeParentFeatures(imageBase64, retryCount + 1);
    }
    
    return features;
    
  } catch (error) {
    console.error(`❌ Error analyzing parent features (attempt ${retryCount + 1}):`, error);
    
    // Retry with exponential backoff
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return analyzeParentFeatures(imageBase64, retryCount + 1);
    }
    
    console.log('🔄 Vision analysis failed, using enhanced fallback...');
    return getEnhancedFallbackFeatures(error);
  }
}

/**
 * Enhanced feature extraction with better pattern matching
 */
function extractFeaturesFromDescription(description: string): ParentFeatures {
  const lowerDesc = description.toLowerCase();
  
  // Enhanced skin tone detection with ethnicity patterns
  const skinTone = extractFeature(lowerDesc, 
    ['skin', 'complexion', 'tone', 'ethnicity'],
    ['very light', 'light', 'fair', 'pale', 'medium-light', 'medium', 'olive', 'tan', 'brown', 'dark brown', 'dark', 'deep', 'black', 'ebony']
  ) || detectEthnicityBasedSkinTone(lowerDesc);
  
  // Enhanced eye color detection
  const eyeColor = extractFeature(lowerDesc,
    ['eye', 'eyes'],
    ['dark brown', 'light brown', 'brown', 'hazel-brown', 'hazel', 'green-hazel', 'green', 'blue-green', 'blue', 'light blue', 'dark blue', 'amber', 'gray', 'grey']
  );
  
  // Enhanced hair color detection
  const hairColor = extractFeature(lowerDesc,
    ['hair'],
    ['jet black', 'black', 'dark brown', 'brown', 'light brown', 'auburn', 'red', 'strawberry blonde', 'blonde', 'light blonde', 'dirty blonde', 'gray', 'grey', 'white', 'silver']
  );
  
  // Enhanced face shape detection
  const faceShape = extractFeature(lowerDesc,
    ['face', 'shape', 'facial'],
    ['round', 'oval', 'square', 'rectangular', 'heart', 'diamond', 'long', 'angular', 'triangular']
  );
  
  return {
    skinTone: skinTone || 'medium',
    eyeColor: eyeColor || 'brown',
    hairColor: hairColor || 'dark brown',
    faceShape: faceShape || 'oval',
    features: description.slice(0, 300) // Keep more of the description for better context
  };
}

/**
 * Detect skin tone based on ethnicity mentions
 */
function detectEthnicityBasedSkinTone(description: string): string | null {
  if (description.includes('african') || description.includes('black')) return 'dark';
  if (description.includes('caucasian') || description.includes('european')) return 'light';
  if (description.includes('asian') || description.includes('east asian')) return 'medium';
  if (description.includes('hispanic') || description.includes('latino')) return 'medium';
  if (description.includes('middle eastern')) return 'olive';
  if (description.includes('mixed') || description.includes('biracial')) return 'medium';
  return null;
}

/**
 * Provide enhanced fallback features based on error context
 */
function getEnhancedFallbackFeatures(error: unknown): ParentFeatures {
  console.log('🎯 Generating enhanced fallback features...');
  
  // Use more diverse defaults instead of always defaulting to the same features
  const fallbackOptions = [
    { skinTone: 'light', eyeColor: 'blue', hairColor: 'blonde', faceShape: 'oval' },
    { skinTone: 'medium', eyeColor: 'brown', hairColor: 'brown', faceShape: 'round' },
    { skinTone: 'olive', eyeColor: 'hazel', hairColor: 'dark brown', faceShape: 'heart' },
    { skinTone: 'dark', eyeColor: 'dark brown', hairColor: 'black', faceShape: 'angular' }
  ];
  
  // Use a semi-random selection based on current time to vary fallbacks
  const index = Math.floor(Date.now() / 1000) % fallbackOptions.length;
  const selected = fallbackOptions[index];
  
  return {
    ...selected,
    features: 'fallback features - vision analysis unavailable'
  };
}

/**
 * Extract specific feature from description text
 */
function extractFeature(text: string, searchTerms: string[], possibleValues: string[]): string | null {
  const lowerText = text.toLowerCase();
  
  for (const value of possibleValues) {
    for (const term of searchTerms) {
      if (lowerText.includes(`${value} ${term}`) || lowerText.includes(`${term} ${value}`)) {
        return value;
      }
    }
  }
  
  // Look for value anywhere in text if not found with terms
  for (const value of possibleValues) {
    if (lowerText.includes(value)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Generate age-specific description for prompts
 */
function getAgeDescription(age: number): string {
  const ageDescriptions = {
    1: 'newborn infant, 12 months old, very chubby cheeks, minimal hair, large eyes, very soft facial features',
    2: 'toddler, 24 months old, round face, developing facial structure, soft baby features, curious expression',
    3: 'young child, 36 months old, more defined features, playful expression, developing personality in eyes',
    4: 'preschooler, 4 years old, clearer facial definition, bright intelligent eyes, beginning to lose baby fat',
    5: 'kindergarten age child, 5 years old, more mature facial structure, confident expression, defined features',
  };
  
  return ageDescriptions[age as keyof typeof ageDescriptions] || ageDescriptions[2];
}

/**
 * Generate gender-specific description for prompts
 */
function getGenderDescription(gender: string): string {
  const genderDescriptions = {
    male: 'baby boy, masculine infant features, strong jawline (age appropriate), broader face structure',
    female: 'baby girl, feminine infant features, softer jawline, delicate facial structure',
    random: 'gender-neutral baby, balanced facial features, natural expression',
  };
  
  return genderDescriptions[gender as keyof typeof genderDescriptions] || genderDescriptions.random;
}

/**
 * Generate similarity-based blending description
 */
function getSimilarityDescription(similarity: number, parent1Name?: string, parent2Name?: string): string {
  const p1Name = parent1Name || 'parent 1';
  const p2Name = parent2Name || 'parent 2';
  
  if (similarity <= 20) {
    return `strongly resembling ${p1Name}, dominant ${p1Name} features, minimal traits from ${p2Name}`;
  } else if (similarity <= 40) {
    return `primarily resembling ${p1Name}, with ${p1Name}'s dominant features and subtle ${p2Name} characteristics`;
  } else if (similarity <= 60) {
    return `balanced blend of both parents, equal mix of ${p1Name} and ${p2Name} features`;
  } else if (similarity <= 80) {
    return `primarily resembling ${p2Name}, with ${p2Name}'s dominant features and subtle ${p1Name} characteristics`;
  } else {
    return `strongly resembling ${p2Name}, dominant ${p2Name} features, minimal traits from ${p1Name}`;
  }
}

/**
 * Generate comprehensive prompt for baby image generation with parent features
 */
export async function generateBabyPrompt(
  request: BabyGenerationRequest, 
  parent1Features: ParentFeatures, 
  parent2Features: ParentFeatures
): Promise<string> {
  const ageDesc = getAgeDescription(request.age);
  const genderDesc = getGenderDescription(request.gender);
  const similarityDesc = getSimilarityDescription(
    request.similarity,
    request.parent1Name,
    request.parent2Name
  );
  
  // Blend parent features based on similarity
  const blendedFeatures = blendParentFeatures(parent1Features, parent2Features, request.similarity);
  
  // Generate enhanced skin tone emphasis for SDXL
  const skinToneEmphasis = generateSkinToneEmphasis(blendedFeatures.skinTone);
  
  // Simplified and clear approach - avoid keyword pollution
  const compositionStyle = "closeup portrait, headshot, professional baby photography";
  
  // Strong color emphasis to prevent black and white or sepia
  const colorEmphasis = "full color photograph, vibrant natural colors";
  
  return `${compositionStyle}, ${colorEmphasis}, professional portrait of ${ageDesc} ${genderDesc}, ${skinToneEmphasis}, ${blendedFeatures.eyeColor} eyes, ${blendedFeatures.hairColor} hair, ${blendedFeatures.faceShape} face shape, ${similarityDesc}, natural baby skin texture, realistic human infant, studio portrait lighting, soft focus background, beautiful natural lighting, high quality photography`;
}

/**
 * Generate emphasized skin tone descriptions to overcome SDXL bias
 */
function generateSkinToneEmphasis(skinTone: string): string {
  const skinToneMappings = {
    // Light skin tones
    'light': 'light skin tone, fair complexion, pale skin',
    'fair': 'fair skin tone, light complexion, pale skin',
    'pale': 'pale skin tone, very light complexion, fair skin',
    
    // Medium skin tones  
    'medium-light': 'medium-light skin tone, warm olive complexion',
    'medium': 'medium skin tone, natural brown complexion, warm skin',
    'olive': 'olive skin tone, medium Mediterranean complexion, warm undertones',
    'tan': 'tan skin tone, sun-kissed bronze complexion, medium brown skin',
    
    // Darker skin tones - need extra emphasis for SDXL
    'brown': '(brown skin tone:1.3), rich brown complexion, medium-dark skin',
    'dark brown': '(dark brown skin tone:1.4), deep brown complexion, rich dark skin',
    'dark': '(dark skin tone:1.4), deep brown complexion, rich dark skin, dark brown skin',
    'black': '(very dark skin tone:1.5), deep ebony complexion, rich dark brown skin',
    'ebony': '(ebony skin tone:1.5), very dark complexion, deep rich brown skin'
  };
  
  // Return emphasized version or fallback
  return skinToneMappings[skinTone as keyof typeof skinToneMappings] || `${skinTone} skin tone, natural complexion`;
}

/**
 * Intelligently blend parent features based on similarity percentage and genetic inheritance patterns
 */
function blendParentFeatures(parent1: ParentFeatures, parent2: ParentFeatures, similarity: number): ParentFeatures {
  const blendRatio = similarity / 100;
  console.log(`🧬 Blending features with ratio: ${blendRatio} (${similarity}% similarity)`);
  console.log(`👤 Parent 1: ${parent1.skinTone} skin, ${parent1.eyeColor} eyes, ${parent1.hairColor} hair`);
  console.log(`👤 Parent 2: ${parent2.skinTone} skin, ${parent2.eyeColor} eyes, ${parent2.hairColor} hair`);
  
  // Skin tone blending with realistic genetic patterns
  const blendedSkinTone = blendSkinTone(parent1.skinTone, parent2.skinTone, blendRatio);
  
  // Eye color blending with genetic dominance
  const blendedEyeColor = blendEyeColor(parent1.eyeColor, parent2.eyeColor, blendRatio);
  
  // Hair color blending with genetic patterns
  const blendedHairColor = blendHairColor(parent1.hairColor, parent2.hairColor, blendRatio);
  
  // Face shape blending
  const blendedFaceShape = blendFaceShape(parent1.faceShape, parent2.faceShape, blendRatio);
  
  const result = {
    skinTone: blendedSkinTone,
    eyeColor: blendedEyeColor,
    hairColor: blendedHairColor,
    faceShape: blendedFaceShape,
    features: `inheriting ${parent1.skinTone} and ${parent2.skinTone} skin tones, ${parent1.eyeColor} and ${parent2.eyeColor} eye colors, balanced facial features`
  };
  
  console.log(`👶 Blended result: ${result.skinTone} skin, ${result.eyeColor} eyes, ${result.hairColor} hair, ${result.faceShape} face`);
  return result;
}

/**
 * Blend skin tones realistically
 */
function blendSkinTone(skin1: string, skin2: string, ratio: number): string {
  const toneMap = {
    'very light': 1, 'light': 2, 'fair': 2, 'pale': 1,
    'medium-light': 3, 'medium': 4, 'olive': 4,
    'tan': 5, 'brown': 6, 'dark brown': 7, 'dark': 8, 'black': 9, 'ebony': 9
  };
  
  const tone1 = toneMap[skin1 as keyof typeof toneMap] || 4;
  const tone2 = toneMap[skin2 as keyof typeof toneMap] || 4;
  
  // Blend towards the middle with ratio influence
  const blended = Math.round(tone1 * (1 - ratio) + tone2 * ratio);
  
  const reverseMap = {
    1: 'light', 2: 'light', 3: 'medium-light', 4: 'medium',
    5: 'tan', 6: 'brown', 7: 'dark brown', 8: 'dark', 9: 'dark'
  };
  
  return reverseMap[blended as keyof typeof reverseMap] || 'medium';
}

/**
 * Blend eye colors with genetic dominance
 */
function blendEyeColor(eye1: string, eye2: string, ratio: number): string {
  // Brown is dominant over other colors
  if ((eye1.includes('brown') || eye2.includes('brown')) && Math.random() > 0.3) {
    return eye1.includes('brown') ? eye1 : eye2;
  }
  
  // For non-brown combinations, blend based on ratio
  if (ratio < 0.3) return eye1;
  if (ratio > 0.7) return eye2;
  
  // Create mixed descriptions for middle ratios
  if (eye1 !== eye2) {
    return `${eye1}-${eye2} mixed`;
  }
  return eye1;
}

/**
 * Blend hair colors realistically
 */
function blendHairColor(hair1: string, hair2: string, ratio: number): string {
  // Dark colors tend to be dominant
  const darkColors = ['black', 'jet black', 'dark brown'];
  const lightColors = ['blonde', 'light blonde', 'strawberry blonde'];
  
  const hair1Dark = darkColors.some(color => hair1.includes(color));
  const hair2Dark = darkColors.some(color => hair2.includes(color));
  
  // If one parent has very dark hair, it often dominates
  if (hair1Dark && !hair2Dark && Math.random() > 0.4) return hair1;
  if (hair2Dark && !hair1Dark && Math.random() > 0.4) return hair2;
  
  // Otherwise blend based on ratio
  if (ratio < 0.3) return hair1;
  if (ratio > 0.7) return hair2;
  
  // Middle ground - pick darker of the two or create blend
  if (hair1Dark || hair2Dark) {
    return hair1Dark ? hair1 : hair2;
  }
  
  return hair1; // Default to first parent for similar colors
}

/**
 * Blend face shapes
 */
function blendFaceShape(shape1: string, shape2: string, ratio: number): string {
  // Some shapes blend better than others
  const softShapes = ['round', 'oval', 'heart'];
  const angularShapes = ['square', 'rectangular', 'angular'];
  
  // If both are similar types, blend smoothly
  const both1Soft = softShapes.includes(shape1);
  const both2Soft = softShapes.includes(shape2);
  
  if (both1Soft && both2Soft) {
    return ratio < 0.5 ? shape1 : shape2;
  }
  
  if (!both1Soft && !both2Soft) {
    return ratio < 0.5 ? shape1 : shape2;
  }
  
  // Mixed soft/angular - tend toward softer baby features
  if (both1Soft) return shape1;
  if (both2Soft) return shape2;
  
  return ratio < 0.5 ? shape1 : shape2;
}

/**
 * Model configurations for fallback chain
 */
const GENERATION_MODELS = [
  {
    name: 'SDXL (Primary)',
    id: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    config: {
      prompt: (prompt: string) => `RAW photo, ${prompt}`,
      negative_prompt: "(deformed iris, deformed pupils), text, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, (extra fingers), (mutated hands), poorly drawn hands, mutation, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, (fused fingers), (too many fingers), long neck, camera, twins, collage, grid, montage, (black and white:1.3), (monochrome:1.3), (grayscale:1.2), cartoon, anime, drawing, painting, 3d render, cgi, illustration, wrong skin tone, pale when should be dark, light skin when should be dark, incorrect complexion, washed out skin, bleached appearance",
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
    config: {
      prompt: (prompt: string) => `professional portrait photography, ${prompt}`,
      negative_prompt: "cartoon, anime, drawing, painting, 3d render, cgi, illustration, multiple babies, twins, text, blurry, deformed",
      width: 512,
      height: 768,
      num_outputs: 1,
      num_inference_steps: 20,
      guidance_scale: 7.5,
    }
  },
  {
    name: 'Simple SDXL (Fallback 2)',
    id: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    config: {
      prompt: (prompt: string) => prompt,
      negative_prompt: "cartoon, multiple babies, 3d render",
      width: 768,
      height: 1024,
      num_outputs: 1,
      num_inference_steps: 20,
      guidance_scale: 5.0,
      scheduler: "DPMSolverMultistep",
    }
  }
];

/**
 * Try generating with a specific model configuration
 */
async function tryGenerateWithModel(modelConfig: typeof GENERATION_MODELS[0], prompt: string): Promise<unknown> {
  console.log(`🎨 Trying generation with ${modelConfig.name}...`);
  
  const input = {
    ...modelConfig.config,
    prompt: modelConfig.config.prompt(prompt),
  };
  
  console.log(`📝 Using prompt: ${input.prompt}`);
  console.log(`🚫 Using negative prompt: ${input.negative_prompt}`);
  
  return await replicate.run(modelConfig.id, { input });
}

/**
 * Call Replicate API for baby generation with fallback chain
 */
export async function generateBabyImage(request: BabyGenerationRequest): Promise<BabyGenerationResponse> {
  const startTime = Date.now();
  
  try {
    // Generate baby name
    const babyName = generateBabyName(request.parent1Name, request.parent2Name);
    
    // Analyze parent features from uploaded images
    console.log('🔍 Analyzing parent features...');
    const [parent1Features, parent2Features] = await Promise.all([
      analyzeParentFeatures(request.parentImage1),
      analyzeParentFeatures(request.parentImage2)
    ]);
    
    console.log('👤 Parent 1 features:', parent1Features);
    console.log('👤 Parent 2 features:', parent2Features);
    
    // Generate the prompt with parent features
    const prompt = await generateBabyPrompt(request, parent1Features, parent2Features);
    console.log('📝 Generated prompt:', prompt);
    
    // Try each model in the fallback chain
    let lastError = null;
    for (let i = 0; i < GENERATION_MODELS.length; i++) {
      const modelConfig = GENERATION_MODELS[i];
      
      try {
        console.log(`\n🎯 Attempt ${i + 1}/${GENERATION_MODELS.length}: ${modelConfig.name}`);
        const output = await tryGenerateWithModel(modelConfig, prompt);
        
        // Try to extract image URL from this attempt
        console.log('🔍 Extracting image URL from model output...');
        const imageUrl = await extractImageUrlWithFallbacks(output);
        
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
          const processingTime = Date.now() - startTime;
          console.log(`✅ SUCCESS with ${modelConfig.name}! Generated in ${processingTime}ms`);
          
          return {
            success: true,
            imageUrl: imageUrl,
            babyName,
            processingTime,
          };
        } else {
          console.log(`❌ ${modelConfig.name} failed to produce valid image URL: ${imageUrl}`);
          lastError = `Invalid image URL from ${modelConfig.name}`;
        }
        
      } catch (modelError) {
        console.error(`❌ ${modelConfig.name} failed:`, modelError);
        lastError = modelError;
        
        // If it's a rate limit or payment error, don't try other models
        if (modelError instanceof Error) {
          if (modelError.message.includes('rate limit') || modelError.message.includes('402')) {
            break;
          }
        }
        
        // Add delay between attempts to avoid overwhelming the API
        if (i < GENERATION_MODELS.length - 1) {
          console.log('⏳ Waiting 2 seconds before trying next model...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // All models failed
    const processingTime = Date.now() - startTime;
    console.error('❌ All models in fallback chain failed');
    
    return {
      success: false,
      error: `Generation failed with all models. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      processingTime,
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Fatal error in generation pipeline:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'API rate limit exceeded. Please try again in a few minutes.',
          processingTime,
        };
      }
      if (error.message.includes('402') || error.message.includes('Payment Required')) {
        return {
          success: false,
          error: 'AI service is currently unavailable due to billing limits. Please try again later.',
          processingTime,
        };
      }
      if (error.message.includes('NSFW')) {
        return {
          success: false,
          error: 'The AI service detected potentially inappropriate content. Please try different photos or try again.',
          processingTime,
        };
      }
      
      return {
        success: false,
        error: `Generation failed: ${error.message}`,
        processingTime,
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      processingTime,
    };
  }
}

/**
 * Enhanced image URL extraction with multiple fallback strategies
 */
async function extractImageUrlWithFallbacks(output: unknown): Promise<string | null> {
  console.log('🔍 Starting enhanced URL extraction...');
  console.log('Type:', typeof output);
  console.log('Is Array:', Array.isArray(output));
  console.log('Array length:', Array.isArray(output) ? output.length : 'N/A');
  
  // Strategy 1: Try our robust extraction function first
  try {
    const url = await extractImageUrl(output);
    if (url && url.startsWith('http')) {
      console.log('✅ Strategy 1 (extractImageUrl) succeeded:', url);
      return url;
    }
  } catch (error) {
    console.log('❌ Strategy 1 failed:', error);
  }
  
  // Strategy 2: Direct ReadableStream handling (most common case)
  if (Array.isArray(output) && output.length > 0) {
    const firstItem = output[0];
    
    if (firstItem && firstItem.constructor && firstItem.constructor.name === 'ReadableStream') {
      console.log('🌊 Strategy 2: Direct ReadableStream processing');
      try {
        const reader = firstItem.getReader();
        const chunks = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        reader.releaseLock();
        
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        
        const base64Data = Buffer.from(combined).toString('base64');
        const imageUrl = `data:image/png;base64,${base64Data}`;
        
        console.log('✅ Strategy 2 succeeded: base64 data URL created');
        return imageUrl;
        
      } catch (streamError) {
        console.log('❌ Strategy 2 failed:', streamError);
      }
    }
  }
  
  // Strategy 3: Simple string or direct URL
  if (typeof output === 'string' && output.startsWith('http')) {
    console.log('✅ Strategy 3 succeeded: direct string URL');
    return output;
  }
  
  console.log('❌ All extraction strategies failed');
  return null;
}

/**
 * Check Replicate API status and limits
 */
export async function checkReplicateStatus(): Promise<{ 
  available: boolean; 
  error?: string;
}> {
  try {
    // Try to get account info to verify API key and service status
    await replicate.accounts.current();
    return { available: true };
  } catch (error) {
    console.error('Replicate status check failed:', error);
    return { 
      available: false, 
      error: error instanceof Error ? error.message : 'Service unavailable'
    };
  }
}