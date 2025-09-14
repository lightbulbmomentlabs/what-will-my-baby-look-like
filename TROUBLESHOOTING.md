# Production Troubleshooting Guide

This guide addresses common issues encountered in the production deployment of the baby prediction app.

## 🚨 Critical Issues

### Issue: Gallery Shows "Failed to load gallery"

**Symptoms:**
- User is authenticated but gallery page shows error
- Console error: "User not found"
- Console error: "GET /api/gallery 404"

**Root Cause:** Missing Supabase environment variables in production

**Solution:**
1. Go to Digital Ocean App Platform dashboard
2. Navigate to Settings > Environment Variables
3. Add the missing variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://igzgqopnmmlnttcggccr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
4. Redeploy the application
5. Test by visiting `/api/debug-env` to verify configuration

### Issue: No Credits Showing for Authenticated User

**Symptoms:**
- User successfully signs in
- Header shows "0 credits" or no credits
- Cannot generate images

**Root Cause:** User record doesn't exist in Supabase database

**Solution:**
1. Verify Supabase environment variables (see above)
2. Check database tables exist (see DEPLOYMENT.md)
3. User should be auto-created on first visit after environment variables are fixed
4. If needed, manually create user:
   ```sql
   INSERT INTO users (clerk_user_id, email, credits) 
   VALUES ('user_...your_clerk_id', 'your@email.com', 1);
   ```

### Issue: Console Errors - 401 Unauthorized from Supabase

**Symptoms:**
- Console shows: "POST https://...supabase.co/rest/v1/... 401 (Unauthorized)"
- Error message: "Invalid API key"

**Root Cause:** Missing or incorrect Supabase API keys

**Solution:**
1. Verify the Supabase project URL is correct
2. Check anon key is correct (starts with `eyJ`)
3. Verify service role key is correct
4. Ensure keys are from the correct Supabase project
5. Test with curl:
   ```bash
   curl -H "apikey: YOUR_ANON_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/
   ```

## 📋 Diagnostic Steps

### Step 1: Check Environment Variables
Visit: `https://whatwillmybabylooklike.com/api/debug-env`

**Expected Response:**
```json
{
  "status": { "overall": "healthy" },
  "environment": {
    "supabase": {
      "url": { "exists": true },
      "anonKey": { "exists": true },
      "serviceKey": { "exists": true }
    }
  }
}
```

**If Unhealthy:** Follow the recommendations in the response to add missing environment variables.

### Step 2: Test Database Connection  
Visit: `https://whatwillmybabylooklike.com/api/test-database`

**Expected Response:**
```json
{
  "success": true,
  "results": {
    "connection": { "success": true },
    "usersTable": { "exists": true }
  }
}
```

**If Failed:** Check database schema and environment variables.

### Step 3: Test User Authentication
1. Sign in to the website
2. Check if header shows credits
3. Try visiting gallery page
4. Check browser console for errors

## 🔧 Quick Fixes

### Fix 1: Environment Variables Missing
```bash
# In Digital Ocean App Platform, add these variables:
NEXT_PUBLIC_SUPABASE_URL=https://igzgqopnmmlnttcggccr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Fix 2: User Not Created Automatically
If environment variables are correct but user still shows 0 credits:

1. Visit the app while signed in (triggers user creation)
2. Check `/api/debug-env` to see if user is authenticated
3. Manual creation via Supabase dashboard if needed

### Fix 3: Database Tables Missing
Run these SQL commands in Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  credits INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create generated_images table
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT,
  baby_name TEXT,
  baby_name_explanation TEXT,
  similarity INTEGER,
  baby_age INTEGER,
  baby_gender TEXT,
  parent1_name TEXT,
  parent2_name TEXT,
  original_image_url TEXT,
  processing_time INTEGER,
  generation_success BOOLEAN DEFAULT false,
  generation_error TEXT,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

## 🔍 Advanced Debugging

### Check Specific User Data
```sql
-- Find user by email
SELECT * FROM users WHERE email = 'your@email.com';

-- Find user by Clerk ID
SELECT * FROM users WHERE clerk_user_id = 'user_...your_clerk_id';

-- Check user's generated images
SELECT gi.*, u.email 
FROM generated_images gi 
JOIN users u ON gi.user_id = u.id 
WHERE u.email = 'your@email.com'
ORDER BY gi.created_at DESC;
```

### Test API Endpoints Manually
```bash
# Test environment variables
curl https://whatwillmybabylooklike.com/api/debug-env

# Test database connection
curl https://whatwillmybabylooklike.com/api/test-database

# Test gallery (requires authentication)
curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" https://whatwillmybabylooklike.com/api/gallery
```

## 📞 Getting Additional Help

### Log Sources
1. **Digital Ocean Logs**: App Platform > Runtime Logs
2. **Browser Console**: F12 > Console tab
3. **Supabase Logs**: Supabase Dashboard > Logs
4. **Clerk Logs**: Clerk Dashboard > Logs

### Key Information to Gather
- User's Clerk ID
- Error messages from console
- Response from `/api/debug-env`
- Digital Ocean build logs
- Supabase project URL

### Common Error Patterns
- `"User not found"` → Missing environment variables
- `"401 Unauthorized"` → Wrong API keys
- `"Failed to load gallery"` → Database connection issue
- `"Credits: 0"` → User not created in database

## 🎯 Success Indicators

When everything is working correctly:
- ✅ `/api/debug-env` shows "healthy"
- ✅ Signed-in user sees credits in header
- ✅ Gallery loads user's images
- ✅ Image generation works
- ✅ No console errors

---

**Remember:** Most production issues stem from missing environment variables. Always check `/api/debug-env` first!