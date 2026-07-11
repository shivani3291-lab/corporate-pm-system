import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string }
}

// Login is disabled for this public demo build — every request is treated as
// this demo Admin user so the app is browsable without credentials.
const DEMO_USER = { id: 1, email: 'demo@echelon.dev', role: 'Admin' }

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = DEMO_USER
    return next()
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number; email: string; role: string
    }
    req.user = decoded
  } catch {
    req.user = DEMO_USER
  }
  next()
}