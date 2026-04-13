import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Building2, BarChart3, Users, Bot, Briefcase, GitCompareArrows, Loader2 } from "lucide-react";

interface OrgInfo {
  id: number;
  name: string;
  aiRequestLimit: number | null;
  aiRequestsUsed: number;
  currentPeriodStart: string;
}

interface UsageTotals {
  eventType: string;
  count: number;
}

interface PerUserUsage {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  eventType: string;
  count: number;
}

const EVENT_LABELS: [string, string][] = [
  ["ki_coach", "KI-Coach"],
  ["rollendna", "JobCheck"],
  ["matchcheck", "MatchCheck"],
  ["teamdynamik", "TeamCheck"],
];

const EVENT_ICONS: Record<string, typeof Bot> = {
  ki_coach: Bot,
  rollendna: Briefcase,
  matchcheck: GitCompareArrows,
  teamdynamik: Users,
};

const EVENT_COLORS: Record<string, string> = {
  ki_coach: "#0071E3",
  rollendna: "#34C759",
  matchcheck: "#FF3B30",
  teamdynamik: "#AF52DE",
};

const PERIOD_OPTIONS = [
  { value: "7", label: "7 Tage" },
  { value: "30", label: "30 Tage" },
  { value: "90", label: "90 Tage" },
  { value: "all", label: "Gesamt" },
];

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function FirmaDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organization, setOrganization] = useState<OrgInfo | null>(null);
  const [totals, setTotals] = useState<UsageTotals[]>([]);
  const [perUser, setPerUser] = useState<PerUserUsage[]>([]);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "subadmin")) {
      setLocation("/");
      return;
    }
    loadData();
  }, [user, setLocation, period]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const sinceParam = period === "all" ? "" : `?since=${new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString()}`;
      const res = await fetch(`/api/subadmin/usage${sinceParam}`, { credentials: "include" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Fehler beim Laden");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrganization(data.organization);
      setTotals(data.totals || []);
      setPerUser(data.perUser || []);
    } catch {
      setError("Verbindungsfehler");
    }
    setLoading(false);
  }

  if (!user || (user.role !== "admin" && user.role !== "subadmin")) return null;

  function normalizeEventType(et: string): string {
    if (et === "teamcheck") return "teamdynamik";
    return et;
  }

  const mergedTotals: { eventType: string; count: number }[] = [];
  for (const t of totals) {
    const key = normalizeEventType(t.eventType);
    const existing = mergedTotals.find(m => m.eventType === key);
    if (existing) existing.count += Number(t.count);
    else mergedTotals.push({ eventType: key, count: Number(t.count) });
  }
  const totalRequests = mergedTotals.reduce((sum, t) => sum + t.count, 0);

  const userMap = new Map<number, { username: string; firstName: string; lastName: string; events: Record<string, number>; total: number }>();
  for (const pu of perUser) {
    if (!userMap.has(pu.userId)) {
      userMap.set(pu.userId, { username: pu.username, firstName: pu.firstName, lastName: pu.lastName, events: {}, total: 0 });
    }
    const u = userMap.get(pu.userId)!;
    const key = normalizeEventType(pu.eventType);
    u.events[key] = (u.events[key] || 0) + Number(pu.count);
    u.total += Number(pu.count);
  }
  const userList = Array.from(userMap.entries()).sort((a, b) => b[1].total - a[1].total);

  const quotaPercent = organization?.aiRequestLimit ? Math.min(100, Math.round((organization.aiRequestsUsed / organization.aiRequestLimit) * 100)) : null;

  return (
    <div className="page-gradient-bg" style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <GlobalNav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "64px 12px 80px" : "80px 20px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 10 }} data-testid="text-firma-title">
              <Building2 style={{ width: 24, height: 24, color: "#1A5DAB" }} />
              Firmen-Dashboard
            </h1>
            {organization && (
              <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }} data-testid="text-org-name">{organization.name}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3 }}>
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                data-testid={`period-${opt.value}`}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: period === opt.value ? "#fff" : "transparent",
                  color: period === opt.value ? "#1D1D1F" : "#8E8E93",
                  boxShadow: period === opt.value ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 150ms ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#8E8E93" }}>
            <Loader2 style={{ width: 28, height: 28, animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14 }}>Laden...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 60, color: "#C41E3A" }}>
            <p style={{ fontSize: 14 }} data-testid="text-error">{error}</p>
          </div>
        ) : (
          <>
            {organization && quotaPercent !== null && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.06)", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }} data-testid="card-quota">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>KI-Kontingent</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: quotaPercent >= 90 ? "#C41E3A" : quotaPercent >= 70 ? "#FF9500" : "#34C759" }}>
                    {organization.aiRequestsUsed} / {organization.aiRequestLimit} Anfragen
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4, transition: "width 300ms ease",
                    width: `${quotaPercent}%`,
                    background: quotaPercent >= 90 ? "#FF3B30" : quotaPercent >= 70 ? "#FF9500" : "#34C759",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "#8E8E93" }}>Periode seit {formatDate(organization.currentPeriodStart)}</span>
                  <span style={{ fontSize: 11, color: "#8E8E93" }}>{quotaPercent}% genutzt</span>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {EVENT_LABELS.map(([key, label]) => {
                const count = mergedTotals.find(t => t.eventType === key)?.count || 0;
                const Icon = EVENT_ICONS[key] || BarChart3;
                const color = EVENT_COLORS[key] || "#636366";
                return (
                  <div key={key} style={{ background: "#fff", borderRadius: 14, padding: "16px 14px", border: "1px solid rgba(0,0,0,0.05)", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }} data-testid={`stat-${key}`}>
                    <Icon style={{ width: 20, height: 20, color, marginBottom: 6 }} />
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1D1D1F" }}>{Number(count)}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#8E8E93", marginTop: 2 }}>{label}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Users style={{ width: 18, height: 18, color: "#1A5DAB" }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Nutzung pro Benutzer</h2>
                <span style={{ fontSize: 12, color: "#8E8E93", fontWeight: 500 }}>{userList.length} Benutzer</span>
              </div>

              {userList.length === 0 ? (
                <p style={{ textAlign: "center", color: "#8E8E93", padding: 30, fontSize: 13 }} data-testid="text-no-usage">
                  Keine Nutzungsdaten im gewählten Zeitraum
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }} data-testid="table-usage">
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, color: "#636366", borderBottom: "2px solid rgba(0,0,0,0.06)", fontSize: 12 }}>Benutzer</th>
                        {EVENT_LABELS.map(([key, label]) => (
                          <th key={key} style={{ textAlign: "center", padding: "8px 8px", fontWeight: 600, color: EVENT_COLORS[key], borderBottom: "2px solid rgba(0,0,0,0.06)", fontSize: 11, whiteSpace: "nowrap" }}>{label}</th>
                        ))}
                        <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 700, color: "#1D1D1F", borderBottom: "2px solid rgba(0,0,0,0.06)", fontSize: 12 }}>Gesamt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userList.map(([userId, u]) => (
                        <tr key={userId} data-testid={`row-user-${userId}`}>
                          <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                            <div style={{ fontWeight: 600, color: "#1D1D1F" }}>{u.firstName} {u.lastName}</div>
                            <div style={{ fontSize: 11, color: "#8E8E93" }}>@{u.username}</div>
                          </td>
                          {EVENT_LABELS.map(([key]) => (
                            <td key={key} style={{ textAlign: "center", padding: "10px 8px", borderBottom: "1px solid rgba(0,0,0,0.04)", fontWeight: 500, color: (u.events[key] || 0) > 0 ? "#1D1D1F" : "#D1D1D6" }}>
                              {u.events[key] || 0}
                            </td>
                          ))}
                          <td style={{ textAlign: "center", padding: "10px 12px", borderBottom: "1px solid rgba(0,0,0,0.04)", fontWeight: 700, color: "#0071E3" }}>
                            {u.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1D1D1F" }}>Gesamt</td>
                        {EVENT_LABELS.map(([key]) => {
                          const sum = mergedTotals.find(t => t.eventType === key)?.count || 0;
                          return (
                            <td key={key} style={{ textAlign: "center", padding: "10px 8px", fontWeight: 700, color: EVENT_COLORS[key] }}>
                              {Number(sum)}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, color: "#0071E3", fontSize: 15 }}>
                          {totalRequests}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
