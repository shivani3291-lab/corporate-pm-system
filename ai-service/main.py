"""Corporate PM AI microservice — classification, search, delay, predictive health."""

from __future__ import annotations

from typing import Any, Literal

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed — env vars must be set in the shell/host instead

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from models.classifier import classify_document, add_training_example
from models.delay_predictor import predict_delay
from models.health_pipeline import analyze_project_health
from models.search import semantic_search
from models.auto_prioritizer import auto_prioritize_tasks
from models.rag_chat import retrieve_and_answer
from models.observability import score_trace, estimate_cost_usd

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


class AutoPrioritizeTaskItem(BaseModel):
    taskId: int | None = None
    dueDate: str | None = None
    priority: str | None = None
    status: str | None = None
    isMilestone: bool = False
    dependencyCount: int = 0
    hoursEstimated: float = 8.0


class AutoPrioritizeRequest(BaseModel):
    projectId: int = Field(ge=1)
    projectRiskScore: int = Field(default=50, ge=0, le=100)
    tasks: list[AutoPrioritizeTaskItem] = Field(default_factory=list)


class PriorityRecommendation(BaseModel):
    taskId: int | None = None
    currentPriority: str
    recommendedPriority: str
    confidence: float
    reason: str


class AutoPrioritizeResponse(BaseModel):
    projectId: int
    recommendations: list[PriorityRecommendation]


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


@app.post("/auto-prioritize", response_model=AutoPrioritizeResponse)
def post_auto_prioritize(body: AutoPrioritizeRequest) -> AutoPrioritizeResponse:
    try:
        tasks_raw = [t.model_dump() for t in body.tasks]
        results = auto_prioritize_tasks(tasks_raw, project_risk_score=body.projectRiskScore)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return AutoPrioritizeResponse(
        projectId=body.projectId,
        recommendations=[
            PriorityRecommendation(
                taskId=r.get("taskId"),
                currentPriority=str(r.get("currentPriority", "Medium")),
                recommendedPriority=str(r.get("recommendedPriority", "Medium")),
                confidence=float(r.get("confidence", 0)),
                reason=str(r.get("reason", "")),
            )
            for r in results
        ],
    )


# ── Feedback: learn from user corrections ─────────────────────

class FeedbackRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    category: str = Field(..., min_length=1, max_length=100)


class FeedbackResponse(BaseModel):
    success: bool
    message: str


@app.post("/classify-feedback", response_model=FeedbackResponse)
def post_classify_feedback(body: FeedbackRequest) -> FeedbackResponse:
    """Called when user selects a different category than AI suggested.

    Adds the title + correct category as a training example
    so the model improves future predictions.
    """
    ok = add_training_example(body.title, body.category)
    return FeedbackResponse(
        success=ok,
        message=f"Learned: '{body.title}' → '{body.category}'",
    )


# ── RAG chat + observability (Tiny RAG feature) ───────────────

class RagCorpusItem(BaseModel):
    id: int
    kind: str
    title: str = ""
    text: str = ""


class RagChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    corpus: list[RagCorpusItem] = Field(default_factory=list)
    top_k: int = Field(default=5, ge=1, le=20)


class RetrievedChunkOut(BaseModel):
    id: int | None = None
    kind: str | None = None
    title: str
    text: str
    score: float


class RagChatResponse(BaseModel):
    answer: str
    retrieved_chunks: list[RetrievedChunkOut]
    prompt: str
    prompt_version: str
    model: str
    tokens_in: int
    tokens_out: int
    cost_usd: float
    retrieval_ms: int
    llm_ms: int
    total_ms: int
    groundedness: str
    retrieval_quality: str
    hallucination_risk: bool
    answer_relevance: str


@app.post("/rag/chat", response_model=RagChatResponse)
def post_rag_chat(body: RagChatRequest) -> RagChatResponse:
    try:
        corpus = [item.model_dump() for item in body.corpus]
        result = retrieve_and_answer(body.question, corpus, top_k=body.top_k)
        quality = score_trace(body.question, result["answer"], result["retrieved_chunks"])
        cost_usd = estimate_cost_usd(result["model"], result["tokens_in"], result["tokens_out"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        # Groq API errors (missing/invalid key, rate limit, network) — distinct
        # from a 400 so the caller knows the request itself was fine.
        raise HTTPException(status_code=502, detail=f"RAG chat failed: {e}") from e
    return RagChatResponse(
        answer=result["answer"],
        retrieved_chunks=[RetrievedChunkOut(**c) for c in result["retrieved_chunks"]],
        prompt=result["prompt"],
        prompt_version=result["prompt_version"],
        model=result["model"],
        tokens_in=result["tokens_in"],
        tokens_out=result["tokens_out"],
        cost_usd=cost_usd,
        retrieval_ms=result["retrieval_ms"],
        llm_ms=result["llm_ms"],
        total_ms=result["total_ms"],
        groundedness=quality["groundedness"],
        retrieval_quality=quality["retrieval_quality"],
        hallucination_risk=quality["hallucination_risk"],
        answer_relevance=quality["answer_relevance"],
    )
