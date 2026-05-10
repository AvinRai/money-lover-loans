/**
 * Tests for api.js — verifies that each exported function builds the correct
 * URL, method, and body and propagates errors from failed responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch before importing api.js
const mockFetch = vi.fn()
global.fetch = mockFetch

function mockOk(data) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    text: async () => JSON.stringify(data),
  })
}

function mockError(status, detail) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: 'Error',
    text: async () => JSON.stringify({ detail }),
  })
}

import {
  getCustomers,
  getCustomer,
  getCustomerLoans,
  getCustomerApplications,
  postCustomerApplication,
  getEmployees,
  getEmployee,
  getApplications,
  patchApplicationReview,
  getLoans,
  postLoanPayment,
  login,
  postCustomer,
  postEmployee,
  patchCustomer,
  deleteCustomer,
  deleteLoan,
} from '../api.js'

const BASE = 'http://localhost:8000'

beforeEach(() => {
  mockFetch.mockReset()
})

describe('getCustomers', () => {
  it('calls GET /customers', async () => {
    mockOk([{ customer_id: 1 }])
    const result = await getCustomers()
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/customers`, expect.objectContaining({}))
    expect(result).toEqual([{ customer_id: 1 }])
  })
})

describe('getCustomer', () => {
  it('calls GET /customers/:id', async () => {
    mockOk({ customer_id: 1 })
    await getCustomer(1)
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/customers/1`, expect.anything())
  })
})

describe('getCustomerLoans', () => {
  it('calls GET /customers/:id/loans', async () => {
    mockOk([])
    await getCustomerLoans(1)
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/customers/1/loans`, expect.anything())
  })
})

describe('getCustomerApplications', () => {
  it('calls GET /customers/:id/applications', async () => {
    mockOk([])
    await getCustomerApplications(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/customers/1/applications`,
      expect.anything(),
    )
  })
})

describe('postCustomerApplication', () => {
  it('calls POST /customers/:id/applications with correct body', async () => {
    mockOk({ application_id: 10, message: 'Application submitted' })
    const body = { requested_amount: 5000, interest_rate: 5, term_months: 12 }
    await postCustomerApplication(1, body)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BASE}/customers/1/applications`)
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual(body)
  })
})

describe('getEmployees', () => {
  it('calls GET /employees', async () => {
    mockOk([])
    await getEmployees()
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/employees`, expect.anything())
  })
})

describe('getEmployee', () => {
  it('calls GET /employees/:id', async () => {
    mockOk({ employee_id: 1 })
    await getEmployee(1)
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/employees/1`, expect.anything())
  })
})

describe('getApplications', () => {
  it('calls GET /applications', async () => {
    mockOk([])
    await getApplications()
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/applications`, expect.anything())
  })
})

describe('patchApplicationReview', () => {
  it('calls PATCH /applications/:id/review with body', async () => {
    mockOk({ message: 'Application approved' })
    const body = { employee_id: 1, status: 'approved' }
    await patchApplicationReview(10, body)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BASE}/applications/10/review`)
    expect(opts.method).toBe('PATCH')
    expect(JSON.parse(opts.body)).toEqual(body)
  })
})

describe('getLoans', () => {
  it('calls GET /loans', async () => {
    mockOk([])
    await getLoans()
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/loans`, expect.anything())
  })
})

describe('postLoanPayment', () => {
  it('calls POST /loans/:id/payments with body', async () => {
    mockOk({ message: 'Payment successful' })
    const body = { customer_id: 1, payment_amount: 100 }
    await postLoanPayment(20, body)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BASE}/loans/20/payments`)
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual(body)
  })
})

describe('login', () => {
  it('calls POST /auth/login with role, email, password', async () => {
    mockOk({ role: 'customer', profile: { customer_id: 1 } })
    await login('customer', 'alice@example.com', 'secret')
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BASE}/auth/login`)
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({
      role: 'customer',
      email: 'alice@example.com',
      password: 'secret',
    })
  })

  it('throws when server returns 401', async () => {
    mockError(401, 'Invalid email or password')
    await expect(login('customer', 'x@x.com', 'bad')).rejects.toThrow(
      'Invalid email or password',
    )
  })
})

describe('postCustomer', () => {
  it('calls POST /customers with body', async () => {
    mockOk({ message: 'Customer created successfully', customer_id: 1 })
    const body = { first_name: 'Alice', last_name: 'Smith', email: 'a@b.com', hashed_password: 'p' }
    await postCustomer(body)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BASE}/customers`)
    expect(opts.method).toBe('POST')
  })
})

describe('postEmployee', () => {
  it('calls POST /employees with body', async () => {
    mockOk({ message: 'Employee created successfully', employee_id: 2 })
    const body = { first_name: 'Bob', last_name: 'Jones', email: 'b@c.com', hashed_password: 'p' }
    await postEmployee(body)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BASE}/employees`)
    expect(opts.method).toBe('POST')
  })
})

describe('patchCustomer', () => {
  it('calls PATCH /customers/:id with body', async () => {
    mockOk({ message: 'Customer updated successfully' })
    await patchCustomer(1, { phone: '555-9999' })
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BASE}/customers/1`)
    expect(opts.method).toBe('PATCH')
    expect(JSON.parse(opts.body)).toEqual({ phone: '555-9999' })
  })
})

describe('deleteCustomer', () => {
  it('calls DELETE /customers/:id', async () => {
    mockOk({ message: 'Customer deleted successfully' })
    await deleteCustomer(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BASE}/customers/1`)
    expect(opts.method).toBe('DELETE')
  })
})

describe('deleteLoan', () => {
  it('calls DELETE /loans/:id', async () => {
    mockOk({ message: 'Loan deleted successfully' })
    await deleteLoan(20)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe(`${BASE}/loans/20`)
    expect(opts.method).toBe('DELETE')
  })
})
