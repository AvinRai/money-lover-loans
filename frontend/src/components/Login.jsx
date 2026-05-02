import { useEffect, useState } from 'react'
import { getCustomer, getCustomers, getEmployee, getEmployees } from '../api.js'

export default function Login({ role, onSuccess, onBack }) {
  const [list, setList] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [manualId, setManualId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const rows = role === 'customer' ? await getCustomers() : await getEmployees()
        if (!cancelled) setList(Array.isArray(rows) ? rows : [])
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load list')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [role])

  useEffect(() => {
    if (selectedId) setManualId(selectedId)
  }, [selectedId])

  async function handleSubmit(e) {
    e.preventDefault()
    const raw = manualId.trim() || selectedId
    const id = parseInt(raw, 10)
    if (Number.isNaN(id) || id <= 0) {
      setError('Enter a valid ID')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (role === 'customer') {
        const customer = await getCustomer(id)
        onSuccess({ role: 'customer', customer_id: customer.customer_id, profile: customer })
      } else {
        const employee = await getEmployee(id)
        onSuccess({ role: 'employee', employee_id: employee.employee_id, profile: employee })
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  const title = role === 'customer' ? 'Customer login' : 'Employee login'
  const idField = role === 'customer' ? 'customer_id' : 'employee_id'

  return (
    <div className="narrow-page">
      <button type="button" className="link-back" onClick={onBack}>
        ← Back
      </button>
      <h1>{title}</h1>
      <p className="subtle">Choose an existing account or enter an {idField}.</p>

      {loading && <p className="subtle">Loading…</p>}
      {error && <p className="msg msg-error">{error}</p>}

      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Account
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loading || list.length === 0}
          >
            <option value="">— Select —</option>
            {list.map((row) => {
              const id = row[idField]
              const label = `${id} — ${row.first_name} ${row.last_name}`
              return (
                <option key={id} value={String(id)}>
                  {label}
                </option>
              )
            })}
          </select>
        </label>
        <label>
          {idField}
          <input
            type="number"
            min="1"
            value={manualId}
            onChange={(e) => {
              setManualId(e.target.value)
              setSelectedId('')
            }}
            placeholder="e.g. 1"
          />
        </label>
        <button type="submit" disabled={submitting || loading}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
