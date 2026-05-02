import { useState, useMemo } from 'react'

export default function PaymentForm({ customerId, loans, onSubmit, disabled }) {
  const activeLoans = useMemo(
    () => (Array.isArray(loans) ? loans.filter((l) => l.status === 'active') : []),
    [loans],
  )
  const [loanId, setLoanId] = useState('')
  const [payment_amount, setPaymentAmount] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const id = parseInt(loanId, 10)
    const paymentAmount = Number(payment_amount)
    if (Number.isNaN(id) || Number.isNaN(paymentAmount) || paymentAmount <= 0) return
    await onSubmit({
      loan_id: id,
      customer_id: customerId,
      payment_amount: paymentAmount,
    })
    setPaymentAmount('')
  }

  if (activeLoans.length === 0) {
    return (
      <div className="card muted">
        <h3>Payment</h3>
        <p>No active loans to pay.</p>
      </div>
    )
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <h3>Make a payment</h3>
      <label>
        Loan
        <select value={loanId} onChange={(e) => setLoanId(e.target.value)} required>
          <option value="">Select loan</option>
          {activeLoans.map((l) => (
            <option key={l.loan_id} value={String(l.loan_id)}>
              #{l.loan_id} — balance {String(l.current_balance)} ({l.status})
            </option>
          ))}
        </select>
      </label>
      <label>
        Amount
        <input
          type="number"
          min="0"
          step="0.01"
          value={payment_amount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={disabled}>
        Pay
      </button>
    </form>
  )
}
