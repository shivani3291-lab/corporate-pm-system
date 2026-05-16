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
    # Requirements (20 examples)
    ("Software requirements specification SRS document", "Requirements"),
    ("Business requirements document BRD", "Requirements"),
    ("Functional requirements specification", "Requirements"),
    ("Non-functional requirements analysis", "Requirements"),
    ("User stories and acceptance criteria", "Requirements"),
    ("Product requirements document PRD", "Requirements"),
    ("Feature specification and scope definition", "Requirements"),
    ("Requirements traceability matrix", "Requirements"),
    ("Stakeholder requirements gathering", "Requirements"),
    ("Use case specification document", "Requirements"),
    ("System requirements specification", "Requirements"),
    ("Business rules documentation", "Requirements"),
    ("E-commerce product catalog requirements", "Requirements"),
    ("Shopping cart feature requirements", "Requirements"),
    ("Payment integration requirements", "Requirements"),
    ("Requirements document", "Requirements"),
    ("Feature requirements", "Requirements"),
    ("System requirements", "Requirements"),
    ("Business requirements", "Requirements"),
    ("Functional spec", "Requirements"),

    # Design (20 examples)
    ("System architecture design document", "Design"),
    ("Database schema design and ERD", "Design"),
    ("UI UX wireframe and mockup", "Design"),
    ("Component design and module diagram", "Design"),
    ("API design and endpoint specification", "Design"),
    ("Infrastructure architecture blueprint", "Design"),
    ("Data flow diagram DFD", "Design"),
    ("Class diagram and sequence diagram", "Design"),
    ("Microservices architecture overview", "Design"),
    ("Network topology and deployment diagram", "Design"),
    ("Interface design specification", "Design"),
    ("Security architecture design", "Design"),
    ("High level design HLD document", "Design"),
    ("Low level design LLD document", "Design"),
    ("System architecture overview", "Design"),
    ("Architecture document", "Design"),
    ("Design document", "Design"),
    ("System design", "Design"),
    ("Database design", "Design"),
    ("UI design", "Design"),

    # Development (20 examples)
    ("API documentation and reference guide", "Development"),
    ("Installation guide and setup instructions", "Development"),
    ("Developer coding standards and conventions", "Development"),
    ("Technical implementation guide", "Development"),
    ("Module documentation and code reference", "Development"),
    ("SDK integration and plugin development", "Development"),
    ("Database migration and seed script", "Development"),
    ("CI CD pipeline configuration", "Development"),
    ("Build and deployment instructions", "Development"),
    ("Code review checklist and best practices", "Development"),
    ("Configuration reference and environment setup", "Development"),
    ("Development environment setup guide", "Development"),
    ("Swagger OpenAPI documentation", "Development"),
    ("Release notes and changelog", "Development"),
    ("Version control and branching strategy", "Development"),
    ("Technical documentation", "Development"),
    ("Developer guide", "Development"),
    ("Setup guide", "Development"),
    ("API reference", "Development"),
    ("Installation guide", "Development"),

    # Testing (20 examples)
    ("Test plan and test strategy document", "Testing"),
    ("Unit test coverage report", "Testing"),
    ("Integration test cases and scenarios", "Testing"),
    ("User acceptance testing UAT plan", "Testing"),
    ("Performance and load testing results", "Testing"),
    ("Security penetration testing report", "Testing"),
    ("Regression test suite execution report", "Testing"),
    ("Bug and defect tracking summary", "Testing"),
    ("Smoke test and sanity test checklist", "Testing"),
    ("Automated test framework documentation", "Testing"),
    ("Test case template and test data", "Testing"),
    ("Quality assurance QA process document", "Testing"),
    ("API testing and Postman collection", "Testing"),
    ("Cross browser compatibility testing", "Testing"),
    ("Accessibility testing WCAG report", "Testing"),
    ("Test document", "Testing"),
    ("QA document", "Testing"),
    ("Test report", "Testing"),
    ("Testing guide", "Testing"),
    ("Test results", "Testing"),

    # Business (20 examples)
    ("Project proposal and statement of work", "Business"),
    ("Business case and ROI analysis", "Business"),
    ("Project timeline and milestone schedule", "Business"),
    ("Vendor contract and service agreement", "Business"),
    ("Invoice and purchase order", "Business"),
    ("Meeting minutes and action items", "Business"),
    ("Project status report and executive summary", "Business"),
    ("Risk assessment and mitigation plan", "Business"),
    ("Change request and impact analysis", "Business"),
    ("Stakeholder communication plan", "Business"),
    ("Project charter and kickoff document", "Business"),
    ("Resource allocation and budget plan", "Business"),
    ("Sprint planning and retrospective notes", "Business"),
    ("KPI dashboard and metrics report", "Business"),
    ("Lessons learned and postmortem document", "Business"),
    ("Business document", "Business"),
    ("Project plan", "Business"),
    ("Status report", "Business"),
    ("Meeting notes", "Business"),
    ("Proposal document", "Business"),

    # Documentation (20 examples)
    ("User manual and help guide", "Documentation"),
    ("Admin user guide and operations manual", "Documentation"),
    ("Training material and onboarding guide", "Documentation"),
    ("FAQ and troubleshooting guide", "Documentation"),
    ("Process documentation and SOP", "Documentation"),
    ("Policy document and compliance guide", "Documentation"),
    ("README file and getting started guide", "Documentation"),
    ("Knowledge base article", "Documentation"),
    ("Runbook and incident response guide", "Documentation"),
    ("Product documentation and feature overview", "Documentation"),
    ("User guide", "Documentation"),
    ("Help documentation", "Documentation"),
    ("Getting started guide", "Documentation"),
    ("Operations manual", "Documentation"),
    ("Training guide", "Documentation"),
    ("Product guide", "Documentation"),
    ("User documentation", "Documentation"),
    ("Admin guide", "Documentation"),
    ("Reference manual", "Documentation"),
    ("How to guide", "Documentation"),
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
                    ngram_range=(1, 3),
                    max_features=8192,
                    sublinear_tf=True,
                ),
            ),
            ("nb", MultinomialNB(alpha=0.05)),
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
    """Return (predicted_category, confidence in [0,1]).
    
    Always returns a prediction. Uses keyword fallback if ML confidence is low.
    """
    t = (title or "").strip()
    if not t:
        raise ValueError("title is required")

    pipe = _get_pipeline()
    proba = pipe.predict_proba([t])[0]
    idx = int(proba.argmax())
    label = str(pipe.classes_[idx])
    conf = float(proba[idx])
    
    # If ML confidence is low, try keyword matching as fallback
    if conf < 0.40:
        keyword_result = _keyword_match(t)
        if keyword_result:
            return keyword_result, 0.75  # Give keyword matches decent confidence
    
    return label, conf


def _keyword_match(title: str) -> str | None:
    """Simple keyword-based fallback for better accuracy."""
    t = title.lower()
    
    # Keyword patterns for each category
    patterns = {
        "Requirements": ["requirement", "specification", "srs", "brd", "user stor", "acceptance", "feature spec", "scope"],
        "Design": ["architecture", "design", "wireframe", "mockup", "diagram", "schema", "erd", "ui", "ux", "interface"],
        "Development": ["api", "documentation", "install", "setup", "guide", "reference", "technical", "developer", "code", "migration", "deployment", "config", "swagger", "openapi", "release note", "changelog"],
        "Testing": ["test", "qa", "quality", "bug", "defect", "regression", "performance", "security", "penetration", "uat", "acceptance test", "coverage"],
        "Business": ["proposal", "business", "project plan", "timeline", "milestone", "contract", "invoice", "meeting", "status report", "risk", "budget", "sprint", "retrospective", "charter"],
        "Documentation": ["manual", "guide", "help", "faq", "training", "onboarding", "knowledge", "runbook", "sop", "policy", "readme", "getting started", "how to"],
    }
    
    for category, keywords in patterns.items():
        for keyword in keywords:
            if keyword in t:
                return category
    
    return None


def add_training_example(title: str, category: str) -> bool:
    """Add a new training example and retrain the model.
    
    Called when user selects a different category than AI suggested.
    This teaches the model to improve future predictions.
    """
    global _pipeline

    t = (title or "").strip()
    c = (category or "").strip()

    if not t or not c:
        return False

    # Add the correct example 3 times to give it weight
    for _ in range(3):
        _TRAINING.append((t, c))

    # Reset pipeline so it retrains on next classify call
    _pipeline = None
    return True
