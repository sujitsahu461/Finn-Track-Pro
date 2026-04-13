# FinTrack Pro 💰
> A production-grade personal finance tracker — built with React, Node.js, PostgreSQL & Prisma.

---

## 📁 Folder Structure

```
fintrack-pro/
├── frontend/                  # React + Vite app
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Reusable UI primitives
│   │   │   ├── charts/        # Recharts wrappers
│   │   │   ├── modals/        # Transaction modal
│   │   │   └── layout/        # Sidebar, Topbar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Budget.jsx
│   │   │   └── Settings.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useTransactions.js
│   │   │   └── useBudget.js
│   │   ├── services/
│   │   │   └── api.js         # Axios instance + interceptors
│   │   ├── store/
│   │   │   └── authStore.js   # Zustand auth state
│   │   ├── utils/
│   │   │   ├── currency.js
│   │   │   └── dateHelpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.local
│   ├── vite.config.js
│   └── package.json
│
├── backend/                   # Express API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── transactions.controller.js
│   │   │   ├── analytics.controller.js
│   │   │   └── budget.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── transactions.routes.js
│   │   │   ├── analytics.routes.js
│   │   │   └── budget.routes.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   ├── logger.js
│   │   │   └── prisma.js
│   │   └── server.js
│   ├── logs/
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## ⚙️ Environment Variables

### Backend `.env`
```env
# Database — Neon or Supabase PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST/fintrack?sslmode=require"

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET="your-64-char-random-secret-here"

# Server
PORT=5000
NODE_ENV=production
CLIENT_URL="https://your-frontend.vercel.app"

# Logging
LOG_LEVEL=info
```

### Frontend `.env.local`
```env
VITE_API_URL="http://localhost:5000/api/v1"
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL (or a free Neon / Supabase instance)
- pnpm / npm / yarn

### Backend
```bash
cd backend
npm install

# Set up .env (see above)

# Run migrations and generate Prisma client
npx prisma migrate dev --name init
npx prisma generate

# (Optional) seed demo data
npx prisma db seed

# Start dev server
npm run dev
```

### Frontend
```bash
cd frontend
npm install

# Create .env.local (see above)

npm run dev
# → http://localhost:5173
```

---

## 📦 Package.json — Backend

```json
{
  "name": "fintrack-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev":   "nodemon src/server.js",
    "start": "node src/server.js",
    "lint":  "eslint src"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0",
    "bcryptjs":        "^2.4.3",
    "cors":            "^2.8.5",
    "dotenv":          "^16.4.5",
    "express":         "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "helmet":          "^7.1.0",
    "jsonwebtoken":    "^9.0.2",
    "morgan":          "^1.10.0",
    "winston":         "^3.13.0",
    "zod":             "^3.23.8"
  },
  "devDependencies": {
    "nodemon":  "^3.1.4",
    "prisma":   "^5.14.0"
  }
}
```

## 📦 Package.json — Frontend

```json
{
  "name": "fintrack-ui",
  "version": "1.0.0",
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios":         "^1.7.2",
    "framer-motion": "^11.3.2",
    "lucide-react":  "^0.400.0",
    "react":         "^18.3.1",
    "react-dom":     "^18.3.1",
    "react-router-dom": "^6.24.0",
    "recharts":      "^2.12.7",
    "zustand":       "^4.5.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer":         "^10.4.19",
    "postcss":              "^8.4.40",
    "tailwindcss":          "^3.4.7",
    "vite":                 "^5.3.4"
  }
}
```

---

## 📡 API Documentation

### Base URL: `https://api.fintrack.app/api/v1`

All protected routes require: `Authorization: Bearer <accessToken>`

---

### Auth Routes

| Method | Endpoint         | Auth? | Body                          | Description          |
|--------|-----------------|-------|-------------------------------|----------------------|
| POST   | /auth/signup     | ✗     | `{name, email, password}`     | Create account       |
| POST   | /auth/login      | ✗     | `{email, password}`           | Sign in              |
| POST   | /auth/refresh    | ✗     | `{refreshToken}`              | Rotate tokens        |
| POST   | /auth/logout     | ✗     | `{refreshToken}`              | Invalidate token     |
| GET    | /auth/me         | ✓     | —                             | Get current user     |

### Transaction Routes

| Method | Endpoint              | Auth? | Description                |
|--------|-----------------------|-------|----------------------------|
| GET    | /transactions         | ✓     | List (paginated + filtered) |
| POST   | /transactions         | ✓     | Create transaction          |
| GET    | /transactions/:id     | ✓     | Get single transaction      |
| PATCH  | /transactions/:id     | ✓     | Update transaction          |
| DELETE | /transactions/:id     | ✓     | Delete transaction          |
| DELETE | /transactions/bulk    | ✓     | Bulk delete by IDs          |

**GET /transactions query params:**
```
?page=1&limit=20
&type=INCOME|EXPENSE
&category=Food
&search=grocery
&from=2024-01-01&to=2024-04-30
&sort=date|amount|category
&order=asc|desc
```

### Analytics Routes

| Method | Endpoint              | Query Params        | Description             |
|--------|-----------------------|---------------------|-------------------------|
| GET    | /analytics/summary    | `year`, `month`     | Month totals + balance  |
| GET    | /analytics/monthly    | `year`              | 12-month income/expense |
| GET    | /analytics/categories | `year`, `month`     | Category breakdown      |
| GET    | /analytics/trends     | `months` (1–12)     | Rolling net balance     |

### Budget Routes

| Method | Endpoint | Query Params      | Body                           | Description          |
|--------|---------|-------------------|--------------------------------|----------------------|
| GET    | /budget  | `year`, `month`   | —                              | Get budget for month |
| POST   | /budget  | —                 | `{total, month, year, categoryBudgets}` | Upsert budget |

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Then push to GitHub and connect repo in vercel.com
# Set env: VITE_API_URL = https://your-backend.onrender.com/api/v1
```

### Backend → Render
1. Create a **Web Service** on render.com
2. Connect your GitHub repo, set root to `backend/`
3. Build command: `npm install && npx prisma generate`
4. Start command: `node src/server.js`
5. Add all environment variables from `.env`

### Database → Neon (Serverless PostgreSQL)
1. Create project at neon.tech
2. Copy the connection string to `DATABASE_URL` in Render env vars
3. Run `npx prisma migrate deploy` after first deploy

---

## 🔮 SaaS Scaling & Monetization Ideas

### Scaling Architecture
- **Redis** for caching analytics queries (TTL: 5 min)
- **Bull/BullMQ** for recurring transaction automation (cron jobs)
- **S3** for PDF export storage
- **Multi-tenant** architecture with organizations
- **Read replicas** via Neon branching for analytics queries

### Monetization (Subscription Model)
| Plan     | Price    | Features                                        |
|----------|----------|-------------------------------------------------|
| Free     | $0/mo    | 100 transactions/mo, basic charts               |
| Pro      | $9/mo    | Unlimited, CSV/PDF export, multi-currency, AI   |
| Business | $29/mo   | Team collaboration, API access, custom budgets  |

### Admin Dashboard Concept
- User management table (suspend, verify, export)
- Revenue MRR/ARR metrics (Stripe integration)
- System health: DB connections, API latency, error rates
- Feature flags (LaunchDarkly) for gradual rollouts
- Audit logs for compliance

### AI-Powered Features (OpenAI GPT-4)
- **Smart categorization**: Auto-categorize from transaction description
- **Spending insights**: "You spent 40% more on Food this month"
- **Forecast**: Project next month's spending from patterns
- **Chat assistant**: "How much did I spend on travel last quarter?"

---

## 🔒 Security Checklist

- [x] JWT access tokens (15 min expiry) + rotating refresh tokens
- [x] bcrypt password hashing (cost factor 12)
- [x] Rate limiting (global + per-auth-endpoint)
- [x] Helmet.js security headers
- [x] Zod input validation on all endpoints
- [x] CORS restricted to frontend origin
- [x] Prisma parameterized queries (SQL injection proof)
- [x] No sensitive data in logs or responses
- [x] Environment variable secrets (never in code)
- [ ] HTTPS enforced via Render/Vercel (auto)
- [ ] Email verification flow (recommended for prod)
- [ ] 2FA (TOTP) for business plan
