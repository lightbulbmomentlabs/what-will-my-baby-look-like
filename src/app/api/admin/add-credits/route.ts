/**
 * Admin endpoint to add credits to a user account by email
 * For testing and administrative purposes
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, credits } = await request.json();

    if (!email || typeof credits !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Email and credits (number) are required'
      }, { status: 400 });
    }

    console.log(`📧 Adding ${credits} credits to user: ${email}`);

    // Check if Supabase is configured
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured. Please check environment variables.'
      }, { status: 503 });
    }

    // First, find the user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, credits')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', email, userError);
      return NextResponse.json({
        success: false,
        error: `User not found with email: ${email}`
      }, { status: 404 });
    }

    console.log(`👤 Found user: ${user.email}, current credits: ${user.credits}`);

    // Add credits to the user's account
    const newCredits = user.credits + credits;
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', user.id)
      .select('id, email, credits')
      .single();

    if (updateError) {
      console.error('❌ Failed to update credits:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update user credits'
      }, { status: 500 });
    }

    console.log(`✅ Successfully added ${credits} credits. New balance: ${updatedUser.credits}`);

    return NextResponse.json({
      success: true,
      user: {
        email: updatedUser.email,
        previousCredits: user.credits,
        creditsAdded: credits,
        newCredits: updatedUser.credits
      },
      message: `Successfully added ${credits} credits to ${email}. New balance: ${updatedUser.credits}`
    });

  } catch (error) {
    console.error('❌ Admin add credits error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Admin Add Credits endpoint',
    usage: 'Send POST request with { email: "user@example.com", credits: 20 }',
    note: 'This endpoint adds credits to the specified user account'
  });
}