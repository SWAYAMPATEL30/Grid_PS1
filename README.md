# ParkSight AI 🚔

ParkSight AI is a comprehensive, multi-role intelligence platform built to modernize traffic enforcement. It unifies operations across police officers, analysts, verifiers, tow operators, citizens, and vehicle owners into a single, real-time ecosystem powered by Machine Learning.

![ParkSight AI Login](app/login/page.tsx) <!-- Replace with an actual screenshot path later if desired -->

## ✨ Features

### 🔐 Multi-Role Authentication System (RBAC)
Secure JWT-based login routing users to their dedicated operational portals automatically.
* **ADMIN**: Access to the live operations map, user management, and system-wide analytics.
* **ANALYST**: Access to ML predictions, speed analytics, heatmaps, and pattern forecasting.
* **POLICE OFFICER**: Mobile-friendly PWA for clocking in/out, real-time GPS tracking, and uploading geo-tagged violations.
* **VERIFIER**: Task dashboard to review, approve, or reject citizen-submitted violation photos.
* **TOW OPERATOR**: Dispatch queue showing active towing assignments mapped via GPS.
* **CITIZEN**: Public portal for citizens to capture and submit photos of illegal parking.
* **VEHICLE OWNER**: Self-service portal to lookup fine histories via registration number and file appeals.

### 🤖 Machine Learning Engine
Trained `RandomForest` models to provide actionable intelligence:
* **Violation Count Predictor**: Predicts future violation volume at a specific police station based on time, day, and month.
* **Hotspot Risk Predictor**: Calculates the percentage probability of a junction becoming a traffic bottleneck based on vehicle type and hour.

### 🏎️ Speed Analytics & Simulation
* Dynamic speed limits defined across major junctions.
* Leaderboards tracking top speeding zones and live violation metrics.

### 🗺️ Live Officer Operations Map
* Real-time GPS tracking of active officers mapped against pending citizen reports.
* Congestion proximity alerts push to officers within a specific radius of hotspots using Haversine formulas.

---

## 🚀 Setup & Installation (Local Dev)

Follow these instructions to pull, build, and run ParkSight AI on your local machine using Docker.

### 1. Clone the Repository
```bash
git clone https://github.com/SWAYAMPATEL30/Grid_PS1.git
cd Grid_PS1
```

### 2. Prerequisites
Ensure you have the following installed on your system:
- **Git**
- **Docker** and **Docker Compose**

### 3. Build and Run via Docker Compose
```bash
docker-compose up --build -d
```
> Wait approximately 30-60 seconds for the database to initialize and the Next.js frontend to compile.

### 4. Run the Database Migrations
```bash
docker-compose exec api python scripts/run_migrations.py
```

### 5. Seed the Demo Data
```bash
docker-compose exec api python scripts/seed_demo.py
```

---

## 🏭 Production Deployment

For production, use the dedicated `docker-compose.prod.yml`:

```bash
# Build and launch all production containers (detached)
docker-compose -f docker-compose.prod.yml up --build -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec api python scripts/run_migrations.py

# Seed demo users (first time only)
docker-compose -f docker-compose.prod.yml exec api python scripts/seed_demo.py
```

**Key production differences vs. development:**
| Feature | Dev | Production |
|---|---|---|
| API Server | `uvicorn --reload` | `gunicorn` with 4 uvicorn workers |
| Frontend | `next dev` (HMR) | `next start` (pre-built, optimized) |
| DB Port | Exposed `5432` | Internal only (not exposed) |
| API Docs | `/docs` and `/redoc` | Hidden for security |
| CORS | Wildcard `*` | Restricted to `ALLOWED_ORIGINS` env var |
| Security headers | None | `X-Frame-Options`, `X-Content-Type-Options`, etc. |

### Environment Variables (Production)

To customize for your deployment, set these environment variables on the `api` service in `docker-compose.prod.yml`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@db:5432/parksight
JWT_SECRET=your-strong-secret-key-minimum-32-chars
ENVIRONMENT=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 🎮 How to Use

1. Open **[http://localhost:3000/login](http://localhost:3000/login)**
2. Click any **"Quick Demo Access"** button to log in as a specific role.
3. Password for all demo accounts: `Password@123`

### Portal Overview:
| Role | URL | Description |
|---|---|---|
| Admin / Analyst | `/dashboard/overview` | Full analytics dashboard + ML engine |
| Police Officer | `/field` | Mobile GPS field ops app |
| Verifier | `/verify` | Review and approve citizen reports |
| Tow Operator | `/tow` | Active dispatch queue |
| Citizen | `/citizen` | Submit illegal parking photos |
| Vehicle Owner | `/owner` | Check fines, file appeals |

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16, React 19, Tailwind CSS (Glassmorphism)
* **Backend**: FastAPI, Python 3.11, SQLAlchemy (Async), asyncpg
* **Database**: PostgreSQL 15 with PostGIS
* **Machine Learning**: Scikit-Learn (Random Forest)
* **Production Server**: Gunicorn + Uvicorn workers
* **Infrastructure**: Docker, Docker Compose

