export function Cta() {
  return (
    <section className="cta-band" aria-labelledby="cta-heading">
      <div className="cta-inner">
        <div>
          <h2 id="cta-heading">Build toward the full stack deliverable</h2>
          <p>
            Frontend components connect to FastAPI endpoints and MySQL data per the project plan—this
            page summarizes scope from the approved proposal.
          </p>
        </div>
        <div className="cta-actions">
          <a href="#apply" className="btn btn-primary">
            Customer · Apply
          </a>
          <a href="#employee-sign-in" className="btn btn-ghost">
            Employee · Sign in
          </a>
        </div>
      </div>
    </section>
  )
}
