import { db, send } from './_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (token) await db.deleteSession(token)
    return send(res, 200, { ok: true })
  } catch (err) {
    console.error('logout error:', err)
    return send(res, 200, { ok: true }) // logging out should never hard-fail for the user
  }
}
