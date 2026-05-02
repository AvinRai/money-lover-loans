const API_BASE = 'http://localhost:8000'

function parseErrorPayload(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function errorMessageFromBody(data, statusText) {
  if (!data || typeof data !== 'object') return statusText
  const { detail } = data
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => (d && typeof d.msg === 'string' ? d.msg : JSON.stringify(d))).join('; ')
  }
  if (detail != null) return String(detail)
  return data.message || statusText
}

async function request(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options
  const headers = {
    Accept: 'application/json',
    ...extraHeaders,
  }
  if (rest.body != null && !(rest.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
  })

  const text = await res.text()
  const data = parseErrorPayload(text)

  if (!res.ok) {
    throw new Error(errorMessageFromBody(data, res.statusText || `HTTP ${res.status}`))
  }

  return data
}

export async function getHealth() {
  return request('/health')
}

export async function getCustomers() {
  return request('/customers')
}

export async function getCustomer(customerId) {
  return request(`/customers/${customerId}`)
}

export async function getCustomerLoans(customerId) {
  return request(`/customers/${customerId}/loans`)
}

export async function getCustomerApplications(customerId) {
  return request(`/customers/${customerId}/applications`)
}

export async function postCustomerApplication(customerId, body) {
  return request(`/customers/${customerId}/applications`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getEmployees() {
  return request('/employees')
}

export async function getEmployee(employeeId) {
  return request(`/employees/${employeeId}`)
}

export async function getApplications() {
  return request('/applications')
}

export async function patchApplicationReview(applicationId, body) {
  return request(`/applications/${applicationId}/review`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function getLoans() {
  return request('/loans')
}

export async function postLoanPayment(loanId, body) {
  return request(`/loans/${loanId}/payments`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
