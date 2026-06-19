"""
seed_demo.py — Generates 5,000 synthetic violation records for demo.
Uses real Bengaluru coordinates, police station names, and realistic
temporal patterns (morning peak 7-10AM, evening peak 5-8PM).

Usage:
    python scripts/seed_demo.py [--count 5000]
"""
from __future__ import annotations
import argparse
import json
import os
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone, date

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://parksight:parksight123@localhost:5432/parksight",
)
SYNC_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

IST = timezone(timedelta(hours=5, minutes=30))
UTC = timezone.utc

# ── Real Bengaluru data ───────────────────────────────────────────────────────

POLICE_STATIONS = [
    "Cubbon Park", "MG Road", "Indiranagar", "Koramangala", "Whitefield",
    "Jayanagar", "JP Nagar", "Hebbal", "Yeshwanthpur", "Electronic City",
    "HSR Layout", "Marathahalli", "Rajajinagar", "Malleshwaram", "Banashankari",
]

JUNCTION_NAMES = [
    "Silk Board Junction", "KR Puram Junction", "Hebbal Flyover", "Tin Factory Junction",
    "Sony Signal", "Marathahalli Bridge", "Agara Junction", "Bellandur",
    "Domlur Flyover", "Koramangala 4th Block", "HSR Sector 2", "BTM Layout",
    "Jayanagar 4th Block", "JP Nagar 2nd Phase", "Bannerghatta Road Junction",
    "ITPL Main Gate", "Whitefield Station Road", "Hope Farm Junction",
    "Nagawara Junction", "Hebbal Lake Road",
]

# Bounding box: Bengaluru ~12.85–13.08°N, 77.45–77.75°E
LAT_RANGE = (12.85, 13.08)
LON_RANGE = (77.45, 77.75)

VIOLATION_TYPES_LIST = [
    "WRONG PARKING",
    "NO PARKING",
    "PARKING IN A MAIN ROAD",
    "PARKING ON FOOTPATH",
    "DOUBLE PARKING",
    "PARKING NEAR ROAD CROSSING",
    "PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC",
    "PARKING OPPOSITE TO ANOTHER PARKED VEHICLE",
]

VIOLATION_WEIGHTS = [30, 28, 12, 10, 7, 5, 5, 3]  # Biased to common types

VEHICLE_TYPES = ["CAR", "SCOOTER", "MOTORCYCLE", "AUTO RICKSHAW", "LGV",
                 "TRUCK", "BUS", "TANKER", "PRIVATE BUS"]
VEHICLE_WEIGHTS = [30, 25, 20, 10, 5, 4, 3, 2, 1]

VALIDATION_STATUSES = ["approved", "rejected", "pending", None]
VALIDATION_WEIGHTS = [60, 15, 20, 5]

SEVERITY_WEIGHTS: dict[str, float] = {
    "DOUBLE PARKING": 5.0,
    "PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC": 4.0,
    "PARKING IN A MAIN ROAD": 4.0,
    "PARKING ON FOOTPATH": 3.0,
    "PARKING NEAR ROAD CROSSING": 3.0,
    "WRONG PARKING": 2.0,
    "NO PARKING": 2.0,
    "PARKING OPPOSITE TO ANOTHER PARKED VEHICLE": 3.0,
}


def weighted_hour() -> int:
    """Return a realistic hour of day (peaks 7-10AM and 5-8PM)."""
    buckets = list(range(24))
    weights = [
        1, 0.5, 0.3, 0.3, 0.5, 1.5,   # 0-5
        3, 8, 9, 8, 5, 4,              # 6-11
        5, 5, 5, 5, 6, 9,              # 12-17
        10, 9, 7, 4, 2, 1,             # 18-23
    ]
    return random.choices(buckets, weights=weights, k=1)[0]


def random_datetime_in_range(
    start: datetime, end: datetime
) -> datetime:
    delta = end - start
    secs = int(delta.total_seconds())
    return start + timedelta(seconds=random.randint(0, secs))


def gen_vehicle_number() -> str:
    state = "KA"
    dist = str(random.randint(1, 99)).zfill(2)
    series = random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ")
    num = str(random.randint(1000, 9999))
    return f"{state}{dist}{series}{series}{num}"


def gen_record(start_dt: datetime, end_dt: datetime) -> dict:
    """Generate one synthetic violation record."""
    vt = random.choices(VIOLATION_TYPES_LIST, weights=VIOLATION_WEIGHTS, k=1)[0]
    vt2 = random.choices(VIOLATION_TYPES_LIST, weights=VIOLATION_WEIGHTS, k=1)[0]
    violation_types = [vt] if vt == vt2 else [vt, vt2]

    offence_codes = [random.randint(100, 999) for _ in violation_types]

    vehicle_type = random.choices(VEHICLE_TYPES, weights=VEHICLE_WEIGHTS, k=1)[0]
    validation_status = random.choices(VALIDATION_STATUSES, weights=VALIDATION_WEIGHTS, k=1)[0]

    # Pick an area cluster (police station defines rough region)
    station = random.choice(POLICE_STATIONS)

    # Slightly cluster coordinates per station
    center_lat = LAT_RANGE[0] + (POLICE_STATIONS.index(station) / len(POLICE_STATIONS)) * (LAT_RANGE[1] - LAT_RANGE[0])
    center_lon = LON_RANGE[0] + random.uniform(0, LON_RANGE[1] - LON_RANGE[0])
    lat = round(center_lat + random.gauss(0, 0.01), 6)
    lon = round(center_lon + random.gauss(0, 0.01), 6)
    lat = max(LAT_RANGE[0], min(LAT_RANGE[1], lat))
    lon = max(LON_RANGE[0], min(LON_RANGE[1], lon))

    # Build created_datetime with a realistic hour
    raw_dt = random_datetime_in_range(start_dt, end_dt)
    hour = weighted_hour()
    created_dt = raw_dt.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
    created_dt_utc = created_dt.astimezone(UTC)

    # IST derived
    created_ist = created_dt_utc.astimezone(IST)
    hour_of_day = created_ist.hour
    day_of_week = created_ist.weekday()

    # Action taken (50% have it)
    action_taken = None
    resolution_lag = None
    if random.random() < 0.5:
        lag_mins = random.expovariate(1 / 45)  # avg ~45 mins
        action_taken = created_dt_utc + timedelta(minutes=lag_mins)
        resolution_lag = round(lag_mins, 2)

    # SCITA
    data_sent_to_scita = random.random() < 0.72
    scita_ts = None
    if data_sent_to_scita:
        scita_ts = created_dt_utc + timedelta(minutes=random.randint(1, 60))

    # Junction
    is_junction = random.random() < 0.4
    junction_name = random.choice(JUNCTION_NAMES) if is_junction else None

    severity = SEVERITY_WEIGHTS.get(vt, 1.5)

    return {
        "id": str(uuid.uuid4()),
        "latitude": lat,
        "longitude": lon,
        "geom": f"SRID=4326;POINT({lon} {lat})",
        "location": f"{junction_name or station} area, Bengaluru",
        "vehicle_number": gen_vehicle_number(),
        "vehicle_type": vehicle_type,
        "violation_types": violation_types,
        "offence_codes": offence_codes,
        "created_datetime": created_dt_utc.isoformat(),
        "closed_datetime": None,
        "action_taken_timestamp": action_taken.isoformat() if action_taken else None,
        "device_id": f"DEV-{random.randint(1000, 9999)}",
        "created_by_id": f"OFF-{random.randint(100, 999)}",
        "center_code": random.randint(1, 20),
        "police_station": station,
        "data_sent_to_scita": data_sent_to_scita,
        "junction_name": junction_name,
        "data_sent_to_scita_timestamp": scita_ts.isoformat() if scita_ts else None,
        "updated_vehicle_number": None,
        "updated_vehicle_type": None,
        "validation_status": validation_status,
        "validation_timestamp": None,
        "hour_of_day": hour_of_day,
        "day_of_week": day_of_week,
        "is_junction": is_junction,
        "resolution_lag_mins": resolution_lag,
        "severity_weight": severity,
    }


INSERT_SQL = """
INSERT INTO violations (
  id, latitude, longitude, geom,
  location, vehicle_number, vehicle_type,
  violation_types, offence_codes,
  created_datetime, closed_datetime, action_taken_timestamp,
  device_id, created_by_id, center_code, police_station,
  data_sent_to_scita, junction_name, data_sent_to_scita_timestamp,
  updated_vehicle_number, updated_vehicle_type, validation_status, validation_timestamp,
  hour_of_day, day_of_week, is_junction, resolution_lag_mins, severity_weight
) VALUES (
  %(id)s, %(latitude)s, %(longitude)s, %(geom)s,
  %(location)s, %(vehicle_number)s, %(vehicle_type)s,
  %(violation_types)s, %(offence_codes)s,
  %(created_datetime)s, %(closed_datetime)s, %(action_taken_timestamp)s,
  %(device_id)s, %(created_by_id)s, %(center_code)s, %(police_station)s,
  %(data_sent_to_scita)s, %(junction_name)s, %(data_sent_to_scita_timestamp)s,
  %(updated_vehicle_number)s, %(updated_vehicle_type)s, %(validation_status)s, %(validation_timestamp)s,
  %(hour_of_day)s, %(day_of_week)s, %(is_junction)s, %(resolution_lag_mins)s, %(severity_weight)s
)
ON CONFLICT (id) DO NOTHING;
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=5000, help="Number of records to generate")
    args = parser.parse_args()

    # Jan 1 – May 31 2025 (matches the real dataset)
    start_dt = datetime(2025, 1, 1, tzinfo=IST)
    end_dt = datetime(2025, 5, 31, 23, 59, 59, tzinfo=IST)

    print(f"Connecting to database...")
    conn = psycopg2.connect(SYNC_URL)
    cur = conn.cursor()

    print(f"Generating {args.count:,} synthetic records...")
    batch_size = 500
    total = 0
    for batch_start in range(0, args.count, batch_size):
        batch = [
            gen_record(start_dt, end_dt)
            for _ in range(min(batch_size, args.count - batch_start))
        ]
        psycopg2.extras.execute_batch(cur, INSERT_SQL, batch, page_size=500)
        conn.commit()
        total += len(batch)
        print(f"  Inserted {total:,} records...")

    print(f"\n✅ Seeded {total:,} synthetic records successfully.")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
