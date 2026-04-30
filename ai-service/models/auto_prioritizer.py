"""
Feature 4 — Task Auto-Prioritization.

Uses a lightweight decision tree classifier to recommend priority levels
(Low / Medium / High) for tasks based on schedule proximity, project risk,
and task metadata.

When historical task-completion data is available the model can be retrained;
the bundled synthetic dataset provides a reasonable default.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier


_PRIORITIES: tuple[str, ...] = ("Low", "Medium", "High")

_pipeline: Pipeline | None = None


# ---------------------------------------------------------------------------
# Synthetic training data
# ---------------------------------------------------------------------------

def _build_training() -> tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic training samples.

    Features (5):
      0 – days_until_due       (int, days from now; negative = overdue)
      1 – project_risk_score   (int 0-100)
      2 – is_milestone         (0/1)
      3 – dependency_count     (int 0-20)
      4 – hours_estimated      (float 0.5-200)
    Label: 0 = Low, 1 = Medium, 2 = High
    """
    rng = np.random.default_rng(7)
    x_rows: list[list[float]] = []
    y_vals: list[int] = []

    for _ in range(8000):
        days = int(rng.integers(-30, 180))
        risk = int(rng.integers(0, 101))
        milestone = int(rng.choice([0, 1], p=[0.85, 0.15]))
        deps = int(rng.integers(0, 21))
        hours = float(rng.uniform(0.5, 200))

        # Decision rules
        if days < 0 or (risk > 75 and days < 14) or (milestone and days < 7):
            y = 2  # High
        elif risk > 50 or days < 21 or (deps > 10) or (milestone and days < 30):
            y = 1  # Medium
        else:
            y = 0  # Low

        # Inject 5 % noise
        if rng.random() < 0.05:
            y = int(rng.integers(0, 3))

        x_rows.append([float(days), float(risk), float(milestone), float(deps), hours])
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
                    "clf",
                    GradientBoostingClassifier(
                        n_estimators=120,
                        max_depth=4,
                        random_state=42,
                    ),
                ),
            ]
        )
        pipe.fit(x, y)
        _pipeline = pipe
    return _pipeline


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_due(raw: Any) -> datetime | None:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)
    if isinstance(raw, str):
        try:
            s = raw.replace("Z", "+00:00")
            d = datetime.fromisoformat(s)
            return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def _norm_priority(p: Any) -> str:
    x = str(p or "Medium").strip().lower().capitalize()
    if x not in _PRIORITIES:
        return "Medium"
    return x


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def auto_prioritize_tasks(
    tasks: list[dict[str, Any]],
    project_risk_score: int = 50,
) -> list[dict[str, Any]]:
    """
    Given a list of task dicts return the same list enriched with a
    ``recommendedPriority`` key (Low / Medium / High) and a
    ``priorityReason`` string.

    Expected task keys (case-insensitive accepted):
      - taskId / TaskID   (int)
      - dueDate  / DueDate (ISO string or datetime)
      - priority / Priority (current priority string)
      - status   / Status  (string; completed tasks are skipped)
      - isMilestone        (bool, optional)
      - dependencyCount    (int, optional)
      - hoursEstimated     (float, optional)
    """
    now = datetime.now(timezone.utc)
    pipe = _get_pipeline()

    out: list[dict[str, Any]] = []

    for t in tasks:
        status = str(t.get("status") or t.get("Status") or "").strip().lower()
        if status == "completed":
            continue

        due = _parse_due(t.get("dueDate") or t.get("DueDate"))
        days = (due - now).days if due else 90
        milestone = 1 if t.get("isMilestone") else 0
        deps = int(t.get("dependencyCount") or t.get("DependencyCount") or 0)
        hours = float(t.get("hoursEstimated") or t.get("HoursEstimated") or 8)

        x = np.array(
            [[float(days), float(project_risk_score), float(milestone), float(deps), hours]],
            dtype=np.float64,
        )
        proba = pipe.predict_proba(x)[0]
        idx = int(np.argmax(proba))
        recommended = _PRIORITIES[idx]
        confidence = float(proba[idx])

        # Build a human-readable reason
        parts: list[str] = []
        if days < 0:
            parts.append(f"overdue by {abs(days)} day(s)")
        elif days < 7:
            parts.append(f"due in {days} day(s)")
        elif days < 21:
            parts.append(f"due in {days} day(s)")

        if project_risk_score > 75:
            parts.append("project is high-risk")
        elif project_risk_score > 50:
            parts.append("project has moderate risk")

        if milestone:
            parts.append("milestone task")
        if deps > 10:
            parts.append(f"{deps} dependent tasks")

        if not parts:
            parts.append("schedule and risk are within normal range")

        reason = "; ".join(parts[:2]) + "."
        reason = reason[0].upper() + reason[1:]

        tid = t.get("taskId") or t.get("TaskID")

        out.append(
            {
                "taskId": int(tid) if tid is not None else None,
                "currentPriority": _norm_priority(t.get("priority") or t.get("Priority")),
                "recommendedPriority": recommended,
                "confidence": round(confidence, 4),
                "reason": reason,
            }
        )

    return out
