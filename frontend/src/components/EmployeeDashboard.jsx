import { useCallback, useEffect, useState } from 'react'
import {
  getApplications,
  getCustomers,
  getLoans,
  patchApplicationReview,
} from '../api.js'

export default function EmployeeDashboard({ session, onLogout }) {
  const employeeId = session.employee_id
  const [applications, setApplications] = useState([])
  const [loans, setLoans] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [flash, setFlash] = useState(null)
  const [denyFor, setDenyFor] = useState(null)
  const [denyReason, setDenyReason] = useState('')

  const showFlash = useCallback((text, ok = true) => {
    setFlash({ text, ok })
    window.setTimeout(() => setFlash(null), 5000)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [apps, ls, custs] = await Promise.all([
        getApplications(),
        getLoans(),
        getCustomers(),
      ])
      setApplications(Array.isArray(apps) ? apps : [])
      setLoans(Array.isArray(ls) ? ls : [])
      setCustomers(Array.isArray(custs) ? custs : [])
    } catch (e) {
      showFlash(e.message || 'Failed to load data', false)
    } finally {
      setLoading(false)
    }
  }, [showFlash])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function approve(applicationId) {
    setBusyId(applicationId)
    try {
      await patchApplicationReview(applicationId, {
        employee_id: employeeId,
        status: 'approved',
      })
      showFlash('Application approved.')
      await refresh()
    } catch (e) {
      showFlash(e.message || 'Approve failed', false)
    } finally {
      setBusyId(null)
    }
  }

  async function deny(applicationId) {
    const reason = (denyReason || '').trim() || 'N/A'
    setBusyId(applicationId)
    try {
      await patchApplicationReview(applicationId, {
        employee_id: employeeId,
        status: 'denied',
        denial_reason: reason,
      })
      showFlash('Application denied.')
      setDenyFor(null)
      setDenyReason('')
      await refresh()
    } catch (e) {
      showFlash(e.message || 'Deny failed', false)
    } finally {
      setBusyId(null)
    }
  }

  const empName = session.profile
    ? `${session.profile.first_name} ${session.profile.last_name}`
    : `Employee #${employeeId}`

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h1>{empName}</h1>
          <p className="subtle">Employee #{employeeId}</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onLogout}>
          Log out
        </button>
      </header>

      {flash && (
        <p className={flash.ok ? 'msg msg-success' : 'msg msg-error'} role="status">
          {flash.text}
        </p>
      )}

      {loading && <p className="subtle">Loading…</p>}

      {!loading && (
        <>
          <section className="card">
            <h2>Loan applications</h2>
            {applications.length === 0 ? (
              <p className="subtle">None.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>application_id</th>
                      <th>customer</th>
                      <th>requested_amount</th>
                      <th>interest_rate</th>
                      <th>term_months</th>
                      <th>application_date</th>
                      <th>status</th>
                      <th>reviewed_by</th>
                      <th>reviewed_at</th>
                      <th>denial_reason</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((r) => (
                      <tr key={r.application_id}>
                        <td>{r.application_id}</td>
                        <td>
                          {r.customer_first_name} {r.customer_last_name}{' '}
                          <span className="subtle">({r.customer_id})</span>
                        </td>
                        <td>{String(r.requested_amount)}</td>
                        <td>{String(r.interest_rate)}</td>
                        <td>{r.term_months}</td>
                        <td>{formatDate(r.application_date)}</td>
                        <td>
                          <span className={pillApp(r.status)}>{r.status}</span>
                        </td>
                        <td>{r.reviewed_by || '—'}</td>
                        <td>{formatReviewedAt(r.status, r.reviewed_at)}</td>
                        <td>{r.denial_reason ?? '—'}</td>
                        <td className="cell-actions">
                          {r.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="btn-small btn-approve"
                                disabled={busyId === r.application_id}
                                onClick={() => approve(r.application_id)}
                              >
                                Approve
                              </button>
                              {denyFor === r.application_id ? (
                                <span className="deny-inline">
                                  <input
                                    type="text"
                                    placeholder="denial_reason"
                                    value={denyReason}
                                    onChange={(e) => setDenyReason(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="btn-small btn-deny"
                                    disabled={busyId === r.application_id}
                                    onClick={() => deny(r.application_id)}
                                  >
                                    Confirm deny
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-small btn-secondary"
                                    onClick={() => {
                                      setDenyFor(null)
                                      setDenyReason('')
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-small btn-deny"
                                  onClick={() => {
                                    setDenyFor(r.application_id)
                                    setDenyReason('')
                                  }}
                                >
                                  Deny
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <h2>Loans</h2>
            {loans.length === 0 ? (
              <p className="subtle">None.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>loan_id</th>
                      <th>customer</th>
                      <th>initial_balance</th>
                      <th>current_balance</th>
                      <th>interest_rate</th>
                      <th>loan_start_date</th>
                      <th>status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((r) => (
                      <tr key={r.loan_id}>
                        <td>{r.loan_id}</td>
                        <td>
                          {r.customer_first_name} {r.customer_last_name}{' '}
                          <span className="subtle">({r.customer_id})</span>
                        </td>
                        <td>{String(r.initial_balance)}</td>
                        <td>{String(r.current_balance)}</td>
                        <td>{String(r.interest_rate)}</td>
                        <td>{formatDate(r.loan_start_date)}</td>
                        <td>
                          <span className={pillLoan(r.status)}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <h2>Customers</h2>
            {customers.length === 0 ? (
              <p className="subtle">None.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>customer_id</th>
                      <th>first_name</th>
                      <th>last_name</th>
                      <th>email</th>
                      <th>phone</th>
                      <th>balance</th>
                      <th>credit_score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((r) => (
                      <tr key={r.customer_id}>
                        <td>{r.customer_id}</td>
                        <td>{r.first_name}</td>
                        <td>{r.last_name}</td>
                        <td>{r.email}</td>
                        <td>{r.phone ?? '—'}</td>
                        <td>{String(r.balance)}</td>
                        <td>{r.credit_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function formatDate(v) {
  if (v == null || v === '') return '—'
  const d = typeof v === 'string' ? new Date(v) : v
  if (Number.isNaN(d.getTime?.())) return String(v)
  return d.toLocaleString()
}

function formatReviewedAt(status, v) {
  if (status === 'pending') return '—'
  if (v == null || v === '') return '—'
  const d = typeof v === 'string' ? new Date(v) : v
  if (Number.isNaN(d.getTime?.())) return '—'
  if (d.getFullYear() < 2000) return '—'
  return d.toLocaleString()
}

function pillApp(status) {
  if (status === 'pending') return 'pill pill-pending'
  if (status === 'approved') return 'pill pill-approved'
  if (status === 'denied') return 'pill pill-denied'
  return 'pill'
}

function pillLoan(status) {
  if (status === 'active') return 'pill pill-approved'
  if (status === 'paid_off') return 'pill pill-neutral'
  return 'pill'
}
