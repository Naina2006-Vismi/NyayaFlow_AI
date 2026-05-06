export default function Navbar({ activeNav, onNavigate }) {
  const links = [
    { id: "overview",   label: "Overview",    view: "landing" },
    { id: "upload",     label: "Upload",       view: "studio" },
    { id: "verify",     label: "Verify",       view: "studio" },
    { id: "dashboard",  label: "Dashboard",    view: "dashboard" },
    { id: "audit",      label: "Audit trail",  view: "activity" },
  ];

  return (
    <header className="nf-navbar">
      <div className="nf-navbar-inner">
        {/* ── Brand ── */}
        <div className="nf-brand">
          <div className="nf-logomark">N</div>
          <span className="nf-wordmark">NyayaFlow</span>
          <span className="nf-badge">AI · GOV</span>
        </div>

        {/* ── Nav links ── */}
        <nav className="nf-nav">
          {links.map((link) => (
            <button
              key={link.id}
              className={`nf-navlink${activeNav === link.id ? " active" : ""}`}
              onClick={() => onNavigate(link.view, link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
