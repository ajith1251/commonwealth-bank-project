import express from 'express'
import cors from 'cors'
import { initialiseDatabase } from './database'
import { mountRoutes } from './routes'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

const PORT = parseInt(process.env.PORT ?? '5203', 10)
const app = express()

// ── Middleware ─────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Database ───────────────────────────────────────────────────────────
const db = initialiseDatabase()

// ── Routes ─────────────────────────────────────────────────────────────
mountRoutes(app, db)

// ── Error handling ─────────────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Start ──────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`CommBank Goal Tracker API running on http://localhost:${PORT}`)
  console.log(`  GET    /api/Goal              — List all goals`)
  console.log(`  GET    /api/Goal/:id           — Get goal by ID`)
  console.log(`  GET    /api/Goal/ForUser/:id   — Get goals for user`)
  console.log(`  POST   /api/Goal               — Create goal`)
  console.log(`  PUT    /api/Goal/:id           — Update goal`)
  console.log(`  DELETE /api/Goal/:id           — Delete goal`)
  console.log(`  GET    /api/health             — Health check`)
})

// ── Graceful Shutdown ──────────────────────────────────────────────────
function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`)
  server.close(() => {
    console.log('HTTP server closed.')
    try {
      db.close()
      console.log('Database connection closed.')
    } catch {
      // Ignore close errors
    }
    process.exit(0)
  })

  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout.')
    process.exit(1)
  }, 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

export default app
