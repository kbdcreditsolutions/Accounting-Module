import { db, usingMemoryDb, send } from './_lib/db.js'

// Deployment diagnostic: GET /api/health
// Reports which key the server found, whether the database answers, and
// whether the seed companies/logins exist. Never returns secrets.
export default async function handler(req, res) {
  const keySource = process.env.SUPABASE_SECRET_KEY ? 'SUPABASE_SECRET_KEY'
    : process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY'
    : process.env.SUPABASE_SERVICE_KEY ? 'SUPABASE_SERVICE_KEY'
    : 'none'

  const out = {
    platform: process.env.VERCEL ? 'vercel' : 'local',
    keyFound: keySource,
    storage: usingMemoryDb ? 'in-memory (no Supabase key detected)' : 'supabase',
  }

  try {
    const [companies, users] = await Promise.all([db.listCompanies(), db.listUsers()])
    out.database = 'connected'
    out.companies = companies.map((c) => c.name)
    out.logins = users.length
    out.ready = !usingMemoryDb && companies.length > 0 && users.length > 0
    out.hint = out.ready
      ? 'All good — go to the home page and sign in.'
      : usingMemoryDb
        ? 'Add SUPABASE_SECRET_KEY under Vercel → Settings → Environment Variables, then redeploy.'
        : 'Database reached, but no companies/logins found — run supabase/setup.sql in the Supabase SQL Editor.'
  } catch (err) {
    out.database = 'error'
    out.error = String(err?.message || err).slice(0, 300)
    out.ready = false
    out.hint = 'The database did not answer. Check that the key value is the sb_secret_… key and that supabase/setup.sql has been run.'
  }

  send(res, 200, out)
}
