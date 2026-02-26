import { useLocation } from "wouter";
import { PlusCircle, Pencil, FileText, GitCompareArrows } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

const NAV_ITEMS = [
  { label: "Neue Rollen-DNA", path: "/rollen-dna", icon: PlusCircle, isNew: true },
  { label: "Rollen-DNA Bearbeiten", path: "/rollen-dna", icon: Pencil, isNew: false },
  { label: "Rollenprofil", path: "/bericht", icon: FileText, isNew: false },
  { label: "Soll-Ist-Vergleich", path: "/jobcheck", icon: GitCompareArrows, isNew: false },
];

const RESET_KEYS = [
  "rollenDnaState",
  "berichtCache",
  "analyseTexte",
  "rollenDnaCompleted",
];

const NAV_HEIGHT = 48;

export default function GlobalNav({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  const handleNav = (item: typeof NAV_ITEMS[0]) => {
    if (item.isNew) {
      RESET_KEYS.forEach(k => localStorage.removeItem(k));
      if (location === "/rollen-dna") {
        window.location.reload();
      } else {
        setLocation("/rollen-dna");
      }
      return;
    }
    setLocation(item.path);
  };

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.isNew) return false;
    return location === item.path;
  };

  return (
    <>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9000,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        background: "rgba(255,255,255,0.78)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px", maxWidth: 960, margin: "0 auto",
        }}>
          <button
            onClick={() => setLocation("/")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
            data-testid="nav-logo"
          >
            <img src={logoSrc} alt="bioLogic Logo" style={{ height: 26, width: "auto" }} />
          </button>

          <nav style={{ display: "flex", alignItems: "center", gap: 2 }} data-testid="global-nav">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 10,
                    background: active ? "rgba(0,113,227,0.08)" : "transparent",
                    border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: active ? 600 : 500,
                    color: active ? "#0071E3" : "#6E6E73",
                    transition: "all 200ms ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon style={{ width: 13, height: 13, strokeWidth: 2 }} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 26 }}>
            {rightSlot || <div style={{ width: 26 }} />}
          </div>
        </div>
      </div>
      <div style={{ height: NAV_HEIGHT }} />
    </>
  );
}
