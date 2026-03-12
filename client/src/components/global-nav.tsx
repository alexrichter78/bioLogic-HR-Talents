import { useLocation } from "wouter";
import { Home, Briefcase, GitCompareArrows, Users, Bot, FileBarChart } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

const NAV_ITEMS = [
  { label: "Home", subtitle: "", path: "/", icon: Home, disabled: false },
  { label: "JobCheck", subtitle: "Analyse der Rolle", path: "/rollen-dna", icon: Briefcase, disabled: false },
  { label: "MatchCheck", subtitle: "Rolle \u2194 Person", path: "/soll-ist", icon: GitCompareArrows, disabled: false },
  { label: "TeamCheck", subtitle: "Teamstruktur", path: "/teamcheck", icon: Users },
  { label: "KI-Coach", subtitle: "Führung & Entwicklung", path: "/ki-coach", icon: Bot, disabled: false },
  { label: "TestTeamReport", subtitle: "Systemanalyse", path: "/team-report", icon: FileBarChart, disabled: false },
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
    setLocation(item.path);
  };

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.path === "/") return location === "/";
    return location.startsWith(item.path);
  };

  return (
    <>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9000,
        background: "#FFFFFF",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", height: NAV_HEIGHT, maxWidth: 1100, margin: "0 auto",
        }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }} data-testid="global-nav">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => !item.disabled && handleNav(item)}
                  disabled={item.disabled}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "6px 12px", borderRadius: 10,
                    background: active ? "rgba(0,113,227,0.08)" : "transparent",
                    border: "none", cursor: item.disabled ? "default" : "pointer",
                    transition: "all 200ms ease",
                    whiteSpace: "nowrap",
                    opacity: item.disabled ? 0.35 : 1,
                    pointerEvents: item.disabled ? "none" : "auto",
                  }}
                  onMouseEnter={(e) => {
                    if (!active && !item.disabled) {
                      e.currentTarget.style.background = "rgba(0,113,227,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active && !item.disabled) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Icon style={{
                    width: 15, height: 15, strokeWidth: 1.8,
                    color: active ? "#0071E3" : "#86868B",
                    flexShrink: 0,
                  }} />
                  <div className="hidden sm:flex" style={{ flexDirection: "column", alignItems: "flex-start", lineHeight: 1.2 }}>
                    <span style={{
                      fontSize: 13, fontWeight: active ? 600 : 500,
                      color: active ? "#0071E3" : "#1D1D1F",
                    }}>
                      {item.label}
                    </span>
                    {item.subtitle && (
                      <span style={{
                        fontSize: 10, fontWeight: 400,
                        color: active ? "rgba(0,113,227,0.7)" : "#86868B",
                        marginTop: 1,
                      }}>
                        {item.subtitle}
                      </span>
                    )}
                  </div>
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
