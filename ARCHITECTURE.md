# Architecture Documentation

**Corporate Project Management System**

> **Public demo mode:** the Security Architecture section below describes the full JWT/RBAC design. In the public demo build, `backend/src/middleware/auth.ts` treats any request without a valid token as an authenticated demo Admin, so the app is directly browsable without logging in — see [README.md](README.md#documentation).

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Microservices Design](#microservices-design)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [AI Service Architecture](#ai-service-architecture)
7. [Database Design](#database-design)
8. [Security Architecture](#security-architecture)
9. [Scalability Considerations](#scalability-considerations)

---

## System Architecture Overview

### High-Level Architecture

```
                          ┌─────────────────────────┐
                          │   Internet / Client     │
                          └────────────┬────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────┐
                    │   Frontend Application (React)   │
                    │   http://localhost:5173          │
                    │                                  │
                    │  • Authentication UI             │
                    │  • Dashboard & Analytics         │
                    │  • Project Management            │
                    │  • Task Management               │
                    │  • Document Browser              │
                    │  • Alerts & Notifications        │
                    └────────────┬─────────────────────┘
                                 │
                     ┌───────────HTTPS/JSON────────┐
                     │                             │
                     ▼                             ▼
        ┌──────────────────────┐       ┌──────────────────────┐
        │  Backend API Layer   │       │   Static Assets      │
        │  (Express + Node.js) │       │   (CSS, Images)      │
        │  http://localhost    │       └──────────────────────┘
        │  :5000               │
        │                      │
        │  Route Handlers:     │
        │  • Auth & Tokens     │
        │  • CRUD Operations   │
        │  • Business Logic    │
        │  • File Management   │
        │  • AI Integration    │
        └─────────┬────┬───────┘
                  │    │
        ┌─────────┘    └───────────┐
        │                          │
        ▼                          ▼
  ┌──────────────┐         ┌────────────────┐
  │  SQL Server  │         │  AI Service    │
  │  Database    │         │  (FastAPI)     │
  │              │         │  :8000         │
  │  • Projects  │         │                │
  │  • Tasks     │         │  ML Models:    │
  │  • Documents │         │  • Classifier  │
  │  • Employees │         │  • Search      │
  │  • Alerts    │         │  • Predictor   │
  │              │         │  • Health      │
  │              │         │  • Prioritizer │
  └──────────────┘         └────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Technology |
|-----------|-----------------|-----------|
| **Frontend** | User interface, state management, API calls | React, TypeScript, Vite |
| **Backend** | Business logic, data validation, auth, DB queries | Express, TypeScript, Prisma |
| **Database** | Data persistence, integrity, transactions | SQL Server |
| **AI Service** | ML predictions, embeddings, recommendations | FastAPI, Python |

---

## Microservices Design

### Service Isolation

The system is designed with clear separation of concerns:

```
┌─────────────────────────────────────┐
│  Frontend Service (Port 5173)       │
│  - Single Page Application          │
│  - No backend logic                 │
│  - Pure UI/UX                       │
└────────────────┬────────────────────┘
                 │
         (JSON over HTTPS)
                 │
┌────────────────▼────────────────────┐
│  Backend Service (Port 5000)        │
│  - API Gateway                      │
│  - Authentication                   │
│  - Business Logic                   │
│  - Database ORM (Prisma)            │
│  - File Upload Handling             │
│  - Cron Jobs (Alerts)               │
└────────────┬──────────────┬─────────┘
             │              │
      (SQL Queries)    (HTTP REST)
             │              │
       ┌─────▼──┐      ┌────▼──────────┐
       │Database│      │ AI Service    │
       │(MSSQL) │      │ (Port 8000)   │
       └────────┘      │ - Predictions │
                       │ - Embeddings  │
                       │ - Rankings    │
                       └───────────────┘
```

### API Contract

**Frontend → Backend**: RESTful JSON API
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
```

**Backend → AI Service**: RESTful JSON API
```
POST /classify-document
POST /search
POST /predict-delay
POST /analyze-health
POST /prioritize-tasks
```

---

## Data Flow Diagrams

### Authentication Flow

```
1. User enters credentials
   │
   └──> POST /api/auth/login
        {email, password}
        │
        └──> Backend validates
             │
             ├─ Query DB for user
             ├─ bcrypt.compare(password)
             └─ If valid, generate JWT
                │
                └──> Return {token, user}
                     │
                     └──> Frontend stores token
                          in localStorage
                          │
                          └──> Add to Authorization
                               header on future requests
```

### Project Creation Flow

```
User clicks "Create Project"
│
└──> Frontend POST /api/projects
     {projectName, clientName, ...}
     │
     └──> Backend middleware
          ├─ Verify JWT token
          └─ Check role permission
             │
             └──> Route handler
                  ├─ Validate input
                  └─ Create record
                     │
                     └──> Prisma ORM
                          │
                          └──> INSERT to Database
                             │
                             └──> Return created project
                                  │
                                  └──> Frontend updates UI
```

### AI Prediction Flow

```
Backend requests delay prediction
│
└──> HTTP POST to AI Service
     /predict-delay
     {projectId, projectData}
     │
     └──> AI Service receives request
          │
          └──> Load ML Model
               │
               └──> Extract features
                    │
                    └──> Model.predict()
                         │
                         └──> Return predictions
                              {risk_score, delay_days}
                              │
                              └──> Backend processes
                                   │
                                   └──> Store in alerts
                                        │
                                        └──> Frontend displays
```

### Document Classification Flow

```
User uploads document "Q3_Budget.pdf"
│
└──> Frontend multipart POST
     /api/documents
     │
     └──> Backend receives file
          │
          ├─ Save to file system
          ├─ Extract filename/title
          └─ Call AI Service
             │
             POST /classify-document
             {title: "Q3_Budget"}
             │
             └──> AI Service
                  │
                  ├─ Encode title to embeddings
                  ├─ Compare with known categories
                  └─ Return category + confidence
                     │
                     └──> Backend stores classification
                          │
                          └──> Update document CategoryID
                              │
                              └──> Frontend shows category
```

---

## Backend Architecture

### Request Processing Pipeline

```
HTTP Request
    │
    ▼
Express Middleware Stack
    │
    ├─ 1. CORS Handler
    │
    ├─ 2. Body Parser (JSON)
    │
    ├─ 3. Authentication Middleware
    │   └─ Verify JWT token
    │   └─ Extract user info
    │   └─ Pass to request context
    │
    ├─ 4. Authorization Middleware (route-specific)
    │   └─ Check user role
    │   └─ Check resource permissions
    │
    └─ 5. Route Handler
        │
        ├─ Input Validation
        │
        ├─ Business Logic
        │   └─ Call Prisma ORM
        │   └─ External API calls
        │   └─ File operations
        │
        ├─ Error Handling
        │
        └─ Response Formatting
            │
            ▼
        HTTP Response (JSON)
```

### Middleware Architecture

```
src/middleware/
│
├─ auth.ts
│  └─ Verifies JWT token
│  └─ Extracts user payload
│  └─ Adds to request.user
│
└─ authorize.ts
   └─ Checks user.role
   └─ Compares against required role
   └─ Throws 403 if unauthorized
```

### Error Handling Strategy

```
Try-Catch Blocks
    │
    ├─ Validation Errors (400)
    ├─ Authentication Errors (401)
    ├─ Authorization Errors (403)
    ├─ Not Found Errors (404)
    ├─ Database Errors (500)
    └─ Unknown Errors (500)
        │
        ├─ Log to console/file
        ├─ Don't expose internals
        └─ Return user-friendly message
```

### Job Scheduling

The backend uses `node-cron` for scheduled tasks:

```javascript
// Runs daily at 00:00 UTC (unless disabled)
cron.schedule(process.env.PREDICTIVE_ALERTS_CRON || '0 0 * * *', () => {
  runPredictiveAlertsJob()
    .catch(err => console.error('[predictive-alerts]', err))
})
```

**Job Logic**:
1. Query all active projects
2. For each project, call AI Service predict-delay
3. If risk > threshold, create alert
4. Save alerts to database

---

## Frontend Architecture

### Component Structure

```
App.tsx (Root)
│
├─ Layout
│  │
│  ├─ Topbar (Header)
│  │
│  ├─ Sidebar (Navigation)
│  │
│  └─ Page Content
│     │
│     ├─ Dashboard.tsx
│     ├─ Projects.tsx
│     ├─ Tasks.tsx
│     ├─ Documents.tsx
│     ├─ Employees.tsx
│     ├─ Categories.tsx
│     ├─ Alerts.tsx
│     ├─ Login.tsx
│     └─ Register.tsx
│
├─ Context Providers
│  ├─ AuthContext (User state)
│  └─ SidebarContext (UI state)
│
└─ Layouts
   └─ Layout.tsx (Wrapper)
```

### State Management

```
AuthContext
├─ user: User | null
├─ token: string | null
├─ isAuthenticated: boolean
├─ login(email, password)
├─ logout()
└─ setUser(user)

SidebarContext
├─ isOpen: boolean
└─ toggleSidebar()
```

### Data Fetching Pattern

Using React Query:

```typescript
// Example: Fetch projects
const { data, isLoading, error } = useQuery({
  queryKey: ['projects'],
  queryFn: () => api.get('/projects'),
  staleTime: 5 * 60 * 1000 // 5 minutes
})

// Example: Create project
const mutation = useMutation({
  mutationFn: (data) => api.post('/projects', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['projects'])
  }
})
```

### API Client Architecture

```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

---

## AI Service Architecture

### Model Pipeline

```
User Input (text/data)
    │
    ▼
Input Preprocessing
    │
    ├─ Tokenization
    ├─ Normalization
    └─ Feature Extraction
        │
        ▼
    Model Selection
    (Classifier / Search / Predictor / etc.)
        │
        ▼
    Inference
        │
        ├─ Load trained model
        ├─ Generate predictions
        └─ Confidence scoring
            │
            ▼
    Output Formatting
        │
        └─ JSON Response
```

### Model Details

#### Document Classifier
- **Input**: Document title or content
- **Embeddings**: Sentence-Transformers (384-dim vectors)
- **Algorithm**: KNN similarity matching
- **Output**: Category + confidence score

#### Semantic Search
- **Input**: Query string + list of items
- **Index**: FAISS vector database
- **Algorithm**: Cosine similarity
- **Output**: Ranked results with scores

#### Delay Predictor
- **Input**: Project metrics, task progress
- **Features**: Task completion %, schedule variance, resource utilization
- **Algorithm**: Scikit-learn regression model
- **Output**: Risk score, delay probability, estimated days

#### Project Health Analysis
- **Input**: Project data across multiple dimensions
- **Factors**: Schedule adherence, resource allocation, communication frequency
- **Algorithm**: Weighted scoring model
- **Output**: Health score (0-100), identified risks, recommendations

#### Task Auto-Prioritizer
- **Input**: Task list, project context, deadlines
- **Factors**: Deadline urgency, dependencies, project status
- **Algorithm**: Decision tree/scoring model
- **Output**: Priority recommendations

---

## Database Design

### Entity-Relationship Diagram

```
Employee (1) ─────── (N) ProjectAssignment ─── (1) Project
   │                                               │
   └─────────────────────────────────────────────┘
                    (1) (N)
                    
Project (1) ─────── (N) Task

Project (1) ─────── (N) Document
                       │
                       ├─ (1) Category
                       │
                       └─ (1) FileLocation

Project (1) ─────── (N) ProjectAlert
```

### Normalization

The schema follows **Third Normal Form (3NF)**:

1. **1NF**: No repeating groups
   - Each attribute contains atomic values
   - Each record is unique

2. **2NF**: All non-key attributes depend on entire primary key
   - Eliminates partial dependencies
   - Created separate tables for multi-key entities

3. **3NF**: All non-key attributes depend only on primary key
   - Eliminated transitive dependencies
   - Category is separate table (not embedded in Document)

### Indexes

**Recommended indexes** for performance:

```sql
-- User lookups
CREATE INDEX idx_employee_email ON Employee(Email)

-- Project lookups
CREATE INDEX idx_project_status ON Project(Status)
CREATE INDEX idx_project_dates ON Project(StartDate, EndDate)

-- Task lookups
CREATE INDEX idx_task_project ON Task(ProjectID)
CREATE INDEX idx_task_status ON Task(Status)

-- Document lookups
CREATE INDEX idx_document_project ON Document(ProjectID)
CREATE INDEX idx_document_category ON Document(CategoryID)

-- Alert lookups
CREATE INDEX idx_alert_project ON ProjectAlert(ProjectID)
CREATE INDEX idx_alert_created ON ProjectAlert(CreatedAt)

-- Assignment lookups
CREATE INDEX idx_assignment_employee ON ProjectAssignment(EmployeeID)
CREATE INDEX idx_assignment_project ON ProjectAssignment(ProjectID)
```

---

## Security Architecture

### Authentication & Authorization

#### JWT Token Structure
```
Header: {alg: "HS256", typ: "JWT"}
Payload: {
  EmployeeID: 1,
  Email: "user@example.com",
  Role: "Manager",
  iat: 1234567890,
  exp: 1234571490  // 1 hour
}
Signature: HMAC-SHA256(header.payload, JWT_SECRET)
```

#### Role-Based Access Control (RBAC)

```
Admin
├─ All CRUD operations
├─ User management
└─ System configuration

Manager
├─ Project CRUD
├─ Task management
├─ Document management
├─ Employee view/assign
└─ Alert management

Staff
├─ View assigned projects
├─ Update task status
├─ View documents
└─ View profile
```

#### Resource-Level Authorization

```
// Middleware example
const authorizeProjectAccess = async (req, res, next) => {
  const projectId = req.params.projectId
  
  // Check if user is assigned to this project
  const assignment = await prisma.projectAssignment.findFirst({
    where: {
      EmployeeID: req.user.id,
      ProjectID: projectId
    }
  })
  
  if (!assignment && req.user.role !== 'Admin') {
    return res.status(403).json({error: 'Access denied'})
  }
  
  next()
}
```

### Password Security

```
┌─ User enters password
│
├─ Client: Send over HTTPS
│
├─ Backend: Receive POST request
│
├─ Hash with bcryptjs
│  └─ Salt rounds: 10
│  └─ Hash time: ~100ms
│
├─ Compare with stored hash
│  └─ bcrypt.compare(password, hash)
│
└─ On success: Generate JWT token
```

### Network Security

- **HTTPS/TLS**: All communication encrypted
- **CORS**: Restricted to known origins
- **CSRF Protection**: SameSite cookies (if applicable)
- **XSS Prevention**: React's built-in escaping
- **SQL Injection**: Prevented by Prisma ORM parameterization

---

## Scalability Considerations

### Current Limitations

```
Single-instance deployment
├─ Database: Single connection pool
├─ Backend: Single process (Node.js single-threaded)
├─ Frontend: Served as static files
└─ AI Service: Single Python process
```

### Horizontal Scaling Strategy

```
Load Balancer (Azure Application Gateway)
│
├─ Backend Instance 1 (Port 5000)
├─ Backend Instance 2 (Port 5000)
├─ Backend Instance 3 (Port 5000)
│
└─ Shared Resources:
   ├─ SQL Server (read replicas for scaling)
   ├─ Redis Cache (session/query caching)
   └─ AI Service (Kubernetes cluster)
```

### Caching Strategy

```
Frontend Caching
├─ React Query: 5-minute stale time
├─ Browser: HTTP cache headers
└─ LocalStorage: User token, preferences

Backend Caching
├─ Redis: Frequently accessed queries
├─ Memory: Small, short-lived cache
└─ DB Connection Pool: 10-20 connections
```

### Database Optimization

```
Query Optimization
├─ Add indexes on foreign keys
├─ Pagination for large datasets
├─ SELECT only needed columns
└─ Eager loading with Prisma relations

Connection Pooling
├─ Max connections: 20
├─ Idle timeout: 10 minutes
└─ Reconnect on error
```

### AI Service Scaling

```
Option 1: Kubernetes
├─ Multiple pods with FastAPI
├─ Auto-scaling based on CPU/memory
└─ Load balancer distributes requests

Option 2: Serverless (Azure Functions)
├─ Triggered on demand
├─ No idle cost
└─ Cold start latency (3-5 seconds)

Option 3: Batch Processing
├─ Queue predictions
├─ Process off-peak hours
└─ Cache results
```

---

## Deployment Architecture

### Development Environment
```
localhost:5173  ← Frontend (Vite dev server)
localhost:5000  ← Backend (Node.js + nodemon)
localhost:8000  ← AI Service (Uvicorn + auto-reload)
localhost       ← SQL Server (local or container)
```

### Production Environment (Azure)
```
Azure Static Web Apps       ← Frontend (CDN)
Azure App Service           ← Backend (always-on)
Azure Container Instances   ← AI Service
Azure SQL Database          ← Database (managed)
Azure Blob Storage          ← Document storage
```

---

**Architecture Version**: 1.0
**Last Updated**: May 1, 2026
