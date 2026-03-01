import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Users, AlertTriangle, CheckCircle, TrendingUp, Loader2, Copy, Download,
  Briefcase, Shield, Activity, BarChart3, Check, Lightbulb, Target,
  CalendarDays, Zap, FileText,
} from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { hyphenateText } from "@/lib/hyphenate";
import {
  type Triad, type ComponentKey,
  computeTeamDynamics, getDefaultLevers, getMatrixCellById, getViewContent,
  labelComponent, buildAIPayload, getSystemVariant,
  type TeamDynamikInput, type TeamDynamikResult, type ShiftType, type IntensityLevel,
  type TrafficLight, type ViewMode, type Lever,
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
            minWidth: value === 0 ? 0 : 40,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{Math.round(value)} %</span>
          </div>
        </div>
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

export default function Teamdynamik() {
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
  const [isLeading, setIsLeading] = useState(true);
  const [levers] = useState<Lever[]>(getDefaultLevers());
  const [viewMode, setViewMode] = useState<ViewMode>("HR");
  const [reportText, setReportText] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const input: TeamDynamikInput = useMemo(() => ({
    teamName, teamProfile, membersCount: 8, personProfile, isLeading, levers, steeringOverride: null,
  }), [teamName, teamProfile, personProfile, isLeading, levers]);

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
        body: JSON.stringify(payload),
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
  }, [input, result]);

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

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* ═══ TAB 1: ANALYSE ═══ */}
        <GlassCard style={{ marginBottom: 20 }} data-testid="tab-analyse">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#0071E3", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>bioLogic TeamCheck</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }} data-testid="text-page-title">Teamanalyse</h1>
          </div>

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

          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 18, marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>Rolle der neuen Person</p>
            <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3, maxWidth: 340 }}>
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
                </div>
                <p style={{ fontSize: 11, color: "#8E8E93", margin: "3px 0 0" }} data-testid="text-headline">{hyphenateText(result.headline)}</p>
              </div>
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
                  rec: "Klare Standards, feste Entscheidungsregeln und regelmäßige Reviews sind zwingend.",
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
                  desc: "Arbeitsweisen sind kompatibel. Keine besonderen Maßnahmen notwendig.",
                  label: "Was bedeutet das konkret?",
                  bullets: [
                    "Entscheidungen werden schnell verstanden und akzeptiert.",
                    "Abstimmungen laufen reibungslos.",
                    "Tempo und Qualität bleiben stabil.",
                  ],
                  recLabel: "Was ist zu tun?",
                  rec: "Normale Führung und regelmäßige Abstimmung reichen aus.",
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

                return (
                  <div style={{ padding: "14px 16px", borderRadius: 14, background: tl.bg, border: `1px solid ${tl.fill}20`, marginTop: 12 }} data-testid="detail-block">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: tl.fill, margin: 0 }}>Normalzustand</p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${ratingColor[nr.rating] || tl.fill}15`, color: ratingColor[nr.rating] || tl.fill }} data-testid="badge-normal-rating">{nr.rating}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 3px", lineHeight: 1.5 }}>{nr.ratingHeadline}</p>

                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "14px 0 8px" }}>Komponentenanalyse</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                      {normalBullets.map((b, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ color: tl.fill, fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
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

                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 10px" }}>
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

                    <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "14px 0" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Kontrollierter Stress</p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${ratingColor[cr.rating] || "#8E8E93"}15`, color: ratingColor[cr.rating] || "#8E8E93" }} data-testid="badge-controlled-rating">{cr.rating}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", lineHeight: 1.5, fontStyle: "italic" }}>Die stärkste Komponente wird dominanter – mehr Klarheit, aber auch Tunnelblick-Risiko.</p>
                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 3px", lineHeight: 1.5 }}>{cr.ratingHeadline}</p>

                    <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "14px 0" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Unkontrollierter Stress</p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${ratingColor[ur.rating] || "#8E8E93"}15`, color: ratingColor[ur.rating] || "#8E8E93" }} data-testid="badge-uncontrolled-rating">{ur.rating}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#6E6E73", margin: "0 0 4px", lineHeight: 1.5, fontStyle: "italic" }}>
                      {m.uncontrolledStress.evaluation.flags.leaderSecondaryCompetition?.active
                        ? "Top2 und Top3 konkurrieren – Verhalten wirkt wechselhafter."
                        : "Die zweitstärkste Komponente wird sichtbarer und kann die Führungslinie verschieben."}
                    </p>
                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 3px", lineHeight: 1.5 }}>{ur.ratingHeadline}</p>
                    {m.uncontrolledStress.evaluation.flags.leadershipRules.some(r => r.code === "F6") && (
                      <p style={{ fontSize: 11, color: "#FF9500", margin: "6px 0 0", lineHeight: 1.5 }}>
                        ⚠ Sekundär-Konkurrenz unter Stress: Führungsstil wird inkonsistenter.
                      </p>
                    )}

                    <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "14px 0" }} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>Stressvergleich</p>
                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{sc.summary}</p>
                  </div>
                );
              }

              const detail = detailTeammitglied[tlKey];
              const variant = getSystemVariant(teamProfile, personProfile, result.dominanceTeam, result.dominancePerson);
              return (
                <div style={{ padding: "14px 16px", borderRadius: 14, background: tl.bg, border: `1px solid ${tl.fill}20`, marginTop: 12 }} data-testid="detail-block">
                  <p style={{ fontSize: 14, fontWeight: 700, color: tl.fill, margin: "0 0 6px" }}>{detail.title}</p>
                  <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 3px", lineHeight: 1.5 }}>{detail.desc}</p>
                  <div style={{ margin: "12px 0" }} data-testid="variant-block">
                    <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.5 }}>{variant.text}</p>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", margin: "14px 0 8px" }}>{detail.label}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                    {detail.bullets.map((b, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ color: tl.fill, fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
                        <span style={{ fontSize: 12, color: "#3A3A3C", lineHeight: 1.5 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0 }}>
                    <span style={{ fontWeight: 700 }}>{detail.recLabel} </span>
                    {detail.rec}
                  </p>
                </div>
              );
            })()}
          </div>
        </GlassCard>

        {/* ═══ BUTTON: KI-REPORT GENERIEREN ═══ */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <button disabled data-testid="button-generate-report" style={{
            display: "flex", alignItems: "center", gap: 8, padding: "14px 36px", borderRadius: 16,
            background: "linear-gradient(135deg, #8E8E93, #A1A1A6)", border: "none",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: "default",
            opacity: 0.5,
            boxShadow: "none",
            transition: "all 200ms ease", letterSpacing: "-0.01em",
          }}>
            <FileText style={{ width: 18, height: 18 }} />
            KI-Report generieren
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
