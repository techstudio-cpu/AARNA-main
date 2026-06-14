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

1. Push code to GitHub
2. Connect Railway to your GitHub repository
3. Add environment variables in Railway dashboard
4. Railway will automatically deploy

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
