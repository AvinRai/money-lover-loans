import { useMemo, useState } from 'react'
import { IconBriefcase, IconWallet } from './Icons'

const MIN_AMOUNT = 3_000
const MAX_AMOUNT = 50_000
const TERMS = [12, 24, 36, 48, 60] as const

/** Illustrative APR for UI preview only — not an offer. */
const DEMO_APR = 0.115

function monthlyPayment(principal: number, annualRate: number, months: number): number {
  if (months <= 0) return principal
  const r = annualRate / 12
  const pow = Math.pow(1 + r, months)
  return (principal * r * pow) / (pow - 1)
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function Hero() {
  const [amount, setAmount] = useState(18_000)
  const [termMonths, setTermMonths] = useState<(typeof TERMS)[number]>(48)

  const payment = useMemo(
    () => monthlyPayment(amount, DEMO_APR, termMonths),
    [amount, termMonths],
  )

  const totalRepay = payment * termMonths
  const interest = Math.max(0, totalRepay - amount)

  return (
    <div className="hero-wrap" id="top">
      <div className="hero">
        <div>
          <p className="eyebrow">CMPE 157A · Fintech loan dashboard</p>
          <h1>Loaning Service Dashboard</h1>
          <p className="lead">
            A web dashboard for a lending company: customers see their loans, balances, and
            applications; administrators review applications, manage loans and payments, and update
            customer records—backed by a MySQL database and FastAPI backend (per project scope).
          </p>
          <div className="hero-cta">
            <a href="#apply" className="btn btn-primary" id="apply">
              Apply for a loan
            </a>
            <a href="#administrators" className="btn btn-ghost">
              Administrator capabilities
            </a>
          </div>
          <div className="micro-trust">
            <span>
              <IconWallet size={18} /> Customers: apply, view loans &amp; applications, pay down
              balances
            </span>
            <span>
              <IconBriefcase size={18} /> Employees: review applications, approve or deny, manage
              loans &amp; payments
            </span>
          </div>
        </div>

        <div className="hero-card" aria-labelledby="estimator-title">
          <h3 id="estimator-title">Customer view · Payment preview</h3>
          <p className="hero-card-intro">
            Explore estimated monthly payment for a requested amount and term (illustrative rates
            only).
          </p>

          <div className="field-row">
            <label htmlFor="loan-amt">Requested amount</label>
            <div className="amount-display">{formatCurrency(amount)}</div>
            <input
              id="loan-amt"
              className="range"
              type="range"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <div className="slider-meta">
              <span>{formatCurrency(MIN_AMOUNT)}</span>
              <span>{formatCurrency(MAX_AMOUNT)}</span>
            </div>
          </div>

          <div className="field-row">
            <label htmlFor="loan-term">Term</label>
            <select
              id="loan-term"
              className="select-input"
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value) as (typeof TERMS)[number])}
            >
              {TERMS.map((m) => (
                <option key={m} value={m}>
                  {m} months
                </option>
              ))}
            </select>
          </div>

          <div className="estimator-result">
            <dl>
              <div>
                <dt>Est. monthly payment</dt>
                <dd>{formatCurrency(Math.round(payment))}</dd>
              </div>
              <div>
                <dt>Total interest (illustrative)</dt>
                <dd className="estimator-interest">{formatCurrency(Math.round(interest))}</dd>
              </div>
            </dl>
            <p className="estimator-note">
              Example uses {(DEMO_APR * 100).toFixed(2)}% APR for UI demonstration only. Final
              terms come from employee review and stored loan records—not from this preview.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
