/**
 * Manual user synchronization tool
 * Creates/updates user accounts when automatic sync fails
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkUserId, email, firstName, lastName, credits = 1 } = body;

    if (!clerkUserId || !email) {
      return NextResponse.json({
        success: false,
        error: 'clerk_user_id and email are required'
      }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId);

    const existingUser = existingUsers?.[0];

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await (supabase as any)
        .from('users')
        .update({
          email,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', clerkUserId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to update user: ' + updateError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'updated',
        user: updatedUser,
        message: 'User profile updated successfully'
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await (supabase as any)
        .from('users')
        .insert({
          clerk_user_id: clerkUserId,
          email,
          first_name: firstName,
          last_name: lastName,
          credits
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create user: ' + createError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'created',
        user: newUser,
        message: 'User account created successfully with ' + credits + ' credits'
      });
    }

  } catch (error) {
    console.error('Manual user sync error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync user account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Allow GET to show usage instructions
export async function GET() {
  return NextResponse.json({
    message: 'Manual User Sync API',
    usage: 'POST with { clerkUserId, email, firstName?, lastName?, credits? }',
    example: {
      clerkUserId: 'user_abc123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      credits: 1
    }
  });
}