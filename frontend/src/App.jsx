import { useState } from 'react'
import './App.css'
import Login from './components/Login.jsx'
import CustomerDashboard from './components/CustomerDashboard.jsx'
import EmployeeDashboard from './components/EmployeeDashboard.jsx'

const STORAGE_KEY = 'loan-dashboard-session'

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (s.role === 'customer' && s.customer_id) return s
    if (s.role === 'employee' && s.employee_id) return s
  } catch {
    /* ignore */
  }
  return null
}

function writeSession(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function App() {
  const [session, setSession] = useState(() => readSession())
  const [loginRole, setLoginRole] = useState(null)

  function handleLoginSuccess(next) {
    writeSession(next)
    setSession(next)
    setLoginRole(null)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
  }

  if (session?.role === 'customer') {
    return <CustomerDashboard session={session} onLogout={handleLogout} />
  }

  if (session?.role === 'employee') {
    return <EmployeeDashboard session={session} onLogout={handleLogout} />
  }

  if (loginRole) {
    return (
      <Login role={loginRole} onSuccess={handleLoginSuccess} onBack={() => setLoginRole(null)} />
    )
  }

  return (
    <div className="landing">
      <h1>Loaning Service</h1>
      <p className="subtle">Dashboard — local API http://localhost:8000</p>
      <div className="landing-actions">
        <button type="button" onClick={() => setLoginRole('customer')}>
          Customer Login
        </button>
        <button type="button" onClick={() => setLoginRole('employee')}>
          Employee Login
        </button>
      </div>
    </div>
  )
}
