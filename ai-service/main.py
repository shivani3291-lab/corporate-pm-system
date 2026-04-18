"""Corporate PM AI microservice — classification, search, delay, predictive health."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from models.classifier import classify_document
from models.delay_predictor import predict_delay
from models.health_pipeline import analyze_project_health
from models.search import semantic_search

app = FastAPI(title="Corporate PM AI Service", version="1.0.0")


class ClassifyDocumentRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


class ClassifyDocumentResponse(BaseModel):
    category: str
    confidence: float


class SearchItem(BaseModel):
    id: int
    kind: Literal["document", "task"]
    title: str = ""


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=5, ge=1, le=50)
    items: list[SearchItem] = Field(default_factory=list)


class SearchResultItem(BaseModel):
    title: str
    score: float
    id: int | None = None
    kind: str | None = None


class SearchResponse(BaseModel):
    results: list[SearchResultItem]


class PredictDelayRequest(BaseModel):
    totalTasks: int = Field(ge=0, le=100_000)
    completedTasks: int = Field(ge=0, le=100_000)
    overdueTasks: int = Field(ge=0, le=100_000)
    daysUntilDeadline: int = Field(ge=-10_000, le=10_000)
    teamSize: int = Field(ge=0, le=10_000)


class PredictDelayResponse(BaseModel):
    riskScore: int
    riskLevel: str
    reason: str


class AnalyzeProjectHealthRequest(BaseModel):
    projectId: int = Field(ge=1)
    tasks: list[dict[str, Any]] = Field(default_factory=list)
    daysUntilDeadline: int = Field(ge=-10_000, le=10_000)
    teamSize: int = Field(default=1, ge=0, le=10_000)


class AlertItemOut(BaseModel):
    type: str
    severity: str
    message: str


class EscalatedTaskOut(BaseModel):
    taskId: int
    fromPriority: str
    toPriority: str
    reason: str


class AnalyzeProjectHealthResponse(BaseModel):
    projectId: int
    riskLevel: str
    riskScore: int
    alerts: list[AlertItemOut]
    escalatedTasks: list[EscalatedTaskOut]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai"}


@app.post("/classify-document", response_model=ClassifyDocumentResponse)
def post_classify_document(body: ClassifyDocumentRequest) -> ClassifyDocumentResponse:
    try:
        category, confidence = classify_document(body.title)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return ClassifyDocumentResponse(
        category=category,
        confidence=round(confidence, 4),
    )


@app.post("/search", response_model=SearchResponse)
def post_search(body: SearchRequest) -> SearchResponse:
    try:
        raw = [item.model_dump() for item in body.items]
        rows = semantic_search(body.query, raw, limit=body.limit)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return SearchResponse(
        results=[
            SearchResultItem(
                title=r["title"],
                score=round(r["score"], 4),
                id=r.get("id"),
                kind=r.get("kind"),
            )
            for r in rows
        ]
    )


@app.post("/predict-delay", response_model=PredictDelayResponse)
def post_predict_delay(body: PredictDelayRequest) -> PredictDelayResponse:
    try:
        raw = predict_delay(body.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return PredictDelayResponse(
        riskScore=int(raw["riskScore"]),
        riskLevel=str(raw["riskLevel"]),
        reason=str(raw["reason"]),
    )


@app.post("/analyze-project-health", response_model=AnalyzeProjectHealthResponse)
def post_analyze_project_health(
    body: AnalyzeProjectHealthRequest,
) -> AnalyzeProjectHealthResponse:
    try:
        raw = analyze_project_health(
            body.projectId,
            list(body.tasks),
            body.daysUntilDeadline,
            body.teamSize,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return AnalyzeProjectHealthResponse(
        projectId=int(raw["projectId"]),
        riskLevel=str(raw["riskLevel"]),
        riskScore=int(raw["riskScore"]),
        alerts=[
            AlertItemOut(
                type=str(a["type"]),
                severity=str(a["severity"]),
                message=str(a["message"]),
            )
            for a in raw["alerts"]
        ],
        escalatedTasks=[
            EscalatedTaskOut(
                taskId=int(e["taskId"]),
                fromPriority=str(e["fromPriority"]),
                toPriority=str(e["toPriority"]),
                reason=str(e["reason"]),
            )
            for e in raw["escalatedTasks"]
        ],
    )
