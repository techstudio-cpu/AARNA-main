# Railway Admin Login Fix Guide

## 🚨 Issue: Unable to Login to Admin Panel on Railway

### Root Cause
The admin user was not being initialized automatically during deployment because the initialization function was not being called in the server startup process.

### ✅ Solution Applied

I've fixed the issue by adding automatic admin user initialization during server startup. The fix includes:

1. **Auto-initialization on server startup** - `initializeDefaultAdmin()` is now called during server startup
2. **Manual admin creation script** - `scripts/create-admin.js` for manual admin user creation
3. **Updated documentation** - RAILWAY_DEPLOYMENT.md with troubleshooting steps

## 🔧 Steps to Fix on Railway

### Option 1: Redeploy with Environment Variables (Recommended)

#### Step 1: Verify Environment Variables on Railway

Go to your Railway project → Your App → Settings → Variables and ensure these are set:

```
NODE_ENV=production
PORT=3000
SESSION_SECRET=<your-random-32-char-secret>
ADMIN_USERNAME=ST3093541
ADMIN_PASSWORD=Air@123
ADMIN_NAME=Shubham Tiwari
```

**Generate SESSION_SECRET if needed:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 2: Redeploy on Railway

1. Go to your Railway project dashboard
2. Click on your app
3. Click "Redeploy" button
4. Wait for deployment to complete
5. Check deployment logs for this message:
   ```
   🔐 Initializing default admin user...
   ✅ Admin user initialization completed
   ```

#### Step 3: Test Admin Login

1. Visit your Railway URL (e.g., `https://your-app.railway.app/admin/login`)
2. Login with:
   - Username: `ST3093541`
   - Password: `Air@123`

### Option 2: Manual Admin Creation

If automatic initialization fails, you can manually create the admin user:

#### Step 1: Access Railway Console

1. Go to your Railway project dashboard
2. Click on your app
3. Click "Console" or "New Console" button
4. This will give you terminal access to your Railway deployment

#### Step 2: Run Admin Creation Script

In the Railway console, run:
```bash
npm run create-admin
```

This will:
- Connect to PostgreSQL
- Create/update admin user using environment variables
- Display success message

#### Step 3: Restart Deployment

1. Go back to Railway dashboard
2. Click "Redeploy"
3. Wait for restart to complete
4. Try logging in again

### Option 3: Check Deployment Logs

If login still fails, check the deployment logs:

#### Step 1: View Logs

1. Go to Railway project dashboard
2. Click on your app
3. Click "Logs" tab
4. Look for errors during startup

#### Step 2: Look for These Messages

**Success indicators:**
```
✅ PostgreSQL connected
✅ Migrations completed
✅ Admin user initialization completed
```

**Error indicators:**
```
❌ PostgreSQL connection error
⚠️ ADMIN_USERNAME or ADMIN_PASSWORD env vars not set
❌ Error initializing default admin
```

#### Step 3: Fix Based on Logs

- If PostgreSQL error: Check database connection
- If missing env vars: Add environment variables in Railway settings
- If initialization error: Try manual creation script

## 📋 Environment Variables Checklist

Before deploying, ensure these are set in Railway:

### Required
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `SESSION_SECRET=<random-32-chars>`
- [ ] `ADMIN_USERNAME=<your-username>`
- [ ] `ADMIN_PASSWORD=<strong-password>`
- [ ] `ADMIN_NAME=<display-name>`

### Automatic (Added by Railway)
- [ ] `DATABASE_URL` (added when you add PostgreSQL service)

### Optional
- [ ] `RESEND_API_KEY` (for email)
- [ ] `GEMINI_API_KEY` (for AI features)

## 🔍 Verification Steps

After deployment, verify:

1. **Health Check**
   ```
   curl https://your-app.railway.app/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Database Connection**
   Check logs for: `✅ PostgreSQL connected`

3. **Admin Initialization**
   Check logs for: `✅ Admin user initialization completed`

4. **Admin Login**
   Visit: `https://your-app.railway.app/admin/login`
   Login with your credentials

## 🆘 Still Having Issues?

### Debug Mode

Enable debug logging by adding this environment variable:
```
DEBUG=*
```

Then check logs for detailed authentication information.

### Direct Database Check

1. Access Railway PostgreSQL console
2. Run:
   ```sql
   SELECT user_id, username, display_name, role, active
   FROM admin_users;
   ```

If no admin user exists, run the manual creation script.

### Contact Support

If issues persist:
1. Check Railway documentation: https://docs.railway.app
2. Review deployment logs
3. Check GitHub repository: https://github.com/techstudio-cpu/AARNA-main/issues

## 📝 Summary of Changes

### Files Modified
- `server.js` - Added admin initialization call on startup
- `package.json` - Added `create-admin` script
- `RAILWAY_DEPLOYMENT.md` - Updated troubleshooting section
- `scripts/create-admin.js` - New manual admin creation script

### What Happens Now

On every Railway deployment:
1. ✅ PostgreSQL connection tested
2. ✅ Database migrations run
3. ✅ Data migration from JSON (if needed)
4. ✅ **Admin user auto-initialized from env vars** (NEW)
5. ✅ Server starts

This ensures the admin user always exists after deployment.

---

**Status:** ✅ Fix deployed to GitHub
**Action Required:** Redeploy on Railway or run manual admin creation script
**GitHub Commit:** a2c6cab
