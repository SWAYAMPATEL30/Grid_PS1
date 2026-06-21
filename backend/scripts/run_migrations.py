import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://parksight:parksight123@localhost:5432/parksight"
)
SYNC_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

DDL_PHASE2 = """
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  hashed_password VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  police_station VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS officer_sessions (
  id VARCHAR PRIMARY KEY,
  officer_id VARCHAR NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS officer_locations (
  id VARCHAR PRIMARY KEY,
  officer_id VARCHAR NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS citizen_reports (
  id VARCHAR PRIMARY KEY,
  citizen_id VARCHAR NOT NULL,
  photo_url VARCHAR NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status VARCHAR DEFAULT 'pending',
  verifier_id VARCHAR,
  assigned_officer_id VARCHAR,
  created_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tow_assignments (
  id VARCHAR PRIMARY KEY,
  violation_id VARCHAR NOT NULL,
  operator_id VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR PRIMARY KEY,
  recipient_id VARCHAR,
  vehicle_number VARCHAR,
  type VARCHAR NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS speed_zones (
  id VARCHAR PRIMARY KEY,
  zone_name VARCHAR NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_m FLOAT NOT NULL,
  speed_limit_kmh INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_registry (
  vehicle_number VARCHAR PRIMARY KEY,
  owner_name VARCHAR NOT NULL,
  owner_phone VARCHAR NOT NULL,
  owner_email VARCHAR
);
"""

def main():
    print(f"Connecting to: {SYNC_URL}")
    conn = psycopg2.connect(SYNC_URL)
    conn.autocommit = True
    cur = conn.cursor()
    print("Running Phase 2 DDL...")
    cur.execute(DDL_PHASE2)
    print("✅ Phase 2 Tables created successfully.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
