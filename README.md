# Market Sim — Economics Competition Simulator

A full-stack web application for running multi-team, multi-round pricing strategy competitions. Designed for classroom or workshop settings where teams compete in a simulated two-sided market, setting supplier and consumer prices each round to maximize cumulative profit.

---

## Key Features

- **Role-based access** — separate Admin and Student (team) login flows
- **Game management** — admins create games, configure teams, and control round progression
- **Pricing submissions** — each team submits supplier price (p_s) and consumer price (p_c) per round, with a deadline lock to prevent late changes
- **Automated calculations** — a network-effects model computes new suppliers, new consumers, and profit for every team after each round closes, using configurable game constants
- **Live analytics** — post-game charts (cumulative profit, supplier/consumer growth) with Chart.js; monthly aggregated results view
- **Credential management** — admin can generate and view team login credentials in bulk
- **Dockerized deployment** — single `docker compose up` spins up MongoDB, the API server, and the React frontend behind nginx

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, React Router v6, Chart.js |
| Backend | Node.js (ESM), Express 4, JWT authentication, bcryptjs |
| Database | MongoDB 7 via Mongoose |
| DevOps | Docker, Docker Compose, nginx |


## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (recommended), **or**
- Node.js 18+ and a local MongoDB instance for manual dev setup

---

### Option A — Docker (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/abhinavreddy-cmd/market-sim.git
cd market-sim

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env and set strong values for all variables

# 3. Start all services
docker compose up --build
```

The app will be available at **http://localhost:8081**.

---

### Option B — Local Development

**Backend**

```bash
cd backend
npm install

# Create a .env file in the backend directory
cp ../.env.example .env
# Edit .env — set MONGODB_URI to your local MongoDB connection string

npm run dev       # starts with --watch for hot reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev       # Vite dev server at http://localhost:5173
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values before running.

| Variable | Description |
|---|---|
| `MONGO_ROOT_USERNAME` | MongoDB root username |
| `MONGO_ROOT_PASSWORD` | MongoDB root password |
| `JWT_SECRET` | Secret key for signing JWTs — use a long random string |
| `JWT_EXPIRE` | JWT expiry duration (e.g. `7d`) |
| `ADMIN_USERNAME` | Admin account username (seeded on first startup) |
| `ADMIN_PASSWORD` | Admin account password |

---

## How It Works

1. **Admin creates a game** — sets a game name, number of teams, number of rounds, and economic constants (cost per participant, base supplier/consumer counts, network-effect magnifiers).
2. **Admin generates team accounts** — the platform creates student logins for each team.
3. **Each round**, teams log in, view the current round, and submit their pricing decisions before the admin locks the round.
4. **Admin closes the round** — the calculation service runs the network-effects model for every team simultaneously and stores results.
5. **Results are visible** immediately to both admins (full leaderboard + charts) and students (their own results).

---

## Project Structure

```
market-sim/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── middleware/       # JWT auth, role checks
│   ├── models/          # Mongoose schemas (User, Game, Round, RoundInput, RoundResult)
│   ├── routes/          # admin.js, auth.js, student.js
│   ├── services/        # calculationService.js — core economics engine
│   └── server.js        # Express app entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── admin/   # Dashboard, CreateGame, ManageRounds, Analytics, etc.
│       │   └── student/ # Dashboard, SubmitPrices, ViewResults
│       ├── context/     # AuthContext (JWT storage + user state)
│       └── hooks/       # useApi (axios wrapper)
├── docker-compose.yml
└── .env.example
```

---

## License

MIT — see [LICENSE](LICENSE).
