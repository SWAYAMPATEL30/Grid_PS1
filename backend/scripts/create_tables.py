"""
create_tables.py — Creates the violations table + PostGIS indexes.
Run this before load_data.py.

Usage:
    python scripts/create_tables.py
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Build sync DSN from env (psycopg2 doesn't use asyncpg prefix)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://parksight:parksight123@localhost:5432/parksight"
)
# Convert asyncpg URL to psycopg2 format
SYNC_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

DDL = """
CREATE TABLE IF NOT EXISTS violations (
  id VARCHAR PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location TEXT,
  vehicle_number VARCHAR,
  vehicle_type VARCHAR,
  violation_types TEXT[],
  offence_codes INTEGER[],
  created_datetime TIMESTAMPTZ,
  closed_datetime TIMESTAMPTZ,
  action_taken_timestamp TIMESTAMPTZ,
  device_id VARCHAR,
  created_by_id VARCHAR,
  center_code INTEGER,
  police_station VARCHAR,
  data_sent_to_scita BOOLEAN,
  junction_name VARCHAR,
  data_sent_to_scita_timestamp TIMESTAMPTZ,
  updated_vehicle_number VARCHAR,
  updated_vehicle_type VARCHAR,
  validation_status VARCHAR,
  validation_timestamp TIMESTAMPTZ,
  -- Derived
  hour_of_day INTEGER,
  day_of_week INTEGER,
  is_junction BOOLEAN DEFAULT FALSE,
  resolution_lag_mins DOUBLE PRECISION,
  severity_weight FLOAT DEFAULT 1.0
);

CREATE INDEX IF NOT EXISTS idx_violations_created ON violations(created_datetime);
CREATE INDEX IF NOT EXISTS idx_violations_station ON violations(police_station);
CREATE INDEX IF NOT EXISTS idx_violations_vehicle ON violations(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_violations_hour ON violations(hour_of_day);
CREATE INDEX IF NOT EXISTS idx_violations_validation ON violations(validation_status);
"""


def main():
    print(f"Connecting to: {SYNC_URL}")
    conn = psycopg2.connect(SYNC_URL)
    conn.autocommit = True
    cur = conn.cursor()
    print("Running DDL...")
    cur.execute(DDL)
    print("✅ Table and indexes created successfully.")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
