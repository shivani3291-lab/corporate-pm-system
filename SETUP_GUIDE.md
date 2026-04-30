# Setup Guide

**Corporate Project Management System - Installation & Configuration**

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Setup Checklist](#pre-setup-checklist)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [AI Service Setup](#ai-service-setup)
7. [Environment Configuration](#environment-configuration)
8. [Running the Application](#running-the-application)
9. [Verifying Installation](#verifying-installation)
10. [Troubleshooting Setup Issues](#troubleshooting-setup-issues)
11. [Development Setup](#development-setup)
12. [Docker Setup (Optional)](#docker-setup-optional)

---

## System Requirements

### Minimum Requirements

| Component | Requirement | Notes |
|-----------|-------------|-------|
| **OS** | Windows 10+, macOS 10.15+, Ubuntu 20.04+ | Any modern OS |
| **RAM** | 8 GB minimum | 16 GB recommended |
| **Disk** | 20 GB available | For dependencies and database |
| **CPU** | Dual-core 2.0 GHz+ | Quad-core recommended |

### Software Requirements

```
Node.js: 18.x or higher
  → Download: https://nodejs.org/
  → Verify: node --version && npm --version

pnpm: 10.32.1 or higher
  → Install: npm install -g pnpm@10.32.1
  → Verify: pnpm --version

Python: 3.11 or higher
  → Download: https://www.python.org/
  → Verify: python --version

Git: 2.0 or higher (for cloning repo)
  → Download: https://git-scm.com/
  → Verify: git --version

SQL Server: 2019+ (local or cloud)
  → Download: https://www.microsoft.com/sql-server/
  → Or use: Azure SQL Database
```

---

## Pre-Setup Checklist

Before starting installation:

- [ ] All prerequisites installed and verified
- [ ] Git repository cloned to local machine
- [ ] SQL Server accessible and credentials ready
- [ ] Ports 5000, 5173, 8000 are available
- [ ] Internet connection active (for package downloads)
- [ ] Text editor/IDE installed (VS Code recommended)

---

## Database Setup

### Option 1: Local SQL Server (Windows)

#### Installation

1. **Download SQL Server Express** (free)
   - https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Choose "Express" edition

2. **Run installer**
   ```
   Double-click setup executable
   → Install Database Engine
   → Use default instance name: MSSQLSERVER
   ```

3. **Configure SQL Server Management Studio** (optional, for UI management)
   ```
   Download: https://learn.microsoft.com/sql/ssms/
   ```

#### Creating Database

1. **Create new database**
   ```sql
   CREATE DATABASE CorporatePM;
   GO
   ```

2. **Create login user**
   ```sql
   CREATE LOGIN pmuser WITH PASSWORD = 'YourStrongPassword123!';
   GO
   
   USE CorporatePM;
   CREATE USER pmuser FOR LOGIN pmuser;
   ALTER ROLE db_owner ADD MEMBER pmuser;
   GO
   ```

3. **Verify connection string**
   ```
   Server=.\MSSQLSERVER;Database=CorporatePM;User Id=pmuser;Password=YourStrongPassword123!;
   ```

### Option 2: Azure SQL Database

#### Create Database

1. **Login to Azure Portal**
   - https://portal.azure.com

2. **Create SQL Database**
   ```
   → New → SQL Database
   → Resource Group: Create new or select existing
   → Database name: corporate-pm
   → Server: Create new
   → Server name: corporate-pm-server
   → Admin login: pmadmin
   → Password: Generate strong password
   ```

3. **Configure Firewall**
   ```
   → Server → Firewalls and virtual networks
   → Add your IP: Allow current IP
   → Azure services: Allow
   ```

4. **Get connection string**
   ```
   Server=tcp:corporate-pm-server.database.windows.net,1433;
   Initial Catalog=corporate-pm;
   User ID=pmadmin;Password=YourPassword;
   ```

### Option 3: Docker (Local Development)

#### Using Docker Compose

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'
services:
  mssql:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      SA_PASSWORD: "YourStrongPassword123!"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
    volumes:
      - sql_data:/var/opt/mssql
volumes:
  sql_data:
```

Run:
```bash
docker-compose up -d
```

Connection string:
```
Server=localhost;Database=CorporatePM;User Id=sa;Password=YourStrongPassword123!;
```

---

## Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
pnpm install
```

Expected output:
```
added 150+ packages in 2.5s
```

### Step 2: Set Up Environment File

Create `.env` in `backend/` directory:

```bash
cp .env.example .env
```

Or create manually (`backend/.env`):

```env
# Database Configuration
DATABASE_URL="Server=localhost;Database=CorporatePM;User Id=pmuser;Password=YourStrongPassword123!;"
SHADOW_DATABASE_URL="Server=localhost;Database=CorporatePM_shadow;User Id=pmuser;Password=YourStrongPassword123!;"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# AI Service
AI_SERVICE_URL="http://localhost:8000"

# Server Configuration
PORT=5000
NODE_ENV="development"

# Logging
LOG_LEVEL="debug"

# Cron Jobs
DISABLE_PREDICTIVE_ALERTS_CRON="0"
PREDICTIVE_ALERTS_CRON="0 0 * * *"  # Daily at midnight UTC
```

### Step 3: Initialize Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Create shadow database for development
# (Prisma uses shadow DB to detect schema changes)

# Run migrations
npx prisma migrate deploy

# Optional: Seed with sample data
# npx prisma db seed (if seed script exists)
```

Expected output:
```
✓ Your database is now in sync with your schema.
```

### Step 4: Build Backend

```bash
pnpm build
```

Expected output:
```
✓ Built in 3.2s
```

### Step 5: Verify Backend

```bash
pnpm dev
```

Expected output:
```
✔ Environment file loaded successfully
✔ Database connected successfully
Server running on port 5000
Predictive alerts cron scheduled: 0 0 * * * (UTC)
```

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
pnpm install
```

### Step 2: Set Up Environment File

Create `.env` in `frontend/` directory:

```env
VITE_API_URL="http://localhost:5000/api"
VITE_ENV="development"
```

### Step 3: Verify Frontend

```bash
pnpm dev
```

Expected output:
```
  VITE v8.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## AI Service Setup

### Step 1: Create Python Virtual Environment

```bash
cd ai-service

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

Expected output:
```
Successfully installed fastapi-0.115.0 scikit-learn-1.5.0 ...
```

### Step 3: Create Environment File

Create `.env` in `ai-service/` directory:

```env
# FastAPI Configuration
HOST="0.0.0.0"
PORT=8000
DEBUG=true

# Model Configuration
MODEL_NAME="sentence-transformers/all-MiniLM-L6-v2"
```

### Step 4: Verify AI Service

```bash
python -m uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

Access Swagger UI: http://localhost:8000/docs

---

## Environment Configuration

### Backend `.env` Details

```env
# DATABASE_URL: Connection string for main database
# Format: Server=host;Database=name;User Id=user;Password=pwd;
DATABASE_URL="Server=localhost;Database=CorporatePM;User Id=pmuser;Password=YourPassword123!;"

# SHADOW_DATABASE_URL: Separate database for schema diff detection
# Must be same server, different database name
SHADOW_DATABASE_URL="Server=localhost;Database=CorporatePM_shadow;User Id=pmuser;Password=YourPassword123!;"

# JWT_SECRET: Secret key for signing JWTs
# Must be long and random (use: openssl rand -hex 32)
JWT_SECRET="abc123xyz789abc123xyz789abc123xyz789abc123xyz789abc123xyz789"

# AI_SERVICE_URL: URL of the AI service
AI_SERVICE_URL="http://localhost:8000"

# Port number
PORT=5000

# Node environment
NODE_ENV="development" # or "production"

# Logging level
LOG_LEVEL="debug" # debug, info, warn, error

# Cron job configuration
DISABLE_PREDICTIVE_ALERTS_CRON="0" # Set to "1" to disable
PREDICTIVE_ALERTS_CRON="0 0 * * *"  # Cron schedule (daily at midnight UTC)
```

### Frontend `.env` Details

```env
# VITE_API_URL: Backend API URL
VITE_API_URL="http://localhost:5000/api"

# Environment
VITE_ENV="development" # or "production"

# Optional: Analytics, Feature flags, etc.
# VITE_ANALYTICS_KEY="..."
```

### AI Service `.env` Details

```env
# FastAPI host/port
HOST="0.0.0.0"
PORT=8000

# Debug mode
DEBUG=true

# Model to use for embeddings
MODEL_NAME="sentence-transformers/all-MiniLM-L6-v2"

# Optional: Database caching (future feature)
# CACHE_DIR="./cache"
```

---

## Running the Application

### Terminal Setup (3 terminals required)

#### Terminal 1: Backend

```bash
cd backend
pnpm dev
```

Runs on: `http://localhost:5000`

#### Terminal 2: Frontend

```bash
cd frontend
pnpm dev
```

Runs on: `http://localhost:5173`

#### Terminal 3: AI Service

```bash
cd ai-service
source venv/bin/activate  # Windows: venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```

Runs on: `http://localhost:8000`

### All-In-One (Optional: Using Process Manager)

Install PM2 globally:
```bash
npm install -g pm2
```

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'cd backend && pnpm dev',
      cwd: './',
      env: { NODE_ENV: 'development' }
    },
    {
      name: 'frontend',
      script: 'cd frontend && pnpm dev',
      cwd: './',
    },
    {
      name: 'ai-service',
      script: 'cd ai-service && python -m uvicorn main:app --reload',
      interpreter: 'bash',
      cwd: './',
      env: { PYTHONUNBUFFERED: 1 }
    }
  ]
}
```

Start all:
```bash
pm2 start ecosystem.config.js
pm2 logs  # View all logs
```

---

## Verifying Installation

### Checklist

- [ ] Backend running on http://localhost:5000
- [ ] Frontend accessible on http://localhost:5173
- [ ] AI Service on http://localhost:8000
- [ ] Database connection working
- [ ] No error messages in console

### Testing Endpoints

1. **Backend Health**
   ```bash
   curl http://localhost:5000/health
   # Response: {"status":"Backend running ✓"}
   ```

2. **AI Service**
   ```bash
   curl http://localhost:8000/docs
   # Should load Swagger UI
   ```

3. **Frontend**
   - Open http://localhost:5173 in browser
   - Should see login page

4. **Database Connection**
   ```bash
   # From backend directory
   npx prisma studio
   # Opens database viewer on http://localhost:5555
   ```

### Test User Credentials

Default test users (if seeded):

```
Email: admin@example.com
Password: Admin123!
Role: Admin

Email: manager@example.com
Password: Manager123!
Role: Manager

Email: staff@example.com
Password: Staff123!
Role: Staff
```

If no default users exist, create one through registration page.

---

## Troubleshooting Setup Issues

### Backend Issues

#### Port 5000 Already in Use

**Windows:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### Database Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:1433
```

**Solutions:**
1. Verify SQL Server is running: `sqlcmd -S localhost`
2. Check connection string in `.env`
3. Verify credentials are correct
4. For Azure: Check firewall rules allow your IP

#### Prisma Migration Failed

```
Error: Migration lock is being held
```

**Solution:**
```bash
# Release lock
npx prisma migrate resolve --rolled-back <migration_name>

# Or reset database (WARNING: data loss)
npx prisma migrate reset --force
```

### Frontend Issues

#### Port 5173 Already in Use

```bash
# Find and kill process
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows
```

#### Blank Page or 404 Errors

1. Check API URL in `.env`: `VITE_API_URL="http://localhost:5000/api"`
2. Verify backend is running
3. Check browser console for CORS errors
4. Clear browser cache: Ctrl+Shift+Delete

#### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### AI Service Issues

#### Module Import Errors

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

#### CUDA/GPU Not Found

If using GPU-accelerated models:
```bash
# Install CPU-only version
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### General Issues

#### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:** Verify frontend URL in backend `src/index.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',  // Make sure this matches
    'https://your-production-url'
  ],
  credentials: true
}))
```

#### 401 Unauthorized on API Calls

**Error:** `Unauthorized` when calling protected endpoints

**Solutions:**
1. Login first and get token
2. Check token is stored in localStorage
3. Verify Authorization header format: `Bearer <TOKEN>`
4. Check JWT_SECRET matches between sessions

#### Timeout Errors

If services are slow to start:
1. Increase timeout in client (React Query, Axios)
2. Check available RAM/CPU
3. Check disk I/O speed (especially on shared networks)

---

## Development Setup

### IDE Configuration (VS Code)

1. **Install Extensions**
   ```
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - Python
   - Pylance
   - Thunder Client (for API testing)
   ```

2. **Configure Settings** (`.vscode/settings.json`)
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "[python]": {
       "editor.defaultFormatter": "ms-python.python",
       "editor.formatOnSave": true
     },
     "python.linting.pylintEnabled": true
   }
   ```

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
pytest tests/          # Run all
pytest tests/ -v      # Verbose
pytest tests/ --cov   # With coverage
```

---

## Docker Setup (Optional)

### Complete Docker Environment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # SQL Server Database
  mssql:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      SA_PASSWORD: "YourStrongPassword123!"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
    volumes:
      - sql_data:/var/opt/mssql
    healthcheck:
      test: ["CMD", "/opt/mssql-tools/bin/sqlcmd", "-S", "localhost", "-U", "sa", "-P", "YourStrongPassword123!", "-Q", "SELECT 1"]
      interval: 10s
      timeout: 10s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: "Server=mssql;Database=CorporatePM;User Id=sa;Password=YourStrongPassword123!;"
      SHADOW_DATABASE_URL: "Server=mssql;Database=CorporatePM_shadow;User Id=sa;Password=YourStrongPassword123!;"
      JWT_SECRET: "your-secret-key"
      AI_SERVICE_URL: "http://ai-service:8000"
      NODE_ENV: "development"
    depends_on:
      mssql:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: "http://localhost:5000/api"
    volumes:
      - ./frontend:/app
      - /app/node_modules

  # AI Service
  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      PORT: 8000
      DEBUG: "true"
    volumes:
      - ./ai-service:/app

volumes:
  sql_data:

networks:
  default:
    name: corporate-pm-network
```

### Run with Docker

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- AI Service: http://localhost:8000
- SQL Server: localhost:1433

---

## Next Steps

1. **Create test accounts** in the application
2. **Populate sample data** for testing
3. **Configure email** (optional) for alerts
4. **Set up monitoring** and logging
5. **Read DEVELOPMENT_GUIDE.md** for workflow

---

**Setup Version**: 1.0
**Last Updated**: May 1, 2026
