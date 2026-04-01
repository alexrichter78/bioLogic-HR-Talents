import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Users, AlertTriangle, CheckCircle, TrendingUp, Loader2, Copy, Download,
  Briefcase, Shield, Activity, BarChart3, Check, Lightbulb, Target,
  CalendarDays, Zap, FileText,
} from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRegion, useLocalizedText } from "@/lib/region";
import { hyphenateText } from "@/lib/hyphenate";
import {
  type Triad, type ComponentKey,
  computeTeamDynamics, getDefaultLevers, getMatrixCellById, getViewContent,
  labelComponent, buildAIPayload, getSystemVariant, getDepartmentCatalog, getDepartmentInfo,
  type TeamDynamikInput, type TeamDynamikResult, type ShiftType, type IntensityLevel,
  type TrafficLight, type ViewMode, type Lever, type DepartmentType, type DepartmentFit,
  type TeamSize, type StressShift, type LeadershipContext, type RollenDnaContext, type DominanceType,
  type LeadershipLever, type IntegrationPhase, type ComponentChanceRisk,
} from "@/lib/teamdynamik-engine";
import { leaderTeamMatchFull } from "@/lib/leader-team-match-engine";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };
function colorFor(k: ComponentKey) { return k === "impulsiv" ? COLORS.imp : k === "intuitiv" ? COLORS.int : COLORS.ana; }

const SHIFT_LABELS: Record<ShiftType, string> = {
  VERSTAERKUNG: "Passung", ERGAENZUNG: "Ergänzung", REIBUNG: "Anpassung nötig",
  SPANNUNG: "Starke Veränderung", TRANSFORMATION: "Starke Veränderung", HYBRID: "Anpassung nötig",
};
const INTENSITY_LABELS: Record<IntensityLevel, string> = { NIEDRIG: "Niedrig", MITTEL: "Mittel", HOCH: "Hoch" };
const TL_COLORS: Record<TrafficLight, { bg: string; fill: string; label: string; steering: string }> = {
  GREEN: { bg: "rgba(52,199,89,0.08)", fill: "#34C759", label: "Stabil", steering: "Normale Steuerung ausreichend" },
  YELLOW: { bg: "rgba(255,149,0,0.08)", fill: "#FF9500", label: "Steuerbar", steering: "Situative Steuerung empfehlenswert" },
  RED: { bg: "rgba(255,59,48,0.08)", fill: "#FF3B30", label: "Spannungsfeld", steering: "Aktive Steuerung erforderlich" },
};
const VIEW_LABELS: Record<ViewMode, { icon: typeof Users; label: string }> = {
  CEO: { icon: Briefcase, label: "CEO" },
  HR: { icon: Users, label: "HR" },
  TEAMLEITUNG: { icon: Shield, label: "Teamleitung" },
};

const CHAPTER_COLORS = ["#0071E3", "#0071E3", "#0071E3", "#0071E3", "#0071E3", "#0071E3", "#0071E3", "#0071E3", "#0071E3", "#0071E3", "#0071E3", "#0071E3", "#0071E3"];

function GlassCard({ children, style, ...props }: { children: React.ReactNode; style?: React.CSSProperties; [k: string]: any }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 32, padding: "36px 32px",
      boxShadow: "0 2px 20px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.05)",
      border: "1px solid rgba(255,255,255,0.7)", ...style,
    }} {...props}>{children}</div>
  );
}

const MAX_BIO = 67;

function BarSlider({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  const widthPct = (value / MAX_BIO) * 100;
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
            minWidth: value === 0 ? 0 : (widthPct < 18 ? 8 : 40),
          }}>
            {widthPct >= 18 && <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{Math.round(value)} %</span>}
          </div>
        </div>
        {widthPct < 18 && <span style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${Math.min(Math.max(widthPct, 5), 100)}% + 16px)`, fontSize: 11, fontWeight: 700, color: "#48484A", whiteSpace: "nowrap" }}>{Math.round(value)} %</span>}
        <input
          type="range" min={0} max={MAX_BIO} value={value}
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

function BarSliders({ triad, onChange }: { triad: Triad; onChange: (t: Triad) => void }) {
  const handleChange = (key: ComponentKey, rawVal: number) => {
    onChange({ ...triad, [key]: Math.min(rawVal, MAX_BIO) });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <BarSlider label="Impulsiv" value={triad.impulsiv} color={COLORS.imp} onChange={v => handleChange("impulsiv", v)} />
      <BarSlider label="Intuitiv" value={triad.intuitiv} color={COLORS.int} onChange={v => handleChange("intuitiv", v)} />
      <BarSlider label="Analytisch" value={triad.analytisch} color={COLORS.ana} onChange={v => handleChange("analytisch", v)} />
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
    <div style={{ flex: 1, minWidth: 100, padding: "10px 12px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: color || "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "#8E8E93", margin: "2px 0 0" }}>{sub}</p>}
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
      <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF", fontVariantNumeric: "tabular-nums" }}>{String(num).padStart(2, "0")}</span>
    </div>
  );
}

function SectionDivider() {
  return <div style={{ height: 1, margin: "0 28px", background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.05) 70%, transparent 100%)" }} />;
}

function splitIntoBlocks(text: string): string[] {
  const explicit = text.split(/\n\n+/).filter(p => p.trim());
  if (explicit.length > 1) return explicit;
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= 2) return [text];
  const blocks: string[] = [sentences[0].trim()];
  const mid: string[] = [];
  for (let i = 1; i < sentences.length; i++) {
    mid.push(sentences[i].trim());
    if (mid.length === 2 || (i === sentences.length - 1 && mid.length > 0)) { blocks.push(mid.join(" ")); mid.length = 0; }
  }
  return blocks.filter(b => b.length > 0);
}

function TextBlock({ text }: { text: string }) {
  const blocks = splitIntoBlocks(text);
  return (
    <div>
      {blocks.map((p, i) => (
        <div key={i}>
          {i > 0 && <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.06)", margin: "14px 0" }} />}
          <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, overflowWrap: "break-word", wordBreak: "normal" }} lang="de">{hyphenateText(p)}</p>
        </div>
      ))}
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
            <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check style={{ width: 11, height: 11, color: c, strokeWidth: 2.5 }} />
            </div>
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, marginTop: 7, flexShrink: 0, opacity: 0.5 }} />
          )}
          <span style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.7 }} lang="de">{hyphenateText(item)}</span>
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
      <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <IconComp style={{ width: 14, height: 14, color, strokeWidth: 2 }} />
      </div>
      <p style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.75, margin: 0, fontWeight: 450, textAlign: "justify", textAlignLast: "left", overflowWrap: "break-word", wordBreak: "normal" } as React.CSSProperties} lang="de">{hyphenateText(text)}</p>
    </div>
  );
}

type ParsedSection = { num: number; title: string; lines: string[] };

function parseReport(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(\d{1,2})\.\s+(.+)/);
    if (m) {
      if (current) sections.push(current);
      current = { num: parseInt(m[1]), title: m[2].replace(/\*+/g, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

function ReportChapter({ section, chapterIndex }: { section: ParsedSection; chapterIndex: number }) {
  const color = CHAPTER_COLORS[chapterIndex % CHAPTER_COLORS.length];
  const bullets: string[] = [];
  const paragraphs: string[] = [];
  let subSections: { heading: string; content: string[] }[] = [];
  let currentSub: { heading: string; content: string[] } | null = null;

  for (const line of section.lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const subMatch = trimmed.match(/^\*\*(.+?)\*\*\s*:?\s*(.*)/);
    if (subMatch) {
      if (currentSub) subSections.push(currentSub);
      currentSub = { heading: subMatch[1], content: subMatch[2] ? [subMatch[2]] : [] };
    } else if (currentSub) {
      currentSub.content.push(trimmed.replace(/^[-•]\s*/, ""));
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      bullets.push(trimmed.replace(/^[-•]\s*/, ""));
    } else {
      paragraphs.push(trimmed);
    }
  }
  if (currentSub) subSections.push(currentSub);

  return (
    <div style={{ padding: "28px 0" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <ChapterBadge num={section.num} color={color} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.01em" }}>{section.title}</h3>
      </div>
      <div style={{ paddingLeft: 50 }}>
        {paragraphs.length > 0 && <TextBlock text={paragraphs.join(" ")} />}
        {bullets.length > 0 && (
          <div style={{ marginTop: paragraphs.length > 0 ? 16 : 0 }}>
            <BulletList items={bullets} color={color} />
          </div>
        )}
        {subSections.map((sub, i) => (
          <div key={i} style={{ marginTop: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{sub.heading}</p>
            {sub.content.length > 0 && sub.content.some(c => c.startsWith("- ") || c.startsWith("• "))
              ? <BulletList items={sub.content.map(c => c.replace(/^[-•]\s*/, ""))} color={color} />
              : <TextBlock text={sub.content.join(" ")} />
            }
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadOnlyBars({ triad }: { triad: Triad }) {
  const bars: { label: string; value: number; color: string }[] = [
    { label: "Impulsiv", value: triad.impulsiv, color: COLORS.imp },
    { label: "Intuitiv", value: triad.intuitiv, color: COLORS.int },
    { label: "Analytisch", value: triad.analytisch, color: COLORS.ana },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {bars.map(b => {
        const widthPct = (b.value / MAX_BIO) * 100;
        return (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#6E6E73", width: 62, flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1, height: 24, borderRadius: 6, background: "rgba(0,0,0,0.04)", position: "relative" }}>
              <div style={{
                width: b.value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 5), 100)}%`,
                height: "100%", borderRadius: 6, background: b.color,
                display: "flex", alignItems: "center", paddingLeft: 8,
                minWidth: b.value === 0 ? 0 : (widthPct < 18 ? 8 : 40),
              }}>
                {widthPct >= 18 && <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{Math.round(b.value)} %</span>}
              </div>
              {widthPct < 18 && b.value >= 0 && <span style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${Math.min(Math.max(widthPct, 5), 100)}% + 16px)`, fontSize: 11, fontWeight: 700, color: "#48484A", whiteSpace: "nowrap" }}>{Math.round(b.value)} %</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Teamdynamik() {
  const { region } = useRegion();
  const t = useLocalizedText();
  const isMobile = useIsMobile();
  const [teamName, setTeamName] = useState("Projektteam");
  const [teamProfile, setTeamProfile] = useState<Triad>({ impulsiv: 30, intuitiv: 50, analytisch: 20 });
  const [personProfile, setPersonProfile] = useState<Triad>(() => {
    try {
      const saved = localStorage.getItem("jobcheckCandProfile");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.impulsiv != null && p.intuitiv != null && p.analytisch != null) return p;
      }
    } catch {}
    return { impulsiv: 33, intuitiv: 34, analytisch: 33 };
  });
  const [sollProfile, setSollProfile] = useState<Triad | null>(null);
  const [isLeading, setIsLeading] = useState(() => {
    try {
      const completed = localStorage.getItem("rollenDnaCompleted");
      if (completed === "true") {
        const raw = localStorage.getItem("rollenDnaState");
        if (raw) {
          const state = JSON.parse(raw);
          const fuehrung = state.fuehrung || "Keine";
          return fuehrung !== "Keine";
        }
      }
    } catch {}
    return true;
  });
  const [teamSize, setTeamSize] = useState<TeamSize>("MITTEL");
  const [departmentType, setDepartmentType] = useState<DepartmentType>("ALLGEMEIN");
  const [levers, setLevers] = useState<Lever[]>(getDefaultLevers());
  const [viewMode, setViewMode] = useState<ViewMode>("HR");
  const [activeTab, setActiveTab] = useState<"chancen" | "risiken" | "integration">("chancen");
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [rollenDna, setRollenDna] = useState<RollenDnaContext | null>(null);

  useEffect(() => {
    try {
      const completed = localStorage.getItem("rollenDnaCompleted");
      if (completed !== "true") return;
      const raw = localStorage.getItem("rollenDnaState");
      if (!raw) return;
      const state = JSON.parse(raw);
      const p = state.profil || state.profile;
      if (p && p.impulsiv != null && p.intuitiv != null && p.analytisch != null) {
        setSollProfile({ impulsiv: p.impulsiv, intuitiv: p.intuitiv, analytisch: p.analytisch });
      }
      if (!state.beruf) return;
      const taetigkeiten = (state.taetigkeiten || []).map((t: any) => t.name || t.label || "").filter((n: string) => n);
      const ERFOLGSFOKUS_LABELS = [
        "Ergebnis-/ Umsatzwirkung",
        "Beziehungs- und Netzwerkstabilität",
        "Innovations- & Transformationsleistung",
        "Prozess- und Effizienzqualität",
        "Fachliche Exzellenz / Expertise",
        "Strategische Wirkung / Positionierung",
      ];
      const erfolgsfokus = (state.erfolgsfokusIndices || []).map((i: number) => ERFOLGSFOKUS_LABELS[i]).filter(Boolean);
      setRollenDna({
        beruf: state.beruf,
        bereich: state.bereich || "",
        fuehrungstyp: state.fuehrung || "Keine",
        aufgabencharakter: state.aufgabencharakter || "",
        arbeitslogik: state.arbeitslogik || "",
        taetigkeiten,
        erfolgsfokus,
      });
    } catch {}
  }, []);

  const departmentCatalog = useMemo(() => getDepartmentCatalog(), []);

  const input: TeamDynamikInput = useMemo(() => ({
    teamName, teamProfile, teamSize, personProfile, isLeading, departmentType, levers, steeringOverride: null, rollenDna,
  }), [teamName, teamProfile, teamSize, personProfile, isLeading, departmentType, levers, rollenDna]);

  const result = useMemo(() => computeTeamDynamics(input), [input]);
  const tl = TL_COLORS[result.trafficLight];

  const leaderMatch = useMemo(() => {
    if (!isLeading) return null;
    return leaderTeamMatchFull({ leader: personProfile, team: teamProfile });
  }, [isLeading, personProfile, teamProfile]);

  const generateReport = useCallback(async () => {
    setReportLoading(true);
    setReportError(false);
    try {
      const payload = buildAIPayload(input, result);
      const res = await fetch("/api/generate-team-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, region }),
      });
      if (!res.ok) throw new Error("Fehler");
      const data = await res.json();
      if (!data.report || data.report.length < 50) throw new Error("Leer");
      setReportText(data.report);
      setReportOpen(true);
    } catch {
      setReportError(true);
      setReportOpen(true);
    } finally {
      setReportLoading(false);
    }
  }, [input, result, region]);

  const copyReport = async () => {
    if (!reportRef.current) return;
    await navigator.clipboard.writeText(reportRef.current.innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedSections = useMemo(() => reportText ? parseReport(reportText) : [], [reportText]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }} lang="de">
      <GlobalNav />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px 12px 80px" : "24px 16px 48px" }}>

        {/* ═══ TAB 1: ANALYSE ═══ */}
        <GlassCard style={{ marginBottom: 20 }} data-testid="tab-analyse">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#0071E3", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>bioLogic TeamCheck</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#34C759", margin: 0, letterSpacing: "-0.02em" }} data-testid="text-page-title">Teamanalyse</h1>
          </div>

          {sollProfile && (
            <div style={{ marginBottom: 20, padding: "16px 20px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }} data-testid="soll-profile-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <BarChart3 style={{ width: 16, height: 16, color: "#6E6E73" }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Gesamtprofil der Stellenanforderung</p>
              </div>
              <ReadOnlyBars triad={sollProfile} />
              <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 8, textAlign: "center" }}>Soll-Profil aus Rollen-DNA (nicht editierbar)</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 14 }} data-testid="label-person">{isLeading ? "Neue Führungskraft" : "Neues Teammitglied"}</p>
              <BarSliders triad={personProfile} onChange={setPersonProfile} />
              <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 8, textAlign: "center" }}>Istprofil aus Soll-Ist-Vergleich</p>
            </div>

            <div style={{ width: 1, background: "rgba(0,0,0,0.06)", alignSelf: "stretch" }} />

            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 14 }}>Teamauswertung</p>
              <BarSliders triad={teamProfile} onChange={setTeamProfile} />
              <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 8, textAlign: "center" }}>Profil (max. 67 % pro Komponente)</p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 18, marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>Rolle der neuen Person</p>
              <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3 }}>
                <button onClick={() => setIsLeading(true)} data-testid="toggle-leading-yes" style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: isLeading ? 700 : 500,
                  background: isLeading ? "#fff" : "transparent",
                  boxShadow: isLeading ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                  border: "none", cursor: "pointer",
                  color: isLeading ? "#0071E3" : "#8E8E93",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "all 200ms ease",
                }}>
                  <Briefcase style={{ width: 12, height: 12 }} /> Führung
                </button>
                <button onClick={() => setIsLeading(false)} data-testid="toggle-leading-no" style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: !isLeading ? 700 : 500,
                  background: !isLeading ? "#fff" : "transparent",
                  boxShadow: !isLeading ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                  border: "none", cursor: "pointer",
                  color: !isLeading ? "#0071E3" : "#8E8E93",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "all 200ms ease",
                }}>
                  <Users style={{ width: 12, height: 12 }} /> Teammitglied
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>{t("Teamgröße")}</p>
              <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3 }}>
                {(["KLEIN", "MITTEL", "GROSS"] as TeamSize[]).map(size => {
                  const labels: Record<TeamSize, string> = { KLEIN: "Klein (2–5)", MITTEL: "Mittel (6–12)", GROSS: t("Groß (13+)") };
                  const active = teamSize === size;
                  return (
                    <button key={size} onClick={() => setTeamSize(size)} data-testid={`toggle-size-${size.toLowerCase()}`} style={{
                      flex: 1, padding: "8px 8px", borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 500,
                      background: active ? "#fff" : "transparent",
                      boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                      border: "none", cursor: "pointer",
                      color: active ? "#0071E3" : "#8E8E93",
                      transition: "all 200ms ease", whiteSpace: "nowrap",
                    }}>{labels[size]}</button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 6 }}>
                {teamSize === "KLEIN" ? "Kleine Teams: Jede Person hat hohen Einfluss auf die Dynamik." : teamSize === "GROSS" ? t("Große Teams: Einzelpersonen verändern die Gesamtdynamik weniger stark.") : "Mittlere Teams: Spürbarer, aber begrenzter Einfluss pro Person."}
              </p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 18, marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>Abteilung / Funktionsbereich</p>
              <select value={departmentType} onChange={e => setDepartmentType(e.target.value as DepartmentType)} data-testid="select-department" style={{
                width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12, fontWeight: 500,
                background: "#fff", border: "1px solid rgba(0,0,0,0.08)", color: "#1D1D1F",
                cursor: "pointer", outline: "none", appearance: "auto",
              }}>
                {departmentCatalog.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              {departmentType !== "ALLGEMEIN" && (
                <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 6 }}>Fokus: {getDepartmentInfo(departmentType).focus}</p>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>Perspektive</p>
              <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3 }}>
                {(["CEO", "HR", "TEAMLEITUNG"] as ViewMode[]).map(vm => {
                  const active = viewMode === vm;
                  const VIcon = VIEW_LABELS[vm].icon;
                  return (
                    <button key={vm} onClick={() => setViewMode(vm)} data-testid={`toggle-view-${vm.toLowerCase()}`} style={{
                      flex: 1, padding: "8px 8px", borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 500,
                      background: active ? "#fff" : "transparent",
                      boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                      border: "none", cursor: "pointer",
                      color: active ? "#0071E3" : "#8E8E93",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      transition: "all 200ms ease", whiteSpace: "nowrap",
                    }}>
                      <VIcon style={{ width: 12, height: 12 }} /> {VIEW_LABELS[vm].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderRadius: 20, padding: "18px 22px",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }} data-testid="executive-header">
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
              <TrafficLightAmpel tl={result.trafficLight} />
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
                    data-testid="input-team-name"
                    style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", background: "none", border: "none", outline: "none", padding: 0, letterSpacing: "-0.02em", width: "auto", maxWidth: 220 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: tl.bg, color: tl.fill }} data-testid="badge-status">{tl.label}</span>
                  {departmentType !== "ALLGEMEIN" && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: "rgba(0,113,227,0.08)", color: "#0071E3" }} data-testid="badge-department">
                      {getDepartmentInfo(departmentType).label}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "#8E8E93", margin: "3px 0 0" }} data-testid="text-headline">{hyphenateText(result.headline)}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <KPITile label="Transformationsscore" value={result.scores.TS} sub={INTENSITY_LABELS[result.intensityLevel]} color={result.scores.TS > 50 ? "#FF3B30" : result.scores.TS > 25 ? "#FF9500" : "#34C759"} />
              <KPITile label="Verteilungslücke" value={`${result.scores.DG}`} sub={`DC: ${result.scores.DC}`} />
              <KPITile label="Konfliktindex" value={result.scores.CI} sub={`Steuerung: ${INTENSITY_LABELS[result.steeringNeed]}`} color={result.scores.CI > 50 ? "#FF3B30" : result.scores.CI > 25 ? "#FF9500" : "#34C759"} />
            </div>
            {(() => {
              const tlKey = result.trafficLight;
              const detailTeammitglied: Record<TrafficLight, { title: string; desc: string; label: string; bullets: string[]; recLabel: string; rec: string }> = {
                RED: {
                  title: "Deutliche Spannungen – klare Führung notwendig",
                  desc: "Arbeitslogiken unterscheiden sich stark. Ohne Führung entstehen Leistungs- und Konfliktrisiken.",
                  label: "Was bedeutet das konkret?",
                  bullets: [
                    "Prioritäten werden unterschiedlich interpretiert.",
                    "Tempo oder Qualität geraten unter Druck.",
                    "Widerstand, Rückzug oder Lagerbildung sind möglich.",
                  ],
                  recLabel: "Was ist zu tun?",
                  rec: t("Klare Standards, feste Entscheidungsregeln und regelmäßige Reviews sind zwingend."),
                },
                YELLOW: {
                  title: "Unterschiedliche Arbeitsweisen – aktiv steuern",
                  desc: "Unterschiede sind spürbar. Mit klaren Regeln bleibt das System stabil steuerbar.",
                  label: "Was bedeutet das konkret?",
                  bullets: [
                    "Entscheidungen dauern teilweise länger.",
                    "Prioritäten müssen häufiger erklärt werden.",
                    "Abstimmungsaufwand steigt im Alltag.",
                  ],
                  recLabel: "Was ist zu tun?",
                  rec: "Entscheidungswege, Zeitfenster und Verantwortlichkeiten müssen klar gesetzt werden.",
                },
                GREEN: {
                  title: "Stabil – passt gut zusammen",
                  desc: t("Arbeitsweisen sind kompatibel. Keine besonderen Maßnahmen notwendig."),
                  label: "Was bedeutet das konkret?",
                  bullets: [
                    "Entscheidungen werden schnell verstanden und akzeptiert.",
                    "Abstimmungen laufen reibungslos.",
                    "Tempo und Qualität bleiben stabil.",
                  ],
                  recLabel: "Was ist zu tun?",
                  rec: t("Normale Führung und regelmäßige Abstimmung reichen aus."),
                },
              };

              if (isLeading && leaderMatch) {
                const m = leaderMatch;
                const nr = m.normal.texts;
                const cr = m.controlledStress.texts;
                const ur = m.uncontrolledStress.texts;
                const sc = m.stressComparison;

                const ratingColor: Record<string, string> = {
                  "Passend": "#34C759",
                  "Bedingt passend": "#FF9500",
                  "Nicht passend": "#FF3B30",
                };

                const normalBullets = nr.componentBreakdown.split("\n");

                const SectionCard = ({ barColor, children, testId }: { barColor: string; children: React.ReactNode; testId?: string }) => (
                  <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} data-testid={testId}>
                    <div style={{ width: 4, flexShrink: 0, background: barColor }} />
                    <div style={{ flex: 1, padding: "14px 16px" }}>{children}</div>
                  </div>
                );

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }} data-testid="detail-block">
                    <SectionCard barColor={ratingColor[nr.rating] || "#8E8E93"} testId="section-normal">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Normalzustand</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${ratingColor[nr.rating] || "#8E8E93"}15`, color: ratingColor[nr.rating] || "#8E8E93" }} data-testid="badge-normal-rating">{nr.rating}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 12px", lineHeight: 1.5 }}>{nr.ratingHeadline}</p>

                      <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Komponentenanalyse</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                        {normalBullets.map((b, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ color: "#8E8E93", fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
                            <span style={{ fontSize: 12, color: "#3A3A3C", lineHeight: 1.5 }}>{b}</span>
                          </div>
                        ))}
                      </div>

                      {m.normal.evaluation.flags.leadershipRules.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Führungsregeln</p>
                          {m.normal.evaluation.flags.leadershipRules.map((rule, ri) => (
                            <div key={ri} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 10, color: rule.minRating === "Nicht passend" ? "#FF3B30" : "#FF9500", marginTop: 2, flexShrink: 0, fontWeight: 700 }}>{rule.code}</span>
                              <span style={{ fontSize: 11, color: "#3A3A3C", lineHeight: 1.5 }}>
                                <span style={{ fontWeight: 600 }}>{rule.title}:</span> {rule.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {m.normal.evaluation.flags.leaderSecondaryCompetition?.active && (
                        <p style={{ fontSize: 11, color: "#FF9500", margin: "0 0 10px", lineHeight: 1.5 }}>
                          ⚠ Sekundär-Konkurrenz: 2. und 3. Komponente der Führung sind nahezu gleich stark – unter Stress konkurrieren sie.
                        </p>
                      )}

                      <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0 }}>
                        <span style={{ fontWeight: 700 }}>Team-Fit-Score: </span>
                        {(() => {
                          const tfs = Math.round(m.normal.evaluation.indices.TFS * 100);
                          const tfsBefore = m.normal.evaluation.indices.TFS_beforeLeadershipRules !== undefined
                            ? Math.round(m.normal.evaluation.indices.TFS_beforeLeadershipRules * 100) : null;
                          if (tfsBefore !== null && tfsBefore !== tfs) {
                            return <>{tfsBefore} % <span style={{ color: "#8E8E93" }}>→</span> {tfs} % <span style={{ fontSize: 10, color: "#8E8E93" }}>(nach Führungsregeln)</span></>;
                          }
                          return <>{tfs} %</>;
                        })()}
                      </p>
                    </SectionCard>

                    <SectionCard barColor={ratingColor[cr.rating] || "#8E8E93"} testId="section-controlled">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Kontrollierter Stress</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${ratingColor[cr.rating] || "#8E8E93"}15`, color: ratingColor[cr.rating] || "#8E8E93" }} data-testid="badge-controlled-rating">{cr.rating}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", lineHeight: 1.5, fontStyle: "italic" }}>Die stärkste Komponente wird dominanter – mehr Klarheit, aber auch Tunnelblick-Risiko.</p>
                      <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{cr.ratingHeadline}</p>
                    </SectionCard>

                    <SectionCard barColor={ratingColor[ur.rating] || "#8E8E93"} testId="section-uncontrolled">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Unkontrollierter Stress</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${ratingColor[ur.rating] || "#8E8E93"}15`, color: ratingColor[ur.rating] || "#8E8E93" }} data-testid="badge-uncontrolled-rating">{ur.rating}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", lineHeight: 1.5, fontStyle: "italic" }}>
                        {m.uncontrolledStress.evaluation.flags.leaderSecondaryCompetition?.active
                          ? "Top2 und Top3 konkurrieren – Verhalten wirkt wechselhafter."
                          : "Die zweitstärkste Komponente wird sichtbarer und kann die Führungslinie verschieben."}
                      </p>
                      <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{ur.ratingHeadline}</p>
                      {m.uncontrolledStress.evaluation.flags.leadershipRules.some(r => r.code === "F6") && (
                        <p style={{ fontSize: 11, color: "#FF9500", margin: "6px 0 0", lineHeight: 1.5 }}>
                          ⚠ Sekundär-Konkurrenz unter Stress: Führungsstil wird inkonsistenter.
                        </p>
                      )}
                    </SectionCard>


                  </div>
                );
              }

              const detail = detailTeammitglied[tlKey];
              const variant = getSystemVariant(teamProfile, personProfile, result.dominanceTeam, result.dominancePerson);
              return (
                <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginTop: 12 }} data-testid="detail-block">
                  <div style={{ width: 4, flexShrink: 0, background: tl.fill }} />
                  <div style={{ flex: 1, padding: "14px 16px" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>{detail.title}</p>
                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 3px", lineHeight: 1.5 }}>{detail.desc}</p>
                    <div style={{ margin: "12px 0" }} data-testid="variant-block">
                      <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{variant.text}</p>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "14px 0 8px" }}>{detail.label}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                      {detail.bullets.map((b, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ color: "#8E8E93", fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
                          <span style={{ fontSize: 12, color: "#3A3A3C", lineHeight: 1.5 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0 }}>
                      <span style={{ fontWeight: 700 }}>{detail.recLabel} </span>
                      {detail.rec}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </GlassCard>

        {/* ═══ SPANNUNGSMATRIX ═══ */}
        {(() => {
          const vc = getViewContent(viewMode, result, result.activeMatrixCell);
          if (!vc.showMatrix && viewMode === "CEO") return null;
          const domLabels: { key: DominanceType; label: string; short: string; color: string }[] = [
            { key: "IMPULSIV", label: "Impulsiv", short: "IMP", color: COLORS.imp },
            { key: "INTUITIV", label: "Intuitiv", short: "INT", color: COLORS.int },
            { key: "ANALYTISCH", label: "Analytisch", short: "ANA", color: COLORS.ana },
          ];
          const personDom = result.dominancePerson;
          const teamDom = result.dominanceTeam;
          return (
            <GlassCard style={{ marginBottom: 20 }} data-testid="spannungsmatrix-section">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,113,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity style={{ width: 14, height: 14, color: "#0071E3" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.01em" }}>Spannungsmatrix</p>
                  <p style={{ fontSize: 11, color: "#8E8E93", margin: "2px 0 0" }}>{isLeading ? "Person (Zeile) × Team (Spalte)" : "Team (Zeile) × Person (Spalte)"}</p>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 1fr 1fr", gridTemplateRows: "32px repeat(3, 1fr)", gap: 4, minWidth: 400 }}>
                  <div />
                  {domLabels.map(d => (
                    <div key={d.key} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: d.color, padding: "4px 0" }} data-testid={`matrix-col-${d.short.toLowerCase()}`}>
                      {d.label}
                    </div>
                  ))}

                  {domLabels.map(row => (
                    <>
                      <div key={`row-${row.key}`} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, fontSize: 11, fontWeight: 700, color: row.color }}>
                        {row.label}
                      </div>
                      {domLabels.map(col => {
                        const cellId = isLeading ? `${row.short}-${col.short}` : `${row.short}-${col.short}`;
                        const cell = getMatrixCellById(cellId);
                        const isActive = result.activeMatrixCell.id === cellId;
                        const isRowMatch = (isLeading ? personDom : teamDom) === row.key;
                        const isColMatch = (isLeading ? teamDom : personDom) === col.key;
                        return (
                          <div key={cellId} data-testid={`matrix-cell-${cellId.toLowerCase()}`} style={{
                            borderRadius: 10, padding: "10px 8px",
                            background: isActive ? "rgba(0,113,227,0.08)" : (isRowMatch || isColMatch) ? "rgba(0,0,0,0.02)" : "rgba(0,0,0,0.01)",
                            border: isActive ? "2px solid rgba(0,113,227,0.3)" : "1px solid rgba(0,0,0,0.05)",
                            cursor: "default", transition: "all 200ms ease",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minHeight: 60,
                          }}>
                            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? "#0071E3" : "#3A3A3C", textAlign: "center", lineHeight: 1.3 }}>
                              {cell?.label || cellId}
                            </span>
                            <span style={{ fontSize: 9, color: "#8E8E93", textAlign: "center", lineHeight: 1.2 }}>
                              {cell?.micro || ""}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 16, display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} data-testid="matrix-detail">
                <div style={{ width: 4, flexShrink: 0, background: tl.fill }} />
                <div style={{ flex: 1, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F" }}>{result.activeMatrixCell.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(0,113,227,0.08)", color: "#0071E3" }}>{result.activeMatrixCell.id}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 10px", lineHeight: 1.6, fontWeight: 500 }}>{result.activeMatrixCell.systemlage}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>Alltagswirkung</p>
                  <p style={{ fontSize: 12, color: "#48484A", margin: "0 0 10px", lineHeight: 1.6 }}>{result.activeMatrixCell.alltag}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{t("Maßnahmen")}</p>
                  <p style={{ fontSize: 12, color: "#48484A", margin: 0, lineHeight: 1.6 }}>{result.activeMatrixCell.tun}</p>
                </div>
              </div>

              {vc.showInsights && vc.insightSections.length > 0 && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }} data-testid="insights-panel">
                  {vc.insightSections.map((s, i) => (
                    <div key={i} style={{ display: "flex", borderRadius: 12, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <div style={{ width: 3, flexShrink: 0, background: "#0071E3" }} />
                      <div style={{ flex: 1, padding: "10px 14px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{s.title}</p>
                        <p style={{ fontSize: 12, color: "#48484A", margin: 0, lineHeight: 1.5 }}>{s.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          );
        })()}

        {/* ═══ CHANCEN / RISIKEN / INTEGRATION ═══ */}
        <GlassCard style={{ marginBottom: 20 }} data-testid="actions-section">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,113,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lightbulb style={{ width: 14, height: 14, color: "#0071E3" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Chancen, Risiken & Integrationsplan</p>
              <p style={{ fontSize: 11, color: "#8E8E93", margin: "2px 0 0" }}>Abgeleitet aus der aktuellen Dynamik-Analyse</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3, marginBottom: 16 }}>
            {([
              { key: "chancen" as const, label: "Chancen", icon: TrendingUp },
              { key: "risiken" as const, label: "Risiken", icon: AlertTriangle },
              { key: "integration" as const, label: "Integrationsplan", icon: CalendarDays },
            ]).map(tab => {
              const active = activeTab === tab.key;
              const TIcon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} data-testid={`tab-${tab.key}`} style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500,
                  background: active ? "#fff" : "transparent",
                  boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                  border: "none", cursor: "pointer",
                  color: active ? "#0071E3" : "#8E8E93",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "all 200ms ease",
                }}>
                  <TIcon style={{ width: 12, height: 12 }} /> {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "chancen" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }} data-testid="chancen-list">
              {result.chances.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.1)" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, background: "rgba(52,199,89,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check style={{ width: 11, height: 11, color: "#34C759", strokeWidth: 2.5 }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.6 }}>{c}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "risiken" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }} data-testid="risiken-list">
              {result.risks.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(255,59,48,0.04)", border: "1px solid rgba(255,59,48,0.1)" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, background: "rgba(255,59,48,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AlertTriangle style={{ width: 11, height: 11, color: "#FF3B30", strokeWidth: 2.5 }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.6 }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "integration" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }} data-testid="integration-plan-list">
              {result.integrationPlan.map((phase, i) => {
                const phaseColors = ["#0071E3", "#5856D6", "#34C759", "#FF9500"];
                return (
                  <div key={i} style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} data-testid={`integration-phase-${i}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.04)", background: `${phaseColors[i % phaseColors.length]}08` }}>
                      <div style={{ width: 22, height: 22, borderRadius: 11, background: phaseColors[i % phaseColors.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{phase.phaseId}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{phase.title}</p>
                        <p style={{ fontSize: 10, color: "#8E8E93", margin: "1px 0 0", fontWeight: 600 }}>{phase.days}</p>
                      </div>
                    </div>
                    <div style={{ padding: "8px 14px" }}>
                      {phase.actions.map((a, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                          <div style={{ width: 5, height: 5, borderRadius: 3, background: phaseColors[i % phaseColors.length], marginTop: 5, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(() => {
            const vc = getViewContent(viewMode, result, result.activeMatrixCell);
            if (!vc.showLevers) return null;
            return (
              <>
                <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "18px 0" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Shield style={{ width: 14, height: 14, color: "#5856D6" }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Führungshebel</p>
                  {result.leverEffects.enabledCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(52,199,89,0.08)", color: "#34C759" }}>
                      {result.leverEffects.enabledCount} aktiv → -{result.leverEffects.reductionLevels} Stufe{result.leverEffects.reductionLevels !== 1 ? "n" : ""}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "#8E8E93", margin: "-6px 0 12px", lineHeight: 1.4 }}>Aktive Hebel reduzieren den Steuerungsbedarf (2+ = -1 Stufe, 4+ = -2 Stufen)</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }} data-testid="levers-checklist">
                  {levers.map((lever, i) => (
                    <label key={lever.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 12,
                      background: lever.enabled ? "rgba(52,199,89,0.04)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${lever.enabled ? "rgba(52,199,89,0.15)" : "rgba(0,0,0,0.04)"}`,
                      cursor: "pointer", transition: "all 200ms ease",
                    }} data-testid={`lever-check-${lever.id}`}>
                      <input type="checkbox" checked={lever.enabled} onChange={() => {
                        setLevers(prev => prev.map((l, li) => li === i ? { ...l, enabled: !l.enabled } : l));
                      }} style={{ marginTop: 2, accentColor: "#34C759" }} />
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#1D1D1F", margin: "0 0 2px" }}>{lever.label}</p>
                        <p style={{ fontSize: 11, color: "#6E6E73", margin: 0, lineHeight: 1.4 }}>{lever.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            );
          })()}
        </GlassCard>

        {/* ═══ FÜHRUNGSKONTEXT ═══ */}
        {result.leadershipContext && (
          <GlassCard style={{ marginBottom: 20 }} data-testid="leadership-context-section">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,113,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target style={{ width: 14, height: 14, color: "#0071E3" }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.01em" }}>Führungskontext</p>
                <p style={{ fontSize: 11, color: "#8E8E93", margin: "2px 0 0" }}>Kann diese Person das Team wirksam führen?</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {(() => {
                const personDomColor = result.dominancePerson === "IMPULSIV" ? COLORS.imp : result.dominancePerson === "INTUITIV" ? COLORS.int : result.dominancePerson === "ANALYTISCH" ? COLORS.ana : "#8E8E93";
                const teamDomColor = result.dominanceTeam === "IMPULSIV" ? COLORS.imp : result.dominanceTeam === "INTUITIV" ? COLORS.int : result.dominanceTeam === "ANALYTISCH" ? COLORS.ana : "#8E8E93";
                return (<>
                  <div style={{ flex: 1, minWidth: 200, display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ width: 4, flexShrink: 0, background: personDomColor }} />
                    <div style={{ flex: 1, padding: "12px 14px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Führungskraft</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>{result.leadershipContext.personLabel}</p>
                      <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{result.leadershipContext.personStrengths}</p>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ width: 4, flexShrink: 0, background: teamDomColor }} />
                    <div style={{ flex: 1, padding: "12px 14px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Team</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>{result.leadershipContext.teamLabel}</p>
                      <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{result.leadershipContext.teamCharacter}</p>
                    </div>
                  </div>
                </>);
              })()}
            </div>

            <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 12 }}>
              <div style={{ width: 4, flexShrink: 0, background: tl.fill }} />
              <div style={{ flex: 1, padding: "14px 16px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Passung</p>
                <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.6 }}>{result.leadershipContext.fitSummary}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 4, flexShrink: 0, background: "#FF9500" }} />
                <div style={{ flex: 1, padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Kernrisiko</p>
                  <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{result.leadershipContext.coreChallenge}</p>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200, display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 4, flexShrink: 0, background: "#34C759" }} />
                <div style={{ flex: 1, padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Kernchance</p>
                  <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{result.leadershipContext.coreChance}</p>
                </div>
              </div>
            </div>

            {result.leadershipContext.roleContext && (
              <>
                <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "16px 0" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Briefcase style={{ width: 14, height: 14, color: "#0071E3" }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Rollenkontext: {result.leadershipContext.roleContext.beruf}</p>
                  {result.leadershipContext.roleContext.bereich && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(0,113,227,0.08)", color: "#0071E3" }}>{result.leadershipContext.roleContext.bereich}</span>
                  )}
                </div>

                <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 10 }} data-testid="role-fit-card">
                  <div style={{ width: 4, flexShrink: 0, background: "#0071E3" }} />
                  <div style={{ flex: 1, padding: "12px 14px" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Rollenpassung</p>
                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.6 }}>{result.leadershipContext.roleContext.roleFitStatement}</p>
                  </div>
                </div>

                <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 10 }} data-testid="role-risk-card">
                  <div style={{ width: 4, flexShrink: 0, background: "#FF9500" }} />
                  <div style={{ flex: 1, padding: "12px 14px" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Rollenspezifisches Risiko</p>
                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{result.leadershipContext.roleContext.roleRisk}</p>
                  </div>
                </div>

                {result.leadershipContext.roleContext.keyTasks.length > 0 && (
                  <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 10 }} data-testid="role-tasks-card">
                    <div style={{ width: 4, flexShrink: 0, background: "#8E8E93" }} />
                    <div style={{ flex: 1, padding: "12px 14px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Kerntätigkeiten der Rolle</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {result.leadershipContext.roleContext.keyTasks.map((t, i) => (
                          <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "rgba(0,0,0,0.04)", color: "#3A3A3C", whiteSpace: "nowrap" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {result.leadershipContext.roleContext.erfolgsfokusContext && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 10px" }}>
                      <Target style={{ width: 14, height: 14, color: "#FF9500" }} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Erfolgsfokus</p>
                      <div style={{ display: "flex", gap: 4 }}>
                        {result.leadershipContext.roleContext.erfolgsfokusContext.labels.map((l, i) => (
                          <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(255,149,0,0.1)", color: "#FF9500" }}>{l}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 10 }} data-testid="erfolgsfokus-fit-card">
                      <div style={{ width: 4, flexShrink: 0, background: "#FF9500" }} />
                      <div style={{ flex: 1, padding: "12px 14px" }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Führungskraft & Erfolgsfokus</p>
                        <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.6 }}>{result.leadershipContext.roleContext.erfolgsfokusContext.fitStatement}</p>
                      </div>
                    </div>

                    <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 10 }} data-testid="erfolgsfokus-team-card">
                      <div style={{ width: 4, flexShrink: 0, background: "#5856D6" }} />
                      <div style={{ flex: 1, padding: "12px 14px" }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Team & Erfolgsfokus</p>
                        <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.6 }}>{result.leadershipContext.roleContext.erfolgsfokusContext.teamAlignment}</p>
                      </div>
                    </div>

                    <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: 10 }} data-testid="erfolgsfokus-steering-card">
                      <div style={{ width: 4, flexShrink: 0, background: "#0071E3" }} />
                      <div style={{ flex: 1, padding: "12px 14px" }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Steuerungshinweis</p>
                        <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.6 }}>{result.leadershipContext.roleContext.erfolgsfokusContext.steeringHint}</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginTop: result.leadershipContext.roleContext ? 2 : 0 }}>
              <div style={{ width: 4, flexShrink: 0, background: "#0071E3" }} />
              <div style={{ flex: 1, padding: "14px 16px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Handlungsfokus</p>
                <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.6 }}>{result.leadershipContext.actionFocus}</p>
              </div>
            </div>

            {/* ── Chancen & Risiken der Komponentenstruktur ── */}
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "18px 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <BarChart3 style={{ width: 14, height: 14, color: "#5856D6" }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Komponentenstruktur: Chancen & Risiken</p>
            </div>
            <p style={{ fontSize: 11, color: "#8E8E93", margin: "-8px 0 12px", lineHeight: 1.4 }}>Vergleich der drei Profilkomponenten zwischen Führungskraft und Team</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }} data-testid="component-chances-risks">
              {result.leadershipContext.componentChancesRisks.map((cr, i) => {
                const compKey = cr.component.includes("Impulsiv") ? "impulsiv" : cr.component.includes("Intuitiv") ? "intuitiv" : "analytisch";
                const barColor = colorFor(compKey as ComponentKey);
                const absDelta = Math.abs(cr.delta);
                return (
                  <div key={i} style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} data-testid={`component-cr-${compKey}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: barColor, flexShrink: 0 }} />
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: 0, flex: 1 }}>{cr.component}</p>
                      <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                        <span style={{ color: "#8E8E93" }}>FK: <strong style={{ color: "#1D1D1F" }}>{cr.personValue}</strong></span>
                        <span style={{ color: "#8E8E93" }}>Team: <strong style={{ color: "#1D1D1F" }}>{cr.teamValue}</strong></span>
                        <span style={{ fontWeight: 700, color: absDelta >= 15 ? "#FF3B30" : absDelta >= 10 ? "#FF9500" : "#34C759" }}>Δ{absDelta}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex" }}>
                      <div style={{ flex: 1, padding: "10px 14px", borderRight: "1px solid rgba(0,0,0,0.04)" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#34C759", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chance</p>
                        <p style={{ fontSize: 11, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{cr.chance}</p>
                      </div>
                      <div style={{ flex: 1, padding: "10px 14px" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#FF3B30", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Risiko</p>
                        <p style={{ fontSize: 11, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{cr.risk}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Führungshebel ── */}
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "18px 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Zap style={{ width: 14, height: 14, color: "#FF9500" }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Führungshebel</p>
            </div>
            <p style={{ fontSize: 11, color: "#8E8E93", margin: "-8px 0 12px", lineHeight: 1.4 }}>{t("Konkrete Steuerungsmaßnahmen für diese Führungskraft-Team-Kombination")}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }} data-testid="leadership-levers-section">
              {result.leadershipContext.leadershipLevers.map((lever, i) => {
                const prioColor = lever.priority === "hoch" ? "#FF3B30" : lever.priority === "mittel" ? "#FF9500" : "#34C759";
                return (
                  <div key={i} style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} data-testid={`lever-${i}`}>
                    <div style={{ width: 4, flexShrink: 0, background: prioColor }} />
                    <div style={{ flex: 1, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{lever.title}</p>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${prioColor}15`, color: prioColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>{lever.priority}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{lever.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── 30-Tage-Integrationsplan ── */}
            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "18px 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <CalendarDays style={{ width: 14, height: 14, color: "#0071E3" }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>30-Tage-Integrationsplan</p>
            </div>
            <p style={{ fontSize: 11, color: "#8E8E93", margin: "-8px 0 12px", lineHeight: 1.4 }}>Strukturierte Einarbeitung der Führungskraft in das bestehende Team</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }} data-testid="integration-plan-30">
              {result.leadershipContext.integrationPlan30.map((phase, i) => {
                const phaseColors = ["#0071E3", "#5856D6", "#34C759"];
                return (
                  <div key={i} style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} data-testid={`phase-${phase.phaseId}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,0.04)", background: `${phaseColors[i]}08` }}>
                      <div style={{ width: 24, height: 24, borderRadius: 12, background: phaseColors[i], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{phase.phaseId}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{phase.title}</p>
                        <p style={{ fontSize: 10, color: "#8E8E93", margin: "2px 0 0", fontWeight: 600 }}>{phase.days}</p>
                      </div>
                    </div>
                    <div style={{ padding: "10px 14px" }}>
                      <p style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 8px", lineHeight: 1.5, fontStyle: "italic" }}>{phase.focus}</p>
                      {phase.actions.map((action, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 5, height: 5, borderRadius: 3, background: phaseColors[i], marginTop: 5, flexShrink: 0 }} />
                          <p style={{ fontSize: 11, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* ═══ STRESS-SIMULATION (hidden) ═══ */}

        {/* ═══ DEPARTMENT FIT ═══ */}
        {result.departmentFit && (
          <GlassCard style={{ marginBottom: 20 }} data-testid="department-fit-section">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,113,227,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L12.5 4V10L7 13L1.5 10V4L7 1Z" stroke="#0071E3" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 5V9M5 7H9" stroke="#0071E3" strokeWidth="1.3" strokeLinecap="round"/></svg>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.01em" }}>Abteilungs-Fit: {result.departmentFit.department.label}</p>
                <p style={{ fontSize: 11, color: "#8E8E93", margin: "2px 0 0" }}>{result.departmentFit.department.focus}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Team-Fit", score: result.departmentFit.teamFitScore },
                { label: isLeading ? "Führungskraft-Fit" : "Person-Fit", score: result.departmentFit.personFitScore },
              ].map((item, idx) => (
                <div key={idx} style={{ background: "rgba(0,0,0,0.02)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(0,0,0,0.04)" }} data-testid={`dept-fit-${idx === 0 ? "team" : "person"}`}>
                  <p style={{ fontSize: 11, color: "#8E8E93", margin: "0 0 6px", fontWeight: 600 }}>{item.label}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: item.score >= 55 ? "#34C759" : item.score >= 35 ? "#FF9500" : "#FF3B30", letterSpacing: "-0.02em" }}>{item.score}</span>
                    <span style={{ fontSize: 11, color: "#8E8E93" }}>/ 100</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.06)", marginTop: 8 }}>
                    <div style={{ height: 4, borderRadius: 2, width: `${item.score}%`, background: item.score >= 55 ? "#34C759" : item.score >= 35 ? "#FF9500" : "#FF3B30", transition: "width 300ms ease" }} />
                  </div>
                </div>
              ))}
            </div>

            {result.departmentFit.warnings.length > 0 && (
              <div style={{ background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }} data-testid="dept-warnings">
                <p style={{ fontSize: 12, fontWeight: 700, color: "#CC7700", margin: "0 0 8px" }}>⚠ Hinweise</p>
                {result.departmentFit.warnings.map((w, i) => (
                  <p key={i} style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 4px", lineHeight: 1.5 }}>• {w}</p>
                ))}
              </div>
            )}

            {result.departmentFit.contextNote && (
              <div style={{ background: "rgba(0,113,227,0.04)", borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>{result.departmentFit.contextNote}</p>
              </div>
            )}
          </GlassCard>
        )}

        {/* ═══ BUTTON: KI-REPORT GENERIEREN ═══ */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <button onClick={generateReport} disabled={reportLoading} data-testid="button-generate-report" style={{
            display: "flex", alignItems: "center", gap: 8, padding: "14px 36px", borderRadius: 16,
            background: reportLoading ? "linear-gradient(135deg, #8E8E93, #A1A1A6)" : "linear-gradient(135deg, #0071E3, #0077ED)",
            border: "none",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: reportLoading ? "default" : "pointer",
            opacity: reportLoading ? 0.6 : 1,
            boxShadow: reportLoading ? "none" : "0 4px 16px rgba(0,113,227,0.25)",
            transition: "all 200ms ease", letterSpacing: "-0.01em",
          }}>
            {reportLoading ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : <FileText style={{ width: 18, height: 18 }} />}
            {reportLoading ? "Report wird erstellt..." : "KI-Report generieren"}
          </button>
        </div>

        {/* ═══ TAB 2: KI-REPORT ═══ */}
        {(reportOpen || reportLoading) && (
          <GlassCard style={{ marginBottom: 20 }} data-testid="tab-report">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#0071E3", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>bioLogic TeamCheck</p>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }}>Team-Systemreport</h2>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={copyReport} data-testid="button-copy-report" style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10,
                  background: copied ? "rgba(52,199,89,0.08)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${copied ? "rgba(52,199,89,0.2)" : "rgba(0,0,0,0.06)"}`,
                  color: copied ? "#34C759" : "#48484A", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}>
                  <Copy style={{ width: 13, height: 13 }} /> {copied ? "Kopiert" : "Kopieren"}
                </button>
                <button onClick={() => window.print()} data-testid="button-export-pdf" style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 10,
                  background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)",
                  color: "#48484A", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}>
                  <Download style={{ width: 13, height: 13 }} /> PDF
                </button>
              </div>
            </div>

            <SectionDivider />

            {reportLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "60px 0" }}>
                <Loader2 style={{ width: 28, height: 28, color: "#0071E3", animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: 13, color: "#8E8E93" }}>Report wird erstellt...</p>
              </div>
            ) : reportError ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontSize: 14, color: "#FF3B30", marginBottom: 12 }}>Report konnte nicht erstellt werden.</p>
                <button onClick={generateReport} style={{
                  padding: "8px 20px", borderRadius: 10, background: "#0071E3", color: "#fff",
                  border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                }} data-testid="button-retry">Erneut versuchen</button>
              </div>
            ) : reportText && parsedSections.length > 0 ? (
              <div ref={reportRef}>
                {parsedSections.map((section, i) => (
                  <div key={i}>
                    <ReportChapter section={section} chapterIndex={i} />
                    {i < parsedSections.length - 1 && <SectionDivider />}
                  </div>
                ))}
              </div>
            ) : reportText ? (
              <div ref={reportRef} style={{ padding: "20px 0", fontSize: 14, color: "#48484A", lineHeight: 1.85, whiteSpace: "pre-wrap" }} lang="de">
                {reportText}
              </div>
            ) : null}
          </GlassCard>
        )}

      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 6px; height: 24px; border-radius: 3px; background: rgba(255,255,255,0.85); border: none; box-shadow: 0 0 4px rgba(0,0,0,0.2); cursor: ew-resize; }
        input[type="range"]::-moz-range-thumb { width: 6px; height: 24px; border-radius: 3px; background: rgba(255,255,255,0.85); border: none; box-shadow: 0 0 4px rgba(0,0,0,0.2); cursor: ew-resize; }
        input[type="range"]::-webkit-slider-runnable-track { height: 24px; cursor: ew-resize; }
        input[type="range"]::-moz-range-track { height: 24px; cursor: ew-resize; background: transparent; }
        @media print {
          nav, [data-testid="tab-analyse"], [data-testid="button-generate-report"] { display: none !important; }
          main { padding: 0 !important; max-width: 100% !important; }
          [data-testid="tab-report"] { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
