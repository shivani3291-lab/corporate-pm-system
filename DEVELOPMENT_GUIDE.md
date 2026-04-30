# Development Guide

**Corporate Project Management System - Development Workflow & Best Practices**

---

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Code Standards](#code-standards)
3. [Git Workflow](#git-workflow)
4. [Backend Development](#backend-development)
5. [Frontend Development](#frontend-development)
6. [AI Service Development](#ai-service-development)
7. [Testing Guidelines](#testing-guidelines)
8. [Debugging](#debugging)
9. [Performance Optimization](#performance-optimization)
10. [Contributing](#contributing)

---

## Development Workflow

### Daily Workflow

```
1. Start of Day
   ├─ git fetch origin
   ├─ git pull origin main
   └─ Verify all services running

2. Development
   ├─ Create feature branch
   ├─ Make changes with tests
   ├─ Commit frequently
   └─ Push to remote

3. Before Submitting PR
   ├─ Run full test suite
   ├─ Lint code
   ├─ Update documentation
   └─ Rebase on latest main

4. Code Review & Merge
   ├─ Create pull request
   ├─ Address review feedback
   ├─ Merge to main
   └─ Deploy to staging (if configured)
```

### Development Environment Setup

**Quick Start** (assumes completed SETUP_GUIDE.md):

```bash
# Clone repo
git clone <repo-url>
cd corporate-pm-system

# Install and start all services
pnpm install

# Backend
cd backend && pnpm install && pnpm dev

# Frontend (new terminal)
cd frontend && pnpm install && pnpm dev

# AI Service (new terminal)
cd ai-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python -m uvicorn main:app --reload
```

---

## Code Standards

### TypeScript Backend

#### Naming Conventions

```typescript
// Files: kebab-case
// ✓ user-routes.ts
// ✗ userRoutes.ts

// Interfaces: PascalCase
interface UserRequest {
  email: string
  password: string
}

// Functions: camelCase
async function getUserById(id: number): Promise<User> {
  // ...
}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3
const DEFAULT_TIMEOUT_MS = 5000

// Classes: PascalCase
class UserService {
  async getUserById(id: number): Promise<User> {
    // ...
  }
}

// Enums: PascalCase for enum name, UPPER_CASE for values
enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  STAFF = 'Staff',
}
```

#### Type Annotations

```typescript
// ✓ Always annotate function parameters
function createUser(email: string, name: string): Promise<User> {
  // ...
}

// ✓ Use explicit return types
function getUserId(): number {
  return 1
}

// ✓ Use proper typing for Prisma
const user: User = await prisma.employee.findUnique({
  where: { EmployeeID: 1 }
})

// ✗ Avoid 'any' type
function process(data: any) { }  // BAD

// ✓ Use union types instead
type ValidationResult = { valid: true; data: User } | { valid: false; error: string }
```

#### Error Handling

```typescript
// ✓ Custom error classes
class UserNotFoundError extends Error {
  constructor(id: number) {
    super(`User with ID ${id} not found`)
    this.name = 'UserNotFoundError'
  }
}

// ✓ Proper error handling in routes
app.get('/users/:id', async (req, res) => {
  try {
    const user = await getUserById(Number(req.params.id))
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

### React Frontend

#### Naming Conventions

```typescript
// Files: PascalCase for components
// ✓ UserProfile.tsx
// ✗ user-profile.tsx

// Components: PascalCase
function UserProfile() {
  return <div>...</div>
}

// Hooks: camelCase, prefix with 'use'
function useUserData(userId: number) {
  return useQuery(['user', userId], () => fetchUser(userId))
}

// Constants: UPPER_CASE
const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
}
```

#### Component Structure

```typescript
// ✓ Good structure
interface UserProfileProps {
  userId: number
  onUpdate?: (user: User) => void
}

function UserProfile({ userId, onUpdate }: UserProfileProps) {
  const { data, isLoading, error } = useQuery(['user', userId], () => fetchUser(userId))

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      {/* JSX */}
    </div>
  )
}

export default UserProfile
```

#### Hooks Usage

```typescript
// ✓ Use React Query for data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.get('/users'),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  retry: 2,
})

// ✓ Use mutations for mutations
const mutation = useMutation({
  mutationFn: (user: User) => api.post('/users', user),
  onSuccess: () => {
    queryClient.invalidateQueries(['users'])
    toast.success('User created!')
  },
  onError: (error) => {
    toast.error(`Error: ${error.message}`)
  }
})
```

### Python AI Service

#### Naming Conventions

```python
# Module/file names: snake_case
# ✓ document_classifier.py
# ✗ DocumentClassifier.py

# Functions: snake_case
def classify_document(title: str) -> dict:
    pass

# Classes: PascalCase
class DocumentClassifier:
    def __init__(self):
        pass

# Constants: UPPER_CASE
MAX_RESULTS = 100
DEFAULT_TIMEOUT_SECONDS = 30

# Private methods: prefix with underscore
def _preprocess_text(text: str) -> str:
    pass
```

#### Type Hints (Python 3.11+)

```python
from typing import Optional, List, Dict

# ✓ Always use type hints
def search_documents(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    pass

# ✓ Use Pydantic for validation
from pydantic import BaseModel, Field

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=100)

# ✓ Proper error handling
try:
    result = classify_document(title)
except ValueError as e:
    logger.error(f"Classification failed: {e}")
    raise
```

---

## Git Workflow

### Branch Naming Convention

```
main                           # Production-ready code
├─ feature/user-auth          # New feature
├─ fix/login-bug               # Bug fix
├─ docs/api-documentation      # Documentation
└─ refactor/database-queries   # Refactoring

Patterns:
- feature/description          # New features
- fix/issue-description        # Bug fixes
- hotfix/urgent-fix            # Emergency production fixes
- docs/page-description        # Documentation updates
- refactor/area-name           # Code refactoring
- test/test-coverage           # Adding/improving tests
```

### Commit Message Convention

```
feat(auth): implement JWT token refresh mechanism
^    ^     ^
|    |     └─ Description (imperative mood)
|    └──────── Scope (optional)
└───────────── Type

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation
- style:    Formatting, missing semicolons, etc.
- refactor: Code restructuring without changing functionality
- perf:     Performance improvement
- test:     Adding or updating tests
- chore:    Dependency updates, build changes

Examples:
feat(projects): add project delay prediction
fix(tasks): resolve task status not updating
docs(api): update API documentation
refactor(database): optimize query performance
test(auth): add JWT validation tests
```

### Pull Request Process

1. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   ```bash
   # Make your changes
   git add .
   git commit -m "feat(scope): description"
   git push origin feature/your-feature-name
   ```

3. **Create PR**
   - Go to GitHub/GitLab
   - Create pull request with descriptive title
   - Include checklist in description:
     ```
     ## PR Description
     Briefly describe changes...

     ## Checklist
     - [ ] Code follows style guidelines
     - [ ] Tests added/updated
     - [ ] Documentation updated
     - [ ] No breaking changes
     - [ ] Tested locally with all services running
     ```

4. **Address Review Feedback**
   ```bash
   # Make requested changes
   git add .
   git commit -m "fix: address review feedback"
   git push origin feature/your-feature-name
   ```

5. **Merge**
   - Wait for all checks to pass
   - Get approval from 2+ reviewers
   - Squash or rebase commits if needed
   - Merge to main

---

## Backend Development

### Adding New Route

1. **Create route file** in `src/routes/`:

```typescript
// src/routes/custom.ts
import express from 'express'
import { authenticate, authorize } from '../middleware/auth'
import prisma from '../lib/prisma'

const router = express.Router()

// GET endpoint
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.model.findMany()
    res.json({ data: items })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST endpoint
router.post('/', authenticate, authorize('Manager'), async (req, res) => {
  try {
    const { name, description } = req.body

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Name required' })
    }

    const item = await prisma.model.create({
      data: { name, description }
    })

    res.status(201).json({ data: item, message: 'Created successfully' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
```

2. **Register in** `src/index.ts`:

```typescript
import customRoutes from './routes/custom'

app.use('/api/custom', customRoutes)
```

3. **Test endpoint**:

```bash
curl -X POST http://localhost:5000/api/custom \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test item"}'
```

### Adding Database Migration

1. **Update schema** in `prisma/schema.prisma`:

```prisma
model NewModel {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
}
```

2. **Create migration**:

```bash
cd backend
npx prisma migrate dev --name add_new_model
```

3. **Review generated SQL** in `prisma/migrations/` (optional)

4. **Migration applied automatically** to development database

### Accessing Database in Code

```typescript
import prisma from './lib/prisma'

// Create
const user = await prisma.employee.create({
  data: {
    FirstName: 'John',
    LastName: 'Doe',
    Email: 'john@example.com',
    Password: hashedPassword,
    Role: 'Staff'
  }
})

// Read
const user = await prisma.employee.findUnique({
  where: { Email: 'john@example.com' }
})

// Update
const updated = await prisma.employee.update({
  where: { EmployeeID: 1 },
  data: { Role: 'Manager' }
})

// Delete
await prisma.employee.delete({
  where: { EmployeeID: 1 }
})

// Query with relations
const project = await prisma.project.findUnique({
  where: { ProjectID: 1 },
  include: {
    tasks: true,
    documents: true,
    assignments: {
      include: { employee: true }
    }
  }
})
```

---

## Frontend Development

### Adding New Page

1. **Create page component** in `src/pages/`:

```typescript
// src/pages/NewPage.tsx
import Layout from '../components/layout/Layout'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'

function NewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.get('/api/items').then(r => r.data)
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Items</h1>
        {/* Content */}
      </div>
    </Layout>
  )
}

export default NewPage
```

2. **Add route** in `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NewPage from './pages/NewPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... other routes ... */}
        <Route path="/items" element={<NewPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

3. **Add navigation** in `src/components/layout/Sidebar.tsx`:

```typescript
<Link to="/items" className="...">
  Items
</Link>
```

### Using React Query

```typescript
// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['items', page],  // Cache key
  queryFn: () => api.get('/api/items?page=' + page),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  retry: 2,
})

// Creating/updating data
const mutation = useMutation({
  mutationFn: (newItem) => api.post('/api/items', newItem),
  onSuccess: (data) => {
    // Invalidate cache to refetch
    queryClient.invalidateQueries({ queryKey: ['items'] })
  }
})

// Usage
mutation.mutate({ name: 'New Item' })
```

### Form Handling

```typescript
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'

function CreateItemForm() {
  const [formData, setFormData] = useState({ name: '', description: '' })
  const mutation = useMutation({
    mutationFn: (data) => api.post('/api/items', data),
    onSuccess: () => {
      toast.success('Item created!')
      setFormData({ name: '', description: '' })
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Item name"
        required
      />
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Description"
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

---

## AI Service Development

### Creating New ML Model

1. **Create model file** in `models/`:

```python
# models/custom_model.py
from typing import List, Dict, Any
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle

class CustomModel:
    def __init__(self):
        self.model = None

    def train(self, X: np.ndarray, y: np.ndarray):
        """Train the model"""
        self.model = RandomForestClassifier(n_estimators=100)
        self.model.fit(X, y)

    def predict(self, X: np.ndarray) -> List[str]:
        """Make predictions"""
        return self.model.predict(X).tolist()

    def save(self, filepath: str):
        """Save model to disk"""
        with open(filepath, 'wb') as f:
            pickle.dump(self.model, f)

    def load(self, filepath: str):
        """Load model from disk"""
        with open(filepath, 'rb') as f:
            self.model = pickle.load(f)

# Initialize global instance
custom_model = CustomModel()
```

2. **Add FastAPI endpoint** in `main.py`:

```python
from models.custom_model import custom_model

class CustomRequest(BaseModel):
    data: List[float] = Field(..., min_items=1)

class CustomResponse(BaseModel):
    predictions: List[str]

@app.post("/custom-predict")
async def custom_predict(request: CustomRequest) -> CustomResponse:
    """Make custom predictions"""
    predictions = custom_model.predict(np.array([request.data]))
    return CustomResponse(predictions=predictions)
```

3. **Test endpoint**:

```bash
curl -X POST http://localhost:8000/custom-predict \
  -H "Content-Type: application/json" \
  -d '{"data": [0.5, 0.3, 0.8]}'
```

---

## Testing Guidelines

### Backend Testing

```typescript
// tests/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api } from '../src/index'

describe('User API', () => {
  let token: string
  let userId: number

  beforeAll(async () => {
    // Setup: create test user
    const loginRes = await api.post('/auth/login', {
      email: 'test@example.com',
      password: 'Test123!'
    })
    token = loginRes.data.token
  })

  it('should create a user', async () => {
    const res = await api.post('/users', {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    expect(res.status).toBe(201)
    expect(res.data.EmployeeID).toBeDefined()
    userId = res.data.EmployeeID
  })

  it('should fetch user by ID', async () => {
    const res = await api.get(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    expect(res.status).toBe(200)
    expect(res.data.EmployeeID).toBe(userId)
  })

  afterAll(async () => {
    // Cleanup
    await api.delete(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  })
})
```

Run: `pnpm test --watch`

### Frontend Testing

```typescript
// src/__tests__/UserProfile.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import UserProfile from '../pages/UserProfile'

describe('UserProfile', () => {
  it('renders loading state', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <UserProfile userId={1} />
      </QueryClientProvider>
    )
    expect(screen.getByText(/loading/i)).toBeDefined()
  })
})
```

### Python Testing

```python
# tests/test_classifier.py
import pytest
from models.classifier import classify_document

def test_classify_financial_document():
    """Test classification of financial document"""
    result = classify_document("Q3 Financial Report")
    
    assert result['category'] in ['Financial', 'Report', 'Budget']
    assert 0 <= result['confidence'] <= 1

def test_classify_with_empty_title():
    """Test that empty title raises error"""
    with pytest.raises(ValueError):
        classify_document("")

def test_search_results_ranked():
    """Test that search results are properly ranked"""
    results = semantic_search("budget", items=[...])
    
    # Results should be sorted by score descending
    for i in range(len(results) - 1):
        assert results[i]['score'] >= results[i+1]['score']
```

Run: `pytest tests/ -v`

---

## Debugging

### Backend Debugging

1. **Enable Debug Logging**:

```typescript
import pino from 'pino'

const logger = pino({ level: process.env.LOG_LEVEL || 'debug' })

logger.debug('Debug message')
logger.info('Info message')
logger.error('Error:', error)
```

2. **VS Code Debugger** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

### Frontend Debugging

1. **React DevTools Browser Extension**
2. **React Query DevTools**:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      {/* App components */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

3. **Console Logs**:

```typescript
console.log('Data:', data)
console.error('Error:', error)
console.debug('Debug info:', info)
```

### Python Debugging

1. **Print debugging**:

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug("Debug message")
logger.info("Info message")
logger.error("Error occurred", exc_info=True)
```

2. **VS Code Debugger** (`.vscode/launch.json`):

```json
{
  "type": "python",
  "name": "Launch AI Service",
  "request": "launch",
  "module": "uvicorn",
  "args": ["main:app", "--reload"],
  "cwd": "${workspaceFolder}/ai-service"
}
```

---

## Performance Optimization

### Backend

1. **Database Query Optimization**

```typescript
// ✗ N+1 Query Problem
const projects = await prisma.project.findMany()
for (const project of projects) {
  const tasks = await prisma.task.findMany({
    where: { ProjectID: project.ProjectID }
  })  // Runs query for each project!
}

// ✓ Use eager loading
const projects = await prisma.project.findMany({
  include: { tasks: true }  // Single query with JOIN
})
```

2. **Caching**

```typescript
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 300 })  // 5 minute TTL

app.get('/projects/:id', (req, res) => {
  const cached = cache.get(`project_${req.params.id}`)
  if (cached) return res.json(cached)

  const project = await prisma.project.findUnique(...)
  cache.set(`project_${req.params.id}`, project)
  res.json(project)
})
```

3. **Pagination**

```typescript
// Always paginate large datasets
const take = 20
const skip = (page - 1) * take

const [items, total] = await Promise.all([
  prisma.item.findMany({ skip, take }),
  prisma.item.count()
])

res.json({ items, pagination: { total, page, pageSize: take } })
```

### Frontend

1. **Code Splitting**

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Projects = lazy(() => import('./pages/Projects'))

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

2. **Memoization**

```typescript
import { memo, useMemo } from 'react'

// Prevent re-renders of expensive components
const ProjectCard = memo(function ProjectCard({ project }) {
  return <div>{project.name}</div>
})

// Memoize expensive calculations
const sortedProjects = useMemo(() => {
  return projects.sort((a, b) => a.name.localeCompare(b.name))
}, [projects])
```

3. **React Query Optimization**

```typescript
const { data } = useQuery({
  queryKey: ['projects', page],
  queryFn: fetchProjects,
  staleTime: 5 * 60 * 1000,  // 5 min
  gcTime: 10 * 60 * 1000,    // 10 min (garbage collection time)
  retry: 1,
})
```

---

## Contributing

### Contribution Checklist

Before submitting a PR:

- [ ] Code follows style guide
- [ ] Added/updated tests
- [ ] Updated documentation
- [ ] No console errors/warnings
- [ ] Tested on all supported browsers (Chrome, Firefox, Safari, Edge)
- [ ] No breaking changes
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with main

### Code Review Process

Reviewers will check:
1. **Code Quality**: Style, patterns, complexity
2. **Tests**: Coverage, edge cases
3. **Performance**: No regressions, optimization
4. **Security**: No vulnerabilities, data protection
5. **Documentation**: Clear, up-to-date

### Reporting Bugs

Include:
- Detailed description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Environment details (OS, browser, versions)

---

**Development Guide Version**: 1.0
**Last Updated**: May 1, 2026
