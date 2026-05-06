import { useLanguage } from "../LanguageContext";
import { useTranslations } from "../i18n";
import LanguageSelector from "./LanguageSelector";

export default function Sidebar({ view, setView, summary, system, onShowLanding }) {
  const { language } = useLanguage();
  const t = useTranslations(language);

  const nav = [
    ["dashboard", t.dashboard],
    ["studio", t.reviewStudio],
    ["activity", t.activityLog],
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <p className="brand-tag">NyayaFlow OS</p>
        <h1>{t.dashboardTitle}</h1>
        <p>
          {t.dashboardDescription}
        </p>
      </div>

      <LanguageSelector />

      <nav className="sidebar-nav">
        {nav.map(([key, label]) => (
          <button
            key={key}
            className={view === key ? "sidebar-link active" : "sidebar-link"}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
        {onShowLanding && (
          <button
            className="sidebar-link landing-link"
            onClick={onShowLanding}
          >
            ← Product overview
          </button>
        )}
      </nav>

      <div className="sidebar-metrics">
        <article>
          <span>{t.casesIndexed}</span>
          <strong>{summary?.totalCases ?? "--"}</strong>
        </article>
        <article>
          <span>{t.needsReview}</span>
          <strong>{summary?.reviewQueue ?? "--"}</strong>
        </article>
        <article>
          <span>{t.approved}</span>
          <strong>{summary?.approvedCases ?? "--"}</strong>
        </article>
        <article>
          <span>{t.avgConfidence}</span>
          <strong>{summary ? `${summary.averageConfidence}%` : "--"}</strong>
        </article>
      </div>

      <div className="sidebar-system">
        <p className="micro-label">{t.extractionEngine}</p>
        <h2>{system?.openaiEnabled ? t.openaiEnabled : t.heuristicOnly}</h2>
        <p>{system?.openaiEnabled ? `${t.openaiModel} ${system.model}` : t.enableOpenAI}</p>
      </div>
    </aside>
  );
}
