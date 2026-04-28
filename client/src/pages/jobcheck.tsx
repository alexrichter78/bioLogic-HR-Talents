import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { FileText, AlertTriangle, Check, TrendingUp, Zap, Scale, ChevronRight, ChevronDown, CircleAlert, CircleCheck, CircleMinus, Lightbulb, CalendarDays, ClipboardCheck, BarChart3, CheckCircle2, Briefcase, LayoutGrid, Wrench, Target, UserCheck, Hash, Compass, Shield, Gauge, Award, ArrowUpRight, Layers, Printer } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useRegion, localizeDeep } from "@/lib/region";
import { useUI } from "@/lib/ui-texts";
import { useIsMobile } from "@/hooks/use-mobile";
import { hyphenateText } from "@/lib/hyphenate";
import { BERUFE } from "@/data/berufe";
import {
  type RoleAnalysis, type CandidateInput, type Triad, type FitStatus, type ControlIntensity, type EngineResult, type MatrixRow as EngineMatrixRow, type ComponentKey,
  runEngine, normalizeTriad, dominanceModeOf, dominanceLabel, labelComponent, buildRoleAnalysisFromState,
} from "@/lib/jobcheck-engine";

type BG = { imp: number; int: number; ana: number };

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

type RollenDnaSummary = {
  beruf: string;
  fuehrung: string;
  aufgabencharakter: string;
  arbeitslogik: string;
  erfolgsfokusIndices: number[];
  taetigkeitenCount: number;
  humanCount: number;
  fuehrungCount: number;
};

const ERFOLGSFOKUS_DISPLAY_LABELS = [
  "Ergebnisse und Zielerreichung",
  "Zusammenarbeit und Netzwerk",
  "Innovation und Veränderung",
  "Prozesse und Effizienz",
  "Fachliche Qualität und Expertise",
  "Kommunikation und Einfluss",
];

const AUFGABENCHARAKTER_LABELS: Record<string, string> = {
  "überwiegend operativ": "Praktische Umsetzung im Tagesgeschäft",
  "überwiegend systemisch": "Abstimmung und Umsetzung im Arbeitsablauf",
  "überwiegend strategisch": "Analyse, Planung und strategische Steuerung",
  "Gemischt": "Ausgewogene Mischung",
};

const ARBEITSLOGIK_LABELS: Record<string, string> = {
  "Umsetzungsorientiert": "Umsetzung und Ergebnisse",
  "Daten-/prozessorientiert": "Analyse und Struktur",
  "Menschenorientiert": "Zusammenarbeit und Kommunikation",
  "Ausgewogen": "Ausgewogene Mischung",
};

const FUEHRUNG_LABELS: Record<string, string> = {
  "Keine": "Keine Führungsverantwortung",
  "Projekt-/Teamkoordination": "Projekt- oder Teamkoordination",
  "Fachliche Führung": "Fachliche Führung",
  "Disziplinarische Führung mit Ergebnisverantwortung": "Führung mit Personalverantwortung",
};

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
  const MAX = 50;
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
  const ra = buildRoleAnalysisFromState(state);
  if (!ra) return null;
  const found = BERUFE.find(b => b.name === (state.beruf || ""));
  if (found) ra.job_family = found.kategorie || "";
  return ra;
}

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 20, padding: "28px 32px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
      border: "1px solid rgba(0,0,0,0.04)",
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
      background: "#FFFFFF",
      borderRadius: 20, overflow: "hidden",
      boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
      border: "1px solid rgba(0,0,0,0.04)",
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

function SoftBar({ items, region }: { items: { label: string; value: number; color: string }[]; region?: string }) {
  return (
    <div style={{ background: "#F0F0F2", borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map(bar => {
        const widthPct = (bar.value / 50) * 100;
        const isSmall = widthPct < 18;
        return (
          <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "#48484A", width: region === "FR" || region === "IT" ? 115 : 72, flexShrink: 0, lineHeight: "1.35" }}>{bar.label}</span>
            <div style={{ flex: 1, position: "relative", height: 26 }}>
              <div style={{
                position: "absolute", inset: 0,
                borderRadius: 13, background: "rgba(0,0,0,0.06)",
              }} />
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                borderRadius: 13, background: bar.color,
                transition: "width 600ms ease",
                display: "flex", alignItems: "center", paddingLeft: 10,
                minWidth: isSmall ? 10 : 50,
              }}>
                {!isSmall && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{bar.value} %</span>
                )}
              </div>
              {isSmall && (
                <span style={{
                  position: "absolute", top: "50%", transform: "translateY(-50%)",
                  left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`,
                  fontSize: 13, fontWeight: 600, color: "#6E6E73", whiteSpace: "nowrap",
                  transition: "left 600ms ease",
                }}>{bar.value} %</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Triad-Solver: garantiert Summe = 100 und jeder Wert in [5..50].
// Wird sowohl für Live-Updates der Slider als auch für die Migration alter
// localStorage-Werte verwendet.
// ──────────────────────────────────────────────────────────────────────────────
type TriadKey = "impulsiv" | "intuitiv" | "analytisch";
type CandTriadT = { impulsiv: number; intuitiv: number; analytisch: number };

function solveTriad(prev: CandTriadT, key: TriadKey, newVal: number): CandTriadT {
  const all: TriadKey[] = ["impulsiv", "intuitiv", "analytisch"];
  const others = all.filter(k => k !== key) as [TriadKey, TriadKey];
  const clamped = Math.max(5, Math.min(50, Math.round(newVal)));
  const remaining = 100 - clamped; // ∈ [50..95]

  const otherSum = prev[others[0]] + prev[others[1]];
  let o1Raw: number, o2Raw: number;
  if (otherSum <= 0) {
    o1Raw = remaining / 2;
    o2Raw = remaining - o1Raw;
  } else {
    o1Raw = (prev[others[0]] / otherSum) * remaining;
    o2Raw = remaining - o1Raw;
  }

  // o1 zuerst clampen, o2 als Komplement zur Summe = remaining
  let o1 = Math.max(5, Math.min(50, Math.round(o1Raw)));
  let o2 = remaining - o1;

  // Falls Komplement außerhalb [5..50]: o2 fixieren, o1 nachziehen
  if (o2 < 5) { o2 = 5; o1 = remaining - 5; }
  else if (o2 > 50) { o2 = 50; o1 = remaining - 50; }

  // Letzte Sicherheit (sollte bei clamped ∈ [5..50] nie greifen, da remaining ∈ [50..95])
  o1 = Math.max(5, Math.min(50, o1));
  o2 = remaining - o1;
  if (o2 < 5) { o2 = 5; o1 = remaining - 5; }
  if (o2 > 50) { o2 = 50; o1 = remaining - 50; }

  return { [key]: clamped, [others[0]]: o1, [others[1]]: o2 } as CandTriadT;
}

function migrateLegacyTriad(impRaw: number, intRaw: number, anaRaw: number): CandTriadT {
  const sum = (impRaw || 0) + (intRaw || 0) + (anaRaw || 0);
  if (!isFinite(sum) || sum <= 0) return { impulsiv: 33, intuitiv: 34, analytisch: 33 };
  // Auf Summe = 100 normalisieren
  const i = (impRaw / sum) * 100;
  const n = (intRaw / sum) * 100;
  const a = (anaRaw / sum) * 100;
  // Dominanten Wert als Anker nehmen, damit der Solver konsistent löst
  const triad: CandTriadT = { impulsiv: i, intuitiv: n, analytisch: a };
  const keys: TriadKey[] = ["impulsiv", "intuitiv", "analytisch"];
  const dominant = keys.reduce((best, k) => (triad[k] > triad[best] ? k : best), keys[0]);
  return solveTriad(triad, dominant, triad[dominant]);
}

function BarSlider({ label, value, color, onChange, region }: { label: string; value: number; color: string; onChange: (v: number) => void; region?: string }) {
  const widthPct = (value / 50) * 100;
  const isSmall = widthPct < 18;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 14, color: "#48484A", width: region === "FR" || region === "IT" ? 115 : 72, flexShrink: 0, lineHeight: "1.35" }}>{label}</span>
      <div style={{ flex: 1, position: "relative", height: 26 }}>
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: 13, background: "rgba(0,0,0,0.06)",
        }} />
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 4), 100)}%`,
          borderRadius: 13, background: color,
          transition: "width 150ms ease",
          display: "flex", alignItems: "center", paddingLeft: 10,
          minWidth: value === 0 ? 0 : (isSmall ? 8 : 50),
        }}>
          {!isSmall && <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{Math.round(value)} %</span>}
        </div>
        <input
          type="range" min={5} max={50} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="bio-slider"
          data-testid={`slider-${label.toLowerCase()}`}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            appearance: "none", WebkitAppearance: "none",
            background: "transparent", outline: "none", cursor: "ew-resize",
            margin: 0, zIndex: 3,
          }}
        />
        {isSmall && value > 0 && (
          <span style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`,
            fontSize: 13, fontWeight: 600, color: "#6E6E73", whiteSpace: "nowrap",
            transition: "left 150ms ease", zIndex: 1,
          }}>{Math.round(value)} %</span>
        )}
      </div>
    </div>
  );
}

function BulletList({ items, icon, color }: { items: string[]; icon?: "check" | "dot"; color?: string }) {
  const c = color || "#48484A";
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
  const ui = useUI();
  const config = {
    geeignet: { icon: CircleCheck, color: "#34C759", bg: "rgba(52,199,89,0.08)", label: ui.general.geeignet },
    bedingt: { icon: CircleMinus, color: "#FF9500", bg: "rgba(255,149,0,0.08)", label: ui.general.bedingtGeeignet },
    kritisch: { icon: CircleAlert, color: "#C41E3A", bg: "rgba(196,30,58,0.08)", label: ui.jobcheck.kritisch },
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
      <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.65, margin: 0, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{hyphenateText(begruendung)}</p>
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
  const isMobile = useIsMobile();
  const { region } = useRegion();
  const ui = useUI();
  const jc = ui.jobcheck;
  const labelCompUI = (k: ComponentKey) =>
    k === "impulsiv" ? ui.general.labelImpulsiv : k === "intuitiv" ? ui.general.labelIntuitiv : ui.general.labelAnalytisch;
  const dominanceLabelUI = (dom: ReturnType<typeof dominanceModeOf>) => {
    if (region !== "EN") return dominanceLabel(dom);
    const { mode, top1, top2 } = dom;
    const k1 = labelCompUI(top1.key);
    const k2 = labelCompUI(top2.key);
    switch (mode) {
      case "EXTREME_I": case "EXTREME_N": case "EXTREME_A":
        return `${k1} extremely dominant`;
      case "DOM_I": case "DOM_N": case "DOM_A":
        return `${k1} dominant`;
      case "DUAL_I_A": return "Dual focus: Impulsive–Analytical";
      case "DUAL_I_N": return "Dual focus: Impulsive–Intuitive";
      case "DUAL_N_A": return "Dual focus: Intuitive–Analytical";
      case "BAL_I": case "BAL_N": case "BAL_A":
        return `Balanced with ${k1.toLowerCase()} tendency`;
      case "BAL_FULL": return "Fully balanced";
      default: return `${k1} / ${k2}`;
    }
  };
  const [analyseOpen, setAnalyseOpen] = useState(true);
  const [berichtOpen, setBerichtOpen] = useState(false);
  const [roleAnalysis, setRoleAnalysis] = useState<RoleAnalysis | null>(null);
  const [dnaSummary, setDnaSummary] = useState<RollenDnaSummary | null>(null);
  // Auto-balancierte Triade (Summe = 100 garantiert, jeder Wert in [5..50])
  const [candTriad, setCandTriad] = useState<{ impulsiv: number; intuitiv: number; analytisch: number }>(() => {
    try {
      const s = localStorage.getItem("jobcheckCandSliders");
      if (s) {
        const p = JSON.parse(s);
        return migrateLegacyTriad(Number(p.impulsiv ?? 33), Number(p.intuitiv ?? 34), Number(p.analytisch ?? 33));
      }
    } catch {}
    return { impulsiv: 33, intuitiv: 34, analytisch: 33 };
  });
  const [candidateName, setCandidateName] = useState(() => {
    try { const s = localStorage.getItem("jobcheckCandSliders"); if (s) { const p = JSON.parse(s); return p.name ?? ""; } } catch {} return "";
  });
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportKey, setReportKey] = useState(0);
  const jobcheckContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      const role = buildRoleAnalysis(state);
      if (role) setRoleAnalysis(role);
      const taetigkeiten = state.taetigkeiten || [];
      setDnaSummary({
        beruf: state.beruf || "",
        fuehrung: state.fuehrung || "Keine",
        aufgabencharakter: state.aufgabencharakter || "",
        arbeitslogik: state.arbeitslogik || "",
        erfolgsfokusIndices: state.erfolgsfokusIndices || [],
        taetigkeitenCount: taetigkeiten.filter((t: any) => t.kategorie === "haupt").length,
        humanCount: taetigkeiten.filter((t: any) => t.kategorie === "neben").length,
        fuehrungCount: taetigkeiten.filter((t: any) => t.kategorie === "fuehrung").length,
      });
    } catch {}
  }, []);

  // Slider-Werte sind bereits normalisiert (Summe = 100, jeder in [5..50])
  const normalizedCand = candTriad;

  // Auto-Balance: wenn ein Slider verändert wird, andere proportional anpassen.
  // Garantiert: jeder Wert in [5..50] und Summe = 100.
  const updateCandTriad = useCallback((key: "impulsiv" | "intuitiv" | "analytisch", newVal: number) => {
    setCandTriad(prev => solveTriad(prev, key, newVal));
  }, []);

  useEffect(() => {
    localStorage.setItem("jobcheckCandProfile", JSON.stringify({ ...normalizedCand, name: candidateName }));
    localStorage.setItem("jobcheckCandSliders", JSON.stringify({ ...candTriad, name: candidateName }));
  }, [normalizedCand, candidateName, candTriad]);

  const [snapshotCand, setSnapshotCand] = useState(normalizedCand);
  const [snapshotName, setSnapshotName] = useState(candidateName);

  const engine: EngineResult | null = useMemo(() => {
    if (!roleAnalysis || !reportGenerated) return null;
    const cand: CandidateInput = {
      candidate_name: snapshotName || "Person",
      candidate_profile: snapshotCand,
    };
    return localizeDeep(runEngine(roleAnalysis, cand), region);
  }, [roleAnalysis, snapshotCand, snapshotName, reportGenerated, reportKey, region]);

  useEffect(() => {
    if (engine) {
      localStorage.setItem("jobcheckOverallFit", engine.overallFit);
      localStorage.setItem("jobcheckControlIntensity", engine.controlIntensity);
      localStorage.setItem("jobcheckMismatchScore", String(engine.mismatchScore));
    }
  }, [engine]);

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
      <div className="page-gradient-bg">
        <GlobalNav />
        <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 60px)" }}>
          <GlassCard testId="jobcheck-no-data">
            <div className="text-center" style={{ padding: "24px 44px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg, #E8F0FA, #FDEAED)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <FileText style={{ width: 24, height: 24, color: "#6E6E73" }} />
              </div>
              <p style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", marginBottom: 8 }}>{jc.noAnalysisTitle}</p>
              <p style={{ fontSize: 14, color: "#6E6E73", marginBottom: 20, maxWidth: 260 }}>{jc.noAnalysisDesc}</p>
              <button
                onClick={() => setLocation("/rollen-dna")}
                style={{ background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,113,227,0.25)" }}
                data-testid="button-goto-rollen-dna"
              >
                {jc.gotoDataEntry}
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="page-gradient-bg" lang={region === "FR" ? "fr" : region === "EN" ? "en" : "de"} data-testid="jobcheck-page">
      <style>{`
        input[type="range"]::-webkit-slider-runnable-track { height: 24px; cursor: ew-resize; background: transparent; }
        input[type="range"]::-moz-range-track { height: 24px; cursor: ew-resize; background: transparent; }
      `}</style>

      <div className="relative z-10">
        <GlobalNav />

        <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999 }}>
          <div className="dark:!bg-background" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "5px 0 10px", minHeight: 62 }}>
            <div className="w-full mx-auto" style={{ maxWidth: 1100, paddingLeft: isMobile ? 12 : 24, paddingRight: isMobile ? 12 : 24 }}>
              <div className="text-center">
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#34C759" }} data-testid="text-jobcheck-title">
                  {jc.pageTitle}
                </h1>
                <p style={{ fontSize: 14, color: "#48484A", fontWeight: 450, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} data-testid="text-jobcheck-subtitle">
                  {jc.pageSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto" style={{ maxWidth: 1100, paddingTop: isMobile ? 120 : 135, paddingBottom: isMobile ? 80 : 40, paddingLeft: isMobile ? 12 : 24, paddingRight: isMobile ? 12 : 24 }}>
          <div ref={jobcheckContentRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <GlassCard testId="jobcheck-header" style={{ padding: "28px 32px", position: "relative", overflow: "hidden" }}>
              <button
                onClick={() => {
                  const printWin = window.open("", "_blank");
                  if (!printWin) return;
                  const contentEl = jobcheckContentRef.current;
                  if (!contentEl) return;
                  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                    .map(el => el.outerHTML).join("\n");
                  const jobTitle = roleAnalysis?.job_title || "JobCheck";
                  printWin.document.write(`<!DOCTYPE html><html lang="${region === "FR" ? "fr" : region === "EN" ? "en" : "de"}"><head><meta charset="utf-8"><title>JobCheck – ${jobTitle}</title>${styles}<style>body{margin:0;padding:20px 32px;background:#fff;font-family:Inter,Arial,Helvetica,sans-serif}
.no-print{display:none!important}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
[data-pdf-block]{break-inside:avoid!important}
</style></head><body>${contentEl.outerHTML}</body></html>`);
                  printWin.document.close();
                  setTimeout(() => { printWin.print(); }, 600);
                }}
                className="no-print"
                data-testid="button-print-jobcheck"
                title={jc.printTooltip}
                style={{ position: "absolute", top: 16, right: 16, height: 36, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)", color: "#1D1D1F", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease", zIndex: 2 }}
              >
                <Printer style={{ width: 14, height: 14 }} />
                <span>{jc.printBtn}</span>
              </button>

              {dnaSummary && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} data-testid="dna-summary-grid">
                  {[
                    { icon: Briefcase, label: jc.summaryRole, value: dnaSummary.beruf || roleAnalysis.job_title, testId: "summary-rolle" },
                    { icon: LayoutGrid, label: jc.summaryTaskStructure, value: jc.taskStructureLabels[dnaSummary.aufgabencharakter] || dnaSummary.aufgabencharakter, testId: "summary-aufgaben" },
                    { icon: Wrench, label: jc.summaryWorkStyle, value: jc.workStyleLabels[dnaSummary.arbeitslogik] || dnaSummary.arbeitslogik, testId: "summary-arbeitsweise" },
                    { icon: Target, label: jc.summarySuccessFocus, value: (Array.isArray(dnaSummary.erfolgsfokusIndices) ? dnaSummary.erfolgsfokusIndices : []).map(i => jc.successFocusLabels[i]).filter(Boolean).join(", ") || jc.summaryNotDefined, testId: "summary-erfolgsfokus" },
                    { icon: UserCheck, label: jc.summaryLeadership, value: jc.leadershipLabels[dnaSummary.fuehrung] || dnaSummary.fuehrung, testId: "summary-fuehrung" },
                    { icon: Hash, label: jc.summaryCompetenceCount, value: null, testId: "summary-kompetenz" },
                  ].map(card => (
                    <div
                      key={card.testId}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 16,
                        background: "rgba(0,0,0,0.025)",
                        border: "1px solid rgba(0,0,0,0.05)",
                      }}
                      data-testid={card.testId}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <card.icon style={{ width: 12, height: 12, color: "#0071E3", strokeWidth: 2 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 650, color: "#1D1D1F" }}>{card.label}</span>
                      </div>
                      {card.value !== null ? (
                        <p style={{ fontSize: 14, color: "#48484A", margin: 0, lineHeight: 1.5, paddingLeft: 32 }}>{card.value}</p>
                      ) : (
                        <div style={{ display: "flex", gap: 14, paddingLeft: 32, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, color: "#48484A" }}><strong style={{ color: "#1D1D1F" }}>{dnaSummary.taetigkeitenCount}</strong> {jc.countActivities}</span>
                          <span style={{ fontSize: 14, color: "#48484A" }}><strong style={{ color: "#1D1D1F" }}>{dnaSummary.humanCount}</strong> {jc.countHumanSkills}</span>
                          <span style={{ fontSize: 14, color: "#48484A" }}><strong style={{ color: "#1D1D1F" }}>{dnaSummary.fuehrungCount}</strong> {jc.countLeadership}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            <AccordionCard
              title={jc.analyseAccordionTitle}
              icon={ClipboardCheck}
              open={analyseOpen}
              onToggle={() => setAnalyseOpen(!analyseOpen)}
              testId="accordion-analyse"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 14 }}>{jc.sollHeader}</p>
                  {roleProfile && (
                    <SoftBar region={region} items={[
                      { label: ui.general.labelImpulsiv, value: roleProfile.impulsiv, color: COLORS.imp },
                      { label: ui.general.labelIntuitiv, value: roleProfile.intuitiv, color: COLORS.int },
                      { label: ui.general.labelAnalytisch, value: roleProfile.analytisch, color: COLORS.ana },
                    ]} />
                  )}
                  <div style={{ marginTop: 10 }}>
                    <CalloutBox
                      text={roleProfile ? jc.roleDominanceText(labelCompUI(dominanceModeOf(roleProfile).top1.key), dominanceLabelUI(dominanceModeOf(roleProfile))) : ""}
                      color={roleProfile ? (dominanceModeOf(roleProfile).top1.key === "impulsiv" ? COLORS.imp : dominanceModeOf(roleProfile).top1.key === "intuitiv" ? COLORS.int : COLORS.ana) : "#0071E3"}
                      icon={Zap}
                    />
                  </div>
                </div>

                <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "0 -4px" }} />

                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 6 }}>{jc.istHeader}</p>
                  <p style={{ fontSize: 14, color: "#48484A", marginBottom: 16 }}>{jc.istDescription}</p>

                  <div style={{ background: "#F0F0F2", borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <BarSlider label={ui.general.labelImpulsiv} value={candTriad.impulsiv} color={COLORS.imp} onChange={(v) => updateCandTriad("impulsiv", v)} region={region} />
                    <BarSlider label={ui.general.labelIntuitiv} value={candTriad.intuitiv} color={COLORS.int} onChange={(v) => updateCandTriad("intuitiv", v)} region={region} />
                    <BarSlider label={ui.general.labelAnalytisch} value={candTriad.analytisch} color={COLORS.ana} onChange={(v) => updateCandTriad("analytisch", v)} region={region} />
                  </div>
                  <p style={{ fontSize: 11, color: "#6E6E73", marginTop: 8, textAlign: "center" }}>{jc.normalizedNote}</p>
                  {(() => {
                    const candDom = dominanceModeOf(normalizedCand);
                    return (
                      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
                        <p style={{ fontSize: 14, color: "#48484A", margin: 0, lineHeight: 1.6 }} lang={region === "FR" ? "fr" : region === "EN" ? "en" : "de"} data-testid="text-cand-dominance">
                          {jc.candDominancePrefix}
                          {labelCompUI(candDom.top1.key)}
                          {jc.candDominanceMiddle}
                          {dominanceLabelUI(candDom)}.
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <button
                  onClick={handleCreateReport}
                  data-testid="button-create-report"
                  style={{
                    height: 48, paddingLeft: 24, paddingRight: 24, fontSize: 15, fontWeight: 600,
                    borderRadius: 14, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
                    boxShadow: "0 4px 16px rgba(0,113,227,0.3)", transition: "all 200ms ease",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,113,227,0.35)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,113,227,0.3)"; }}
                >
                  <FileText style={{ width: 17, height: 17 }} />
                  {jc.createReportButton}
                </button>
              </div>
            </AccordionCard>

            <AccordionCard
              title={jc.reportAccordionTitle}
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
                  <p style={{ fontSize: 14, color: "#6E6E73" }}>{jc.reportEmptyHint}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  <div style={{
                    padding: "24px 24px 20px", borderRadius: 20,
                    background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                      <ChapterBadge num={1} color="#0071E3" />
                      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "rgba(0,113,227,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                        <FileText style={{ width: 14, height: 14, color: "#0071E3", strokeWidth: 2 }} />
                      </div>
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
                        <p style={{ fontSize: 11, fontWeight: 700, color: fitColor(engine.overallFit), textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>{ui.teamreport.overallAssessment}</p>
                        <p style={{ fontSize: 18, fontWeight: 750, color: "#1D1D1F", margin: 0 }}>
                          {engine.overallFit === "SUITABLE" ? ui.general.geeignet : engine.overallFit === "CONDITIONAL" ? ui.general.bedingtGeeignet : ui.general.nichtGeeignet}
                        </p>
                      </div>
                    </div>

                  </div>

                  <div style={{
                    padding: "24px 24px 20px", borderRadius: 20,
                    background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 12,
                        background: "linear-gradient(135deg, #0071E3, #0071E3CC)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginRight: 14, flexShrink: 0,
                        boxShadow: "0 4px 12px #0071E330",
                      }}>
                        <Target style={{ width: 16, height: 16, color: "#FFF", strokeWidth: 2.2 }} />
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>{ui.jobcheck.profileComparisonTitle}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, marginBottom: 16, hyphens: "auto", textAlign: "justify" } as React.CSSProperties} lang="de">
                      Diese Auswertung beschreibt die Wirklogik einer Stelle. Die Anforderungen werden den drei Arbeitsbereichen{" "}
                      <span style={{ fontWeight: 700, color: COLORS.imp }}>{ui.general.labelImpulsiv}</span>,{" "}
                      <span style={{ fontWeight: 700, color: COLORS.int }}>{ui.general.labelIntuitiv}</span>{jc.andConjunction}
                      <span style={{ fontWeight: 700, color: COLORS.ana }}>{ui.general.labelAnalytisch}</span>{jc.assignedSuffix}
                      So wird erkennbar, welche Form von Wirksamkeit die Stelle bestimmt.
                    </p>
                    {roleProfile && (() => {
                      const r = roleProfile;
                      const c = snapshotCand;
                      const dims: { key: ComponentKey; label: string; color: string }[] = [
                        { key: "impulsiv", label: ui.general.labelImpulsiv, color: COLORS.imp },
                        { key: "intuitiv", label: ui.general.labelIntuitiv, color: COLORS.int },
                        { key: "analytisch", label: ui.general.labelAnalytisch, color: COLORS.ana },
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
                                  <span style={{ fontSize: 14, fontWeight: 700, color: d.color }}>{d.label}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: delta === 0 ? "#34C759" : Math.abs(delta) <= 5 ? "#8E8E93" : Math.abs(delta) <= 15 ? "#FF9500" : "#FF3B30" }}>
                                    Δ {delta > 0 ? "+" : ""}{delta}
                                  </span>
                                </div>
                                <div style={{ position: "relative", height: 28, borderRadius: 8, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
                                  <div style={{ position: "absolute", top: 0, left: 0, height: "50%", width: `${(Math.min(sollVal, 50) / 50) * 100}%`, background: `${d.color}40`, borderRadius: "8px 8px 0 0", transition: "width 0.4s ease" }} />
                                  <div style={{ position: "absolute", bottom: 0, left: 0, height: "50%", width: `${(Math.min(istVal, 50) / 50) * 100}%`, background: d.color, borderRadius: "0 0 8px 8px", transition: "width 0.4s ease" }} />
                                  <div style={{ position: "absolute", top: 0, left: 8, height: "50%", display: "flex", alignItems: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1D1D1F" }}>{ui.jobcheck.sollHeader} {sollVal}%</span>
                                  </div>
                                  <div style={{ position: "absolute", bottom: 0, left: 8, height: "50%", display: "flex", alignItems: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{ui.jobcheck.istHeader} {istVal}%</span>
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
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", margin: "0 0 4px" }}>{ui.matchcheck.managementEffort}</p>
                        <p style={{ fontSize: 16, fontWeight: 750, color: controlColor(engine.controlIntensity), margin: 0 }}>
                          {engine.controlIntensity === "LOW" ? jc.controlLow : engine.controlIntensity === "MEDIUM" ? jc.controlMedium : jc.controlHigh}
                        </p>
                      </div>
                      <div style={{ padding: "12px 14px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", margin: "0 0 4px" }}>{ui.jobcheck.deviationLabel}</p>
                        <p style={{ fontSize: 16, fontWeight: 750, color: "#1D1D1F", margin: 0 }}>
                          {engine.mismatchScore <= 8 ? jc.mismatchLow : engine.mismatchScore <= 15 ? jc.mismatchModerate : jc.mismatchHigh}
                          {engine.koTriggered ? " · K.O." : ""}
                        </p>
                      </div>
                    </div>

                    <CalloutBox text={engine.keyReason} color={fitColor(engine.overallFit)} icon={Lightbulb} />

                    <div style={{ marginTop: 20 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#48484A", margin: "0 0 14px", letterSpacing: "0.02em" }}>{ui.teamreport.dimMeaning}</p>
                      {[
                        { label: ui.general.labelIntuitiv, color: COLORS.int, desc: jc.descIntuitiv },
                        { label: ui.general.labelImpulsiv, color: COLORS.imp, desc: jc.descImpulsiv },
                        { label: ui.general.labelAnalytisch, color: COLORS.ana, desc: jc.descAnalytisch },
                      ].map((d, i) => (
                        <div key={d.label} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ width: 7, height: 7, borderRadius: 4, background: d.color, display: "inline-block", flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{d.label}</span>
                          </div>
                          <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: 0, paddingLeft: 13 }}>{d.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

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

                    const lc = (k: typeof rk) => k === "impulsiv" ? ui.general.labelImpulsiv : k === "intuitiv" ? ui.general.labelIntuitiv : ui.general.labelAnalytisch;
                    const tpl = (template: string, vars: Record<string, string>) =>
                      Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), template);

                    if (isEqualDist) {
                      calloutText = tpl(jc.calloutEqualDist, { rk: lc(rk) });
                      calloutColor = "#FF3B30";
                      sectionTitle = ui.jobcheck.equalDistribution;
                    } else if (dualConflict) {
                      const c2k = engine.candDominance.top2.key;
                      const c2L = lc(c2k);
                      const roleInDual = ck === rk || c2k === rk;
                      if (roleInDual) {
                        calloutText = tpl(jc.calloutDualRoleInDual, { rk: lc(rk), c2L });
                        calloutColor = "#FF9500";
                      } else {
                        calloutText = tpl(jc.calloutDualNotInDual, { ck: lc(ck), c2L, rk: lc(rk) });
                        calloutColor = "#FF3B30";
                      }
                      sectionTitle = ui.jobcheck.dualDominance;
                    } else if (sameDom && intensityDiff <= 5) {
                      calloutText = tpl(jc.calloutSameDomNearEqual, { rk: lc(rk) });
                      calloutColor = "#34C759";
                      sectionTitle = ui.jobcheck.profileComparison2;
                    } else if (sameDom && intensityDiff <= 15) {
                      calloutText = tpl(jc.calloutSameDomModerate, { rk: lc(rk) });
                      calloutColor = "#FF9500";
                      sectionTitle = ui.jobcheck.profileComparison2;
                    } else if (sameDom) {
                      calloutText = tpl(jc.calloutSameDomHigh, { rk: lc(rk) });
                      calloutColor = "#FF3B30";
                      sectionTitle = ui.jobcheck.profileComparison2;
                    } else {
                      calloutText = tpl(jc.calloutMismatch, { rk: lc(rk), ck: lc(ck) });
                      calloutColor = "#FF3B30";
                      sectionTitle = ui.jobcheck.roleMismatch;
                    }

                    return (
                      <div style={{
                        padding: "24px 24px 20px", borderRadius: 20,
                        background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.04)",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                          <ChapterBadge num={2} color="#0071E3" />
                          <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "rgba(0,113,227,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                            <Layers style={{ width: 14, height: 14, color: "#0071E3", strokeWidth: 2 }} />
                          </div>
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
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{ui.jobcheck.sollHeader}</p>
                            <div style={{ padding: "6px 16px", borderRadius: 10, background: `${rc}12`, border: `1px solid ${rc}25` }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: rc }}>{lc(rk)}</span>
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
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{ui.jobcheck.istHeader}</p>
                            {isEqualDist ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {[engine.candDominance.top1, engine.candDominance.top2, engine.candDominance.top3].map((comp) => {
                                  const compColor = comp.key === "impulsiv" ? COLORS.imp : comp.key === "intuitiv" ? COLORS.int : COLORS.ana;
                                  return (
                                    <div key={comp.key} style={{ padding: "4px 12px", borderRadius: 10, background: `${compColor}12`, border: `1px solid ${compColor}25` }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: compColor }}>{labelComponent(comp.key)}</span>
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
                                <span style={{ fontSize: 15, fontWeight: 700, color: cc }}>{lc(ck)}</span>
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
                              {intensityDiff <= 5 ? ui.jobcheck.nearlyIdentical : intensityDiff <= 15 ? ui.jobcheck.noticeableDeviation : ui.jobcheck.significantDeviation}
                            </span>
                          </div>
                        )}

                        <CalloutBox text={calloutText} color={calloutColor} icon={Scale} />
                      </div>
                    );
                  })()}

                  {engine.secondaryTension && (
                    <>
                      <div style={{
                        padding: "24px 24px 20px", borderRadius: 20,
                        background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.04)",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                          <ChapterBadge num={3} color="#FF9500" />
                          <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "rgba(255,149,0,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                            <Gauge style={{ width: 14, height: 14, color: "#FF9500", strokeWidth: 2 }} />
                          </div>
                          <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>Sekundärkomponenten-Spannung</span>
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16,
                          padding: "18px 22px", borderRadius: 18,
                          background: "rgba(255,149,0,0.04)", border: "1px solid rgba(255,149,0,0.12)",
                        }}>
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Stelle erwartet</p>
                            <div style={{ padding: "6px 16px", borderRadius: 10, background: `${engine.secondaryTension.roleSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.roleSecondary === "intuitiv" ? COLORS.int : COLORS.ana}12`, border: `1px solid ${engine.secondaryTension.roleSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.roleSecondary === "intuitiv" ? COLORS.int : COLORS.ana}25` }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: engine.secondaryTension.roleSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.roleSecondary === "intuitiv" ? COLORS.int : COLORS.ana }}>{labelComponent(engine.secondaryTension.roleSecondary)}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: engine.secondaryTension.roleSecondary === "impulsiv" ? COLORS.imp : engine.secondaryTension.roleSecondary === "intuitiv" ? COLORS.int : COLORS.ana, opacity: 0.7, marginLeft: 4 }}>{engine.secondaryTension.roleSecondaryValue}%</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#FF9500" }}>⇄</span>
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Person bringt</p>
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

                  <div style={{
                    padding: "24px 24px 20px", borderRadius: 20,
                    background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={engine.secondaryTension ? 4 : 3} color="#0071E3" />
                      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "rgba(0,113,227,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                        <LayoutGrid style={{ width: 14, height: 14, color: "#0071E3", strokeWidth: 2 }} />
                      </div>
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

                  <div style={{
                    padding: "24px 24px 20px", borderRadius: 20,
                    background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={engine.secondaryTension ? 5 : 4} color="#0071E3" />
                      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "rgba(196,30,58,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                        <Shield style={{ width: 14, height: 14, color: "#C41E3A", strokeWidth: 2 }} />
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>{ui.teamreport.riskForecast}</span>
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

                  <div style={{
                    padding: "24px 24px 20px", borderRadius: 20,
                    background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={engine.secondaryTension ? 6 : 5} color="#0071E3" />
                      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "rgba(255,149,0,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                        <TrendingUp style={{ width: 14, height: 14, color: "#FF9500", strokeWidth: 2 }} />
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>Entwicklungsprognose</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", margin: "0 0 4px" }}>{ui.jobcheck.probability}</p>
                        <p style={{ fontSize: 18, fontWeight: 750, color: engine.development.likelihood === "hoch" ? "#34C759" : engine.development.likelihood === "mittel" ? "#FF9500" : "#C41E3A", margin: 0 }}>
                          {engine.development.likelihood.charAt(0).toUpperCase() + engine.development.likelihood.slice(1)}
                        </p>
                      </div>
                      <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", margin: "0 0 4px" }}>Zeitraum</p>
                        <p style={{ fontSize: 18, fontWeight: 750, color: "#0071E3", margin: 0 }}>{engine.development.timeframe}</p>
                      </div>
                    </div>
                    <div data-testid="text-dev-prognose-detail">
                      <CalloutBox text={engine.development.text} color="#FF9500" icon={TrendingUp} />
                    </div>
                  </div>

                  <div style={{
                    padding: "24px 24px 20px", borderRadius: 20,
                    background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                      <ChapterBadge num={engine.secondaryTension ? 7 : 6} color="#0071E3" />
                      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "rgba(52,199,89,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                        <CalendarDays style={{ width: 14, height: 14, color: "#34C759", strokeWidth: 2 }} />
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>90-Tage-Integrationsplan</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                      <TimelinePhase phase="0–30 Tage" title="Strukturierung & Rahmen setzen" items={engine.integrationPlan90.phase_0_30} color="#0071E3" />
                      <TimelinePhase phase="30–60 Tage" title="Stabilisierung & Steuerung" items={engine.integrationPlan90.phase_30_60} color="#F39200" />
                      <TimelinePhase phase="60–90 Tage" title="Validierung & Entscheidung" items={engine.integrationPlan90.phase_60_90} color="#34C759" />
                    </div>
                  </div>

                  <div style={{
                    padding: "24px 24px 20px", borderRadius: 20,
                    background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
                      <ChapterBadge num={engine.secondaryTension ? 8 : 7} color="#0071E3" />
                      <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: "rgba(0,113,227,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                        <Award style={{ width: 14, height: 14, color: "#0071E3", strokeWidth: 2 }} />
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F" }}>{ui.teamreport.overallAssessment}</span>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: fitColor(engine.overallFit), margin: "20px 0 0", letterSpacing: "-0.02em" }} data-testid="jc-gesamt-label">
                      {engine.overallFit === "SUITABLE" ? ui.general.geeignet : engine.overallFit === "CONDITIONAL" ? ui.general.bedingtGeeignet : ui.general.nichtGeeignet}
                    </div>

                    <div style={{ display: "flex", gap: 16, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(0,0,0,0.06)" }} data-testid="jc-two-axis">
                      <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${fitColor(engine.overallFit)}08`, border: `1px solid ${fitColor(engine.overallFit)}25` }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{jc.basicFit}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: fitColor(engine.overallFit) }} data-testid="jc-grundpassung">
                          {engine.overallFit === "SUITABLE" ? ui.general.geeignet : engine.overallFit === "CONDITIONAL" ? ui.general.bedingtGeeignet : ui.general.nichtGeeignet}
                        </div>
                      </div>
                      <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${controlColor(engine.controlIntensity)}08`, border: `1px solid ${controlColor(engine.controlIntensity)}25` }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{ui.matchcheck.managementEffort}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: controlColor(engine.controlIntensity) }} data-testid="jc-fuehrungsaufwand">
                          {engine.controlIntensity === "LOW" ? jc.controlLow : engine.controlIntensity === "MEDIUM" ? jc.controlMedium : jc.controlHigh}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, marginTop: 16 }} data-testid="jc-detail-cards">
                      <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "rgba(255,149,0,0.04)", border: "1px solid rgba(255,149,0,0.15)" }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{jc.criticalArea}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.5 }} data-testid="jc-kritischer-bereich">{engine.criticalAreaLabel}</div>
                      </div>
                      <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "rgba(26,93,171,0.04)", border: "1px solid rgba(26,93,171,0.12)" }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{jc.recommendation}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.5 }} data-testid="jc-empfehlung">
                          {engine.overallFit === "SUITABLE" ? jc.recSuitable : engine.overallFit === "CONDITIONAL" ? jc.recConditional : jc.recUnsuitable}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "12px 18px", borderRadius: 10, background: `${fitColor(engine.overallFit)}08`, border: `1px solid ${fitColor(engine.overallFit)}15`, marginTop: 16 }}>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: "#48484A", margin: 0 }} data-testid="jc-zusammenfassung">
                        {hyphenateText(engine.overallFit === "SUITABLE" ? jc.summarySuitable : engine.overallFit === "CONDITIONAL" ? jc.summaryConditional : jc.summaryUnsuitable)}
                      </p>
                    </div>
                  </div>

                </div>
              )}
            </AccordionCard>

          </div>
        </div>
      </div>
    </div>
  );
}
