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

    if not _check_available():
        raise ValueError("sentence-transformers not installed — semantic search unavailable")

    limit = max(1, min(int(limit), 50))
    k = min(limit, len(items))

    model = _get_model()
    titles = [str(it.get("title") or "") for it in items]
    emb = model.encode(
        titles,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    q_emb = model.encode(
        [q],
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )[0]

    dim = int(emb.shape[1])
    index = faiss.IndexFlatIP(dim)
    index.add(emb.astype(np.float32))
    scores, indices = index.search(q_emb.reshape(1, -1).astype(np.float32), k)

    out: list[dict] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(items):
            continue
        it = items[idx]
        out.append(
            {
                "title": str(it.get("title") or ""),
                "score": float(score),
                "id": int(it["id"]) if it.get("id") is not None else None,
                "kind": str(it.get("kind") or ""),
            }
        )
    return out
