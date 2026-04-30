# Documentation Index & Quick Reference

**Corporate Project Management System - Documentation Map**

---

## 📚 Documentation Files

### Main Documentation

| File | Purpose | Best For |
|------|---------|----------|
| **README.md** | Quick start guide | Getting started in 5 minutes |
| **PROJECT_DOCUMENTATION.md** | Comprehensive reference | Understanding the entire project |
| **DETAILED_OVERVIEW.md** | Executive/technical summary | High-level overview |
| **ARCHITECTURE.md** | System design & patterns | Understanding how components work together |
| **API_DOCUMENTATION.md** | Complete API reference | Building features, API integration |
| **SETUP_GUIDE.md** | Installation & configuration | Setting up development environment |
| **DEVELOPMENT_GUIDE.md** | Dev workflow & standards | Contributing code |
| **QUICK_REFERENCE.md** | Cheat sheet & commands | Quick lookup during development |

---

## 🎯 Choose Your Path

### 👤 I'm New to the Project
1. Start: [README.md](README.md) (5 min)
2. Read: [DETAILED_OVERVIEW.md](DETAILED_OVERVIEW.md) (10 min)
3. Install: [SETUP_GUIDE.md](SETUP_GUIDE.md) (15 min)
4. Done! Start development

### 👨‍💻 I'm a Developer
1. Read: [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)
2. Reference: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. Check: [ARCHITECTURE.md](ARCHITECTURE.md) if needed
4. Use: [QUICK_REFERENCE.md](#quick-reference) for commands

### 🏗️ I'm an Architect
1. Study: [ARCHITECTURE.md](ARCHITECTURE.md)
2. Review: [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
3. Check: [Database Schema Section](PROJECT_DOCUMENTATION.md#database-schema)
4. Explore: [API Design Section](API_DOCUMENTATION.md)

### 🔧 I'm Setting Up Infrastructure
1. Follow: [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Deploy: [Deployment Section](PROJECT_DOCUMENTATION.md#deployment)
3. Monitor: Health checks in [SETUP_GUIDE.md](SETUP_GUIDE.md#verifying-installation)

### 📡 I'm Building an API Integration
1. Reference: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. Check: [Endpoints Summary](DETAILED_OVERVIEW.md#api-endpoints-summary)
3. Test: [Testing Endpoints](API_DOCUMENTATION.md#testing-endpoints)

---

## ⚡ Quick Reference

### Essential Commands

#### Backend Setup & Run
```bash
cd backend
pnpm install                    # Install dependencies
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Create migrations
pnpm dev                        # Start dev server (port 5000)
pnpm build                      # Build TypeScript
pnpm test                       # Run tests
pnpm test:watch                 # Watch tests
```

#### Frontend Setup & Run
```bash
cd frontend
pnpm install                    # Install dependencies
pnpm dev                        # Start dev server (port 5173)
pnpm build                      # Build for production
pnpm test                       # Run tests
pnpm lint                       # Check code quality
```

#### AI Service Setup & Run
```bash
cd ai-service
python -m venv venv             # Create virtual environment
source venv/bin/activate        # Activate venv (Windows: venv\Scripts\activate)
pip install -r requirements.txt # Install packages
python -m uvicorn main:app --reload --port 8000  # Start server
pytest tests/                   # Run tests
```

#### Database
```bash
# From backend directory
npx prisma studio              # Open database viewer (localhost:5555)
npx prisma migrate reset       # Reset database (WARNING: deletes data)
npx prisma migrate status      # Check migration status
npx prisma db seed             # Seed data (if script exists)
```

#### Git & Commits
```bash
git checkout -b feature/name    # Create feature branch
git add .
git commit -m "feat: description"  # Follow convention
git push origin feature/name
# Create PR on GitHub
```

---

### Common Issues & Solutions

| Problem | Command | Notes |
|---------|---------|-------|
| Port 5000 in use | `lsof -i :5000` then `kill -9 <PID>` | macOS/Linux |
| Port 5000 in use | `netstat -ano \| findstr :5000` | Windows |
| Clear cache | `rm -rf node_modules pnpm-lock.yaml && pnpm install` | Backend/Frontend |
| DB connection failed | Check `.env` DATABASE_URL | Verify SQL Server running |
| Python imports fail | `pip install -r requirements.txt` | Ensure venv activated |
| Prisma errors | `npx prisma generate` | Regenerate Prisma client |
| CORS issues | Check `origin` in `src/index.ts` | Update if needed |
| 401 Unauthorized | Check JWT_SECRET in `.env` | Verify token valid |

---

### Development Environment Variables

#### Backend (.env)
```env
DATABASE_URL="Server=localhost;Database=CorporatePM;User Id=pmuser;Password=...;"
SHADOW_DATABASE_URL="Server=localhost;Database=CorporatePM_shadow;User Id=pmuser;Password=...;"
JWT_SECRET="your-secret-key-here"
AI_SERVICE_URL="http://localhost:8000"
PORT=5000
NODE_ENV="development"
LOG_LEVEL="debug"
```

#### Frontend (.env)
```env
VITE_API_URL="http://localhost:5000/api"
VITE_ENV="development"
```

#### AI Service (.env)
```env
HOST="0.0.0.0"
PORT=8000
DEBUG=true
MODEL_NAME="sentence-transformers/all-MiniLM-L6-v2"
```

---

### API Endpoints Cheat Sheet

#### Authentication
```
POST /api/auth/login            # Login
POST /api/auth/register         # Register
```

#### Projects
```
GET    /api/projects            # List all
POST   /api/projects            # Create new
GET    /api/projects/:id        # Get one
PUT    /api/projects/:id        # Update
DELETE /api/projects/:id        # Delete
```

#### Tasks
```
GET    /api/tasks               # List all
POST   /api/tasks               # Create new
GET    /api/tasks/:id           # Get one
PUT    /api/tasks/:id           # Update
DELETE /api/tasks/:id           # Delete
```

#### Documents
```
GET    /api/documents           # List all
POST   /api/documents           # Upload (multipart)
GET    /api/documents/:id       # Get one
DELETE /api/documents/:id       # Delete
```

#### AI Service
```
POST   /api/ai/classify-document
POST   /api/ai/search
POST   /api/ai/predict-delay
POST   /api/ai/analyze-health
POST   /api/ai/prioritize-tasks
```

---

### File Navigation

#### Backend Important Files
```
backend/
├── src/index.ts                # Main entry point
├── src/routes/                 # API endpoints
│   ├── auth.ts                 # Authentication
│   ├── projects.ts             # Project endpoints
│   ├── tasks.ts                # Task endpoints
│   └── ai.ts                   # AI integration
├── src/middleware/
│   ├── auth.ts                 # JWT verification
│   └── authorize.ts            # Role checking
├── src/lib/
│   ├── prisma.ts               # Prisma client
│   └── aiServiceUrl.ts         # AI config
├── src/jobs/
│   └── predictiveAlerts.ts     # Scheduled job
├── prisma/schema.prisma        # Database schema
└── .env                        # Configuration
```

#### Frontend Important Files
```
frontend/
├── src/main.tsx                # Entry point
├── src/App.tsx                 # Root component
├── src/pages/                  # Page components
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── Tasks.tsx
│   └── ...
├── src/components/
│   ├── layout/Layout.tsx       # Main layout
│   └── ui/                     # UI components
├── src/context/
│   ├── AuthContext.tsx         # Auth state
│   └── SidebarContext.tsx      # UI state
├── src/services/
│   └── api.ts                  # API client
└── .env                        # Configuration
```

#### AI Service Important Files
```
ai-service/
├── main.py                     # FastAPI app
├── models/
│   ├── classifier.py           # Document classification
│   ├── search.py               # Semantic search
│   ├── delay_predictor.py      # Delay prediction
│   ├── health_pipeline.py      # Health analysis
│   └── auto_prioritizer.py     # Task prioritization
└── requirements.txt            # Python packages
```

---

### Debugging Tips

#### Backend Debugging
```typescript
// Add console logs
console.log('Variable:', variable)
console.error('Error:', error)

// Use TypeScript for type safety
const userId: number = req.params.id  // Prevents type errors

// Check middleware execution
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})
```

#### Frontend Debugging
```typescript
// React DevTools extension in browser
// React Query DevTools integration:
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Add query key logging:
console.log('Query key:', queryKey)
console.log('Query data:', data)

// Check network in DevTools (F12 → Network tab)
```

#### AI Service Debugging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug("Debug info")
logger.info("Info message")
logger.error("Error!", exc_info=True)
```

---

### Testing Commands

```bash
# Backend
cd backend
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test --run        # Single run

# Frontend
cd frontend
pnpm test              # Run all tests
pnpm test:watch        # Watch mode

# AI Service
cd ai-service
pytest tests/          # Run all tests
pytest tests/ -v       # Verbose output
pytest tests/ --cov    # With coverage report
```

---

### Code Style & Linting

```bash
# Frontend linting
cd frontend
pnpm lint              # Check all files
pnpm lint --fix        # Auto-fix issues

# Format code
# Prettier is configured to run on save in VS Code

# Python formatting
cd ai-service
black models/          # Format Python files
flake8 models/         # Check code quality
mypy models/           # Type checking
```

---

### Deployment Quick Start

#### Local Docker
```bash
docker-compose up -d              # Start all services
docker-compose logs -f            # View logs
docker-compose down               # Stop all services
docker-compose build              # Rebuild images
```

#### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL/TLS certificates installed
- [ ] CORS origins updated
- [ ] Logging configured
- [ ] Backups scheduled
- [ ] Monitoring set up
- [ ] Health checks verified

---

### Performance Optimization Checklist

#### Backend
- [ ] Database indexes on foreign keys
- [ ] Pagination for large datasets
- [ ] Caching for frequently accessed data
- [ ] Query optimization with eager loading
- [ ] Connection pooling configured

#### Frontend
- [ ] Code splitting for large components
- [ ] Memoization for expensive calculations
- [ ] Image optimization
- [ ] Lazy loading routes
- [ ] React Query staleTime configured

#### Database
- [ ] Indexes created
- [ ] Statistics updated
- [ ] Archival policy for old data
- [ ] Backup schedule configured
- [ ] Query performance monitored

---

### Security Checklist

#### Before Production
- [ ] JWT_SECRET is strong and random
- [ ] DATABASE_URL not in source control
- [ ] HTTPS/TLS enabled
- [ ] CORS whitelist configured
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] Password hashing with bcrypt
- [ ] Rate limiting implemented
- [ ] Secrets in environment variables
- [ ] Security headers configured

---

### Regular Maintenance

#### Daily
- Monitor logs for errors
- Check alert notifications
- Verify all services running

#### Weekly
- Review performance metrics
- Check database backup completion
- Update dependencies (if safe)

#### Monthly
- Security scanning
- Performance review
- Disk space check
- User access review

#### Quarterly
- Major version updates
- Security audit
- Architecture review
- Capacity planning

---

### Resources & Links

#### Documentation
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) - Full docs
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Development workflow

#### External
- React Docs: https://react.dev
- Express Docs: https://expressjs.com
- FastAPI Docs: https://fastapi.tiangolo.com
- Prisma Docs: https://www.prisma.io/docs
- TypeScript Docs: https://www.typescriptlang.org/docs

#### Tools
- VS Code: https://code.visualstudio.com
- Postman: https://www.postman.com
- SQL Server Management Studio: https://learn.microsoft.com/sql/ssms

---

### Frequently Asked Questions

**Q: How do I create a new API endpoint?**
A: Follow pattern in [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md#adding-new-route)

**Q: How do I add a new database table?**
A: Update schema.prisma, then run `npx prisma migrate dev --name description`

**Q: How do I add a new AI model?**
A: Create file in `models/`, add FastAPI endpoint in `main.py`

**Q: How do I test an API endpoint?**
A: Use curl, Postman, or Thunder Client. See [API_DOCUMENTATION.md](API_DOCUMENTATION.md#testing-endpoints)

**Q: Why is my database connection failing?**
A: Check CONNECTION_URL in .env, verify SQL Server running, check firewall rules

**Q: How do I deploy to production?**
A: See [SETUP_GUIDE.md](SETUP_GUIDE.md#docker-setup-optional) and [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md#deployment)

---

## 📞 Getting Help

1. **Check Documentation**: Search relevant doc file
2. **Search Issues**: GitHub issues for similar problems
3. **Review Logs**: Check console output
4. **Ask Team**: Slack or email
5. **Create Issue**: Provide error details and reproduction steps

---

## 📝 Last Updated

**Date**: May 1, 2026
**Version**: 1.0.0

For updates, see [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)

---

**Happy Coding! 🚀**
