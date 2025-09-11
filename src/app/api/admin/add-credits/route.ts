/**
 * Admin endpoint to manually add credits to a user account
 * This is temporary for development/testing purposes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser, addCredits } from '@/lib/credits';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const { creditsToAdd = 1 } = await req.json();

    // First ensure user exists in our database
    const userResult = await getOrCreateUser(userId, {
      email: 'temp@example.com', // This will be ignored if user already exists
    });

    if (!userResult.success) {
      return NextResponse.json({
        success: false,
        error: `Failed to get/create user: ${userResult.error}`,
      }, { status: 500 });
    }

    // Add credits to the user
    const addResult = await addCredits(userId, creditsToAdd);

    if (!addResult.success) {
      return NextResponse.json({
        success: false,
        error: `Failed to add credits: ${addResult.error}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${creditsToAdd} credits`,
      newTotal: addResult.newTotal,
    });

  } catch (error) {
    console.error('Error adding credits:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}