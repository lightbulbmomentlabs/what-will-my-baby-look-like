import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, createAuthErrorResponse } from '@/lib/api-auth';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiRequest(req);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(createAuthErrorResponse(authResult), { status: 401 });
    }

    const { userId } = authResult;

    // Get Supabase admin client
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }

    // Get real user email from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({
        success: false,
        error: 'Could not get user info from Clerk'
      }, { status: 400 });
    }

    const primaryEmail = clerkUser.emailAddresses.find(email => email.id === clerkUser.primaryEmailAddressId);
    const emailAddress = primaryEmail?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

    if (!emailAddress) {
      return NextResponse.json({
        success: false,
        error: 'No email address found in Clerk'
      }, { status: 400 });
    }

    // Check if email is a placeholder
    if (!emailAddress.includes('temp.placeholder')) {
      // Update user with real email and name
      const { data, error } = await supabase
        .from('users')
        .update({
          email: emailAddress,
          first_name: clerkUser.firstName || 'User',
          last_name: clerkUser.lastName || 'Account',
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update user email:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to update user information'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'User email updated successfully',
        user: {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          credits: data.credits
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Real email address is required'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fixing user email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}