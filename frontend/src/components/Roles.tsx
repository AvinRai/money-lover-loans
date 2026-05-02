import { IconBriefcase, IconWallet } from './Icons'

export function Roles() {
  return (
    <section className="section roles-section" aria-labelledby="roles-heading">
      <div className="section-head">
        <h2 id="roles-heading">Functional requirements by role</h2>
        <p>
          Matches the CMPE 157A proposal: customers interact with their own loans and applications;
          employees maintain applications, loans, payments, and customer records.
        </p>
      </div>

      <div className="roles-grid">
        <article className="role-panel" id="customers">
          <div className="card-icon">
            <IconWallet />
          </div>
          <p className="role-badge">Customer</p>
          <h3>Apply, view, and pay</h3>
          <ul className="role-list">
            <li>Apply for new loans and track application status.</li>
            <li>View current loans and amounts owed.</li>
            <li>Record payments against loans (updates balances via the payments flow).</li>
          </ul>
        </article>

        <article className="role-panel" id="administrators">
          <div className="card-icon">
            <IconBriefcase />
          </div>
          <p className="role-badge">Employee / administrator</p>
          <h3>Review and manage the portfolio</h3>
          <ul className="role-list">
            <li>View loan applications, loans, payments, and customers.</li>
            <li>Approve or deny applications; move approved loans into active loan data.</li>
            <li>Edit loans and customer profiles as needed to support servicing.</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
