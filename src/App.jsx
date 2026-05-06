import { useDeferredValue, useEffect, useState } from "react";
import ActivityView from "./components/ActivityView";
import CaseReview from "./components/CaseReview";
import DashboardView from "./components/DashboardView";
import LandingPage from "./components/LandingPage";
import QueuePanel from "./components/QueuePanel";
import Sidebar from "./components/Sidebar";
import { LanguageProvider } from "./LanguageContext";
import {
  fetchActivity,
  fetchCase,
  fetchCases,
  fetchDashboard,
  fetchSummary,
  fetchSystem,
  reextractCase,
  updateCase,
  uploadDocument,
} from "./lib/api";

function AppContent() {
  const [view, setView] = useState("landing");
  const [summary, setSummary] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [system, setSystem] = useState(null);
  const [cases, setCases] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [extractionMode, setExtractionMode] = useState("auto");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isBooting, setIsBooting] = useState(true);

  const deferredQuery = useDeferredValue(query);

  async function loadSummary() {
    setSummary(await fetchSummary());
  }

  async function loadDashboard() {
    setDashboard(await fetchDashboard());
  }

  async function loadSystem() {
    setSystem(await fetchSystem());
  }

  async function loadCases() {
    const nextCases = await fetchCases({
      query: deferredQuery,
      status: statusFilter,
      department: departmentFilter,
      risk: riskFilter,
    });
    setCases(nextCases);
    if (!nextCases.some((item) => item.id === selectedCaseId)) {
      setSelectedCaseId(nextCases[0]?.id ?? "");
    }
  }

  async function loadActivity() {
    setActivity(await fetchActivity());
  }

  async function refreshAll() {
    await Promise.all([loadSummary(), loadDashboard(), loadCases(), loadActivity(), loadSystem()]);
  }

  useEffect(() => {
    refreshAll()
      .catch((loadError) => setError(loadError.message))
      .finally(() => setIsBooting(false));
  }, []);

  useEffect(() => {
    loadCases().catch((loadError) => setError(loadError.message));
  }, [deferredQuery, statusFilter, departmentFilter, riskFilter]);

  useEffect(() => {
    if (!selectedCaseId) {
      setSelectedCase(null);
      return;
    }
    fetchCase(selectedCaseId)
      .then(setSelectedCase)
      .catch((loadError) => setError(loadError.message));
  }, [selectedCaseId]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setError("");
      setIsUploading(true);
      const created = await uploadDocument(file, extractionMode);
      await refreshAll();
      setSelectedCaseId(created.id);
      setView("studio");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleCaseUpdate(id, payload) {
    try {
      setError("");
      setIsSaving(true);
      await updateCase(id, payload);
      await refreshAll();
      setSelectedCase(await fetchCase(id));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReextract(id) {
    try {
      setError("");
      setIsSaving(true);
      await reextractCase(id, extractionMode);
      await refreshAll();
      setSelectedCase(await fetchCase(id));
    } catch (reextractError) {
      setError(reextractError.message);
    } finally {
      setIsSaving(false);
    }
  }

  /* ─── Landing page ─── */
  if (view === "landing") {
    return (
      <LandingPage onEnterApp={() => setView("dashboard")} onNavigate={(v) => setView(v)} />
    );
  }

  /* ─── Main app shell ─── */
  return (
    <div className="workspace-shell">
      <Sidebar
        view={view}
        setView={setView}
        summary={summary}
        system={system}
        onShowLanding={() => setView("landing")}
      />

      <main className="workspace-main">
        {error && <div className="error-banner">{error}</div>}

        {isBooting ? (
          <section className="dashboard-view empty-card">
            <h2>Starting workspace</h2>
            <p>Connecting to the local review API and loading indexed judgments.</p>
          </section>
        ) : view === "dashboard" && (
          <DashboardView dashboard={dashboard} setView={setView} setSelectedCaseId={setSelectedCaseId} />
        )}

        {!isBooting && view === "studio" && (
          <div className="studio-layout">
            <QueuePanel
              cases={cases}
              selectedCaseId={selectedCaseId}
              setSelectedCaseId={setSelectedCaseId}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              departmentFilter={departmentFilter}
              setDepartmentFilter={setDepartmentFilter}
              riskFilter={riskFilter}
              setRiskFilter={setRiskFilter}
              departments={summary?.departments ?? []}
              extractionMode={extractionMode}
              setExtractionMode={setExtractionMode}
              onUpload={handleUpload}
              isUploading={isUploading}
            />
            <CaseReview
              record={selectedCase}
              onSave={(id, form) => handleCaseUpdate(id, form)}
              onApprove={(id, form) => handleCaseUpdate(id, { ...form, action: "approve" })}
              onReject={(id, form) => handleCaseUpdate(id, { ...form, action: "reject" })}
              onReextract={handleReextract}
              isSaving={isSaving}
            />
          </div>
        )}

        {!isBooting && view === "activity" && <ActivityView activity={activity} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
