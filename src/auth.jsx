import React, { createContext, useContext, useMemo, useState } from 'react'

const TOKEN_KEY = 'kbd-books-session'
const USER_KEY = 'kbd-books-user'

const AuthCtx = createContext(null)

export async function api(path, { method = 'GET', body, token } = {}) {
  const t = token ?? localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`/api/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let payload = null
  try { payload = await res.json() } catch { /* non-JSON error body */ }
  if (!res.ok) {
    const err = new Error(payload?.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return payload
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
  })

  const value = useMemo(() => ({
    token,
    user,
    async login(username, password) {
      const out = await api('login', { method: 'POST', body: { username, password }, token: '' })
      localStorage.setItem(TOKEN_KEY, out.token)
      localStorage.setItem(USER_KEY, JSON.stringify(out.user))
      setToken(out.token)
      setUser(out.user)
      return out.user
    },
    async logout() {
      try { await api('logout', { method: 'POST' }) } catch { /* session already gone */ }
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setToken(null)
      setUser(null)
      window.location.hash = '#/'
    },
    // called when the API answers 401 — clears the stale session
    sessionExpired() {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setToken(null)
      setUser(null)
    },
  }), [token, user])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
