/**
 * API Route for secure baby image generation via Replicate
 * Now requires authentication and credits
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { generateBabyImage, checkReplicateStatus } from '@/lib/replicate-client';
import { trackGeneration, saveGeneratedImage } from '@/lib/supabase';
import { hasEnoughCredits, deductCredits, getOrCreateUser } from '@/lib/credits';
import { storeImagePermanently } from '@/lib/image-storage';
import { authenticateApiRequest, createAuthErrorResponse } from '@/lib/api-auth';

// Credits required per generation
const CREDITS_PER_GENERATION = 1;

/**
 * Validate base64 image data
 */
function validateImageData(imageData: string): boolean {
  if (!imageData || typeof imageData !== 'string') {
    return false;
  }
  
  // Check if it's a valid base64 data URL
  const base64Regex = /^data:image\/(jpeg|jpg|png|webp);base64,/;
  return base64Regex.test(imageData);
}


export async function POST(request: NextRequest) {
  console.log('🚀 === BABY GENERATION REQUEST START ===');
  console.log('📍 Environment:', process.env.NODE_ENV);
  console.log('🌐 Vercel Environment:', process.env.VERCEL_ENV);
  console.log('🔑 REPLICATE_API_TOKEN exists:', !!process.env.REPLICATE_API_TOKEN);
  console.log('🔑 REPLICATE_API_TOKEN length:', process.env.REPLICATE_API_TOKEN?.length || 0);

  try {
    // Authenticate the request using robust multi-method approach
    console.log('🔐 Starting authentication...');
    const authResult = await authenticateApiRequest(request);
    console.log('🔐 Auth result:', { success: authResult.success, method: authResult.authMethod, hasUserId: !!authResult.userId });

    if (!authResult.success || !authResult.userId) {
      console.log('❌ Authentication failed:', authResult.error);
      return NextResponse.json(createAuthErrorResponse(authResult), { status: 401 });
    }

    const { userId } = authResult;
    console.log('✅ Authentication successful, userId:', userId);


    // Parse request body
    console.log('📝 Parsing request body...');
    const body = await request.json();
    console.log('📝 Request body received:', {
      hasParentImage1: !!body.parentImage1,
      hasParentImage2: !!body.parentImage2,
      similarity: body.similarity,
      age: body.age,
      gender: body.gender
    });
    
    // Validate required fields
    const { parentImage1, parentImage2, similarity, age, gender, parent1Name, parent2Name } = body;
    
    if (!parentImage1 || !parentImage2) {
      return NextResponse.json({
        success: false,
        error: 'Both parent images are required',
      }, { status: 400 });
    }
    
    // Validate image data
    if (!validateImageData(parentImage1) || !validateImageData(parentImage2)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid image data format',
      }, { status: 400 });
    }
    
    // Validate other parameters
    if (typeof similarity !== 'number' || similarity < 0 || similarity > 100) {
      return NextResponse.json({
        success: false,
        error: 'Similarity must be a number between 0 and 100',
      }, { status: 400 });
    }
    
    if (typeof age !== 'number' || age < 1 || age > 5) {
      return NextResponse.json({
        success: false,
        error: 'Age must be a number between 1 and 5',
      }, { status: 400 });
    }
    
    if (!['male', 'female', 'random'].includes(gender)) {
      return NextResponse.json({
        success: false,
        error: 'Gender must be male, female, or random',
      }, { status: 400 });
    }

    // Ensure user exists in database (create with free credit if needed)
    console.log('👤 Getting or creating user...');
    const userResult = await getOrCreateUser(userId);
    console.log('👤 User result:', { success: userResult.success, error: userResult.error });
    if (!userResult.success) {
      console.log('❌ Failed to get/create user:', userResult.error);
      return NextResponse.json({
        success: false,
        error: userResult.error || 'Failed to access user account',
      }, { status: 500 });
    }

    // Check if user has enough credits
    console.log('💰 Checking user credits...');
    const creditsCheck = await hasEnoughCredits(userId, CREDITS_PER_GENERATION);
    console.log('💰 Credits check result:', {
      success: creditsCheck.success,
      hasCredits: creditsCheck.hasCredits,
      currentCredits: creditsCheck.currentCredits,
      error: creditsCheck.error
    });
    if (!creditsCheck.success) {
      console.log('❌ Failed to check credits:', creditsCheck.error);
      return NextResponse.json({
        success: false,
        error: creditsCheck.error || 'Failed to check credits',
      }, { status: 500 });
    }

    if (!creditsCheck.hasCredits) {
      console.log('❌ Insufficient credits:', creditsCheck.currentCredits, 'need:', CREDITS_PER_GENERATION);
      return NextResponse.json({
        success: false,
        error: `Insufficient credits. You have ${creditsCheck.currentCredits || 0} credits but need ${CREDITS_PER_GENERATION}.`,
        insufficientCredits: true,
        currentCredits: creditsCheck.currentCredits || 0,
        requiredCredits: CREDITS_PER_GENERATION,
      }, { status: 402 }); // 402 Payment Required
    }

    // Check Replicate service status
    console.log('🤖 Checking Replicate service status...');
    const serviceStatus = await checkReplicateStatus();
    console.log('🤖 Service status:', { available: serviceStatus.available, error: serviceStatus.error });
    if (!serviceStatus.available) {
      console.log('❌ Replicate service unavailable:', serviceStatus.error);
      return NextResponse.json({
        success: false,
        error: 'AI generation service is currently unavailable. Please try again later.',
        serviceUnavailable: true,
      }, { status: 503 });
    }
    
    // Generate baby image
    console.log('🎨 Starting baby image generation...');
    const generationRequest = {
      parentImage1,
      parentImage2,
      similarity,
      age,
      gender,
      parent1Name,
      parent2Name,
    };
    console.log('🎨 Generation request prepared:', {
      similarity,
      age,
      gender,
      hasParent1Name: !!parent1Name,
      hasParent2Name: !!parent2Name
    });

    const result = await generateBabyImage(generationRequest);
    console.log('🎨 Generation result:', {
      success: result.success,
      hasImageUrl: !!result.imageUrl,
      error: result.error,
      processingTime: result.processingTime
    });
    
    // Additional safety check for imageUrl
    if (result.success && result.imageUrl) {
      if (typeof result.imageUrl !== 'string') {
        console.error('❌ imageUrl is not a string:', typeof result.imageUrl, result.imageUrl);
        result.success = false;
        result.error = 'Invalid image URL format received from AI service';
        delete result.imageUrl;
      } else if (!result.imageUrl.startsWith('http')) {
        console.error('❌ imageUrl is not a valid URL:', result.imageUrl);
        result.success = false;
        result.error = 'Invalid image URL received from AI service';
        delete result.imageUrl;
      }
    }
    
    // If generation was successful, deduct credits
    if (result.success) {
      const deductResult = await deductCredits(userId, CREDITS_PER_GENERATION);
      if (!deductResult.success) {
        console.error('Failed to deduct credits after successful generation:', deductResult.error);
        // Still return success but log the error
      }

      // Track generation for analytics
      await trackGeneration({
        similarity,
        age,
        generation_time: result.processingTime || 0,
        success: true,
      });

      // Get user info for saving generation
      console.log('👤 Getting user for generation save...');
      const userResult = await getOrCreateUser(userId);
      console.log('👤 User result for save:', { success: userResult.success, hasUser: !!userResult.user });

      if (!userResult.success || !userResult.user) {
        console.error('❌ Failed to get user for generation save:', userResult.error);
        return NextResponse.json({
          success: false,
          error: 'Failed to link generation to user account',
        }, { status: 500 });
      }

      const user = userResult.user;
      console.log('👤 User for generation save:', { id: user.id, email: user.email });

      // Store image permanently in Supabase Storage
      let finalImageUrl = result.imageUrl || '';
      if (result.imageUrl) {
        console.log('🔄 Storing image permanently for user:', userId);
        const storageResult = await storeImagePermanently(
          result.imageUrl,
          userId,
          {
            babyName: result.babyName?.name,
            age,
            gender,
          }
        );

        if (storageResult.success && storageResult.permanentUrl) {
          finalImageUrl = storageResult.permanentUrl;
          console.log('✅ Image stored permanently at:', finalImageUrl);
        } else {
          console.error('❌ Failed to store image permanently, using temporary URL:', storageResult.error);
          // Continue with temporary URL as fallback
        }
      }

      // Save generated image metadata to Supabase with user ID
      console.log('💾 Saving generation metadata with user ID:', user.id);
      await saveGeneratedImage({
        sessionId: userId, // Use user ID as session ID
        babyName: result.babyName?.name,
        babyNameExplanation: result.babyName?.explanation,
        similarity,
        age,
        gender,
        parent1Name,
        parent2Name,
        originalImageUrl: finalImageUrl,
        processingTime: result.processingTime,
        success: true,
        userId: user.id, // Ensure we have a valid user ID
        creditsUsed: CREDITS_PER_GENERATION,
      });

      // Update the response to include the permanent URL
      result.imageUrl = finalImageUrl;

      // Add remaining credits info to response
      result.remainingCredits = deductResult.remainingCredits;
    } else {
      // Track failed generation
      await trackGeneration({
        similarity,
        age,
        generation_time: result.processingTime || 0,
        success: false,
        error: result.error,
      });

      // Get user info for saving generation
      console.log('👤 Getting user for failed generation save...');
      const userResult = await getOrCreateUser(userId);
      console.log('👤 User result for failed save:', { success: userResult.success, hasUser: !!userResult.user });

      if (!userResult.success || !userResult.user) {
        console.error('❌ Failed to get user for failed generation save:', userResult.error);
        // Don't return error for failed generation saves, just log it
      } else {
        const user = userResult.user;
        console.log('👤 User for failed generation save:', { id: user.id, email: user.email });

        // Save failed generation metadata (no credits deducted)
        console.log('💾 Saving failed generation metadata with user ID:', user.id);
        await saveGeneratedImage({
          sessionId: userId, // Use user ID as session ID
          similarity,
          age,
          gender,
          parent1Name,
          parent2Name,
          originalImageUrl: '',
          processingTime: result.processingTime,
          success: false,
          error: result.error,
          userId: user.id, // Ensure we have a valid user ID
          creditsUsed: 0, // No credits deducted for failed generations
        });
      }
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 === GENERATION API ERROR ===');
    console.error('💥 Error type:', typeof error);
    console.error('💥 Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('💥 Error message:', error instanceof Error ? error.message : String(error));
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('💥 Full error object:', error);

    // Track error (don't await to avoid blocking response)
    trackGeneration({
      similarity: 0,
      age: 0,
      generation_time: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }).catch((trackingError) => {
      console.error('Failed to track generation error:', trackingError);
    });

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      debug: {
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  try {
    // Try to authenticate, but this endpoint should work without auth for health checks
    const authResult = await authenticateApiRequest(request);
    const userId = authResult.success ? authResult.userId : null;
    const serviceStatus = await checkReplicateStatus();
    
    let userCredits = null;
    if (userId) {
      // Get user data from Clerk to create user with proper info if needed
      const user = await currentUser();
      const primaryEmail = user?.emailAddresses.find(email => 
        email.id === user.primaryEmailAddressId
      ) || user?.emailAddresses[0];
      
      console.log('GET /api/generate-baby - User ID:', userId);
      console.log('GET /api/generate-baby - User Email:', primaryEmail?.emailAddress);
      
      // Ensure user exists in database first with proper user info
      const userResult = await getOrCreateUser(userId, primaryEmail?.emailAddress ? {
        email: primaryEmail.emailAddress,
        firstName: user?.firstName || undefined,
        lastName: user?.lastName || undefined,
      } : undefined);
      
      if (!userResult.success) {
        console.error('Failed to create/get user:', userResult.error);
      }
      
      const creditsCheck = await hasEnoughCredits(userId, 0); // Just check credits, don't require any
      if (creditsCheck.success) {
        userCredits = creditsCheck.currentCredits;
      } else {
        console.error('Failed to check credits:', creditsCheck.error);
      }
    }
    
    return NextResponse.json({
      status: 'healthy',
      service: {
        available: serviceStatus.available,
        error: serviceStatus.error,
      },
      user: userId ? {
        authenticated: true,
        credits: userCredits,
      } : {
        authenticated: false,
      },
      creditsPerGeneration: CREDITS_PER_GENERATION,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Service health check failed',
    }, { status: 500 });
  }
}