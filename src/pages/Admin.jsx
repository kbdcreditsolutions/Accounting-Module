import React, { useEffect, useState } from 'react'
import { api, useAuth } from '../auth.jsx'
import { Card, Button, PageHeader, Field, Input, Select, Modal, Empty } from '../components/ui.jsx'

export default function Admin() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [showCompany, setShowCompany] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [created, setCreated] = useState(null) // {username, password, companyName} to share

  const refresh = () => {
    api('admin')
      .then(setData)
      .catch((err) => setError(err.message))
  }
  useEffect(refresh, [])

  if (user?.role !== 'superadmin') {
    return <Empty>Admin access required.</Empty>
  }
  if (error) return <Empty>{error}</Empty>
  if (!data) return <Empty>Loading…</Empty>

  const companyName = (id) => data.companies.find((c) => c.id === id)?.name || '—'

  return (
    <div>
      <PageHeader
        title="Admin Portal"
        subtitle="Create companies and give people login access — each company sees only its own books"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCompany(true)}>+ Add Company</Button>
            <Button onClick={() => setShowUser(true)}>+ Add User</Button>
          </>
        }
      />

      {created && (
        <Card className="mb-4 border-l-4 border-l-status-good p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="text-sm">
              <div className="font-semibold">Login created — share these credentials:</div>
              <div className="tnum mt-1 rounded-lg bg-gray-50 px-3 py-2 font-mono text-sm">
                Company: {created.companyName}<br />
                Login ID: {created.username}<br />
                Password: {created.password}
              </div>
              <p className="mt-1 text-xs text-ink-muted">The password is not shown again — copy it now. You can reset it any time.</p>
            </div>
            <Button variant="ghost" onClick={() => setCreated(null)}>Dismiss</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <div className="border-b border-grid px-5 py-3.5">
            <h3 className="text-sm font-semibold">Companies ({data.companies.length})</h3>
          </div>
          <ul>
            {data.companies.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b border-grid px-5 py-3 text-sm last:border-0">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-ink-muted">code: {c.code}</div>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-ink-2">
                  {data.users.filter((u) => u.company_id === c.id).length} users
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="xl:col-span-2">
          <div className="border-b border-grid px-5 py-3.5">
            <h3 className="text-sm font-semibold">Users ({data.users.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th className="px-5 py-3 font-medium">Login ID</th>
                <th className="px-3 py-3 font-medium">Company</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-t border-grid">
                  <td className="px-5 py-3">
                    <div className="font-medium">{u.username}</div>
                    {u.display_name && u.display_name !== u.username && (
                      <div className="text-xs text-ink-muted">{u.display_name}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-ink-2">{companyName(u.company_id)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'superadmin' ? 'bg-blue-50 text-brand' : 'bg-gray-100 text-ink-2'}`}>
                      {u.role === 'superadmin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium ${u.active ? 'text-good-text' : 'text-status-critical'}`}>
                      {u.active ? '● Active' : '● Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      className="mr-3 text-xs font-medium text-brand hover:underline"
                      onClick={async () => {
                        const pw = prompt(`New password for ${u.username} (min 6 characters):`)
                        if (!pw) return
                        try {
                          await api('admin', { method: 'POST', body: { action: 'resetPassword', userId: u.id, password: pw } })
                          setCreated({ username: u.username, password: pw, companyName: companyName(u.company_id) })
                        } catch (err) { alert(err.message) }
                      }}
                    >
                      Reset password
                    </button>
                    {u.id !== user.id && (
                      <button
                        className={`text-xs font-medium hover:underline ${u.active ? 'text-status-critical' : 'text-good-text'}`}
                        onClick={async () => {
                          try {
                            await api('admin', { method: 'POST', body: { action: 'setUserActive', userId: u.id, active: !u.active } })
                            refresh()
                          } catch (err) { alert(err.message) }
                        }}
                      >
                        {u.active ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <AddCompanyModal open={showCompany} onClose={() => setShowCompany(false)} onDone={refresh} />
      <AddUserModal
        open={showUser}
        onClose={() => setShowUser(false)}
        companies={data.companies}
        onDone={(cred) => { setCreated(cred); refresh() }}
      />
    </div>
  )
}

function AddCompanyModal({ open, onClose, onDone }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setBusy(true); setError('')
    try {
      await api('admin', { method: 'POST', body: { action: 'createCompany', name } })
      setName('')
      onDone()
      onClose()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Company">
      <div className="space-y-4">
        <Field label="Company Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SRIDATRI PHYSIO CARE" />
        </Field>
        <p className="text-xs text-ink-muted">
          A new company starts with empty books. Its details (GSTIN, address, bank) are filled in under
          Settings after its user signs in.
        </p>
        {error && <p className="text-sm text-status-critical">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={busy || !name.trim()} onClick={submit}>{busy ? 'Creating…' : 'Create Company'}</Button>
        </div>
      </div>
    </Modal>
  )
}

function AddUserModal({ open, onClose, companies, onDone }) {
  const [form, setForm] = useState({ username: '', password: '', companyId: '', displayName: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, companyId: f.companyId || companies[0]?.id || '' }))
  }, [open, companies])

  const genPassword = () => {
    const words = ['Care', 'Trust', 'Prime', 'Swift', 'Bright', 'Solid']
    const w = words[Math.floor(Math.random() * words.length)]
    const n = Math.floor(100 + Math.random() * 900)
    setForm((f) => ({ ...f, password: `${w}@${n}${new Date().getFullYear()}` }))
  }

  const submit = async () => {
    setBusy(true); setError('')
    try {
      await api('admin', {
        method: 'POST',
        body: { action: 'createUser', ...form },
      })
      const companyName = companies.find((c) => c.id === form.companyId)?.name || ''
      onDone({ username: form.username, password: form.password, companyName })
      setForm({ username: '', password: '', companyId: companies[0]?.id || '', displayName: '' })
      onClose()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add User" wide>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Company" required>
          <Select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Display Name">
          <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </Field>
        <Field label="Login ID" required>
          <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </Field>
        <Field label="Password (min 6 chars)" required>
          <div className="flex gap-2">
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Button variant="secondary" onClick={genPassword}>Generate</Button>
          </div>
        </Field>
        {error && <p className="text-sm text-status-critical md:col-span-2">{error}</p>}
        <div className="flex justify-end gap-2 md:col-span-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={busy || !form.username.trim() || form.password.length < 6 || !form.companyId}
            onClick={submit}
          >
            {busy ? 'Creating…' : 'Create User'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
