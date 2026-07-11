# API Documentation

**Corporate Project Management System - Complete API Reference**

> **Public demo mode:** requests without a valid Bearer token are treated as a demo Admin user rather than rejected — see [README.md](README.md#documentation) for details. The endpoints below reflect the full JWT/RBAC design.

---

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Employee Endpoints](#employee-endpoints)
4. [Project Endpoints](#project-endpoints)
5. [Task Endpoints](#task-endpoints)
6. [Document Endpoints](#document-endpoints)
7. [Category Endpoints](#category-endpoints)
8. [Alert Endpoints](#alert-endpoints)
9. [Assignment Endpoints](#assignment-endpoints)
10. [AI Service Endpoints](#ai-service-endpoints)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

## Base Configuration

### Base URLs

```
Development:
- Frontend:    http://localhost:5173
- Backend API: http://localhost:5000/api
- AI Service:  http://localhost:8000

Production (Azure):
- Backend API: https://echelon-backend-bjaredf7f0c5gge3.eastus-01.azurewebsites.net/api
```

### Request Headers

All requests (except login/register) require:

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Response Format

All responses follow this format:

**Success (2xx)**:
```json
{
  "data": {...},
  "message": "Operation successful"
}
```

**Error (4xx/5xx)**:
```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2026-05-01T10:30:00Z"
}
```

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200)**:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "EmployeeID": 1,
      "FirstName": "John",
      "LastName": "Doe",
      "Email": "john.doe@example.com",
      "Role": "Manager"
    }
  },
  "message": "Login successful"
}
```

**Error (401)**:
```json
{
  "error": "Invalid email or password",
  "statusCode": 401
}
```

---

### POST /api/auth/register

Register new employee account.

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201)**:
```json
{
  "data": {
    "EmployeeID": 2,
    "FirstName": "Jane",
    "LastName": "Smith",
    "Email": "jane.smith@example.com",
    "Role": "Staff"
  },
  "message": "Registration successful"
}
```

**Error (400)**:
```json
{
  "error": "Email already registered",
  "statusCode": 400
}
```

---

## Employee Endpoints

### GET /api/employees

Get all employees (paginated).

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `take`: Number of records to retrieve (default: 10)
- `role`: Filter by role (Admin, Manager, Staff)
- `search`: Search by first/last name or email

**Response (200)**:
```json
{
  "data": [
    {
      "EmployeeID": 1,
      "FirstName": "John",
      "LastName": "Doe",
      "Email": "john.doe@example.com",
      "Role": "Manager"
    },
    {
      "EmployeeID": 2,
      "FirstName": "Jane",
      "LastName": "Smith",
      "Email": "jane.smith@example.com",
      "Role": "Staff"
    }
  ],
  "pagination": {
    "total": 2,
    "skip": 0,
    "take": 10
  }
}
```

**Requires:** Any authenticated role

---

### POST /api/employees

Create new employee (Admin only).

**Request:**
```json
{
  "firstName": "Bob",
  "lastName": "Johnson",
  "email": "bob.johnson@example.com",
  "password": "InitialPassword123!",
  "role": "Manager"
}
```

**Response (201)**:
```json
{
  "data": {
    "EmployeeID": 3,
    "FirstName": "Bob",
    "LastName": "Johnson",
    "Email": "bob.johnson@example.com",
    "Role": "Manager"
  },
  "message": "Employee created successfully"
}
```

**Requires:** Admin role

---

### GET /api/employees/:id

Get employee details by ID.

**Response (200)**:
```json
{
  "data": {
    "EmployeeID": 1,
    "FirstName": "John",
    "LastName": "Doe",
    "Email": "john.doe@example.com",
    "Role": "Manager"
  }
}
```

**Requires:** Any authenticated role

---

### PUT /api/employees/:id

Update employee information.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "role": "Manager"
}
```

**Response (200)**:
```json
{
  "data": {
    "EmployeeID": 1,
    "FirstName": "John",
    "LastName": "Smith",
    "Email": "john.doe@example.com",
    "Role": "Manager"
  },
  "message": "Employee updated successfully"
}
```

**Requires:** Admin or self (own profile)

---

### DELETE /api/employees/:id

Delete employee (Admin only).

**Response (200)**:
```json
{
  "message": "Employee deleted successfully"
}
```

**Requires:** Admin role

---

## Project Endpoints

### GET /api/projects

Get all projects (paginated).

**Query Parameters:**
- `skip`: Pagination offset
- `take`: Records per page
- `status`: Filter by status (Planning, In Progress, On Hold, Completed)
- `search`: Search by project name or client name

**Response (200)**:
```json
{
  "data": [
    {
      "ProjectID": 1,
      "ProjectName": "Website Redesign",
      "ClientName": "Acme Corp",
      "Description": "Complete redesign of company website",
      "StartDate": "2026-05-01T00:00:00Z",
      "EndDate": "2026-08-01T00:00:00Z",
      "Status": "In Progress"
    }
  ],
  "pagination": {
    "total": 1,
    "skip": 0,
    "take": 10
  }
}
```

---

### POST /api/projects

Create new project.

**Request:**
```json
{
  "projectName": "Mobile App Development",
  "clientName": "Tech Startup Inc",
  "description": "Develop iOS and Android app",
  "startDate": "2026-05-01",
  "endDate": "2026-10-01",
  "status": "Planning"
}
```

**Response (201)**:
```json
{
  "data": {
    "ProjectID": 2,
    "ProjectName": "Mobile App Development",
    "ClientName": "Tech Startup Inc",
    "Description": "Develop iOS and Android app",
    "StartDate": "2026-05-01T00:00:00Z",
    "EndDate": "2026-10-01T00:00:00Z",
    "Status": "Planning"
  },
  "message": "Project created successfully"
}
```

**Requires:** Manager or Admin role

---

### GET /api/projects/:id

Get project details by ID.

**Response (200)**:
```json
{
  "data": {
    "ProjectID": 1,
    "ProjectName": "Website Redesign",
    "ClientName": "Acme Corp",
    "Description": "Complete redesign of company website",
    "StartDate": "2026-05-01T00:00:00Z",
    "EndDate": "2026-08-01T00:00:00Z",
    "Status": "In Progress",
    "tasks": [...],
    "documents": [...],
    "assignments": [...]
  }
}
```

---

### PUT /api/projects/:id

Update project.

**Request:**
```json
{
  "status": "On Hold",
  "endDate": "2026-08-15"
}
```

**Response (200)**:
```json
{
  "data": {
    "ProjectID": 1,
    "ProjectName": "Website Redesign",
    "Status": "On Hold",
    "EndDate": "2026-08-15T00:00:00Z"
  },
  "message": "Project updated successfully"
}
```

**Requires:** Manager or Admin role

---

### DELETE /api/projects/:id

Delete project and all related records (cascade).

**Response (200)**:
```json
{
  "message": "Project deleted successfully"
}
```

**Requires:** Admin role

---

## Task Endpoints

### GET /api/tasks

Get all tasks (can filter by project).

**Query Parameters:**
- `projectId`: Filter by project (required or optional per implementation)
- `status`: Filter by status (To Do, In Progress, Review, Completed)
- `priority`: Filter by priority (Low, Medium, High, Critical)
- `skip`: Pagination offset
- `take`: Records per page

**Response (200)**:
```json
{
  "data": [
    {
      "TaskID": 1,
      "ProjectID": 1,
      "TaskName": "Design homepage mockups",
      "Description": "Create Figma wireframes and high-fidelity mockups",
      "DueDate": "2026-05-15T00:00:00Z",
      "Status": "In Progress",
      "Priority": "High"
    }
  ],
  "pagination": {
    "total": 1,
    "skip": 0,
    "take": 10
  }
}
```

---

### POST /api/tasks

Create new task.

**Request:**
```json
{
  "projectId": 1,
  "taskName": "Implement payment gateway",
  "description": "Integrate Stripe payment processing",
  "dueDate": "2026-06-01",
  "status": "To Do",
  "priority": "Critical"
}
```

**Response (201)**:
```json
{
  "data": {
    "TaskID": 2,
    "ProjectID": 1,
    "TaskName": "Implement payment gateway",
    "Description": "Integrate Stripe payment processing",
    "DueDate": "2026-06-01T00:00:00Z",
    "Status": "To Do",
    "Priority": "Critical"
  },
  "message": "Task created successfully"
}
```

---

### GET /api/tasks/:id

Get task details.

**Response (200)**:
```json
{
  "data": {
    "TaskID": 1,
    "ProjectID": 1,
    "TaskName": "Design homepage mockups",
    "Description": "Create Figma wireframes",
    "DueDate": "2026-05-15T00:00:00Z",
    "Status": "In Progress",
    "Priority": "High"
  }
}
```

---

### PUT /api/tasks/:id

Update task.

**Request:**
```json
{
  "status": "Review",
  "priority": "Medium"
}
```

**Response (200)**:
```json
{
  "data": {
    "TaskID": 1,
    "Status": "Review",
    "Priority": "Medium"
  },
  "message": "Task updated successfully"
}
```

---

### DELETE /api/tasks/:id

Delete task.

**Response (200)**:
```json
{
  "message": "Task deleted successfully"
}
```

---

## Document Endpoints

### GET /api/documents

Get all documents (can filter by project/category).

**Query Parameters:**
- `projectId`: Filter by project
- `categoryId`: Filter by category
- `search`: Search by title
- `skip`: Pagination offset
- `take`: Records per page

**Response (200)**:
```json
{
  "data": [
    {
      "DocumentID": 1,
      "ProjectID": 1,
      "DocumentTitle": "Requirements Document",
      "FileName": "requirements_v2.pdf",
      "VersionNumber": "2.0",
      "CreatedDate": "2026-04-15T10:30:00Z",
      "UpdatedDate": "2026-04-20T14:45:00Z",
      "CreatedBy": "john.doe@example.com",
      "Category": {
        "CategoryID": 1,
        "CategoryName": "Requirements"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "skip": 0,
    "take": 10
  }
}
```

---

### POST /api/documents

Upload new document (multipart form data).

**Request Fields:**
- `file`: File binary
- `projectId`: Project ID
- `documentTitle`: Title
- `categoryId` (optional): Category ID
- `versionNumber` (optional): Version

**Response (201)**:
```json
{
  "data": {
    "DocumentID": 2,
    "ProjectID": 1,
    "DocumentTitle": "Design Guidelines",
    "FileName": "design_guidelines.pdf",
    "VersionNumber": "1.0",
    "Category": {
      "CategoryID": 2,
      "CategoryName": "Design"
    }
  },
  "message": "Document uploaded successfully"
}
```

---

### GET /api/documents/:id

Get document details.

**Response (200)**:
```json
{
  "data": {
    "DocumentID": 1,
    "ProjectID": 1,
    "DocumentTitle": "Requirements Document",
    "FileName": "requirements_v2.pdf",
    "VersionNumber": "2.0",
    "CreatedDate": "2026-04-15T10:30:00Z",
    "UpdatedDate": "2026-04-20T14:45:00Z",
    "CreatedBy": "john.doe@example.com",
    "Category": {
      "CategoryID": 1,
      "CategoryName": "Requirements"
    }
  }
}
```

---

### DELETE /api/documents/:id

Delete document.

**Response (200)**:
```json
{
  "message": "Document deleted successfully"
}
```

---

## Category Endpoints

### GET /api/categories

Get all document categories.

**Response (200)**:
```json
{
  "data": [
    {
      "CategoryID": 1,
      "CategoryName": "Requirements",
      "Description": "Functional and technical requirements"
    },
    {
      "CategoryID": 2,
      "CategoryName": "Design",
      "Description": "UI/UX and design specifications"
    },
    {
      "CategoryID": 3,
      "CategoryName": "Financial",
      "Description": "Budget and cost documents"
    }
  ]
}
```

---

### POST /api/categories

Create new category.

**Request:**
```json
{
  "categoryName": "Testing",
  "description": "QA test plans and reports"
}
```

**Response (201)**:
```json
{
  "data": {
    "CategoryID": 4,
    "CategoryName": "Testing",
    "Description": "QA test plans and reports"
  },
  "message": "Category created successfully"
}
```

**Requires:** Manager or Admin role

---

### GET /api/categories/:id

Get category details.

**Response (200)**:
```json
{
  "data": {
    "CategoryID": 1,
    "CategoryName": "Requirements",
    "Description": "Functional and technical requirements"
  }
}
```

---

### PUT /api/categories/:id

Update category.

**Request:**
```json
{
  "description": "Updated description"
}
```

**Response (200)**:
```json
{
  "data": {
    "CategoryID": 1,
    "CategoryName": "Requirements",
    "Description": "Updated description"
  },
  "message": "Category updated successfully"
}
```

---

### DELETE /api/categories/:id

Delete category.

**Response (200)**:
```json
{
  "message": "Category deleted successfully"
}
```

---

## Alert Endpoints

### GET /api/alerts

Get all alerts.

**Query Parameters:**
- `projectId`: Filter by project
- `severity`: Filter by severity (Low, Medium, High, Critical)
- `skip`: Pagination offset
- `take`: Records per page

**Response (200)**:
```json
{
  "data": [
    {
      "AlertID": 1,
      "ProjectID": 1,
      "AlertType": "Delay Warning",
      "Severity": "High",
      "Message": "Project at risk of 2-week delay",
      "TaskID": 5,
      "CreatedAt": "2026-04-30T08:15:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "skip": 0,
    "take": 10
  }
}
```

---

### POST /api/alerts

Create new alert (manual).

**Request:**
```json
{
  "projectId": 1,
  "alertType": "Resource Issue",
  "severity": "Medium",
  "message": "Need additional QA resources",
  "taskId": null
}
```

**Response (201)**:
```json
{
  "data": {
    "AlertID": 2,
    "ProjectID": 1,
    "AlertType": "Resource Issue",
    "Severity": "Medium",
    "Message": "Need additional QA resources",
    "CreatedAt": "2026-05-01T10:30:00Z"
  },
  "message": "Alert created successfully"
}
```

---

### DELETE /api/alerts/:id

Delete alert.

**Response (200)**:
```json
{
  "message": "Alert deleted successfully"
}
```

---

## Assignment Endpoints

### GET /api/assignments

Get all project assignments.

**Query Parameters:**
- `employeeId`: Filter by employee
- `projectId`: Filter by project
- `skip`: Pagination offset
- `take`: Records per page

**Response (200)**:
```json
{
  "data": [
    {
      "AssignmentID": 1,
      "EmployeeID": 1,
      "ProjectID": 1,
      "RoleInProject": "Project Lead",
      "Employee": {
        "FirstName": "John",
        "LastName": "Doe",
        "Email": "john.doe@example.com"
      },
      "Project": {
        "ProjectID": 1,
        "ProjectName": "Website Redesign"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "skip": 0,
    "take": 10
  }
}
```

---

### POST /api/assignments

Assign employee to project.

**Request:**
```json
{
  "employeeId": 2,
  "projectId": 1,
  "roleInProject": "Frontend Developer"
}
```

**Response (201)**:
```json
{
  "data": {
    "AssignmentID": 2,
    "EmployeeID": 2,
    "ProjectID": 1,
    "RoleInProject": "Frontend Developer"
  },
  "message": "Assignment created successfully"
}
```

**Requires:** Manager or Admin role

---

### DELETE /api/assignments/:id

Remove assignment.

**Response (200)**:
```json
{
  "message": "Assignment deleted successfully"
}
```

**Requires:** Manager or Admin role

---

## AI Service Endpoints

### POST /api/ai/classify-document

Classify document title/content into category.

**Request:**
```json
{
  "title": "Q3 Financial Report and Budget Analysis"
}
```

**Response (200)**:
```json
{
  "data": {
    "category": "Financial",
    "confidence": 0.92
  }
}
```

**Confidence Scale**: 0 = no match, 1 = perfect match

---

### POST /api/ai/search

Perform semantic search across documents and tasks.

**Request:**
```json
{
  "query": "budget allocation",
  "limit": 5,
  "items": [
    {
      "id": 1,
      "kind": "document",
      "title": "Q3 Budget Proposal"
    },
    {
      "id": 2,
      "kind": "task",
      "title": "Finalize budget numbers"
    }
  ]
}
```

**Response (200)**:
```json
{
  "data": {
    "results": [
      {
        "id": 1,
        "kind": "document",
        "title": "Q3 Budget Proposal",
        "score": 0.87
      },
      {
        "id": 2,
        "kind": "task",
        "title": "Finalize budget numbers",
        "score": 0.76
      }
    ]
  }
}
```

---

### POST /api/ai/predict-delay

Predict project delay and risk.

**Request:**
```json
{
  "projectId": 1
}
```

**Response (200)**:
```json
{
  "data": {
    "risk_score": 0.72,
    "delay_probability": 0.68,
    "estimated_days": 12
  }
}
```

**Interpretation**:
- `risk_score`: 0-1, higher = more risk
- `delay_probability`: Percentage likelihood of delay
- `estimated_days`: Projected days of delay if occurs

---

### POST /api/ai/analyze-health

Analyze overall project health.

**Request:**
```json
{
  "projectId": 1
}
```

**Response (200)**:
```json
{
  "data": {
    "health_score": 78,
    "risks": [
      "Schedule slipping (tasks 2 weeks behind)",
      "Resource constraint in QA team",
      "Dependency on third-party vendor"
    ],
    "recommendations": [
      "Allocate additional QA resources",
      "Review vendor timeline",
      "Hold status meeting with stakeholders"
    ]
  }
}
```

**Health Score Scale**: 0-100
- 80-100: Healthy
- 60-79: Caution
- 40-59: Warning
- 0-39: Critical

---

### POST /api/ai/prioritize-tasks

Get task priority recommendations.

**Request:**
```json
{
  "projectId": 1,
  "tasks": [
    {
      "TaskID": 1,
      "TaskName": "Fix critical bug",
      "DueDate": "2026-05-05",
      "Status": "To Do"
    },
    {
      "TaskID": 2,
      "TaskName": "Code review",
      "DueDate": "2026-05-10",
      "Status": "To Do"
    }
  ]
}
```

**Response (200)**:
```json
{
  "data": [
    {
      "TaskID": 1,
      "recommendedPriority": "Critical",
      "priorityScore": 0.95,
      "reason": "Critical bug with upcoming deadline"
    },
    {
      "TaskID": 2,
      "recommendedPriority": "Medium",
      "priorityScore": 0.62,
      "reason": "Lower urgency, longer deadline"
    }
  ]
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database connection error |

### Error Response Format

```json
{
  "error": "Descriptive error message",
  "statusCode": 400,
  "timestamp": "2026-05-01T10:30:00Z",
  "details": {
    "field": "email",
    "reason": "Email already exists"
  }
}
```

### Common Error Scenarios

**Missing Token**:
```json
{
  "error": "Authorization header required",
  "statusCode": 401
}
```

**Invalid Role**:
```json
{
  "error": "Admin role required",
  "statusCode": 403
}
```

**Not Found**:
```json
{
  "error": "Project with ID 999 not found",
  "statusCode": 404
}
```

**Validation Error**:
```json
{
  "error": "Validation failed",
  "statusCode": 400,
  "details": [
    {
      "field": "projectName",
      "message": "Project name required"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Rate Limiting

### Current Policy

No rate limiting implemented in base version.

### Recommended for Production

```
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user
- 10 requests per second per endpoint
```

### Response Headers

When implemented:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1609459260
```

---

## Testing Endpoints

### Using Postman

1. **Import Collection**: Use Postman environment variables
2. **Set Base URL**: `{{base_url}}/api`
3. **Set Token**: Copy from login response to `{{token}}`

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get Projects
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer <TOKEN>"

# Create Project
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"projectName":"New Project",...}'
```

---

**API Version**: 1.0
**Last Updated**: May 1, 2026
