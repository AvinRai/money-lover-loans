/**
 * Tests for Login.jsx
 * Covers: rendering, validation, successful login, error display, register link.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../components/Login.jsx'

vi.mock('../api.js', () => ({
  login: vi.fn(),
}))

import { login } from '../api.js'

const CUSTOMER_PROFILE = {
  customer_id: 1,
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice@example.com',
  phone: '555-0001',
  home_address: '1 Main St',
  balance: '1000.00',
  salary: '50000.00',
  credit_score: 720,
}

const EMPLOYEE_PROFILE = {
  employee_id: 1,
  first_name: 'Bob',
  last_name: 'Jones',
  email: 'bob@example.com',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Login – customer role', () => {
  it('renders title and form fields', () => {
    render(<Login role="customer" onSuccess={vi.fn()} onBack={vi.fn()} />)
    expect(screen.getByText('Customer Login')).toBeTruthy()
    expect(screen.getByLabelText(/email/i)).toBeTruthy()
    expect(screen.getByLabelText(/password/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy()
  })

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn()
    render(<Login role="customer" onSuccess={vi.fn()} onBack={onBack} />)
    await userEvent.click(screen.getByText(/← Back/i))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('shows error when email is empty on submit', async () => {
    render(<Login role="customer" onSuccess={vi.fn()} onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    // HTML5 validation or our own check fires
    expect(login).not.toHaveBeenCalled()
  })

  it('calls login API and onSuccess for customer', async () => {
    login.mockResolvedValueOnce({ role: 'customer', profile: CUSTOMER_PROFILE })
    const onSuccess = vi.fn()
    render(<Login role="customer" onSuccess={onSuccess} onBack={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(login).toHaveBeenCalledWith('customer', 'alice@example.com', 'secret'))
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({
        role: 'customer',
        customer_id: 1,
        profile: CUSTOMER_PROFILE,
      }),
    )
  })

  it('shows error message on failed login', async () => {
    login.mockRejectedValueOnce(new Error('Invalid email or password'))
    render(<Login role="customer" onSuccess={vi.fn()} onBack={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeTruthy())
  })

  it('shows register link when onRegister prop provided', () => {
    render(
      <Login role="customer" onSuccess={vi.fn()} onBack={vi.fn()} onRegister={vi.fn()} />,
    )
    expect(screen.getByText(/register here/i)).toBeTruthy()
  })

  it('calls onRegister when register link clicked', async () => {
    const onRegister = vi.fn()
    render(
      <Login role="customer" onSuccess={vi.fn()} onBack={vi.fn()} onRegister={onRegister} />,
    )
    await userEvent.click(screen.getByText(/register here/i))
    expect(onRegister).toHaveBeenCalledOnce()
  })
})

describe('Login – employee role', () => {
  it('renders Employee Login title', () => {
    render(<Login role="employee" onSuccess={vi.fn()} onBack={vi.fn()} />)
    expect(screen.getByText('Employee Login')).toBeTruthy()
  })

  it('calls login API and onSuccess for employee', async () => {
    login.mockResolvedValueOnce({ role: 'employee', profile: EMPLOYEE_PROFILE })
    const onSuccess = vi.fn()
    render(<Login role="employee" onSuccess={onSuccess} onBack={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/email/i), 'bob@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'emppass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({
        role: 'employee',
        employee_id: 1,
        profile: EMPLOYEE_PROFILE,
      }),
    )
  })
})
