import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Users, Shield, TrendingUp, AlertTriangle, Check, Lightbulb, ChevronDown, ChevronRight, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { hyphenateText } from "@/lib/hyphenate";
import {
  type Triad, type ComponentKey, type TeamDynamikResult, type ViewMode, type Lever, type MatrixCell,
  runTeamDynamik, normalizeTriad, dominanceModeOf, labelComponent, dominanceLabel,
  getMatrixCellById, getViewContent,
} from "@/lib/teamdynamik-engine";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

function colorFor(k: ComponentKey) { return k === "impulsiv" ? COLORS.imp : k === "intuitiv" ? COLORS.int : COLORS.ana; }

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.78)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 24, padding: "24px 22px",
      boxShadow: "0 2px 16px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
      border: "1px solid rgba(255,255,255,0.7)",
      ...style,
    }} data-testid={testId}>{children}</div>
  );
}

function TriadBars({ triad, label, height = 20 }: { triad: Triad; label?: string; height?: number }) {
  const items = [
    { k: "impulsiv" as ComponentKey, l: "Impulsiv", v: triad.impulsiv, c: COLORS.imp },
    { k: "intuitiv" as ComponentKey, l: "Intuitiv", v: triad.intuitiv, c: COLORS.int },
    { k: "analytisch" as ComponentKey, l: "Analytisch", v: triad.analytisch, c: COLORS.ana },
  ];
  return (
    <div>
      {label && <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(bar => (
          <div key={bar.l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#6E6E73", width: 58, flexShrink: 0 }}>{bar.l}</span>
            <div style={{ flex: 1, height, borderRadius: 5, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(bar.v, 2)}%`, height: "100%", borderRadius: 5, background: bar.c, transition: "width 400ms ease", display: "flex", alignItems: "center", paddingLeft: 6, minWidth: bar.v > 0 ? 32 : 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>{Math.round(bar.v)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TriadSliders({ triad, onChange, label }: { triad: Triad; onChange: (t: Triad) => void; label: string }) {
  const handleChange = (key: ComponentKey, rawVal: number) => {
    const others = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).filter(k => k !== key);
    const remaining = 100 - rawVal;
    const otherSum = triad[others[0]] + triad[others[1]];
    let v0: number, v1: number;
    if (otherSum === 0) {
      v0 = Math.round(remaining / 2);
      v1 = remaining - v0;
    } else {
      v0 = Math.round((triad[others[0]] / otherSum) * remaining);
      v1 = remaining - v0;
    }
    onChange({ ...triad, [key]: rawVal, [others[0]]: v0, [others[1]]: v1 });
  };

  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{label}</p>
      {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: colorFor(k), width: 58, flexShrink: 0, fontWeight: 600 }}>{labelComponent(k)}</span>
          <input type="range" min={0} max={80} value={triad[k]} onChange={e => handleChange(k, +e.target.value)} style={{ flex: 1, accentColor: colorFor(k) }} data-testid={`slider-${label.toLowerCase().replace(/\s+/g, "-")}-${k}`} />
          <span style={{ fontSize: 12, fontWeight: 700, color: colorFor(k), width: 32, textAlign: "right" }}>{triad[k]}%</span>
        </div>
      ))}
    </div>
  );
}

function KpiTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 14, background: `${color}08`, border: `1px solid ${color}18`, textAlign: "center", flex: 1, minWidth: 100 }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 750, color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "#8E8E93", margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

function TrafficLightDot({ light }: { light: "GREEN" | "YELLOW" | "RED" }) {
  const c = light === "GREEN" ? "#34C759" : light === "YELLOW" ? "#FF9500" : "#FF3B30";
  const label = light === "GREEN" ? "Stabil" : light === "YELLOW" ? "Reibung" : "Spannung";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}60` }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{label}</span>
    </div>
  );
}

function MatrixGrid({ cells, activeCellId, onSelect }: { cells: { id: string; label: string; micro: string }[]; activeCellId: string; onSelect: (id: string) => void }) {
  const axes: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  const axisLabels = { impulsiv: "IMP", intuitiv: "INT", analytisch: "ANA" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr 1fr", gridTemplateRows: "auto 1fr 1fr 1fr", gap: 3 }}>
        <div />
        {axes.map(x => (
          <div key={x} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: colorFor(x), padding: "4px 0" }}>
            {axisLabels[x]}
          </div>
        ))}
        {axes.flatMap(y => [
          <div key={`label-${y}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: colorFor(y), writingMode: "vertical-lr", transform: "rotate(180deg)" }}>
            {axisLabels[y]}
          </div>,
          ...axes.map(x => {
            const id = `${axisLabels[x]}-${axisLabels[y]}`;
            const cell = cells.find(c => c.id === id);
            const isActive = id === activeCellId;
            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                data-testid={`matrix-cell-${id}`}
                style={{
                  padding: "10px 6px", borderRadius: 10, border: isActive ? "2px solid #0071E3" : "1px solid rgba(0,0,0,0.06)",
                  background: isActive ? "rgba(0,113,227,0.06)" : "rgba(0,0,0,0.02)",
                  cursor: "pointer", textAlign: "center", transition: "all 200ms",
                  minHeight: 60, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? "#0071E3" : "#1D1D1F", lineHeight: 1.2 }}>{cell?.label || ""}</span>
                <span style={{ fontSize: 8, color: isActive ? "#0071E3" : "#8E8E93", marginTop: 2 }}>{cell?.micro || ""}</span>
              </button>
            );
          }),
        ])}
      </div>
      <p style={{ fontSize: 9, color: "#8E8E93", marginTop: 6, textAlign: "center" }}>X = Teamdominanz · Y = Führung/Neue Person</p>
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, marginTop: 6, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.6, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">{hyphenateText(item)}</p>
        </div>
      ))}
    </div>
  );
}

function LeverChecklist({ levers, onToggle }: { levers: Lever[]; onToggle: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {levers.map(lever => (
        <button
          key={lever.id}
          onClick={() => onToggle(lever.id)}
          data-testid={`lever-${lever.id}`}
          style={{
            display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12,
            background: lever.enabled ? "rgba(52,199,89,0.06)" : "rgba(0,0,0,0.02)",
            border: `1px solid ${lever.enabled ? "rgba(52,199,89,0.2)" : "rgba(0,0,0,0.04)"}`,
            cursor: "pointer", textAlign: "left", width: "100%", transition: "all 200ms",
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 5, border: lever.enabled ? "none" : "1.5px solid #C7C7CC", background: lever.enabled ? "#34C759" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 200ms" }}>
            {lever.enabled && <Check style={{ width: 12, height: 12, color: "#fff", strokeWidth: 3 }} />}
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: lever.enabled ? "#34C759" : "#1D1D1F", margin: 0 }}>{lever.label}</p>
            <p style={{ fontSize: 11, color: "#8E8E93", margin: "2px 0 0", lineHeight: 1.4 }}>{lever.description}</p>
          </div>
        </button>
      ))}
      <p style={{ fontSize: 10, color: "#8E8E93", fontStyle: "italic", margin: "4px 0 0" }}>Aktivierte Hebel reduzieren den Steuerungsbedarf.</p>
    </div>
  );
}

function TimelinePhase({ phase, title, days, items, color }: { phase: string; title: string; days: string; items: string[]; color: string }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 24, flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}40` }} />
        <div style={{ flex: 1, width: 2, background: `${color}30`, borderRadius: 1 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>{days}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{title}</p>
        <BulletList items={items} color={color} />
      </div>
    </div>
  );
}

export default function Teamdynamik() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("HR");
  const [activeTab, setActiveTab] = useState<"CHANCEN" | "RISIKEN" | "INTEGRATIONSPLAN">("CHANCEN");
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("Mein Team");
  const [membersCount, setMembersCount] = useState(6);
  const [isLeading, setIsLeading] = useState(false);
  const [teamProfile, setTeamProfile] = useState<Triad>({ impulsiv: 30, intuitiv: 40, analytisch: 30 });
  const [candProfile, setCandProfile] = useState<Triad>({ impulsiv: 45, intuitiv: 25, analytisch: 30 });
  const [levers, setLevers] = useState<Lever[]>([]);

  const [roleProfile, setRoleProfile] = useState<Triad>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.gesamt) {
          setRoleProfile({ impulsiv: parsed.gesamt.imp || 33, intuitiv: parsed.gesamt.int || 34, analytisch: parsed.gesamt.ana || 33 });
        }
      } catch {}
    }
  }, []);

  const result = useMemo(() => {
    return runTeamDynamik({ teamName, teamProfile, membersCount, roleProfile, candidateProfile: candProfile, isLeading });
  }, [teamName, teamProfile, membersCount, roleProfile, candProfile, isLeading]);

  useEffect(() => {
    if (levers.length === 0 && result.levers.length > 0) setLevers(result.levers);
  }, [result.levers]);

  const recalcWithLevers = useMemo(() => {
    const r = runTeamDynamik({ teamName, teamProfile, membersCount, roleProfile, candidateProfile: candProfile, isLeading });
    r.levers = levers.length > 0 ? levers : r.levers;
    const { steeringNeed, trafficLight } = (() => {
      const levelMap: Record<string, number> = { NIEDRIG: 20, MITTEL: 50, HOCH: 80 };
      let score = levelMap[r.intensityLevel] || 50;
      const totalReduction = r.levers.filter(l => l.enabled).reduce((sum, l) => sum + l.weight, 0);
      score = Math.max(0, score - totalReduction);
      const sn = score <= 33 ? "NIEDRIG" as const : score <= 66 ? "MITTEL" as const : "HOCH" as const;
      const st = r.shiftType;
      let tl: "GREEN" | "YELLOW" | "RED" = "GREEN";
      if (st === "SPANNUNG" || st === "TRANSFORMATION") {
        tl = totalReduction >= 15 ? "YELLOW" : "RED";
      } else if (sn === "HOCH") tl = "RED";
      else if (sn === "MITTEL") tl = "YELLOW";
      return { steeringNeed: sn, trafficLight: tl };
    })();
    return { ...r, steeringNeed, trafficLight, levers: r.levers };
  }, [teamName, teamProfile, membersCount, roleProfile, candProfile, isLeading, levers]);

  const engine = recalcWithLevers;

  useEffect(() => {
    if (!selectedCell) setSelectedCell(engine.activeMatrixCell.id);
  }, [engine.activeMatrixCell.id]);

  const selectedCellData = useMemo(() => {
    const id = selectedCell || engine.activeMatrixCell.id;
    return getMatrixCellById(id) || engine.activeMatrixCell;
  }, [selectedCell, engine.activeMatrixCell]);

  const viewContent = useMemo(() => {
    const engineWithCell = { ...engine, activeMatrixCell: selectedCellData };
    return getViewContent(viewMode, engineWithCell);
  }, [viewMode, engine, selectedCellData]);

  const toggleLever = (id: string) => {
    setLevers(prev => prev.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l));
  };

  const shiftTypeLabel: Record<string, string> = {
    VERSTAERKUNG: "Verstärkung", ERGAENZUNG: "Ergänzung", REIBUNG: "Reibung", SPANNUNG: "Spannung", TRANSFORMATION: "Transformation",
  };
  const intensityColor = engine.intensityLevel === "NIEDRIG" ? "#34C759" : engine.intensityLevel === "MITTEL" ? "#FF9500" : "#FF3B30";
  const steeringColor = engine.steeringNeed === "NIEDRIG" ? "#34C759" : engine.steeringNeed === "MITTEL" ? "#FF9500" : "#FF3B30";
  const shiftColor = engine.shiftType === "VERSTAERKUNG" || engine.shiftType === "ERGAENZUNG" ? "#34C759" : engine.shiftType === "REIBUNG" ? "#FF9500" : "#FF3B30";

  const matrixCells = [
    { id: "IMP-IMP", label: "Verstärkung", micro: "Tempo-System" },
    { id: "IMP-INT", label: "Dynamik-Konflikt", micro: "Tempo vs Beziehung" },
    { id: "IMP-ANA", label: "Tempo vs Struktur", micro: "Schnell vs Absicherung" },
    { id: "INT-IMP", label: "Beziehung vs Tempo", micro: "Harmonie vs Druck" },
    { id: "INT-INT", label: "Harmonie-System", micro: "Konsens stabil" },
    { id: "INT-ANA", label: "Konsens vs Kontrolle", micro: "Abstimmung vs Gate" },
    { id: "ANA-IMP", label: "Struktur vs Tempo", micro: "Gate vs Speed" },
    { id: "ANA-INT", label: "Logik vs Beziehung", micro: "Struktur vs Nähe" },
    { id: "ANA-ANA", label: "Stabilitäts-System", micro: "Qualität & Planbarkeit" },
  ];

  const tabs = [
    { id: "CHANCEN" as const, label: "Chancen", icon: Lightbulb },
    { id: "RISIKEN" as const, label: "Risiken", icon: AlertTriangle },
    { id: "INTEGRATIONSPLAN" as const, label: "Integrationsplan", icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }} lang="de">
      <GlobalNav />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <GlassCard testId="module-header">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: "1 1 200px" }}>
                <input
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", background: "transparent", border: "none", outline: "none", width: "100%" }}
                  data-testid="input-team-name"
                />
                <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#8E8E93" }}>
                    <input type="number" value={membersCount} onChange={e => setMembersCount(Math.max(1, +e.target.value))} min={1} max={50} style={{ width: 36, border: "none", background: "rgba(0,0,0,0.04)", borderRadius: 6, textAlign: "center", fontSize: 11, padding: "2px 4px", color: "#1D1D1F", fontWeight: 600 }} data-testid="input-members" /> Mitglieder
                  </span>
                  <TrafficLightDot light={engine.trafficLight} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: "1 1 320px", justifyContent: "flex-end" }}>
                <KpiTile label="Verschiebungstyp" value={shiftTypeLabel[engine.shiftType]} color={shiftColor} />
                <KpiTile label="Intensität" value={engine.intensityLevel} sub={`${engine.intensityScore}/100`} color={intensityColor} />
                <KpiTile label="Steuerungsbedarf" value={engine.steeringNeed} color={steeringColor} />
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#48484A", marginTop: 14, lineHeight: 1.6, textAlign: "justify", textAlignLast: "left" as any }} lang="de">{hyphenateText(engine.headline)}</p>

            <div style={{ display: "flex", gap: 4, marginTop: 14, justifyContent: "flex-end" }}>
              {(["CEO", "HR", "TEAMLEITUNG"] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  data-testid={`view-${v.toLowerCase()}`}
                  style={{
                    fontSize: 10, fontWeight: viewMode === v ? 700 : 500, padding: "5px 12px", borderRadius: 8,
                    background: viewMode === v ? "#0071E3" : "rgba(0,0,0,0.04)",
                    color: viewMode === v ? "#fff" : "#6E6E73",
                    border: "none", cursor: "pointer", transition: "all 200ms",
                  }}
                >
                  {v === "TEAMLEITUNG" ? "Teamleitung" : v}
                </button>
              ))}
            </div>
          </GlassCard>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <GlassCard testId="module-team-profile">
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", marginBottom: 14 }}>Teamprofil</p>
              <TriadSliders triad={teamProfile} onChange={setTeamProfile} label="Teamverteilung" />
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>Dominanz: <span style={{ color: colorFor(engine.teamDominance.top1.key) }}>{dominanceLabel(engine.teamDominance)}</span></p>
              </div>
            </GlassCard>

            <GlassCard testId="module-role-candidate">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Neue Person / Rolle</p>
                <button
                  onClick={() => setIsLeading(!isLeading)}
                  data-testid="toggle-leading"
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8,
                    background: isLeading ? "rgba(0,113,227,0.08)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${isLeading ? "rgba(0,113,227,0.2)" : "rgba(0,0,0,0.06)"}`,
                    cursor: "pointer", fontSize: 11, fontWeight: 600,
                    color: isLeading ? "#0071E3" : "#6E6E73",
                  }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: isLeading ? "#0071E3" : "transparent", border: isLeading ? "none" : "1.5px solid #C7C7CC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isLeading && <Check style={{ width: 10, height: 10, color: "#fff", strokeWidth: 3 }} />}
                  </div>
                  Führend
                </button>
              </div>

              <TriadBars triad={roleProfile} label="Rollen-DNA (Soll)" height={16} />

              <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "12px 0" }} />

              <TriadSliders triad={candProfile} onChange={setCandProfile} label="Kandidatenprofil (Ist)" />

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", flex: 1 }}>
                  <p style={{ fontSize: 10, color: "#8E8E93", margin: "0 0 2px" }}>Dominanz</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: colorFor(engine.candDominance.top1.key), margin: 0 }}>{dominanceLabel(engine.candDominance)}</p>
                </div>
                <div style={{
                  padding: "6px 12px", borderRadius: 8, flex: "0 0 auto",
                  background: engine.fitTag === "Soll ≈ Ist" ? "rgba(52,199,89,0.06)" : "rgba(255,149,0,0.06)",
                  border: `1px solid ${engine.fitTag === "Soll ≈ Ist" ? "rgba(52,199,89,0.2)" : "rgba(255,149,0,0.2)"}`,
                }}>
                  <p style={{ fontSize: 10, color: "#8E8E93", margin: "0 0 2px" }}>Fit</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: engine.fitTag === "Soll ≈ Ist" ? "#34C759" : "#FF9500", margin: 0 }}>{engine.fitTag}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {viewContent.showMatrix && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <GlassCard testId="module-matrix">
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", marginBottom: 14 }}>Spannungsmatrix</p>
                <MatrixGrid cells={matrixCells} activeCellId={selectedCell || engine.activeMatrixCell.id} onSelect={setSelectedCell} />

                <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 12, background: "rgba(0,113,227,0.04)", border: "1px solid rgba(0,113,227,0.1)" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#0071E3", margin: "0 0 4px" }}>{selectedCellData.label}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#6E6E73", margin: "0 0 6px" }}>{selectedCellData.micro}</p>
                  <p style={{ fontSize: 11, color: "#48484A", lineHeight: 1.5, margin: "0 0 4px" }} lang="de"><span style={{ fontWeight: 600 }}>Systemlage:</span> {hyphenateText(selectedCellData.systemlage)}</p>
                  <p style={{ fontSize: 11, color: "#48484A", lineHeight: 1.5, margin: "0 0 4px" }} lang="de"><span style={{ fontWeight: 600 }}>Alltag:</span> {hyphenateText(selectedCellData.alltag)}</p>
                  <p style={{ fontSize: 11, color: "#48484A", lineHeight: 1.5, margin: 0 }} lang="de"><span style={{ fontWeight: 600 }}>Handlung:</span> {hyphenateText(selectedCellData.tun)}</p>
                </div>
              </GlassCard>

              <GlassCard testId="module-insights">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Systemanalyse</p>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase" }}>{viewMode === "TEAMLEITUNG" ? "Teamleitung-Sicht" : "HR-Sicht"}</span>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: `${shiftColor}10`, color: shiftColor }}>{shiftTypeLabel[engine.shiftType]}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: "rgba(0,0,0,0.04)", color: "#6E6E73" }}>{engine.leadershipBehavior.axisLabel}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: `${intensityColor}10`, color: intensityColor }}>{engine.intensityLevel}</span>
                </div>

                {viewContent.insightSections.map((section, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{section.title}</p>
                    <p style={{ fontSize: 12, color: "#48484A", lineHeight: 1.6, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">{hyphenateText(section.text)}</p>
                  </div>
                ))}
              </GlassCard>
            </div>
          )}

          {viewMode === "CEO" && (
            <GlassCard testId="module-ceo-compact">
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", marginBottom: 14 }}>Kurzfazit</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Top-Risiken</p>
                  <BulletList items={engine.risks.slice(0, 3)} color="#FF3B30" />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Top-Hebel</p>
                  <BulletList items={engine.levers.slice(0, 3).map(l => l.label)} color="#34C759" />
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard testId="module-actions">
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", marginBottom: 14 }}>Handlung & Integration</p>
            {viewMode !== "CEO" && <p style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", margin: "-8px 0 12px" }}>{viewContent.actionTitle}</p>}

            <div style={{ display: "grid", gridTemplateColumns: viewContent.showLevers ? "1fr 260px" : "1fr", gap: 20 }}>
              <div>
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        data-testid={`tab-${tab.id.toLowerCase()}`}
                        style={{
                          display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10,
                          background: isActive ? "#0071E3" : "rgba(0,0,0,0.04)",
                          color: isActive ? "#fff" : "#6E6E73",
                          border: "none", cursor: "pointer", fontSize: 12, fontWeight: isActive ? 600 : 500, transition: "all 200ms",
                        }}
                      >
                        <Icon style={{ width: 13, height: 13, strokeWidth: 2 }} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {activeTab === "CHANCEN" && <BulletList items={viewContent.chances} color="#34C759" />}
                {activeTab === "RISIKEN" && <BulletList items={viewContent.risks} color="#FF3B30" />}
                {activeTab === "INTEGRATIONSPLAN" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {engine.integrationPlan.map((phase, i) => (
                      <TimelinePhase
                        key={phase.phaseId}
                        phase={phase.phaseId}
                        title={phase.title}
                        days={phase.days}
                        items={phase.actions}
                        color={i === 0 ? "#0071E3" : i === 1 ? "#F39200" : "#34C759"}
                      />
                    ))}
                  </div>
                )}
              </div>

              {viewContent.showLevers && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", marginBottom: 10 }}>Führungshebel</p>
                  <LeverChecklist levers={levers.length > 0 ? levers : engine.levers} onToggle={toggleLever} />
                </div>
              )}
            </div>
          </GlassCard>

        </div>
      </main>
    </div>
  );
}
