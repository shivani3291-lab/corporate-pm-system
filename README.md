# Echelon — Corporate Project Management System

**Where Projects Meet Predictive Intelligence**

A full-stack enterprise project management platform designed to centralize operations, streamline workflows, and enable proactive, insight-driven execution across projects, tasks, documents, and teams.

> **🎭 Public demo mode:** Login is disabled in this build so the app is directly browsable — every request runs as a demo Admin user (see `backend/src/middleware/auth.ts`). The system is designed around full JWT authentication and role-based access control (Admin/Manager/Staff), documented below and in [ARCHITECTURE.md](ARCHITECTURE.md); it's just not gated in the public demo.

---

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — system design, data flow, security model
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — full API reference with request/response examples
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) — code standards, git workflow, testing

---

## Key Capabilities

### Core Features
- JWT Authentication & Role-Based Access (Admin, Manager, Staff) — disabled by default in this public demo build, see note above
- Full CRUD for Projects, Tasks, Documents, Employees
- Real-time Dashboard with KPI analytics and clickable alerts
- File upload/download with Azure Blob Storage integration
- Advanced filtering (by project, employee, status, priority)

### AI-Powered Features
- **Document Classification** — Auto-categorizes documents using ML (title + PDF content analysis)
- **Semantic Search** — Search across tasks & documents using sentence-transformers + FAISS
- **Delay Prediction** — Predicts project delays with risk scoring (0-100%)
- **Project Health Analysis** — Multi-dimensional health checks with alerts
- **Task Auto-Prioritization** — AI recommends priority changes based on deadlines
- **Self-Learning** — AI learns from user corrections to improve predictions

### Dashboard
- KPI cards (Projects, Active Tasks, Completed, Employees)
- Task overview chart (last 6 months)
- Project status breakdown
- Clickable alerts (Overdue Tasks → Tasks page, Critical Alerts → Alerts page)

---

## Architecture

```
Frontend (React :5173)
       ↓
Backend API (Node.js :5000)
       ↓
AI Service (FastAPI :8000)
       ↓
SQL Server + Azure Blob Storage
```

- Frontend communicates only with backend
- Backend communicates with AI service
- AI service handles all ML logic independently

---

## Tech Stack

| Layer | Technologies |
|------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| State | TanStack React Query |
| Backend | Node.js, Express 5, Prisma 6 |
| Auth | JWT, bcrypt |
| Database | Microsoft SQL Server (Azure SQL) |
| Storage | Azure Blob Storage |
| AI Service | Python 3.11, FastAPI |
| ML/NLP | scikit-learn, sentence-transformers, FAISS, pdf-parse |
| CI/CD | GitHub Actions |

---

## Repository Structure

```
corporate-pm-system/
├── frontend/              # React application (Vite)
│   ├── src/
│   │   ├── components/    # Layout, Sidebar, Topbar
│   │   ├── context/       # Auth, Sidebar context
│   │   ├── pages/         # Dashboard, Projects, Tasks, Documents, etc.
│   │   └── services/      # API client
│   └── package.json
├── backend/               # Express API + Prisma
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, authorization
│   │   ├── lib/           # Prisma, AI service URL
│   │   └── jobs/          # Cron jobs (predictive alerts)
│   ├── prisma/            # Database schema & migrations
│   └── package.json
├── ai-service/            # FastAPI ML service
│   ├── models/            # Classifier, search, predictor, health
│   ├── main.py            # FastAPI app
│   └── requirements.txt
└── .github/workflows/     # CI/CD pipeline
```

---

## Prerequisites

- Node.js 18+ (LTS)
- pnpm 10+
- Python 3.11+
- SQL Server (Azure SQL or local)

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="sqlserver://server.database.windows.net:1433;database=db;user=user;password=pwd;encrypt=true;trustServerCertificate=false"
SHADOW_DATABASE_URL="sqlserver://server.database.windows.net:1433;database=db_shadow;user=user;password=pwd;encrypt=true;trustServerCertificate=false"
JWT_SECRET="your-secret-key"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
PORT=5000
```

### Frontend (`frontend/.env.production`)

```env
VITE_API_URL=https://your-backend-url.azurewebsites.net/api
```

### AI Service (`ai-service/.env`)

```env
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

---

## Local Development Setup

### 1. Install Dependencies

```bash
# Backend
cd backend && pnpm install

# Frontend
cd frontend && pnpm install

# AI Service
cd ai-service && pip install -r requirements.txt
```

### 2. Setup Database

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 3. Run Services (3 terminals)

```bash
# Terminal 1: Backend
cd backend && pnpm dev
# http://localhost:5000

# Terminal 2: Frontend
cd frontend && pnpm dev
# http://localhost:5173

# Terminal 3: AI Service
cd ai-service && python -m uvicorn main:app --reload --port 8000
# http://localhost:8000
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project (cascade) |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | List tasks (filter by projectId, status) |
| GET | /api/tasks/overdue | List overdue tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/documents | List documents |
| POST | /api/documents | Upload document (multipart/form-data) |
| GET | /api/documents/:id/download | Download file |
| PUT | /api/documents/:id | Update document |
| DELETE | /api/documents/:id | Delete document |

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | List employees |
| PUT | /api/employees/:id | Update employee role |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/assignments | List assignments |
| POST | /api/assignments | Assign employee to project |
| DELETE | /api/assignments/:id | Remove assignment |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/alerts | List predictive alerts |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/classify-document | Classify document (title + PDF content) |
| POST | /api/ai/classify-feedback | Learn from user corrections |
| POST | /api/ai/search | Semantic search |
| POST | /api/ai/predict-delay | Predict project delay |
| POST | /api/ai/analyze-project-health | Project health analysis |
| POST | /api/ai/auto-prioritize | Task prioritization |

---

## AI Features

| Feature | Model | Status |
|--------|-------|--------|
| Document Classification | TF-IDF + Naive Bayes + Keyword Fallback | ✅ Complete |
| Semantic Search | sentence-transformers + FAISS | ✅ Complete |
| Delay Prediction | Logistic Regression | ✅ Complete |
| Project Health Analysis | Weighted scoring + ML | ✅ Complete |
| Task Auto-Prioritization | Decision tree | ✅ Complete |
| Self-Learning | User feedback loop | ✅ Complete |
| PDF Content Analysis | pdf-parse + ML classifier | ✅ Complete |

---

## Deployment (Azure)

### Resources

| Resource | Purpose |
|----------|---------|
| Azure App Service (x3) | Frontend, Backend, AI Service |
| Azure SQL Database | Data storage |
| Azure Blob Storage | File storage |
| GitHub Actions | CI/CD pipeline |

### Deploy

1. Push to `main` branch
2. Go to GitHub Actions → Run workflow
3. Set `deploy` to `true`
4. Wait for deployment to complete

---

## Roles & Permissions

By design (bypassed for the public demo — see note above):

| Role | Projects | Tasks | Documents | Employees | Alerts |
|------|----------|-------|-----------|-----------|--------|
| Admin | Full CRUD | Full CRUD | Full CRUD | Full CRUD | Full CRUD |
| Manager | Full CRUD | Full CRUD | Full CRUD | View | View |
| Staff | View assigned | Update status | View | View | View |

---

## Troubleshooting

| Issue | Symptom | Solution |
|-------|---------|----------|
| DB Connection | 503 Service Unavailable | Check `DATABASE_URL`, verify SQL Server is running |
| AI Service Timeout | 500 Server Error | Check AI service is running on :8000, verify `AI_SERVICE_URL` |
| CORS Error | Cross-Origin blocked | Add the frontend origin to the CORS config in `backend/src/index.ts` |
| Port in Use | `EADDRINUSE` | Kill the existing process on port 5000 / 5173 / 8000 |

---

## Notes

- AI service must be running for ML features
- Frontend communicates only with backend
- Prisma v6 used for SQL Server stability
- Documents auto-classify on upload (title + PDF content)
- Risk prediction shows 0% for new projects with no tasks
- Project deletion cascades to all related records

---

## Author

**Shivani Chaudhari**
Corporate Project Management System — 2026
