"""
load_data.py — Bulk loads the violations CSV into PostgreSQL using COPY.
Targets < 60 seconds for 298,449 rows.

Usage:
    python scripts/load_data.py --csv /path/to/violations.csv
    python scripts/load_data.py --csv /path/to/violations.csv --truncate
"""
from __future__ import annotations
import argparse
import ast
import io
import json
import os
import sys
import time
from datetime import timezone, timedelta
from pathlib import Path

import pandas as pd
import psycopg2
import psycopg2.extras
import numpy as np
from dotenv import load_dotenv

# ── Add project root to path so we can import services ──────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.services.scoring import get_severity_weight

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://parksight:parksight123@localhost:5432/parksight",
)
SYNC_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

IST = timezone(timedelta(hours=5, minutes=30))

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


def parse_json_list(val) -> list:
    """Safely parse a JSON-encoded list (may be string like '["A","B"]')."""
    if pd.isna(val) or val == "" or val is None:
        return []
    if isinstance(val, list):
        return val
    try:
        result = json.loads(val)
        return result if isinstance(result, list) else []
    except (json.JSONDecodeError, TypeError):
        try:
            result = ast.literal_eval(str(val))
            return result if isinstance(result, list) else []
        except Exception:
            return []


def safe_int_list(lst: list) -> list[int]:
    out = []
    for x in lst:
        try:
            out.append(int(x))
        except (ValueError, TypeError):
            pass
    return out


def parse_bool(val) -> bool | None:
    if pd.isna(val):
        return None
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return bool(val)
    s = str(val).strip().lower()
    if s in ("true", "1", "t", "yes"):
        return True
    if s in ("false", "0", "f", "no"):
        return False
    return None


def severity_for_types(violation_types: list[str]) -> float:
    if not violation_types:
        return 1.5
    weights = [SEVERITY_WEIGHTS.get(v.upper().strip(), 1.5) for v in violation_types]
    return max(weights)


def list_to_pg_array(lst: list) -> str | None:
    """Convert Python list to PostgreSQL ARRAY literal string."""
    if not lst:
        return None
    inner = ",".join(
        f'"{str(x).replace(chr(34), chr(39))}"' if isinstance(x, str) else str(x)
        for x in lst
    )
    return "{" + inner + "}"


def process_chunk(df: pd.DataFrame) -> pd.DataFrame:
    # ── Parse JSON arrays ────────────────────────────────────────────────────
    df["_vt_list"] = df["violation_type"].apply(parse_json_list)
    df["_oc_list"] = df["offence_code"].apply(parse_json_list)

    # ── Parse datetimes ──────────────────────────────────────────────────────
    for col in ["created_datetime", "closed_datetime", "action_taken_timestamp",
                "data_sent_to_scita_timestamp", "validation_timestamp"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], utc=True, errors="coerce")

    # ── IST derived columns ──────────────────────────────────────────────────
    created_ist = df["created_datetime"].dt.tz_convert(IST)
    df["hour_of_day"] = created_ist.dt.hour
    df["day_of_week"] = created_ist.dt.dayofweek  # 0=Mon

    # ── Resolution lag ───────────────────────────────────────────────────────
    if "action_taken_timestamp" in df.columns:
        lag = (df["action_taken_timestamp"] - df["created_datetime"]).dt.total_seconds() / 60
        df["resolution_lag_mins"] = np.where(
            df["action_taken_timestamp"].notna() & df["created_datetime"].notna(),
            lag, np.nan
        )
    else:
        df["resolution_lag_mins"] = np.nan

    # ── Junction flag ────────────────────────────────────────────────────────
    df["is_junction"] = df["junction_name"].notna() & (df["junction_name"].str.strip() != "")

    # ── Severity weight ──────────────────────────────────────────────────────
    df["severity_weight"] = df["_vt_list"].apply(severity_for_types)

    # ── Geom (WKT for GEOGRAPHY) ─────────────────────────────────────────────
    df["geom_wkt"] = df.apply(
        lambda r: f"SRID=4326;POINT({r['longitude']} {r['latitude']})"
        if pd.notna(r.get("latitude")) and pd.notna(r.get("longitude"))
        else None,
        axis=1,
    )

    return df


COLUMNS_ORDER = [
    "id", "latitude", "longitude", "geom_wkt", "location", "vehicle_number",
    "vehicle_type", "violation_types_pg", "offence_codes_pg",
    "created_datetime", "closed_datetime", "action_taken_timestamp",
    "device_id", "created_by_id", "center_code", "police_station",
    "data_sent_to_scita", "junction_name", "data_sent_to_scita_timestamp",
    "updated_vehicle_number", "updated_vehicle_type", "validation_status",
    "validation_timestamp",
    "hour_of_day", "day_of_week", "is_junction", "resolution_lag_mins", "severity_weight",
]

COPY_SQL = """
COPY violations (
  id, latitude, longitude, geom,
  location, vehicle_number, vehicle_type,
  violation_types, offence_codes,
  created_datetime, closed_datetime, action_taken_timestamp,
  device_id, created_by_id, center_code, police_station,
  data_sent_to_scita, junction_name, data_sent_to_scita_timestamp,
  updated_vehicle_number, updated_vehicle_type, validation_status, validation_timestamp,
  hour_of_day, day_of_week, is_junction, resolution_lag_mins, severity_weight
) FROM STDIN WITH (FORMAT CSV, NULL '', DELIMITER ',')
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  geom = EXCLUDED.geom,
  violation_types = EXCLUDED.violation_types,
  offence_codes = EXCLUDED.offence_codes,
  hour_of_day = EXCLUDED.hour_of_day,
  day_of_week = EXCLUDED.day_of_week,
  is_junction = EXCLUDED.is_junction,
  resolution_lag_mins = EXCLUDED.resolution_lag_mins,
  severity_weight = EXCLUDED.severity_weight;
"""

# psycopg2 doesn't support ON CONFLICT with COPY natively.
# We'll use a staging table approach: COPY into temp, then INSERT ... ON CONFLICT.
COPY_TEMP_SQL = """
COPY _violations_staging (
  id, latitude, longitude, geom,
  location, vehicle_number, vehicle_type,
  violation_types, offence_codes,
  created_datetime, closed_datetime, action_taken_timestamp,
  device_id, created_by_id, center_code, police_station,
  data_sent_to_scita, junction_name, data_sent_to_scita_timestamp,
  updated_vehicle_number, updated_vehicle_type, validation_status, validation_timestamp,
  hour_of_day, day_of_week, is_junction, resolution_lag_mins, severity_weight
) FROM STDIN WITH (FORMAT CSV, NULL '', DELIMITER ',')
"""

UPSERT_SQL = """
INSERT INTO violations
SELECT * FROM _violations_staging
ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  geom = EXCLUDED.geom,
  violation_types = EXCLUDED.violation_types,
  offence_codes = EXCLUDED.offence_codes,
  hour_of_day = EXCLUDED.hour_of_day,
  day_of_week = EXCLUDED.day_of_week,
  is_junction = EXCLUDED.is_junction,
  resolution_lag_mins = EXCLUDED.resolution_lag_mins,
  severity_weight = EXCLUDED.severity_weight;
"""


def row_to_csv_line(row: pd.Series) -> str:
    """Convert a DataFrame row to a CSV line for COPY."""
    def fmt(val):
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return ""
        if isinstance(val, bool):
            return "true" if val else "false"
        if isinstance(val, pd.Timestamp):
            return val.isoformat()
        return str(val).replace('"', '""')

    return ",".join(fmt(row[c]) for c in COLUMNS_ORDER)


def prepare_copy_buffer(df: pd.DataFrame) -> io.StringIO:
    df["violation_types_pg"] = df["_vt_list"].apply(list_to_pg_array)
    df["offence_codes_pg"] = df["_oc_list"].apply(
        lambda x: list_to_pg_array(safe_int_list(x))
    )

    # Re-align booleans
    df["data_sent_to_scita"] = df["data_sent_to_scita"].apply(parse_bool).map(
        lambda b: "true" if b is True else ("false" if b is False else "")
    )
    df["is_junction"] = df["is_junction"].map(
        lambda b: "true" if b else "false"
    )

    buf = io.StringIO()
    for _, row in df.iterrows():
        vals = []
        for col in COLUMNS_ORDER:
            val = row.get(col)
            if val is None or (isinstance(val, float) and pd.isna(val)):
                vals.append("")
            elif isinstance(val, pd.Timestamp):
                vals.append(val.isoformat())
            else:
                s = str(val)
                if "," in s or '"' in s or "\n" in s:
                    s = '"' + s.replace('"', '""') + '"'
                vals.append(s)
        buf.write(",".join(vals) + "\n")
    buf.seek(0)
    return buf


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to the violations CSV file")
    parser.add_argument("--truncate", action="store_true", help="Truncate table before loading")
    parser.add_argument("--chunksize", type=int, default=50_000, help="Rows per chunk")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"❌ CSV not found: {csv_path}")
        sys.exit(1)

    print(f"Connecting to database...")
    conn = psycopg2.connect(SYNC_URL)
    conn.autocommit = False
    cur = conn.cursor()

    if args.truncate:
        print("Truncating violations table...")
        cur.execute("TRUNCATE TABLE violations;")
        conn.commit()

    # Create staging table
    print("Creating staging table...")
    cur.execute("DROP TABLE IF EXISTS _violations_staging;")
    cur.execute("CREATE UNLOGGED TABLE _violations_staging (LIKE violations INCLUDING ALL);")
    conn.commit()

    total_rows = 0
    start = time.time()

    print(f"Loading CSV: {csv_path}")
    dtype_map = {
        "id": str, "latitude": float, "longitude": float,
        "vehicle_number": str, "vehicle_type": str, "violation_type": str,
        "offence_code": str, "location": str, "device_id": str,
        "created_by_id": str, "police_station": str, "junction_name": str,
        "updated_vehicle_number": str, "updated_vehicle_type": str,
        "validation_status": str,
    }

    for chunk_num, chunk in enumerate(
        pd.read_csv(
            csv_path,
            chunksize=args.chunksize,
            dtype=dtype_map,
            low_memory=False,
        )
    ):
        chunk = chunk.dropna(subset=["id", "latitude", "longitude"])
        chunk = process_chunk(chunk)
        buf = prepare_copy_buffer(chunk)

        cur.copy_expert(COPY_TEMP_SQL, buf)
        conn.commit()
        total_rows += len(chunk)
        elapsed = time.time() - start
        print(f"  Chunk {chunk_num + 1}: {total_rows:,} rows loaded ({elapsed:.1f}s)")

    # Upsert from staging → violations
    print("Upserting from staging table...")
    cur.execute(UPSERT_SQL)
    conn.commit()

    # Cleanup
    cur.execute("DROP TABLE IF EXISTS _violations_staging;")
    conn.commit()

    elapsed = time.time() - start
    print(f"\n✅ Done! {total_rows:,} rows loaded in {elapsed:.1f}s")
    print(f"   Avg: {total_rows / elapsed:.0f} rows/sec")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
