export function TrustStrip() {
  return (
    <section className="trust-strip" id="scope" aria-label="System scope">
      <div className="trust-inner">
        <div className="trust-item">
          <strong>Customers &amp; employees</strong>
          <span>
            Separate experiences: borrowers sign in to their loans; staff manage the portfolio.
          </span>
        </div>
        <div className="trust-item">
          <strong>Applications &amp; loans</strong>
          <span>
            Loan applications are reviewed, then approved loans move into active loan records with
            balances and status.
          </span>
        </div>
        <div className="trust-item">
          <strong>Payments</strong>
          <span>
            Payments post to loans and update what customers owe—visible to both customer and
            administrator views.
          </span>
        </div>
      </div>
    </section>
  )
}
