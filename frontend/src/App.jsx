import { useState } from 'react'
import './App.css'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
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
  // view: null (landing) | { type: 'login'|'register', role: 'customer'|'employee' }
  const [view, setView] = useState(null)

  function handleLoginSuccess(next) {
    writeSession(next)
    setSession(next)
    setView(null)
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

  if (view?.type === 'login') {
    return (
      <Login
        role={view.role}
        onSuccess={handleLoginSuccess}
        onBack={() => setView(null)}
        onRegister={() => setView({ type: 'register', role: view.role })}
      />
    )
  }

  if (view?.type === 'register') {
    return (
      <Register
        role={view.role}
        onSuccess={handleLoginSuccess}
        onBack={() => setView({ type: 'login', role: view.role })}
      />
    )
  }

  return (
    <div className="landing">
      <h1>Loaning Service</h1>
      <p className="subtle">Welcome — please log in to continue.</p>
      <div className="landing-actions">
        <button type="button" onClick={() => setView({ type: 'login', role: 'customer' })}>
          Customer Login
        </button>
        <button type="button" onClick={() => setView({ type: 'login', role: 'employee' })}>
          Employee Login
        </button>
      </div>
    </div>
  )
}
