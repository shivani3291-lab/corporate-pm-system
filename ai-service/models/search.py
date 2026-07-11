"""
NLP semantic search: sentence-transformers embeddings + FAISS cosine similarity (Feature 2).

sentence-transformers requires torch (~114MB). If not installed, semantic search
is unavailable but the service still starts — the backend falls back to keyword search.
"""

from __future__ import annotations

from typing import Any

import faiss
import numpy as np

_MODEL: Any | None = None
_ST_AVAILABLE: bool | None = None


def _check_available() -> bool:
    global _ST_AVAILABLE
    if _ST_AVAILABLE is not None:
        return _ST_AVAILABLE
    try:
        import sentence_transformers  # noqa: F401
        _ST_AVAILABLE = True
    except ImportError:
        _ST_AVAILABLE = False
    return _ST_AVAILABLE


def _get_model() -> Any:
    global _MODEL
    if _MODEL is None:
        from sentence_transformers import SentenceTransformer
        _MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return _MODEL


def embedder_available() -> bool:
    """Whether sentence-transformers is installed (shared by search + RAG retrieval)."""
    return _check_available()


def embed_search(query: str, texts: list[str], k: int) -> list[tuple[int, float]]:
    """
    Embed texts + query with the shared sentence-transformers model, build an
    ephemeral FAISS cosine-similarity index, and return the top-k
    (index_into_texts, score) pairs sorted by score descending.

    Shared by semantic_search() and models.rag_chat's retriever so the
    embedding/index-building logic lives in exactly one place.
    """
    if not _check_available():
        raise ValueError("sentence-transformers not installed — semantic search unavailable")
    if not texts:
        return []

    model = _get_model()
    emb = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    q_emb = model.encode(
        [query],
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )[0]

    dim = int(emb.shape[1])
    index = faiss.IndexFlatIP(dim)
    index.add(emb.astype(np.float32))
    scores, indices = index.search(q_emb.reshape(1, -1).astype(np.float32), k)

    out: list[tuple[int, float]] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(texts):
            continue
        out.append((int(idx), float(score)))
    return out


def semantic_search(
    query: str,
    items: list[dict],
    *,
    limit: int = 5,
) -> list[dict]:
    """
    items: [{"id": int, "kind": str, "title": str}, ...]
    Returns [{"title", "score", "id", "kind"}, ...] sorted by score descending.
    """
    q = (query or "").strip()
    if not q:
        raise ValueError("query is required")
    if not items:
        return []

    limit = max(1, min(int(limit), 50))
    k = min(limit, len(items))

    titles = [str(it.get("title") or "") for it in items]
    pairs = embed_search(q, titles, k)

    out: list[dict] = []
    for idx, score in pairs:
        it = items[idx]
        out.append(
            {
                "title": str(it.get("title") or ""),
                "score": score,
                "id": int(it["id"]) if it.get("id") is not None else None,
                "kind": str(it.get("kind") or ""),
            }
        )
    return out
