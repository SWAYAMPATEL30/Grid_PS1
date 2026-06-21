"""ML inference helpers — load trained models and run predictions."""
import os
import json
import numpy as np
import joblib

MODEL_DIR = os.path.dirname(__file__)

_reg = None
_clf = None
_enc = None
_meta = None


def _load_models():
    global _reg, _clf, _enc, _meta
    if _reg is None:
        reg_path = os.path.join(MODEL_DIR, "violation_count_model.pkl")
        clf_path = os.path.join(MODEL_DIR, "hotspot_risk_model.pkl")
        enc_path = os.path.join(MODEL_DIR, "encoders.pkl")
        meta_path = os.path.join(MODEL_DIR, "model_meta.json")
        if not os.path.exists(reg_path):
            return False
        _reg = joblib.load(reg_path)
        _clf = joblib.load(clf_path)
        _enc = joblib.load(enc_path)
        with open(meta_path) as f:
            _meta = json.load(f)
    return True


def predict_violation_count(station: str, hour: int, day_of_week: int, month: int) -> dict:
    if not _load_models():
        return {"error": "model_not_trained", "hint": "Run: python ml/train.py"}

    le = _enc["police_station"]
    if station in le.classes_:
        station_enc = int(le.transform([station])[0])
    else:
        station_enc = 0

    is_weekend = int(day_of_week >= 5)
    X = np.array([[station_enc, hour, day_of_week, month, is_weekend]])
    pred = float(_reg.predict(X)[0])
    return {
        "station": station,
        "hour": hour,
        "day_of_week": day_of_week,
        "month": month,
        "predicted_violation_count": round(max(0, pred), 1),
    }


def predict_hotspot_risk(junction: str, hour: int, day_of_week: int, vehicle_type: str) -> dict:
    if not _load_models():
        return {"error": "model_not_trained", "hint": "Run: python ml/train.py"}

    le_j = _enc["junction_name"]
    le_v = _enc["vehicle_type"]

    junction_enc = int(le_j.transform([junction])[0]) if junction in le_j.classes_ else 0
    vehicle_enc = int(le_v.transform([vehicle_type])[0]) if vehicle_type in le_v.classes_ else 0

    avg_severity = 1.5  # default estimate
    X = np.array([[junction_enc, hour, day_of_week, vehicle_enc, avg_severity]])
    prob = float(_clf.predict_proba(X)[0][1])
    label = _clf.predict(X)[0]

    return {
        "junction": junction,
        "hour": hour,
        "vehicle_type": vehicle_type,
        "hotspot_probability": round(prob, 3),
        "is_hotspot": bool(label),
        "risk_level": "HIGH" if prob > 0.7 else "MEDIUM" if prob > 0.4 else "LOW",
    }


def get_meta() -> dict:
    if not _load_models():
        return {}
    return _meta or {}
