# Corporate Project Management System

**Where Projects Meet Predictive Intelligence**

A full-stack enterprise project management platform designed to centralize operations, streamline workflows, and enable proactive, insight-driven execution across projects, tasks, documents, and teams.

---

## Key Capabilities

- JWT Authentication & Role-Based Access (Admin, Manager, Staff)
- Full CRUD for Projects, Tasks, Documents, Employees, Categories
- Real-time Dashboard with KPI analytics
- Semantic Search across tasks & documents
- Automatic Document Classification
- Project Delay Prediction & Risk Scoring
- Predictive Alerts & Task Escalation
- Cloud-ready architecture (Azure-compatible)

---

## Architecture Overview
Frontend (React :5173)
↓
Backend API (Node.js :5000)
↓
AI Service (FastAPI :8000)


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
| Database | Microsoft SQL Server |
| AI Service | Python 3.11, FastAPI |
| ML/NLP | scikit-learn, sentence-transformers, FAISS |

---

## Repository Structure
corporate-pm-system/
├── frontend/ # React application (Vite)
├── backend/ # Express API + Prisma
├── ai-service/ # FastAPI ML service
└── Corporate_PM_Complete_Documentation.pdf


---

## Prerequisites

- Node.js (LTS)
- pnpm
- Python 3.11 (Anaconda recommended)
- SQL Server (Azure SQL or local)

---

## Environment Variables (Backend)

Create `backend/.env`:
DATABASE_URL=your_database_url
SHADOW_DATABASE_URL=your_shadow_db_url
JWT_SECRET=your_secret
PORT=5000


---

## AI Service Setup
cd ai-service

### Create environment
conda create -n corporate-pm python=3.11
conda activate corporate-pm


### Install dependencies
pip install -r requirements.txt


### Run AI service
uvicorn main:app --reload --port 8000


AI Service URL: http://localhost:8000

---

## Database Setup
cd backend
pnpm exec prisma migrate dev
pnpm exec prisma generate


---

## Run Application Locally

Run in **3 terminals**

### Backend
cd backend
pnpm dev
http://localhost:5000

---

### Frontend
cd frontend
pnpm dev

http://localhost:5173

---

### AI Service
cd ai-service
conda activate corporate-pm
uvicorn main:app --reload --port 8000


http://localhost:8000

---

## API Overview

| Endpoint | Description |
|--------|-------------|
| /api/auth | Authentication |
| /api/projects | Projects |
| /api/tasks | Tasks |
| /api/documents | Documents |
| /api/employees | Employees |
| /api/categories | Categories |

---

## AI Endpoints

| Endpoint | Description |
|--------|-------------|
| /classify-document | Document classification |
| /search | Semantic search |
| /predict-delay | Delay prediction |
| /analyze-project-health | Predictive alerts |

---

## AI Features

| Feature | Status |
|--------|--------|
| Document Classification | Complete |
| Semantic Search | Complete |
| Delay Prediction | Complete |
| Predictive Alerts | Complete |
| Task Auto-Prioritization |  Planned |

---

## Deployment

- Azure SQL Database
- Azure Blob Storage
- Azure App Service
- GitHub Actions CI/CD

---

## Notes

- AI service must be running for ML features
- Frontend communicates only with backend
- Prisma v6 used for SQL Server stability

---

## Author

Shivani Chaudhari  
Corporate Project Management System — 2026