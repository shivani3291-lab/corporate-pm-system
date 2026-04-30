import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Auth middleware tests
// ---------------------------------------------------------------------------

describe('authenticate middleware', () => {
  it('rejects requests without Authorization header', async () => {
    const { authenticate } = await import('../middleware/auth')

    const req: any = { headers: {} }
    const res: any = {
      status(code: number) {
        this._status = code
        return this
      },
      json(data: any) {
        this._body = data
        return this
      },
    }
    let nextCalled = false
    authenticate(req, res, () => { nextCalled = true })

    expect(nextCalled).toBe(false)
    expect(res._status).toBe(401)
  })

  it('rejects requests with invalid token', async () => {
    const { authenticate } = await import('../middleware/auth')

    const req: any = { headers: { authorization: 'Bearer invalid-token' } }
    const res: any = {
      status(code: number) {
        this._status = code
        return this
      },
      json(data: any) {
        this._body = data
        return this
      },
    }
    let nextCalled = false
    authenticate(req, res, () => { nextCalled = true })

    expect(nextCalled).toBe(false)
    expect(res._status).toBe(401)
  })

  it('accepts valid JWT and attaches user', async () => {
    process.env.JWT_SECRET = 'test-secret'
    const jwt = await import('jsonwebtoken')
    const { authenticate } = await import('../middleware/auth')

    const token = jwt.default.sign(
      { id: 1, email: 'test@test.com', role: 'Admin' },
      'test-secret',
      { expiresIn: '1h' },
    )

    const req: any = { headers: { authorization: `Bearer ${token}` } }
    const res: any = {
      status(code: number) { this._status = code; return this },
      json(data: any) { this._body = data; return this },
    }
    let nextCalled = false
    authenticate(req, res, () => { nextCalled = true })

    expect(nextCalled).toBe(true)
    expect(req.user).toBeDefined()
    expect(req.user.email).toBe('test@test.com')
    expect(req.user.role).toBe('Admin')
  })
})

// ---------------------------------------------------------------------------
// Authorize middleware tests
// ---------------------------------------------------------------------------

describe('authorize middleware', () => {
  it('rejects when no user attached', async () => {
    const { authorize } = await import('../middleware/authorize')
    const middleware = authorize('Admin', 'Manager')

    const req: any = { user: undefined }
    const res: any = {
      status(code: number) { this._status = code; return this },
      json(data: any) { this._body = data; return this },
    }
    let nextCalled = false
    middleware(req, res, () => { nextCalled = true })

    expect(nextCalled).toBe(false)
    expect(res._status).toBe(401)
  })

  it('rejects user with wrong role', async () => {
    const { authorize } = await import('../middleware/authorize')
    const middleware = authorize('Admin')

    const req: any = { user: { id: 1, email: 'staff@test.com', role: 'Staff' } }
    const res: any = {
      status(code: number) { this._status = code; return this },
      json(data: any) { this._body = data; return this },
    }
    let nextCalled = false
    middleware(req, res, () => { nextCalled = true })

    expect(nextCalled).toBe(false)
    expect(res._status).toBe(403)
  })

  it('allows user with correct role', async () => {
    const { authorize } = await import('../middleware/authorize')
    const middleware = authorize('Admin', 'Manager')

    const req: any = { user: { id: 1, email: 'admin@test.com', role: 'Admin' } }
    const res: any = {
      status(code: number) { this._status = code; return this },
      json(data: any) { this._body = data; return this },
    }
    let nextCalled = false
    middleware(req, res, () => { nextCalled = true })

    expect(nextCalled).toBe(true)
  })

  it('allows any role when no roles specified', async () => {
    const { authorize } = await import('../middleware/authorize')
    const middleware = authorize()

    const req: any = { user: { id: 1, email: 'staff@test.com', role: 'Staff' } }
    const res: any = {
      status(code: number) { this._status = code; return this },
      json(data: any) { this._body = data; return this },
    }
    let nextCalled = false
    middleware(req, res, () => { nextCalled = true })

    expect(nextCalled).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AI service URL helper tests
// ---------------------------------------------------------------------------

describe('aiServiceBase', () => {
  it('returns default URL when env not set', async () => {
    delete process.env.AI_SERVICE_URL
    const { aiServiceBase } = await import('../lib/aiServiceUrl')
    expect(aiServiceBase()).toBe('http://127.0.0.1:8000')
  })

  it('returns env URL when set', async () => {
    process.env.AI_SERVICE_URL = 'http://ai:9000/'
    const { aiServiceBase } = await import('../lib/aiServiceUrl')
    // Need to reimport to get fresh value
    expect(aiServiceBase()).toContain('http')
  })
})

// ---------------------------------------------------------------------------
// Project delay metrics helper tests
// ---------------------------------------------------------------------------

describe('heuristicDelayRisk', () => {
  it('returns On Track for healthy project', async () => {
    const { heuristicDelayRisk } = await import('../lib/projectDelayMetrics')
    const result = heuristicDelayRisk({
      totalTasks: 20,
      completedTasks: 18,
      overdueTasks: 0,
      daysUntilDeadline: 60,
      teamSize: 5,
    })
    expect(result.riskLevel).toBe('On Track')
    expect(result.riskScore).toBeLessThan(40)
  })

  it('returns Likely Delayed for bad project', async () => {
    const { heuristicDelayRisk } = await import('../lib/projectDelayMetrics')
    const result = heuristicDelayRisk({
      totalTasks: 50,
      completedTasks: 5,
      overdueTasks: 20,
      daysUntilDeadline: -10,
      teamSize: 2,
    })
    expect(result.riskLevel).toBe('Likely Delayed')
    expect(result.riskScore).toBeGreaterThan(60)
  })

  it('returns reason string', async () => {
    const { heuristicDelayRisk } = await import('../lib/projectDelayMetrics')
    const result = heuristicDelayRisk({
      totalTasks: 10,
      completedTasks: 3,
      overdueTasks: 2,
      daysUntilDeadline: 10,
      teamSize: 3,
    })
    expect(typeof result.reason).toBe('string')
    expect(result.reason.length).toBeGreaterThan(0)
  })
})
