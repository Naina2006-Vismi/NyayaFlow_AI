export default function ActivityView({ activity }) {
  return (
    <section className="activity-view">
      <div className="panel-head">
        <div>
          <p className="micro-label">Operational timeline</p>
          <h2>Recent system activity</h2>
        </div>
      </div>

      <div className="activity-list">
        {activity.map((item) => (
          <article key={item.id} className="activity-item">
            <div className="activity-time">{new Date(item.createdAt).toLocaleString("en-IN")}</div>
            <div className="activity-body">
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <div className="activity-meta">
                <span>{item.actor}</span>
                <span>{item.caseNumber}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
