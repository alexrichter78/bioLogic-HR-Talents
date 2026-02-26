import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, FileText, AlertTriangle, Check, Shield, TrendingUp, Users, Zap, Scale, ChevronRight, ChevronDown, CircleAlert, CircleCheck, CircleMinus, Lightbulb, CalendarDays, ClipboardCheck, BarChart3 } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";
import { hyphenateText } from "@/lib/hyphenate";
import { BERUFE } from "@/data/berufe";
import {
  type RoleAnalysis, type CandidateInput, type Triad, type FitStatus, type ControlIntensity, type EngineResult, type MatrixRow as EngineMatrixRow,
  runEngine, normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent, statusLabel, controlLabel,
} from "@/lib/jobcheck-engine";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

type BG = { imp: number; int: number; ana: number };

function roundBG(a: number, b: number, c: number): BG {
  const raw = [a, b, c];
  const floored = raw.map(Math.floor);
  let remainder = 100 - floored.reduce((s, v) => s + v, 0);
  const fracs = raw.map((v, i) => ({ i, f: v - floored[i] })).sort((a, b) => b.f - a.f);
  for (const f of fracs) { if (remainder <= 0) break; floored[f.i]++; remainder--; }
  return { imp: floored[0], int: floored[1], ana: floored[2] };
}

function calcBioGram(taetigkeiten: any[]): BG {
  if (!taetigkeiten.length) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const weights: Record<string, number> = { Niedrig: 1, Mittel: 2, Hoch: 3 };
  let sI = 0, sN = 0, sA = 0;
  for (const t of taetigkeiten) {
    const w = weights[t.niveau] || 1;
    if (t.kompetenz === "Impulsiv") sI += w;
    else if (t.kompetenz === "Intuitiv") sN += w;
    else sA += w;
  }
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  return roundBG((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
}

function computeRahmen(state: any): BG {
  let sI = 0, sN = 0, sA = 0;
  const f = state.fuehrung || "";
  if (f === "Fachliche Führung") sA += 1;
  else if (f === "Projekt-/Teamkoordination") sN += 1;
  else if (f.startsWith("Disziplinarische")) sI += 1;
  for (const idx of (state.erfolgsfokusIndices || [])) {
    if (idx === 0 || idx === 2) sI += 1;
    else if (idx === 1 || idx === 5) sN += 1;
    else if (idx === 3 || idx === 4) sA += 1;
  }
  if (state.aufgabencharakter === "überwiegend operativ") sI += 1;
  else if (state.aufgabencharakter === "überwiegend systemisch") sN += 1;
  else if (state.aufgabencharakter === "überwiegend strategisch") sA += 1;
  if (state.arbeitslogik === "Umsetzungsorientiert") sI += 1;
  else if (state.arbeitslogik === "Menschenorientiert") sN += 1;
  else if (state.arbeitslogik === "Daten-/prozessorientiert") sA += 1;
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  return roundBG((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
}

function computeGesamt(haupt: BG, neben: BG, fuehrung: BG, rahmen: BG): BG {
  const all = [haupt, neben, fuehrung, rahmen];
  let vals = [
    all.reduce((s, g) => s + g.imp, 0) / 4,
    all.reduce((s, g) => s + g.int, 0) / 4,
    all.reduce((s, g) => s + g.ana, 0) / 4,
  ];
  const CAP = 53;
  let changed = true;
  while (changed) {
    changed = false;
    const capped: number[] = [], uncapped: number[] = [];
    vals.forEach((v, i) => { if (v > CAP) capped.push(i); else uncapped.push(i); });
    if (capped.length > 0 && uncapped.length > 0) {
      let excess = 0;
      for (const i of capped) { excess += vals[i] - CAP; vals[i] = CAP; }
      const uT = uncapped.reduce((s, i) => s + vals[i], 0);
      if (uT > 0) for (const i of uncapped) vals[i] += excess * (vals[i] / uT);
      changed = true;
    }
  }
  return roundBG(vals[0], vals[1], vals[2]);
}

function bgToTriad(bg: BG): Triad {
  return { impulsiv: Math.round(bg.imp), intuitiv: Math.round(bg.int), analytisch: Math.round(bg.ana) };
}

function buildRoleAnalysis(state: any): RoleAnalysis | null {
  try {
    const beruf = state.beruf || "Unbenannte Rolle";
    const found = BERUFE.find(b => b.name === beruf);
    const bereich = found?.kategorie || "";
    const fuehrungstyp = state.fuehrung || "Keine";
    const isLeadership = fuehrungstyp !== "Keine";
    const taetigkeiten = state.taetigkeiten || [];

    const haupt = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "haupt"));
    const neben = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "neben"));
    const fuehrungBG = calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "fuehrung"));
    const rahmen = computeRahmen(state);
    const gesamt = computeGesamt(haupt, neben, fuehrungBG, rahmen);

    return {
      job_title: beruf,
      job_family: bereich,
      role_profile: bgToTriad(gesamt),
      frame_profile: bgToTriad(rahmen),
      leadership: {
        required: isLeadership,
        profile: isLeadership ? bgToTriad(fuehrungBG) : undefined,
        type: fuehrungstyp.startsWith("Disziplinarische") ? "disziplinarisch" : fuehrungstyp === "Fachliche Führung" ? "fachlich" : undefined,
      },
      tasks_profile: bgToTriad(haupt),
      human_profile: bgToTriad(neben),
      success_metrics: [],
      tension_fields: [],
    };
  } catch { return null; }
}

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.78)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 32, padding: "36px 32px",
      boxShadow: "0 2px 20px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.05)",
      border: "1px solid rgba(255,255,255,0.7)",
      ...style,
    }} data-testid={testId}>{children}</div>
  );
}

function AccordionCard({ title, icon: Icon, open, onToggle, children, testId, badge }: {
  title: string; icon: typeof ClipboardCheck; open: boolean; onToggle: () => void;
  children: React.ReactNode; testId?: string; badge?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 24, overflow: "hidden",
      boxShadow: "0 2px 20px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.05)",
      border: "1px solid rgba(255,255,255,0.7)",
    }} data-testid={testId}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
          gap: 12,
        }}
        data-testid={`${testId}-toggle`}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, rgba(0,113,227,0.12), rgba(52,170,220,0.08))",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon style={{ width: 16, height: 16, color: "#0071E3", strokeWidth: 2 }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 650, color: "#1D1D1F", letterSpacing: "-0.01em" }}>{title}</span>
          {badge}
        </div>
        <ChevronDown style={{
          width: 18, height: 18, color: "#8E8E93", strokeWidth: 2,
          transition: "transform 300ms ease",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }} />
      </button>
      <div style={{
        maxHeight: open ? 5000 : 0,
        overflow: "hidden",
        transition: "max-height 400ms ease",
      }}>
        <div style={{ padding: "0 24px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ChapterBadge({ num, color }: { num: number; color: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 12,
      background: `linear-gradient(135deg, ${color}, ${color}CC)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginRight: 14, flexShrink: 0,
      boxShadow: `0 4px 12px ${color}30`,
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF", fontVariantNumeric: "tabular-nums" }}>
        {String(num).padStart(2, "0")}
      </span>
    </div>
  );
}

function SoftBar({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(bar => (
        <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6E6E73", width: 62, flexShrink: 0 }}>{bar.label}</span>
          <div style={{ flex: 1, height: 24, borderRadius: 6, background: "rgba(0,0,0,0.04)", overflow: "hidden", position: "relative" }}>
            <div style={{
              width: `${Math.max(bar.value, 2)}%`,
              height: "100%", borderRadius: 6, background: bar.color,
              transition: "width 600ms ease",
              display: "flex", alignItems: "center", paddingLeft: 8,
              minWidth: 40,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{bar.value} %</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TriadSlider({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#3A3A3C" }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value} %</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        data-testid={`slider-${label.toLowerCase()}`}
        style={{
          width: "100%", height: 6, borderRadius: 3,
          appearance: "none", WebkitAppearance: "none",
          background: `linear-gradient(to right, ${color} ${value}%, rgba(0,0,0,0.06) ${value}%)`,
          outline: "none", cursor: "pointer",
        }}
      />
    </div>
  );
}

function BulletList({ items, icon, color }: { items: string[]; icon?: "check" | "dot"; color?: string }) {
  const c = color || "#6E6E73";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {icon === "check" ? (
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
              background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check style={{ width: 11, height: 11, color: c, strokeWidth: 2.5 }} />
            </div>
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, marginTop: 7, flexShrink: 0, opacity: 0.5 }} />
          )}
          <span style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.7, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{hyphenateText(item)}</span>
        </div>
      ))}
    </div>
  );
}

function CalloutBox({ text, color, icon: Icon }: { text: string; color: string; icon?: typeof Lightbulb }) {
  const IconComp = Icon || Lightbulb;
  return (
    <div style={{
      padding: "16px 20px", borderRadius: 18,
      background: `linear-gradient(135deg, ${color}0A, ${color}04)`,
      border: `1px solid ${color}15`,
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 9, flexShrink: 0,
        background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IconComp style={{ width: 14, height: 14, color, strokeWidth: 2 }} />
      </div>
      <p style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.75, margin: 0, fontWeight: 450, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{hyphenateText(text)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "geeignet" | "bedingt" | "kritisch" }) {
  const config = {
    geeignet: { icon: CircleCheck, color: "#34C759", bg: "rgba(52,199,89,0.08)", label: "Geeignet" },
    bedingt: { icon: CircleMinus, color: "#FF9500", bg: "rgba(255,149,0,0.08)", label: "Bedingt geeignet" },
    kritisch: { icon: CircleAlert, color: "#C41E3A", bg: "rgba(196,30,58,0.08)", label: "Kritisch" },
  }[status];
  const Icon = config.icon;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 10,
      background: config.bg, border: `1px solid ${config.color}20`,
    }}>
      <Icon style={{ width: 13, height: 13, color: config.color, strokeWidth: 2.2 }} />
      <span style={{ fontSize: 12, fontWeight: 650, color: config.color }}>{config.label}</span>
    </div>
  );
}

function MatrixRowUI({ bereich, status, begruendung }: { bereich: string; status: "geeignet" | "bedingt" | "kritisch"; begruendung: string }) {
  return (
    <div style={{
      padding: "16px 18px", borderRadius: 16,
      background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F" }}>{bereich}</span>
        <StatusBadge status={status} />
      </div>
      <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.65, margin: 0, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{hyphenateText(begruendung)}</p>
    </div>
  );
}

function TimelinePhase({ phase, title, items, color }: { phase: string; title: string; items: string[]; color: string }) {
  return (
    <div style={{
      position: "relative", paddingLeft: 32,
      borderLeft: `3px solid ${color}25`,
    }}>
      <div style={{
        position: "absolute", left: -8, top: 0,
        width: 14, height: 14, borderRadius: "50%",
        background: color, border: "3px solid #FFFFFF",
        boxShadow: `0 2px 8px ${color}40`,
      }} />
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: `${color}10`, borderRadius: 8, padding: "3px 10px", marginBottom: 10,
      }}>
        <CalendarDays style={{ width: 11, height: 11, color, strokeWidth: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.02em" }}>{phase}</span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>{title}</p>
      <BulletList items={items} color={color} />
    </div>
  );
}

function fitToUIStatus(fit: FitStatus): "geeignet" | "bedingt" | "kritisch" {
  if (fit === "SUITABLE") return "geeignet";
  if (fit === "CONDITIONAL") return "bedingt";
  return "kritisch";
}

function fitColor(fit: FitStatus): string {
  if (fit === "SUITABLE") return "#34C759";
  if (fit === "CONDITIONAL") return "#FF9500";
  return "#C41E3A";
}

function fitIcon(fit: FitStatus) {
  if (fit === "SUITABLE") return CircleCheck;
  if (fit === "CONDITIONAL") return AlertTriangle;
  return CircleAlert;
}

function controlColor(c: ControlIntensity): string {
  if (c === "LOW") return "#34C759";
  if (c === "MEDIUM") return "#FF9500";
  return "#C41E3A";
}

export default function JobCheck() {
  const [, setLocation] = useLocation();
  const [analyseOpen, setAnalyseOpen] = useState(true);
  const [berichtOpen, setBerichtOpen] = useState(false);
  const [roleAnalysis, setRoleAnalysis] = useState<RoleAnalysis | null>(null);
  const [candImp, setCandImp] = useState(33);
  const [candInt, setCandInt] = useState(34);
  const [candAna, setCandAna] = useState(33);
  const [candidateName, setCandidateName] = useState("");
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportKey, setReportKey] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      const role = buildRoleAnalysis(state);
      if (role) setRoleAnalysis(role);
    } catch {}
  }, []);

  const normalizedCand = useMemo(() => {
    const sum = candImp + candInt + candAna;
    if (sum === 0) return { impulsiv: 33, intuitiv: 34, analytisch: 33 };
    return {
      impulsiv: Math.round((candImp / sum) * 100),
      intuitiv: Math.round((candInt / sum) * 100),
      analytisch: Math.round((candAna / sum) * 100),
    };
  }, [candImp, candInt, candAna]);

  const [snapshotCand, setSnapshotCand] = useState(normalizedCand);
  const [snapshotName, setSnapshotName] = useState(candidateName);

  const engine: EngineResult | null = useMemo(() => {
    if (!roleAnalysis || !reportGenerated) return null;
    const cand: CandidateInput = {
      candidate_name: snapshotName || "Kandidat",
      candidate_profile: snapshotCand,
    };
    return runEngine(roleAnalysis, cand);
  }, [roleAnalysis, snapshotCand, snapshotName, reportGenerated, reportKey]);

  function handleCreateReport() {
    setSnapshotCand({ ...normalizedCand });
    setSnapshotName(candidateName);
    setReportKey(k => k + 1);
    setReportGenerated(true);
    setAnalyseOpen(false);
    setBerichtOpen(true);
  }

  const roleProfile = roleAnalysis ? normalizeTriad(roleAnalysis.role_profile) : null;

  if (!roleAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }}>
        <GlassCard testId="jobcheck-no-data">
          <div className="text-center" style={{ padding: "24px 44px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg, #E8F0FA, #FDEAED)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <FileText style={{ width: 24, height: 24, color: "#6E6E73" }} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", marginBottom: 8 }}>Keine Analyse vorhanden</p>
            <p style={{ fontSize: 14, color: "#8E8E93", marginBottom: 20, maxWidth: 260 }}>Erstelle zuerst ein Rollenprofil, um den JobCheck durchzuführen.</p>
            <button
              onClick={() => setLocation("/rollen-dna")}
              style={{ background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,113,227,0.25)" }}
              data-testid="button-goto-rollen-dna"
            >
              Zur Datenerfassung
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" lang="de" data-testid="jobcheck-page">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(252,205,210,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
          animation: "gradientShift 20s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes gradientShift {
          0% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.05) translate(-1%, 1%); }
          66% { transform: scale(1.02) translate(1%, -1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: white; border: 2px solid rgba(0,0,0,0.15);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          background: white; border: 2px solid rgba(0,0,0,0.15);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          cursor: pointer;
        }
      `}</style>

      <div className="relative z-10">
        <div style={{ position: "sticky", top: 0, zIndex: 200 }}>
          <div style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", background: "rgba(255,255,255,0.75)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
            <header className="flex items-center justify-between gap-4 px-6 py-3" data-testid="header-jobcheck">
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation("/bericht")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, background: "rgba(0,0,0,0.04)", border: "none", cursor: "pointer" }} data-testid="button-back-jobcheck">
                  <ArrowLeft style={{ width: 16, height: 16, color: "#6E6E73" }} />
                </button>
                <img src={logoSrc} alt="bioLogic Logo" className="h-6 w-auto" data-testid="logo-jobcheck" />
              </div>
            </header>
          </div>
        </div>

        <main className="flex-1 w-full max-w-2xl mx-auto px-5 pb-24 pt-10">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <GlassCard testId="jobcheck-header" style={{ padding: "36px 32px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,170,220,0.04))", pointerEvents: "none" }} />
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "linear-gradient(135deg, rgba(0,113,227,0.1), rgba(52,170,220,0.06))",
                borderRadius: 20, padding: "5px 14px", marginBottom: 14,
              }}>
                <Shield style={{ width: 12, height: 12, color: "#0071E3" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.12em" }}>Recruiting-Entscheidungsgrundlage – Level 2</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.15, marginBottom: 4 }} data-testid="text-jobcheck-title">
                bioLogic JobCheck
              </h1>
              <p style={{ fontSize: 15, color: "#6E6E73", marginBottom: 16, fontWeight: 500 }} data-testid="text-jobcheck-position">{roleAnalysis.job_title}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A3C", background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10 }}>
                  {roleAnalysis.job_family}
                </span>
              </div>
            </GlassCard>

            <AccordionCard
              title="Analyse – Soll / Ist Profil"
              icon={ClipboardCheck}
              open={analyseOpen}
              onToggle={() => setAnalyseOpen(!analyseOpen)}
              testId="accordion-analyse"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 14 }}>Sollprofil (Rollen-DNA)</p>
                  {roleProfile && (
                    <SoftBar items={[
                      { label: "Impulsiv", value: roleProfile.impulsiv, color: COLORS.imp },
                      { label: "Intuitiv", value: roleProfile.intuitiv, color: COLORS.int },
                      { label: "Analytisch", value: roleProfile.analytisch, color: COLORS.ana },
                    ]} />
                  )}
                  <div style={{ marginTop: 10 }}>
                    <CalloutBox
                      text={`Die dominante Logik der Rolle ist ${roleProfile ? labelComponent(dominanceModeOf(roleProfile).top1.key) : ""} geprägt: ${roleProfile ? dominanceLabel(dominanceModeOf(roleProfile)) : ""}.`}
                      color={roleProfile ? (dominanceModeOf(roleProfile).top1.key === "impulsiv" ? COLORS.imp : dominanceModeOf(roleProfile).top1.key === "intuitiv" ? COLORS.int : COLORS.ana) : "#0071E3"}
                      icon={Zap}
                    />
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "0 -4px" }} />

                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 6 }}>Istprofil (Kandidat)</p>
                  <p style={{ fontSize: 12, color: "#8E8E93", marginBottom: 16 }}>Verschieben Sie die Regler, um das Kandidatenprofil einzugeben. Die Werte werden automatisch normalisiert.</p>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", display: "block", marginBottom: 6 }}>Name des Kandidaten (optional)</label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={e => setCandidateName(e.target.value)}
                      placeholder="z. B. Kandidat A"
                      data-testid="input-candidate-name"
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)",
                        fontSize: 14, color: "#1D1D1F", outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "18px 20px", borderRadius: 18, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                    <TriadSlider label="Impulsiv" value={candImp} color={COLORS.imp} onChange={setCandImp} />
                    <TriadSlider label="Intuitiv" value={candInt} color={COLORS.int} onChange={setCandInt} />
                    <TriadSlider label="Analytisch" value={candAna} color={COLORS.ana} onChange={setCandAna} />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <SoftBar items={[
                      { label: "Impulsiv", value: normalizedCand.impulsiv, color: COLORS.imp },
                      { label: "Intuitiv", value: normalizedCand.intuitiv, color: COLORS.int },
                      { label: "Analytisch", value: normalizedCand.analytisch, color: COLORS.ana },
                    ]} />
                    <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 8, textAlign: "center" }}>Normalisiertes Profil (Summe = 100 %)</p>
                  </div>
                </div>

                <button
                  onClick={handleCreateReport}
                  data-testid="button-create-report"
                  style={{
                    width: "100%", padding: "14px 24px", borderRadius: 16,
                    background: "linear-gradient(135deg, #0071E3, #34AADC)",
                    color: "white", border: "none", fontSize: 15, fontWeight: 650,
                    cursor: "pointer", boxShadow: "0 4px 16px rgba(0,113,227,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "transform 150ms ease, box-shadow 150ms ease",
                  }}
                >
                  <BarChart3 style={{ width: 16, height: 16 }} />
                  Bericht erstellen
                </button>
              </div>
            </AccordionCard>

            <AccordionCard
              title="JobCheck Bericht"
              icon={BarChart3}
              open={berichtOpen}
              onToggle={() => { if (engine) setBerichtOpen(!berichtOpen); }}
              testId="accordion-bericht"
              badge={engine ? (
                <StatusBadge status={fitToUIStatus(engine.overallFit)} />
              ) : undefined}
            >
              {!engine ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <p style={{ fontSize: 14, color: "#8E8E93" }}>Bitte zuerst das Ist-Profil eingeben und „Bericht erstellen" klicken.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={1} color="#0071E3" />
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>Management Summary</span>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
                      padding: "16px 20px", borderRadius: 18,
                      background: `linear-gradient(135deg, ${fitColor(engine.overallFit)}12, ${fitColor(engine.overallFit)}04)`,
                      border: `1px solid ${fitColor(engine.overallFit)}20`,
                    }}>
                      {(() => { const FI = fitIcon(engine.overallFit); return (
                        <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: `${fitColor(engine.overallFit)}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FI style={{ width: 20, height: 20, color: fitColor(engine.overallFit), strokeWidth: 2 }} />
                        </div>
                      ); })()}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: fitColor(engine.overallFit), textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Gesamteinstufung</p>
                        <p style={{ fontSize: 18, fontWeight: 750, color: "#1D1D1F", margin: 0 }}>{statusLabel(engine.overallFit)}</p>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>Steuerungsintensität</p>
                        <p style={{ fontSize: 16, fontWeight: 750, color: controlColor(engine.controlIntensity), margin: 0 }}>{controlLabel(engine.controlIntensity)}</p>
                      </div>
                      <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>Abweichung</p>
                        <p style={{ fontSize: 16, fontWeight: 750, color: "#1D1D1F", margin: 0 }}>{engine.mismatchScore <= 8 ? "Gering" : engine.mismatchScore <= 15 ? "Moderat" : "Hoch"}{engine.koTriggered ? " · K.O." : ""}</p>
                      </div>
                    </div>

                    <CalloutBox text={engine.keyReason} color={fitColor(engine.overallFit)} icon={Lightbulb} />
                  </div>

                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

                  {(() => {
                    const sameDom = engine.roleDominance.top1.key === engine.candDominance.top1.key;
                    const roleVal = engine.roleDominance.top1.value;
                    const candVal = engine.candDominance.top1.value;
                    const intensityDiff = Math.abs(roleVal - candVal);
                    const rk = engine.roleDominance.top1.key;
                    const ck = engine.candDominance.top1.key;
                    const rc = rk === "impulsiv" ? COLORS.imp : rk === "intuitiv" ? COLORS.int : COLORS.ana;
                    const cc = ck === "impulsiv" ? COLORS.imp : ck === "intuitiv" ? COLORS.int : COLORS.ana;

                    const candGap = engine.candDominance.gap1;
                    const roleGap = engine.roleDominance.gap1;
                    const candDualDom = candGap <= 5;
                    const roleClearDom = roleGap >= 15;
                    const dualConflict = candDualDom && roleClearDom;

                    let calloutText: string;
                    let calloutColor: string;
                    let sectionTitle: string;

                    if (dualConflict) {
                      const c2k = engine.candDominance.top2.key;
                      const c2L = labelComponent(c2k);
                      const roleInDual = ck === rk || c2k === rk;
                      if (roleInDual) {
                        calloutText = `Doppeldominanz: ${labelComponent(rk)}-Steuerungslogik ist vorhanden, konkurriert aber mit gleich starker ${c2L}-Prägung. Die Rolle verlangt eindeutige ${labelComponent(rk)}-Ausrichtung – Priorisierungsverhalten und KPI-Disziplin sind instabil.`;
                        calloutColor = "#FF9500";
                      } else {
                        calloutText = `Der Kandidat arbeitet ${labelComponent(ck)}-/${c2L}-geprägt. Die für die Rolle entscheidende ${labelComponent(rk)}-Steuerungslogik fehlt strukturell. Auswirkung auf Entscheidungsarchitektur und Priorisierung: kritisch.`;
                        calloutColor = "#FF3B30";
                      }
                      sectionTitle = "Doppeldominanz";
                    } else if (sameDom && intensityDiff <= 5) {
                      calloutText = `Soll: ${roleVal} / Ist: ${candVal}. Beide Profile ${labelComponent(rk)}-geprägt, Ausprägung nahezu gleichauf (Δ ${intensityDiff} Punkte). Arbeitslogik und Priorisierungsverhalten bilden die Rollenanforderung stabil ab.`;
                      calloutColor = "#34C759";
                      sectionTitle = "Dominanz-Vergleich";
                    } else if (sameDom && intensityDiff <= 15) {
                      calloutText = `Soll: ${roleVal} / Ist: ${candVal} (Δ ${intensityDiff} Punkte). Beide Profile ${labelComponent(rk)}-geprägt. Die Grundrichtung stimmt, die Intensität liegt unter der Rollenanforderung. Auswirkung auf Prozessstabilität: steuerbar.`;
                      calloutColor = "#FF9500";
                      sectionTitle = "Dominanz-Vergleich";
                    } else if (sameDom) {
                      calloutText = `Soll: ${roleVal} / Ist: ${candVal} (Δ ${intensityDiff} Punkte). Beide Profile ${labelComponent(rk)}-geprägt, aber die geforderte Intensität fehlt deutlich. Auswirkung auf KPI-Stabilität und Prozessqualität: Steuerungslücke.`;
                      calloutColor = "#FF3B30";
                      sectionTitle = "Dominanz-Vergleich";
                    } else {
                      calloutText = `Rolle verlangt ${labelComponent(rk)}-Steuerungslogik (${roleVal}), Kandidat arbeitet ${labelComponent(ck)}-geprägt (${candVal}). Auswirkung: Die zentrale Arbeitslogik der Position wird grundlegend verschoben.`;
                      calloutColor = "#FF3B30";
                      sectionTitle = "Dominanz-Verschiebung";
                    }

                    return (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                          <ChapterBadge num={2} color="#0071E3" />
                          <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>
                            {sectionTitle}
                          </span>
                        </div>

                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16,
                          padding: "20px 24px", borderRadius: 18,
                          background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
                        }}>
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Soll</p>
                            <div style={{ padding: "6px 16px", borderRadius: 10, background: `${rc}12`, border: `1px solid ${rc}25` }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: rc }}>{labelComponent(rk)}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: rc, opacity: 0.7, marginLeft: 4 }}>{roleVal}%</span>
                            </div>
                          </div>
                          {dualConflict ? (
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#FF9500" }}>⇄</span>
                          ) : sameDom ? (
                            <span style={{ fontSize: 20, fontWeight: 700, color: intensityDiff <= 5 ? "#34C759" : "#FF9500" }}>=</span>
                          ) : (
                            <ChevronRight style={{ width: 20, height: 20, color: "#FF3B30" }} />
                          )}
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Ist</p>
                            {dualConflict ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {[engine.candDominance.top1, engine.candDominance.top2].map((comp) => {
                                  const compColor = comp.key === "impulsiv" ? COLORS.imp : comp.key === "intuitiv" ? COLORS.int : COLORS.ana;
                                  return (
                                    <div key={comp.key} style={{ padding: "6px 16px", borderRadius: 10, background: `${compColor}12`, border: `1px solid ${compColor}25` }}>
                                      <span style={{ fontSize: 15, fontWeight: 700, color: compColor }}>{labelComponent(comp.key)}</span>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: compColor, opacity: 0.7, marginLeft: 4 }}>{comp.value}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ padding: "6px 16px", borderRadius: 10, background: `${cc}12`, border: `1px solid ${cc}25` }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: cc }}>{labelComponent(ck)}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: cc, opacity: 0.7, marginLeft: 4 }}>{candVal}%</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {sameDom && intensityDiff > 0 && (
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12,
                            padding: "8px 16px", borderRadius: 10,
                            background: intensityDiff <= 5 ? "rgba(52,199,89,0.06)" : intensityDiff <= 15 ? "rgba(255,149,0,0.06)" : "rgba(255,59,48,0.06)",
                            border: `1px solid ${intensityDiff <= 5 ? "rgba(52,199,89,0.15)" : intensityDiff <= 15 ? "rgba(255,149,0,0.15)" : "rgba(255,59,48,0.15)"}`,
                          }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: intensityDiff <= 5 ? "#34C759" : intensityDiff <= 15 ? "#FF9500" : "#FF3B30" }}>
                              {intensityDiff <= 5 ? `Δ ${intensityDiff} Punkte – Ausprägung nahezu identisch` : intensityDiff <= 15 ? `Δ ${intensityDiff} Punkte – spürbare Abweichung` : `Δ ${intensityDiff} Punkte – deutliche Abweichung`}
                            </span>
                          </div>
                        )}

                        <CalloutBox text={calloutText} color={calloutColor} icon={Scale} />
                      </div>
                    );
                  })()}

                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

                  <div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={3} color="#0071E3" />
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>Strukturelle Eignungsmatrix</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {engine.matrix.map((row: EngineMatrixRow) => (
                        <MatrixRowUI
                          key={row.areaId}
                          bereich={row.areaLabel}
                          status={fitToUIStatus(row.status)}
                          begruendung={row.reasoning}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

                  <div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={4} color="#0071E3" />
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>Risikoprognose</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { label: "Kurzfristig", items: engine.risks.shortTerm, color: "#34C759" },
                        { label: "Mittelfristig", items: engine.risks.midTerm, color: "#FF9500" },
                        { label: "Langfristig", items: engine.risks.longTerm, color: "#C41E3A" },
                      ].map(risk => (
                        <div key={risk.label} style={{
                          padding: "16px 18px", borderRadius: 16,
                          background: `${risk.color}06`, border: `1px solid ${risk.color}15`,
                        }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: risk.color, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{risk.label}</p>
                          <BulletList items={risk.items} color={risk.color} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

                  <div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={5} color="#0071E3" />
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>Entwicklungsprognose</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>Wahrscheinlichkeit</p>
                        <p style={{ fontSize: 18, fontWeight: 750, color: engine.development.likelihood === "hoch" ? "#34C759" : engine.development.likelihood === "mittel" ? "#FF9500" : "#C41E3A", margin: 0 }}>
                          {engine.development.likelihood.charAt(0).toUpperCase() + engine.development.likelihood.slice(1)}
                        </p>
                      </div>
                      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>Zeitraum</p>
                        <p style={{ fontSize: 18, fontWeight: 750, color: "#0071E3", margin: 0 }}>{engine.development.timeframe}</p>
                      </div>
                    </div>
                    <CalloutBox text={engine.development.text} color="#FF9500" icon={TrendingUp} />
                  </div>

                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

                  <div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                      <ChapterBadge num={6} color="#0071E3" />
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>90-Tage-Integrationsplan</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                      <TimelinePhase phase="0–30 Tage" title="Strukturierung & Rahmen setzen" items={engine.integrationPlan90.phase_0_30} color="#0071E3" />
                      <TimelinePhase phase="30–60 Tage" title="Stabilisierung & Steuerung" items={engine.integrationPlan90.phase_30_60} color="#F39200" />
                      <TimelinePhase phase="60–90 Tage" title="Validierung & Entscheidung" items={engine.integrationPlan90.phase_60_90} color="#34C759" />
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

                  <div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={7} color="#0071E3" />
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>Gesamtbewertung</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>Grundpassung</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: fitColor(engine.overallFit), margin: 0 }}>{statusLabel(engine.overallFit)}</p>
                      </div>
                      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>Steuerungsbedarf</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: controlColor(engine.controlIntensity), margin: 0 }}>{controlLabel(engine.controlIntensity)}</p>
                      </div>
                      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>Kritischer Bereich</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{engine.criticalAreaLabel}</p>
                      </div>
                      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>Empfehlung</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0071E3", margin: 0 }}>
                          {engine.overallFit === "SUITABLE" ? "Besetzung strukturell passend" : engine.overallFit === "CONDITIONAL" ? "Besetzung möglich mit Integrations-Setup" : "Für diese Rolle nicht strukturgerecht"}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      padding: "18px 22px", borderRadius: 18,
                      background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.04))",
                      border: "1px solid rgba(0,113,227,0.12)",
                    }}>
                      <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.85, margin: 0, fontWeight: 500, textAlign: "justify", textAlignLast: "left" } as React.CSSProperties} lang="de">
                        {hyphenateText(engine.overallFit === "SUITABLE"
                          ? "Die Besetzung passt zur Rolle. Fokus auf saubere Umsetzung und klare Arbeitsroutinen."
                          : engine.overallFit === "CONDITIONAL"
                            ? "Die Besetzung ist nicht risikofrei, aber entwicklungsfähig – vorausgesetzt, klare Erwartungen und Rahmenvorgaben werden etabliert."
                            : "Die Arbeitsweise des Kandidaten passt nicht zur Grundlogik dieser Rolle. Eine erfolgreiche Besetzung ist unwahrscheinlich."
                        )}
                      </p>
                    </div>
                  </div>

                </div>
              )}
            </AccordionCard>

          </div>
        </main>
      </div>
    </div>
  );
}
