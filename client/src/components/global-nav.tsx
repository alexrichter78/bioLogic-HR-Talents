import { useLocation } from "wouter";
import { Home, PlusCircle, Pencil, FileText, GitCompareArrows, Bot, ClipboardCheck, FlaskConical } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

const NAV_ITEMS = [
  { label: "Home", path: "/", icon: Home, isNew: false },
  { label: "Rolle", path: "/rollen-dna", icon: Pencil, isNew: false },
  { label: "Bericht", path: "/bericht", icon: FileText, isNew: false },
  { label: "JobCheck", path: "/jobcheck", icon: GitCompareArrows, isNew: false },
  { label: "TeamCheck", path: "/teamcheck", icon: ClipboardCheck, isNew: false },
  { label: "KI-Coach", path: "/ki-coach", icon: Bot, isNew: false },
  { label: "Test", path: "/soll-ist", icon: FlaskConical, isNew: false },
];

const RESET_KEYS = [
  "rollenDnaState",
  "berichtCache",
  "analyseTexte",
  "rollenDnaCompleted",
];

const NAV_HEIGHT = 56;

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
    if (location !== item.path) return false;
    if (item.path === "/rollen-dna") {
      const hasState = !!localStorage.getItem("rollenDnaState");
      if (item.isNew) return !hasState;
      return hasState;
    }
    return true;
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
          padding: "0 20px", height: 56, maxWidth: 1100, margin: "0 auto",
        }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }} data-testid="global-nav">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 10,
                    background: active ? "rgba(0,113,227,0.08)" : "transparent",
                    border: "none", cursor: "pointer",
                    fontSize: 13.5, fontWeight: active ? 600 : 500,
                    color: active ? "#0071E3" : "#1D1D1F",
                    transition: "all 200ms ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(0,113,227,0.08)";
                      e.currentTarget.style.color = "#0071E3";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#1D1D1F";
                    }
                  }}
                >
                  <Icon style={{ width: 15, height: 15, strokeWidth: 1.8 }} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 28 }}>
            {rightSlot || <div style={{ width: 28 }} />}
          </div>
        </div>
      </div>
      <div style={{ height: NAV_HEIGHT }} />
    </>
  );
}
