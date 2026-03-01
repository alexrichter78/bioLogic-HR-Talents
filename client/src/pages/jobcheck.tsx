import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { FileText, AlertTriangle, Check, Shield, TrendingUp, Users, Zap, Scale, ChevronRight, ChevronDown, CircleAlert, CircleCheck, CircleMinus, Lightbulb, CalendarDays, ClipboardCheck, BarChart3 } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";
import GlobalNav from "@/components/global-nav";
import { hyphenateText } from "@/lib/hyphenate";
import { BERUFE } from "@/data/berufe";
import {
  type RoleAnalysis, type CandidateInput, type Triad, type FitStatus, type ControlIntensity, type EngineResult, type MatrixRow as EngineMatrixRow, type ComponentKey,
  runEngine, normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent, statusLabel, controlLabel,
} from "@/lib/jobcheck-engine";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

type BG = { imp: number; int: number; ana: number };

function roundPercentages(p1: number, p2: number, p3: number): [number, number, number] {
  const factor = 10;
  const raw = [p1 * factor, p2 * factor, p3 * factor];
  const flo = [Math.floor(raw[0]), Math.floor(raw[1]), Math.floor(raw[2])];
  const rest = [raw[0] - flo[0], raw[1] - flo[1], raw[2] - flo[2]];
  const targetSum = 100 * factor;
  let missing = targetSum - (flo[0] + flo[1] + flo[2]);
  while (missing > 0) {
    let maxIdx = 0;
    if (rest[1] > rest[maxIdx]) maxIdx = 1;
    if (rest[2] > rest[maxIdx]) maxIdx = 2;
    flo[maxIdx] += 1;
    rest[maxIdx] = 0;
    missing -= 1;
  }
  return [flo[0] / factor, flo[1] / factor, flo[2] / factor];
}

function calcBioGram(taetigkeiten: any[]): BG {
  if (!taetigkeiten.length) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const weights: Record<string, number> = { Niedrig: 0.6, Mittel: 1.0, Hoch: 1.8 };
  let sI = 0, sN = 0, sA = 0;
  for (const t of taetigkeiten) {
    const w = weights[t.niveau] || 1.0;
    if (t.kompetenz === "Impulsiv") sI += w;
    else if (t.kompetenz === "Intuitiv") sN += w;
    else sA += w;
  }
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const [imp, int, ana] = roundPercentages((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
  return { imp, int, ana };
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
  const [imp, int, ana] = roundPercentages((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
  return { imp, int, ana };
}

function computeGesamt(haupt: BG, neben: BG, fuehrung: BG, rahmen: BG): BG {
  const all = [haupt, neben, fuehrung, rahmen];
  let vals = [
    all.reduce((s, g) => s + g.imp, 0) / 4,
    all.reduce((s, g) => s + g.int, 0) / 4,
    all.reduce((s, g) => s + g.ana, 0) / 4,
  ];
  const MAX = 67;
  const peak = Math.max(...vals);
  if (peak > MAX) {
    const scale = MAX / peak;
    vals = vals.map(v => v * scale);
  }
  const [imp, int, ana] = roundPercentages(vals[0], vals[1], vals[2]);
  return { imp, int, ana };
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

    const haupt = state.bioGramHaupt || calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "haupt"));
    const neben = state.bioGramNeben || calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "neben"));
    const fuehrungBG = state.bioGramFuehrung || calcBioGram(taetigkeiten.filter((t: any) => t.kategorie === "fuehrung"));
    const rahmen = state.bioGramRahmen || computeRahmen(state);
    const gesamt = state.bioGramGesamt || computeGesamt(haupt, neben, fuehrungBG, rahmen);

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
      {items.map(bar => {
        const widthPct = (bar.value / 67) * 100;
        return (
          <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#6E6E73", width: 62, flexShrink: 0 }}>{bar.label}</span>
            <div style={{ flex: 1, height: 24, borderRadius: 6, background: "rgba(0,0,0,0.04)", overflow: "hidden", position: "relative" }}>
              <div style={{
                width: `${Math.min(Math.max(widthPct, 3), 100)}%`,
                height: "100%", borderRadius: 6, background: bar.color,
                transition: "width 600ms ease",
                display: "flex", alignItems: "center", paddingLeft: 8,
                minWidth: 40,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{bar.value} %</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BarSlider({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  const widthPct = (value / 67) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
      <span style={{ fontSize: 12, color: "#6E6E73", width: 62, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, position: "relative", height: 24 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{
            width: value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 5), 100)}%`,
            height: "100%", borderRadius: 6, background: color,
            transition: "width 150ms ease",
            display: "flex", alignItems: "center", paddingLeft: 8,
            minWidth: value === 0 ? 0 : 40,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{Math.round(value)} %</span>
          </div>
        </div>
        <input
          type="range" min={0} max={67} value={value}
          onChange={e => onChange(Number(e.target.value))}
          data-testid={`slider-${label.toLowerCase()}`}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            appearance: "none", WebkitAppearance: "none",
            background: "transparent", outline: "none", cursor: "pointer",
            margin: 0, zIndex: 2,
          }}
        />
      </div>
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
  const [candImp, setCandImp] = useState(() => {
    try { const s = localStorage.getItem("jobcheckCandProfile"); if (s) { const p = JSON.parse(s); return p.impulsiv ?? 33; } } catch {} return 33;
  });
  const [candInt, setCandInt] = useState(() => {
    try { const s = localStorage.getItem("jobcheckCandProfile"); if (s) { const p = JSON.parse(s); return p.intuitiv ?? 34; } } catch {} return 34;
  });
  const [candAna, setCandAna] = useState(() => {
    try { const s = localStorage.getItem("jobcheckCandProfile"); if (s) { const p = JSON.parse(s); return p.analytisch ?? 33; } } catch {} return 33;
  });
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

  useEffect(() => {
    localStorage.setItem("jobcheckCandProfile", JSON.stringify(normalizedCand));
  }, [normalizedCand]);

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
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }}>
        <GlobalNav />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 60px)" }}>
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
          width: 6px; height: 24px; border-radius: 3px;
          background: rgba(255,255,255,0.85); border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.2);
          cursor: ew-resize;
        }
        input[type="range"]::-moz-range-thumb {
          width: 6px; height: 24px; border-radius: 3px;
          background: rgba(255,255,255,0.85); border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.2);
          cursor: ew-resize;
        }
        input[type="range"]::-webkit-slider-runnable-track { height: 24px; cursor: ew-resize; }
        input[type="range"]::-moz-range-track { height: 24px; cursor: ew-resize; background: transparent; }
      `}</style>

      <div className="relative z-10">
        <GlobalNav />

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

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <BarSlider label="Impulsiv" value={candImp} color={COLORS.imp} onChange={setCandImp} />
                    <BarSlider label="Intuitiv" value={candInt} color={COLORS.int} onChange={setCandInt} />
                    <BarSlider label="Analytisch" value={candAna} color={COLORS.ana} onChange={setCandAna} />
                  </div>
                  <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 8, textAlign: "center" }}>Normalisiertes Profil (max. 67 % pro Komponente)</p>
                  {(() => {
                    const candDom = dominanceModeOf(normalizedCand);
                    return (
                      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                        <p style={{ fontSize: 12, color: "#48484A", margin: 0, lineHeight: 1.6 }} lang="de" data-testid="text-cand-dominance">
                          {"Die dominante Logik des Kandidaten ist "}
                          {labelComponent(candDom.top1.key)}
                          {" geprägt: "}
                          {dominanceLabel(candDom)}.
                        </p>
                      </div>
                    );
                  })()}
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

                  </div>

                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

                  <div>
                    <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.6, marginBottom: 16, hyphens: "auto", textAlign: "justify" } as React.CSSProperties} lang="de">
                      Diese Auswertung beschreibt die Wirklogik einer Rolle. Die Anforderungen werden den drei Dimensionen{" "}
                      <span style={{ fontWeight: 700, color: COLORS.imp }}>Impulsiv</span>,{" "}
                      <span style={{ fontWeight: 700, color: COLORS.int }}>Intuitiv</span> und{" "}
                      <span style={{ fontWeight: 700, color: COLORS.ana }}>Analytisch</span> zugeordnet.
                      So wird erkennbar, welche Form von Wirksamkeit die Rolle bestimmt.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                      {[
                        { label: "Impulsiv", color: COLORS.imp, desc: "Umsetzung, Entscheidung und Ergebnisverantwortung" },
                        { label: "Intuitiv", color: COLORS.int, desc: "Zusammenarbeit und kontextbezogenes Handeln" },
                        { label: "Analytisch", color: COLORS.ana, desc: "Struktur, Planung und fachliche Präzision" },
                      ].map(d => (
                        <div key={d.label} style={{ padding: "14px 16px", borderRadius: 16, background: `${d.color}08`, border: `1px solid ${d.color}15` }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: d.color, margin: "0 0 4px" }}>{d.label}</p>
                          <p style={{ fontSize: 12, color: "#6E6E73", margin: 0, lineHeight: 1.4 }}>{d.desc}</p>
                        </div>
                      ))}
                    </div>

                    {roleProfile && (() => {
                      const r = roleProfile;
                      const c = snapshotCand;
                      const dims: { key: ComponentKey; label: string; color: string }[] = [
                        { key: "impulsiv", label: "Impulsiv", color: COLORS.imp },
                        { key: "intuitiv", label: "Intuitiv", color: COLORS.int },
                        { key: "analytisch", label: "Analytisch", color: COLORS.ana },
                      ];
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {dims.map(d => {
                            const sollVal = r[d.key];
                            const istVal = c[d.key];
                            const delta = istVal - sollVal;
                            return (
                              <div key={d.key}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{d.label}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: delta === 0 ? "#34C759" : Math.abs(delta) <= 5 ? "#8E8E93" : Math.abs(delta) <= 15 ? "#FF9500" : "#FF3B30" }}>
                                    Δ {delta > 0 ? "+" : ""}{delta}
                                  </span>
                                </div>
                                <div style={{ position: "relative", height: 28, borderRadius: 8, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
                                  <div style={{ position: "absolute", top: 0, left: 0, height: "50%", width: `${Math.min(sollVal, 100)}%`, background: `${d.color}40`, borderRadius: "8px 8px 0 0", transition: "width 0.4s ease" }} />
                                  <div style={{ position: "absolute", bottom: 0, left: 0, height: "50%", width: `${Math.min(istVal, 100)}%`, background: d.color, borderRadius: "0 0 8px 8px", transition: "width 0.4s ease" }} />
                                  <div style={{ position: "absolute", top: 0, left: 8, height: "50%", display: "flex", alignItems: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1D1D1F" }}>Soll {sollVal}%</span>
                                  </div>
                                  <div style={{ position: "absolute", bottom: 0, left: 8, height: "50%", display: "flex", alignItems: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>Ist {istVal}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20, marginBottom: 14 }}>
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
                    const isEqualDist = engine.equalDistribution;
                    const candDualDom = !isEqualDist && candGap <= 5;
                    const roleClearDom = roleGap >= 15;
                    const dualConflict = candDualDom && roleClearDom;

                    let calloutText: string;
                    let calloutColor: string;
                    let sectionTitle: string;

                    if (isEqualDist) {
                      calloutText = `Gleichverteilung: Das Kandidatenprofil zeigt keine erkennbare Steuerungsrichtung (${engine.candDominance.top1.value}/${engine.candDominance.top2.value}/${engine.candDominance.top3.value}). Die Rolle verlangt klare ${labelComponent(rk)}-Arbeitslogik (Soll: ${roleVal}). Ohne dominantes Steuerungsprofil fehlt die strukturelle Basis für Priorisierung und Entscheidungsarchitektur.`;
                      calloutColor = "#FF3B30";
                      sectionTitle = "Gleichverteilung";
                    } else if (dualConflict) {
                      const c2k = engine.candDominance.top2.key;
                      const c2L = labelComponent(c2k);
                      const roleInDual = ck === rk || c2k === rk;
                      if (roleInDual) {
                        calloutText = `Doppeldominanz: ${labelComponent(rk)}-Steuerungslogik ist vorhanden, konkurriert aber mit gleich starker ${c2L}-Prägung. Die Rolle verlangt eindeutige ${labelComponent(rk)}-Ausrichtung – Priorisierungsverhalten und Steuerungsdisziplin sind instabil.`;
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
                      calloutText = `Soll: ${roleVal} / Ist: ${candVal} (Δ ${intensityDiff} Punkte). Beide Profile ${labelComponent(rk)}-geprägt, aber die geforderte Intensität fehlt deutlich. Auswirkung auf Prozessqualität und Steuerungsstabilität: Steuerungslücke.`;
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
                          {isEqualDist ? (
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#FF3B30" }}>≠</span>
                          ) : dualConflict ? (
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#FF9500" }}>⇄</span>
                          ) : sameDom ? (
                            <span style={{ fontSize: 20, fontWeight: 700, color: intensityDiff <= 5 ? "#34C759" : "#FF9500" }}>=</span>
                          ) : (
                            <ChevronRight style={{ width: 20, height: 20, color: "#FF3B30" }} />
                          )}
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Ist</p>
                            {isEqualDist ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {[engine.candDominance.top1, engine.candDominance.top2, engine.candDominance.top3].map((comp) => {
                                  const compColor = comp.key === "impulsiv" ? COLORS.imp : comp.key === "intuitiv" ? COLORS.int : COLORS.ana;
                                  return (
                                    <div key={comp.key} style={{ padding: "4px 12px", borderRadius: 10, background: `${compColor}12`, border: `1px solid ${compColor}25` }}>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: compColor }}>{labelComponent(comp.key)}</span>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: compColor, opacity: 0.7, marginLeft: 4 }}>{comp.value}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : dualConflict ? (
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

                  {engine.secondaryTension && (
                    <>
                      <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                          <ChapterBadge num={3} color="#FF9500" />
                          <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>Sekundärkomponenten-Spannung</span>
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16,
                          padding: "18px 22px", borderRadius: 18,
                          background: "rgba(255,149,0,0.04)", border: "1px solid rgba(255,149,0,0.12)",
                        }}>
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Rolle erwartet</p>
                            <div style={{ padding: "6px 16px", borderRadius: 10, background: `${engine.secondaryTension.roleSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.roleSecondary === "intuitiv" ? COLORS.int : COLORS.ana}12`, border: `1px solid ${engine.secondaryTension.roleSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.roleSecondary === "intuitiv" ? COLORS.int : COLORS.ana}25` }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: engine.secondaryTension.roleSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.roleSecondary === "intuitiv" ? COLORS.int : COLORS.ana }}>{labelComponent(engine.secondaryTension.roleSecondary)}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: engine.secondaryTension.roleSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.roleSecondary === "intuitiv" ? COLORS.int : COLORS.ana, opacity: 0.7, marginLeft: 4 }}>{engine.secondaryTension.roleSecondaryValue}%</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#FF9500" }}>⇄</span>
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Kandidat bringt</p>
                            <div style={{ padding: "6px 16px", borderRadius: 10, background: `${engine.secondaryTension.candSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.candSecondary === "intuitiv" ? COLORS.int : COLORS.ana}12`, border: `1px solid ${engine.secondaryTension.candSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.candSecondary === "intuitiv" ? COLORS.int : COLORS.ana}25` }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: engine.secondaryTension.candSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.candSecondary === "intuitiv" ? COLORS.int : COLORS.ana }}>{labelComponent(engine.secondaryTension.candSecondary)}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: engine.secondaryTension.candSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.candSecondary === "intuitiv" ? COLORS.int : COLORS.ana, opacity: 0.7, marginLeft: 4 }}>{engine.secondaryTension.candSecondaryValue}%</span>
                            </div>
                          </div>
                        </div>
                        <CalloutBox text={engine.secondaryTension.text} color="#FF9500" icon={AlertTriangle} />
                      </div>
                    </>
                  )}

                  <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

                  <div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={engine.secondaryTension ? 4 : 3} color="#0071E3" />
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
                      <ChapterBadge num={engine.secondaryTension ? 5 : 4} color="#0071E3" />
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
                      <ChapterBadge num={engine.secondaryTension ? 6 : 5} color="#0071E3" />
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
                      <ChapterBadge num={engine.secondaryTension ? 7 : 6} color="#0071E3" />
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
                      <ChapterBadge num={engine.secondaryTension ? 8 : 7} color="#0071E3" />
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
