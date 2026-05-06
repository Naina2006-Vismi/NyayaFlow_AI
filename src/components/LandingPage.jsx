import { useEffect, useRef, useState } from "react";
import Navbar from "./Navbar";

/* ─── Scroll-reveal hook ─── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Differentiators ─── */
const DIFFERENTIATORS = [
  {
    tag: "DIFFERENTIATOR",
    title: "Source-anchored extraction",
    body: "Every extracted directive links to its exact PDF page and paragraph. Click a directive — the source document scrolls and highlights that line. No claim without evidence.",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="16" height="22" rx="2.5" />
        <line x1="9" y1="8" x2="17" y2="8" />
        <line x1="9" y1="12" x2="17" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
        <circle cx="19" cy="20" r="3.5" strokeWidth="1.6" />
        <line x1="21.5" y1="22.5" x2="24" y2="25" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    tag: "LEGAL PRECISION",
    title: "Explicit vs inferred deadlines",
    body: '"On or before 30 April" is extracted verbatim (EXPLICIT). "Within 8 weeks of order" is computed to a calendar date and flagged INFERRED — with the calculation basis shown.',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="22" height="20" rx="2.5" />
        <line x1="3" y1="10" x2="25" y2="10" />
        <line x1="9" y1="4" x2="9" y2="1" />
        <line x1="19" y1="4" x2="19" y2="1" />
        <circle cx="14" cy="17" r="3.5" />
        <line x1="14" y1="15" x2="14" y2="17" />
        <line x1="14" y1="17" x2="16" y2="18" />
      </svg>
    ),
  },
  {
    tag: "MANDATORY CONTROL",
    title: "Trust gate architecture",
    body: "The dashboard API hard-filters for reviewer_status = 'approved'. No UI toggle can bypass it. AI output is invisible to decision-makers until a named officer signs off.",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="12" width="20" height="13" rx="2.5" />
        <path d="M9 12V9a5 5 0 0 1 10 0v3" />
        <circle cx="14" cy="18.5" r="1.8" fill="currentColor" />
        <line x1="14" y1="20.3" x2="14" y2="22" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    tag: "ACCURACY ENGINE",
    title: "Few-shot legal grounding",
    body: "The LLM sees 5 verified Karnataka HC judgment-action pairs before generating recommendations. It reasons by analogy — not from general legal knowledge.",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="14,3 17,10 25,10 19,15 21,23 14,18 7,23 9,15 3,10 11,10" />
      </svg>
    ),
  },
  {
    tag: "MULTILINGUAL",
    title: "Kannada + English support",
    body: "Action plans are generated in both English and Kannada. Toggle mid-session. Key directives translated using IndicTrans2 for officers more comfortable in their native language.",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h11M7 5v12M4 9c2 5 6 9 9 9" />
        <path d="M17 10l3.5 12 3.5-12" />
        <line x1="18" y1="17.5" x2="23" y2="17.5" />
      </svg>
    ),
  },
  {
    tag: "GOV COMPLIANT",
    title: "On-premise deployable",
    body: "Architecture supports both cloud API (public judgments) and local LLM deployment (sensitive case data). A single config flag switches between modes — no code changes required.",
    icon: (
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="16" width="20" height="8" rx="2" />
        <rect x="4" y="5" width="20" height="8" rx="2" />
        <circle cx="8" cy="9" r="1.4" fill="currentColor" />
        <circle cx="8" cy="20" r="1.4" fill="currentColor" />
        <line x1="12" y1="9" x2="20" y2="9" />
        <line x1="12" y1="20" x2="20" y2="20" />
      </svg>
    ),
  },
];

/* ─── Workflow steps ─── */
const WORKFLOW = [
  {
    num: "01",
    title: "Extract",
    body: "AI reads the judgment PDF — digital or scanned — and extracts every directive, party, date, and timeline. Each field is tagged with a page reference and confidence score.",
    stack: ["pdfplumber", "Tesseract OCR", "LLM schema"],
    color: "#1A7A73",
  },
  {
    num: "02",
    title: "Generate action plan",
    body: "Using few-shot legal grounding from verified Karnataka HC reference cases, the AI generates a structured action plan with compliance vs appeal recommendation and computed deadlines.",
    stack: ["Claude API", "few-shot", "RAG"],
    color: "#2A6B9E",
  },
  {
    num: "03",
    title: "Human verification",
    body: "The officer reviews AI output side-by-side with the source PDF, where clicking any directive highlights the exact paragraph. They approve, edit, or reject before anything moves forward.",
    stack: ["source linking", "audit trail", "sign-off"],
    color: "#C8922A",
  },
  {
    num: "04",
    title: "Trusted dashboard",
    body: "Only verified, signed-off records appear on the dashboard. Department heads see clean action plans, deadline countdowns, and risk alerts — zero AI noise, all human-validated.",
    stack: ["trust gate", "dept. filter", "alerts"],
    color: "#5A4EA8",
  },
];

/* ─── Diff card ─── */
function DiffCard({ item, index }) {
  const [ref, visible] = useReveal(0.1);
  return (
    <article
      ref={ref}
      className={`lp-diff-card${visible ? " revealed" : ""}`}
      style={{ transitionDelay: `${index * 70}ms` }}
    >
      <div className="lp-diff-icon">{item.icon}</div>
      <span className="lp-diff-tag">{item.tag}</span>
      <h3 className="lp-diff-title">{item.title}</h3>
      <p className="lp-diff-body">{item.body}</p>
    </article>
  );
}

/* ─── Workflow step ─── */
function WfStep({ step, index }) {
  const [ref, visible] = useReveal(0.15);
  return (
    <div
      ref={ref}
      className={`lp-wf-step${visible ? " revealed" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="lp-wf-left">
        <div className="lp-wf-num" style={{ "--step-color": step.color }}>
          {step.num}
        </div>
        {index < WORKFLOW.length - 1 && (
          <div className="lp-wf-connector" />
        )}
      </div>
      <div className="lp-wf-right">
        <h3 className="lp-wf-title">{step.title}</h3>
        <p className="lp-wf-body">{step.body}</p>
        <div className="lp-wf-stack">
          {step.stack.map((s) => (
            <span key={s} className="lp-wf-tag">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Stat chip ─── */
function StatChip({ value, label }) {
  const [ref, visible] = useReveal(0.2);
  return (
    <div ref={ref} className={`lp-stat${visible ? " revealed" : ""}`}>
      <span className="lp-stat-value">{value}</span>
      <span className="lp-stat-label">{label}</span>
    </div>
  );
}

/* ─── Main landing page ─── */
export default function LandingPage({ onEnterApp, onNavigate }) {
  const [heroRef, heroVisible] = useReveal(0.05);
  const [quoteRef, quoteVisible] = useReveal(0.2);
  const [ctaRef, ctaVisible] = useReveal(0.2);

  function handleNav(view, id) {
    if (id === "overview") return; // already here
    onNavigate(view);
  }

  return (
    <div className="lp-root">
      {/* ── NAVBAR ── */}
      <Navbar activeNav="overview" onNavigate={handleNav} />

      {/* ── HERO ── */}
      <section ref={heroRef} className={`lp-hero${heroVisible ? " revealed" : ""}`}>
        <div className="lp-hero-bg" aria-hidden="true">
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />
          <div className="lp-grid-overlay" />
        </div>

        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">
            <span className="lp-eyebrow-dot" />
            Karnataka High Court · AI-Assisted Compliance
          </div>

          <h1 className="lp-hero-h1">
            From judgment PDF<br />
            to <em>verified</em> action plan.
          </h1>

          <p className="lp-hero-sub">
            NyayaFlow AI extracts every directive, computes every deadline,
            and generates a compliance plan — then locks it behind human sign-off.
            Zero AI noise on the dashboard.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={onEnterApp}>
              Enter operations center
              <svg viewBox="0 0 18 18" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M2.5 9a.5.5 0 01.5-.5h9.086L9.147 5.354a.5.5 0 01.706-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.706-.708L12.086 9.5H3a.5.5 0 01-.5-.5z" />
              </svg>
            </button>
            <button className="lp-btn-ghost" onClick={() => document.getElementById("lp-workflow").scrollIntoView({ behavior: "smooth" })}>
              How it works
            </button>
          </div>

          <div className="lp-hero-stats">
            <StatChip value="6" label="Architectural guarantees" />
            <div className="lp-stat-divider" />
            <StatChip value="4" label="Steps to trusted output" />
            <div className="lp-stat-divider" />
            <StatChip value="2" label="Languages supported" />
            <div className="lp-stat-divider" />
            <StatChip value="1" label="Config flag to go on-prem" />
          </div>
        </div>
      </section>

      {/* ── DIFFERENTIATORS ── */}
      <section className="lp-diff-section">
        <div className="lp-section-header">
          <span className="lp-section-tag">What sets NyayaFlow apart</span>
          <h2 className="lp-section-h2">Six architectural bets</h2>
          <p className="lp-section-sub">
            Every feature exists because a real government officer needed it.
            Purpose-built for Karnataka HC judgment compliance.
          </p>
        </div>
        <div className="lp-diff-grid">
          {DIFFERENTIATORS.map((item, i) => (
            <DiffCard key={item.tag} item={item} index={i} />
          ))}
        </div>
      </section>

      {/* ── QUOTE BREAK ── */}
      <section
        ref={quoteRef}
        className={`lp-quote-section${quoteVisible ? " revealed" : ""}`}
      >
        <div className="lp-quote-inner">
          <div className="lp-quote-line" />
          <blockquote className="lp-quote-text">
            AI assists, humans decide.<br />
            <span>Nothing reaches the dashboard without a named officer's sign-off.</span>
          </blockquote>
          <div className="lp-quote-line" />
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section id="lp-workflow" className="lp-wf-section">
        <div className="lp-section-header lp-section-header--dark">
          <span className="lp-section-tag lp-section-tag--gold">How it works</span>
          <h2 className="lp-section-h2 lp-section-h2--light">Four steps to trusted compliance</h2>
          <p className="lp-section-sub lp-section-sub--muted">
            From raw PDF to verified action plan — complete auditability at every stage.
          </p>
        </div>
        <div className="lp-wf-list">
          {WORKFLOW.map((step, i) => (
            <WfStep key={step.num} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} className={`lp-cta-section${ctaVisible ? " revealed" : ""}`}>
        <div className="lp-cta-inner">
          <h2 className="lp-cta-h2">Ready to see it in action?</h2>
          <p className="lp-cta-sub">
            Upload a Karnataka HC judgment PDF and watch the full pipeline run — extract,
            plan, verify, dashboard.
          </p>
          <button className="lp-btn-primary" onClick={onEnterApp}>
            Launch NyayaFlow
            <svg viewBox="0 0 18 18" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M2.5 9a.5.5 0 01.5-.5h9.086L9.147 5.354a.5.5 0 01.706-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.706-.708L12.086 9.5H3a.5.5 0 01-.5-.5z" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="nf-logomark sm">N</div>
            <span>NyayaFlow AI</span>
          </div>
          <p className="lp-footer-note">Built for SummerSaaS Hackathon 2026 · Karnataka HC Compliance · English + ಕನ್ನಡ</p>
        </div>
      </footer>
    </div>
  );
}
