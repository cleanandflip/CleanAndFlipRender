import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { Pool } from 'pg'
import { APP_ENV, PORT, FRONTEND_ORIGIN, DATABASE_URL } from './config'
import { jsonErrorHandler } from './middleware/error'
import { registerRoutes } from './routes'
import { initWebSocket } from './websocket'

const app = express()
app.disable('x-powered-by')
app.use(express.json())
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }))

// Health check (Render uses this)
app.get('/healthz', (_req, res) => res.status(200).send('ok'))

// API routes
registerRoutes(app)

// Optional DB check
let pool: Pool | undefined
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: APP_ENV === 'production' }
  })
  app.get('/api/db-check', async (_req, res) => {
    try {
      const r = await pool!.query('select 1 as up')
      res.json({ db: 'up', result: r.rows[0] })
    } catch (e: any) {
      res.status(500).json({ db: 'down', error: e?.message || String(e) })
    }
  })
}

// JSON error handler
app.use(jsonErrorHandler)

// Share the same HTTP port for HTTP + WebSockets (required on Render)
const server = createServer(app)
initWebSocket(server)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`)
})
