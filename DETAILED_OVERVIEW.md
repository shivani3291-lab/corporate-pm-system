# Corporate Project Management System - Detailed Overview

**An AI-Enhanced Enterprise Project Management Platform**

---

## Quick Links

- 📋 **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** - Complete project documentation
- 🏗️ **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design patterns
- 📡 **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- ⚙️ **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Installation and configuration
- 👨‍💻 **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Development workflow and standards
- 📄 **[README.md](README.md)** - Quick start guide

---

## Executive Summary

### What Problem Does This Solve?

Organizations struggle with:
- **Information Silos**: Project, task, and document data scattered across tools
- **Reactive Management**: Discovering issues after they become critical
- **Manual Processes**: Time-consuming document management and categorization
- **Lack of Insights**: Limited visibility into project health and team utilization
- **Poor Collaboration**: Difficulty tracking task dependencies and team assignments

### Our Solution

A unified platform combining:
- **Centralized Management**: Single source of truth for all project data
- **Predictive Analytics**: AI-powered delay and risk prediction
- **Intelligent Automation**: Auto-classification and smart recommendations
- **Real-time Visibility**: Comprehensive dashboards and alerts
- **Collaborative Workflow**: Team assignments, task tracking, document sharing

---

## System Components

### 1. Frontend Application (React 19)

**Purpose**: User interface for all platform operations

**Key Features**:
- Responsive design (works on desktop, tablet, mobile)
- Real-time data updates via React Query
- Secure authentication with JWT
- Role-based UI rendering
- Interactive dashboards with Recharts

**Tech Stack**:
- React 19, TypeScript, Vite 8
- Tailwind CSS v4 for styling
- React Router v7 for navigation
- React Query for state management
- Axios for HTTP requests

**Directory Structure**:
```
frontend/src/
├── pages/          # Page components (Dashboard, Projects, etc.)
├── components/     # Reusable UI components
├── context/        # React context for global state
├── hooks/          # Custom React hooks
├── services/       # API client
└── styles/         # Global stylesheets
```

**Running**: `pnpm dev` → http://localhost:5173

---

### 2. Backend API (Express.js)

**Purpose**: Business logic, authentication, data persistence

**Key Features**:
- RESTful JSON API with 40+ endpoints
- JWT-based authentication with role-based access control
- Prisma ORM for type-safe database queries
- Scheduled tasks (cron jobs) for predictive alerts
- File upload handling for documents
- Integration with AI service for predictions

**Tech Stack**:
- Express 5, Node.js, TypeScript
- Prisma 6 (ORM)
- JWT + bcryptjs for security
- node-cron for task scheduling
- Multer for file uploads

**Architecture**:
```
backend/src/
├── routes/         # API endpoints (auth, projects, tasks, etc.)
├── middleware/     # Auth, authorization, CORS
├── lib/            # Utilities (Prisma client, AI service URL, etc.)
├── jobs/           # Scheduled jobs (predictive alerts)
└── index.ts        # Express app setup
```

**Running**: `pnpm dev` → http://localhost:5000

**Health Check**: `GET /health` → `{"status":"Backend running ✓"}`

---

### 3. AI Service (FastAPI)

**Purpose**: Machine learning and NLP operations

**Key Features**:
- Document classification (semantic understanding)
- Semantic search across tasks/documents
- Project delay prediction with risk scoring
- Project health analysis with recommendations
- Task auto-prioritization suggestions

**Tech Stack**:
- FastAPI, Python 3.11, Uvicorn
- scikit-learn for ML models
- sentence-transformers for embeddings
- FAISS for semantic search
- Pydantic for data validation

**ML Models**:
```
models/
├── classifier.py       # Document category prediction
├── search.py          # Semantic similarity search
├── delay_predictor.py # Delay/risk prediction
├── health_pipeline.py # Project health analysis
└── auto_prioritizer.py # Task prioritization
```

**Running**: `python -m uvicorn main:app --reload --port 8000` → http://localhost:8000/docs

---

### 4. Database (Microsoft SQL Server)

**Purpose**: Persistent data storage with relationships

**Schema**:
```
Employee (users with roles)
  ├─ Many ← ProjectAssignment → Many Projects
  └─ Assignments define role in project

Project (managed entities)
  ├─ Many → Task (work items)
  ├─ Many → Document (files & specs)
  ├─ Many → ProjectAlert (notifications)
  └─ Many ← ProjectAssignment ← Employee

Task (work units)
  └─ Belongs to Project

Document (files)
  ├─ Belongs to Project
  ├─ Has Category (organized classification)
  └─ Has FileLocation

Category (document classification)
  └─ Many ← Document
```

**Key Tables**:
- **Employee**: Users, roles (Admin, Manager, Staff)
- **Project**: Projects with status, dates, client info
- **Task**: Tasks with priority, status, dependencies
- **Document**: Uploaded files with metadata
- **Category**: Document categories/classifications
- **ProjectAlert**: Automated and manual alerts
- **ProjectAssignment**: Employee-to-project assignments

---

## Feature Overview

### Core Features (Always Available)

| Feature | Description | Who Uses | Backend | Frontend | DB |
|---------|-------------|----------|---------|----------|-----|
| **Authentication** | Login/register with JWT | All | ✓ | ✓ | ✓ |
| **Role-Based Access** | Admin, Manager, Staff permissions | All | ✓ | ✓ | - |
| **Projects CRUD** | Create, read, update, delete projects | Manager+ | ✓ | ✓ | ✓ |
| **Tasks CRUD** | Manage project tasks | Manager+ | ✓ | ✓ | ✓ |
| **Documents** | Upload and organize documents | Manager+ | ✓ | ✓ | ✓ |
| **Employees** | Employee management | Admin | ✓ | ✓ | ✓ |
| **Assignments** | Assign employees to projects | Manager+ | ✓ | ✓ | ✓ |
| **Alerts** | Manual and automated alerts | All | ✓ | ✓ | ✓ |
| **Dashboard** | KPI metrics and overview | All | ✓ | ✓ | - |

### AI-Powered Features (Requires AI Service)

| Feature | Algorithm | Input | Output | Use Case |
|---------|-----------|-------|--------|----------|
| **Document Classification** | Sentence-Transformers + KNN | Document title | Category + confidence | Auto-organize documents |
| **Semantic Search** | FAISS embeddings | Query + items | Ranked results | Find relevant docs/tasks |
| **Delay Prediction** | scikit-learn regression | Project metrics | Risk score, delay days | Proactive risk management |
| **Health Analysis** | Multi-factor scoring | Project data | Health score + recommendations | Project oversight |
| **Task Prioritization** | Decision tree | Task data | Priority suggestions | Smart task ordering |

---

## Data Models (Prisma Schema)

### Employee
```typescript
model Employee {
  EmployeeID    Int
  FirstName     String
  LastName      String
  Email         String (unique)
  Password      String (hashed)
  Role          String ("Admin" | "Manager" | "Staff")
  assignments   ProjectAssignment[]
}
```

### Project
```typescript
model Project {
  ProjectID     Int
  ProjectName   String
  ClientName    String
  Description   String
  StartDate     DateTime
  EndDate       DateTime
  Status        String ("Planning" | "In Progress" | "On Hold" | "Completed")
  tasks         Task[]
  documents     Document[]
  assignments   ProjectAssignment[]
  alerts        ProjectAlert[]
}
```

### Task
```typescript
model Task {
  TaskID        Int
  ProjectID     Int (foreign key)
  TaskName      String
  Description   String
  DueDate       DateTime
  Status        String ("To Do" | "In Progress" | "Review" | "Completed")
  Priority      String ("Low" | "Medium" | "High" | "Critical")
}
```

### Document
```typescript
model Document {
  DocumentID    Int
  ProjectID     Int (foreign key)
  CategoryID    Int (foreign key, optional)
  DocumentTitle String
  FileName      String
  VersionNumber String
  CreatedDate   DateTime
  UpdatedDate   DateTime
  CreatedBy     String (email)
}
```

### ProjectAlert
```typescript
model ProjectAlert {
  AlertID       Int
  ProjectID     Int (foreign key)
  AlertType     String ("Delay Warning" | "Resource Issue" | etc.)
  Severity      String ("Low" | "Medium" | "High" | "Critical")
  Message       String
  TaskID        Int (optional)
  CreatedAt     DateTime
}
```

### ProjectAssignment
```typescript
model ProjectAssignment {
  AssignmentID  Int
  EmployeeID    Int (foreign key)
  ProjectID     Int (foreign key)
  RoleInProject String ("Project Lead" | "Developer" | "QA" | etc.)
}
```

---

## API Endpoints Summary

### Authentication (Public)
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new account

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### AI Service
- `POST /api/ai/classify-document` - Classify document
- `POST /api/ai/search` - Semantic search
- `POST /api/ai/predict-delay` - Predict project delay
- `POST /api/ai/analyze-health` - Analyze project health
- `POST /api/ai/prioritize-tasks` - Get task priorities

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.

---

## User Roles & Permissions

### Admin
- Full system access
- User management
- System configuration
- All CRUD operations

### Manager
- Project management (create, update, delete)
- Task management
- Document management
- Employee assignment
- Alert management
- View reports

### Staff
- View assigned projects
- Update task status
- Access assigned documents
- View personal profile
- Read-only dashboard access

---

## Technology Stack Overview

### Frontend
```
React 19            - UI framework
TypeScript 5.9      - Type safety
Vite 8              - Build tool
Tailwind CSS v4     - Styling
React Query 5       - State/data management
React Router 7      - Navigation
Axios               - HTTP client
Recharts            - Charts & graphs
```

### Backend
```
Node.js 18+         - Runtime
Express 5           - Web framework
TypeScript 5.9      - Type safety
Prisma 6            - ORM
JWT                 - Authentication
bcryptjs            - Password hashing
node-cron           - Job scheduling
Multer              - File uploads
```

### AI Service
```
Python 3.11         - Language
FastAPI             - Web framework
Uvicorn             - ASGI server
scikit-learn        - ML algorithms
sentence-transformers - NLP embeddings
FAISS               - Vector search
numpy               - Numerical computing
Pydantic            - Data validation
```

### Database
```
SQL Server 2019+    - Data storage
Prisma              - ORM layer
Migrations          - Schema versioning
```

---

## Performance Metrics

### Expected Performance (Local Development)

| Operation | Expected Time | Notes |
|-----------|--------------|-------|
| Login | <500ms | JWT validation |
| Fetch projects list | <1s | 50 items, includes relations |
| Create project | <800ms | With validation |
| Document upload | <2s | Depends on file size, classification |
| AI classification | <1s | For typical document titles |
| Semantic search | <800ms | Across 1000+ items |
| Delay prediction | <500ms | Per project |

---

## Deployment Architecture

### Development
```
Frontend (5173) → Backend (5000) → Database (local)
                                 ↓
                            AI Service (8000)
```

### Production (Azure)
```
CDN / Static Web App (Frontend)
                ↓
        Application Gateway
                ↓
        App Service (Backend)
                ↓
        SQL Database
        
Separate: Container Registry → Container Instances (AI Service)
```

---

## Security Considerations

### Authentication
- JWT tokens with expiration
- bcryptjs for password hashing (salt rounds: 10)
- Secure token storage (localStorage on frontend)

### Authorization
- Role-based access control (RBAC)
- Resource-level authorization
- Route protection with middleware

### Data Protection
- HTTPS/TLS in production
- SQL injection prevention (Prisma ORM parameterization)
- XSS prevention (React built-in escaping)
- CORS configuration

### Sensitive Data
- Never expose database credentials
- Use environment variables for secrets
- Implement rate limiting in production
- Log security events

---

## Troubleshooting Quick Reference

| Issue | Symptom | Solution |
|-------|---------|----------|
| DB Connection | 503 Service Unavailable | Check DATABASE_URL, verify SQL Server running |
| Auth Failed | 401 Unauthorized | Verify JWT_SECRET matches, check token expiry |
| AI Service Timeout | 500 Server Error | Check AI service running on 8000, verify URL |
| CORS Error | Cross-Origin blocked | Add frontend URL to CORS config in backend |
| Port in Use | EADDRINUSE | Kill existing process on port 5000/5173/8000 |
| Out of Memory | Crash | Increase Node/Python memory limits |

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting.

---

## Development Workflow

### Quick Start (5 minutes)
1. Clone repo: `git clone <url>`
2. Install: `pnpm install` (all dirs)
3. Configure `.env` files
4. Setup DB: `npx prisma migrate deploy`
5. Start services: 3 terminals with `pnpm dev` (backend), `pnpm dev` (frontend), `python -m uvicorn...` (AI)

### Feature Development
1. Create branch: `git checkout -b feature/your-feature`
2. Make changes with tests
3. Commit: `git commit -m "feat(scope): description"`
4. Push & create PR
5. Address review feedback
6. Merge to main

See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for detailed workflow.

---

## File Structure

```
corporate-pm-system/
├── README.md                       # Quick start
├── PROJECT_DOCUMENTATION.md        # Main docs ← START HERE
├── ARCHITECTURE.md                 # Technical architecture
├── API_DOCUMENTATION.md            # API reference
├── SETUP_GUIDE.md                  # Installation guide
├── DEVELOPMENT_GUIDE.md            # Dev workflow
├── DETAILED_OVERVIEW.md            # This file
│
├── backend/                        # Express.js API
│   ├── src/
│   ├── prisma/                     # Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # React app
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
└── ai-service/                     # FastAPI service
    ├── main.py
    ├── models/
    ├── requirements.txt
    └── tests/
```

---

## Getting Help

1. **Check Documentation**: Read the relevant doc file
2. **Search Issues**: Check GitHub issues for similar problems
3. **Review Logs**: Check console output for error messages
4. **Ask Community**: Post in discussions or Slack
5. **Create Issue**: Provide detailed error report with reproduction steps

---

## Contributing

We welcome contributions! Please:
1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Address review feedback

See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for contributing guidelines.

---

## License & Support

**Last Updated**: May 1, 2026
**Version**: 1.0.0
**Status**: Active Development

For questions or issues, please create a GitHub issue or contact the development team.

---

## Next Steps

1. **Read** [SETUP_GUIDE.md](SETUP_GUIDE.md) to install locally
2. **Follow** [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) to start developing
3. **Reference** [API_DOCUMENTATION.md](API_DOCUMENTATION.md) when building features
4. **Review** [ARCHITECTURE.md](ARCHITECTURE.md) to understand system design
5. **Check** [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for comprehensive details

Happy coding! 🚀
