import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Home, Briefcase, GitCompareArrows, Users, Bot, GraduationCap, Settings, LogOut, Globe, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRegion, type Region } from "@/lib/region";
import logoSrc from "@assets/1_1773849007741.png";
import { useIsMobile } from "@/hooks/use-mobile";

const BASE_NAV_ITEMS = [
  { label: "Home", subtitle: "", path: "/", icon: Home, disabled: false },
  { label: "JobCheck", subtitle: "Stellenanalyse", path: "/rollen-dna", icon: Briefcase, disabled: false },
  { label: "MatchCheck", subtitle: "Stelle \u2194 Person", path: "/soll-ist", icon: GitCompareArrows, disabled: false },
  { label: "TeamCheck", subtitle: "Teamstruktur", path: "/team-report", icon: Users, disabled: false },
  { label: "Louis (KI-Coach)", subtitle: "Führung & Entwicklung", path: "/ki-coach", icon: Bot, disabled: false },
];

const COURSE_NAV_ITEM = { label: "Kursbereich", subtitle: "Lernmodule", path: "/kurs", icon: GraduationCap, disabled: false };

const RESET_KEYS = [
  "rollenDnaState",
  "berichtCache",
  "analyseTexte",
  "rollenDnaCompleted",
];

const NAV_HEIGHT = 56;
const MOBILE_NAV_HEIGHT = 60;

const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: "DE", label: "Deutschland" },
  { value: "CH", label: "Schweiz" },
  { value: "AT", label: "Österreich" },
];

export default function GlobalNav({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { region, setRegion } = useRegion();
  const [regionOpen, setRegionOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const NAV_ITEMS = useMemo(() => {
    const items = [...BASE_NAV_ITEMS];
    if (user?.courseAccess || user?.role === "admin" || user?.role === "subadmin") {
      items.push(COURSE_NAV_ITEM);
    }
    return items;
  }, [user?.courseAccess, user?.role]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) {
        setRegionOpen(false);
      }
    }
    if (regionOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [regionOpen]);

  const currentLabel = REGION_OPTIONS.find(r => r.value === region)?.value || "DE";

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

  if (isMobile) {
    return (
      <>
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9000,
          background: "#FFFFFF",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 12px", height: 48,
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              bioLogic
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {rightSlot}
              <div ref={regionRef} style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setRegionOpen(!regionOpen); }}
                  data-testid="nav-region-toggle"
                  title={`Sprachregion: ${REGION_OPTIONS.find(r => r.value === region)?.label}`}
                  style={{
                    height: 32, paddingLeft: 8, paddingRight: 10, borderRadius: 8,
                    border: regionOpen ? "1px solid rgba(0,113,227,0.2)" : "1px solid transparent",
                    cursor: "pointer",
                    background: regionOpen ? "rgba(0,113,227,0.06)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    transition: "all 200ms ease",
                    lineHeight: 1,
                  }}
                >
                  <Globe style={{ width: 14, height: 14, color: "#86868B", strokeWidth: 1.8 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#636366" }}>{currentLabel}</span>
                </button>
                {regionOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0,
                    background: "#FFFFFF", borderRadius: 12,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
                    padding: 4, minWidth: 170, zIndex: 9999,
                  }}>
                    <div style={{ padding: "6px 12px 4px", fontSize: 10, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Sprachregion
                    </div>
                    {REGION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={(e) => { e.stopPropagation(); setRegion(opt.value); setRegionOpen(false); }}
                        data-testid={`nav-region-${opt.value.toLowerCase()}`}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                          background: region === opt.value ? "rgba(0,113,227,0.08)" : "transparent",
                          transition: "all 150ms ease", textAlign: "left",
                        }}
                      >
                          <span style={{ fontSize: 12, fontWeight: 600, color: region === opt.value ? "#0071E3" : "#86868B", width: 22 }}>{opt.value}</span>
                        <span style={{ fontSize: 13, fontWeight: region === opt.value ? 600 : 450, color: region === opt.value ? "#0071E3" : "#1D1D1F" }}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {(user?.role === "admin" || user?.role === "subadmin") && (
                <button
                  onClick={() => setLocation("/firma-dashboard")}
                  data-testid="nav-firma-dashboard-mobile"
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: "none", cursor: "pointer",
                    background: location === "/firma-dashboard" ? "rgba(0,113,227,0.08)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 200ms ease",
                  }}
                >
                  <Building2 style={{ width: 15, height: 15, color: location === "/firma-dashboard" ? "#0071E3" : "#86868B", strokeWidth: 1.8 }} />
                </button>
              )}
              {user?.role === "admin" && (
                <button
                  onClick={() => setLocation("/admin")}
                  data-testid="nav-admin"
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: "none", cursor: "pointer",
                    background: location === "/admin" ? "rgba(0,113,227,0.08)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 200ms ease",
                  }}
                >
                  <Settings style={{ width: 15, height: 15, color: location === "/admin" ? "#0071E3" : "#86868B", strokeWidth: 1.8 }} />
                </button>
              )}
              <button
                onClick={logout}
                data-testid="nav-logout"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "none", cursor: "pointer",
                  background: "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 200ms ease",
                }}
              >
                <LogOut style={{ width: 15, height: 15, color: "#86868B", strokeWidth: 1.8 }} />
              </button>
            </div>
          </div>
        </div>
        <div style={{ height: 48 }} />

        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9000,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          <nav style={{
            display: "flex", alignItems: "center", justifyContent: "space-around",
            height: MOBILE_NAV_HEIGHT, padding: "0 4px",
          }} data-testid="global-nav">
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
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    padding: "6px 8px", borderRadius: 10,
                    background: "transparent",
                    border: "none", cursor: item.disabled ? "default" : "pointer",
                    opacity: item.disabled ? 0.35 : 1,
                    minWidth: 0, flex: 1,
                  }}
                >
                  <Icon style={{
                    width: 20, height: 20, strokeWidth: 1.8,
                    color: active ? "#0071E3" : "#86868B",
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: active ? 600 : 500,
                    color: active ? "#0071E3" : "#86868B",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </>
    );
  }

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
                    position: "relative",
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
                  {active && (
                    <div style={{
                      position: "absolute", bottom: -2, left: 12, right: 12,
                      height: 2, borderRadius: 1,
                      background: "#0071E3",
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 28 }}>
            {rightSlot}
            <div ref={regionRef} style={{ position: "relative" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setRegionOpen(!regionOpen); }}
                data-testid="nav-region-toggle"
                title={`Sprachregion: ${REGION_OPTIONS.find(r => r.value === region)?.label}`}
                style={{
                  height: 32, paddingLeft: 8, paddingRight: 10, borderRadius: 8,
                  border: regionOpen ? "1px solid rgba(0,113,227,0.2)" : "1px solid transparent",
                  cursor: "pointer",
                  background: regionOpen ? "rgba(0,113,227,0.06)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  transition: "all 200ms ease",
                  fontSize: 16, lineHeight: 1,
                }}
                onMouseEnter={(e) => { if (!regionOpen) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                onMouseLeave={(e) => { if (!regionOpen) e.currentTarget.style.background = "transparent"; }}
              >
                <Globe style={{ width: 14, height: 14, color: "#86868B", strokeWidth: 1.8 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#636366" }}>{currentLabel}</span>
              </button>
              {regionOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0,
                  background: "#FFFFFF", borderRadius: 12,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
                  padding: 4, minWidth: 170, zIndex: 9999,
                }}>
                  <div style={{ padding: "6px 12px 4px", fontSize: 10, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Sprachregion
                  </div>
                  {REGION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={(e) => { e.stopPropagation(); setRegion(opt.value); setRegionOpen(false); }}
                      data-testid={`nav-region-${opt.value.toLowerCase()}`}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                        background: region === opt.value ? "rgba(0,113,227,0.08)" : "transparent",
                        transition: "all 150ms ease", textAlign: "left",
                      }}
                      onMouseEnter={(e) => { if (region !== opt.value) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                      onMouseLeave={(e) => { if (region !== opt.value) e.currentTarget.style.background = "transparent"; }}
                    >
                        <span style={{ fontSize: 12, fontWeight: 600, color: region === opt.value ? "#0071E3" : "#86868B", width: 22 }}>{opt.value}</span>
                      <span style={{ fontSize: 13, fontWeight: region === opt.value ? 600 : 450, color: region === opt.value ? "#0071E3" : "#1D1D1F" }}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {(user?.role === "admin" || user?.role === "subadmin") && (
              <button
                onClick={() => setLocation("/firma-dashboard")}
                data-testid="nav-firma-dashboard"
                title="Firmen-Dashboard"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "none", cursor: "pointer",
                  background: location === "/firma-dashboard" ? "rgba(0,113,227,0.08)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 200ms ease",
                }}
                onMouseEnter={(e) => { if (location !== "/firma-dashboard") e.currentTarget.style.background = "rgba(0,113,227,0.05)"; }}
                onMouseLeave={(e) => { if (location !== "/firma-dashboard") e.currentTarget.style.background = "transparent"; }}
              >
                <Building2 style={{ width: 15, height: 15, color: location === "/firma-dashboard" ? "#0071E3" : "#86868B", strokeWidth: 1.8 }} />
              </button>
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

export function StatusFooter() {
  const { user } = useAuth();
  if (!user || user.role === "admin") return null;

  const remaining = Math.max(0, user.aiRequestLimit - user.aiRequestsUsed);
  const pct = user.aiRequestLimit > 0 ? (user.aiRequestsUsed / user.aiRequestLimit) * 100 : 0;
  const color = pct >= 100 ? "#FF3B30" : pct >= 80 ? "#FF9500" : "#34C759";
  const nextReset = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const resetStr = nextReset.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div
      data-testid="status-footer"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
        padding: "6px 16px",
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        fontSize: 11, color: "#8E8E93",
      }}
    >
      <span
        data-testid="footer-ai-quota"
        title={`${user.aiRequestsUsed} von ${user.aiRequestLimit} KI-Anfragen genutzt\nAutomatische Zurücksetzung am ${resetStr}`}
        style={{ display: "flex", alignItems: "center", gap: 5, cursor: "default" }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span>KI:&nbsp;<span style={{ fontWeight: 600, color: pct >= 100 ? "#FF3B30" : "#636366" }}>{remaining}</span>&nbsp;von {user.aiRequestLimit} übrig</span>
        <span style={{ color: "#C7C7CC" }}>·</span>
        <span>Reset am {resetStr}</span>
      </span>
      {user.accessUntil && (
        <>
          <span style={{ color: "#C7C7CC" }}>|</span>
          <span data-testid="footer-access-until">
            Freigeschaltet bis:&nbsp;
            <span style={{ fontWeight: 600, color: "#636366" }}>
              {new Date(user.accessUntil).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </span>
        </>
      )}
      <span style={{ color: "#C7C7CC" }}>|</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <a href="/impressum" data-testid="footer-link-impressum" className="footer-link" style={{ fontSize: 11 }}>Impressum</a>
        <a href="/datenschutz" data-testid="footer-link-datenschutz" className="footer-link" style={{ fontSize: 11 }}>Datenschutz</a>
        <a href="/disclaimer" data-testid="footer-link-disclaimer" className="footer-link" style={{ fontSize: 11 }}>Disclaimer</a>
      </span>
    </div>
  );
}
