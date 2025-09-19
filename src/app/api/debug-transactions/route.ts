import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, createAuthErrorResponse } from '@/lib/api-auth';
import { getUserTransactions, getUserByClerkId } from '@/lib/credits';

export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiRequest(req);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(createAuthErrorResponse(authResult), { status: 401 });
    }

    const { userId } = authResult;

    // Get user info
    const userResult = await getUserByClerkId(userId);
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Get user transactions
    const transactionsResult = await getUserTransactions(userId);
    if (!transactionsResult.success) {
      return NextResponse.json({
        success: false,
        error: transactionsResult.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        email: userResult.user.email,
        credits: userResult.user.credits,
        clerk_user_id: userResult.user.clerk_user_id,
      },
      transactions: transactionsResult.transactions || [],
      debug: {
        totalTransactions: (transactionsResult.transactions || []).length,
        completedTransactions: (transactionsResult.transactions || []).filter(t => t.status === 'completed').length,
        pendingTransactions: (transactionsResult.transactions || []).filter(t => t.status === 'pending').length,
      }
    });

  } catch (error) {
    console.error('Error debugging transactions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}