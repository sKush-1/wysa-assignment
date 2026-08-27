import 'dotenv/config'
import express, { Express } from 'express'
import { authMiddleware } from './middleware/auth.middleware.js'
import { errorHandler } from './middleware/error.middleware.js'
import flowRoutes from './routes/flow.routes.js'
import historyRoutes from './routes/history.routes.js'

const app: Express = express()
const PORT = process.env.PORT ?? 3000

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(express.json())

// ── Health check (no auth required) ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Protected routes (require x-user-email header) ────────────────────────────
app.use('/api', authMiddleware)
app.use('/api/flow', flowRoutes)
app.use('/api/history', historyRoutes)

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀  Server listening on http://localhost:${PORT}`)
  console.log(`📋  Health: http://localhost:${PORT}/health`)
})

export default app
