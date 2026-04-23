import { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle, AlertTriangle, Shield, TrendingUp, Clock, Target,
  BarChart3, FileDown, FileText, Briefcase,
  ArrowLeft, Lightbulb, Activity, Users, Flame,
  CalendarDays, Award, Rocket, Handshake,
} from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { useLocalizedText, useRegion, localizeDeep } from "@/lib/region";
import { useIsMobile } from "@/hooks/use-mobile";
import { hyphenateText } from "@/lib/hyphenate";
import {
  computeTeamCheckV4,
  type TeamCheckV4Result, type TeamCheckV4Input, type V4Block, type TeamGoal,
} from "@/lib/teamcheck-v4-engine";
import {
  computeTeamDynamics, getDefaultLevers,
  type TrafficLight, type TeamDynamikInput, type TeamSize,
} from "@/lib/teamdynamik-engine";
import type { Triad, ComponentKey } from "@/lib/bio-types";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };
const MAX_BIO = 67;

const TL_COLORS: Record<TrafficLight, { bg: string; fill: string; label: string }> = {
  GREEN: { bg: "rgba(52,199,89,0.08)", fill: "#34C759", label: "Stabil" },
  YELLOW: { bg: "rgba(255,149,0,0.08)", fill: "#FF9500", label: "Steuerbar" },
  RED: { bg: "rgba(255,59,48,0.08)", fill: "#FF3B30", label: "Spannungsfeld" },
};

const BEW_COLOR: Record<string, string> = {
  "Sehr passend": "#34C759",
  "Gut passend": "#34C759",
  "Kulturell passend, fachlich begrenzt": "#FF9500",
  "Fachlich wertvoll, integrativ anspruchsvoller": "#FF9500",
  "Bedingt passend": "#FF9500",
  "Integrierbar, aber ohne klaren Aufgabenhebel": "#FF9500",
  "Inhaltlich interessant, kulturell riskant": "#FF3B30",
  "Spannungsreich bei begrenztem Zusatznutzen": "#FF3B30",
  "Spannungsreich mit Alltagsbrücke": "#FF9500",
  "Kritisch": "#FF3B30",
  "Très adapté": "#34C759",
  "Bien adapté": "#34C759",
  "Adapté culturellement, portée fonctionnelle limitée": "#FF9500",
  "Fonctionnellement précieux, intégration exigeante": "#FF9500",
  "Partiellement adapté": "#FF9500",
  "Intégrable, sans levier fonctionnel clair": "#FF9500",
  "Intéressant fonctionnellement, risqué culturellement": "#FF3B30",
  "Friction élevée, valeur ajoutée limitée": "#FF3B30",
  "Friction notable avec passerelle quotidienne": "#FF9500",
  "Critique": "#FF3B30",
  "Molto adatto": "#34C759",
  "Ben adatto": "#34C759",
  "Compatibile culturalmente, portata funzionale limitata": "#FF9500",
  "Funzionalmente prezioso, integrazione più impegnativa": "#FF9500",
  "Parzialmente adatto": "#FF9500",
  "Integrabile, senza leva funzionale chiara": "#FF9500",
  "Interessante funzionalmente, culturalmente rischioso": "#FF3B30",
  "Alta tensione, valore aggiunto limitato": "#FF3B30",
  "Alta tensione con ponte quotidiano": "#FF9500",
  "Critico": "#FF3B30",
};
const bewCol = (b: string) => BEW_COLOR[b] || "#FF9500";
const axisColor = (v: string) => v === "hoch" ? "#34C759" : v === "mittel" ? "#FF9500" : v === "gering" ? "#FF3B30" : "#8E8E93";
const axisLabel = (v: string, r?: string) => {
  if (r === "EN") return v === "hoch" ? "High" : v === "mittel" ? "Medium" : v === "gering" ? "Low" : "–";
  if (r === "FR") return v === "hoch" ? "Élevé" : v === "mittel" ? "Moyen" : v === "gering" ? "Faible" : "–";
  if (r === "IT") return v === "hoch" ? "Alto" : v === "mittel" ? "Medio" : v === "gering" ? "Basso" : "–";
  return v === "hoch" ? "Hoch" : v === "mittel" ? "Mittel" : v === "gering" ? "Gering" : "–";
};

function getDominanceLabel(t: Triad, r?: string): string {
  const sorted = [
    { k: r === "EN" ? "Impulsive" : r === "FR" ? "Rythme et Décision" : r === "IT" ? "Ritmo e Decisione" : "Impulsiv", v: t.impulsiv },
    { k: r === "EN" ? "Intuitive" : r === "FR" ? "Communication et Relations" : r === "IT" ? "Comunicazione e Relazioni" : "Intuitiv", v: t.intuitiv },
    { k: r === "EN" ? "Analytical" : r === "FR" ? "Structure et Rigueur" : r === "IT" ? "Struttura e Rigore" : "Analytisch", v: t.analytisch },
  ].sort((a, b) => b.v - a.v);
  if (sorted[0].v - sorted[1].v <= 5) return r === "EN" ? "Balanced" : r === "FR" ? "Équilibré" : r === "IT" ? "Equilibrato" : "Ausgeglichen";
  return sorted[0].k;
}

function TrafficLightAmpel({ tl }: { tl: TrafficLight }) {
  const order: TrafficLight[] = ["RED", "YELLOW", "GREEN"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }} data-testid="traffic-light">
      {order.map(c => (
        <div key={c} style={{
          width: 16, height: 16, borderRadius: "50%",
          background: c === tl ? TL_COLORS[c].fill : `${TL_COLORS[c].fill}15`,
          boxShadow: c === tl ? `0 0 12px ${TL_COLORS[c].fill}40` : "none",
          transition: "all 400ms ease",
        }} />
      ))}
    </div>
  );
}

function GlassCard({ children, style, ...props }: { children: React.ReactNode; style?: React.CSSProperties; [k: string]: any }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 20, padding: "28px 32px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
      border: "1px solid rgba(0,0,0,0.04)", ...style,
    }} {...props}>{children}</div>
  );
}

function SectionHeader({ num, title, icon: Icon }: { num: number; title: string; icon: typeof CheckCircle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12,
        background: "linear-gradient(135deg, #0071E3, #0071E3CC)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,113,227,0.2)",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#FFF" }}>{String(num).padStart(2, "0")}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon style={{ width: 18, height: 18, color: "#0071E3", strokeWidth: 2 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
    </div>
  );
}

function ProfileCard({ title, num, triad, color, onChange, testIdPrefix }: {
  title: string; num: number; triad: Triad; color: string;
  onChange?: (t: Triad) => void; testIdPrefix?: string;
}) {
  return (
    <div style={{
      flex: 1, minWidth: 180, padding: "20px 18px", borderRadius: 20,
      background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)",
    }} data-testid={`profile-card-${num}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8,
          background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{num}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{title}</span>
      </div>
      <div style={{ background: "#F0F0F2", borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
          const val = triad[k];
          const barColor = k === "impulsiv" ? COLORS.imp : k === "intuitiv" ? COLORS.int : COLORS.ana;
          const widthPct = (val / MAX_BIO) * 100;
          const isSmall = widthPct < 18;
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#6E6E73", width: 58, flexShrink: 0 }}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </span>
              <div style={{ flex: 1, position: "relative", height: 22 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: 11, background: "rgba(0,0,0,0.06)",
                }} />
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                  borderRadius: 11, background: barColor,
                  transition: "width 150ms ease",
                  display: "flex", alignItems: "center", paddingLeft: 8,
                  minWidth: isSmall ? 8 : 40,
                }}>
                  {!isSmall && <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF", whiteSpace: "nowrap" }}>{Math.round(val)} %</span>}
                </div>
                {onChange && (
                  <input
                    type="range" min={0} max={MAX_BIO} value={val}
                    onChange={e => onChange({ ...triad, [k]: Number(e.target.value) })}
                    className="bio-slider"
                    data-testid={testIdPrefix ? `${testIdPrefix}-${k}` : undefined}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%",
                      appearance: "none", WebkitAppearance: "none",
                      background: "transparent", outline: "none", cursor: "ew-resize",
                      margin: 0, zIndex: 3,
                    }}
                  />
                )}
                {isSmall && (
                  <span style={{
                    position: "absolute", top: "50%", transform: "translateY(-50%)",
                    left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 8px)`,
                    fontSize: 10, fontWeight: 600, color: "#8E8E93", whiteSpace: "nowrap",
                    transition: "left 150ms ease",
                  }}>{Math.round(val)} %</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function BulletList({ items, color, icon }: { items: string[]; color?: string; icon?: "check" | "dot" | "warning" }) {
  const c = color || "#6E6E73";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          {icon === "check" ? (
            <CheckCircle style={{ width: 14, height: 14, color: c, flexShrink: 0, marginTop: 3, strokeWidth: 2.5 }} />
          ) : icon === "warning" ? (
            <AlertTriangle style={{ width: 14, height: 14, color: c, flexShrink: 0, marginTop: 3, strokeWidth: 2.5 }} />
          ) : (
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, marginTop: 7, flexShrink: 0, opacity: 0.6 }} />
          )}
          <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.65 }} lang="de">{hyphenateText(item)}</span>
        </div>
      ))}
    </div>
  );
}

function Paragraphs({ text, highlight }: { text: string; highlight?: boolean }) {
  const paras = text.split("\n\n").filter(Boolean);
  if (paras.length === 0) return null;
  if (highlight) {
    return (
      <>
        <div style={{
          padding: "16px 20px", borderRadius: 18,
          background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(0,113,227,0.03))",
          border: "1px solid rgba(0,113,227,0.12)",
          display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14,
        }}>
          <Lightbulb style={{ width: 16, height: 16, color: "#0071E3", strokeWidth: 2, flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.75, margin: 0, fontWeight: 450 }} lang="de">{hyphenateText(paras[0])}</p>
        </div>
        {paras.slice(1).map((p, i) => (
          <p key={i} style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.9, margin: "0 0 10px" }} lang="de">{hyphenateText(p)}</p>
        ))}
      </>
    );
  }
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.9, margin: "0 0 10px" }} lang="de">{hyphenateText(p)}</p>
      ))}
    </>
  );
}

function V4BlockList({ items, accentColor }: { items: V4Block[]; accentColor?: string }) {
  const c = accentColor || "#0071E3";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: "16px 18px", borderRadius: 16,
          background: `${c}06`, border: `1px solid ${c}12`,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>{item.title}</p>
          <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">{hyphenateText(item.text)}</p>
        </div>
      ))}
    </div>
  );
}

function safeTriad(obj: unknown, fallback: Triad): Triad {
  if (!obj || typeof obj !== "object") return fallback;
  const o = obj as Record<string, unknown>;
  const imp = Number(o.impulsiv ?? o.imp);
  const int = Number(o.intuitiv ?? o.int);
  const ana = Number(o.analytisch ?? o.ana);
  if (!Number.isFinite(imp) || !Number.isFinite(int) || !Number.isFinite(ana)) return fallback;
  return { impulsiv: Math.round(imp), intuitiv: Math.round(int), analytisch: Math.round(ana) };
}

export default function TeamCheck() {
  const isMobile = useIsMobile();
  const t = useLocalizedText();
  const { region } = useRegion();
  const [soll, setSoll] = useState<Triad>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });
  const [kandidat, setKandidat] = useState<Triad>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });
  const [team, setTeam] = useState<Triad>({ impulsiv: 30, intuitiv: 50, analytisch: 20 });
  const [beruf, setBeruf] = useState("Neue Stelle");
  const [bereich, setBereich] = useState("");
  const [fuehrungstyp, setFuehrungstyp] = useState("Keine");
  const [aufgabencharakter, setAufgabencharakter] = useState("");
  const [erfolgsfokusLabels, setErfolgsfokusLabels] = useState<string[]>([]);
  const [isLeading, setIsLeading] = useState(true);
  const [teamSize, setTeamSize] = useState<TeamSize>("MITTEL");
  const [teamGoal, setTeamGoal] = useState<TeamGoal | "">("");
  const [detailTab, setDetailTab] = useState<"bewertung" | "alltag" | "chancen" | "hebel" | "prognose" | "empfehlung">("bewertung");
  const [reportView, setReportView] = useState<"none" | "detail" | "executive">("none");
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const completed = localStorage.getItem("rollenDnaCompleted");
      if (completed === "true") {
        const raw = localStorage.getItem("rollenDnaState");
        if (raw) {
          const state = JSON.parse(raw);
          if (state.beruf) setBeruf(state.beruf);
          if (state.bereich) setBereich(state.bereich);
          const ft = state.fuehrung || "Keine";
          setFuehrungstyp(ft);
          setIsLeading(ft !== "Keine");
          if (state.aufgabencharakter) setAufgabencharakter(state.aufgabencharakter);
          const EF_LABELS = [
            "Ergebnis-/ Umsatzwirkung",
            "Beziehungs- und Netzwerkstabilität",
            "Innovations- & Transformationsleistung",
            "Prozess- und Effizienzqualität",
            "Fachliche Exzellenz / Expertise",
            "Strategische Wirkung / Positionierung",
          ];
          const ef = (state.erfolgsfokusIndices || []).map((i: number) => EF_LABELS[i]).filter(Boolean);
          if (ef.length > 0) setErfolgsfokusLabels(ef);

          const p = state.profil || state.profile;
          const parsed = safeTriad(p, soll);
          if (p) setSoll(parsed);
        }
      }
    } catch {}

    try {
      const saved = localStorage.getItem("jobcheckCandProfile");
      if (saved) {
        const parsed = safeTriad(JSON.parse(saved), kandidat);
        setKandidat(parsed);
      }
    } catch {}

    try {
      const savedTeam = localStorage.getItem("teamProfile");
      if (savedTeam) {
        const parsed = safeTriad(JSON.parse(savedTeam), team);
        setTeam(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("teamProfile", JSON.stringify({ impulsiv: team.impulsiv, intuitiv: team.intuitiv, analytisch: team.analytisch }));
  }, [team.impulsiv, team.intuitiv, team.analytisch]);

  const v4Result: TeamCheckV4Result = useMemo(() => {
    let roleLevel = isLeading ? "Führung" : "Teammitglied";
    let taskStructure = aufgabencharakter || "";
    let workStyle = "";
    let successFocus = erfolgsfokusLabels;
    try {
      const dnaRaw = localStorage.getItem("rollenDnaState");
      if (dnaRaw) {
        const dna = JSON.parse(dnaRaw);
        if (dna.fuehrung && dna.fuehrung !== "Keine") roleLevel = dna.fuehrung;
        if (dna.aufgabencharakter) taskStructure = dna.aufgabencharakter;
        if (dna.arbeitslogik) workStyle = dna.arbeitslogik;
      }
    } catch {}
    const input: TeamCheckV4Input = {
      roleTitle: beruf || "Neue Stelle",
      roleLevel,
      taskStructure,
      workStyle,
      successFocus,
      teamProfile: team,
      personProfile: kandidat,
      candidateName: "Person",
      teamGoal: teamGoal || undefined,
      roleType: isLeading ? "fuehrung" : "teammitglied",
      lang: region === "FR" ? "fr" : region === "EN" ? "en" : region === "IT" ? "it" : "de",
    };
    return localizeDeep(computeTeamCheckV4(input), region);
  }, [beruf, isLeading, aufgabencharakter, erfolgsfokusLabels, team, kandidat, teamGoal, region]);

  const tdInput: TeamDynamikInput = useMemo(() => ({
    teamName: beruf || "Team",
    teamProfile: team,
    teamSize,
    personProfile: kandidat,
    isLeading,
    departmentType: "ALLGEMEIN" as const,
    levers: getDefaultLevers(),
    steeringOverride: null,
    rollenDna: null,
  }), [team, kandidat, isLeading, beruf, teamSize]);

  const tdResult = useMemo(() => localizeDeep(computeTeamDynamics(tdInput), region), [tdInput, region]);
  const tl = TL_COLORS[tdResult.trafficLight];

  const rolleLabel = isLeading ? (region === "FR" ? "Nouveau manager" : region === "EN" ? "New leader" : region === "IT" ? "Nuovo responsabile" : "Neue Führungskraft") : (region === "FR" ? "Nouveau membre d'équipe" : region === "EN" ? "New team member" : region === "IT" ? "Nuovo membro del team" : "Neues Teammitglied");
  const sollDom = getDominanceLabel(soll, region);
  const kandDom = getDominanceLabel(kandidat, region);
  const teamDom = getDominanceLabel(team, region);
  const bc = bewCol(v4Result.gesamteinschaetzung);

  if (reportView !== "none") {
    return (
      <div className="page-gradient-bg">
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={() => setReportView("none")} data-testid="btn-back-report" style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.04)", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#1D1D1F",
          }}>
            <ArrowLeft style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
            {region === "FR" ? "Retour" : region === "EN" ? "Back" : region === "IT" ? "Indietro" : "Zurück"}
          </button>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1D1D1F", textAlign: "center" }}>
            {reportView === "detail" ? (region === "FR" ? "Rapport TeamCheck (V4)" : region === "EN" ? "TeamCheck Report (V4)" : region === "IT" ? "Report TeamCheck (V4)" : "TeamCheck-Bericht (V4)") : "Executive Summary"}
          </span>
          <button onClick={() => window.print()} data-testid="btn-print-report" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            background: "#3A3A3C", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            <FileDown style={{ width: 13, height: 13, strokeWidth: 2 }} />
            {region === "FR" ? "Exporter en PDF" : region === "EN" ? "Export as PDF" : region === "IT" ? "Esporta in PDF" : "Als PDF exportieren"}
          </button>
        </div>

        <div ref={reportRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
          {reportView === "detail" ? (
            <>
              <GlassCard style={{ padding: "36px 32px 30px", textAlign: "center", position: "relative", overflow: "hidden" }} data-testid="report-header">
                <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,170,220,0.04))", pointerEvents: "none" }} />
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "linear-gradient(135deg, rgba(0,113,227,0.1), rgba(52,170,220,0.06))",
                  borderRadius: 20, padding: "5px 14px", marginBottom: 14,
                }}>
                  <FileText style={{ width: 12, height: 12, color: "#0071E3" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.12em" }}>{region === "FR" ? "Rapport TeamCheck" : region === "EN" ? "TeamCheck Report" : region === "IT" ? "Report TeamCheck" : "TeamCheck-Bericht"}</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.15, marginBottom: 6 }}>{beruf}</h1>
                <p style={{ fontSize: 13, color: "#8E8E93", marginBottom: 16 }}>{bereich || (region === "FR" ? "Analyse systémique du recrutement" : region === "EN" ? "Systemic placement analysis" : region === "IT" ? "Analisi sistemica del posizionamento" : "Systemische Analyse zur Besetzung")}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A3C", background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10 }}>
                    {isLeading ? (region === "FR" ? "Poste de manager" : region === "EN" ? "Leadership position" : region === "IT" ? "Posizione di responsabilità" : "Führungsposition") : (region === "FR" ? "Membre d'équipe" : region === "EN" ? "Team member" : region === "IT" ? "Membro del team" : "Teammitglied")}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: bc, background: `${bc}10`, padding: "6px 14px", borderRadius: 10 }}>
                    {v4Result.gesamteinschaetzung}
                  </span>
                </div>
              </GlassCard>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: region === "FR" ? "Adéquation d'équipe" : region === "EN" ? "Team fit" : region === "IT" ? "Compatibilità" : "Passung zum Team", value: axisLabel(v4Result.passungZumTeam, region), color: axisColor(v4Result.passungZumTeam) },
                  { label: region === "FR" ? "Contribution aux tâches" : region === "EN" ? "Task contribution" : region === "IT" ? "Contributo" : "Beitrag zur Aufgabe", value: axisLabel(v4Result.beitragZurAufgabe, region), color: axisColor(v4Result.beitragZurAufgabe) },
                  { label: region === "FR" ? "Besoin d'accompagnement" : region === "EN" ? "Coaching need" : region === "IT" ? "Supporto" : "Begleitungsbedarf", value: axisLabel(v4Result.begleitungsbedarf, region), color: axisColor(v4Result.begleitungsbedarf === "gering" ? "hoch" : v4Result.begleitungsbedarf === "hoch" ? "gering" : "mittel") },
                ].map((kpi, i) => (
                  <div key={i} style={{
                    flex: 1, minWidth: 140, textAlign: "center",
                    background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)",
                    borderRadius: 22, padding: "18px 18px",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
                    border: "1px solid rgba(255,255,255,0.7)",
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{kpi.label}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: kpi.color, margin: 0 }}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {v4Result.introText && (
                <div style={{
                  padding: "16px 22px", borderRadius: 16, marginBottom: 4,
                  background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(0,113,227,0.02))",
                  border: "1px solid rgba(0,113,227,0.12)",
                }}>
                  <Paragraphs text={v4Result.introText} />
                </div>
              )}

              {/* S1: Gesamtbewertung */}
              <GlassCard data-testid="report-section-1">
                <SectionHeader num={1} title={region === "FR" ? "Évaluation globale" : region === "EN" ? "Overall assessment" : region === "IT" ? "Valutazione complessiva" : "Gesamtbewertung"} icon={Target} />
                <div style={{
                  display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap",
                }}>
                  <div style={{ flex: 1, minWidth: 180, padding: "14px 18px", borderRadius: 16, background: "rgba(52,199,89,0.05)", border: "1px solid rgba(52,199,89,0.12)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>{region === "FR" ? "Point fort principal" : region === "EN" ? "Key strength" : region === "IT" ? "Punto di forza" : "Hauptstärke"}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#34C759", margin: 0 }}>{v4Result.hauptstaerke}</p>
                  </div>
                  <div style={{ flex: 1, minWidth: 180, padding: "14px 18px", borderRadius: 16, background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.12)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>{region === "FR" ? "Écart principal" : region === "EN" ? "Key deviation" : region === "IT" ? "Deviazione principale" : "Hauptabweichung"}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#FF9500", margin: 0 }}>{v4Result.hauptabweichung}</p>
                  </div>
                </div>
                <Paragraphs text={v4Result.gesamtbewertungText} highlight />
              </GlassCard>

              {/* S2: Warum */}
              <GlassCard data-testid="report-section-2">
                <SectionHeader num={2} title={region === "FR" ? "Pourquoi cette évaluation" : region === "EN" ? "Why this assessment" : region === "IT" ? "Perché questa valutazione" : "Warum diese Bewertung"} icon={Lightbulb} />
                <Paragraphs text={v4Result.warumText} />
              </GlassCard>

              {/* S3: Wirkung im Alltag */}
              <GlassCard data-testid="report-section-3">
                <SectionHeader num={3} title={region === "FR" ? "Impact au quotidien" : region === "EN" ? "Day-to-day impact" : region === "IT" ? "Impatto nel quotidiano" : "Wirkung im Alltag"} icon={Activity} />
                <Paragraphs text={v4Result.wirkungAlltagText} />
              </GlassCard>

              {/* S4: Chancen & Risiken */}
              <GlassCard data-testid="report-section-4">
                <SectionHeader num={4} title={region === "FR" ? "Opportunités et risques" : region === "EN" ? "Opportunities & risks" : region === "IT" ? "Opportunità e rischi" : "Chancen & Risiken"} icon={TrendingUp} />
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <CheckCircle style={{ width: 15, height: 15, color: "#34C759", strokeWidth: 2.5 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{region === "FR" ? "Opportunités" : region === "EN" ? "Opportunities" : region === "IT" ? "Opportunità" : "Chancen"}</span>
                    </div>
                    <V4BlockList items={v4Result.chancen} accentColor="#34C759" />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <AlertTriangle style={{ width: 15, height: 15, color: "#FF3B30", strokeWidth: 2.5 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{region === "FR" ? "Risques" : region === "EN" ? "Risks" : region === "IT" ? "Rischi" : "Risiken"}</span>
                    </div>
                    <V4BlockList items={v4Result.risiken} accentColor="#FF3B30" />
                  </div>
                </div>
                <Paragraphs text={v4Result.chancenRisikenEinordnung} />
              </GlassCard>

              {/* S5: Unter Druck */}
              <GlassCard data-testid="report-section-5">
                <SectionHeader num={5} title={region === "FR" ? "Comportement sous pression" : region === "EN" ? "Behaviour under pressure" : region === "IT" ? "Comportamento sotto pressione" : "Verhalten unter Druck"} icon={Flame} />
                <Paragraphs text={v4Result.druckText} />
              </GlassCard>

              {/* S6: Führungshinweis (only for leaders) */}
              {v4Result.fuehrungshinweis && (
                <GlassCard data-testid="report-section-6">
                  <SectionHeader num={6} title={region === "FR" ? "Note de management" : region === "EN" ? "Leadership note" : region === "IT" ? "Nota per il responsabile" : "Führungshinweis"} icon={Shield} />
                  <V4BlockList items={v4Result.fuehrungshinweis} accentColor="#5856D6" />
                </GlassCard>
              )}

              {/* S7: Risikoprognose */}
              <GlassCard data-testid="report-section-7">
                <SectionHeader num={v4Result.fuehrungshinweis ? 7 : 6} title={region === "FR" ? "Prévision des risques" : region === "EN" ? "Risk forecast" : region === "IT" ? "Previsione dei rischi" : "Risikoprognose"} icon={CalendarDays} />
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {v4Result.risikoprognose.map((phase, i) => {
                    const phaseColors = ["#FF9500", "#0071E3", "#34C759"];
                    const pc = phaseColors[i] || "#0071E3";
                    return (
                      <div key={i} style={{
                        padding: "18px 20px", borderRadius: 18,
                        background: `${pc}06`, border: `1px solid ${pc}12`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 9, background: pc, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF" }}>{phase.label.charAt(0)}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{phase.label}</span>
                            <span style={{ fontSize: 11, color: "#8E8E93", marginLeft: 8 }}>{phase.period}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{hyphenateText(phase.text)}</p>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* S8: Integrationsplan */}
              <GlassCard data-testid="report-section-8">
                <SectionHeader num={v4Result.fuehrungshinweis ? 8 : 7} title={region === "FR" ? "Plan d'intégration" : region === "EN" ? "Integration plan" : region === "IT" ? "Piano di integrazione" : "Integrationsplan"} icon={CalendarDays} />
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {v4Result.integrationsplan.map((phase, i) => {
                    const phaseColors = ["#34C759", "#0071E3", "#5856D6"];
                    const pc = phaseColors[i] || "#0071E3";
                    return (
                      <div key={i} style={{
                        padding: "20px 22px", borderRadius: 18,
                        background: `${pc}04`, border: `1px solid ${pc}10`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 9, background: pc, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#FFF" }}>{phase.num}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{phase.title}</span>
                            <span style={{ fontSize: 11, color: "#8E8E93", marginLeft: 8 }}>{phase.period}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: pc, margin: "0 0 6px" }}>{region === "FR" ? "Objectif" : region === "EN" ? "Goal" : region === "IT" ? "Obiettivo" : "Ziel"}: {phase.ziel}</p>
                        <Paragraphs text={phase.beschreibung} />
                        {phase.praxis.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", margin: "0 0 6px", textTransform: "uppercase" }}>{region === "FR" ? "En pratique" : region === "EN" ? "Practice" : region === "IT" ? "In pratica" : "Praxis"}</p>
                            <BulletList items={phase.praxis} color={pc} icon="check" />
                          </div>
                        )}
                        {phase.signale.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", margin: "0 0 6px", textTransform: "uppercase" }}>{region === "FR" ? "Signaux positifs" : region === "EN" ? "Positive signals" : region === "IT" ? "Segnali positivi" : "Positive Signale"}</p>
                            <BulletList items={phase.signale} color="#34C759" icon="check" />
                          </div>
                        )}
                        {phase.fokus && (phase.fokus.intro || phase.fokus.bullets.length > 0) && (
                          <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: `${pc}06`, border: `1px solid ${pc}10` }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: pc, margin: "0 0 4px", textTransform: "uppercase" }}>{region === "FR" ? "Ce qui compte" : region === "EN" ? "What matters" : region === "IT" ? "Cosa conta" : "Worauf es ankommt"}</p>
                            {phase.fokus.intro && <p style={{ fontSize: 12, color: "#3A3A3C", margin: "0 0 6px", lineHeight: 1.55 }}>{hyphenateText(phase.fokus.intro)}</p>}
                            {phase.fokus.bullets.length > 0 && <BulletList items={phase.fokus.bullets} color={pc} icon="dot" />}
                          </div>
                        )}
                        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: `${pc}08`, border: `1px solid ${pc}12` }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: pc, margin: "0 0 4px", textTransform: "uppercase" }}>{region === "FR" ? "Conseil de management" : region === "EN" ? "Leadership tip" : region === "IT" ? "Consiglio per il management" : "Führungstipp"}</p>
                          <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.55 }}>{hyphenateText(phase.fuehrungstipp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {v4Result.intWarnsignale.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#FF9500", margin: "0 0 10px" }}>{region === "FR" ? "Signaux d'alerte" : region === "EN" ? "Warning signals" : region === "IT" ? "Segnali d'allarme" : "Warnsignale"}</p>
                    <BulletList items={v4Result.intWarnsignale} color="#FF9500" icon="warning" />
                  </div>
                )}
                {v4Result.intLeitfragen.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0071E3", margin: "0 0 10px" }}>{region === "FR" ? "Questions clés" : region === "EN" ? "Key questions" : region === "IT" ? "Domande guida" : "Leitfragen"}</p>
                    <BulletList items={v4Result.intLeitfragen} color="#0071E3" icon="dot" />
                  </div>
                )}
                {v4Result.intVerantwortung && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#3A3A3C", margin: "0 0 6px" }}>{region === "FR" ? "Responsabilité" : region === "EN" ? "Responsibility" : region === "IT" ? "Responsabilità" : "Verantwortung"}</p>
                    <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{hyphenateText(v4Result.intVerantwortung)}</p>
                  </div>
                )}
              </GlassCard>

              {/* S9: Empfehlungen */}
              <GlassCard data-testid="report-section-9">
                <SectionHeader num={v4Result.fuehrungshinweis ? 9 : 8} title={region === "FR" ? "Recommandations" : region === "EN" ? "Recommendations" : region === "IT" ? "Raccomandazioni" : "Empfehlungen"} icon={Target} />
                <V4BlockList items={v4Result.empfehlungen} accentColor="#0071E3" />
              </GlassCard>

              {/* S10: Team ohne Person */}
              <GlassCard data-testid="report-section-10">
                <SectionHeader num={v4Result.fuehrungshinweis ? 10 : 9} title={region === "FR" ? "Équipe sans ce recrutement" : region === "EN" ? "Team without this placement" : region === "IT" ? "Team senza questa scelta" : "Team ohne diese Besetzung"} icon={Users} />
                <Paragraphs text={v4Result.teamOhnePersonText} />
              </GlassCard>

              {/* S11: Fazit */}
              <GlassCard data-testid="report-section-11">
                <SectionHeader num={v4Result.fuehrungshinweis ? 11 : 10} title={region === "FR" ? "Conclusion finale" : region === "EN" ? "Final conclusion" : region === "IT" ? "Conclusione finale" : "Schlussfazit"} icon={Award} />
                <div style={{
                  padding: "20px 24px", borderRadius: 18,
                  background: `linear-gradient(135deg, ${bc}08, ${bc}03)`,
                  border: `1px solid ${bc}15`,
                }}>
                  <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.75, margin: 0, fontWeight: 550 }} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{hyphenateText(v4Result.schlussfazit)}</p>
                </div>
              </GlassCard>
            </>
          ) : (
            /* ═══ EXECUTIVE SUMMARY ═══ */
            <>
              <GlassCard style={{ padding: "36px 32px 30px", textAlign: "center", position: "relative", overflow: "hidden" }} data-testid="exec-header">
                <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, rgba(52,199,89,0.06), rgba(52,170,220,0.04))", pointerEvents: "none" }} />
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "linear-gradient(135deg, rgba(52,199,89,0.1), rgba(52,199,89,0.05))",
                  borderRadius: 20, padding: "5px 14px", marginBottom: 14,
                }}>
                  <Briefcase style={{ width: 12, height: 12, color: "#34C759" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#34C759", textTransform: "uppercase", letterSpacing: "0.12em" }}>Executive Summary</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.15, marginBottom: 6 }}>{beruf}</h1>
                <p style={{ fontSize: 13, color: "#8E8E93", marginBottom: 18 }}>{bereich || (region === "FR" ? "Analyse systémique du recrutement" : region === "EN" ? "Systemic placement analysis" : region === "IT" ? "Analisi sistemica del posizionamento" : "Systemische Analyse zur Besetzung")}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A3C", background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10 }}>
                    {isLeading ? (region === "FR" ? "Poste de manager" : region === "EN" ? "Leadership position" : region === "IT" ? "Posizione di responsabilità" : "Führungsposition") : (region === "FR" ? "Membre d'équipe" : region === "EN" ? "Team member" : region === "IT" ? "Membro del team" : "Teammitglied")}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: bc, background: `${bc}10`, padding: "6px 14px", borderRadius: 10 }}>
                    {v4Result.gesamteinschaetzung}
                  </span>
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 12,
                  padding: "10px 20px", borderRadius: 16,
                  background: `${tl.bg}`, border: `1px solid ${tl.fill}20`,
                }}>
                  <TrafficLightAmpel tl={tdResult.trafficLight} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: tl.fill }}>{region === "FR" ? { GREEN: "Stable", YELLOW: "Gérable", RED: "Zone de tension" }[tdResult.trafficLight] : region === "EN" ? { GREEN: "Stable", YELLOW: "Manageable", RED: "Tension field" }[tdResult.trafficLight] : region === "IT" ? { GREEN: "Stabile", YELLOW: "Gestibile", RED: "Area di tensione" }[tdResult.trafficLight] : tl.label}</span>
                </div>
              </GlassCard>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: region === "FR" ? "Adéquation d'équipe" : region === "EN" ? "Team fit" : region === "IT" ? "Compatibilità con il team" : "Passung zum Team", value: axisLabel(v4Result.passungZumTeam, region), color: axisColor(v4Result.passungZumTeam), icon: Users },
                  { label: region === "FR" ? "Contribution aux tâches" : region === "EN" ? "Task contribution" : region === "IT" ? "Contributo al ruolo" : "Beitrag zur Aufgabe", value: axisLabel(v4Result.beitragZurAufgabe, region), color: axisColor(v4Result.beitragZurAufgabe), icon: Target },
                  { label: region === "FR" ? "Besoin d'accompagnement" : region === "EN" ? "Coaching need" : region === "IT" ? "Necessità di supporto" : "Begleitungsbedarf", value: axisLabel(v4Result.begleitungsbedarf, region), color: axisColor(v4Result.begleitungsbedarf === "gering" ? "hoch" : v4Result.begleitungsbedarf === "hoch" ? "gering" : "mittel"), icon: Shield },
                ].map((kpi, i) => (
                  <div key={i} style={{
                    flex: 1, minWidth: 140,
                    background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)",
                    borderRadius: 22, padding: "18px 18px",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
                    border: "1px solid rgba(255,255,255,0.7)",
                    textAlign: "center",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, margin: "0 auto 8px",
                      background: `${kpi.color}12`, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <kpi.icon style={{ width: 15, height: 15, color: kpi.color, strokeWidth: 2.2 }} />
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{kpi.label}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: kpi.color, margin: 0 }}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              <GlassCard data-testid="exec-bewertung">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #0071E3, #0071E3CC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Target style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{region === "FR" ? "Évaluation globale" : region === "EN" ? "Overall assessment" : region === "IT" ? "Valutazione complessiva" : "Gesamtbewertung"}</h3>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160, padding: "12px 16px", borderRadius: 14, background: "rgba(52,199,89,0.05)", border: "1px solid rgba(52,199,89,0.12)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 3px" }}>{region === "FR" ? "Point fort principal" : region === "EN" ? "Key strength" : region === "IT" ? "Punto di forza" : "Hauptstärke"}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#34C759", margin: 0 }}>{v4Result.hauptstaerke}</p>
                  </div>
                  <div style={{ flex: 1, minWidth: 160, padding: "12px 16px", borderRadius: 14, background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.12)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 3px" }}>{region === "FR" ? "Écart principal" : region === "EN" ? "Key deviation" : region === "IT" ? "Deviazione principale" : "Hauptabweichung"}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#FF9500", margin: 0 }}>{v4Result.hauptabweichung}</p>
                  </div>
                </div>
                {v4Result.gesamtbewertungText.split("\n\n").slice(0, 2).map((p, i) => (
                  <p key={i} style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.8, margin: "0 0 8px" }} lang="de">{hyphenateText(p)}</p>
                ))}
              </GlassCard>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <GlassCard style={{ flex: 1, minWidth: 260 }} data-testid="exec-chancen">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <CheckCircle style={{ width: 15, height: 15, color: "#34C759", strokeWidth: 2.5 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{region === "FR" ? "Opportunités" : region === "EN" ? "Opportunities" : region === "IT" ? "Opportunità" : "Chancen"}</span>
                  </div>
                  <BulletList items={v4Result.chancen.map(c => c.title)} color="#34C759" icon="check" />
                </GlassCard>
                <GlassCard style={{ flex: 1, minWidth: 260 }} data-testid="exec-risiken">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <AlertTriangle style={{ width: 15, height: 15, color: "#FF3B30", strokeWidth: 2.5 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{region === "FR" ? "Risques" : region === "EN" ? "Risks" : region === "IT" ? "Rischi" : "Risiken"}</span>
                  </div>
                  <BulletList items={v4Result.risiken.map(r => r.title)} color="#FF3B30" icon="warning" />
                </GlassCard>
              </div>

              <GlassCard data-testid="exec-prognose">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #5856D6, #5856D6CC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CalendarDays style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{region === "FR" ? "Prévision des risques" : region === "EN" ? "Risk forecast" : region === "IT" ? "Previsione dei rischi" : "Risikoprognose"}</h3>
                </div>
                <div style={{ position: "relative", paddingLeft: 20, marginBottom: 12 }}>
                  <div style={{ position: "absolute", left: -1, top: 0, bottom: 0, width: 3, borderRadius: 2, background: "linear-gradient(180deg, #FF9500, #0071E3, #34C759)" }} />
                  {v4Result.risikoprognose.map((phase, i) => {
                    const phColors = ["#FF9500", "#0071E3", "#34C759"];
                    const pCol = phColors[i] || "#0071E3";
                    return (
                      <div key={i} style={{ position: "relative", marginBottom: i < v4Result.risikoprognose.length - 1 ? 14 : 0 }}>
                        <div style={{
                          position: "absolute", left: -27, top: 3,
                          width: 14, height: 14, borderRadius: "50%",
                          background: pCol, boxShadow: `0 2px 6px ${pCol}40`,
                        }} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: pCol, margin: "0 0 2px" }}>{phase.label} ({phase.period})</p>
                        <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: 0, fontWeight: 450 }} lang="de">{hyphenateText(phase.text)}</p>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              <GlassCard data-testid="exec-empfehlungen">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #34C759, #34C759CC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Target style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{region === "FR" ? "Recommandations" : region === "EN" ? "Recommendations" : region === "IT" ? "Raccomandazioni" : "Empfehlungen"}</h3>
                </div>
                <V4BlockList items={v4Result.empfehlungen} accentColor="#0071E3" />
              </GlassCard>

              <GlassCard data-testid="exec-fazit">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #0071E3, #0071E3CC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Award style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{region === "FR" ? "Conclusion finale" : region === "EN" ? "Final conclusion" : region === "IT" ? "Conclusione finale" : "Schlussfazit"}</h3>
                </div>
                <div style={{
                  padding: "16px 20px", borderRadius: 18,
                  background: `linear-gradient(135deg, ${bc}08, ${bc}03)`,
                  border: `1px solid ${bc}15`,
                }}>
                  <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.75, margin: 0, fontWeight: 600 }} lang={region === "IT" ? "it" : region === "FR" ? "fr" : region === "EN" ? "en" : "de"}>{hyphenateText(v4Result.schlussfazit)}</p>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-gradient-bg">
      <GlobalNav />

      <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999 }}>
        <div className="dark:!bg-background" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: isMobile ? "4px 0 6px" : "5px 0 10px", minHeight: isMobile ? 48 : 62 }}>
          <div className="w-full mx-auto" style={{ maxWidth: 1100, padding: isMobile ? "0 12px" : "0 24px" }}>
            <div className="text-center">
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#34C759" }} data-testid="text-teamcheck-title">
                {region === "FR" ? "Analyser la structure d'équipe" : region === "EN" ? "Analyse team structure" : region === "IT" ? "Analisi struttura del team" : "Teamstruktur analysieren"}
              </h1>
              <p style={{ fontSize: 14, color: "#48484A", fontWeight: 450, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} data-testid="text-teamcheck-subtitle">
                {region === "FR" ? "Analysez l'adéquation entre le candidat et l'équipe existante." : region === "EN" ? "Analyse the structural fit between candidate and existing team." : region === "IT" ? "Analizza la compatibilità strutturale tra il candidato e il team esistente." : "Analysiere die strukturelle Passung zwischen Kandidat und bestehendem Team."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        position: "sticky", top: isMobile ? (48 + 62) : (56 + 62), zIndex: 90,
        background: "rgba(255,255,255,0.82)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "8px 20px",
        display: "flex", justifyContent: "center", gap: 8,
      }}>
        <button
          data-testid="btn-detail-report"
          onClick={() => setReportView("detail")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 10,
            background: "rgba(0,113,227,0.08)", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#0071E3",
          }}
        >
          <FileText style={{ width: 13, height: 13, strokeWidth: 2.5 }} />
          {region === "FR" ? "Rapport détaillé" : region === "EN" ? "Detail report" : region === "IT" ? "Rapporto dettagliato" : "Detailbericht"}
        </button>
        <button
          data-testid="btn-exec-report"
          onClick={() => setReportView("executive")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 10,
            background: "rgba(52,199,89,0.08)", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#34C759",
          }}
        >
          <Briefcase style={{ width: 13, height: 13, strokeWidth: 2.5 }} />
          Executive
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px 12px 80px" : "32px 20px 48px", paddingTop: isMobile ? 16 : 32 }}>

        {/* ═══ META HEADER ═══ */}
        <div style={{
          padding: "28px 32px", borderRadius: 20, marginBottom: 28,
          background: "linear-gradient(135deg, rgba(0,0,0,0.025), rgba(0,0,0,0.015))",
          border: "1px solid rgba(0,0,0,0.06)",
          position: "relative",
        }} data-testid="meta-header">
          <button
            onClick={() => window.print()}
            data-testid="btn-export-pdf"
            style={{
              position: "absolute", top: 20, right: 24,
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10,
              background: "#3A3A3C", border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, color: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <FileDown style={{ width: 14, height: 14, strokeWidth: 2 }} />
            {region === "FR" ? "Exporter en PDF" : region === "EN" ? "Export as PDF" : region === "IT" ? "Esporta in PDF" : "Als PDF exportieren"}
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", margin: "0 0 2px", letterSpacing: "-0.02em" }}>bioLogic-TeamCheck</h2>
          <p style={{ fontSize: 12, color: "#8E8E93", margin: "0 0 18px", fontWeight: 500 }}>{region === "FR" ? "Base de décision recrutement – V4" : region === "EN" ? "Recruiting decision basis – V4" : region === "IT" ? "Decisione di recruiting – V4" : "Recruiting-Entscheidungsgrundlage – V4"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 6, columnGap: 16, fontSize: 13 }}>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>{region === "FR" ? "Poste :" : region === "EN" ? "Position:" : region === "IT" ? "Ruolo:" : "Stelle:"}</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-position">{beruf}</span>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>{region === "FR" ? "Domaine :" : region === "EN" ? "Area:" : region === "IT" ? "Area:" : "Bereich:"}</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-bereich">{bereich || "–"}</span>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>{region === "FR" ? "Priorité :" : region === "EN" ? "Focus:" : region === "IT" ? "Focus:" : "Fokus:"}</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-fokus">{erfolgsfokusLabels.length > 0 ? erfolgsfokusLabels.join(", ") : "–"}</span>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>{region === "FR" ? "Caractère du rôle :" : region === "EN" ? "Role character:" : region === "IT" ? "Carattere del ruolo:" : "Rollencharakter:"}</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-charakter">{aufgabencharakter || "–"}</span>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>{region === "FR" ? "Date :" : region === "EN" ? "Date:" : region === "IT" ? "Data:" : "Datum:"}</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-datum">{new Date().toLocaleDateString(region === "FR" ? "fr-FR" : region === "EN" ? "en-GB" : region === "IT" ? "it-IT" : "de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
          </div>
        </div>


        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1D1D1F", margin: "0 0 8px", letterSpacing: "-0.03em" }} data-testid="page-title">
          Detailanalyse: {rolleLabel} · {beruf}
        </h1>

        <div style={{
          padding: "16px 22px", borderRadius: 16, marginBottom: 32, marginTop: 16,
          background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(0,113,227,0.02))",
          border: "1px solid rgba(0,113,227,0.12)",
        }} data-testid="headline-callout">
          <p style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F", margin: 0, lineHeight: 1.7 }} lang="de">
            {hyphenateText(v4Result.teamKontext)}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* SECTION 1: DIAGNOSE */}
          <GlassCard data-testid="section-diagnose">
            <SectionHeader num={1} title={region === "FR" ? "DIAGNOSTIC" : region === "EN" ? "DIAGNOSIS" : region === "IT" ? "DIAGNOSI" : "DIAGNOSE"} icon={BarChart3} />

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>{region === "FR" ? "Rôle de la nouvelle personne" : region === "EN" ? "Role of the new person" : region === "IT" ? "Ruolo della nuova persona" : "Rolle der neuen Person"}</p>
                <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3 }}>
                  {[true, false].map(val => (
                    <button key={String(val)}
                      data-testid={val ? "toggle-leading-yes" : "toggle-leading-no"}
                      onClick={() => setIsLeading(val)}
                      style={{
                        flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: isLeading === val ? 700 : 500,
                        background: isLeading === val ? "#fff" : "transparent",
                        boxShadow: isLeading === val ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                        border: "none", cursor: "pointer",
                        color: isLeading === val ? "#0071E3" : "#8E8E93",
                        transition: "all 200ms ease",
                      }}
                    >{val ? (region === "FR" ? "Management" : region === "EN" ? "Leadership" : region === "IT" ? "Responsabilità" : "Führung") : (region === "FR" ? "Membre d'équipe" : region === "EN" ? "Team member" : region === "IT" ? "Membro del team" : "Teammitglied")}</button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>{t("Teamgrösse")}</p>
                <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3, marginBottom: 6 }}>
                  {(["KLEIN", "MITTEL", "GROSS"] as TeamSize[]).map(size => {
                    const labels: Record<TeamSize, string> = region === "FR" ? { KLEIN: "Petit (2–5)", MITTEL: "Moyen (6–12)", GROSS: "Grand (13+)" } : region === "EN" ? { KLEIN: "Small (2–5)", MITTEL: "Medium (6–12)", GROSS: "Large (13+)" } : region === "IT" ? { KLEIN: "Piccolo (2–5)", MITTEL: "Medio (6–12)", GROSS: "Grande (13+)" } : { KLEIN: "Klein (2–5)", MITTEL: "Mittel (6–12)", GROSS: t("Gross (13+)") };
                    const active = teamSize === size;
                    return (
                      <button key={size} onClick={() => setTeamSize(size)} data-testid={`toggle-size-${size.toLowerCase()}`} style={{
                        flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500,
                        background: active ? "#fff" : "transparent",
                        boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                        border: "none", cursor: "pointer",
                        color: active ? "#0071E3" : "#8E8E93",
                        transition: "all 200ms ease",
                      }}>{labels[size]}</button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12, color: "#8E8E93", margin: 0 }}>
                  {region === "IT" ? (teamSize === "KLEIN" ? "Team piccolo: ogni persona ha un alto influsso sulla dinamica." : teamSize === "GROSS" ? "Team grande: le singole persone cambiano meno la dinamica complessiva." : "Team medio: influsso percepibile ma limitato per persona.") : region === "EN" ? (teamSize === "KLEIN" ? "Small teams: every person has a high impact on team dynamics." : teamSize === "GROSS" ? "Large teams: individuals have less effect on overall dynamics." : "Medium teams: noticeable but limited impact per person.") : region === "FR" ? (teamSize === "KLEIN" ? "Petites équipes : chaque personne a une grande influence sur la dynamique." : teamSize === "GROSS" ? "Grandes équipes : les individus changent moins la dynamique globale." : "Équipes moyennes : influence perceptible mais limitée par personne.") : (teamSize === "KLEIN" ? "Kleine Teams: Jede Person hat hohen Einfluss auf die Dynamik." : teamSize === "GROSS" ? t("Grosse Teams: Einzelpersonen verändern die Gesamtdynamik weniger stark.") : "Mittlere Teams: Spürbarer, aber begrenzter Einfluss pro Person.")}
                </p>
              </div>
            </div>

            {/* Funktionsziel */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>{region === "FR" ? "Objectif fonctionnel du domaine" : region === "EN" ? "Functional goal of the area" : region === "IT" ? "Obiettivo funzionale dell'area" : "Funktionsziel des Bereichs"}</p>
              <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3 }}>
                {([
                  { value: "" as typeof teamGoal, label: region === "FR" ? "Aucun" : region === "EN" ? "None" : region === "IT" ? "Nessuno" : "Keins", icon: null },
                  { value: "umsetzung" as typeof teamGoal, label: region === "FR" ? "Rythme et Décision" : region === "EN" ? "Execution" : region === "IT" ? "Ritmo e Decisione" : "Umsetzung", icon: Rocket },
                  { value: "analyse" as typeof teamGoal, label: region === "FR" ? "Structure et Rigueur" : region === "EN" ? "Analysis" : region === "IT" ? "Struttura e Rigore" : "Analyse", icon: BarChart3 },
                  { value: "zusammenarbeit" as typeof teamGoal, label: region === "FR" ? "Communication et Relations" : region === "EN" ? "Collaboration" : region === "IT" ? "Comunicazione e Relazioni" : "Zusammenarbeit", icon: Handshake },
                ]).map(opt => {
                  const active = teamGoal === opt.value;
                  const OptIcon = opt.icon;
                  return (
                    <button key={opt.value} onClick={() => setTeamGoal(opt.value)} data-testid={`toggle-goal-${opt.value || "none"}`} style={{
                      flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500,
                      background: active ? "#fff" : "transparent",
                      boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                      border: "none", cursor: "pointer",
                      color: active ? "#0071E3" : "#8E8E93",
                      transition: "all 200ms ease",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    }}>
                      {OptIcon && <OptIcon style={{ width: 12, height: 12, strokeWidth: 2.5 }} />}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <ProfileCard title={`${region === "FR" ? "Rôle-DNA (Cible)" : region === "EN" ? "Role-DNA (Target)" : region === "IT" ? "Ruolo-DNA (Obiettivo)" : "Rollen-DNA (Soll)"} · ${sollDom}`} num={1} triad={soll} color="#0071E3" />
              <ProfileCard title={`${region === "FR" ? "Profil personne (Réel)" : region === "EN" ? "Person profile (Actual)" : region === "IT" ? "Profilo persona (Reale)" : "Personenprofil (Ist)"} · ${kandDom}`} num={2} triad={kandidat} color="#F39200" onChange={setKandidat} testIdPrefix="slider-kand" />
              <ProfileCard title={`${region === "FR" ? "Profil équipe (Réel)" : region === "EN" ? "Team profile (Actual)" : region === "IT" ? "Profilo team (Reale)" : "Teamprofil (Ist)"} · ${teamDom}`} num={3} triad={team} color="#34C759" onChange={setTeam} testIdPrefix="slider-team" />
            </div>

            <div data-testid="diagnose-summary" style={{
              padding: "16px 20px", borderRadius: 14, marginBottom: 20,
              background: "rgba(142,142,147,0.08)",
            }}>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.7, margin: 0, fontWeight: 450 }} lang="de">
                {hyphenateText(v4Result.teamKontext)}
              </p>
            </div>

            {/* Executive Header – Ampel + Bewertung */}
            {(() => {
              const tlKey = tdResult.trafficLight;
              const detail: Record<TrafficLight, { title: string; desc: string; bullets: string[]; recLabel: string; rec: string }> = region === "IT" ? {
                RED: {
                  title: "Tensioni evidenti – necessaria gestione attiva",
                  desc: "Le logiche di lavoro differiscono notevolmente. Senza una guida attiva emergono rischi di prestazione e conflitto.",
                  bullets: [
                    "Le priorità vengono interpretate in modo diverso.",
                    "Il ritmo o la qualità vengono messi sotto pressione.",
                    "Resistenza, ritiro o formazione di gruppi sono possibili.",
                  ],
                  recLabel: "Cosa fare?",
                  rec: "Standard chiari, regole decisionali fisse e revisioni regolari sono indispensabili.",
                },
                YELLOW: {
                  title: "Stili di lavoro diversi – gestire attivamente",
                  desc: "Le differenze sono percepibili. Con regole chiare il sistema rimane stabile e gestibile.",
                  bullets: [
                    "Le decisioni richiedono talvolta più tempo.",
                    "Le priorità devono essere spiegate più frequentemente.",
                    "Il lavoro di coordinamento aumenta nel quotidiano.",
                  ],
                  recLabel: "Cosa fare?",
                  rec: "I percorsi decisionali, i tempi e le responsabilità devono essere definiti chiaramente.",
                },
                GREEN: {
                  title: "Stabile – buona compatibilità",
                  desc: "Gli stili di lavoro sono compatibili. Non sono necessarie misure particolari.",
                  bullets: [
                    "Le decisioni vengono capite e accettate rapidamente.",
                    "Il coordinamento avviene senza problemi.",
                    "Ritmo e qualità rimangono stabili.",
                  ],
                  recLabel: "Cosa fare?",
                  rec: "La gestione normale e il coordinamento regolare sono sufficienti.",
                },
              } : region === "EN" ? {
                RED: {
                  title: "Clear tensions – active management required",
                  desc: "Working logic differs significantly. Without active management, performance and conflict risks arise.",
                  bullets: [
                    "Priorities are interpreted differently.",
                    "Pace or quality come under pressure.",
                    "Resistance, withdrawal or group formation is possible.",
                  ],
                  recLabel: "What to do?",
                  rec: "Clear standards, fixed decision rules and regular reviews are essential.",
                },
                YELLOW: {
                  title: "Different working styles – manage actively",
                  desc: "Differences are noticeable. With clear rules the system remains stable and manageable.",
                  bullets: [
                    "Decisions sometimes take longer.",
                    "Priorities need to be explained more frequently.",
                    "Coordination effort increases day-to-day.",
                  ],
                  recLabel: "What to do?",
                  rec: "Decision paths, timelines and responsibilities must be clearly defined.",
                },
                GREEN: {
                  title: "Stable – good compatibility",
                  desc: "Working styles are compatible. No special measures needed.",
                  bullets: [
                    "Decisions are quickly understood and accepted.",
                    "Coordination runs smoothly.",
                    "Pace and quality remain stable.",
                  ],
                  recLabel: "What to do?",
                  rec: "Normal management and regular coordination are sufficient.",
                },
              } : region === "FR" ? {
                RED: {
                  title: "Tensions claires – management actif nécessaire",
                  desc: "Les logiques de travail diffèrent fortement. Sans pilotage actif, des risques de performance et de conflit apparaissent.",
                  bullets: [
                    "Les priorités sont interprétées différemment.",
                    "Le rythme ou la qualité subissent une pression.",
                    "Résistance, retrait ou formation de clans sont possibles.",
                  ],
                  recLabel: "Que faire ?",
                  rec: "Des standards clairs, des règles de décision fixes et des révisions régulières sont impératifs.",
                },
                YELLOW: {
                  title: "Modes de travail différents – piloter activement",
                  desc: "Les différences sont perceptibles. Avec des règles claires, le système reste stable et pilotable.",
                  bullets: [
                    "Les décisions prennent parfois plus de temps.",
                    "Les priorités doivent être expliquées plus souvent.",
                    "L'effort de coordination augmente au quotidien.",
                  ],
                  recLabel: "Que faire ?",
                  rec: "Les circuits de décision, les délais et les responsabilités doivent être clairement définis.",
                },
                GREEN: {
                  title: "Stable – bonne compatibilité",
                  desc: "Les modes de travail sont compatibles. Aucune mesure particulière n'est nécessaire.",
                  bullets: [
                    "Les décisions sont rapidement comprises et acceptées.",
                    "Les concertations se déroulent sans friction.",
                    "Le rythme et la qualité restent stables.",
                  ],
                  recLabel: "Que faire ?",
                  rec: "Un management normal et une concertation régulière suffisent.",
                },
              } : {
                RED: {
                  title: "Deutliche Spannungen – klare Führung notwendig",
                  desc: "Arbeitslogiken unterscheiden sich stark. Ohne aktive Steuerung entstehen Leistungs- und Konfliktrisiken.",
                  bullets: [
                    "Prioritäten werden unterschiedlich interpretiert.",
                    "Tempo oder Qualität geraten unter Druck.",
                    "Widerstand, Rückzug oder Lagerbildung sind möglich.",
                  ],
                  recLabel: "Was ist zu tun?",
                  rec: t("Klare Standards, feste Entscheidungsregeln und regelmässige Reviews sind zwingend."),
                },
                YELLOW: {
                  title: "Unterschiedliche Arbeitsweisen – aktiv steuern",
                  desc: "Unterschiede sind spürbar. Mit klaren Regeln bleibt das System stabil steuerbar.",
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
                  desc: t("Arbeitsweisen sind kompatibel. Keine besonderen Massnahmen notwendig."),
                  bullets: [
                    "Entscheidungen werden schnell verstanden und akzeptiert.",
                    "Abstimmungen laufen reibungslos.",
                    "Tempo und Qualität bleiben stabil.",
                  ],
                  recLabel: "Was ist zu tun?",
                  rec: t("Normale Führung und regelmässige Abstimmung reichen aus."),
                },
              };
              const d = detail[tlKey];
              return (
                <div style={{
                  padding: "20px 22px", borderRadius: 18,
                  background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }} data-testid="executive-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <TrafficLightAmpel tl={tlKey} />
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }} data-testid="text-team-label">{beruf || "Projektteam"}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: tl.bg, color: tl.fill }} data-testid="badge-status">{region === "FR" ? ({ GREEN: "Stable", YELLOW: "Gérable", RED: "Zone de tension" }[tlKey] ?? tl.label) : region === "EN" ? ({ GREEN: "Stable", YELLOW: "Manageable", RED: "Tension field" }[tlKey] ?? tl.label) : region === "IT" ? ({ GREEN: "Stabile", YELLOW: "Gestibile", RED: "Area di tensione" }[tlKey] ?? tl.label) : tl.label}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#8E8E93", margin: "4px 0 0", lineHeight: 1.5 }} data-testid="text-headline" lang="de">
                        {hyphenateText(tdResult.headline)}
                      </p>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }} data-testid="detail-title">{d.title}</p>
                    <p style={{ fontSize: 12, color: "#48484A", margin: "0 0 12px", lineHeight: 1.6 }} lang="de" data-testid="detail-desc">{hyphenateText(d.desc)}</p>

                    <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{region === "FR" ? "Qu'est-ce que cela signifie concrètement ?" : region === "EN" ? "What does this mean in practice?" : region === "IT" ? "Cosa significa concretamente?" : "Was bedeutet das konkret?"}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                      {d.bullets.map((b, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ color: tl.fill, fontSize: 8, marginTop: 4, flexShrink: 0 }}>●</span>
                          <span style={{ fontSize: 12, color: "#3A3A3C", lineHeight: 1.55 }}>{b}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      padding: "10px 14px", borderRadius: 10,
                      background: `${tl.fill}08`, border: `1px solid ${tl.fill}15`,
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: tl.fill, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }} data-testid="rec-label">{d.recLabel}</p>
                      <p style={{ fontSize: 12, color: "#3A3A3C", margin: 0, lineHeight: 1.55 }} data-testid="rec-text">{d.rec}</p>
                    </div>
                  </div>

                  {/* V4 Gesamteinschätzung badge */}
                  <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ padding: "8px 16px", borderRadius: 10, background: `${bc}10`, border: `1px solid ${bc}25` }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: bc }}>{v4Result.gesamteinschaetzung}</span>
                    </div>
                    {[
                      { label: region === "FR" ? "Équipe" : region === "EN" ? "Team" : region === "IT" ? "Team" : "Team", value: axisLabel(v4Result.passungZumTeam, region), color: axisColor(v4Result.passungZumTeam) },
                      { label: region === "FR" ? "Tâche" : region === "EN" ? "Task" : region === "IT" ? "Compito" : "Aufgabe", value: axisLabel(v4Result.beitragZurAufgabe, region), color: axisColor(v4Result.beitragZurAufgabe) },
                    ].map((ind, i) => (
                      <div key={i} style={{ padding: "8px 12px", borderRadius: 10, background: `${ind.color}08`, border: `1px solid ${ind.color}15` }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", marginRight: 6 }}>{ind.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: ind.color }}>{ind.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </GlassCard>

          {/* SECTIONS: Tabbed Detail Card */}
          <GlassCard data-testid="section-detail-tabs">
            <div style={{ display: "flex", gap: 3, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3, marginBottom: 26 }}>
              {([
                ["bewertung", region === "FR" ? "Évaluation" : region === "EN" ? "Assessment" : region === "IT" ? "Valutazione" : "Bewertung", Target],
                ["alltag", region === "FR" ? "Quotidien & pression" : region === "EN" ? "Day-to-day" : region === "IT" ? "Quotidiano" : "Alltag & Druck", Activity],
                ["chancen", region === "FR" ? "Opp. / Risques" : region === "EN" ? "Opp. / Risks" : region === "IT" ? "Opp. / Rischi" : "Chancen/Risiken", TrendingUp],
                ["hebel", region === "FR" ? "Leviers de management" : region === "EN" ? "Levers" : region === "IT" ? "Leve" : "Führungshebel", Flame],
                ["prognose", region === "FR" ? "Prévision" : region === "EN" ? "Forecast" : region === "IT" ? "Previsione" : "Prognose", Clock],
                ["empfehlung", region === "FR" ? "Recommandations" : region === "EN" ? "Recs." : region === "IT" ? "Racs." : "Empfehlungen", Shield],
              ] as const).map(([key, label, Icon]) => {
                const active = detailTab === key;
                return (
                  <button key={key} onClick={() => setDetailTab(key as typeof detailTab)} data-testid={`tab-detail-${key}`} style={{
                    flex: 1, padding: "9px 6px", borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 500,
                    background: active ? "#fff" : "transparent",
                    boxShadow: active ? "0 1px 6px rgba(0,0,0,0.06)" : "none",
                    border: "none", cursor: "pointer",
                    color: active ? "#1D1D1F" : "#8E8E93",
                    transition: "all 200ms ease",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    whiteSpace: "nowrap",
                  }}>
                    <Icon style={{ width: 12, height: 12, strokeWidth: 2.5 }} />
                    <span style={{ display: "inline" }}>{label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ minHeight: 380 }}>

              {/* TAB: GESAMTBEWERTUNG */}
              {detailTab === "bewertung" && (
                <div data-testid="content-bewertung">
                  <SectionHeader num={1} title={region === "FR" ? "ÉVALUATION GLOBALE" : region === "EN" ? "OVERALL ASSESSMENT" : region === "IT" ? "VALUTAZIONE COMPLESSIVA" : "GESAMTBEWERTUNG"} icon={Target} />

                  <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 180, padding: "14px 18px", borderRadius: 16, background: "rgba(52,199,89,0.05)", border: "1px solid rgba(52,199,89,0.12)" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>{region === "FR" ? "Point fort principal" : region === "EN" ? "Key strength" : region === "IT" ? "Punto di forza" : "Hauptstärke"}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#34C759", margin: 0 }}>{v4Result.hauptstaerke}</p>
                    </div>
                    <div style={{ flex: 1, minWidth: 180, padding: "14px 18px", borderRadius: 16, background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.12)" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 4px" }}>{region === "FR" ? "Écart principal" : region === "EN" ? "Key deviation" : region === "IT" ? "Deviazione principale" : "Hauptabweichung"}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#FF9500", margin: 0 }}>{v4Result.hauptabweichung}</p>
                    </div>
                  </div>

                  <Paragraphs text={v4Result.gesamtbewertungText} highlight />

                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)", margin: "20px 0" }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <Lightbulb style={{ width: 16, height: 16, color: "#0071E3", strokeWidth: 2.5 }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{region === "FR" ? "Pourquoi cette évaluation" : region === "EN" ? "Why this assessment" : region === "IT" ? "Perché questa valutazione" : "Warum diese Bewertung"}</h3>
                  </div>
                  <Paragraphs text={v4Result.warumText} />
                </div>
              )}

              {/* TAB: ALLTAG & DRUCK */}
              {detailTab === "alltag" && (
                <div data-testid="content-alltag">
                  <SectionHeader num={2} title={region === "FR" ? "IMPACT AU QUOTIDIEN" : region === "EN" ? "DAY-TO-DAY IMPACT" : region === "IT" ? "IMPATTO NEL QUOTIDIANO" : "WIRKUNG IM ALLTAG"} icon={Activity} />
                  <Paragraphs text={v4Result.wirkungAlltagText} highlight />

                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)", margin: "24px 0" }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <Flame style={{ width: 16, height: 16, color: "#FF3B30", strokeWidth: 2.5 }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{region === "FR" ? "Comportement sous pression" : region === "EN" ? "Behaviour under pressure" : region === "IT" ? "Comportamento sotto pressione" : "Verhalten unter Druck"}</h3>
                  </div>
                  <div style={{
                    padding: "16px 20px", borderRadius: 16,
                    background: "rgba(255,59,48,0.04)", border: "1px solid rgba(255,59,48,0.10)",
                  }}>
                    <Paragraphs text={v4Result.druckText} />
                  </div>

                  {v4Result.fuehrungshinweis && (
                    <>
                      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)", margin: "24px 0" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <Shield style={{ width: 16, height: 16, color: "#5856D6", strokeWidth: 2.5 }} />
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{region === "FR" ? "Note de management" : region === "EN" ? "Leadership note" : region === "IT" ? "Nota per il responsabile" : "Führungshinweis"}</h3>
                      </div>
                      <V4BlockList items={v4Result.fuehrungshinweis} accentColor="#5856D6" />
                    </>
                  )}
                </div>
              )}

              {/* TAB: CHANCEN & RISIKEN */}
              {detailTab === "chancen" && (
                <div data-testid="content-chancen">
                  <SectionHeader num={3} title={region === "FR" ? "OPPORTUNITÉS ET RISQUES" : region === "EN" ? "OPPORTUNITIES & RISKS" : region === "IT" ? "OPPORTUNITÀ E RISCHI" : "CHANCEN & RISIKEN"} icon={TrendingUp} />
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
                    <div style={{
                      flex: 1, minWidth: 220, padding: "18px 16px", borderRadius: 18,
                      background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.10)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <CheckCircle style={{ width: 15, height: 15, color: "#34C759", strokeWidth: 2.5 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>{region === "FR" ? "Opportunités" : region === "EN" ? "Opportunities" : region === "IT" ? "Opportunità" : "Chancen"}</span>
                      </div>
                      {v4Result.chancen.map((c, i) => (
                        <div key={i} style={{ marginBottom: i < v4Result.chancen.length - 1 ? 10 : 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#34C759", margin: "0 0 3px" }}>{c.title}</p>
                          <p style={{ fontSize: 12, color: "#48484A", lineHeight: 1.6, margin: 0 }} lang="de">{hyphenateText(c.text)}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      flex: 1, minWidth: 220, padding: "18px 16px", borderRadius: 18,
                      background: "rgba(255,59,48,0.04)", border: "1px solid rgba(255,59,48,0.10)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <AlertTriangle style={{ width: 15, height: 15, color: "#FF3B30", strokeWidth: 2.5 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>{region === "FR" ? "Risques" : region === "EN" ? "Risks" : region === "IT" ? "Rischi" : "Risiken"}</span>
                      </div>
                      {v4Result.risiken.map((r, i) => (
                        <div key={i} style={{ marginBottom: i < v4Result.risiken.length - 1 ? 10 : 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#FF3B30", margin: "0 0 3px" }}>{r.title}</p>
                          <p style={{ fontSize: 12, color: "#48484A", lineHeight: 1.6, margin: 0 }} lang="de">{hyphenateText(r.text)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Paragraphs text={v4Result.chancenRisikenEinordnung} />
                </div>
              )}

              {/* TAB: FÜHRUNGSHEBEL */}
              {detailTab === "hebel" && (
                <div data-testid="content-hebel">
                  <SectionHeader num={4} title={region === "FR" ? "LEVIERS DE MANAGEMENT" : region === "EN" ? "LEADERSHIP LEVERS" : region === "IT" ? "LEVE DI GESTIONE" : "FÜHRUNGSHEBEL"} icon={Flame} />
                  <p style={{ fontSize: 12, color: "#8E8E93", margin: "0 0 18px", fontWeight: 500 }}>{region === "FR" ? "Leviers de pilotage concrets pour cette combinaison manager-équipe" : region === "EN" ? "Concrete management levers for this leader–team combination" : region === "IT" ? "Leve di gestione concrete per questa combinazione responsabile-team" : t("Konkrete Steuerungsmassnahmen für diese Führungskraft-Team-Kombination")}</p>

                  {isLeading && tdResult.leadershipContext && tdResult.leadershipContext.leadershipLevers.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {tdResult.leadershipContext.leadershipLevers.map((lever, i) => {
                        const prioColor = lever.priority === "hoch" ? "#FF3B30" : lever.priority === "mittel" ? "#FF9500" : "#34C759";
                        const prioLabel = lever.priority.toUpperCase();
                        return (
                          <div key={i} data-testid={`lever-item-${i}`} style={{
                            display: "flex", borderRadius: 14, overflow: "hidden",
                            background: "#fff", border: "1px solid rgba(0,0,0,0.06)",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                          }}>
                            <div style={{ width: 4, flexShrink: 0, background: prioColor }} />
                            <div style={{ flex: 1, padding: "14px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{lever.title}</p>
                                <span style={{
                                  fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 5,
                                  background: `${prioColor}12`, color: prioColor,
                                  letterSpacing: "0.06em",
                                }}>{prioLabel}</span>
                              </div>
                              <p style={{ fontSize: 12, color: "#48484A", margin: 0, lineHeight: 1.6 }}>{lever.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: "24px 20px", borderRadius: 16, textAlign: "center",
                      background: "rgba(142,142,147,0.06)", border: "1px solid rgba(0,0,0,0.04)",
                    }}>
                      <p style={{ fontSize: 13, color: "#8E8E93", margin: 0 }}>{region === "FR" ? 'Les leviers de management sont affichés uniquement en mode management. Active « Management » dans la zone de diagnostic.' : region === "EN" ? 'Leadership levers are only shown in leadership mode. Please activate "Leadership" in the diagnosis area.' : region === "IT" ? 'Le leve di gestione vengono visualizzate solo in modalità responsabile. Attiva «Responsabilità» nell\'area diagnosi.' : 'Führungshebel werden nur im Führungsmodus angezeigt. Bitte „Führung" im Diagnose-Bereich aktivieren.'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PROGNOSE */}
              {detailTab === "prognose" && (
                <div data-testid="content-prognose">
                  <SectionHeader num={5} title={region === "FR" ? "PRÉVISION DES RISQUES" : region === "EN" ? "RISK FORECAST" : region === "IT" ? "PREVISIONE DEI RISCHI" : "RISIKOPROGNOSE"} icon={Clock} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {v4Result.risikoprognose.map((phase, i) => {
                      const phaseColors = ["#FF9500", "#0071E3", "#34C759"];
                      const pc = phaseColors[i] || "#0071E3";
                      return (
                        <div key={i} style={{
                          padding: "18px 20px", borderRadius: 18,
                          background: `${pc}06`, border: `1px solid ${pc}12`,
                        }} data-testid={`prognose-phase-${i}`}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 9,
                              background: pc, display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF" }}>{phase.label.charAt(0)}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{phase.label}</span>
                              <span style={{ fontSize: 11, color: "#8E8E93", marginLeft: 8 }}>{phase.period}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">
                            {hyphenateText(phase.text)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: EMPFEHLUNGEN */}
              {detailTab === "empfehlung" && (
                <div data-testid="content-empfehlung">
                  <SectionHeader num={6} title={region === "FR" ? "RECOMMANDATIONS" : region === "EN" ? "RECOMMENDATIONS" : region === "IT" ? "RACCOMANDAZIONI" : "EMPFEHLUNGEN"} icon={Shield} />
                  <V4BlockList items={v4Result.empfehlungen} accentColor="#0071E3" />

                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)", margin: "24px 0" }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <Award style={{ width: 16, height: 16, color: "#0071E3", strokeWidth: 2.5 }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{region === "FR" ? "Conclusion finale" : region === "EN" ? "Final conclusion" : region === "IT" ? "Conclusione finale" : "Schlussfazit"}</h3>
                  </div>
                  <div style={{
                    padding: "16px 20px", borderRadius: 16,
                    background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,199,89,0.04))",
                    border: "1px solid rgba(0,113,227,0.10)",
                  }}>
                    <p style={{ fontSize: 13, color: "#1D1D1F", lineHeight: 1.75, margin: 0, fontWeight: 550 }} lang="de">
                      {hyphenateText(v4Result.schlussfazit)}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
