import { useCallback, useEffect, useState } from 'react'
import {
  deleteCustomer,
  deleteLoan,
  getApplications,
  getCustomers,
  getLoans,
  getPayments,
  patchApplicationReview,
  patchCustomer,
} from '../api.js'

const TABS = [
  { id: 'applications', label: 'Applications' },
  { id: 'loans', label: 'Loans' },
  { id: 'customers', label: 'Customers' },
  { id: 'payments', label: 'Payments' },
]

const CUSTOMER_EDIT_FIELDS = [
  { key: 'first_name', label: 'First name', type: 'text' },
  { key: 'last_name', label: 'Last name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'home_address', label: 'Home address', type: 'text' },
  { key: 'balance', label: 'Balance ($)', type: 'number' },
  { key: 'salary', label: 'Salary ($)', type: 'number' },
  { key: 'credit_score', label: 'Credit score', type: 'number' },
]

export default function EmployeeDashboard({ session, onLogout }) {
  const employeeId = session.employee_id
  const [applications, setApplications] = useState([])
  const [loans, setLoans] = useState([])
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [flash, setFlash] = useState(null)
  const [activeTab, setActiveTab] = useState('applications')

  // Application denial state
  const [denyFor, setDenyFor] = useState(null)
  const [denyReason, setDenyReason] = useState('')

  // Customer edit state
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editForm, setEditForm] = useState({})

  const showFlash = useCallback((text, ok = true) => {
    setFlash({ text, ok })
    window.setTimeout(() => setFlash(null), 5000)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [apps, ls, custs, pmts] = await Promise.all([
        getApplications(),
        getLoans(),
        getCustomers(),
        getPayments(),
      ])
      setApplications(Array.isArray(apps) ? apps : [])
      setLoans(Array.isArray(ls) ? ls : [])
      setCustomers(Array.isArray(custs) ? custs : [])
      setPayments(Array.isArray(pmts) ? pmts : [])
    } catch (e) {
      showFlash(e.message || 'Failed to load data', false)
    } finally {
      setLoading(false)
    }
  }, [showFlash])

  useEffect(() => {
    refresh()
  }, [refresh])

  // --- Applications ---
  async function approve(applicationId) {
    setBusyId(applicationId)
    try {
      await patchApplicationReview(applicationId, { employee_id: employeeId, status: 'approved' })
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

  // --- Loans ---
  async function handleDeleteLoan(loanId) {
    if (!window.confirm(`Delete loan #${loanId}? This will also remove all its payment records.`))
      return
    setBusyId(`loan-${loanId}`)
    try {
      await deleteLoan(loanId)
      showFlash('Loan deleted.')
      await refresh()
    } catch (e) {
      showFlash(e.message || 'Delete failed', false)
    } finally {
      setBusyId(null)
    }
  }

  // --- Customers ---
  async function handleDeleteCustomer(cust) {
    if (
      !window.confirm(
        `Delete customer "${cust.first_name} ${cust.last_name}" (#${cust.customer_id})?\n\nThis will permanently remove all their loan applications, loans, and payment records.`,
      )
    )
      return
    setBusyId(`cust-${cust.customer_id}`)
    try {
      await deleteCustomer(cust.customer_id)
      showFlash('Customer deleted.')
      await refresh()
    } catch (e) {
      showFlash(e.message || 'Delete failed', false)
    } finally {
      setBusyId(null)
    }
  }

  function startEditCustomer(cust) {
    setEditingCustomer(cust)
    setEditForm({
      first_name: cust.first_name ?? '',
      last_name: cust.last_name ?? '',
      email: cust.email ?? '',
      phone: cust.phone ?? '',
      home_address: cust.home_address ?? '',
      balance: cust.balance != null ? String(cust.balance) : '',
      salary: cust.salary != null ? String(cust.salary) : '',
      credit_score: cust.credit_score != null ? String(cust.credit_score) : '',
    })
  }

  async function handleEditCustomerSubmit(e) {
    e.preventDefault()
    const id = editingCustomer.customer_id
    setBusyId(`edit-cust-${id}`)
    try {
      const body = {}
      for (const { key, type } of CUSTOMER_EDIT_FIELDS) {
        const raw = editForm[key]
        if (raw === '' || raw == null) continue
        body[key] = type === 'number' ? Number(raw) : raw.trim()
      }
      await patchCustomer(id, body)
      showFlash('Customer updated.')
      setEditingCustomer(null)
      await refresh()
    } catch (e) {
      showFlash(e.message || 'Update failed', false)
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

      <nav className="tab-nav" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => {
              setActiveTab(tab.id)
              setDenyFor(null)
              setDenyReason('')
              setEditingCustomer(null)
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Edit customer modal — shown over any tab */}
      {editingCustomer && (
        <div className="modal-overlay" onClick={() => setEditingCustomer(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>
              Edit customer #{editingCustomer.customer_id} —{' '}
              {editingCustomer.first_name} {editingCustomer.last_name}
            </h2>
            <form className="stack-form" onSubmit={handleEditCustomerSubmit}>
              {CUSTOMER_EDIT_FIELDS.map(({ key, label, type }) => (
                <label key={key}>
                  {label}
                  <input
                    type={type}
                    value={editForm[key] ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    min={type === 'number' ? 0 : undefined}
                    step={type === 'number' && key !== 'credit_score' ? '0.01' : undefined}
                  />
                </label>
              ))}
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={busyId === `edit-cust-${editingCustomer.customer_id}`}
                >
                  {busyId === `edit-cust-${editingCustomer.customer_id}`
                    ? 'Saving…'
                    : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingCustomer(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <p className="subtle">Loading…</p>}

      {!loading && (
        <>
          {/* ── Applications tab ── */}
          {activeTab === 'applications' && (
            <section className="card">
              <h2>Loan Applications</h2>
              {applications.length === 0 ? (
                <p className="subtle">None.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>app_id</th>
                        <th>customer</th>
                        <th>requested_amount</th>
                        <th>interest_rate</th>
                        <th>term_months</th>
                        <th>date</th>
                        <th>status</th>
                        <th>reviewed_by</th>
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
                            <span className="subtle">(#{r.customer_id})</span>
                          </td>
                          <td>{formatMoney(r.requested_amount)}</td>
                          <td>{String(r.interest_rate)}%</td>
                          <td>{r.term_months} mo</td>
                          <td>{formatDate(r.application_date)}</td>
                          <td>
                            <span className={pillApp(r.status)}>{r.status}</span>
                          </td>
                          <td>{r.reviewed_by ? `#${r.reviewed_by}` : '—'}</td>
                          <td>
                            {r.denial_reason && r.denial_reason !== 'N/A'
                              ? r.denial_reason
                              : '—'}
                          </td>
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
                                      placeholder="Denial reason"
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
          )}

          {/* ── Loans tab ── */}
          {activeTab === 'loans' && (
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
                        <th>start_date</th>
                        <th>status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map((r) => (
                        <tr key={r.loan_id}>
                          <td>{r.loan_id}</td>
                          <td>
                            {r.customer_first_name} {r.customer_last_name}{' '}
                            <span className="subtle">(#{r.customer_id})</span>
                          </td>
                          <td>{formatMoney(r.initial_balance)}</td>
                          <td>{formatMoney(r.current_balance)}</td>
                          <td>{String(r.interest_rate)}%</td>
                          <td>{formatDate(r.loan_start_date)}</td>
                          <td>
                            <span className={pillLoan(r.status)}>{r.status}</span>
                          </td>
                          <td className="cell-actions">
                            <button
                              type="button"
                              className="btn-small btn-deny"
                              disabled={busyId === `loan-${r.loan_id}`}
                              onClick={() => handleDeleteLoan(r.loan_id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ── Payments tab ── */}
          {activeTab === 'payments' && (
            <section className="card">
              <h2>Payments</h2>
              {payments.length === 0 ? (
                <p className="subtle">None.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>payment_id</th>
                        <th>customer</th>
                        <th>loan_id</th>
                        <th>payment_amount</th>
                        <th>payment_date</th>
                        <th>loan_balance_after</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((r) => (
                        <tr key={r.payment_id}>
                          <td>{r.payment_id}</td>
                          <td>
                            {r.customer_first_name} {r.customer_last_name}{' '}
                            <span className="subtle">(#{r.customer_id})</span>
                          </td>
                          <td>{r.loan_id}</td>
                          <td>{formatMoney(r.payment_amount)}</td>
                          <td>{formatDate(r.payment_date)}</td>
                          <td>{formatMoney(r.loan_current_balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ── Customers tab ── */}
          {activeTab === 'customers' && (
            <section className="card">
              <h2>Customers</h2>
              {customers.length === 0 ? (
                <p className="subtle">None.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>id</th>
                        <th>name</th>
                        <th>email</th>
                        <th>phone</th>
                        <th>address</th>
                        <th>balance</th>
                        <th>salary</th>
                        <th>credit_score</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((r) => (
                        <tr key={r.customer_id}>
                          <td>{r.customer_id}</td>
                          <td>
                            {r.first_name} {r.last_name}
                          </td>
                          <td>{r.email}</td>
                          <td>{r.phone ?? '—'}</td>
                          <td>{r.home_address ?? '—'}</td>
                          <td>{formatMoney(r.balance)}</td>
                          <td>{formatMoney(r.salary)}</td>
                          <td>{r.credit_score}</td>
                          <td className="cell-actions">
                            <button
                              type="button"
                              className="btn-small btn-approve"
                              onClick={() => startEditCustomer(r)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-small btn-deny"
                              disabled={busyId === `cust-${r.customer_id}`}
                              onClick={() => handleDeleteCustomer(r)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function formatMoney(v) {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return String(v)
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function formatDate(v) {
  if (v == null || v === '') return '—'
  const d = typeof v === 'string' ? new Date(v) : v
  if (Number.isNaN(d.getTime?.())) return String(v)
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
