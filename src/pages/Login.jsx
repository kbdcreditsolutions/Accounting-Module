import React, { useState } from 'react'
import { useAuth } from '../auth.jsx'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username.trim(), password)
      window.location.hash = '#/dashboard'
    } catch (err) {
      setError(err.message || 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-deep text-2xl font-bold text-white shadow-md">₹</div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Sign in to your books</h1>
          <p className="mt-1 text-sm text-ink-2">GST Billing &amp; Accounts — company login</p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-grid bg-surface-1 p-6 shadow-sm">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-2">Login ID</span>
            <input
              className="w-full rounded-lg border border-baseline bg-white px-3 py-2 text-sm outline-none focus:border-series-1 focus:ring-2 focus:ring-blue-100"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-ink-2">Password</span>
            <input
              type="password"
              className="w-full rounded-lg border border-baseline bg-white px-3 py-2 text-sm outline-none focus:border-series-1 focus:ring-2 focus:ring-blue-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-status-critical">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !username.trim() || !password}
            className="mt-5 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Each company sees only its own books. Need access? Ask your administrator.
        </p>
      </div>
    </div>
  )
}
