# 🚔 ParkSight AI: Flipkart Gridlock 2.0

> **Transforming City Traffic Enforcement from Reactive to Predictive.**

🚀 **Live Interactive Demo:** [https://respectful-fascination-production-afbf.up.railway.app](https://respectful-fascination-production-afbf.up.railway.app)

---

## 🚦 The Gridlock Crisis (Problem Statement)
**Operational Challenge:** On-street illegal parking and spillover parking near commercial areas, metro stations, and events systematically choke carriageways and vital intersections.

**Why It’s Hard Today:**
* Enforcement is entirely **patrol-based and reactive**. Police respond only *after* gridlock has formed.
* There is **no heatmap** visualizing the correlation between parking violations and their cascading impact on traffic flow.
* It is **difficult to objectively prioritize** which enforcement zones need the most urgent attention.

**Our Core Question:** *How can AI-driven parking intelligence detect illegal parking hotspots and quantify their impact on traffic flow to enable targeted enforcement?*

---

## 💡 The Solution: ParkSight AI
ParkSight AI is a unified, multi-role intelligence platform. By leveraging an advanced Machine Learning Prediction Engine, we process historical data, vehicle typologies, and temporal patterns to forecast gridlock *before* it happens. We give city administrators interactive 3D heatmaps, precise hotspot probabilities, and completely digitized enforcement pipelines.

---

## 🔑 A 7-Role Ecosystem
Gridlock is an ecosystem problem. ParkSight AI solves it with a 7-role operational ecosystem accessed via a secure JWT-based RBAC authentication system.

### 🧠 The Intelligence Core
1. **System Admin:** The God-view dashboard. Track live, real-time GPS coordinates of active officers, overall city violation heatmaps, and live revenue collection.
2. **Data Analyst:** Access to the XGBoost Machine Learning Engine. Features include a 120-day forecasting model, time-of-day temporal analysis, pattern decoding, and exact hotspot risk prediction.

### 🛡️ The Operations Loop
3. **SCITA Verifier:** The human firewall. A specialized dashboard where verifiers manually review and approve AI-flagged violations (from CCTV or citizens) before a challan is issued.
4. **Police Officer (`/field`):** A mobile-first Field App with built-in OCR scanning. Officers can read license plates with their cameras, issue smart e-challans instantly, and request tows with one tap.
5. **Tow Operator (`/tow`):** An Uber-style dispatch queue. Tow truck drivers receive exact GPS coordinates and Google Maps routing to clear blocking vehicles effortlessly.

### 🏙️ Public Engagement
6. **Citizen Portal (`/citizen`):** Empowers the public to crowd-source violations by capturing geo-tagged photos. Gamified with a **Driver Reputation Score**—good reporting builds your score, repeated offenses lower it.
7. **Vehicle Owner Portal (`/owner`):** A transparent gateway for vehicle owners to view photographic evidence of their challans and pay fines instantly via digital integrations.

---

## 🤖 The Technology Stack
A state-of-the-art architecture built for speed, scale, and intelligence.

* **Frontend:** Next.js 16, React 19, Tailwind CSS (Custom Dark Glassmorphism), Leaflet & Google Maps API integrations.
* **Backend:** FastAPI, Python 3.11, SQLAlchemy (Async), asyncpg.
* **Database:** PostgreSQL 15 with PostGIS.
* **Machine Learning:** Scikit-Learn (Random Forest & XGBoost classifiers trained on 18 distinct features).
* **Deployment:** Fully dockerized, optimized with Gunicorn + Uvicorn workers, hosted on Railway.

---

## 🎮 How to Use The Live Demo
1. Open the [Live App](https://respectful-fascination-production-afbf.up.railway.app).
2. On the login screen, click any of the **"Quick Demo Access"** role buttons (Admin, Tow Op, Officer, etc.).
3. Password for all demo accounts defaults to: `Password@123`.
4. Click **Login** and instantly experience how the UI completely morphs for that specific role!

---

## 🚀 Local Setup & Installation

If you wish to run ParkSight AI locally on your machine, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/SWAYAMPATEL30/Grid_PS1.git
cd Grid_PS1
```

### 2. Build and Run via Docker Compose
Ensure you have Docker and Docker Compose installed.
```bash
docker-compose up --build -d
```
> *Wait approximately 30-60 seconds for the PostgreSQL database to initialize and the Next.js frontend to compile.*

### 3. Run the Database Migrations & Seed Demo Data
Run these commands in your terminal to populate the database with mock violations and ML models:
```bash
docker-compose exec api python scripts/run_migrations.py
docker-compose exec api python scripts/seed_demo.py
```

### 4. Access Localhost
Go to [http://localhost:3000](http://localhost:3000) and use the same Quick Demo Access buttons!
