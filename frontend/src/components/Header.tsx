import { useState } from 'react'
import { BrandMark, IconMenu } from './Icons'

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-inner">
        <a className="brand" href="#top" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span className="brand-text">
            <span className="brand-title">Loaning Service</span>
            <span className="brand-subtitle">Dashboard</span>
          </span>
        </a>

        <nav className="nav nav-desktop" aria-label="Primary">
          <a href="#customers">Customers</a>
          <a href="#administrators">Administrators</a>
          <a href="#scope">Data model</a>
          <a href="#how">Workflow</a>
        </nav>

        <div className="header-actions">
          <a href="#employee-sign-in" className="btn btn-ghost nav-desktop">
            Employee sign in
          </a>
          <a href="#apply" className="btn btn-primary nav-desktop">
            Apply for a loan
          </a>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <IconMenu />
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={`mobile-panel ${open ? 'open' : ''}`}>
        <nav className="nav" aria-label="Mobile">
          <a href="#customers" onClick={() => setOpen(false)}>
            Customers
          </a>
          <a href="#administrators" onClick={() => setOpen(false)}>
            Administrators
          </a>
          <a href="#scope" onClick={() => setOpen(false)}>
            Data model
          </a>
          <a href="#how" onClick={() => setOpen(false)}>
            Workflow
          </a>
          <a href="#employee-sign-in" className="btn btn-ghost">
            Employee sign in
          </a>
          <a href="#apply" className="btn btn-primary">
            Apply for a loan
          </a>
        </nav>
      </div>
    </header>
  )
}
