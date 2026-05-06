import { useEffect, useState } from "react";

function WorkflowItem({ item }) {
  return (
    <div className={`workflow-item ${item.tone}`}>
      <div className="workflow-dot" />
      <div>
        <strong>{item.label}</strong>
        <p>{item.detail}</p>
      </div>
    </div>
  );
}

export default function CaseReview({
  record,
  onSave,
  onApprove,
  onReject,
  onReextract,
  isSaving,
}) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!record) {
      setForm(null);
      return;
    }

    setForm({
      title: record.title,
      summary: record.summary,
      department: record.department,
      dueDate: record.dueDate,
      riskLevel: record.riskLevel,
      reviewerName: record.reviewerName || "",
      reviewerNotes: record.reviewerNotes || "",
    });
  }, [record]);

  if (!record || !form) {
    return (
      <section className="review-panel empty-card">
        <h2>Select a case</h2>
        <p>The review canvas will load extracted fields, editable metadata, and evidence here.</p>
      </section>
    );
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="review-panel">
      <div className="review-hero">
        <div>
          <p className="micro-label">Live review</p>
          <h2>{record.caseNumber}</h2>
          <p className="review-summary">{record.summary}</p>
        </div>
        <div className="review-badges">
          <span className="accent-badge">{record.riskLevel} risk</span>
          <span className="accent-badge muted">{record.extractionMethod}</span>
          {record.extractionModel && <span className="accent-badge muted">{record.extractionModel}</span>}
        </div>
      </div>

      <div className="review-grid">
        <article className="glass-card meta-strip">
          <div>
            <span>Order date</span>
            <strong>{record.orderDate}</strong>
          </div>
          <div>
            <span>Due date</span>
            <strong>{record.dueDate}</strong>
          </div>
          <div>
            <span>Judge</span>
            <strong>{record.judge}</strong>
          </div>
          <div>
            <span>Department</span>
            <strong>{record.department}</strong>
          </div>
          <div>
            <span>Disposition</span>
            <strong>{record.disposition}</strong>
          </div>
          <div>
            <span>Connected cases</span>
            <strong>{record.connectedCaseCount}</strong>
          </div>
        </article>

        <div className="review-columns">
          <article className="glass-card directives-card">
            <div className="card-head">
              <div>
                <p className="micro-label">Directive extraction</p>
                <h3>Actionable directions</h3>
              </div>
            </div>
            <div className="directive-stack">
              {record.directives.map((directive) => (
                <div key={directive.id} className={`directive-item ${directive.tone}`}>
                  <div className="directive-line">
                    <h4>{directive.title}</h4>
                    <span>{directive.source}</span>
                  </div>
                  <p>{directive.detail}</p>
                  <strong>{directive.deadline}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="glass-card evidence-card">
            <div className="card-head">
              <div>
                <p className="micro-label">Evidence map</p>
                <h3>Source snippets</h3>
              </div>
            </div>
            <div className="evidence-stack">
              {record.evidence.map((snippet) => (
                <div key={`${snippet.page}-${snippet.label}`} className="evidence-item">
                  <div className="evidence-top">
                    <strong>{snippet.label}</strong>
                    <span>Page {snippet.page}</span>
                  </div>
                  <p>{snippet.quote}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="review-columns">
          <article className="glass-card editor-card">
            <div className="card-head">
              <div>
                <p className="micro-label">Reviewer controls</p>
                <h3>Edit and approve</h3>
              </div>
            </div>

            <div className="form-grid">
              <label>
                <span>Title</span>
                <input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
              </label>
              <label>
                <span>Department</span>
                <input value={form.department} onChange={(event) => updateField("department", event.target.value)} />
              </label>
              <label>
                <span>Due date</span>
                <input value={form.dueDate} onChange={(event) => updateField("dueDate", event.target.value)} />
              </label>
              <label>
                <span>Risk level</span>
                <select value={form.riskLevel} onChange={(event) => updateField("riskLevel", event.target.value)}>
                  {["High", "Medium", "Low"].map((risk) => (
                    <option key={risk} value={risk}>{risk}</option>
                  ))}
                </select>
              </label>
              <label className="wide">
                <span>Summary</span>
                <textarea rows="4" value={form.summary} onChange={(event) => updateField("summary", event.target.value)} />
              </label>
              <label>
                <span>Reviewer name</span>
                <input value={form.reviewerName} onChange={(event) => updateField("reviewerName", event.target.value)} />
              </label>
              <label className="wide">
                <span>Reviewer notes</span>
                <textarea rows="4" value={form.reviewerNotes} onChange={(event) => updateField("reviewerNotes", event.target.value)} />
              </label>
            </div>

            <div className="action-row">
              <button className="secondary-btn" onClick={() => onReextract(record.id)} disabled={isSaving}>Re-extract</button>
              <button className="secondary-btn" onClick={() => onSave(record.id, form)} disabled={isSaving}>Save edits</button>
              <button className="danger-btn" onClick={() => onReject(record.id, form)} disabled={isSaving}>Reject</button>
              <button className="primary-btn" onClick={() => onApprove(record.id, form)} disabled={isSaving}>Approve</button>
            </div>
          </article>

          <article className="glass-card workflow-card">
            <div className="card-head">
              <div>
                <p className="micro-label">Workflow state</p>
                <h3>Operational readiness</h3>
              </div>
            </div>

            <div className="workflow-list">
              {record.workflow.map((item) => (
                <WorkflowItem key={item.label} item={item} />
              ))}
            </div>

            <div className="alert-stack">
              {record.alerts.map((alert, index) => (
                <div key={`${alert.title}-${index}`} className={`alert-card ${alert.severity}`}>
                  <strong>{alert.title}</strong>
                  <p>{alert.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="glass-card pdf-card">
          <div className="card-head">
            <div>
              <p className="micro-label">Original document</p>
              <h3>{record.documentName}</h3>
            </div>
          </div>
          <iframe title={record.documentName} src={record.documentUrl} className="pdf-frame" />
        </article>
      </div>
    </section>
  );
}
