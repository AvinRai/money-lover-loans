import { useState } from 'react'
import { login, postCustomer, postEmployee } from '../api.js'

const INITIAL_CUSTOMER = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  home_address: '',
  balance: '',
  salary: '',
  credit_score: '',
  password: '',
  confirm_password: '',
}

const INITIAL_EMPLOYEE = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  home_address: '',
  password: '',
  confirm_password: '',
}

export default function Register({ role, onSuccess, onBack }) {
  const isCustomer = role === 'customer'
  const [form, setForm] = useState(isCustomer ? INITIAL_CUSTOMER : INITIAL_EMPLOYEE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const title = isCustomer ? 'Create Customer Account' : 'Create Employee Account'

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    if (!form.first_name.trim()) return 'First name is required'
    if (!form.last_name.trim()) return 'Last name is required'
    if (!form.email.trim()) return 'Email is required'
    if (!form.password) return 'Password is required'
    if (form.password !== form.confirm_password) return 'Passwords do not match'
    if (isCustomer) {
      const balance = Number(form.balance)
      const salary = Number(form.salary)
      const creditScore = Number(form.credit_score)
      if (form.balance === '' || Number.isNaN(balance) || balance < 0)
        return 'Balance must be a non-negative number'
      if (form.salary === '' || Number.isNaN(salary) || salary < 0)
        return 'Salary must be a non-negative number'
      if (
        form.credit_score === '' ||
        Number.isNaN(creditScore) ||
        creditScore < 300 ||
        creditScore > 850
      )
        return 'Credit score must be between 300 and 850'
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (isCustomer) {
        await postCustomer({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          home_address: form.home_address.trim(),
          balance: Number(form.balance),
          salary: Number(form.salary),
          credit_score: Number(form.credit_score),
          hashed_password: form.password,
        })
      } else {
        await postEmployee({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          home_address: form.home_address.trim(),
          hashed_password: form.password,
        })
      }

      // Auto-login after registration
      const result = await login(role, form.email.trim(), form.password)
      if (isCustomer) {
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
      setError(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="narrow-page">
      <button type="button" className="link-back" onClick={onBack}>
        ← Back to login
      </button>
      <h1>{title}</h1>
      <p className="subtle">Fill in your details to create a new account.</p>

      {error && <p className="msg msg-error">{error}</p>}

      <form className="stack-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            First name
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)}
              placeholder="Jane"
              required
            />
          </label>
          <label>
            Last name
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)}
              placeholder="Doe"
              required
            />
          </label>
        </div>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Phone
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="555-555-5555"
          />
        </label>

        <label>
          Home address
          <input
            type="text"
            value={form.home_address}
            onChange={(e) => set('home_address', e.target.value)}
            placeholder="123 Main St, City, ST 00000"
          />
        </label>

        {isCustomer && (
          <>
            <div className="form-row">
              <label>
                Balance ($)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.balance}
                  onChange={(e) => set('balance', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
              <label>
                Salary ($)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salary}
                  onChange={(e) => set('salary', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
            </div>
            <label>
              Credit score (300–850)
              <input
                type="number"
                value={form.credit_score}
                onChange={(e) => set('credit_score', e.target.value)}
                placeholder="700"
                required
              />
            </label>
          </>
        )}

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={form.confirm_password}
            onChange={(e) => set('confirm_password', e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
