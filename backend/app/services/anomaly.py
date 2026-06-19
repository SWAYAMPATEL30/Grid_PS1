"""
Anomaly detection service.
Uses rolling 30-day mean ± 2*std as normal band.
Flags any day outside the band as an anomaly.
"""
from __future__ import annotations
import numpy as np
from typing import Optional


def detect_anomalies(
    daily_counts: list[tuple[str, int]],
    window: int = 30,
    threshold_z: float = 2.0,
) -> list[dict]:
    """
    Given a list of (date_str, count) tuples sorted chronologically,
    return anomaly annotation for each day.
    """
    if not daily_counts:
        return []

    counts = np.array([c for _, c in daily_counts], dtype=float)
    results = []

    for i, (date_str, actual) in enumerate(daily_counts):
        start = max(0, i - window)
        window_data = counts[start:i] if i > 0 else np.array([actual])
        mean = float(np.mean(window_data))
        std = float(np.std(window_data)) if len(window_data) > 1 else max(mean * 0.1, 1.0)
        z_score = (actual - mean) / std if std > 0 else 0.0
        is_anomaly = abs(z_score) > threshold_z

        results.append(
            {
                "date": date_str,
                "actual_count": int(actual),
                "expected_count": round(mean, 2),
                "is_anomaly": is_anomaly,
                "z_score": round(z_score, 3),
            }
        )
    return results


POSSIBLE_CAUSES = [
    "Public event or gathering",
    "Traffic diversion",
    "Local festival or parade",
    "Enforcement gap / officer shortage",
    "Weather-related congestion",
    "Road construction nearby",
    "Peak shopping season",
    "Sporting event",
    "School exam period",
    "Market day",
]


def anomaly_possible_cause(z_score: float, idx: int) -> str:
    """Deterministic pseudo-random cause assignment for demo."""
    if z_score > 0:
        causes = POSSIBLE_CAUSES[:5]
    else:
        causes = POSSIBLE_CAUSES[5:]
    return causes[idx % len(causes)]
