import { useCallback, useEffect, useState } from 'react'
import {
  getCustomer,
  getCustomerApplications,
  getCustomerLoans,
  patchCustomer,
  postCustomerApplication,
  postLoanPayment,
} from '../api.js'
import LoanApplicationForm from './LoanApplicationForm.jsx'
import PaymentForm from './PaymentForm.jsx'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'loans', label: 'Loans' },
  { id: 'applications', label: 'Applications' },
]

export default function CustomerDashboard({ session, onLogout }) {
  const customerId = session.customer_id
  const [customer, setCustomer] = useState(session.profile || null)
  const [loans, setLoans] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)
  const [flash, setFlash] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [editingProfile, setEditingProfile] = useState(false)
  const [editForm, setEditForm] = useState({ email: '', phone: '', home_address: '' })

  const showFlash = useCallback((text, ok = true) => {
    setFlash({ text, ok })
    window.setTimeout(() => setFlash(null), 5000)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [c, ls, apps] = await Promise.all([
        getCustomer(customerId),
        getCustomerLoans(customerId),
        getCustomerApplications(customerId),
      ])
      setCustomer(c)
      setLoans(Array.isArray(ls) ? ls : [])
      setApplications(Array.isArray(apps) ? apps : [])
    } catch (e) {
      showFlash(e.message || 'Failed to load data', false)
    } finally {
      setLoading(false)
    }
  }, [customerId, showFlash])

  useEffect(() => {
    refresh()
  }, [refresh])

  function startEditProfile() {
    setEditForm({
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      home_address: customer?.home_address ?? '',
    })
    setEditingProfile(true)
  }

  async function handleEditProfile(e) {
    e.preventDefault()
    setActionBusy(true)
    try {
      await patchCustomer(customerId, {
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        home_address: editForm.home_address.trim(),
      })
      showFlash('Profile updated.')
      setEditingProfile(false)
      await refresh()
    } catch (err) {
      showFlash(err.message || 'Update failed', false)
    } finally {
      setActionBusy(false)
    }
  }

  async function handleApplication(body) {
    setActionBusy(true)
    try {
      await postCustomerApplication(customerId, body)
      showFlash('Application submitted.')
      await refresh()
    } catch (e) {
      showFlash(e.message || 'Submit failed', false)
    } finally {
      setActionBusy(false)
    }
  }

  async function handlePayment({ loan_id, customer_id, payment_amount }) {
    setActionBusy(true)
    try {
      await postLoanPayment(loan_id, { customer_id, payment_amount })
      showFlash('Payment recorded.')
      await refresh()
    } catch (e) {
      showFlash(e.message || 'Payment failed', false)
    } finally {
      setActionBusy(false)
    }
  }

  const name = customer
    ? `${customer.first_name} ${customer.last_name}`
    : `Customer #${customerId}`

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h1>{name}</h1>
          <p className="subtle">Customer #{customerId}</p>
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
              setEditingProfile(false)
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {loading && <p className="subtle">Loading…</p>}

      {!loading && customer && (
        <>
          {/* ── Profile tab ── */}
          {activeTab === 'profile' && (
            <section className="card balance-card">
              <div className="card-header-row">
                <h2>Account Information</h2>
                {!editingProfile && (
                  <button type="button" className="btn-small" onClick={startEditProfile}>
                    Edit profile
                  </button>
                )}
              </div>

              <p className="balance-value">{formatMoney(customer.balance)}</p>

              {editingProfile ? (
                <form className="stack-form edit-profile-form" onSubmit={handleEditProfile}>
                  <label>
                    Email
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </label>
                  <label>
                    Home address
                    <input
                      type="text"
                      value={editForm.home_address}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, home_address: e.target.value }))
                      }
                    />
                  </label>
                  <div className="form-actions">
                    <button type="submit" disabled={actionBusy}>
                      {actionBusy ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditingProfile(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="dl-grid">
                  <div>
                    <dt>Email</dt>
                    <dd>{customer.email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{customer.phone ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>{customer.home_address ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Salary</dt>
                    <dd>{formatMoney(customer.salary)}</dd>
                  </div>
                  <div>
                    <dt>Credit score</dt>
                    <dd>{customer.credit_score}</dd>
                  </div>
                </dl>
              )}
            </section>
          )}

          {/* ── Loans tab ── */}
          {activeTab === 'loans' && (
            <div className="tab-content">
              <section className="card">
                <h2>My Loans</h2>
                {loans.length === 0 ? (
                  <p className="subtle">No loans.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>loan_id</th>
                          <th>current_balance</th>
                          <th>initial_balance</th>
                          <th>interest_rate</th>
                          <th>start_date</th>
                          <th>status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loans.map((r) => (
                          <tr key={r.loan_id}>
                            <td>{r.loan_id}</td>
                            <td>{formatMoney(r.current_balance)}</td>
                            <td>{formatMoney(r.initial_balance)}</td>
                            <td>{String(r.interest_rate)}%</td>
                            <td>{formatDate(r.loan_start_date)}</td>
                            <td>
                              <span className={statusClassLoan(r.status)}>{r.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="card" style={{ marginTop: '1rem' }}>
                <PaymentForm
                  customerId={customerId}
                  loans={loans}
                  onSubmit={handlePayment}
                  disabled={actionBusy}
                />
              </section>
            </div>
          )}

          {/* ── Applications tab ── */}
          {activeTab === 'applications' && (
            <div className="tab-content">
              <section className="card">
                <h2>My Applications</h2>
                {applications.length === 0 ? (
                  <p className="subtle">No applications.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>app_id</th>
                          <th>requested_amount</th>
                          <th>interest_rate</th>
                          <th>term_months</th>
                          <th>date</th>
                          <th>status</th>
                          <th>denial_reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((r) => (
                          <tr key={r.application_id}>
                            <td>{r.application_id}</td>
                            <td>{formatMoney(r.requested_amount)}</td>
                            <td>{String(r.interest_rate)}%</td>
                            <td>{r.term_months} mo</td>
                            <td>{formatDate(r.application_date)}</td>
                            <td>
                              <span className={statusClassApp(r.status)}>{r.status}</span>
                            </td>
                            <td>
                              {r.denial_reason && r.denial_reason !== 'N/A'
                                ? r.denial_reason
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="card" style={{ marginTop: '1rem' }}>
                <LoanApplicationForm onSubmit={handleApplication} disabled={actionBusy} />
              </section>
            </div>
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

function statusClassApp(status) {
  if (status === 'pending') return 'pill pill-pending'
  if (status === 'approved') return 'pill pill-approved'
  if (status === 'denied') return 'pill pill-denied'
  return 'pill'
}

function statusClassLoan(status) {
  if (status === 'active') return 'pill pill-approved'
  if (status === 'paid_off') return 'pill pill-neutral'
  return 'pill'
}
