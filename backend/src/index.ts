import 'dotenv/config'
import express, { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import { authMiddleware } from './middleware/auth.middleware.js'
import { errorHandler } from './middleware/error.middleware.js'
import { swaggerSpec } from './lib/swagger.js'
import flowRoutes from './routes/flow.routes.js'
import historyRoutes from './routes/history.routes.js'

const app: Express = express()
const PORT = process.env.PORT ?? 3000

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(express.json())

// ── Swagger UI (no auth required) ─────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Wysa Flow API Docs',
    swaggerOptions: {
      persistAuthorization: true,   // keeps x-user-email filled across page reloads
      displayRequestDuration: true, // shows response time in ms
      filter: true,                 // top search bar
      tryItOutEnabled: true,        // "Try it out" open by default
    },
  }),
)

// Expose raw OpenAPI JSON for tooling (Postman import, etc.)
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

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
  console.log(`🚀  Server listening  → http://localhost:${PORT}`)
  console.log(`📖  Swagger UI        → http://localhost:${PORT}/api-docs`)
  console.log(`📄  OpenAPI JSON      → http://localhost:${PORT}/api-docs.json`)
  console.log(`📋  Health check      → http://localhost:${PORT}/health`)
})

export default app
