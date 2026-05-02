import { BrandMark } from './Icons'

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <a className="brand" href="#top">
            <span className="brand-mark">
              <BrandMark />
            </span>
            <span className="brand-text">
              <span className="brand-title">Loaning Service</span>
              <span className="brand-subtitle">Dashboard</span>
            </span>
          </a>
          <p>
            Course project: React frontend, Python/FastAPI backend, MySQL database—customers and
            employees each get views aligned with their responsibilities.
          </p>
        </div>
        <div className="footer-col" id="employee-sign-in">
          <h4>Team</h4>
          <ul>
            <li>Avin Rai · 018132075</li>
            <li>Franklin Du · 017130646</li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Stack</h4>
          <ul>
            <li>React (frontend)</li>
            <li>FastAPI (backend)</li>
            <li>MySQL · mysql-connector-python</li>
          </ul>
        </div>
      </div>
      <p className="footer-bottom">
        Demonstration UI for CMPE 157A. Sign-in and data operations will connect to the backend when
        integrated; entities include Customers, Employees, LoanApplications, Loans, and Payments as
        defined in the project proposal.
      </p>
    </footer>
  )
}
