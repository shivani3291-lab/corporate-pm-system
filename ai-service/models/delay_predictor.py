"""
Project delay risk: logistic regression on task / schedule features (Feature 3).
Trained on synthetic data; replace with real labels when historical data is available.
"""

from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

_LEVELS: tuple[str, ...] = ("On Track", "At Risk", "Likely Delayed")

_pipeline: Pipeline | None = None


def _build_training() -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(42)
    x_rows: list[list[float]] = []
    y_vals: list[int] = []
    for _ in range(6000):
        total = int(rng.integers(1, 120))
        completed = int(rng.integers(0, total + 1))
        overdue = int(rng.integers(0, min(total + 1, max(1, total - completed + 2))))
        days = int(rng.integers(-90, 600))
        team = int(rng.integers(1, 25))
        comp_r = completed / total
        overdue_r = overdue / total
        if overdue_r >= 0.22 or (days < 12 and comp_r < 0.28):
            y = 2
        elif overdue_r >= 0.07 or (days < 40 and comp_r < 0.42) or (days < 0 and comp_r < 0.95):
            y = 1
        else:
            y = 0
        if rng.random() < 0.06:
            y = int(rng.integers(0, 3))
        x_rows.append([float(total), float(completed), float(overdue), float(days), float(team)])
        y_vals.append(y)
    return np.array(x_rows, dtype=np.float64), np.array(y_vals, dtype=np.int64)


def _get_pipeline() -> Pipeline:
    global _pipeline
    if _pipeline is None:
        x, y = _build_training()
        pipe = Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "lr",
                    LogisticRegression(
                        max_iter=2000,
                        random_state=42,
                        solver="lbfgs",
                    ),
                ),
            ]
        )
        pipe.fit(x, y)
        _pipeline = pipe
    return _pipeline


def _build_reason(features: dict[str, float | int], level: str) -> str:
    total = max(int(features["totalTasks"]), 1)
    overdue = int(features["overdueTasks"])
    completed = int(features["completedTasks"])
    days = int(features["daysUntilDeadline"])
    comp_r = completed / total
    parts: list[str] = []
    if overdue > 0:
        parts.append(f"{overdue} task(s) overdue relative to due dates")
    if total > 0 and comp_r < 0.45:
        parts.append("completion rate is behind expected pace")
    if days < 0:
        parts.append("project end date has passed with incomplete work")
    elif days < 21:
        parts.append("deadline is near with remaining scope")
    if not parts:
        if level == "On Track":
            parts.append("workload and timeline look aligned")
        elif level == "At Risk":
            parts.append("some schedule pressure detected")
        else:
            parts.append("multiple risk signals on schedule and tasks")
    text = "; ".join(parts[:2])
    return text[0].upper() + text[1:] + "." if text else "Insufficient signals to summarize."


def predict_delay(features: dict[str, float | int]) -> dict[str, str | int]:
    """Input keys: totalTasks, completedTasks, overdueTasks, daysUntilDeadline, teamSize."""
    required = (
        "totalTasks",
        "completedTasks",
        "overdueTasks",
        "daysUntilDeadline",
        "teamSize",
    )
    for k in required:
        if k not in features:
            raise ValueError(f"missing field: {k}")

    total = max(int(features["totalTasks"]), 0)
    completed = max(int(features["completedTasks"]), 0)
    overdue = max(int(features["overdueTasks"]), 0)
    if total > 0:
        completed = min(completed, total)
        overdue = min(overdue, total)

    x = np.array(
        [
            [
                float(total),
                float(completed),
                float(overdue),
                float(features["daysUntilDeadline"]),
                float(max(int(features["teamSize"]), 0)),
            ]
        ],
        dtype=np.float64,
    )
    pipe = _get_pipeline()
    proba = pipe.predict_proba(x)[0]
    cls = int(np.argmax(proba))
    level = _LEVELS[cls]
    # Weighted score 0–100 from class probabilities
    weights = np.array([18.0, 52.0, 86.0], dtype=np.float64)
    risk_score = int(round(float(np.clip(np.dot(proba, weights), 0.0, 100.0))))
    reason = _build_reason(
        {
            **features,
            "totalTasks": total,
            "completedTasks": completed,
            "overdueTasks": overdue,
        },
        level,
    )
    return {
        "riskScore": risk_score,
        "riskLevel": level,
        "reason": reason,
    }
