export default function DashboardView({ dashboard, setView, setSelectedCaseId }) {
  if (!dashboard) {
    return <section className="dashboard-view empty-card"><p>Loading dashboard...</p></section>;
  }

  return (
    <section className="dashboard-view">
      <div className="dashboard-hero">
        <div>
          <p className="micro-label">Command overview</p>
          <h2>Multi-document dashboard</h2>
          <p>Track departments, deadline pressure, and extraction quality across every uploaded judgment.</p>
        </div>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span>Total cases</span>
          <strong>{dashboard.summary.totalCases}</strong>
        </article>
        <article className="stat-card">
          <span>Needs review</span>
          <strong>{dashboard.summary.reviewQueue}</strong>
        </article>
        <article className="stat-card">
          <span>Approved</span>
          <strong>{dashboard.summary.approvedCases}</strong>
        </article>
        <article className="stat-card">
          <span>High risk</span>
          <strong>{dashboard.summary.highRiskCases}</strong>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="glass-card">
          <div className="card-head">
            <div>
              <p className="micro-label">Departments</p>
              <h3>Workload by department</h3>
            </div>
          </div>
          <div className="list-stack">
            {dashboard.summary.departments.map((item) => (
              <div key={item.department} className="line-item">
                <div>
                  <strong>{item.department}</strong>
                  <p>{item.count} total · {item.pending} pending · {item.approved} approved</p>
                </div>
                <span>{item.highRisk} high risk</span>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-card">
          <div className="card-head">
            <div>
              <p className="micro-label">Deadline alerts</p>
              <h3>Escalations to watch</h3>
            </div>
          </div>
          <div className="list-stack">
            {dashboard.alerts.map((alert, index) => (
              <button
                key={`${alert.caseNumber}-${index}`}
                className={`alert-line ${alert.severity}`}
                onClick={() => {
                  setSelectedCaseId(alert.caseId);
                  setView("studio");
                }}
              >
                <strong>{alert.caseNumber} · {alert.title}</strong>
                <p>{alert.detail}</p>
              </button>
            ))}
          </div>
        </article>
      </div>

      <article className="glass-card">
        <div className="card-head">
          <div>
            <p className="micro-label">Upcoming deadlines</p>
            <h3>Next action windows</h3>
          </div>
        </div>
        <div className="list-stack">
          {dashboard.upcoming.map((item) => (
            <button
              key={item.id}
              className="line-item buttonish"
              onClick={() => {
                setSelectedCaseId(item.id);
                setView("studio");
              }}
            >
              <div>
                <strong>{item.caseNumber}</strong>
                <p>{item.department} · {item.title}</p>
              </div>
              <span>{item.dueDate}</span>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
