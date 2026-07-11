"""
Post-hoc quality scoring for RAG traces: groundedness, retrieval quality,
hallucination risk, and answer relevance. All heuristic and computed after
the response is already built — none of this blocks or slows the answer.

Kept lightweight (no second LLM call) by default. Each score function returns
a small dict with a bucketed "level" plus the raw numeric detail behind it,
so an LLM-judge scorer could later replace the body of any one function
without changing what callers (main.py, the trace schema) expect back.
"""

from __future__ import annotations

import re
from typing import Any

# $ per million tokens (Groq list pricing). Update if the model in rag_chat.py
# changes. The RAG chat feature runs on Groq's free tier by default, so this
# is a notional cost for the observability dashboard, not necessarily a real
# charge — still useful to compare traces against each other and to know the
# real number if a paid tier is ever used.
_PRICING_PER_MTOK: dict[str, dict[str, float]] = {
    "llama-3.3-70b-versatile": {"input": 0.59, "output": 0.79},
}
_DEFAULT_MODEL = "llama-3.3-70b-versatile"

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
_WORD_RE = re.compile(r"[a-z0-9]+")


def estimate_cost_usd(model: str, tokens_in: int, tokens_out: int) -> float:
    rates = _PRICING_PER_MTOK.get(model, _PRICING_PER_MTOK[_DEFAULT_MODEL])
    cost = (tokens_in / 1_000_000) * rates["input"] + (tokens_out / 1_000_000) * rates["output"]
    return round(cost, 6)


def _words(text: str) -> set[str]:
    return set(_WORD_RE.findall(text.lower()))


def _sentence_supported(sentence: str, context_words: set[str], threshold: float = 0.5) -> bool:
    """Cheap groundedness proxy: does most of this sentence's vocabulary appear
    in the retrieved context? Not real NLI/entailment — a fast stand-in for it."""
    s_words = _words(sentence)
    if not s_words:
        return True
    overlap = len(s_words & context_words) / len(s_words)
    return overlap >= threshold


def score_groundedness(answer: str, retrieved_chunks: list[dict[str, Any]]) -> dict[str, Any]:
    context_words = _words(" ".join(str(c.get("text") or "") for c in retrieved_chunks))
    sentences = [s.strip() for s in _SENTENCE_SPLIT.split(answer) if s.strip()]
    if not sentences:
        return {"level": "low", "supported_ratio": 0.0}
    supported = sum(1 for s in sentences if _sentence_supported(s, context_words))
    ratio = supported / len(sentences)
    level = "high" if ratio >= 0.8 else "ok" if ratio >= 0.4 else "low"
    return {"level": level, "supported_ratio": round(ratio, 3)}


def score_retrieval_quality(retrieved_chunks: list[dict[str, Any]]) -> dict[str, Any]:
    top1 = float(retrieved_chunks[0]["score"]) if retrieved_chunks else 0.0
    level = "high" if top1 >= 0.6 else "ok" if top1 >= 0.35 else "low"
    return {"level": level, "top1_score": round(top1, 4)}


def score_answer_relevance(question: str, answer: str) -> dict[str, Any]:
    """Cheap keyword-overlap heuristic between question and answer.
    Swap for an LLM-judge call later if higher fidelity is needed — the
    return shape (a bucketed "level" + a 0-1 "score") can stay the same."""
    q_words = _words(question)
    a_words = _words(answer)
    if not q_words:
        return {"level": "low", "score": 0.0}
    overlap = len(q_words & a_words) / len(q_words)
    level = "high" if overlap >= 0.5 else "ok" if overlap >= 0.2 else "low"
    return {"level": level, "score": round(overlap, 3)}


def score_trace(
    question: str,
    answer: str,
    retrieved_chunks: list[dict[str, Any]],
) -> dict[str, Any]:
    """Runs all quality checks for one trace. Returns the bucketed levels plus
    the raw detail behind each, for the trace-detail "likely cause" drill-down."""
    groundedness = score_groundedness(answer, retrieved_chunks)
    retrieval_quality = score_retrieval_quality(retrieved_chunks)
    answer_relevance = score_answer_relevance(question, answer)
    hallucination_risk = groundedness["level"] == "low" and retrieval_quality["level"] == "low"

    return {
        "groundedness": groundedness["level"],
        "groundedness_detail": groundedness,
        "retrieval_quality": retrieval_quality["level"],
        "retrieval_quality_detail": retrieval_quality,
        "hallucination_risk": hallucination_risk,
        "answer_relevance": answer_relevance["level"],
        "answer_relevance_detail": answer_relevance,
    }
