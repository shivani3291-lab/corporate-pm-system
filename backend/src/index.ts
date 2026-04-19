import * as dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import prisma from './lib/prisma'          // ← add this import
import authRoutes from './routes/auth'
import employeeRoutes from './routes/employees'
import projectRoutes from './routes/projects'
import taskRoutes from './routes/tasks'
import documentRoutes from './routes/documents'
import categoryRoutes from './routes/categories'
import aiRoutes from './routes/ai'
import alertsRoutes from './routes/alerts'
import { runPredictiveAlertsJob } from './jobs/predictiveAlerts'

const app = express()
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://corporate-pm-frontend-bgeyefcjcqgpb9hf.centralindia-01.azurewebsites.net'
  ],
  credentials: true
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
app.use('/api/ai', aiRoutes)
app.use('/api/alerts', alertsRoutes)

const port = Number(process.env.PORT) || 5000

// ✅ Check DB before starting — warn but don't crash
async function checkDbConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (err: any) {
    console.warn('⚠️  Database not reachable on startup.')
    console.warn('   Local dev: run `az login` if using Azure AD auth.')
    console.warn('   Reason:', err.message)
    // Don't exit — requests will get a 503 response until DB is reachable
  }
}

async function main() {
  await checkDbConnection()   // ← runs once on startup

  app.listen(port, () => {
    console.log(`Server running on port ${port}`)

    if (process.env.DISABLE_PREDICTIVE_ALERTS_CRON === '1') {
      console.log('Predictive alerts cron: disabled (DISABLE_PREDICTIVE_ALERTS_CRON=1)')
      return
    }

    const schedule = process.env.PREDICTIVE_ALERTS_CRON || '0 0 * * *'
    cron.schedule(schedule, () => {
      runPredictiveAlertsJob().catch((err) =>
        console.error('[predictive-alerts cron]', err),
      )
    })
    console.log(`Predictive alerts cron scheduled: ${schedule} (UTC)`)
  })
}

main()