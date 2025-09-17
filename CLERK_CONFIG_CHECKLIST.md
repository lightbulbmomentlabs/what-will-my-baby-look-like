# Clerk Configuration Checklist

## CRITICAL: Fix Authentication Domain Issue

### Current Problem
- Redirect URL: `clerk.whatwillmybabylooklike.com` (WRONG)
- Should be: `whatwillmybabylooklike.com` (CORRECT)
- Error: `invalid_handshake` due to domain mismatch

---

## Step-by-Step Fix Guide

### 1. Clerk Dashboard - Domains Section

**Go to [clerk.com](https://clerk.com) → Your Project → Domains**

✅ **Correct Configuration:**
```
Primary Domain: whatwillmybabylooklike.com
Development Domain: localhost:3000
```

❌ **Remove if present:**
```
clerk.whatwillmybabylooklike.com
*.clerk.whatwillmybabylooklike.com
```

### 2. Clerk Dashboard - Allowed Origins

**Go to Developers → Webhooks & CORS → Allowed Origins**

✅ **Add these origins:**
```
https://whatwillmybabylooklike.com
https://whatwillmybabylooklike.com/*
http://localhost:3000 (for development)
```

❌ **Remove if present:**
```
https://clerk.whatwillmybabylooklike.com
https://clerk.whatwillmybabylooklike.com/*
```

### 3. Environment Variables Check

**In Digital Ocean App Platform → Settings → Environment Variables**

Check these variables match your Clerk app:

```bash
# Should match the app configured for whatwillmybabylooklike.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# For production, both should start with:
# pk_live_ and sk_live_ (NOT pk_test_ / sk_test_)
```

### 4. DNS Configuration Check

**Verify there are NO DNS records for:**
- `clerk.whatwillmybabylooklike.com`
- `*.clerk.whatwillmybabylooklike.com`

**Only these should exist:**
- `whatwillmybabylooklike.com` → Your Digital Ocean app
- `www.whatwillmybabylooklike.com` → Redirect to main domain (optional)

---

## Testing After Fix

### 1. Clear Browser Data
```
1. Open browser dev tools (F12)
2. Right-click refresh button → "Empty Cache and Hard Reload"
3. Or go to Settings → Privacy → Clear browsing data → Cookies and cache
```

### 2. Test Authentication Flow
```
1. Go to https://whatwillmybabylooklike.com
2. Click "Sign In"
3. Choose Google/Facebook authentication
4. Should redirect to whatwillmybabylooklike.com (NOT clerk.whatwillmybabylooklike.com)
5. Should successfully sign in and show user menu
```

### 3. Use Diagnostic Endpoints
```
Check configuration: https://whatwillmybabylooklike.com/api/debug-clerk
Check authentication: https://whatwillmybabylooklike.com/api/debug-auth
```

---

## Common Issues & Solutions

### Issue: Still redirecting to clerk.* subdomain
**Solution:**
- Create new Clerk application for correct domain
- Copy users from old app if needed
- Update environment variables with new keys

### Issue: Mixed live/test keys
**Solution:**
- Use pk_live_ + sk_live_ for production
- Use pk_test_ + sk_test_ for development

### Issue: "Application not found" error
**Solution:**
- Verify environment variables match Clerk dashboard
- Check that domain is exactly: `whatwillmybabylooklike.com`

---

## Emergency Fallback

If quick fixes don't work:

1. **Create new Clerk application:**
   - Name: "What Will My Baby Look Like - Production"
   - Domain: `whatwillmybabylooklike.com`
   - Get new pk_live_ and sk_live_ keys

2. **Update Digital Ocean environment variables:**
   - Replace old keys with new ones
   - Deploy changes

3. **Configure new app properly:**
   - Set domain to `whatwillmybabylooklike.com`
   - Add allowed origins
   - Test authentication

---

## Verification Commands

After making changes, test with these URLs:

```bash
# Should show all green checkmarks
curl https://whatwillmybabylooklike.com/api/debug-clerk

# Should show authentication status
curl https://whatwillmybabylooklike.com/api/debug-auth

# Should show environment variables are set
curl https://whatwillmybabylooklike.com/api/debug-env
```

---

**Expected Result:** Authentication redirects to `whatwillmybabylooklike.com` and completes successfully, allowing image generation to work.