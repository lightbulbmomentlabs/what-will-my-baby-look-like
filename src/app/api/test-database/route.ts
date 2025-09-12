/**
 * Test endpoint to verify Supabase database connection and table structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const results: Record<string, unknown> = {};

    // Check if Supabase is configured
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured. Please check environment variables.',
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    // Test 1: Check if we can connect to Supabase
    try {
      const { data: connectionTest, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      results.connection = {
        success: !connectionError,
        error: connectionError?.message,
      };
    } catch (error) {
      results.connection = {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }

    // Test 2: Check if users table exists and its structure
    try {
      const { data: usersTest, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
        
      results.usersTable = {
        exists: !usersError,
        error: usersError?.message,
        sampleData: usersTest,
      };
    } catch (error) {
      results.usersTable = {
        exists: false,
        error: error instanceof Error ? error.message : 'Table check failed',
      };
    }

    // Test 3: Check if transactions table exists
    try {
      const { data: transactionsTest, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);
        
      results.transactionsTable = {
        exists: !transactionsError,
        error: transactionsError?.message,
        sampleData: transactionsTest,
      };
    } catch (error) {
      results.transactionsTable = {
        exists: false,
        error: error instanceof Error ? error.message : 'Table check failed',
      };
    }

    // Test 4: Check environment variables
    results.environment = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}