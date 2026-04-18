"""
Document title classifier: Multinomial Naive Bayes + TF-IDF (per project spec).
Trained on bundled short phrases per category; no external dataset required at runtime.
"""

from __future__ import annotations

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

# Multiple synthetic lines per class to stabilize TF-IDF + NB on short titles.
_TRAINING: list[tuple[str, str]] = [
    # Technical
    ("System architecture design document", "Technical"),
    ("API specification and integration guide", "Technical"),
    ("Database schema migration plan", "Technical"),
    ("Kubernetes deployment and CI pipeline", "Technical"),
    ("Software module design and code review", "Technical"),
    ("REST GraphQL microservice troubleshooting", "Technical"),
    ("Security patch release notes", "Technical"),
    ("Infrastructure monitoring dashboard spec", "Technical"),
    ("Authentication module OAuth2 implementation", "Technical"),
    ("Load testing results and performance tuning", "Technical"),
    ("Frontend React component library", "Technical"),
    ("Backend service logs and error analysis", "Technical"),
    # Finance
    ("Quarterly budget forecast spreadsheet", "Finance"),
    ("Invoice payment reconciliation", "Finance"),
    ("Accounts payable and receivable summary", "Finance"),
    ("CapEx OpEx approval request", "Finance"),
    ("Tax audit supporting documents", "Finance"),
    ("Revenue recognition policy memo", "Finance"),
    ("Cost center allocation report", "Finance"),
    ("Purchase order and vendor contract", "Finance"),
    ("Financial statement closing checklist", "Finance"),
    ("Expense reimbursement policy", "Finance"),
    ("Cash flow projection model", "Finance"),
    ("Audit trail for journal entries", "Finance"),
    # Report
    ("Executive summary monthly status report", "Report"),
    ("Stakeholder meeting minutes", "Report"),
    ("Project status rollup deck", "Report"),
    ("Annual review summary", "Report"),
    ("Compliance assessment findings", "Report"),
    ("Lessons learned document", "Report"),
    ("Risk register update", "Report"),
    ("Board presentation deck", "Report"),
    ("Weekly progress report", "Report"),
    ("Customer survey analysis summary", "Report"),
    ("KPI dashboard narrative", "Report"),
    ("Quarterly business review QBR", "Report"),
    # HR
    ("Employee onboarding checklist", "HR"),
    ("Performance review form", "HR"),
    ("Leave policy and absence request", "HR"),
    ("Code of conduct acknowledgment", "HR"),
    ("Recruitment job description", "HR"),
    ("Salary band and compensation guidance", "HR"),
    ("Training and development plan", "HR"),
    ("Workplace harassment policy", "HR"),
    ("Benefits enrollment guide", "HR"),
    ("Headcount planning spreadsheet", "HR"),
    ("Employee handbook update", "HR"),
    ("Termination checklist and exit interview", "HR"),
]

_pipeline: Pipeline | None = None


def _fit() -> Pipeline:
    texts = [t for t, _ in _TRAINING]
    labels = [y for _, y in _TRAINING]
    pipe = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    min_df=1,
                    ngram_range=(1, 2),
                    max_features=4096,
                ),
            ),
            ("nb", MultinomialNB(alpha=0.1)),
        ]
    )
    pipe.fit(texts, labels)
    return pipe


def _get_pipeline() -> Pipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = _fit()
    return _pipeline


def classify_document(title: str) -> tuple[str, float]:
    """Return (predicted_category, confidence in [0,1])."""
    t = (title or "").strip()
    if not t:
        raise ValueError("title is required")

    pipe = _get_pipeline()
    proba = pipe.predict_proba([t])[0]
    idx = int(proba.argmax())
    label = str(pipe.classes_[idx])
    conf = float(proba[idx])
    return label, conf
