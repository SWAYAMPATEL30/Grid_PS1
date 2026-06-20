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

## 🚀 Setup & Installation

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
We use Docker to effortlessly spin up the PostgreSQL database, the FastAPI backend, and the Next.js frontend in one command.

```bash
docker-compose up --build -d
```
*Wait approximately 30-60 seconds for the database to initialize and the Next.js frontend to install its dependencies.*

### 4. Run the Database Migrations
Once the containers are running, you need to create the database tables. Run the following command:

```bash
docker-compose exec api python scripts/run_migrations.py
```

### 5. Seed the Demo Data
To log in, you will need the demo users and initial ML simulation data. Run the seeder script:

```bash
docker-compose exec api python scripts/seed_demo.py
```

---

## 🎮 How to Use

Once the setup is complete, the platform is ready!

1. Open your web browser and navigate to: **[http://localhost:3000/login](http://localhost:3000/login)**
2. On the left side of the login screen, click any of the **"Quick Demo Access"** buttons to automatically log in as a specific role.
3. The password for all demo accounts is: `Password@123`

### Exploring the Portals:
* **Citizen**: Try uploading a photo from the citizen portal.
* **Verifier**: Log in as a Verifier and approve the photo you just uploaded.
* **Officer**: Log in as an Officer, click "Clock In", and watch the live GPS tracker activate.
* **Admin**: Check the "Live Map" in the sidebar to see the officer's real-time position.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14, React, Tailwind CSS (Glassmorphism design system)
* **Backend**: FastAPI, Python 3.11, SQLAlchemy, asyncpg
* **Database**: PostgreSQL (with PostGIS support)
* **Machine Learning**: Scikit-Learn (Random Forest Regression & Classification)
* **Infrastructure**: Docker & Docker Compose
