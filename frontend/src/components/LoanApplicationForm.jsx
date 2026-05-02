import { useState } from 'react'

const initial = {
  requested_amount: '',
  interest_rate: '',
  term_months: '',
}

export default function LoanApplicationForm({ onSubmit, disabled }) {
  const [values, setValues] = useState(initial)

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const requested_amount = Number(values.requested_amount)
    const interest_rate = Number(values.interest_rate)
    const term_months = parseInt(values.term_months, 10)
    if (
      Number.isNaN(requested_amount) ||
      requested_amount <= 0 ||
      Number.isNaN(interest_rate) ||
      interest_rate < 0 ||
      Number.isNaN(term_months) ||
      term_months <= 0
    ) {
      return
    }
    await onSubmit({
      requested_amount,
      interest_rate,
      term_months,
    })
    setValues(initial)
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <h3>New application</h3>
      <label>
        Requested amount
        <input
          name="requested_amount"
          type="number"
          min="0"
          step="0.01"
          value={values.requested_amount}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Interest rate (%)
        <input
          name="interest_rate"
          type="number"
          min="0"
          step="0.01"
          value={values.interest_rate}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Term (months)
        <input
          name="term_months"
          type="number"
          min="1"
          step="1"
          value={values.term_months}
          onChange={handleChange}
          required
        />
      </label>
      <button type="submit" disabled={disabled}>
        Submit application
      </button>
    </form>
  )
}
