import { db, verifyPassword, readBody, send, publicUser, missingProdConfig, PROD_CONFIG_HINT } from './_lib/db.js'

const SESSION_DAYS = 30

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
  if (missingProdConfig) return send(res, 500, { error: PROD_CONFIG_HINT })
  try {
    const { username, password } = await readBody(req)
    if (!username || !password) return send(res, 400, { error: 'Enter your ID and password' })

    const user = await db.getUserByUsername(String(username).trim())
    if (!user || !verifyPassword(String(password), user.password_hash)) {
      return send(res, 401, { error: 'Invalid ID or password' })
    }
    if (!user.active) return send(res, 403, { error: 'This account has been disabled' })

    const company = await db.getCompanyById(user.company_id)
    const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000).toISOString()
    const session = await db.createSession({ user_id: user.id, expires_at: expires })

    return send(res, 200, { token: session.token, user: publicUser(user, company) })
  } catch (err) {
    console.error('login error:', err)
    return send(res, 500, { error: 'Server error while signing in. Check the database connection.' })
  }
}
