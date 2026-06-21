"""
ML Training script — Trains a Random Forest on the violations dataset.
Produces two models:
  1. violation_count_model.pkl — predicts hourly violation count for a zone+hour+day
  2. hotspot_risk_model.pkl    — predicts whether a zone will be a hotspot (binary)

Usage:
    python ml/train.py
"""
import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, mean_absolute_error

MODEL_DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(os.path.dirname(MODEL_DIR), "data", "violations.csv")


def load_data(path: str) -> pd.DataFrame:
    print(f"Loading data from: {path}")
    df = pd.read_csv(path, low_memory=False)
    print(f"Rows loaded: {len(df):,}")
    return df


def preprocess(df: pd.DataFrame):
    # Parse datetimes
    df["created_datetime"] = pd.to_datetime(df["created_datetime"], errors="coerce", utc=True)
    df = df.dropna(subset=["created_datetime", "latitude", "longitude"])

    df["hour"] = df["created_datetime"].dt.hour
    df["day_of_week"] = df["created_datetime"].dt.dayofweek
    df["month"] = df["created_datetime"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Encode categoricals
    le_vehicle = LabelEncoder()
    df["vehicle_type_enc"] = le_vehicle.fit_transform(df["vehicle_type"].fillna("UNKNOWN"))

    le_station = LabelEncoder()
    df["station_enc"] = le_station.fit_transform(df["police_station"].fillna("UNKNOWN"))

    le_junction = LabelEncoder()
    df["junction_enc"] = le_junction.fit_transform(df["junction_name"].fillna("NONE"))

    df["is_junction"] = df["junction_name"].notna().astype(int)
    df["severity_weight"] = pd.to_numeric(df.get("severity_weight", 1.0), errors="coerce").fillna(1.0)

    encoders = {
        "vehicle_type": le_vehicle,
        "police_station": le_station,
        "junction_name": le_junction,
    }
    return df, encoders


def build_hourly_features(df: pd.DataFrame):
    """Aggregate violations per hour/station to predict violation count."""
    agg = (
        df.groupby(["station_enc", "hour", "day_of_week", "month", "is_weekend"])
        .size()
        .reset_index(name="violation_count")
    )
    X = agg[["station_enc", "hour", "day_of_week", "month", "is_weekend"]]
    y = agg["violation_count"]
    return X, y


def build_hotspot_features(df: pd.DataFrame):
    """Predict if a junction is a hotspot (top 20% by volume)."""
    agg = (
        df.groupby(["junction_enc", "hour", "day_of_week", "vehicle_type_enc"])
        .agg(count=("id", "size"), avg_severity=("severity_weight", "mean"))
        .reset_index()
    )
    threshold = agg["count"].quantile(0.80)
    agg["is_hotspot"] = (agg["count"] >= threshold).astype(int)
    X = agg[["junction_enc", "hour", "day_of_week", "vehicle_type_enc", "avg_severity"]]
    y = agg["is_hotspot"]
    return X, y


def train():
    # If CSV doesn't exist, use DB-generated synthetic data instead
    if not os.path.exists(CSV_PATH):
        print(f"CSV not found at {CSV_PATH}. Generating synthetic training data for demo...")
        rng = np.random.default_rng(42)
        n = 10000
        df = pd.DataFrame({
            "id": [str(i) for i in range(n)],
            "latitude": rng.uniform(12.85, 13.10, n),
            "longitude": rng.uniform(77.50, 77.75, n),
            "created_datetime": pd.date_range("2025-01-01", periods=n, freq="30min", tz="UTC"),
            "vehicle_type": rng.choice(["MOTORCYCLE", "CAR", "AUTORICKSHAW", "TRUCK"], n),
            "police_station": rng.choice([
                "Koramangala PS", "Indiranagar PS", "Whitefield PS",
                "Hebbal PS", "Marathahalli PS", "Ashok Nagar PS"
            ], n),
            "junction_name": rng.choice([
                "MG Road", "Silk Board", "Hebbal Flyover", "KR Puram",
                "Marathahalli Bridge", "Whitefield", None
            ], n),
            "severity_weight": rng.uniform(0.5, 5.0, n),
        })
    else:
        df = load_data(CSV_PATH)

    df, encoders = preprocess(df)

    # ── Model 1: Violation Count Predictor ────────────────────────────────────
    X_cnt, y_cnt = build_hourly_features(df)
    X_tr, X_te, y_tr, y_te = train_test_split(X_cnt, y_cnt, test_size=0.2, random_state=42)
    reg = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    reg.fit(X_tr, y_tr)
    mae = mean_absolute_error(y_te, reg.predict(X_te))
    print(f"✅ Violation Count Model — MAE: {mae:.2f}")

    # ── Model 2: Hotspot Risk Classifier ──────────────────────────────────────
    X_hs, y_hs = build_hotspot_features(df)
    X_tr2, X_te2, y_tr2, y_te2 = train_test_split(X_hs, y_hs, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1, class_weight="balanced")
    clf.fit(X_tr2, y_tr2)
    print("✅ Hotspot Classifier Report:")
    print(classification_report(y_te2, clf.predict(X_te2)))

    # ── Save models and encoders ───────────────────────────────────────────────
    joblib.dump(reg, os.path.join(MODEL_DIR, "violation_count_model.pkl"))
    joblib.dump(clf, os.path.join(MODEL_DIR, "hotspot_risk_model.pkl"))
    joblib.dump(encoders, os.path.join(MODEL_DIR, "encoders.pkl"))

    # Save label encoder classes for inference
    meta = {
        "vehicle_types": list(encoders["vehicle_type"].classes_),
        "police_stations": list(encoders["police_station"].classes_),
        "junctions": list(encoders["junction_name"].classes_),
        "features_count": {"station_enc", "hour", "day_of_week", "month", "is_weekend"},
        "hotspot_features": {"junction_enc", "hour", "day_of_week", "vehicle_type_enc", "avg_severity"},
    }
    with open(os.path.join(MODEL_DIR, "model_meta.json"), "w") as f:
        json.dump({k: (list(v) if isinstance(v, set) else v) for k, v in meta.items()}, f, indent=2)

    print("✅ Models saved to", MODEL_DIR)


if __name__ == "__main__":
    train()
