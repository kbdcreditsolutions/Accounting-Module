// Local runner for the Vercel serverless functions in /api.
// Usage: node scripts/dev-api.mjs   (vite dev proxies /api here)
// Without SUPABASE_SECRET_KEY set it uses the in-memory database with the
// same seed logins, so the whole app can be exercised offline.
import http from 'node:http'
import { usingMemoryDb } from '../api/_lib/db.js'
import login from '../api/login.js'
import logout from '../api/logout.js'
import state from '../api/state.js'
import admin from '../api/admin.js'

const routes = {
  '/api/login': login,
  '/api/logout': logout,
  '/api/state': state,
  '/api/admin': admin,
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const handler = routes[url.pathname]
  if (!handler) {
    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }
  try {
    await handler(req, res)
  } catch (err) {
    console.error(err)
    if (!res.headersSent) res.statusCode = 500
    res.end(JSON.stringify({ error: 'Internal error' }))
  }
})

const PORT = process.env.API_PORT || 3011
server.listen(PORT, () => {
  console.log(`API dev server on :${PORT} (${usingMemoryDb ? 'in-memory DB' : 'Supabase'})`)
})
