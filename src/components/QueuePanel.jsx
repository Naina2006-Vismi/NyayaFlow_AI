function toneClass(value) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export default function QueuePanel({
  cases,
  selectedCaseId,
  setSelectedCaseId,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  riskFilter,
  setRiskFilter,
  departments,
  extractionMode,
  setExtractionMode,
  onUpload,
  isUploading,
}) {
  return (
    <section className="queue-panel">
      <div className="panel-head">
        <div>
          <p className="micro-label">Intake queue</p>
          <h2>Case inbox</h2>
        </div>
        <label className="upload-trigger">
          <input type="file" accept=".pdf" onChange={onUpload} disabled={isUploading} />
          <span>{isUploading ? "Uploading..." : "Add original PDF"}</span>
        </label>
      </div>

      <div className="queue-controls">
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search case number, party, department, or summary"
        />

        <div className="select-grid">
          <select className="search-input compact" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {["all", "Needs review", "Approved", "Rejected"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select className="search-input compact" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="all">All departments</option>
            {departments.map((item) => (
              <option key={item.department} value={item.department}>{item.department}</option>
            ))}
          </select>

          <select className="search-input compact" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            {["all", "High", "Medium", "Low"].map((risk) => (
              <option key={risk} value={risk}>{risk} risk</option>
            ))}
          </select>
        </div>

        <div className="filter-row">
          {["auto", "heuristic", "openai"].map((mode) => (
            <button
              key={mode}
              className={extractionMode === mode ? "filter-pill active" : "filter-pill"}
              onClick={() => setExtractionMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="queue-list">
        {cases.map((item) => (
          <button
            key={item.id}
            className={selectedCaseId === item.id ? "queue-card active" : "queue-card"}
            onClick={() => setSelectedCaseId(item.id)}
          >
            <div className="queue-card-top">
              <span className={`status-chip ${toneClass(item.status)}`}>{item.status}</span>
              <span className="confidence-chip">{item.confidence}%</span>
            </div>
            <h3>{item.caseNumber}</h3>
            <p>{item.title}</p>
            <div className="queue-meta">
              <span>{item.department}</span>
              <span>{item.dueDate}</span>
            </div>
            <div className="queue-foot">
              <span>{item.extractionMethod}</span>
              <span>{item.pageCount} pages</span>
            </div>
          </button>
        ))}

        {cases.length === 0 && (
          <div className="empty-card">
            <h3>No cases found</h3>
            <p>Try clearing the filters or upload another PDF to extend the queue.</p>
          </div>
        )}
      </div>
    </section>
  );
}
