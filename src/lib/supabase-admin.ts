/**
 * Server-side Supabase client with service role key for admin operations
 * Used for webhooks, user management, and other server-side operations that need elevated permissions
 */

import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors when env vars aren't available
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = () => {
  if (_supabaseAdmin) {
    return _supabaseAdmin;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      'Missing Supabase service role environment variables. Database operations will not work.',
    );
    return null;
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseAdmin;
};