/**
 * Tests for EmployeeDashboard.jsx
 * The dashboard uses three tabs: Applications (default), Loans, Customers.
 * Tests that target Loans or Customers content click the tab first.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmployeeDashboard from '../components/EmployeeDashboard.jsx'

vi.mock('../api.js', () => ({
  getApplications: vi.fn(),
  getLoans: vi.fn(),
  getCustomers: vi.fn(),
  getPayments: vi.fn(),
  patchApplicationReview: vi.fn(),
  patchCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  deleteLoan: vi.fn(),
}))

import {
  getApplications,
  getLoans,
  getCustomers,
  getPayments,
  patchApplicationReview,
  patchCustomer,
  deleteCustomer,
  deleteLoan,
} from '../api.js'

const SESSION = {
  role: 'employee',
  employee_id: 1,
  profile: { employee_id: 1, first_name: 'Bob', last_name: 'Jones' },
}

const PENDING_APP = {
  application_id: 10,
  customer_id: 1,
  customer_first_name: 'Alice',
  customer_last_name: 'Smith',
  customer_email: 'alice@example.com',
  requested_amount: '5000.00',
  interest_rate: '5.00',
  term_months: 12,
  application_date: '2026-01-01T00:00:00',
  status: 'pending',
  reviewed_by: null,
  reviewed_at: null,
  denial_reason: null,
}

const ACTIVE_LOAN = {
  loan_id: 20,
  application_id: 10,
  customer_id: 1,
  customer_first_name: 'Alice',
  customer_last_name: 'Smith',
  customer_email: 'alice@example.com',
  initial_balance: '5000.00',
  current_balance: '4000.00',
  interest_rate: '5.00',
  loan_start_date: '2026-01-15T00:00:00',
  status: 'active',
}

const CUSTOMER_ROW = {
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

const PAYMENT_ROW = {
  payment_id: 50,
  loan_id: 20,
  customer_id: 1,
  customer_first_name: 'Alice',
  customer_last_name: 'Smith',
  payment_amount: '500.00',
  payment_date: '2026-02-04T10:00:00',
  loan_current_balance: '4000.00',
}

function setupMocks({ apps = [], loans = [], customers = [], payments = [] } = {}) {
  getApplications.mockResolvedValue(apps)
  getLoans.mockResolvedValue(loans)
  getCustomers.mockResolvedValue(customers)
  getPayments.mockResolvedValue(payments)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

async function clickTab(label) {
  await userEvent.click(screen.getByRole('tab', { name: label }))
}

describe('EmployeeDashboard – header and tabs', () => {
  it('shows employee name and ID', async () => {
    setupMocks()
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Bob Jones')).toBeTruthy())
    expect(screen.getByText(/Employee #1/)).toBeTruthy()
  })

  it('renders all four tab buttons', async () => {
    setupMocks()
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    expect(screen.getByRole('tab', { name: 'Applications' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Loans' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Customers' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Payments' })).toBeTruthy()
  })

  it('calls onLogout when Log out clicked', async () => {
    setupMocks()
    const onLogout = vi.fn()
    render(<EmployeeDashboard session={SESSION} onLogout={onLogout} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await userEvent.click(screen.getByRole('button', { name: /log out/i }))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})

describe('EmployeeDashboard – Applications tab (default)', () => {
  it('shows "None." when there are no applications', async () => {
    setupMocks()
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('None.')).toBeTruthy())
  })

  it('renders pending application with Approve and Deny buttons', async () => {
    setupMocks({ apps: [PENDING_APP] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeTruthy())
    expect(screen.getByRole('button', { name: /approve/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /deny/i })).toBeTruthy()
  })

  it('calls patchApplicationReview with approved status', async () => {
    patchApplicationReview.mockResolvedValueOnce({ message: 'Application approved' })
    setupMocks({ apps: [PENDING_APP] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByRole('button', { name: /approve/i }))
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))
    await waitFor(() =>
      expect(patchApplicationReview).toHaveBeenCalledWith(10, {
        employee_id: 1,
        status: 'approved',
      }),
    )
  })

  it('shows success flash after approval', async () => {
    patchApplicationReview.mockResolvedValueOnce({ message: 'Application approved' })
    setupMocks({ apps: [PENDING_APP] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByRole('button', { name: /approve/i }))
    await userEvent.click(screen.getByRole('button', { name: /approve/i }))
    await waitFor(() => expect(screen.getByText(/application approved/i)).toBeTruthy())
  })

  it('shows denial reason input then calls patchApplicationReview denied', async () => {
    patchApplicationReview.mockResolvedValueOnce({ message: 'Application denied' })
    setupMocks({ apps: [PENDING_APP] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByRole('button', { name: /^deny$/i }))
    await userEvent.click(screen.getByRole('button', { name: /^deny$/i }))

    const reasonInput = screen.getByPlaceholderText(/denial reason/i)
    await userEvent.type(reasonInput, 'Low credit score')
    await userEvent.click(screen.getByRole('button', { name: /confirm deny/i }))

    await waitFor(() =>
      expect(patchApplicationReview).toHaveBeenCalledWith(10, {
        employee_id: 1,
        status: 'denied',
        denial_reason: 'Low credit score',
      }),
    )
  })

  it('cancel hides denial inline form', async () => {
    setupMocks({ apps: [PENDING_APP] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByRole('button', { name: /^deny$/i }))
    await userEvent.click(screen.getByRole('button', { name: /^deny$/i }))
    expect(screen.getByPlaceholderText(/denial reason/i)).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByPlaceholderText(/denial reason/i)).toBeNull()
  })
})

describe('EmployeeDashboard – Loans tab', () => {
  it('shows "None." on the Loans tab when there are no loans', async () => {
    setupMocks()
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Loans')
    expect(screen.getByText('None.')).toBeTruthy()
  })

  it('renders loan row with Delete button', async () => {
    setupMocks({ loans: [ACTIVE_LOAN] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Loans')
    await waitFor(() => expect(screen.getByText('20')).toBeTruthy())
    expect(screen.getByRole('button', { name: /delete/i })).toBeTruthy()
  })

  it('calls deleteLoan after confirmation', async () => {
    deleteLoan.mockResolvedValueOnce({ message: 'Loan deleted successfully' })
    setupMocks({ loans: [ACTIVE_LOAN] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Loans')
    await waitFor(() => screen.getByRole('button', { name: /delete/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    await waitFor(() => expect(deleteLoan).toHaveBeenCalledWith(20))
  })

  it('does not delete when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    setupMocks({ loans: [ACTIVE_LOAN] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Loans')
    await waitFor(() => screen.getByRole('button', { name: /delete/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(deleteLoan).not.toHaveBeenCalled()
  })
})

describe('EmployeeDashboard – Customers tab', () => {
  it('shows "None." on the Customers tab when there are no customers', async () => {
    setupMocks()
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Customers')
    expect(screen.getByText('None.')).toBeTruthy()
  })

  it('renders customer row with Edit and Delete buttons', async () => {
    setupMocks({ customers: [CUSTOMER_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Customers')
    await waitFor(() => expect(screen.getByText('alice@example.com')).toBeTruthy())
    expect(screen.getByRole('button', { name: /edit/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /delete/i })).toBeTruthy()
  })

  it('opens edit modal with customer data pre-filled', async () => {
    setupMocks({ customers: [CUSTOMER_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Customers')
    await waitFor(() => screen.getByRole('button', { name: /edit/i }))
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByDisplayValue('Alice')).toBeTruthy()
    expect(screen.getByDisplayValue('alice@example.com')).toBeTruthy()
  })

  it('calls patchCustomer with updated values', async () => {
    patchCustomer.mockResolvedValueOnce({ message: 'Customer updated successfully' })
    setupMocks({ customers: [CUSTOMER_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Customers')
    await waitFor(() => screen.getByRole('button', { name: /edit/i }))
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))

    const phoneInput = screen.getByDisplayValue('555-0001')
    await userEvent.clear(phoneInput)
    await userEvent.type(phoneInput, '555-1234')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(patchCustomer).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ phone: '555-1234' }),
      ),
    )
  })

  it('closes modal on Cancel', async () => {
    setupMocks({ customers: [CUSTOMER_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Customers')
    await waitFor(() => screen.getByRole('button', { name: /edit/i }))
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('button', { name: /save changes/i })).toBeNull()
  })

  it('calls deleteCustomer after confirmation', async () => {
    deleteCustomer.mockResolvedValueOnce({ message: 'Customer deleted successfully' })
    setupMocks({ customers: [CUSTOMER_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Customers')
    await waitFor(() => screen.getByRole('button', { name: /delete/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    await waitFor(() => expect(deleteCustomer).toHaveBeenCalledWith(1))
  })

  it('does not delete when confirmation cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    setupMocks({ customers: [CUSTOMER_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Customers')
    await waitFor(() => screen.getByRole('button', { name: /delete/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(deleteCustomer).not.toHaveBeenCalled()
  })
})

describe('EmployeeDashboard – Payments tab', () => {
  it('shows "None." on the Payments tab when there are no payments', async () => {
    setupMocks()
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Payments')
    expect(screen.getByText('None.')).toBeTruthy()
  })

  it('calls getPayments on mount', async () => {
    setupMocks({ payments: [PAYMENT_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    expect(getPayments).toHaveBeenCalledOnce()
  })

  it('renders a payment row with all key fields', async () => {
    setupMocks({ payments: [PAYMENT_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Payments')
    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeTruthy())
    expect(screen.getByText('50')).toBeTruthy()   // payment_id
    expect(screen.getByText('20')).toBeTruthy()   // loan_id
  })

  it('displays payment_amount formatted as currency', async () => {
    setupMocks({ payments: [PAYMENT_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Payments')
    await waitFor(() => screen.getByText('Alice Smith'))
    expect(screen.getByText(/\$500\.00/)).toBeTruthy()
  })

  it('displays loan_current_balance formatted as currency', async () => {
    setupMocks({ payments: [PAYMENT_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Payments')
    await waitFor(() => screen.getByText('Alice Smith'))
    expect(screen.getByText(/\$4,000\.00/)).toBeTruthy()
  })

  it('renders multiple payment rows', async () => {
    const second = {
      ...PAYMENT_ROW,
      payment_id: 51,
      loan_id: 21,
      customer_first_name: 'Bob',
      customer_last_name: 'Johnson',
      customer_id: 2,
      payment_amount: '1000.00',
      loan_current_balance: '9000.00',
    }
    setupMocks({ payments: [PAYMENT_ROW, second] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Payments')
    await waitFor(() => screen.getByText('Alice Smith'))
    expect(screen.getByText('Bob Johnson')).toBeTruthy()
  })

  it('displays the correct customer ID badge for each payment', async () => {
    setupMocks({ payments: [PAYMENT_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Payments')
    await waitFor(() => screen.getByText('Alice Smith'))
    expect(screen.getByText('(#1)')).toBeTruthy()
  })

  it('Payments tab is read-only – no action buttons rendered', async () => {
    setupMocks({ payments: [PAYMENT_ROW] })
    render(<EmployeeDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Bob Jones'))
    await clickTab('Payments')
    await waitFor(() => screen.getByText('Alice Smith'))
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull()
  })
})
