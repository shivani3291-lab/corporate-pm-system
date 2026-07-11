"""Tests for the AI service models and endpoints."""
from __future__ import annotations

import pytest


# ---------------------------------------------------------------------------
# Classifier tests
# ---------------------------------------------------------------------------

class TestClassifier:
    def test_classify_design(self):
        from models.classifier import classify_document
        cat, conf = classify_document("System architecture design document")
        assert cat == "Design"
        assert 0.0 < conf <= 1.0

    def test_classify_business(self):
        from models.classifier import classify_document
        cat, conf = classify_document("Business case and ROI analysis")
        assert cat == "Business"
        assert conf > 0.3

    def test_classify_testing(self):
        from models.classifier import classify_document
        cat, conf = classify_document("Regression test suite execution report")
        assert cat == "Testing"
        assert conf > 0.3

    def test_classify_documentation(self):
        from models.classifier import classify_document
        cat, conf = classify_document("Admin user guide and operations manual")
        assert cat == "Documentation"
        assert conf > 0.3

    def test_classify_empty_title_raises(self):
        from models.classifier import classify_document
        with pytest.raises(ValueError):
            classify_document("")
        with pytest.raises(ValueError):
            classify_document("   ")

    def test_classify_returns_tuple(self):
        from models.classifier import classify_document
        result = classify_document("Database schema migration plan")
        assert isinstance(result, tuple)
        assert len(result) == 2


# ---------------------------------------------------------------------------
# Delay predictor tests
# ---------------------------------------------------------------------------

class TestDelayPredictor:
    def test_healthy_project(self):
        from models.delay_predictor import predict_delay
        result = predict_delay({
            "totalTasks": 20,
            "completedTasks": 18,
            "overdueTasks": 0,
            "daysUntilDeadline": 60,
            "teamSize": 5,
        })
        assert result["riskLevel"] == "On Track"
        assert 0 <= result["riskScore"] <= 100
        assert isinstance(result["reason"], str)

    def test_at_risk_project(self):
        from models.delay_predictor import predict_delay
        result = predict_delay({
            "totalTasks": 30,
            "completedTasks": 8,
            "overdueTasks": 5,
            "daysUntilDeadline": 15,
            "teamSize": 3,
        })
        assert result["riskLevel"] in ("At Risk", "Likely Delayed")
        assert result["riskScore"] > 30

    def test_likely_delayed_project(self):
        from models.delay_predictor import predict_delay
        result = predict_delay({
            "totalTasks": 50,
            "completedTasks": 5,
            "overdueTasks": 20,
            "daysUntilDeadline": -5,
            "teamSize": 2,
        })
        assert result["riskLevel"] == "Likely Delayed"
        assert result["riskScore"] > 60

    def test_missing_field_raises(self):
        from models.delay_predictor import predict_delay
        with pytest.raises(ValueError, match="missing field"):
            predict_delay({"totalTasks": 10})

    def test_zero_tasks_handled(self):
        from models.delay_predictor import predict_delay
        result = predict_delay({
            "totalTasks": 0,
            "completedTasks": 0,
            "overdueTasks": 0,
            "daysUntilDeadline": 30,
            "teamSize": 1,
        })
        assert result["riskLevel"] in ("On Track", "At Risk", "Likely Delayed")


# ---------------------------------------------------------------------------
# Auto-prioritizer tests
# ---------------------------------------------------------------------------

class TestAutoPrioritizer:
    def test_high_priority_overdue(self):
        from models.auto_prioritizer import auto_prioritize_tasks
        tasks = [
            {
                "taskId": 1,
                "dueDate": "2020-01-01T00:00:00Z",
                "priority": "Low",
                "status": "Pending",
            }
        ]
        results = auto_prioritize_tasks(tasks, project_risk_score=50)
        assert len(results) == 1
        assert results[0]["recommendedPriority"] == "High"
        assert results[0]["taskId"] == 1

    def test_completed_tasks_skipped(self):
        from models.auto_prioritizer import auto_prioritize_tasks
        tasks = [
            {"taskId": 1, "priority": "Medium", "status": "Completed"},
            {"taskId": 2, "priority": "Medium", "status": "Pending", "dueDate": "2099-12-31T00:00:00Z"},
        ]
        results = auto_prioritize_tasks(tasks, project_risk_score=20)
        assert len(results) == 1
        assert results[0]["taskId"] == 2

    def test_empty_tasks(self):
        from models.auto_prioritizer import auto_prioritize_tasks
        results = auto_prioritize_tasks([], project_risk_score=50)
        assert results == []

    def test_high_risk_project(self):
        from models.auto_prioritizer import auto_prioritize_tasks
        tasks = [
            {
                "taskId": 1,
                "dueDate": "2099-12-31T00:00:00Z",
                "priority": "Low",
                "status": "In Progress",
            }
        ]
        results = auto_prioritize_tasks(tasks, project_risk_score=90)
        assert len(results) == 1
        assert results[0]["recommendedPriority"] in ("Medium", "High")

    def test_returns_confidence_and_reason(self):
        from models.auto_prioritizer import auto_prioritize_tasks
        tasks = [
            {"taskId": 1, "priority": "Medium", "status": "Pending", "dueDate": "2099-12-31T00:00:00Z"},
        ]
        results = auto_prioritize_tasks(tasks, project_risk_score=30)
        assert 0 <= results[0]["confidence"] <= 1
        assert len(results[0]["reason"]) > 0


# ---------------------------------------------------------------------------
# Health pipeline tests
# ---------------------------------------------------------------------------

class TestHealthPipeline:
    def test_healthy_project(self):
        from models.health_pipeline import analyze_project_health
        tasks = [
            {"taskId": 1, "status": "Completed", "dueDate": "2025-01-01T00:00:00Z"},
            {"taskId": 2, "status": "Completed", "dueDate": "2025-02-01T00:00:00Z"},
        ]
        result = analyze_project_health(1, tasks, days_until_deadline=60, team_size=3)
        assert result["projectId"] == 1
        assert result["riskLevel"] in ("On Track", "At Risk", "Likely Delayed")
        assert result["riskScore"] >= 0
        assert isinstance(result["alerts"], list)
        assert isinstance(result["escalatedTasks"], list)

    def test_overdue_tasks_trigger_alert(self):
        from models.health_pipeline import analyze_project_health
        tasks = [
            {"taskId": 1, "status": "Pending", "dueDate": "2020-01-01T00:00:00Z"},
        ]
        result = analyze_project_health(1, tasks, days_until_deadline=30, team_size=3)
        assert len(result["alerts"]) > 0
        alert_types = [a["type"] for a in result["alerts"]]
        assert "OverdueTasks" in alert_types

    def test_escalation_for_at_risk(self):
        from models.health_pipeline import analyze_project_health
        tasks = [
            {"taskId": 1, "status": "Pending", "priority": "Low", "dueDate": "2020-01-01T00:00:00Z"},
            {"taskId": 2, "status": "Pending", "priority": "Medium", "dueDate": "2020-01-01T00:00:00Z"},
            {"taskId": 3, "status": "Pending", "priority": "Low", "dueDate": "2020-01-01T00:00:00Z"},
            {"taskId": 4, "status": "Pending", "priority": "Medium", "dueDate": "2020-01-01T00:00:00Z"},
            {"taskId": 5, "status": "Pending", "priority": "Low", "dueDate": "2020-01-01T00:00:00Z"},
            {"taskId": 6, "status": "Pending", "priority": "Medium", "dueDate": "2020-01-01T00:00:00Z"},
            {"taskId": 7, "status": "Pending", "priority": "Low", "dueDate": "2020-01-01T00:00:00Z"},
            {"taskId": 8, "status": "Pending", "priority": "Medium", "dueDate": "2020-01-01T00:00:00Z"},
            {"taskId": 9, "status": "Pending", "priority": "Low", "dueDate": "2020-01-01T00:00:00Z"},
            {"taskId": 10, "status": "Pending", "priority": "Medium", "dueDate": "2020-01-01T00:00:00Z"},
        ]
        result = analyze_project_health(1, tasks, days_until_deadline=-5, team_size=2)
        assert result["riskLevel"] in ("At Risk", "Likely Delayed")


# ---------------------------------------------------------------------------
# FastAPI endpoint tests
# ---------------------------------------------------------------------------

class TestEndpoints:
    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from main import app
        return TestClient(app)

    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_classify_document(self, client):
        resp = client.post("/classify-document", json={"title": "Employee onboarding checklist"})
        assert resp.status_code == 200
        data = resp.json()
        assert "category" in data
        assert "confidence" in data

    def test_classify_document_empty(self, client):
        resp = client.post("/classify-document", json={"title": ""})
        assert resp.status_code == 422

    def test_predict_delay(self, client):
        resp = client.post("/predict-delay", json={
            "totalTasks": 20,
            "completedTasks": 15,
            "overdueTasks": 1,
            "daysUntilDeadline": 30,
            "teamSize": 4,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "riskScore" in data
        assert "riskLevel" in data

    def test_auto_prioritize(self, client):
        resp = client.post("/auto-prioritize", json={
            "projectId": 1,
            "projectRiskScore": 50,
            "tasks": [
                {"taskId": 1, "priority": "Low", "status": "Pending", "dueDate": "2020-01-01T00:00:00Z"},
            ],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["recommendations"]) == 1
        assert data["recommendations"][0]["recommendedPriority"] == "High"

    def test_analyze_project_health(self, client):
        resp = client.post("/analyze-project-health", json={
            "projectId": 1,
            "tasks": [
                {"taskId": 1, "status": "Completed", "dueDate": "2025-01-01T00:00:00Z"},
            ],
            "daysUntilDeadline": 30,
            "teamSize": 3,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "riskLevel" in data
        assert "alerts" in data
        assert "escalatedTasks" in data
