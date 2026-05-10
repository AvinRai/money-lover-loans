/**
 * Tests for CustomerDashboard.jsx
 * The dashboard uses three tabs: Profile (default), Loans, Applications.
 * Tests that target tab-specific content click the tab first.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomerDashboard from '../components/CustomerDashboard.jsx'

vi.mock('../api.js', () => ({
  getCustomer: vi.fn(),
  getCustomerLoans: vi.fn(),
  getCustomerApplications: vi.fn(),
  postCustomerApplication: vi.fn(),
  postLoanPayment: vi.fn(),
  patchCustomer: vi.fn(),
}))

import {
  getCustomer,
  getCustomerLoans,
  getCustomerApplications,
  postCustomerApplication,
  postLoanPayment,
  patchCustomer,
} from '../api.js'

const PROFILE = {
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

const ACTIVE_LOAN = {
  loan_id: 20,
  application_id: 10,
  customer_id: 1,
  initial_balance: '5000.00',
  current_balance: '4000.00',
  interest_rate: '5.00',
  loan_start_date: '2026-01-15T00:00:00',
  status: 'active',
}

const PENDING_APP = {
  application_id: 10,
  customer_id: 1,
  requested_amount: '5000.00',
  interest_rate: '5.00',
  term_months: 12,
  application_date: '2026-01-01T00:00:00',
  status: 'pending',
  denial_reason: 'N/A',
}

const SESSION = { role: 'customer', customer_id: 1, profile: PROFILE }

function setupMocks({ loans = [], applications = [] } = {}) {
  getCustomer.mockResolvedValue(PROFILE)
  getCustomerLoans.mockResolvedValue(loans)
  getCustomerApplications.mockResolvedValue(applications)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// helper: click a tab by its visible label
async function clickTab(label) {
  await userEvent.click(screen.getByRole('tab', { name: label }))
}

describe('CustomerDashboard – header and tabs', () => {
  it('shows customer name and ID', async () => {
    setupMocks()
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('Alice Smith')).toBeTruthy())
    expect(screen.getByText(/Customer #1/)).toBeTruthy()
  })

  it('renders all three tab buttons', async () => {
    setupMocks()
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice Smith'))
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Loans' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Applications' })).toBeTruthy()
  })

  it('calls onLogout when Log out button clicked', async () => {
    setupMocks()
    const onLogout = vi.fn()
    render(<CustomerDashboard session={SESSION} onLogout={onLogout} />)
    await waitFor(() => screen.getByText('Alice Smith'))
    await userEvent.click(screen.getByRole('button', { name: /log out/i }))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})

describe('CustomerDashboard – Profile tab (default)', () => {
  it('shows customer profile details on the Profile tab', async () => {
    setupMocks()
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => expect(screen.getByText('alice@example.com')).toBeTruthy())
    expect(screen.getByText('555-0001')).toBeTruthy()
    expect(screen.getByText('1 Main St')).toBeTruthy()
    expect(screen.getByText('720')).toBeTruthy()
  })

  it('shows edit form when Edit profile button clicked', async () => {
    setupMocks()
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Edit profile'))
    await userEvent.click(screen.getByText('Edit profile'))
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy()
  })

  it('saves profile edits via patchCustomer', async () => {
    patchCustomer.mockResolvedValueOnce({ message: 'Customer updated successfully' })
    setupMocks()
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Edit profile'))
    await userEvent.click(screen.getByText('Edit profile'))

    const phoneInput = screen.getByDisplayValue('555-0001')
    await userEvent.clear(phoneInput)
    await userEvent.type(phoneInput, '555-9999')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(patchCustomer).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ phone: '555-9999' }),
      ),
    )
  })

  it('hides edit form on Cancel', async () => {
    setupMocks()
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Edit profile'))
    await userEvent.click(screen.getByText('Edit profile'))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('button', { name: /save changes/i })).toBeNull()
  })
})

describe('CustomerDashboard – Loans tab', () => {
  it('shows "No loans" on the Loans tab when there are none', async () => {
    setupMocks()
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice Smith'))
    await clickTab('Loans')
    expect(screen.getByText('No loans.')).toBeTruthy()
  })

  it('renders loan row on the Loans tab', async () => {
    setupMocks({ loans: [ACTIVE_LOAN] })
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice Smith'))
    await clickTab('Loans')
    await waitFor(() => expect(screen.getByText('20')).toBeTruthy())
    expect(screen.getByText('active')).toBeTruthy()
  })

  it('submits a loan payment from the Loans tab', async () => {
    postLoanPayment.mockResolvedValueOnce({
      message: 'Payment successful',
      payment_id: 50,
      new_customer_balance: '800.00',
      new_loan_balance: '3800.00',
      loan_status: 'active',
    })
    setupMocks({ loans: [ACTIVE_LOAN] })
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice Smith'))
    await clickTab('Loans')

    const loanSelect = screen.getByLabelText(/^loan$/i)
    await userEvent.selectOptions(loanSelect, ['20'])
    await userEvent.type(screen.getByLabelText(/^amount$/i), '200')
    await userEvent.click(screen.getByRole('button', { name: /^pay$/i }))

    await waitFor(() =>
      expect(postLoanPayment).toHaveBeenCalledWith(
        20,
        expect.objectContaining({ customer_id: 1, payment_amount: 200 }),
      ),
    )
  })
})

describe('CustomerDashboard – Applications tab', () => {
  it('renders application row on the Applications tab', async () => {
    setupMocks({ applications: [PENDING_APP] })
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice Smith'))
    await clickTab('Applications')
    await waitFor(() => expect(screen.getByText('pending')).toBeTruthy())
  })

  it('shows "No applications" on the Applications tab when there are none', async () => {
    setupMocks()
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice Smith'))
    await clickTab('Applications')
    expect(screen.getByText('No applications.')).toBeTruthy()
  })

  it('submits a loan application from the Applications tab', async () => {
    postCustomerApplication.mockResolvedValueOnce({
      application_id: 11,
      message: 'Application submitted',
    })
    setupMocks()
    render(<CustomerDashboard session={SESSION} onLogout={vi.fn()} />)
    await waitFor(() => screen.getByText('Alice Smith'))
    await clickTab('Applications')

    await userEvent.type(screen.getByLabelText(/requested amount/i), '3000')
    await userEvent.type(screen.getByLabelText(/interest rate/i), '4.5')
    await userEvent.type(screen.getByLabelText(/term \(months\)/i), '24')
    await userEvent.click(screen.getByRole('button', { name: /submit application/i }))

    await waitFor(() =>
      expect(postCustomerApplication).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ term_months: 24 }),
      ),
    )
  })
})
