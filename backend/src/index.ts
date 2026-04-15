import * as dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import employeeRoutes from './routes/employees'
import projectRoutes from './routes/projects'
import taskRoutes from './routes/tasks'
import documentRoutes from './routes/documents'
import categoryRoutes from './routes/categories'

const app = express()
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'Backend running ✓' })
})

app.use('/api/auth', authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/categories', categoryRoutes)

app.listen(Number(process.env.PORT) || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
)