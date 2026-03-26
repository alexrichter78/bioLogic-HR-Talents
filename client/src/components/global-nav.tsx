import { useLocation } from "wouter";
import { Home, Briefcase, GitCompareArrows, Users, Bot, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import logoSrc from "@assets/1_1773849007741.png";

const NAV_ITEMS = [
  { label: "Home", subtitle: "", path: "/", icon: Home, disabled: false },
  { label: "JobCheck", subtitle: "Stellenanalyse", path: "/rollen-dna", icon: Briefcase, disabled: false },
  { label: "MatchCheck", subtitle: "Stelle \u2194 Person", path: "/soll-ist", icon: GitCompareArrows, disabled: false },
  { label: "TeamCheck", subtitle: "Teamstruktur", path: "/team-report", icon: Users, disabled: false },
  { label: "KI-Coach", subtitle: "Führung & Entwicklung", path: "/ki-coach", icon: Bot, disabled: false },
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
  const { user, logout } = useAuth();

  const handleNav = (item: typeof NAV_ITEMS[0]) => {
    if (location === item.path || location.startsWith(item.path + "/")) {
      window.dispatchEvent(new CustomEvent("nav-reclick", { detail: item.path }));
    }
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

          <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 28 }}>
            {rightSlot}
            {user?.accessUntil && user.role !== "admin" && (
              <span
                data-testid="nav-access-until"
                style={{
                  fontSize: 10, color: "#8E8E93", whiteSpace: "nowrap",
                  padding: "4px 8px", borderRadius: 6,
                  background: "rgba(0,0,0,0.02)",
                  lineHeight: 1.3,
                }}
              >
                Freigeschaltet bis:&nbsp;
                <span style={{ fontWeight: 600, color: "#636366" }}>
                  {new Date(user.accessUntil).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </span>
              </span>
            )}
            {user?.role === "admin" && (
              <button
                onClick={() => setLocation("/admin")}
                data-testid="nav-admin"
                title="Benutzerverwaltung"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "none", cursor: "pointer",
                  background: location === "/admin" ? "rgba(0,113,227,0.08)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => { if (location !== "/admin") e.currentTarget.style.background = "rgba(0,113,227,0.05)"; }}
                onMouseLeave={(e) => { if (location !== "/admin") e.currentTarget.style.background = "transparent"; }}
              >
                <Settings style={{ width: 15, height: 15, color: location === "/admin" ? "#0071E3" : "#86868B", strokeWidth: 1.8 }} />
              </button>
            )}
            <button
              onClick={logout}
              data-testid="nav-logout"
              title="Abmelden"
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: "none", cursor: "pointer",
                background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,59,48,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut style={{ width: 15, height: 15, color: "#86868B", strokeWidth: 1.8 }} />
            </button>
          </div>
        </div>
      </div>
      <div style={{ height: NAV_HEIGHT }} />
    </>
  );
}
