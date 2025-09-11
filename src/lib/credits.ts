/**
 * Credits management service for handling user credits and transactions
 */

import { supabaseAdmin } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';
import { CREDIT_PACKAGES, getCreditPackage, type CreditPackage } from '@/lib/credit-constants';

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  credits_purchased: number;
  amount_paid: number;
  stripe_payment_intent_id: string;
  stripe_session_id?: string;
  package_type: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}


/**
 * Get or create user from Clerk user ID
 */
export async function getOrCreateUser(clerkUserId: string, userInfo?: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // First try to get existing user
    const { data: existingUser, error: fetchError } = await (supabaseAdmin() as any)
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (existingUser && !fetchError) {
      return { success: true, user: existingUser };
    }

    // If user doesn't exist and we don't have user info, return error
    if (!userInfo) {
      return { success: false, error: 'User not found and no user info provided' };
    }

    // Create new user with 1 free credit
    const { data: newUser, error: createError } = await (supabaseAdmin() as any)
      .from('users')
      .insert([
        {
          clerk_user_id: clerkUserId,
          email: userInfo.email,
          first_name: userInfo.firstName,
          last_name: userInfo.lastName,
          credits: 1, // Free credit for new users
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('Failed to create user:', createError);
      return { success: false, error: createError.message };
    }

    return { success: true, user: newUser };
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get user by Clerk user ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { data: user, error } = await (supabaseAdmin() as any)
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error getting user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get current user from auth context
 */
export async function getCurrentUser(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    return getUserByClerkId(userId);
  } catch (error) {
    console.error('Error getting current user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(clerkUserId: string, requiredCredits: number = 1): Promise<{ success: boolean; hasCredits?: boolean; currentCredits?: number; error?: string }> {
  try {
    const userResult = await getUserByClerkId(clerkUserId);
    
    if (!userResult.success || !userResult.user) {
      return { success: false, error: userResult.error || 'User not found' };
    }

    const hasCredits = userResult.user.credits >= requiredCredits;
    
    return { 
      success: true, 
      hasCredits, 
      currentCredits: userResult.user.credits 
    };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(clerkUserId: string, creditsToDeduct: number = 1): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
  try {
    const userResult = await getUserByClerkId(clerkUserId);
    
    if (!userResult.success || !userResult.user) {
      return { success: false, error: userResult.error || 'User not found' };
    }

    const user = userResult.user;
    
    if (user.credits < creditsToDeduct) {
      return { 
        success: false, 
        error: `Insufficient credits. You have ${user.credits} credits but need ${creditsToDeduct}` 
      };
    }

    const newCreditsCount = user.credits - creditsToDeduct;

    const { error: updateError } = await (supabaseAdmin() as any)
      .from('users')
      .update({ credits: newCreditsCount })
      .eq('clerk_user_id', clerkUserId);

    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, remainingCredits: newCreditsCount };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Add credits to user account (after purchase)
 */
export async function addCredits(clerkUserId: string, creditsToAdd: number): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  try {
    const userResult = await getUserByClerkId(clerkUserId);
    
    if (!userResult.success || !userResult.user) {
      return { success: false, error: userResult.error || 'User not found' };
    }

    const user = userResult.user;
    const newCreditsCount = user.credits + creditsToAdd;

    const { error: updateError } = await (supabaseAdmin() as any)
      .from('users')
      .update({ credits: newCreditsCount })
      .eq('clerk_user_id', clerkUserId);

    if (updateError) {
      console.error('Failed to add credits:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, newTotal: newCreditsCount };
  } catch (error) {
    console.error('Error adding credits:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create a transaction record
 */
export async function createTransaction(data: {
  clerkUserId: string;
  creditsPurchased: number;
  amountPaid: number;
  stripePaymentIntentId: string;
  stripeSessionId?: string;
  packageType: string;
}): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  try {
    const userResult = await getUserByClerkId(data.clerkUserId);
    
    if (!userResult.success || !userResult.user) {
      return { success: false, error: userResult.error || 'User not found' };
    }

    const { data: transaction, error } = await (supabaseAdmin() as any)
      .from('transactions')
      .insert([
        {
          user_id: userResult.user.id,
          credits_purchased: data.creditsPurchased,
          amount_paid: data.amountPaid / 100, // Convert cents to dollars
          stripe_payment_intent_id: data.stripePaymentIntentId,
          stripe_session_id: data.stripeSessionId,
          package_type: data.packageType,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create transaction:', error);
      return { success: false, error: error.message };
    }

    return { success: true, transaction };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Complete a transaction and add credits
 */
export async function completeTransaction(stripePaymentIntentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the transaction
    const { data: transaction, error: fetchError } = await (supabaseAdmin() as any)
      .from('transactions')
      .select(`
        *,
        users!transactions_user_id_fkey(clerk_user_id)
      `)
      .eq('stripe_payment_intent_id', stripePaymentIntentId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch transaction:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (transaction.status === 'completed') {
      return { success: true }; // Already completed
    }

    // Update transaction status
    const { error: updateError } = await (supabaseAdmin() as any)
      .from('transactions')
      .update({ status: 'completed' })
      .eq('stripe_payment_intent_id', stripePaymentIntentId);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      return { success: false, error: updateError.message };
    }

    // Add credits to user account
    const addResult = await addCredits(
      transaction.users.clerk_user_id, 
      transaction.credits_purchased
    );

    if (!addResult.success) {
      // Rollback transaction status
      await (supabaseAdmin() as any)
        .from('transactions')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', stripePaymentIntentId);
      
      return { success: false, error: addResult.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error completing transaction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(clerkUserId: string): Promise<{ success: boolean; transactions?: Transaction[]; error?: string }> {
  try {
    const userResult = await getUserByClerkId(clerkUserId);
    
    if (!userResult.success || !userResult.user) {
      return { success: false, error: userResult.error || 'User not found' };
    }

    const { data: transactions, error } = await (supabaseAdmin() as any)
      .from('transactions')
      .select('*')
      .eq('user_id', userResult.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch transactions:', error);
      return { success: false, error: error.message };
    }

    return { success: true, transactions: transactions || [] };
  } catch (error) {
    console.error('Error getting user transactions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

