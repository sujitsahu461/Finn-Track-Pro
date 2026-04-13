# 💰 FinTrack Pro

> A full-stack personal finance tracker built with **React + Vite** (frontend) and **Node.js + Express + Prisma + SQLite** (backend).  
> Uses an **Envelope Budgeting** approach — set your Main Amount at the start of every month and track exactly where your money goes.

---

## ✨ Features

- 🔐 **JWT Authentication** — Signup & Login with bcrypt-hashed passwords
- 💼 **Envelope Budgeting** — Set a "Main Amount" on Day 1, deduct expenses throughout the month
- 📅 **12-Month Calendar Picker** — Switch between any month/year to track history
- 📊 **Analytics Dashboard** — Visual charts for spending breakdown by category
- 🧾 **Expense History** — Full list with search, filter, edit & delete
- 💾 **Persistent Storage** — Data saved to `localStorage` (survives page refresh)
- 🌙 **Dark / Light Mode** — Toggle from sidebar or Settings
- 💱 **Multi-Currency** — USD, EUR, GBP, INR, JPY
- 📤 **CSV Export** — Download full expense history
- 🗑️ **Clear History** — Delete all expenses from the Transactions page
- 📱 **Responsive Layout** — Works on all screen sizes

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Recharts, Lucide React |
| Styling | Vanilla CSS, Google Fonts (Inter) |
| Backend | Node.js, Express.js |
| Database | SQLite (via Prisma ORM) |
| Auth | JWT (access tokens), bcryptjs |
| Validation | Zod |

---

## 📁 Project Structure

```
FinTrackPro/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (SQLite)
│   │   └── dev.db              # Local SQLite database
│   ├── src/
│   │   ├── controllers/        # auth, transactions, analytics
│   │   ├── middleware/         # JWT auth, error handler
│   │   ├── routes/             # auth, transactions, budget, analytics
│   │   ├── utils/              # prisma client, JWT helpers, logger
│   │   └── server.js           # Express entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root — handles auth state
│   │   ├── AuthPage.jsx        # Login / Signup split-screen
│   │   ├── AuthPage.css        # Auth page styles
│   │   ├── FinTrackPro.jsx     # Main dashboard app
│   │   └── index.css           # Global reset styles
│   └── package.json
│
├── start_servers.bat           # One-click start for both servers
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or above
- Git

### 1. Clone the repository
```bash
git clone https://github.com/sujitsahu461/Finn-Track-Pro.git
cd Finn-Track-Pro
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET="your-super-secret-key"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

Initialize the database:
```bash
npx prisma db push
npx prisma generate
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
```

### 4. Start Both Servers

**Option A — One click (Windows):**
```
Double-click start_servers.bat
```

**Option B — Manual:**
```bash
# Terminal 1 (backend)
cd backend
npm run dev

# Terminal 2 (frontend)
cd frontend
npm run dev
```

### 5. Open the App
```
http://localhost:5173
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register (name, username, email, password) |
| POST | `/api/v1/auth/login` | Login (username or email + password) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/transactions` | List all transactions |
| POST | `/api/v1/transactions` | Create transaction |
| PUT | `/api/v1/transactions/:id` | Update transaction |
| DELETE | `/api/v1/transactions/:id` | Delete transaction |
| GET | `/api/v1/analytics/summary` | Monthly summary |

---

## 📸 Screenshots

> Login Page — Blue split-screen design with dashboard mockup  
> Dashboard — Main Amount + burn-down progress + recent expenses  
> Transactions — Full history with search, filter, edit & delete  
> Analytics — Pie chart & bar chart of spending by category  
> Settings — Account info, theme toggle, currency, logout  

---

## 🛡️ Security Notes

- Passwords are hashed using **bcrypt (12 rounds)**
- JWT tokens expire and use **refresh token rotation**
- Zod validates all API inputs server-side
- `.env` and `node_modules` are excluded from Git via `.gitignore`

---

## 📌 Future Improvements

- [ ] Cloud PostgreSQL (Neon/Supabase) for production
- [ ] Recurring expense automation
- [ ] Monthly email/PDF report
- [ ] Mobile app (React Native)
- [ ] Google OAuth integration

---

## 👨‍💻 Author

**Sujit Sahu**  
GitHub: [@sujitsahu461](https://github.com/sujitsahu461)

---

## 📄 License

MIT License — free to use and modify.
