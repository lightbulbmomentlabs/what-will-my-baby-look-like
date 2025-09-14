# Deployment Guide

This document outlines the requirements and steps for deploying the "What Will My Baby Look Like" application to production.

## Required Environment Variables

### Critical Environment Variables (Must be set for core functionality)

#### Supabase Database Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

**Purpose**: Database connectivity for user management, credits system, and gallery functionality.
**Impact if missing**: Gallery won't load, credits won't show, user accounts won't work.

#### Clerk Authentication Configuration
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...your-publishable-key
CLERK_SECRET_KEY=sk_test_...your-secret-key
```

**Purpose**: User authentication and session management.
**Impact if missing**: Users cannot sign in or access authenticated features.

#### Replicate AI Configuration
```bash
REPLICATE_API_TOKEN=r8_...your-api-token
```

**Purpose**: AI image generation functionality.
**Impact if missing**: Baby image generation will fail.

### Optional Environment Variables

#### Development/Debug Configuration
```bash
NODE_ENV=production
ENVIRONMENT=production
```

**Purpose**: Application environment detection and optimization.
**Impact if missing**: May affect performance optimizations and logging.

## Environment Variable Sources

### Where to Find These Values:

1. **Supabase Variables**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (secret)

2. **Clerk Variables**:
   - Go to your Clerk project dashboard
   - Navigate to Developers > API Keys
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = Publishable keys
   - `CLERK_SECRET_KEY` = Secret keys

3. **Replicate Variables**:
   - Go to replicate.com account settings
   - Navigate to API tokens
   - `REPLICATE_API_TOKEN` = Your API token

## Digital Ocean App Platform Setup

### Step 1: Add Environment Variables

1. Navigate to your Digital Ocean App Platform dashboard
2. Select your app
3. Go to Settings > Environment Variables
4. Add each environment variable:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The actual value from your service
   - **Scope**: All components
   - **Type**: Text (not encrypted for NEXT_PUBLIC_ variables, encrypted for secret keys)

### Step 2: Deployment Configuration

Ensure your Digital Ocean app is configured with:
- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Node Version**: 18.x or higher
- **Environment**: Production

### Step 3: Domain Configuration

If using a custom domain:
1. Configure DNS to point to Digital Ocean
2. Set up SSL certificate (usually automatic)
3. Update Clerk allowed origins to include your production domain

## Database Setup

### Supabase Database Schema

The application requires these tables in your Supabase database:

1. **users** table:
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     clerk_user_id TEXT UNIQUE NOT NULL,
     email TEXT NOT NULL,
     first_name TEXT,
     last_name TEXT,
     credits INTEGER DEFAULT 1,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

2. **generated_images** table:
   ```sql
   CREATE TABLE generated_images (
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

3. **transactions** table:
   ```sql
   CREATE TABLE transactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     credits_purchased INTEGER NOT NULL,
     amount_paid DECIMAL(10,2) NOT NULL,
     stripe_payment_intent_id TEXT UNIQUE NOT NULL,
     stripe_session_id TEXT,
     package_type TEXT NOT NULL,
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
   );
   ```

### Enable Row Level Security (RLS)

For security, enable RLS on all tables and create appropriate policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security requirements)
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = clerk_user_id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = clerk_user_id);
```

## Testing Production Deployment

### 1. Environment Variables Check

Visit: `https://yourdomain.com/api/debug-env`

Expected response should show:
```json
{
  "status": {
    "overall": "healthy",
    "issues": []
  },
  "environment": {
    "supabase": {
      "url": { "exists": true },
      "anonKey": { "exists": true },
      "serviceKey": { "exists": true }
    },
    "clerk": {
      "publishableKey": { "exists": true },
      "secretKey": { "exists": true }
    },
    "replicate": {
      "apiToken": { "exists": true }
    }
  }
}
```

### 2. Database Connection Check

Visit: `https://yourdomain.com/api/test-database`

Should return successful connection status and table existence confirmation.

### 3. Authentication Test

1. Sign up/sign in on the production site
2. Check that credits are displayed in header
3. Try generating a baby image
4. Check that gallery loads your images

## Troubleshooting Common Issues

### "Failed to load gallery" Error
- **Cause**: Missing Supabase environment variables
- **Solution**: Verify all Supabase variables are set correctly in Digital Ocean

### "User not found" Error
- **Cause**: Database tables missing or user creation failing
- **Solution**: Check database schema and Supabase permissions

### "Invalid API key" from Supabase
- **Cause**: Wrong Supabase keys or project URL
- **Solution**: Double-check keys from Supabase dashboard

### Favicon 404 Errors
- **Cause**: Conflicting favicon files
- **Solution**: Use only app directory favicon (already resolved)

### Image Generation Fails
- **Cause**: Missing or invalid Replicate API token
- **Solution**: Verify Replicate API token is valid and has credits

## Security Considerations

1. **Never commit secrets**: Keep all API keys out of version control
2. **Use environment variables**: All secrets should be environment variables
3. **Enable RLS**: Supabase Row Level Security should be enabled
4. **HTTPS only**: Ensure production uses HTTPS
5. **CORS configuration**: Verify Clerk and Supabase allow your domain

## Monitoring and Maintenance

### Regular Checks
- Monitor Supabase usage and quotas
- Check Replicate API credit usage
- Monitor application error logs in Digital Ocean
- Verify SSL certificate renewal

### Backup Strategy
- Supabase provides automatic backups
- Consider periodic database exports for critical data
- Keep environment variable backups in secure location

## Support and Documentation

- **Supabase**: https://supabase.com/docs
- **Clerk**: https://clerk.com/docs
- **Replicate**: https://replicate.com/docs
- **Digital Ocean Apps**: https://docs.digitalocean.com/products/app-platform/

## Quick Deployment Checklist

- [ ] All environment variables added to Digital Ocean
- [ ] Supabase database tables created
- [ ] RLS policies configured
- [ ] Clerk domain settings updated
- [ ] Test `/api/debug-env` endpoint
- [ ] Test user authentication
- [ ] Test image generation
- [ ] Test gallery functionality
- [ ] Monitor error logs

---

**Last Updated**: September 2025
**Environment**: Production Ready