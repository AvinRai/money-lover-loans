/**
 * Tests for Register.jsx
 * Covers: rendering, validation errors, successful customer/employee registration,
 * auto-login after registration, back navigation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../components/Register.jsx'

vi.mock('../api.js', () => ({
  postCustomer: vi.fn(),
  postEmployee: vi.fn(),
  login: vi.fn(),
}))

import { postCustomer, postEmployee, login } from '../api.js'

beforeEach(() => {
  vi.clearAllMocks()
})

const CUSTOMER_PROFILE = {
  customer_id: 5,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone: '',
  home_address: '',
  balance: '500.00',
  salary: '40000.00',
  credit_score: 680,
}

const EMPLOYEE_PROFILE = {
  employee_id: 3,
  first_name: 'Carol',
  last_name: 'White',
  email: 'carol@example.com',
}

async function fillCustomerForm(
  { firstName = 'Jane', lastName = 'Doe', email = 'jane@example.com', password = 'pass123', confirm = 'pass123', balance = '500', salary = '40000', creditScore = '680' } = {}
) {
  await userEvent.type(screen.getByLabelText(/first name/i), firstName)
  await userEvent.type(screen.getByLabelText(/last name/i), lastName)
  await userEvent.type(screen.getByLabelText(/email/i), email)
  await userEvent.type(screen.getByLabelText(/balance/i), balance)
  await userEvent.type(screen.getByLabelText(/salary/i), salary)
  await userEvent.type(screen.getByLabelText(/credit score/i), creditScore)
  await userEvent.type(screen.getAllByLabelText(/password/i)[0], password)
  await userEvent.type(screen.getAllByLabelText(/confirm password/i)[0], confirm)
}

describe('Register – customer role', () => {
  it('renders Create Customer Account heading', () => {
    render(<Register role="customer" onSuccess={vi.fn()} onBack={vi.fn()} />)
    expect(screen.getByText('Create Customer Account')).toBeTruthy()
  })

  it('calls onBack when back button clicked', async () => {
    const onBack = vi.fn()
    render(<Register role="customer" onSuccess={onBack} onBack={onBack} />)
    await userEvent.click(screen.getByText(/← Back to login/i))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows error when passwords do not match', async () => {
    render(<Register role="customer" onSuccess={vi.fn()} onBack={vi.fn()} />)
    await fillCustomerForm({ confirm: 'different' })
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() =>
      expect(screen.getByText(/passwords do not match/i)).toBeTruthy(),
    )
    expect(postCustomer).not.toHaveBeenCalled()
  })

  it('shows error when credit score is out of range', async () => {
    render(<Register role="customer" onSuccess={vi.fn()} onBack={vi.fn()} />)
    await fillCustomerForm({ creditScore: '200' })
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() =>
      expect(screen.getByText(/credit score must be between/i)).toBeTruthy(),
    )
  })

  it('creates account and auto-logs in on success', async () => {
    postCustomer.mockResolvedValueOnce({ message: 'Customer created successfully', customer_id: 5 })
    login.mockResolvedValueOnce({ role: 'customer', profile: CUSTOMER_PROFILE })
    const onSuccess = vi.fn()
    render(<Register role="customer" onSuccess={onSuccess} onBack={vi.fn()} />)
    await fillCustomerForm()
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(postCustomer).toHaveBeenCalledOnce())
    await waitFor(() => expect(login).toHaveBeenCalledWith('customer', 'jane@example.com', 'pass123'))
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({
        role: 'customer',
        customer_id: 5,
        profile: CUSTOMER_PROFILE,
      }),
    )
  })

  it('shows server error when registration fails', async () => {
    postCustomer.mockRejectedValueOnce(new Error('Email already exists'))
    render(<Register role="customer" onSuccess={vi.fn()} onBack={vi.fn()} />)
    await fillCustomerForm()
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(screen.getByText('Email already exists')).toBeTruthy())
  })
})

describe('Register – employee role', () => {
  it('renders Create Employee Account heading', () => {
    render(<Register role="employee" onSuccess={vi.fn()} onBack={vi.fn()} />)
    expect(screen.getByText('Create Employee Account')).toBeTruthy()
  })

  it('does not render customer-only fields', () => {
    render(<Register role="employee" onSuccess={vi.fn()} onBack={vi.fn()} />)
    expect(screen.queryByLabelText(/credit score/i)).toBeNull()
    expect(screen.queryByLabelText(/balance/i)).toBeNull()
    expect(screen.queryByLabelText(/salary/i)).toBeNull()
  })

  it('creates employee account and auto-logs in', async () => {
    postEmployee.mockResolvedValueOnce({ message: 'Employee created successfully', employee_id: 3 })
    login.mockResolvedValueOnce({ role: 'employee', profile: EMPLOYEE_PROFILE })
    const onSuccess = vi.fn()
    render(<Register role="employee" onSuccess={onSuccess} onBack={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/first name/i), 'Carol')
    await userEvent.type(screen.getByLabelText(/last name/i), 'White')
    await userEvent.type(screen.getByLabelText(/email/i), 'carol@example.com')
    await userEvent.type(screen.getAllByLabelText(/password/i)[0], 'emppass')
    await userEvent.type(screen.getAllByLabelText(/confirm password/i)[0], 'emppass')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(postEmployee).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({
        role: 'employee',
        employee_id: 3,
        profile: EMPLOYEE_PROFILE,
      }),
    )
  })
})
