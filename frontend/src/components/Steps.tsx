export function Steps() {
  return (
    <section className="steps" id="how" aria-labelledby="how-heading">
      <div className="steps-inner">
        <div className="section-head">
          <h2 id="how-heading">End-to-end workflow</h2>
          <p>
            High-level flow tying together customers, employees, and the database entities described
            in the proposal (applications → loans → payments).
          </p>
        </div>
        <div className="steps-grid">
          <div className="step">
            <h3>Submit &amp; review applications</h3>
            <p>
              Customers submit loan applications with requested amounts and terms. Employees review
              the queue, approve or deny, and attach review metadata (reviewer, timestamps, denial
              reasons when applicable).
            </p>
          </div>
          <div className="step">
            <h3>Activate &amp; manage loans</h3>
            <p>
              Approved loans are represented as loan records with balances, rates, and lifecycle
              status. Staff can adjust loan data; customers see only their own loan lines.
            </p>
          </div>
          <div className="step">
            <h3>Process payments</h3>
            <p>
              Customers apply payments toward outstanding balances. Payments link to loans and
              customers so both dashboards stay aligned with what is owed.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
