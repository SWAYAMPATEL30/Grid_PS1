"""
Statistical forecast service.
Uses per-zone, per-hour mean ± std as prediction intervals.
No ML model required — purely data-driven statistics.
"""
from __future__ import annotations
import numpy as np
from typing import Optional


def compute_zone_forecast(
    historical_counts: list[int],
    horizon_hours: int = 2,
    confidence_threshold: float = 0.5,
) -> dict:
    """
    Given a list of historical hourly counts for a zone,
    return predicted_count, confidence, lower_bound, upper_bound.
    """
    arr = np.array(historical_counts, dtype=float)
    if len(arr) == 0:
        return {
            "predicted_count": 0.0,
            "confidence": 0.0,
            "lower_bound": 0.0,
            "upper_bound": 0.0,
            "trend": "stable",
        }

    mean = float(np.mean(arr))
    std = float(np.std(arr)) if len(arr) > 1 else mean * 0.2
    lower = max(0.0, mean - 1.96 * std)
    upper = mean + 1.96 * std

    # Confidence: tighter interval → higher confidence
    range_ratio = (std / mean) if mean > 0 else 1.0
    confidence = float(max(0.0, min(1.0, 1.0 - range_ratio)))

    # Trend: compare last third vs first third
    n = len(arr)
    if n >= 6:
        first_third = float(np.mean(arr[: n // 3]))
        last_third = float(np.mean(arr[-n // 3 :]))
        if last_third > first_third * 1.1:
            trend = "rising"
        elif last_third < first_third * 0.9:
            trend = "falling"
        else:
            trend = "stable"
    else:
        trend = "stable"

    return {
        "predicted_count": round(mean, 2),
        "confidence": round(confidence, 3),
        "lower_bound": round(lower, 2),
        "upper_bound": round(upper, 2),
        "trend": trend,
    }


def build_timeline_forecast(
    daily_counts: list[tuple[str, int]],
    horizon_days: int = 7,
) -> list[dict]:
    """
    Given list of (date_str, count) tuples, produce a rolling
    30-day mean forecast extended into the future.
    """
    if not daily_counts:
        return []

    dates = [d for d, _ in daily_counts]
    counts = np.array([c for _, c in daily_counts], dtype=float)

    results = []
    window = 30

    for i, (date_str, actual) in enumerate(daily_counts):
        start = max(0, i - window)
        window_data = counts[start:i] if i > 0 else np.array([actual])
        mean = float(np.mean(window_data))
        std = float(np.std(window_data)) if len(window_data) > 1 else mean * 0.15
        results.append(
            {
                "datetime": date_str + "T00:00:00Z",
                "predicted_count": round(mean, 2),
                "lower_bound": round(max(0.0, mean - 1.96 * std), 2),
                "upper_bound": round(mean + 1.96 * std, 2),
            }
        )
    return results
