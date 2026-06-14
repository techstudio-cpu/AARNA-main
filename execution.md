AARNA - Comprehensive Repository Audit & Modernization Blueprint
Repository Facts
Actual repository findings:
- Express.js + EJS application
- PostgreSQL support with migrations
- Gemini AI integration
- Authentication & sessions
- Lead CRM
- Quotation Builder
- Audit system
- PWA support
- Railway deployment configuration
- 24 EJS views
- Controllers: AI, Auth, Lead, Public, Quotation, User
- Routes: Admin, API, Auth, Public
- Admin view size: ~251,532 characters
Architecture Assessment
Current architecture follows a clean MVC pattern. Folder organization is significantly above average for a local-business platform.
Strengths:
• controllers/
• routes/
• middleware/
• services/
• migrations/
• config/
• tests/
Weakness:
Business logic is still partially coupled to server-rendered EJS views.
Website Audit
Current website is functional but not positioned as a premium solar brand.
Recommended additions:
• Modern hero section
• Installation gallery
• Customer success stories
• Government subsidy calculator
• ROI calculator
• EMI estimator
• WhatsApp lead funnel
• Video testimonials
• Trust badges
• Case studies
Admin Audit
Admin is the strongest part of the system.
Recommended roadmap:
Phase 1:
• Modular dashboard
• Lead timeline
• Follow-up scheduler
• Activity tracking

Phase 2:
• Role-based access control
• Team assignment
• Kanban pipeline

Phase 3:
• AI lead scoring
• Automated reminders
• WhatsApp integration
• Analytics center
Critical Technical Debt
Highest priority issue:
admin.ejs ≈ 251k characters.

Split into:
views/admin/dashboard.ejs
views/admin/leads.ejs
views/admin/quotations.ejs
views/admin/analytics.ejs
views/admin/settings.ejs

Create reusable components and partials.
SEO Blueprint
Create:
• City landing pages
• Blog engine
• FAQ schema
• Service schema
• Local business schema
• Solar subsidy pages
• Project case studies

Target cities:
Bhopal
Indore
Jabalpur
Rewa
Satna
Sagar
Future Architecture
Frontend:
Next.js 15

Backend:
Express API Layer

Database:
PostgreSQL

Storage:
Cloudflare R2

Auth:
JWT + Refresh Tokens

Monitoring:
Sentry + Better Stack

CI/CD:
GitHub Actions + Railway
AI Agent Execution Plan
Sprint 1:
Admin modularization

Sprint 2:
Website redesign

Sprint 3:
SEO implementation

Sprint 4:
CRM enhancements

Sprint 5:
Automation & AI

Sprint 6:
Next.js migration