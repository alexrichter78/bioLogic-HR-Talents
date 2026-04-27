import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Database, Languages, Search, ChevronUp, ChevronDown, Plus, AlertCircle } from "lucide-react";

interface UserWithSub {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: string;
  isActive: boolean;
  courseAccess: boolean;
  coachOnly: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  organizationId: number | null;
  aiRequestLimit: number;
  aiRequestsUsed: number;
  subscription: {
    id: number;
    plan: string;
    status: string;
    accessUntil: string;
    notes: string | null;
  } | null;
}

type SortField = "name" | "company" | "email" | "role" | "createdAt" | "accessUntil" | "daysLeft" | "lastLoginAt" | "aiUsage" | "status";
type SortDir = "asc" | "desc";

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((target - now) / (1000 * 60 * 60 * 24));
}

function expiryBadge(days: number | null): { label: string; bg: string; color: string; border: string } {
  if (days === null) return { label: "Unbegrenzt", bg: "#F2F2F7", color: "#3C3C43", border: "rgba(0,0,0,0.08)" };
  if (days < 0) return { label: `Abgelaufen (vor ${Math.abs(days)} T.)`, bg: "#7F1D1D", color: "#FFFFFF", border: "#7F1D1D" };
  if (days < 30) return { label: `${days} Tage`, bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" };
  if (days < 90) return { label: `${days} Tage`, bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" };
  return { label: `${days} Tage`, bg: "#DCFCE7", color: "#166534", border: "#86EFAC" };
}

function aiUsagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function aiUsageColor(percent: number): string {
  if (percent >= 90) return "#DC2626";
  if (percent >= 70) return "#D97706";
  return "#16A34A";
}

export default function Check() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }
    if (user.role !== "admin") {
      setLocation("/");
      return;
    }
    loadUsers();
  }, [user, setLocation]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (res.ok) {
        setUsers(await res.json());
      } else {
        setError("Benutzer konnten nicht geladen werden");
      }
    } catch {
      setError("Verbindungsfehler");
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.companyName.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": {
          const an = `${a.lastName} ${a.firstName}`.trim().toLowerCase() || a.username.toLowerCase();
          const bn = `${b.lastName} ${b.firstName}`.trim().toLowerCase() || b.username.toLowerCase();
          cmp = an.localeCompare(bn, "de");
          break;
        }
        case "company":
          cmp = (a.companyName || "").localeCompare(b.companyName || "", "de");
          break;
        case "email":
          cmp = (a.email || "").localeCompare(b.email || "", "de");
          break;
        case "role":
          cmp = (a.role || "").localeCompare(b.role || "");
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "accessUntil": {
          const av = a.subscription?.accessUntil ? new Date(a.subscription.accessUntil).getTime() : Number.MAX_SAFE_INTEGER;
          const bv = b.subscription?.accessUntil ? new Date(b.subscription.accessUntil).getTime() : Number.MAX_SAFE_INTEGER;
          cmp = av - bv;
          break;
        }
        case "daysLeft": {
          const ad = a.subscription?.accessUntil ? daysUntil(a.subscription.accessUntil) : null;
          const bd = b.subscription?.accessUntil ? daysUntil(b.subscription.accessUntil) : null;
          // null (Unbegrenzt) ans Ende sortieren
          const av = ad === null ? Number.MAX_SAFE_INTEGER : ad;
          const bv = bd === null ? Number.MAX_SAFE_INTEGER : bd;
          cmp = av - bv;
          break;
        }
        case "lastLoginAt": {
          const av = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          const bv = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          cmp = av - bv;
          break;
        }
        case "aiUsage": {
          cmp = aiUsagePercent(a.aiRequestsUsed, a.aiRequestLimit) - aiUsagePercent(b.aiRequestsUsed, b.aiRequestLimit);
          break;
        }
        case "status": {
          const av = a.isActive ? 1 : 0;
          const bv = b.isActive ? 1 : 0;
          cmp = av - bv;
          break;
        }
      }
      return cmp * dir;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortHeader({ field, label, align = "left" }: { field: SortField; label: string; align?: "left" | "center" | "right" }) {
    const active = sortField === field;
    return (
      <button
        onClick={() => toggleSort(field)}
        data-testid={`sort-${field}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
          gap: 4,
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700,
          color: active ? "#1D1D1F" : "#8E8E93",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          textAlign: align,
        }}
      >
        {label}
        {active ? (
          sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <span style={{ width: 12, height: 12, opacity: 0.3 }}><ChevronUp size={12} /></span>
        )}
      </button>
    );
  }

  // Auswertung der Counters für die Top-Anzeige
  const stats = useMemo(() => {
    const total = users.length;
    let expiringSoon = 0;
    let expired = 0;
    let highAi = 0;
    for (const u of users) {
      const d = u.subscription?.accessUntil ? daysUntil(u.subscription.accessUntil) : null;
      if (d !== null && d < 0) expired++;
      else if (d !== null && d < 30) expiringSoon++;
      const pct = aiUsagePercent(u.aiRequestsUsed, u.aiRequestLimit);
      if (pct >= 90) highAi++;
    }
    return { total, expiringSoon, expired, highAi };
  }, [users]);

  if (!user || user.role !== "admin") return null;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <GlobalNav />

      <div style={{ maxWidth: 1500, margin: "0 auto", padding: isMobile ? "16px 12px" : "24px" }}>
        {/* Header + Toolbar */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: isMobile ? 16 : 20, marginBottom: 16 }}>
          <div style={isMobile
            ? { display: "flex", flexDirection: "column", gap: 12 }
            : { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }
          }>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1D1D1F", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                <AlertCircle style={{ width: 22, height: 22, color: "#1D1D1F" }} />
                Check
              </h1>
              <p style={{ fontSize: 13, color: "#8E8E93", margin: "4px 0 0 0" }}>
                Übersicht aller Benutzer mit Lizenz- und Aktivitätsstatus
              </p>
            </div>
            <div style={isMobile
              ? { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }
              : { display: "flex", alignItems: "center", gap: 8 }
            }>
              <button onClick={() => setLocation("/admin")} data-testid="button-stammdaten" title="Stammdaten" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#1D1D1F", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 200ms ease" }}>
                <Database style={{ width: 16, height: 16 }} />
                Stammdaten
              </button>
              <button onClick={() => setLocation("/ubersetzung")} data-testid="button-ubersetzung" title="Übersetzungen anzeigen" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#1D1D1F", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 200ms ease" }}>
                <Languages style={{ width: 16, height: 16 }} />
                Übersetzung
              </button>
              <button onClick={() => setLocation("/admin?new=1")} data-testid="button-create-user-from-check" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, border: "none", background: "#1D1D1F", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Plus style={{ width: 16, height: 16 }} />
                Neuer Benutzer
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginTop: 16 }}>
            <div data-testid="stat-total" style={{ background: "#F2F2F7", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#8E8E93", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Benutzer gesamt</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1D1D1F", marginTop: 4 }}>{stats.total}</div>
            </div>
            <div data-testid="stat-expiring" style={{ background: "#FEF3C7", borderRadius: 10, padding: "12px 14px", border: "1px solid #FCD34D" }}>
              <div style={{ fontSize: 11, color: "#92400E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Läuft in &lt; 30 Tagen ab</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#92400E", marginTop: 4 }}>{stats.expiringSoon}</div>
            </div>
            <div data-testid="stat-expired" style={{ background: "#FEE2E2", borderRadius: 10, padding: "12px 14px", border: "1px solid #FCA5A5" }}>
              <div style={{ fontSize: 11, color: "#991B1B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Bereits abgelaufen</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#991B1B", marginTop: 4 }}>{stats.expired}</div>
            </div>
            <div data-testid="stat-ai-high" style={{ background: "#FEE2E2", borderRadius: 10, padding: "12px 14px", border: "1px solid #FCA5A5" }}>
              <div style={{ fontSize: 11, color: "#991B1B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>KI-Verbrauch ≥ 90 %</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#991B1B", marginTop: 4 }}>{stats.highAi}</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 12, marginBottom: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8E8E93" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Suche nach Name, Benutzername, E-Mail oder Firma…"
              data-testid="input-search-users"
              style={{ width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, color: "#1D1D1F", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {search && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#8E8E93" }} data-testid="text-result-count">
              {sorted.length} von {users.length} Benutzern
            </div>
          )}
        </div>

        {/* Table */}
        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: 12, marginBottom: 12, color: "#991B1B", fontSize: 13 }} data-testid="text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 60, textAlign: "center", color: "#8E8E93", fontSize: 14 }} data-testid="text-loading">
            Lade Benutzer…
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 60, textAlign: "center", color: "#8E8E93", fontSize: 14 }} data-testid="text-empty">
            Keine Benutzer gefunden.
          </div>
        ) : (
          <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1100 }}>
                <thead>
                  <tr style={{ background: "#F9F9FB", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="name" label="Name" /></th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="company" label="Firma" /></th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="email" label="E-Mail" /></th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="role" label="Rolle" /></th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="createdAt" label="Beginn" /></th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="accessUntil" label="Ablauf" /></th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="daysLeft" label="Tage bis Ablauf" /></th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="lastLoginAt" label="Letzter Login" /></th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="aiUsage" label="KI-Verbrauch" /></th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}><SortHeader field="status" label="Status" /></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((u, idx) => {
                    const d = u.subscription?.accessUntil ? daysUntil(u.subscription.accessUntil) : null;
                    const badge = expiryBadge(d);
                    const aiPct = aiUsagePercent(u.aiRequestsUsed, u.aiRequestLimit);
                    const aiClr = aiUsageColor(aiPct);
                    const fullName = `${u.firstName} ${u.lastName}`.trim() || u.username;
                    return (
                      <tr
                        key={u.id}
                        data-testid={`row-user-${u.id}`}
                        onClick={() => setLocation("/admin")}
                        style={{
                          borderBottom: idx === sorted.length - 1 ? "none" : "1px solid rgba(0,0,0,0.05)",
                          cursor: "pointer",
                          transition: "background 150ms ease",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 600, color: "#1D1D1F" }} data-testid={`text-name-${u.id}`}>{fullName}</div>
                          <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 2 }}>@{u.username}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#3C3C43" }} data-testid={`text-company-${u.id}`}>
                          {u.companyName || "—"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#3C3C43" }} data-testid={`text-email-${u.id}`}>
                          {u.email ? (
                            <a
                              href={`mailto:${u.email}`}
                              onClick={e => e.stopPropagation()}
                              style={{ color: "#0066CC", textDecoration: "none" }}
                            >
                              {u.email}
                            </a>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span data-testid={`text-role-${u.id}`} style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: u.role === "admin" ? "#1D1D1F" : "#F2F2F7",
                            color: u.role === "admin" ? "#FFFFFF" : "#3C3C43",
                          }}>
                            {u.role === "admin" ? "Admin" : "Benutzer"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#3C3C43" }} data-testid={`text-created-${u.id}`}>
                          {formatDate(u.createdAt)}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#3C3C43" }} data-testid={`text-expires-${u.id}`}>
                          {u.subscription?.accessUntil ? formatDate(u.subscription.accessUntil) : "Unbegrenzt"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span data-testid={`badge-days-${u.id}`} style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            whiteSpace: "nowrap",
                          }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#3C3C43" }} data-testid={`text-lastlogin-${u.id}`}>
                          {formatDate(u.lastLoginAt)}
                        </td>
                        <td style={{ padding: "12px 14px" }} data-testid={`cell-ai-${u.id}`}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 60, height: 6, background: "#F2F2F7", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${aiPct}%`, height: "100%", background: aiClr, transition: "width 200ms ease" }} />
                            </div>
                            <span style={{ fontSize: 11, color: "#3C3C43", whiteSpace: "nowrap", minWidth: 80, textAlign: "right" }}>
                              {u.aiRequestsUsed} / {u.aiRequestLimit}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span data-testid={`badge-status-${u.id}`} style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: u.isActive ? "#DCFCE7" : "#F2F2F7",
                            color: u.isActive ? "#166534" : "#8E8E93",
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: u.isActive ? "#16A34A" : "#8E8E93" }} />
                            {u.isActive ? "Aktiv" : "Inaktiv"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, fontSize: 12, color: "#8E8E93", textAlign: "center" }}>
          Klick auf eine Zeile öffnet die Bearbeitung in den Stammdaten.
        </div>
      </div>
    </div>
  );
}
