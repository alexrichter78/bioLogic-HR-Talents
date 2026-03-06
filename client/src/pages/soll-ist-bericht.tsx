import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, ArrowRight, ChevronRight, Shield, TrendingDown, TrendingUp, Target, Zap, Users, FileText, Scale, Clock, Lightbulb, CheckCircle2, XCircle, MinusCircle, Download } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent } from "@/lib/jobcheck-engine";
import { computeSollIst } from "@/lib/soll-ist-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";
import type { SollIstResult, Severity } from "@/lib/soll-ist-engine";

type BG = { imp: number; int: number; ana: number };
type RoleDnaState = {
  beruf: string;
  fuehrung: string;
  erfolgsfokusIndices: number[];
  aufgabencharakter: string;
  arbeitslogik: string;
  taetigkeiten: { id: number; name: string; kategorie: string }[];
  bioGramGesamt?: BG;
  bioGramHaupt?: BG;
  bioGramNeben?: BG;
  bioGramFuehrung?: BG;
  bioGramRahmen?: BG;
};

const BAR_COLORS: Record<ComponentKey, string> = {
  impulsiv: "#C41E3A",
  intuitiv: "#F39200",
  analytisch: "#1A5DAB",
};

const COMP_LABELS: Record<ComponentKey, string> = {
  impulsiv: "Umsetzung / Tempo",
  intuitiv: "Zusammenarbeit / Kommunikation",
  analytisch: "Struktur / Analyse",
};

function bgToTriad(bg: BG | undefined): Triad {
  if (!bg) return { impulsiv: 33, intuitiv: 33, analytisch: 34 };
  return { impulsiv: Math.round(bg.imp), intuitiv: Math.round(bg.int), analytisch: Math.round(bg.ana) };
}

function severityColor(s: Severity): string {
  if (s === "critical") return "#C41E3A";
  if (s === "warning") return "#F39200";
  return "#34C759";
}

function severityBg(s: Severity): string {
  if (s === "critical") return "rgba(196,30,58,0.06)";
  if (s === "warning") return "rgba(243,146,0,0.06)";
  return "rgba(52,199,89,0.06)";
}

function severityLabel(s: Severity): string {
  if (s === "critical") return "kritisch";
  if (s === "warning") return "bedingt";
  return "passend";
}

function SeverityBadge({ severity: s }: { severity: Severity }) {
  return (
    <span
      data-testid={`badge-severity-${s}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 20,
        background: severityBg(s),
        color: severityColor(s),
        fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: severityColor(s) }} />
      {severityLabel(s)}
    </span>
  );
}

function RadarChart({ role, candidate }: { role: Triad; candidate: Triad }) {
  const cx = 140, cy = 130, r = 100;
  const labels = [
    { key: "analytisch" as ComponentKey, label: "Struktur", angle: -90 },
    { key: "impulsiv" as ComponentKey, label: "Umsetzung", angle: 150 },
    { key: "intuitiv" as ComponentKey, label: "Zusammenarbeit", angle: 30 },
  ];

  function toXY(val: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    const dist = (val / 67) * r;
    return { x: cx + dist * Math.cos(rad), y: cy + dist * Math.sin(rad) };
  }

  function polyPoints(triad: Triad) {
    return labels.map(l => {
      const p = toXY(triad[l.key], l.angle);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  const gridLevels = [0.33, 0.66, 1.0];

  return (
    <svg viewBox="0 0 280 260" style={{ width: "100%", maxWidth: 300 }} data-testid="chart-radar">
      {gridLevels.map((g, i) => (
        <polygon
          key={i}
          points={labels.map(l => { const p = toXY(67 * g, l.angle); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={1}
        />
      ))}
      {labels.map((l, i) => {
        const end = toXY(67, l.angle);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />;
      })}
      <polygon points={polyPoints(role)} fill="rgba(26,93,171,0.15)" stroke="#1A5DAB" strokeWidth={2} />
      <polygon points={polyPoints(candidate)} fill="rgba(243,146,0,0.15)" stroke="#F39200" strokeWidth={2} />
      {labels.map((l, i) => {
        const p = toXY(67 + 16, l.angle);
        return (
          <text
            key={i} x={p.x} y={p.y}
            textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 11, fontWeight: 600, fill: "#6E6E73" }}
          >
            {l.label}
          </text>
        );
      })}
      <circle cx={18} cy={248} r={5} fill="#1A5DAB" />
      <text x={28} y={248} dominantBaseline="central" style={{ fontSize: 10, fill: "#6E6E73" }}>Rolle (Soll)</text>
      <circle cx={130} cy={248} r={5} fill="#F39200" />
      <text x={140} y={248} dominantBaseline="central" style={{ fontSize: 10, fill: "#6E6E73" }}>Kandidat (Ist)</text>
    </svg>
  );
}

function ComparisonBars({ role, candidate }: { role: Triad; candidate: Triad }) {
  const keys: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} data-testid="chart-comparison-bars">
      {keys.map(k => {
        const gap = candidate[k] - role[k];
        return (
          <div key={k}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F" }}>{COMP_LABELS[k]}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: Math.abs(gap) >= 10 ? "#C41E3A" : Math.abs(gap) >= 5 ? "#F39200" : "#34C759",
              }}>
                {gap > 0 ? "+" : ""}{Math.round(gap)}
              </span>
            </div>
            <div style={{ position: "relative", height: 10, background: "rgba(0,0,0,0.04)", borderRadius: 5, overflow: "hidden" }}>
              <div style={{
                position: "absolute", top: 0, left: 0, height: "100%",
                width: `${Math.min(role[k], 100)}%`,
                background: `${BAR_COLORS[k]}40`, borderRadius: 5,
              }} />
              <div style={{
                position: "absolute", top: 2, left: 0, height: 6,
                width: `${Math.min(candidate[k], 100)}%`,
                background: BAR_COLORS[k], borderRadius: 3,
                transition: "width 400ms ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <span style={{ fontSize: 10, color: "#8E8E93" }}>Soll: {Math.round(role[k])}</span>
              <span style={{ fontSize: 10, color: "#8E8E93" }}>Ist: {Math.round(candidate[k])}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GaugeBar({ level, maxLevel = 5 }: { level: number; maxLevel?: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }} data-testid="gauge-development">
      {Array.from({ length: maxLevel }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 24, height: 10, borderRadius: 3,
            background: i < level
              ? level <= 2 ? "#C41E3A" : level <= 3 ? "#F39200" : "#34C759"
              : "rgba(0,0,0,0.08)",
            transition: "background 300ms ease",
          }}
        />
      ))}
    </div>
  );
}

export default function SollIstBericht() {
  const [, setLocation] = useLocation();
  const [candidateName, setCandidateName] = useState("");
  const [candImp, setCandImp] = useState(33);
  const [candInt, setCandInt] = useState(34);
  const [candAna, setCandAna] = useState(33);
  const [roleName, setRoleName] = useState("");
  const [roleTriad, setRoleTriad] = useState<Triad | null>(null);
  const [hasRollenDna, setHasRollenDna] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const dna = JSON.parse(raw) as RoleDnaState;
      if (dna.beruf && dna.bioGramGesamt) {
        setHasRollenDna(true);
        setRoleName(dna.beruf);
        setRoleTriad(bgToTriad(dna.bioGramGesamt));
      }
    } catch {}

    const candRaw = localStorage.getItem("jobcheckCandProfile");
    if (candRaw) {
      try {
        const cand = JSON.parse(candRaw);
        if (cand.name) setCandidateName(cand.name);
        if (cand.impulsiv != null) setCandImp(cand.impulsiv);
        if (cand.intuitiv != null) setCandInt(cand.intuitiv);
        if (cand.analytisch != null) setCandAna(cand.analytisch);
      } catch {}
    }
  }, []);

  const candidateProfile = normalizeTriad({ impulsiv: candImp, intuitiv: candInt, analytisch: candAna });
  const candDom = dominanceModeOf(candidateProfile);

  const result: SollIstResult | null = useMemo(() => {
    if (!roleTriad || !reportGenerated) return null;
    return computeSollIst(roleName, candidateName || "Kandidat", roleTriad, candidateProfile);
  }, [roleTriad, roleName, candidateName, candidateProfile.impulsiv, candidateProfile.intuitiv, candidateProfile.analytisch, reportGenerated]);

  if (!hasRollenDna || !roleTriad) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F5F7" }}>
        <GlobalNav />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <AlertTriangle style={{ width: 48, height: 48, color: "#F39200", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", marginBottom: 12 }}>Keine Rollen-DNA vorhanden</h2>
          <p style={{ fontSize: 14, color: "#6E6E73", marginBottom: 24, lineHeight: 1.6 }}>
            Bitte erstellen Sie zuerst eine Rollenanalyse, um den Soll-Ist-Bericht generieren zu können.
          </p>
          <button
            onClick={() => setLocation("/rollen-dna")}
            style={{
              height: 44, paddingLeft: 24, paddingRight: 24, fontSize: 14, fontWeight: 600,
              borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
              boxShadow: "0 4px 14px rgba(0,113,227,0.25)",
            }}
            data-testid="button-go-to-rolle"
          >
            Zur Rollenanalyse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7" }}>
      <GlobalNav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", margin: 0 }} data-testid="text-page-title">
            Soll-Ist-Bericht
          </h1>
          {result && (
            <button
              onClick={() => window.print()}
              style={{
                height: 38, paddingLeft: 16, paddingRight: 16, fontSize: 13, fontWeight: 600,
                borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer",
                background: "#FFFFFF", color: "#1D1D1F",
                display: "flex", alignItems: "center", gap: 7,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                transition: "all 150ms ease",
              }}
              className="no-print"
              data-testid="button-export-pdf"
            >
              <Download style={{ width: 15, height: 15 }} />
              PDF
            </button>
          )}
        </div>
        <p style={{ fontSize: 14, color: "#8E8E93", marginBottom: 28, fontWeight: 450 }}>
          Strukturierte Diagnose für Besetzungsentscheidungen
        </p>

        {/* === INPUT SECTION: Soll + Ist profiles === */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }} className="soll-ist-grid">
          {/* Soll card */}
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "20px 24px",
            border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }} data-testid="card-soll-profile">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#8E8E93", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Soll-Profil (Rolle)
            </h3>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", marginBottom: 4 }}>{roleName}</p>
            <p style={{ fontSize: 12, color: "#6E6E73", marginBottom: 14 }}>
              {dominanceLabel(dominanceModeOf(roleTriad))}
            </p>
            {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ width: 72, fontSize: 12, color: "#6E6E73", fontWeight: 500, textAlign: "right" }}>{labelComponent(k)}</span>
                <div style={{ flex: 1, height: 8, background: "rgba(0,0,0,0.04)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(roleTriad[k], 100)}%`, height: "100%", background: BAR_COLORS[k], borderRadius: 4 }} />
                </div>
                <span style={{ width: 32, fontSize: 12, color: "#1D1D1F", fontWeight: 600, textAlign: "right" }}>{Math.round(roleTriad[k])}</span>
              </div>
            ))}
          </div>

          {/* Ist card */}
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "20px 24px",
            border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }} data-testid="card-ist-profile">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#8E8E93", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Ist-Profil (Kandidat)
            </h3>
            <input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Name des Kandidaten"
              style={{
                width: "100%", height: 36, padding: "0 12px", fontSize: 14, fontWeight: 500,
                borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", marginBottom: 14,
                outline: "none", color: "#1D1D1F", background: "#FAFAFA",
              }}
              data-testid="input-candidate-name"
            />
            <p style={{ fontSize: 12, color: "#6E6E73", marginBottom: 12 }}>{dominanceLabel(candDom)}</p>
            {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
              const val = k === "impulsiv" ? candImp : k === "intuitiv" ? candInt : candAna;
              const setter = k === "impulsiv" ? setCandImp : k === "intuitiv" ? setCandInt : setCandAna;
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 72, fontSize: 12, color: "#6E6E73", fontWeight: 500, textAlign: "right" }}>{labelComponent(k)}</span>
                  <input
                    type="range" min={5} max={80} value={val}
                    onChange={(e) => setter(Number(e.target.value))}
                    style={{ flex: 1, accentColor: BAR_COLORS[k] }}
                    data-testid={`slider-${k}`}
                  />
                  <span style={{ width: 32, fontSize: 12, fontWeight: 600, color: "#1D1D1F", textAlign: "right" }}>{Math.round(candidateProfile[k])}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        {!reportGenerated && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <button
              onClick={() => setReportGenerated(true)}
              style={{
                height: 48, paddingLeft: 28, paddingRight: 28, fontSize: 15, fontWeight: 600,
                borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #0071E3, #34AADC)",
                color: "#FFFFFF", boxShadow: "0 4px 16px rgba(0,113,227,0.3)",
                transition: "all 200ms ease", display: "flex", alignItems: "center", gap: 8,
              }}
              data-testid="button-generate-report"
            >
              Bericht erstellen
            </button>
          </div>
        )}

        {/* === REPORT OUTPUT === */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── Section 1: Decision Banner ── */}
            <div
              style={{
                background: result.fitColor === "#34C759"
                  ? "linear-gradient(135deg, #E8F9EE, #F0FBF4)"
                  : result.fitColor === "#F39200"
                    ? "linear-gradient(135deg, #FFF5E6, #FFFAF0)"
                    : "linear-gradient(135deg, #FCEEF1, #FDF5F6)",
                borderRadius: 20, padding: "28px 32px",
                border: `1px solid ${result.fitColor}20`,
                boxShadow: `0 4px 20px ${result.fitColor}15`,
              }}
              data-testid="section-decision-banner"
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Rolle: {result.roleName}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 22, fontWeight: 800, color: result.fitColor,
                      letterSpacing: "-0.02em",
                    }} data-testid="text-fit-rating">
                      {result.fitLabel.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "#6E6E73" }}>
                      Steuerungsintensität: <strong style={{ color: "#1D1D1F" }}>{result.controlIntensity}</strong>
                    </span>
                    <span style={{ fontSize: 13, color: "#6E6E73" }}>
                      Kritischer Bereich: <strong style={{ color: "#1D1D1F" }}>{COMP_LABELS[result.roleDomKey]}</strong>
                    </span>
                  </div>
                </div>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: `${result.fitColor}18`,
                  border: `3px solid ${result.fitColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {result.fitRating === "GEEIGNET"
                    ? <CheckCircle2 style={{ width: 28, height: 28, color: result.fitColor }} />
                    : result.fitRating === "BEDINGT"
                      ? <MinusCircle style={{ width: 28, height: 28, color: result.fitColor }} />
                      : <XCircle style={{ width: 28, height: 28, color: result.fitColor }} />
                  }
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.6, marginTop: 16, maxWidth: 680 }}>
                {result.summaryText}
              </p>
            </div>

            {/* ── Section 2: Radar + Comparison ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="soll-ist-grid">
              <div style={{
                background: "#FFFFFF", borderRadius: 16, padding: "24px",
                border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex", flexDirection: "column", alignItems: "center",
              }} data-testid="section-radar">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 16, alignSelf: "flex-start" }}>
                  Profilvergleich
                </h3>
                <RadarChart role={result.roleTriad} candidate={result.candTriad} />
              </div>

              <div style={{
                background: "#FFFFFF", borderRadius: 16, padding: "24px",
                border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }} data-testid="section-comparison-bars">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 16 }}>
                  Soll-Ist-Abweichung
                </h3>
                <ComparisonBars role={result.roleTriad} candidate={result.candTriad} />
                <div style={{
                  marginTop: 16, padding: "12px 16px", borderRadius: 12,
                  background: "rgba(0,0,0,0.02)", fontSize: 12, color: "#6E6E73", lineHeight: 1.6,
                }}>
                  Gesamtabweichung: <strong style={{ color: "#1D1D1F" }}>{Math.round(result.totalGap)} Punkte</strong> ({result.gapLevel})
                </div>
              </div>
            </div>

            {/* ── Section 3: Dominance Shift ── */}
            <div style={{
              background: "#FFFFFF", borderRadius: 16, padding: "24px",
              border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }} data-testid="section-dominance-shift">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 16 }}>
                Dominanzverschiebung
              </h3>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
                <div style={{
                  padding: "14px 24px", borderRadius: 14,
                  background: `${BAR_COLORS[result.roleDomKey]}10`,
                  border: `2px solid ${BAR_COLORS[result.roleDomKey]}`,
                  textAlign: "center", minWidth: 180,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", marginBottom: 4, textTransform: "uppercase" }}>Rolle</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: BAR_COLORS[result.roleDomKey] }}>{COMP_LABELS[result.roleDomKey]}</p>
                </div>
                <ArrowRight style={{ width: 24, height: 24, color: "#C7C7CC", flexShrink: 0 }} />
                <div style={{
                  padding: "14px 24px", borderRadius: 14,
                  background: `${BAR_COLORS[result.candDomKey]}10`,
                  border: `2px solid ${BAR_COLORS[result.candDomKey]}`,
                  textAlign: "center", minWidth: 180,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", marginBottom: 4, textTransform: "uppercase" }}>Kandidat</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: BAR_COLORS[result.candDomKey] }}>{COMP_LABELS[result.candDomKey]}</p>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.7, textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
                {result.dominanceShiftText}
              </p>
            </div>

            {/* ── Section 4: Impact Matrix ── */}
            <div style={{
              background: "#FFFFFF", borderRadius: 16, padding: "24px",
              border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }} data-testid="section-impact-matrix">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 20 }}>
                Wirkungsanalyse
              </h3>

              {/* Matrix overview */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr auto",
                gap: "1px", marginBottom: 20,
                background: "rgba(0,0,0,0.06)", borderRadius: 12, overflow: "hidden",
              }}>
                <div style={{ background: "#F5F5F7", padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "#8E8E93" }}>Bereich</div>
                <div style={{ background: "#F5F5F7", padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "#8E8E93", textAlign: "center", minWidth: 100 }}>Bewertung</div>
                {result.impactAreas.map(area => (
                  <ImpactMatrixRow key={area.id} area={area} />
                ))}
              </div>

              {/* Detail cards for each area */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.impactAreas.filter(a => a.severity !== "ok").map(area => (
                  <div key={area.id} style={{
                    padding: "16px 20px", borderRadius: 12,
                    background: severityBg(area.severity),
                    borderLeft: `4px solid ${severityColor(area.severity)}`,
                  }} data-testid={`impact-detail-${area.id}`}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{area.label}</h4>
                      <SeverityBadge severity={area.severity} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }} className="soll-ist-grid">
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", marginBottom: 2 }}>ROLLE VERLANGT</p>
                        <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.5 }}>{area.roleNeed}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", marginBottom: 2 }}>KANDIDAT ZEIGT</p>
                        <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.5 }}>{area.candidatePattern}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: severityColor(area.severity), marginTop: 2, flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.5, margin: 0, fontWeight: 500 }}>{area.risk}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 5: Risk Timeline ── */}
            <div style={{
              background: "#FFFFFF", borderRadius: 16, padding: "24px",
              border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }} data-testid="section-risk-timeline">
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 20 }}>
                Risikoprognose
              </h3>
              <div style={{ position: "relative", paddingLeft: 28 }}>
                <div style={{
                  position: "absolute", left: 9, top: 8, bottom: 8, width: 2,
                  background: "linear-gradient(to bottom, #34C759, #F39200, #C41E3A)",
                  borderRadius: 1,
                }} />
                {result.riskTimeline.map((phase, i) => (
                  <div key={i} style={{ position: "relative", marginBottom: i < result.riskTimeline.length - 1 ? 24 : 0 }}>
                    <div style={{
                      position: "absolute", left: -22, top: 6, width: 12, height: 12,
                      borderRadius: "50%", background: "#FFFFFF",
                      border: `3px solid ${i === 0 ? "#34C759" : i === 1 ? "#F39200" : "#C41E3A"}`,
                    }} />
                    <div style={{ paddingLeft: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{phase.label}</span>
                        <span style={{ fontSize: 11, color: "#8E8E93", fontWeight: 500 }}>{phase.period}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.6, margin: 0 }}>{phase.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 6: Development + Actions ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="soll-ist-grid">
              {/* Development */}
              <div style={{
                background: "#FFFFFF", borderRadius: 16, padding: "24px",
                border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }} data-testid="section-development">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 16 }}>
                  Entwicklungsprognose
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <GaugeBar level={result.developmentLevel} />
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: result.developmentLevel <= 2 ? "#C41E3A" : result.developmentLevel <= 3 ? "#F39200" : "#34C759",
                  }}>
                    {result.developmentLabel}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.6, margin: 0 }}>
                  {result.developmentText}
                </p>
              </div>

              {/* Actions */}
              <div style={{
                background: "#FFFFFF", borderRadius: 16, padding: "24px",
                border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }} data-testid="section-actions">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 16 }}>
                  Handlungsempfehlung
                </h3>
                <p style={{ fontSize: 12, color: "#8E8E93", marginBottom: 12, fontWeight: 500 }}>
                  {result.fitRating === "GEEIGNET" ? "Zur Stabilisierung:" : "Wenn die Besetzung dennoch erfolgt:"}
                </p>
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.actions.map((action, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <ChevronRight style={{ width: 14, height: 14, color: "#0071E3", marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.5 }}>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Section 7: Final Assessment ── */}
            <div
              style={{
                background: result.fitColor === "#34C759"
                  ? "linear-gradient(135deg, #E8F9EE, #F0FBF4)"
                  : result.fitColor === "#F39200"
                    ? "linear-gradient(135deg, #FFF5E6, #FFFAF0)"
                    : "linear-gradient(135deg, #FCEEF1, #FDF5F6)",
                borderRadius: 20, padding: "28px 32px",
                border: `1px solid ${result.fitColor}20`,
              }}
              data-testid="section-final-assessment"
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Gesamtbewertung</h3>
                <span style={{
                  fontSize: 16, fontWeight: 800, color: result.fitColor,
                  padding: "6px 18px", borderRadius: 12,
                  background: `${result.fitColor}18`,
                }} data-testid="text-final-rating">
                  {result.fitLabel.toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "#6E6E73" }}>
                  Grund: <strong style={{ color: "#1D1D1F" }}>Dominanzstruktur</strong>
                </span>
                <span style={{ fontSize: 13, color: "#6E6E73" }}>
                  Steuerungsbedarf: <strong style={{ color: "#1D1D1F" }}>{result.controlIntensity}</strong>
                </span>
              </div>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.7, margin: 0 }}>
                {result.finalText}
              </p>
            </div>

          </div>
        )}

        <style>{`
          @media (max-width: 640px) {
            .soll-ist-grid { grid-template-columns: 1fr !important; }
          }
          @media print {
            body { background: #FFFFFF !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print, nav, header, [data-testid="button-generate-report"] { display: none !important; }
            input[type="range"] { display: none !important; }
            div[style*="minHeight: 100vh"] { min-height: auto !important; }
            div[style*="maxWidth: 900"] { max-width: 100% !important; padding: 0 !important; }
            div[style*="borderRadius"] { break-inside: avoid; }
            svg { max-width: 280px !important; }
            * { box-shadow: none !important; }
            @page { size: A4; margin: 18mm 14mm; }
          }
        `}</style>
      </div>
    </div>
  );
}

function ImpactMatrixRow({ area }: { area: { id: string; label: string; severity: Severity } }) {
  return (
    <>
      <div style={{ background: "#FFFFFF", padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#1D1D1F" }} data-testid={`matrix-row-${area.id}`}>
        {area.label}
      </div>
      <div style={{ background: "#FFFFFF", padding: "10px 16px", display: "flex", justifyContent: "center" }}>
        <SeverityBadge severity={area.severity} />
      </div>
    </>
  );
}
