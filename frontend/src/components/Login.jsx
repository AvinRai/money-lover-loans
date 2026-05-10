import { useState } from 'react'
import { login } from '../api.js'

export default function Login({ role, onSuccess, onBack, onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const title = role === 'customer' ? 'Customer Login' : 'Employee Login'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await login(role, email.trim(), password)
      // result: { role, profile }
      if (role === 'customer') {
        onSuccess({
          role: 'customer',
          customer_id: result.profile.customer_id,
          profile: result.profile,
        })
      } else {
        onSuccess({
          role: 'employee',
          employee_id: result.profile.employee_id,
          profile: result.profile,
        })
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="narrow-page">
      <button type="button" className="link-back" onClick={onBack}>
        ← Back
      </button>
      <h1>{title}</h1>
      <p className="subtle">Sign in with your email and password.</p>

      {error && <p className="msg msg-error">{error}</p>}

      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {onRegister && (
        <p className="subtle" style={{ marginTop: '1rem', textAlign: 'center' }}>
          No account?{' '}
          <button type="button" className="link-back" onClick={onRegister}>
            Register here
          </button>
        </p>
      )}
    </div>
  )
}
