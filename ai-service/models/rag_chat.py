"""
Tiny RAG: retrieve top-k chunks via the shared embedding/FAISS retriever in
models.search, then ask an LLM (Groq) to answer grounded only in those chunks.

Corpus is passed in per-request (projects/tasks/documents assembled by the
backend from the DB) rather than a persisted index, consistent with how
models.search already works — no separate vector store to keep in sync.
"""

from __future__ import annotations

import time
from typing import Any

from models.search import embed_search, embedder_available

MODEL_ID = "llama-3.3-70b-versatile"

_client: Any | None = None
_GROQ_AVAILABLE: bool | None = None


def _check_groq_available() -> bool:
    global _GROQ_AVAILABLE
    if _GROQ_AVAILABLE is not None:
        return _GROQ_AVAILABLE
    try:
        import groq  # noqa: F401
        _GROQ_AVAILABLE = True
    except ImportError:
        _GROQ_AVAILABLE = False
    return _GROQ_AVAILABLE


def _get_client() -> Any:
    global _client
    if _client is None:
        from groq import Groq
        _client = Groq()  # reads GROQ_API_KEY from the environment
    return _client


def _build_prompt(question: str, chunks: list[dict[str, Any]]) -> str:
    context = "\n\n".join(
        f"[{i + 1}] ({c['kind']} #{c['id']}) {c['title']}\n{c['text']}"
        for i, c in enumerate(chunks)
    )
    return (
        "Answer the question using ONLY the numbered context below — do not use "
        "outside knowledge. Cite the source(s) you used like [1] or [2]. "
        "If the context does not contain the answer, say so plainly instead of guessing.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}"
    )


def retrieve_and_answer(
    question: str,
    corpus: list[dict[str, Any]],
    *,
    top_k: int = 5,
) -> dict[str, Any]:
    """
    corpus: [{"id": int, "kind": str, "title": str, "text": str}, ...]

    Returns {answer, retrieved_chunks, prompt, prompt_version, model,
    tokens_in, tokens_out, retrieval_ms, llm_ms, total_ms}.
    """
    q = (question or "").strip()
    if not q:
        raise ValueError("question is required")
    if not corpus:
        raise ValueError("corpus is empty — nothing to retrieve from")
    if not embedder_available():
        raise ValueError("sentence-transformers not installed — RAG retrieval unavailable")
    if not _check_groq_available():
        raise ValueError("groq package not installed — RAG chat unavailable")

    top_k = max(1, min(int(top_k), 20))
    k = min(top_k, len(corpus))

    t0 = time.monotonic()
    texts = [str(c.get("text") or c.get("title") or "") for c in corpus]
    pairs = embed_search(q, texts, k)
    retrieval_ms = int((time.monotonic() - t0) * 1000)

    retrieved_chunks = [
        {
            "id": corpus[idx].get("id"),
            "kind": corpus[idx].get("kind"),
            "title": corpus[idx].get("title"),
            "text": str(corpus[idx].get("text") or corpus[idx].get("title") or ""),
            "score": round(score, 4),
        }
        for idx, score in pairs
    ]

    prompt = _build_prompt(q, retrieved_chunks)

    t1 = time.monotonic()
    response = _get_client().chat.completions.create(
        model=MODEL_ID,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    llm_ms = int((time.monotonic() - t1) * 1000)

    answer = (response.choices[0].message.content or "").strip()

    return {
        "answer": answer,
        "retrieved_chunks": retrieved_chunks,
        "prompt": prompt,
        "prompt_version": "v1",
        "model": MODEL_ID,
        "tokens_in": response.usage.prompt_tokens,
        "tokens_out": response.usage.completion_tokens,
        "retrieval_ms": retrieval_ms,
        "llm_ms": llm_ms,
        "total_ms": retrieval_ms + llm_ms,
    }
