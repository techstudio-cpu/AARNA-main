# Railway Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Repository
- [x] Code pushed to GitHub (https://github.com/techstudio-cpu/AARNA-main.git)
- [x] Railway configuration files present:
  - [x] `railway.json` - Deployment configuration
  - [x] `.nixpacks.toml` - Build configuration
  - [x] `Dockerfile` - Alternative Docker support
- [x] `.gitignore` properly configured
- [x] Dependencies in `package.json`
- [x] Health check endpoint at `/health`
- [x] Start command: `npm start`

### ✅ Application Configuration
- [x] PostgreSQL database support with fallback to JSON
- [x] Session management with PostgreSQL or memory store
- [x] Environment variable support
- [x] Security middleware (Helmet)
- [x] Rate limiting configured
- [x] Error handling middleware
- [x] Graceful shutdown handling

### ✅ Database
- [x] PostgreSQL schema migrations in place
- [x] Auto-migration on startup
- [x] Data migration from JSON to PostgreSQL
- [x] Connection pooling configured

## Railway Setup Instructions

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" button
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select the repository: `techstudio-cpu/AARNA-main`
6. Click "Deploy Now"

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL instance
4. The `DATABASE_URL` environment variable will be automatically added to your app

### Step 3: Configure Environment Variables

In your Railway app settings, add these environment variables:

#### Required Variables
```
NODE_ENV=production
PORT=3000
SESSION_SECRET=<generate-a-random-32-char-string>
ADMIN_USERNAME=ST3093541
ADMIN_PASSWORD=<your-secure-password>
ADMIN_NAME=Admin
```

#### Optional Variables
```
RESEND_API_KEY=resend-api-key-here
GEMINI_API_KEY=gemini-api-key-here
```

**Generate SESSION_SECRET:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### Step 4: Deploy

1. Railway will automatically detect the configuration
2. Click "Deploy" button
3. Monitor deployment logs:
   - Railway will run `npm install`
   - Run migrations automatically
   - Start the server
   - Health check will verify the app is running

### Step 5: Verify Deployment

1. Check the deployment status in Railway dashboard
2. Visit your Railway URL (e.g., `https://your-app.railway.app`)
3. Test health check: `https://your-app.railway.app/health`
4. Test admin login: `https://your-app.railway.app/admin`
5. Test main website: `https://your-app.railway.app/`

## Environment Variables Reference

### Database
- `DATABASE_URL` - PostgreSQL connection string (Railway provides this automatically)

### Application
- `NODE_ENV` - Set to `production` for Railway
- `PORT` - Port number (default: 3000)
- `SESSION_SECRET` - Random string for session encryption (min 32 chars)

### Admin
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD` - Admin login password (use strong password)
- `ADMIN_NAME` - Admin display name

### Email (Optional)
- `RESEND_API_KEY` - Resend API key for email sending
- `SMTP_PASSWORD` - Alternative SMTP password

### AI Features (Optional)
- `GEMINI_API_KEY` - Google Gemini API key for AI features

## Troubleshooting

### Deployment Failures

**Issue:** Build fails during npm install
- Check `package.json` for correct dependencies
- Ensure all dependencies are compatible with Node.js 18+
- Check Railway build logs for specific errors

**Issue:** Database connection fails
- Verify PostgreSQL service is running
- Check if `DATABASE_URL` is set
- Ensure migrations ran successfully
- Check logs for database errors

**Issue:** Health check failing
- Verify the server is starting correctly
- Check if PORT is correct
- Review application logs for errors
- Ensure all required environment variables are set

### Runtime Issues

**Issue:** 502 Bad Gateway
- Check if the app is running
- Verify health check endpoint is responding
- Review logs for startup errors

**Issue:** Admin login not working
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set
- Check if session store is configured
- Ensure PostgreSQL is accessible

**Issue:** Database migrations not running
- Check logs for migration errors
- Verify PostgreSQL connection
- Ensure migrations files are present in `migrations/` directory

## Monitoring

### Railway Dashboard

1. **Deployment Logs** - View real-time logs
2. **Metrics** - CPU, memory, and network usage
3. **Health Check** - Auto-restart if unhealthy
4. **Environment Variables** - Manage secrets securely

### Health Check Endpoint

Visit `/health` to get:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": {
    "seconds": 3600,
    "formatted": "0d 1h 0m 0s"
  },
  "memory": {
    "rss": "128MB",
    "heapUsed": "64MB",
    "external": "8MB"
  },
  "database": {
    "status": "connected",
    "stats": {
      "total_leads": 0,
      "total_quotations": 0
    }
  },
  "responseTime": "50ms",
  "version": "1.0.0",
  "nodeVersion": "v18.17.0"
}
```

## Security Best Practices

1. **Never commit secrets** - Use Railway environment variables
2. **Use strong passwords** - Generate secure `SESSION_SECRET` and `ADMIN_PASSWORD`
3. **Enable HTTPS** - Railway provides this automatically
4. **Monitor logs** - Regularly check for suspicious activity
5. **Keep dependencies updated** - Run `npm audit` regularly
6. **Use PostgreSQL in production** - JSON storage is for development only

## Post-Deployment Tasks

1. **Set up custom domain** (optional)
   - In Railway, go to Settings → Domains
   - Add your custom domain
   - Configure DNS records

2. **Configure email service**
   - Set up Resend API key
   - Test email notifications

3. **Back up database**
   - Railway provides automatic backups
   - Configure backup schedule if needed

4. **Set up monitoring**
   - Enable Railway alerts
   - Configure error tracking (Sentry optional)

5. **Test all features**
   - Admin login
   - Lead creation
   - Quotation builder
   - Analytics
   - Public website

## Deployment Checklist Summary

- [ ] Repository connected to Railway
- [ ] PostgreSQL database added
- [ ] All environment variables configured
- [ ] Deployment successful
- [ ] Health check passing
- [ ] Admin login working
- [ ] Website accessible
- [ ] Database migrations completed
- [ ] Email service configured (optional)
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled
- [ ] Back up strategy confirmed

## Support

For issues with:
- **Railway platform**: [Railway Documentation](https://docs.railway.app)
- **Application**: Check application logs in Railway dashboard
- **GitHub Repository**: https://github.com/techstudio-cpu/AARNA-main/issues

---

Last updated: January 2025
