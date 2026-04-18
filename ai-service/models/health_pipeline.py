"""
Feature 5 — combined health pipeline: delay model + alert severity + task escalation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from models.delay_predictor import predict_delay


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
    if x not in ("Low", "Medium", "High"):
        return "Medium"
    return x


def _next_priority(p: str) -> str | None:
    order = ["Low", "Medium", "High"]
    try:
        i = order.index(_norm_priority(p))
        if i < 2:
            return order[i + 1]
    except ValueError:
        pass
    return None


def _task_id(t: dict[str, Any]) -> int | None:
    v = t.get("taskId")
    if v is None:
        v = t.get("TaskID")
    if v is None:
        return None
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _task_status(t: dict[str, Any]) -> str:
    return str(t.get("status") or t.get("Status") or "").strip().lower()


def _alert_severity(risk_level: str, days_left: int) -> str:
    if risk_level == "On Track":
        return "Notice"
    if days_left < 0:
        return "Critical"
    if risk_level == "Likely Delayed" and days_left < 14:
        return "Critical"
    if days_left < 7 or risk_level == "Likely Delayed":
        return "Warning"
    if risk_level == "At Risk" or days_left < 21:
        return "Warning"
    return "Notice"


def _build_alerts(
    risk_level: str,
    risk_score: int,
    days_left: int,
    overdue: int,
    total: int,
    completed: int,
) -> list[dict[str, str]]:
    alerts: list[dict[str, str]] = []
    if risk_level != "On Track":
        sev = _alert_severity(risk_level, days_left)
        alerts.append(
            {
                "type": "ProjectAtRisk",
                "severity": sev,
                "message": (
                    f"Schedule risk: {risk_level} (score {risk_score}). "
                    f"{completed}/{max(total, 1)} tasks complete; "
                    f"{overdue} overdue."
                ),
            }
        )
    if days_left >= 0 and days_left <= 14 and risk_level != "On Track":
        alerts.append(
            {
                "type": "DeadlineProximity",
                "severity": "Critical" if days_left < 7 else "Warning",
                "message": f"Project end date in {days_left} day(s) — review remaining scope.",
            }
        )
    if overdue > 0:
        alerts.append(
            {
                "type": "OverdueTasks",
                "severity": "Critical" if overdue > 2 else "Warning",
                "message": f"{overdue} open task(s) are past their due date.",
            }
        )
    return alerts


def _compute_escalations(
    tasks: list[dict[str, Any]],
    risk_level: str,
    now: datetime,
) -> list[dict[str, str | int]]:
    out: list[dict[str, str | int]] = []
    if risk_level not in ("At Risk", "Likely Delayed"):
        return out

    for t in tasks:
        tid = _task_id(t)
        if tid is None:
            continue
        st = _task_status(t)
        if st == "completed":
            continue
        pr = _norm_priority(t.get("priority") or t.get("Priority"))
        if pr == "High":
            continue
        due = _parse_due(t.get("dueDate") or t.get("DueDate"))
        days_to_task = (due - now).days if due else 999

        escalate = False
        reason = ""
        if risk_level == "Likely Delayed":
            escalate = True
            reason = "Project flagged as likely delayed — escalate remaining work."
        elif risk_level == "At Risk":
            if pr == "Low" and days_to_task <= 21:
                escalate = True
                reason = "At-risk project; task due within three weeks."
            elif pr == "Medium" and days_to_task <= 7:
                escalate = True
                reason = "At-risk project; task due within one week."

        if not escalate:
            continue
        new_p = _next_priority(pr) or "High"
        if new_p != pr:
            out.append(
                {
                    "taskId": tid,
                    "fromPriority": pr,
                    "toPriority": new_p,
                    "reason": reason,
                }
            )
    return out


def analyze_project_health(
    project_id: int,
    tasks: list[dict[str, Any]],
    days_until_deadline: int,
    team_size: int = 1,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    total = len(tasks)
    completed = sum(1 for t in tasks if _task_status(t) == "completed")
    overdue = 0
    for t in tasks:
        if _task_status(t) == "completed":
            continue
        dd = _parse_due(t.get("dueDate") or t.get("DueDate"))
        if dd is not None and dd < now:
            overdue += 1

    metrics = {
        "totalTasks": total,
        "completedTasks": completed,
        "overdueTasks": overdue,
        "daysUntilDeadline": int(days_until_deadline),
        "teamSize": max(1, int(team_size)),
    }
    delay_result = predict_delay(metrics)
    risk_level = str(delay_result["riskLevel"])
    risk_score = int(delay_result["riskScore"])
    days_left = int(days_until_deadline)

    alerts = _build_alerts(risk_level, risk_score, days_left, overdue, total, completed)
    escalated = _compute_escalations(tasks, risk_level, now)

    return {
        "projectId": project_id,
        "riskLevel": risk_level,
        "riskScore": risk_score,
        "alerts": alerts,
        "escalatedTasks": escalated,
    }
