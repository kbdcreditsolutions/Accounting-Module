import { readBody, send, requireAuth } from './_lib/db.js'

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://rrqrxgvyydywwielitgs.supabase.co'
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  ''

export default async function handler(req, res) {
  try {
    const auth = await requireAuth(req, res)
    if (!auth) return

    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

    const body = await readBody(req)
    const { fileBase64, mimeType, filename } = body || {}

    if (!fileBase64 || !mimeType || !filename) {
      return send(res, 400, { error: 'Missing fileBase64, mimeType, or filename' })
    }

    if (!SUPABASE_KEY) {
      return send(res, 503, { error: 'Storage not configured' })
    }

    const companyId = auth.user.company_id
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
    const path = `${companyId}/${Date.now()}-${safeName}`

    const buf = Buffer.from(fileBase64, 'base64')

    // Build auth headers — same logic as sbHeaders() in db.js
    const authHeaders = { apikey: SUPABASE_KEY }
    if (SUPABASE_KEY.split('.').length === 3) authHeaders.Authorization = `Bearer ${SUPABASE_KEY}`

    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/Receipts/${path}`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': mimeType },
      body: buf,
    })

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => '')
      console.error('Supabase Storage upload failed:', uploadRes.status, text)
      return send(res, 500, { error: 'Upload failed' })
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/Receipts/${path}`
    return send(res, 200, { url })
  } catch (err) {
    console.error('upload error:', err)
    return send(res, 500, { error: 'Server error during upload' })
  }
}
