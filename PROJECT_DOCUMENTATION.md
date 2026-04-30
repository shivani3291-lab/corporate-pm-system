# Corporate Project Management System - Complete Documentation

**Last Updated:** May 1, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [AI Service Documentation](#ai-service-documentation)
10. [Development Guide](#development-guide)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is This?

The **Corporate Project Management System** is a full-stack enterprise solution that combines traditional project management with AI-powered predictive analytics. It enables organizations to:

- Centralize all project, task, document, and team management
- Gain real-time insights through an analytics dashboard
- Predict project delays and risks proactively
- Automatically classify and organize documents
- Escalate critical issues with intelligent alerts
- Manage team assignments and roles across projects

### Target Users

- **Project Managers**: Monitor projects, track tasks, manage team assignments
- **Executives/Managers**: View KPI dashboards and predictive alerts
- **Team Members**: Update task status, view assignments, access documents
- **Administrators**: User management, system configuration

---

## Key Features

### Core Functionality

| Feature | Description | Role |
|---------|-------------|------|
| **Authentication** | JWT-based auth with role-based access control (Admin, Manager, Staff) | All |
| **Project Management** | Full CRUD operations for projects with status tracking | Manager+ |
| **Task Management** | Create, assign, prioritize, and track tasks with dependencies | All |
| **Document Management** | Upload, organize, classify documents by category | Manager+ |
| **Employee Management** | Manage employees, roles, and project assignments | Admin+ |
| **Categories** | Organize documents with custom categories | Manager+ |
| **Real-time Dashboard** | KPI metrics, project status, team utilization | All |
| **Alerts Management** | Manual and automated alerts with severity levels | All |

### AI-Powered Features

| Feature | Technology | Output |
|---------|-----------|--------|
| **Document Classification** | Sentence-Transformers + scikit-learn | Automatic category prediction with confidence score |
| **Semantic Search** | FAISS + SentenceTransformers | Intelligent search across tasks and documents |
| **Project Delay Prediction** | Scikit-learn + historical data | Risk score and estimated delay probability |
| **Project Health Analysis** | Multi-factor analysis | Health score, risks, and recommendations |
| **Task Auto-Prioritization** | Predictive model | Smart priority suggestions based on project data |

---

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack React Query
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **Routing**: React Router v7

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5
- **Language**: TypeScript
- **Database ORM**: Prisma 6
- **Database**: Microsoft SQL Server
- **Authentication**: JWT + bcryptjs
- **Task Scheduling**: node-cron
- **File Upload**: Multer
- **Testing**: Vitest

### AI Service
- **Framework**: FastAPI
- **Language**: Python 3.11
- **Server**: Uvicorn
- **ML Libraries**: 
  - scikit-learn (machine learning models)
  - sentence-transformers (embeddings)
  - FAISS (semantic search)
  - numpy (numerical computing)
- **Testing**: pytest
- **Validation**: Pydantic

### Infrastructure
- **Cloud**: Azure (optional)
- **API Pattern**: RESTful JSON
- **Port Configuration**:
  - Frontend: 5173
  - Backend: 5000
  - AI Service: 8000

---

## System Architecture

### High-Level Flow

```
┌─────────────────┐
│   React App     │
│   (Port 5173)   │
│                 │
│  Dashboard      │
│  Projects       │
│  Tasks          │
│  Documents      │
│  Employees      │
│  Alerts         │
└────────┬────────┘
         │
    HTTPS/JSON
         │
         ▼
┌──────────────────────┐
│   Express Backend    │
│   (Port 5000)        │
│                      │
│  Routes:             │
│  • /api/auth         │
│  • /api/projects     │
│  • /api/tasks        │
│  • /api/documents    │
│  • /api/employees    │
│  • /api/categories   │
│  • /api/alerts       │
│  • /api/assignments  │
│  • /api/ai           │
└────┬────────────┬────┘
     │            │
  SQL Server   HTTP
     │            │
     ▼            ▼
┌──────────┐  ┌──────────────┐
│ Database │  │ AI Service   │
│ MSSQL    │  │ (Port 8000)  │
│          │  │              │
│ Tables   │  │ • Classify   │
│ • Project│  │ • Search     │
│ • Task   │  │ • Predict    │
│ • Doc    │  │ • Analyze    │
│ • Emp    │  │ • Prioritize │
│ • Alert  │  └──────────────┘
└──────────┘
```

### Communication Patterns

1. **Frontend → Backend**: All frontend requests go through the backend API
2. **Backend → Database**: Prisma ORM manages all database interactions
3. **Backend → AI Service**: Backend makes REST calls for ML operations
4. **AI Service**: Runs independently, processes requests, returns predictions

### Authentication Flow

```
1. User logs in → POST /api/auth/login
2. Backend validates credentials, hashes password
3. Backend returns JWT token + user info
4. Frontend stores JWT in localStorage
5. Subsequent requests include Authorization header
6. Backend validates JWT, enforces role permissions
```

---

## Project Structure

### Root Directory

```
corporate-pm-system/
├── README.md                      # Quick start guide
├── PROJECT_DOCUMENTATION.md       # This file
├── ARCHITECTURE.md                # Detailed architecture
├── API_DOCUMENTATION.md           # API endpoints reference
├── SETUP_GUIDE.md                 # Installation & setup
├── DEVELOPMENT_GUIDE.md           # Development workflow
│
├── backend/                       # Node.js/Express backend
├── frontend/                      # React/TypeScript frontend
└── ai-service/                    # Python/FastAPI AI service
```

### Backend Structure (`/backend`)

```
backend/
├── src/
│   ├── index.ts                   # App entry point
│   ├── __tests__/                 # Unit tests
│   │   └── middleware.test.ts
│   ├── jobs/
│   │   └── predictiveAlerts.ts    # Cron job for alerts
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client
│   │   ├── aiServiceUrl.ts        # AI service config
│   │   ├── projectDelayMetrics.ts # Metrics calculations
│   │   └── projectHealthAnalysis.ts
│   ├── middleware/
│   │   ├── auth.ts                # JWT verification
│   │   └── authorize.ts           # Role-based access
│   └── routes/
│       ├── auth.ts                # Authentication endpoints
│       ├── projects.ts            # Project CRUD
│       ├── tasks.ts               # Task CRUD
│       ├── documents.ts           # Document CRUD
│       ├── employees.ts           # Employee CRUD
│       ├── categories.ts          # Category CRUD
│       ├── alerts.ts              # Alert management
│       ├── assignments.ts         # Project assignments
│       └── ai.ts                  # AI service integration
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Database migrations
│   └── seed.ts (optional)         # Seed data
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── startup.sh
```

### Frontend Structure (`/frontend`)

```
frontend/
├── src/
│   ├── main.tsx                   # App entry point
│   ├── App.tsx                    # Root component
│   ├── index.css                  # Global styles
│   ├── __tests__/                 # Component tests
│   │   └── components.test.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx         # Main layout wrapper
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   └── Topbar.tsx         # Header
│   │   └── ui/                    # Reusable UI components
│   ├── context/
│   │   ├── AuthContext.tsx        # Auth state management
│   │   └── SidebarContext.tsx     # UI state
│   ├── hooks/                     # Custom React hooks
│   ├── pages/
│   │   ├── Login.tsx              # Login page
│   │   ├── Register.tsx           # Registration page
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── Projects.tsx           # Projects list
│   │   ├── Tasks.tsx              # Tasks management
│   │   ├── Documents.tsx          # Documents library
│   │   ├── Employees.tsx          # Employee directory
│   │   ├── Categories.tsx         # Category management
│   │   └── Alerts.tsx             # Alerts dashboard
│   ├── services/
│   │   └── api.ts                 # API client
│   ├── styles/
│   │   └── globals.css
│   └── assets/                    # Images, icons
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── index.html
```

### AI Service Structure (`/ai-service`)

```
ai-service/
├── main.py                        # FastAPI app entry point
├── requirements.txt               # Python dependencies
├── models/
│   ├── __init__.py
│   ├── classifier.py              # Document classification
│   ├── search.py                  # Semantic search
│   ├── delay_predictor.py         # Delay prediction model
│   ├── health_pipeline.py         # Project health analysis
│   └── auto_prioritizer.py        # Task prioritization
├── tests/
│   └── test_models.py             # ML model tests
└── venv/                          # Python virtual environment
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **pnpm** 10.32+
- **Python** 3.11+
- **Microsoft SQL Server** (local or cloud)
- **Git**

### Quick Start

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd corporate-pm-system
   
   # Backend
   cd backend
   pnpm install
   
   # Frontend
   cd ../frontend
   pnpm install
   
   # AI Service
   cd ../ai-service
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   
   **Backend** (`.env`):
   ```
   DATABASE_URL="Server=...;Database=...;User Id=...;Password=..."
   SHADOW_DATABASE_URL="Server=...;Database=...;User Id=...;Password=..."
   JWT_SECRET="your-super-secret-key"
   AI_SERVICE_URL="http://localhost:8000"
   PORT=5000
   NODE_ENV=development
   ```
   
   **Frontend** (`.env`):
   ```
   VITE_API_URL="http://localhost:5000/api"
   ```

3. **Set Up Database**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Start Services**
   ```bash
   # Terminal 1: Backend
   cd backend && pnpm dev
   
   # Terminal 2: Frontend
   cd frontend && pnpm dev
   
   # Terminal 3: AI Service
   cd ai-service
   source venv/bin/activate
   python -m uvicorn main:app --reload --port 8000
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - AI Service: http://localhost:8000/docs

---

## API Documentation

### Authentication

#### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "EmployeeID": 1,
    "FirstName": "John",
    "LastName": "Doe",
    "Email": "user@example.com",
    "Role": "Manager"
  }
}
```

#### POST `/api/auth/register`
Create new employee account.

### Projects

#### GET `/api/projects`
Get all projects (paginated)

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `take`: Number of records to take (default: 10)

#### POST `/api/projects`
Create new project

**Request:**
```json
{
  "ProjectName": "Website Redesign",
  "ClientName": "Acme Corp",
  "Description": "Complete redesign of company website",
  "StartDate": "2026-05-01",
  "EndDate": "2026-08-01",
  "Status": "In Progress"
}
```

#### GET `/api/projects/:id`
Get project details by ID

#### PUT `/api/projects/:id`
Update project

#### DELETE `/api/projects/:id`
Delete project

### Tasks

#### GET `/api/tasks?projectId=1`
Get tasks for a project

#### POST `/api/tasks`
Create task

**Request:**
```json
{
  "ProjectID": 1,
  "TaskName": "Design homepage",
  "Description": "Create wireframes and mockups",
  "DueDate": "2026-06-01",
  "Status": "In Progress",
  "Priority": "High"
}
```

#### PUT `/api/tasks/:id`
Update task status, priority, etc.

#### DELETE `/api/tasks/:id`
Delete task

### Documents

#### GET `/api/documents?projectId=1`
Get documents for a project

#### POST `/api/documents`
Upload document

**Request:** (multipart form data)
- `file`: File to upload
- `ProjectID`: Project ID
- `DocumentTitle`: Title
- `CategoryID` (optional): Category

#### DELETE `/api/documents/:id`
Delete document

### Employees

#### GET `/api/employees`
Get all employees

#### POST `/api/employees`
Create employee (Admin only)

#### PUT `/api/employees/:id`
Update employee

#### DELETE `/api/employees/:id`
Delete employee

### Categories

#### GET `/api/categories`
Get all document categories

#### POST `/api/categories`
Create category

#### PUT `/api/categories/:id`
Update category

#### DELETE `/api/categories/:id`
Delete category

### AI Service Endpoints

#### POST `/api/ai/classify-document`
Classify a document

**Request:**
```json
{
  "title": "Q3 Financial Report"
}
```

**Response:**
```json
{
  "category": "Financial",
  "confidence": 0.92
}
```

#### POST `/api/ai/search`
Semantic search across documents and tasks

**Request:**
```json
{
  "query": "budget planning",
  "limit": 5,
  "items": [
    { "id": 1, "kind": "document", "title": "Q3 Budget" },
    { "id": 2, "kind": "task", "title": "Finalize budget" }
  ]
}
```

#### POST `/api/ai/predict-delay`
Predict project delay

**Request:**
```json
{
  "projectId": 1
}
```

**Response:**
```json
{
  "risk_score": 0.72,
  "delay_probability": 0.68,
  "estimated_days": 12
}
```

#### POST `/api/ai/analyze-health`
Analyze project health

**Request:**
```json
{
  "projectId": 1
}
```

**Response:**
```json
{
  "health_score": 78,
  "risks": ["Schedule slipping", "Resource constraint"],
  "recommendations": ["Increase team size", "Adjust timeline"]
}
```

---

## Database Schema

### Core Tables

#### Employee
```
EmployeeID (PK)      Integer, Auto-increment
FirstName            VarChar(50)
LastName             VarChar(50)
Email                VarChar(100), Unique
Password             VarChar(255)
Role                 VarChar(50) → Admin, Manager, Staff
```

#### Project
```
ProjectID (PK)       Integer, Auto-increment
ProjectName          VarChar(100)
ClientName           VarChar(100)
Description          Text
StartDate            DateTime
EndDate              DateTime
Status               VarChar(50) → Planning, In Progress, On Hold, Completed
```

#### Task
```
TaskID (PK)          Integer, Auto-increment
ProjectID (FK)       Integer
TaskName             VarChar(100)
Description          Text
DueDate              DateTime
Status               VarChar(50) → To Do, In Progress, Review, Completed
Priority             VarChar(20) → Low, Medium, High, Critical
```

#### Document
```
DocumentID (PK)      Integer, Auto-increment
ProjectID (FK)       Integer
CategoryID (FK)      Integer (nullable)
FileLocationID (FK)  Integer (nullable)
DocumentTitle        VarChar(150)
FileName             VarChar(150)
VersionNumber        VarChar(20)
CreatedDate          DateTime
UpdatedDate          DateTime
CreatedBy            VarChar(100)
```

#### Category
```
CategoryID (PK)      Integer, Auto-increment
CategoryName         VarChar(100), Unique
Description          Text
```

#### ProjectAlert
```
AlertID (PK)         Integer, Auto-increment
ProjectID (FK)       Integer
AlertType            VarChar(80)
Severity             VarChar(20) → Low, Medium, High, Critical
Message              Text
TaskID (FK)          Integer (nullable)
CreatedAt            DateTime (default: now)
```

#### ProjectAssignment
```
AssignmentID (PK)    Integer, Auto-increment
EmployeeID (FK)      Integer
ProjectID (FK)       Integer
RoleInProject        VarChar(100) → Lead, Developer, QA, etc.
```

---

## AI Service Documentation

### Overview

The AI service runs as a separate microservice, handling all machine learning and NLP operations. It communicates with the backend via REST API.

### Models

#### 1. Document Classifier

**Purpose**: Automatically categorize documents

**Algorithm**: Sentence-Transformers embeddings + KNN classification

**Input**: Document title/content

**Output**: 
- `category`: Predicted category name
- `confidence`: 0-1 confidence score

**Usage**:
```python
from models.classifier import classify_document
result = classify_document("Annual Budget Report")
# → {"category": "Financial", "confidence": 0.94}
```

#### 2. Semantic Search

**Purpose**: Find relevant documents and tasks using semantic similarity

**Algorithm**: FAISS vector similarity search

**Input**:
- Query string
- List of documents/tasks to search

**Output**: Ranked results with similarity scores

**Usage**:
```python
from models.search import semantic_search
results = semantic_search("project timeline", items)
# → [{"title": "...", "score": 0.89}, ...]
```

#### 3. Delay Predictor

**Purpose**: Predict project delays and risk scores

**Algorithm**: Scikit-learn regression/classification model

**Input**: 
- Project historical data
- Current task progress
- Resource allocation

**Output**:
- `risk_score`: 0-1 delay probability
- `delay_probability`: Percentage chance of delay
- `estimated_days`: Predicted delay in days

**Usage**:
```python
from models.delay_predictor import predict_delay
result = predict_delay(project_data)
# → {"risk_score": 0.72, "delay_probability": 0.68, "estimated_days": 12}
```

#### 4. Health Pipeline

**Purpose**: Comprehensive project health analysis

**Algorithm**: Multi-factor scoring model

**Input**: Project metrics, task data, team info

**Output**:
- `health_score`: 0-100
- `risks`: List of identified risks
- `recommendations`: Suggested actions

**Usage**:
```python
from models.health_pipeline import analyze_project_health
result = analyze_project_health(project_id, project_data)
```

#### 5. Task Auto-Prioritizer

**Purpose**: Suggest task priorities based on project context

**Algorithm**: Decision tree/regression model

**Input**: Task data, project context, dependencies

**Output**: Priority score, recommended priority level

**Usage**:
```python
from models.auto_prioritizer import auto_prioritize_tasks
results = auto_prioritize_tasks(tasks, project_context)
```

### Running AI Service

**Development:**
```bash
cd ai-service
python -m uvicorn main:app --reload --port 8000
```

**Production:**
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Testing:**
```bash
cd ai-service
pytest tests/
```

### API Documentation

Access Swagger UI: http://localhost:8000/docs

---

## Development Guide

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   - Backend: `pnpm test` and `pnpm test:watch`
   - Frontend: `pnpm test` and `pnpm test:watch`
   - AI: `pytest tests/`

3. **Lint code**
   ```bash
   cd frontend && pnpm lint
   cd backend && pnpm build
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feature/your-feature-name
   ```

5. **Create pull request**

### Running Tests

**Backend:**
```bash
cd backend
pnpm test              # Run once
pnpm test:watch       # Watch mode
```

**Frontend:**
```bash
cd frontend
pnpm test              # Run once
pnpm test:watch       # Watch mode
```

**AI Service:**
```bash
cd ai-service
pytest tests/          # Run all tests
pytest tests/ -v      # Verbose output
pytest tests/ --cov   # With coverage
```

### Adding New Database Schema

1. **Update schema.prisma**
   ```
   model NewModel {
     id Int @id @default(autoincrement())
     ...
   }
   ```

2. **Create migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_new_model
   ```

3. **Regenerate Prisma client**
   ```bash
   npx prisma generate
   ```

### Adding New API Endpoint

1. **Create route file** in `src/routes/`
2. **Define handlers** with proper typing
3. **Use middleware** for auth/authorization
4. **Register in** `src/index.ts`
5. **Test with Postman/Insomnia**

### Adding New Frontend Page

1. **Create component** in `src/pages/`
2. **Use layout wrapper** from Layout component
3. **Add route** in App.tsx
4. **Add navigation** in Sidebar
5. **Use API client** for backend calls
6. **Add error handling** with React Query

---

## Deployment

### Prerequisites for Deployment

- Azure account (or alternative hosting)
- SQL Server instance (Azure SQL or on-premises)
- Docker (optional, for containerization)

### Backend Deployment (Azure App Service)

1. **Build application**
   ```bash
   cd backend
   npm run build
   ```

2. **Configure Azure**
   ```bash
   az login
   az app service plan create --name pm-plan --resource-group mygroup --sku B1
   az webapp create --resource-group mygroup --plan pm-plan --name pm-backend
   ```

3. **Set environment variables**
   ```bash
   az webapp config appsettings set \
     --resource-group mygroup \
     --name pm-backend \
     --settings \
     DATABASE_URL="..." \
     JWT_SECRET="..." \
     AI_SERVICE_URL="..."
   ```

4. **Deploy**
   ```bash
   az webapp deployment source config-zip \
     --resource-group mygroup \
     --name pm-backend \
     --src-path backend.zip
   ```

### Frontend Deployment (Azure Static Web Apps)

1. **Build frontend**
   ```bash
   cd frontend
   pnpm build
   ```

2. **Create Static Web App**
   ```bash
   az staticwebapp create \
     --name pm-frontend \
     --resource-group mygroup \
     --source ./dist
   ```

### AI Service Deployment

1. **Build Docker image**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Deploy to Azure Container Instances**
   ```bash
   az acr build --registry myregistry --image pm-ai:latest .
   az container create \
     --resource-group mygroup \
     --name pm-ai \
     --image myregistry.azurecr.io/pm-ai:latest \
     --environment-variables PORT=8000
   ```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
**Problem**: Backend cannot connect to database

**Solutions**:
- Verify DATABASE_URL in `.env`
- Check firewall rules allow connection
- Run `az login` for Azure AD authentication
- Verify SQL Server is running

#### AI Service Not Responding
**Problem**: Backend gets 500 from AI service

**Solutions**:
- Check AI service is running: `curl http://localhost:8000/docs`
- Verify `AI_SERVICE_URL` in backend `.env`
- Check logs: `python -m uvicorn main:app --log-level debug`
- Ensure Python dependencies installed: `pip install -r requirements.txt`

#### Frontend Can't Connect to Backend
**Problem**: API calls fail or CORS errors

**Solutions**:
- Verify backend running on correct port
- Check `VITE_API_URL` matches backend address
- Verify CORS configuration in `src/index.ts`
- Check browser DevTools Network tab for actual errors

#### Port Already in Use
**Problem**: Cannot start service on port X

**Solutions**:
```bash
# Find process using port
lsof -i :5000          # Mac/Linux
netstat -ano | grep :5000  # Windows

# Kill process
kill -9 <PID>          # Mac/Linux
taskkill /PID <PID> /F # Windows
```

#### Authentication Token Expired
**Problem**: User logged out unexpectedly

**Solutions**:
- Token expires based on JWT_SECRET
- Frontend should refresh token periodically
- Implement refresh token mechanism if needed

---

## Support & Contributions

For issues, questions, or contributions:
1. Check existing issues
2. Create detailed issue with reproduction steps
3. Fork and create feature branches
4. Submit pull request with tests

---

**Last Updated**: May 1, 2026
**Version**: 1.0.0
