import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Users, AlertTriangle, CheckCircle, TrendingUp, ChevronDown, ChevronRight,
  Loader2, Copy, Download, RotateCcw, Eye, Briefcase, Shield, Activity,
} from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { hyphenateText } from "@/lib/hyphenate";
import {
  type Triad, type ComponentKey, type DominanceResult,
  computeTeamDynamics, getDefaultLevers, getMatrixCellById, getViewContent,
  normalizeTriad, labelComponent, dominanceLabel, buildAIPayload,
  type TeamDynamikInput, type TeamDynamikResult, type ShiftType, type IntensityLevel,
  type TrafficLight, type ViewMode, type Lever, type MatrixCell,
} from "@/lib/teamdynamik-engine";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };
function colorFor(k: ComponentKey) { return k === "impulsiv" ? COLORS.imp : k === "intuitiv" ? COLORS.int : COLORS.ana; }

const SHIFT_LABELS: Record<ShiftType, string> = {
  VERSTAERKUNG: "Verstärkung", ERGAENZUNG: "Ergänzung", REIBUNG: "Reibung",
  SPANNUNG: "Spannung", TRANSFORMATION: "Transformation", HYBRID: "Hybrid",
};

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  NIEDRIG: "Niedrig", MITTEL: "Mittel", HOCH: "Hoch",
};

const TL_COLORS: Record<TrafficLight, { bg: string; fill: string; label: string }> = {
  GREEN: { bg: "rgba(52,199,89,0.08)", fill: "#34C759", label: "Stabil" },
  YELLOW: { bg: "rgba(255,149,0,0.08)", fill: "#FF9500", label: "Aufmerksamkeit" },
  RED: { bg: "rgba(255,59,48,0.08)", fill: "#FF3B30", label: "Handlungsbedarf" },
};

const VIEW_LABELS: Record<ViewMode, { icon: typeof Eye; label: string }> = {
  CEO: { icon: Briefcase, label: "CEO" },
  HR: { icon: Users, label: "HR" },
  TEAMLEITUNG: { icon: Shield, label: "Teamleitung" },
};

const MATRIX_IDS = [
  ["IMP-IMP", "IMP-INT", "IMP-ANA"],
  ["INT-IMP", "INT-INT", "INT-ANA"],
  ["ANA-IMP", "ANA-INT", "ANA-ANA"],
];
const MATRIX_ROW_LABELS = ["Umsetzung", "Beziehung", "Struktur"];
const MATRIX_COL_LABELS = ["Umsetzung", "Beziehung", "Struktur"];

function GlassCard({ children, style, ...props }: { children: React.ReactNode; style?: React.CSSProperties; [k: string]: any }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.82)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 24, padding: "22px 24px",
      boxShadow: "0 2px 20px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.05)",
      border: "1px solid rgba(255,255,255,0.7)",
      ...style,
    }} {...props}>
      {children}
    </div>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: typeof Activity }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {Icon && <Icon style={{ width: 15, height: 15, color: "#0071E3" }} />}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.01em" }}>{children}</h2>
    </div>
  );
}

function TriadBars({ triad, label, height }: { triad: Triad; label: string; height?: number }) {
  const h = height || 80;
  const max = Math.max(triad.impulsiv, triad.intuitiv, triad.analytisch, 1);
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: h }}>
        {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => (
          <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: colorFor(k) }}>{triad[k]}%</span>
            <div style={{
              width: "100%", borderRadius: 6,
              background: `${colorFor(k)}18`, height: h,
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
            }}>
              <div style={{
                width: "100%", borderRadius: 6,
                background: `linear-gradient(180deg, ${colorFor(k)}CC, ${colorFor(k)})`,
                height: `${(triad[k] / max) * 100}%`, minHeight: 3,
                transition: "height 400ms cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
            <span style={{ fontSize: 8, color: "#8E8E93", fontWeight: 500 }}>{labelComponent(k).slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TriadSliders({ triad, onChange }: { triad: Triad; onChange: (t: Triad) => void }) {
  const handleChange = (key: ComponentKey, rawVal: number) => {
    const others = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== key);
    const remaining = 100 - rawVal;
    const otherSum = triad[others[0]] + triad[others[1]];
    let v0: number, v1: number;
    if (otherSum === 0) { v0 = Math.round(remaining / 2); v1 = remaining - v0; }
    else { v0 = Math.round((triad[others[0]] / otherSum) * remaining); v1 = remaining - v0; }
    onChange({ ...triad, [key]: rawVal, [others[0]]: v0, [others[1]]: v1 });
  };

  return (
    <div>
      {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => (
        <div key={k} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: colorFor(k) }}>{labelComponent(k)}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: colorFor(k) }}>{triad[k]}%</span>
          </div>
          <input type="range" min={0} max={80} value={triad[k]}
            onChange={e => handleChange(k, +e.target.value)}
            data-testid={`slider-${k}`}
            style={{ width: "100%", accentColor: colorFor(k), height: 4 }} />
        </div>
      ))}
    </div>
  );
}

function TrafficLightAmpel({ tl }: { tl: TrafficLight }) {
  const colors: TrafficLight[] = ["GREEN", "YELLOW", "RED"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }} data-testid="traffic-light">
      {colors.map(c => (
        <div key={c} style={{
          width: 14, height: 14, borderRadius: "50%",
          background: c === tl ? TL_COLORS[c].fill : `${TL_COLORS[c].fill}15`,
          boxShadow: c === tl ? `0 0 10px ${TL_COLORS[c].fill}40` : "none",
          transition: "all 400ms ease",
        }} />
      ))}
    </div>
  );
}

function KPITile({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 100, padding: "10px 12px", borderRadius: 14,
      background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
    }}>
      <p style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: color || "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "#8E8E93", margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

export default function Teamdynamik() {
  const [teamName, setTeamName] = useState("Projektteam");
  const [teamProfile, setTeamProfile] = useState<Triad>({ impulsiv: 30, intuitiv: 50, analytisch: 20 });
  const [personProfile, setPersonProfile] = useState<Triad>({ impulsiv: 34, intuitiv: 23, analytisch: 43 });
  const [isLeading, setIsLeading] = useState(true);
  const [levers, setLevers] = useState<Lever[]>(getDefaultLevers());
  const [viewMode, setViewMode] = useState<ViewMode>("HR");
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chances" | "risks" | "plan" | "levers">("chances");
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const [roleSoll, setRoleSoll] = useState<{ enabled: boolean; profile: Triad }>({ enabled: false, profile: { impulsiv: 33, intuitiv: 33, analytisch: 34 } });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rollenDnaState");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.triad) {
          setRoleSoll({ enabled: true, profile: parsed.triad });
        }
      }
    } catch { }
  }, []);

  const input: TeamDynamikInput = useMemo(() => ({
    teamName,
    teamProfile,
    membersCount: 8,
    personProfile,
    isLeading,
    roleSoll: roleSoll.enabled ? { enabled: true, profile: roleSoll.profile } : undefined,
    levers,
    steeringOverride: null,
  }), [teamName, teamProfile, personProfile, isLeading, roleSoll, levers]);

  const result = useMemo(() => computeTeamDynamics(input), [input]);

  const effectiveSelectedCell = useMemo(() => {
    if (selectedCellId) return getMatrixCellById(selectedCellId) || result.activeMatrixCell;
    return result.activeMatrixCell;
  }, [selectedCellId, result]);

  const viewContent = useMemo(() => getViewContent(viewMode, result, effectiveSelectedCell), [viewMode, result, effectiveSelectedCell]);

  const toggleLever = (id: string) => {
    setLevers(prev => prev.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l));
  };

  const generateReport = useCallback(async () => {
    setReportLoading(true);
    setReportError(false);
    try {
      const payload = buildAIPayload(input, result);
      const res = await fetch("/api/generate-team-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Fehler");
      const data = await res.json();
      if (!data.report || data.report.length < 50) throw new Error("Leer");
      setReportText(data.report);
      setShowReport(true);
    } catch {
      setReportError(true);
    } finally {
      setReportLoading(false);
    }
  }, [input, result]);

  const copyReport = async () => {
    if (!reportRef.current) return;
    await navigator.clipboard.writeText(reportRef.current.innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tl = TL_COLORS[result.trafficLight];
  const domTeamLabel = result.dominanceTeam === "MIX" ? "Gemischt" : result.dominanceTeam === "IMPULSIV" ? "Umsetzung" : result.dominanceTeam === "INTUITIV" ? "Beziehung" : "Struktur";
  const domPersonLabel = result.dominancePerson === "MIX" ? "Gemischt" : result.dominancePerson === "IMPULSIV" ? "Umsetzung" : result.dominancePerson === "INTUITIV" ? "Beziehung" : "Struktur";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }} lang="de">
      <GlobalNav rightSlot={
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={generateReport} disabled={reportLoading} data-testid="button-generate-report" style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10,
            background: "linear-gradient(135deg, #0071E3, #34AADC)", border: "none",
            color: "#fff", fontSize: 12, fontWeight: 600, cursor: reportLoading ? "default" : "pointer",
            opacity: reportLoading ? 0.7 : 1,
          }}>
            {reportLoading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <TrendingUp style={{ width: 13, height: 13 }} />}
            KI-Report
          </button>
        </div>
      } />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* ── MODULE A: EXECUTIVE HEADER ── */}
        <GlassCard style={{ marginBottom: 14 }} data-testid="module-executive-header">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <TrafficLightAmpel tl={result.trafficLight} />
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
                  data-testid="input-team-name"
                  style={{
                    fontSize: 20, fontWeight: 700, color: "#1D1D1F", background: "none", border: "none",
                    outline: "none", padding: 0, letterSpacing: "-0.02em", width: "auto", maxWidth: 260,
                  }}
                />
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                  background: tl.bg, color: tl.fill,
                }} data-testid="badge-status">{tl.label}</span>
              </div>
              <p style={{ fontSize: 11, color: "#8E8E93", margin: "3px 0 0" }} data-testid="text-headline">
                {hyphenateText(result.headline)}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {(Object.keys(VIEW_LABELS) as ViewMode[]).map(v => {
                const V = VIEW_LABELS[v];
                const active = viewMode === v;
                return (
                  <button key={v} onClick={() => setViewMode(v)} data-testid={`button-view-${v.toLowerCase()}`} style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8,
                    background: active ? "rgba(0,113,227,0.08)" : "transparent",
                    border: active ? "1px solid rgba(0,113,227,0.15)" : "1px solid transparent",
                    cursor: "pointer", fontSize: 11, fontWeight: active ? 700 : 500,
                    color: active ? "#0071E3" : "#8E8E93",
                  }}>
                    <V.icon style={{ width: 12, height: 12 }} /> {V.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <KPITile label="Transformation" value={result.scores.TS} sub={`von 100 · ${INTENSITY_LABELS[result.intensityLevel]}`} color={tl.fill} />
            <KPITile label="Verschiebung" value={SHIFT_LABELS[result.shiftType]} sub={result.shiftAxis} />
            <KPITile label="Steuerung" value={INTENSITY_LABELS[result.steeringNeed]} sub={`${result.leverEffects.enabledCount} Hebel aktiv`} />
          </div>
        </GlassCard>

        {/* ── MODULE B: PROFILES ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
          <GlassCard style={{ flex: 1, minWidth: 280 }} data-testid="module-team-profile">
            <SectionTitle icon={Users}>Teamprofil</SectionTitle>
            <TriadSliders triad={teamProfile} onChange={setTeamProfile} />
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.04)" }}>
              <TriadBars triad={teamProfile} label={`Dominanz: ${domTeamLabel}`} height={60} />
            </div>
          </GlassCard>

          <GlassCard style={{ flex: 1, minWidth: 280 }} data-testid="module-person-profile">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <SectionTitle icon={Activity}>{isLeading ? "Neue Führungskraft" : "Neue Person"}</SectionTitle>
              <button onClick={() => setIsLeading(!isLeading)} data-testid="toggle-leading" style={{
                display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8,
                background: isLeading ? "rgba(0,113,227,0.06)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${isLeading ? "rgba(0,113,227,0.12)" : "rgba(0,0,0,0.05)"}`,
                cursor: "pointer", fontSize: 10, fontWeight: 600,
                color: isLeading ? "#0071E3" : "#8E8E93",
              }}>
                Führend {isLeading ? "✓" : ""}
              </button>
            </div>
            <TriadSliders triad={personProfile} onChange={setPersonProfile} />
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.04)" }}>
              <TriadBars triad={personProfile} label={`Dominanz: ${domPersonLabel}`} height={60} />
            </div>
            {roleSoll.enabled && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.04em" }}>Rollen-DNA (Soll)</span>
                  <button onClick={() => setRoleSoll(prev => ({ ...prev, enabled: false }))} data-testid="button-remove-soll" style={{
                    fontSize: 9, color: "#C7C7CC", background: "none", border: "none", cursor: "pointer",
                  }}>×</button>
                </div>
                <div style={{ display: "flex", gap: 2, height: 4, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${roleSoll.profile.impulsiv}%`, background: COLORS.imp, opacity: 0.5 }} />
                  <div style={{ width: `${roleSoll.profile.intuitiv}%`, background: COLORS.int, opacity: 0.5 }} />
                  <div style={{ width: `${roleSoll.profile.analytisch}%`, background: COLORS.ana, opacity: 0.5 }} />
                </div>
                <span style={{ fontSize: 9, color: "#C7C7CC", marginTop: 2, display: "block" }}>{roleSoll.profile.impulsiv}/{roleSoll.profile.intuitiv}/{roleSoll.profile.analytisch}</span>
              </div>
            )}
          </GlassCard>
        </div>

        {/* ── MODULE C: TENSION MATRIX ── */}
        {viewContent.showMatrix && (
          <GlassCard style={{ marginBottom: 14 }} data-testid="module-tension-matrix">
            <SectionTitle icon={AlertTriangle}>Spannungsmatrix</SectionTitle>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ minWidth: 200 }}>
                <div style={{ display: "grid", gridTemplateColumns: "44px repeat(3, 1fr)", gap: 4 }}>
                  <div />
                  {MATRIX_COL_LABELS.map(c => (
                    <div key={c} style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93", textAlign: "center", paddingBottom: 4 }}>{c}</div>
                  ))}
                  {MATRIX_IDS.map((row, ri) => [
                    <div key={`label-${ri}`} style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>{MATRIX_ROW_LABELS[ri]}</div>,
                    ...row.map((cellId, ci) => {
                      const cell = getMatrixCellById(cellId);
                      const isActive = cellId === result.activeMatrixCell.id;
                      const isSelected = cellId === (selectedCellId || result.activeMatrixCell.id);
                      return (
                        <button key={cellId} onClick={() => setSelectedCellId(cellId)} data-testid={`matrix-cell-${cellId}`} style={{
                          padding: "6px 4px", borderRadius: 8, fontSize: 8, fontWeight: 600,
                          background: isActive ? "rgba(0,113,227,0.10)" : isSelected ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.015)",
                          border: isActive ? "2px solid rgba(0,113,227,0.35)" : isSelected ? "1.5px solid rgba(0,0,0,0.08)" : "1px solid rgba(0,0,0,0.04)",
                          cursor: "pointer", color: isActive ? "#0071E3" : "#48484A",
                          lineHeight: 1.25, textAlign: "center", minHeight: 42,
                          transition: "all 200ms ease",
                        }}>
                          {cell?.label || ""}
                        </button>
                      );
                    }),
                  ])}
                </div>
                <p style={{ fontSize: 9, color: "#C7C7CC", marginTop: 6, textAlign: "center" }}>
                  Person ↓ &nbsp; Team →
                </p>
              </div>

              {viewContent.showInsights && (
                <div style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{effectiveSelectedCell.label}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#0071E3", margin: "0 0 8px" }}>{effectiveSelectedCell.micro}</p>
                  {viewContent.insightSections.map((s, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.title}</p>
                      <p style={{ fontSize: 12, color: "#48484A", lineHeight: 1.6, margin: 0 }} lang="de">{hyphenateText(s.text)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* ── MODULE D: ACTIONS & PLAN ── */}
        <GlassCard style={{ marginBottom: 14 }} data-testid="module-actions">
          <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3 }}>
            {[
              { id: "chances" as const, label: "Chancen", icon: CheckCircle },
              { id: "risks" as const, label: "Risiken", icon: AlertTriangle },
              { id: "plan" as const, label: "Integrationsplan", icon: TrendingUp },
              ...(viewContent.showLevers ? [{ id: "levers" as const, label: "Führungshebel", icon: Shield }] : []),
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`tab-${tab.id}`} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  padding: "8px 6px", borderRadius: 8,
                  background: active ? "#fff" : "transparent",
                  boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                  border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: active ? 700 : 500,
                  color: active ? "#1D1D1F" : "#8E8E93",
                  transition: "all 200ms ease",
                }}>
                  <tab.icon style={{ width: 12, height: 12 }} /> {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "chances" && (
            <div>
              {viewContent.chances.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8, padding: "8px 12px", borderRadius: 12, background: "rgba(52,199,89,0.03)" }}>
                  <CheckCircle style={{ width: 14, height: 14, color: "#34C759", marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12.5, color: "#48484A", lineHeight: 1.6, margin: 0 }} lang="de">{hyphenateText(c)}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "risks" && (
            <div>
              {viewContent.risks.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8, padding: "8px 12px", borderRadius: 12, background: "rgba(255,59,48,0.03)" }}>
                  <AlertTriangle style={{ width: 14, height: 14, color: "#FF3B30", marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12.5, color: "#48484A", lineHeight: 1.6, margin: 0 }} lang="de">{hyphenateText(r)}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "plan" && (
            <div>
              {result.integrationPlan.map((phase, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "#0071E3",
                      padding: "2px 8px", borderRadius: 6, background: "rgba(0,113,227,0.06)",
                    }}>{phase.phaseId}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F" }}>{phase.title}</span>
                    <span style={{ fontSize: 10, color: "#8E8E93" }}>{phase.days}</span>
                  </div>
                  {phase.actions.map((a, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4, paddingLeft: 8 }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C7C7CC", marginTop: 6, flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: "#48484A", lineHeight: 1.55, margin: 0 }} lang="de">{hyphenateText(a)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {activeTab === "levers" && viewContent.showLevers && (
            <div>
              <p style={{ fontSize: 11, color: "#8E8E93", margin: "0 0 12px" }}>
                Aktive Hebel reduzieren den Steuerungsbedarf. {result.leverEffects.enabledCount > 0 && `(${result.leverEffects.enabledCount} aktiv → -${result.leverEffects.reductionLevels} Stufe${result.leverEffects.reductionLevels > 1 ? "n" : ""})`}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
                {levers.map(lever => (
                  <button key={lever.id} onClick={() => toggleLever(lever.id)} data-testid={`lever-${lever.id}`} style={{
                    display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", borderRadius: 14,
                    background: lever.enabled ? "rgba(0,113,227,0.04)" : "rgba(0,0,0,0.015)",
                    border: `1px solid ${lever.enabled ? "rgba(0,113,227,0.12)" : "rgba(0,0,0,0.04)"}`,
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "all 200ms ease",
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 6, marginTop: 1, flexShrink: 0,
                      background: lever.enabled ? "#0071E3" : "transparent",
                      border: lever.enabled ? "none" : "1.5px solid #C7C7CC",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {lever.enabled && <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: lever.enabled ? "#0071E3" : "#1D1D1F", margin: "0 0 2px" }}>{lever.label}</p>
                      <p style={{ fontSize: 10, color: "#8E8E93", lineHeight: 1.45, margin: 0 }}>{lever.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* ── AI REPORT PANEL ── */}
        {showReport && (
          <GlassCard style={{ marginBottom: 14, borderRadius: 28 }} data-testid="module-ai-report">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <SectionTitle icon={TrendingUp}>Team-Systemreport</SectionTitle>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={copyReport} data-testid="button-copy-report" style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8,
                  background: copied ? "rgba(52,199,89,0.06)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${copied ? "rgba(52,199,89,0.15)" : "rgba(0,0,0,0.05)"}`,
                  color: copied ? "#34C759" : "#8E8E93", fontSize: 10, fontWeight: 600, cursor: "pointer",
                }}>
                  <Copy style={{ width: 11, height: 11 }} /> {copied ? "Kopiert" : "Kopieren"}
                </button>
                <button onClick={() => window.print()} data-testid="button-export-pdf" style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 8,
                  background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)",
                  color: "#8E8E93", fontSize: 10, fontWeight: 600, cursor: "pointer",
                }}>
                  <Download style={{ width: 11, height: 11 }} /> PDF
                </button>
                <button onClick={() => setShowReport(false)} style={{
                  fontSize: 10, color: "#8E8E93", background: "none", border: "none", cursor: "pointer",
                }}>Schließen</button>
              </div>
            </div>

            {reportLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" }}>
                <Loader2 style={{ width: 24, height: 24, color: "#0071E3", animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: 12, color: "#8E8E93" }}>Report wird erstellt...</p>
              </div>
            ) : reportError ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <p style={{ fontSize: 13, color: "#FF3B30", marginBottom: 10 }}>Report konnte nicht erstellt werden.</p>
                <button onClick={generateReport} style={{
                  padding: "7px 18px", borderRadius: 10, background: "#0071E3", color: "#fff",
                  border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                }} data-testid="button-retry">Erneut versuchen</button>
              </div>
            ) : reportText ? (
              <div ref={reportRef} style={{ fontSize: 13, color: "#48484A", lineHeight: 1.8, whiteSpace: "pre-wrap" }} lang="de">
                {reportText}
              </div>
            ) : null}
          </GlassCard>
        )}

      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type="range"] { -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; }
        input[type="range"]::-webkit-slider-track { height: 4px; border-radius: 2px; background: rgba(0,0,0,0.06); }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 2px solid rgba(0,0,0,0.15); box-shadow: 0 1px 4px rgba(0,0,0,0.12); margin-top: -6px; }
        input[type="range"]::-moz-range-track { height: 4px; border-radius: 2px; background: rgba(0,0,0,0.06); border: none; }
        input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 2px solid rgba(0,0,0,0.15); box-shadow: 0 1px 4px rgba(0,0,0,0.12); }
        @media print {
          nav, button, [data-testid="module-levers"], [data-testid="module-tension-matrix"] { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          [data-testid="module-ai-report"] { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
