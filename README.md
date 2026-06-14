# Aarna Solars and Services

A modern website and admin panel for **Aarna Solars and Services** — TATA Power SOLAROOF Partner providing solar energy solutions in Madhya Pradesh.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS Templates, Tailwind CSS (via CDN)
- **Database**: PostgreSQL
- **Live Chat**: CometChat Widget
- **Deployment**: Railway

## Features

- Responsive modern design with PWA support
- Admin panel with lead management, quotation builder, analytics
- Live chat via CometChat (guest mode for visitors, UID mode for admins)
- Contact form and callback request functionality
- Portfolio showcase (Industrial, Institutional, Domestic)
- Email notifications via Resend API
- PostgreSQL-backed user auth, sessions, and audit logging

## Local Development

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd aarna-solars
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your PostgreSQL and CometChat credentials.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `ADMIN_USERNAME` | Admin panel login username |
| `ADMIN_PASSWORD` | Admin panel login password |
| `ADMIN_NAME` | Admin display name |
| `SESSION_SECRET` | Express session secret (min 32 chars) |
| `DATABASE_URL` | PostgreSQL connection string |
| `COMETCHAT_APP_ID` | CometChat App ID |
| `COMETCHAT_AUTH_KEY` | CometChat Auth Key |
| `COMETCHAT_REGION` | CometChat Region (us/eu/in) |
| `COMETCHAT_SUPPORT_UID` | CometChat UID for the support agent (default: `support`) |

## Deployment on Railway

### Quick Deploy (via GitHub Integration)

1. **Push code to GitHub** ✅ (Already completed)
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. **Connect Railway to GitHub**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `techstudio-cpu/AARNA-main`
   - Railway will automatically detect the Node.js project

3. **Configure Environment Variables**
   In Railway dashboard, add these variables:

   | Variable | Required | Description | Default/Example |
   |----------|----------|-------------|----------------|
   | `NODE_ENV` | Yes | Environment | `production` |
   | `PORT` | Yes | Server port | `3000` |
   | `SESSION_SECRET` | Yes | Session encryption key | Generate random 32+ chars |
   | `DATABASE_URL` | Recommended | PostgreSQL connection string | Railway provides this |
   | `ADMIN_USERNAME` | Yes | Admin login username | `ST3093541` |
   | `ADMIN_PASSWORD` | Yes | Admin login password | Strong password |
   | `ADMIN_NAME` | Yes | Admin display name | `Admin` |
   | `RESEND_API_KEY` | Optional | Email sending API key | For Resend |
   | `GEMINI_API_KEY` | Optional | AI features API key | For AI features |

4. **Add PostgreSQL Database**
   - In Railway project, click "New Service" → "Database" → "PostgreSQL"
   - Railway will automatically inject `DATABASE_URL` into your app
   - The app will auto-run migrations on deploy

5. **Deploy**
   - Railway will automatically deploy on push
   - Check deployment logs for any issues
   - Monitor health check at `https://your-app.railway.app/health`

### Manual Deploy (CLI)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL database
railway add postgresql

# Set environment variables
railway variables set NODE_ENV=production
railway variables set ADMIN_USERNAME=ST3093541
railway variables set ADMIN_PASSWORD=your_password
railway variables set ADMIN_NAME=Admin
railway variables set SESSION_SECRET=your_random_secret_key

# Deploy
railway up
```

### Railway Configuration Files

- **`railway.json`** - Main Railway configuration with health checks
- **`.nixpacks.toml`** - Build configuration for Nixpacks
- **`Dockerfile`** - Alternative Docker deployment support

### Health Check

The application includes a health check endpoint:
```
GET /health
```

Returns JSON with:
- Status (healthy/unhealthy)
- Uptime
- Memory usage
- Database connection status
- Database stats (leads, quotations count)
- Response time
- Node version

### Railway Features Configured

✅ **Health Check** - Auto-restarts if unhealthy
✅ **PostgreSQL Integration** - Auto-migrations on deploy
✅ **Environment Variables** - Secure secret management
✅ **Automatic SSL** - HTTPS by default
✅ **Auto-scaling** - Scales based on traffic
✅ **Deploy Hooks** - Runs on every push

## Project Structure

```
aarna-solars/
├── server.js           # Express server (routes, APIs, middleware)
├── package.json        # Dependencies
├── config/             # Auth, database, mailer, sessions, audit
├── migrations/         # PostgreSQL schema and data migrations
├── views/              # EJS templates
│   ├── partials/       # Header, Footer (includes CometChat widget)
│   ├── index.ejs       # Home page
│   ├── services.ejs    # Services page
│   ├── portfolio.ejs   # Portfolio page
│   ├── about.ejs       # About page
│   ├── contact.ejs     # Contact page
│   ├── admin.ejs       # Admin panel (leads, quotes, analytics)
│   └── admin-login.ejs # Admin login page
├── public/             # Static assets (logo, manifest, PWA)
└── .env.example        # Environment template
```

## Contact

- **Toll Free**: 1800 419 8777
- **Phone**: +91 99931-24222
- **Location**: Jawahar Nagar, Lane No. 1, Near Kashi Palace, Satna

---

© 2025 Aarna Solars and Services. TATA Power SOLAROOF Partner.
