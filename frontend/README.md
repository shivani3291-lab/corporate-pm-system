# Corporate PM System

Full-stack corporate project management: JWT authentication, role-based access, and CRUD for projects, tasks, documents, employees, and categories — extended with a **Python AI microservice** providing document classification, semantic search, delay prediction, and predictive alerts.

> **AI/ML Status:** Features 1, 2, 3, and 5 are fully implemented. Feature 4 (Task Auto-Prioritization) is planned. See [Section 6 of the documentation](./Corporate_PM_Complete_Documentation_v2.docx) for full details.

## Stack

| Area | Technologies |
|------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, TanStack React Query, React Router v6, Axios, Recharts |
| Backend | Node.js, Express 5, Prisma 6, JWT, bcrypt, node-cron |
| AI Service | Python 3.11, FastAPI, scikit-learn, sentence-transformers, FAISS |
| Database | Microsoft SQL Server (Azure SQL or local) via Prisma |
| Storage | Azure Blob Storage (document files) |

## Repository layout

```
corporate-pm-system/
├── frontend/          # Vite dev server → http://localhost:5173, proxies /api → backend
├── backend/           # Express API → http://localhost:5000, Prisma schema & migrations
├── ai-service/        # FastAPI ML service → http://localhost:8000
│   ├── main.py
│   ├── models/
│   │   ├── classifier.py       # Feature 1 — Document Classification (Naive Bayes)
│   │   ├── search.py           # Feature 2 — NLP Semantic Search (Sentence Transformers + FAISS)
│   │   ├── delay_predictor.py  # Feature 3 — Project Delay Prediction (Logistic Regression)
│   │   ├── health.py           # Feature 5 — Predictive Alert Pipeline (combined)
│   │   └── prioritizer.py      # Feature 4 — Task Auto-Prioritization (planned)
│   └── requirements.txt
└── Corporate_PM_Complete_Documentation_v2.docx   # Full project write-up
```

## Prerequisites

- [Node.js](https://nodejs.org/) LTS v24+
- [pnpm](https://pnpm.io/)
- [Python 3.11](https://www.python.org/) via [Anaconda](https://www.anaconda.com/)
- A SQL Server database reachable with a Prisma-compatible connection string (see [Prisma SQL Server docs](https://www.prisma.io/docs/orm/overview/databases/sql-server))

## Environment variables

Create `backend/.env` (never commit real secrets).

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Prisma datasource URL for the main database |
| `SHADOW_DATABASE_URL` | Yes | Shadow DB for migrations (required for SQL Server in Prisma) |
| `JWT_SECRET` | Yes | Secret for signing and verifying JWTs |
| `PORT` | No | HTTP port for the API (default **5000**) |

## Setup

1. **Install Node.js dependencies** (run from each folder):

   ```bash
   cd backend  && pnpm install
   cd ../frontend && pnpm install
   ```

2. **Install Python dependencies** (from `ai-service/`):

   ```bash
   conda create -n corporate-pm python=3.11 -y
   conda activate corporate-pm
   pip install -r requirements.txt
   ```

3. **Configure the backend** — add `backend/.env` with the variables above.

4. **Apply database migrations** (from `backend/`):

   ```bash
   pnpm exec prisma migrate dev
   ```

   For production-like deploys use `pnpm exec prisma migrate deploy`. If the client is out of date after schema changes, run `pnpm exec prisma generate`.

## Run locally

Three terminals are required simultaneously:

**1. Backend** — from `backend/`:
```bash
pnpm dev
```
Health check: [http://localhost:5000/health](http://localhost:5000/health)

**2. Frontend** — from `frontend/`:
```bash
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` to `http://localhost:5000`.

**3. AI Service** — from `ai-service/`:
```bash
conda activate corporate-pm
uvicorn main:app --reload --port 8000
```
Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## API overview

### Backend (Node.js :5000)

All routes under `/api` except authentication expect a valid JWT in the `Authorization` header.

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Register and login (no JWT required) |
| `/api/employees` | Employee profiles and assignment history |
| `/api/projects` | Projects CRUD |
| `/api/tasks` | Tasks CRUD, overdue detection |
| `/api/documents` | Document metadata, version tracking |
| `/api/categories` | Category management |

### AI Service (FastAPI :8000)

| Endpoint | Feature | Status |
|----------|---------|--------|
| `POST /classify-document` | Document Auto-Classification (Naive Bayes) | ✅ Complete |
| `POST /search` | NLP Semantic Search (Sentence Transformers + FAISS) | ✅ Complete |
| `POST /predict-delay` | Project Delay Prediction (Logistic Regression) | ✅ Complete |
| `POST /analyze-project-health` | Predictive Alerts — combined pipeline | ✅ Complete |
| `POST /prioritize-tasks` | Task Auto-Prioritization | 🔲 Planned |

## AI/ML feature summary

| # | Feature | Algorithm | Status |
|---|---------|-----------|--------|
| 1 | Document Auto-Classification | Multinomial Naive Bayes + TF-IDF | ✅ Complete |
| 2 | NLP Semantic Search | Sentence Transformers (all-MiniLM-L6-v2) + FAISS | ✅ Complete |
| 3 | Project Delay Prediction | Logistic Regression (scikit-learn) | ✅ Complete |
| 4 | Task Auto-Prioritization | Rule-based weighted scoring | 🔲 Planned |
| 5 | Predictive Alerts Pipeline | Delay model + threshold classifier + escalation engine | ✅ Complete |

## Documentation

Full architecture, Azure setup, database schema, API reference, and AI/ML implementation details:
[Corporate_PM_Complete_Documentation_v2.docx](./Corporate_PM_Complete_Documentation_v2.docx)