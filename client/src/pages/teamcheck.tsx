import { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle, AlertTriangle, Shield, TrendingUp, Clock, Target,
  Zap, BarChart3, FileDown, ChevronRight, X, FileText, Briefcase,
  ArrowLeft, Lightbulb, Activity, Users, Crosshair, Flame,
  CalendarDays, Award, Gauge, Heart, Brain,
} from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { hyphenateText } from "@/lib/hyphenate";
import {
  type TeamCheckInput, type TeamCheckResult, type UrteilBadge,
  type ReportSection, type ExecutivePage,
  computeTeamCheck, generateDetailReport, generateExecutiveReport, generateDiagnoseSummary,
} from "@/lib/teamcheck-engine";
import {
  computeTeamDynamics, getDefaultLevers,
  type TrafficLight, type TeamDynamikInput, type TeamSize,
} from "@/lib/teamdynamik-engine";
import type { Triad, ComponentKey } from "@/lib/jobcheck-engine";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };
const MAX_BIO = 67;

const TL_COLORS: Record<TrafficLight, { bg: string; fill: string; label: string }> = {
  GREEN: { bg: "rgba(52,199,89,0.08)", fill: "#34C759", label: "Stabil" },
  YELLOW: { bg: "rgba(255,149,0,0.08)", fill: "#FF9500", label: "Steuerbar" },
  RED: { bg: "rgba(255,59,48,0.08)", fill: "#FF3B30", label: "Spannungsfeld" },
};

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

const BADGE_CONFIG: Record<UrteilBadge, { label: string; color: string; bg: string }> = {
  STRATEGISCH_CHANCEN: { label: "Strategisch Chancen", color: "#34C759", bg: "rgba(52,199,89,0.10)" },
  ENTWICKLUNGSFAEHIG: { label: "Entwicklungsfähig", color: "#FF9500", bg: "rgba(255,149,0,0.10)" },
  NO_GO: { label: "No Go", color: "#FF3B30", bg: "rgba(255,59,48,0.10)" },
};

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

function ProfileCard({ title, num, triad, dominanz, color, onChange, testIdPrefix }: {
  title: string; num: number; triad: Triad; dominanz: string; color: string;
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
      <div style={{ background: "#3A3A3C", borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {(["impulsiv", "intuitiv", "analytisch"] as ComponentKey[]).map(k => {
          const val = triad[k];
          const barColor = k === "impulsiv" ? COLORS.imp : k === "intuitiv" ? COLORS.int : COLORS.ana;
          const widthPct = (val / MAX_BIO) * 100;
          const isSmall = widthPct < 18;
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", width: 58, flexShrink: 0 }}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </span>
              <div style={{ flex: 1, position: "relative", height: 22 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: 11, background: "rgba(255,255,255,0.10)",
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
                <div style={{
                  position: "absolute",
                  left: `${Math.min(Math.max(widthPct, 4), 100)}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 22, height: 22, borderRadius: "50%",
                  background: `radial-gradient(circle at 40% 38%, ${barColor}, color-mix(in srgb, ${barColor} 70%, #000))`,
                  border: "3px solid #3A3A3C",
                  transition: "left 150ms ease",
                  zIndex: 1,
                }} />
                {onChange && (
                  <input
                    type="range" min={0} max={MAX_BIO} value={val}
                    onChange={e => onChange({ ...triad, [k]: Number(e.target.value) })}
                    data-testid={testIdPrefix ? `${testIdPrefix}-${k}` : undefined}
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%",
                      appearance: "none", WebkitAppearance: "none",
                      background: "transparent", outline: "none", cursor: "pointer",
                      margin: 0, zIndex: 3,
                    }}
                  />
                )}
                {isSmall && (
                  <span style={{
                    position: "absolute", top: "50%", transform: "translateY(-50%)",
                    left: `calc(${Math.min(Math.max(widthPct, 4), 100)}% + 16px)`,
                    fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap",
                    transition: "left 150ms ease", zIndex: 1,
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

export default function TeamCheck() {
  const [soll, setSoll] = useState<Triad>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });
  const [kandidat, setKandidat] = useState<Triad>({ impulsiv: 33, intuitiv: 34, analytisch: 33 });
  const [team, setTeam] = useState<Triad>({ impulsiv: 30, intuitiv: 50, analytisch: 20 });
  const [beruf, setBeruf] = useState("Neue Position");
  const [bereich, setBereich] = useState("");
  const [fuehrungstyp, setFuehrungstyp] = useState("Keine");
  const [aufgabencharakter, setAufgabencharakter] = useState("");
  const [erfolgsfokusLabels, setErfolgsfokusLabels] = useState<string[]>([]);
  const [isLeading, setIsLeading] = useState(true);
  const [teamSize, setTeamSize] = useState<TeamSize>("MITTEL");
  const [detailTab, setDetailTab] = useState<"system" | "stress" | "hebel" | "prognose" | "empfehlung" | "urteil">("system");
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
          if (p && p.impulsiv != null) {
            setSoll({ impulsiv: p.impulsiv, intuitiv: p.intuitiv, analytisch: p.analytisch });
          }
        }
      }
    } catch {}

    try {
      const saved = localStorage.getItem("jobcheckCandProfile");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.impulsiv != null && p.intuitiv != null && p.analytisch != null) {
          setKandidat({ impulsiv: p.impulsiv, intuitiv: p.intuitiv, analytisch: p.analytisch });
        }
      }
    } catch {}
  }, []);

  const input: TeamCheckInput = useMemo(() => ({
    soll, kandidat, team, beruf, bereich, fuehrungstyp, isLeading,
  }), [soll, kandidat, team, beruf, bereich, fuehrungstyp, isLeading]);

  const result: TeamCheckResult = useMemo(() => computeTeamCheck(input), [input]);

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

  const tdResult = useMemo(() => computeTeamDynamics(tdInput), [tdInput]);
  const tl = TL_COLORS[tdResult.trafficLight];

  const rolleLabel = isLeading ? "Neue Führungskraft" : "Neues Teammitglied";

  const detailReport = useMemo(() => generateDetailReport(input, result), [input, result]);
  const execReport = useMemo(() => generateExecutiveReport(input, result), [input, result]);

  if (reportView !== "none") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F5F5F7 0%, #FBFBFD 40%, #F5F5F7 100%)" }}>
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
            Zurück
          </button>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1D1D1F", textAlign: "center" }}>
            {reportView === "detail" ? "Detailbericht" : "Executive Summary"}
          </span>
          <button onClick={() => window.print()} data-testid="btn-print-report" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            background: "#3A3A3C", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600, color: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            <FileDown style={{ width: 13, height: 13, strokeWidth: 2 }} />
            Als PDF exportieren
          </button>
        </div>

        <div ref={reportRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
          {reportView === "detail" ? (
            <>
              {/* Hero Header */}
              <GlassCard style={{ padding: "36px 32px 30px", textAlign: "center", position: "relative", overflow: "hidden" }} data-testid="report-header">
                <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,170,220,0.04))", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,113,227,0.04), rgba(52,170,220,0.03))", pointerEvents: "none" }} />
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "linear-gradient(135deg, rgba(0,113,227,0.1), rgba(52,170,220,0.06))",
                  borderRadius: 20, padding: "5px 14px", marginBottom: 14,
                }}>
                  <FileText style={{ width: 12, height: 12, color: "#0071E3" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.12em" }}>Entscheidungsgrundlage</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.15, marginBottom: 6 }}>{beruf}</h1>
                <p style={{ fontSize: 13, color: "#8E8E93", marginBottom: 16 }}>{bereich || "Systemische Analyse zur Besetzung"}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A3C", background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10 }}>
                    {isLeading ? "Führungsposition" : "Teammitglied"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A3C", background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10 }}>
                    {result.diagnose.kandidatDominanz}
                  </span>
                </div>
              </GlassCard>

              {(() => {
                const SECTION_META: Record<number, { icon: typeof Target; color: string }> = {
                  1: { icon: Target, color: "#0071E3" },
                  2: { icon: Users, color: "#0071E3" },
                  3: { icon: Activity, color: "#FF9500" },
                  4: { icon: Zap, color: "#5856D6" },
                  5: { icon: Flame, color: "#FF3B30" },
                  6: { icon: CalendarDays, color: "#34C759" },
                  7: { icon: TrendingUp, color: "#34C759" },
                  8: { icon: AlertTriangle, color: "#FF9500" },
                  9: { icon: Shield, color: "#0071E3" },
                  10: { icon: CalendarDays, color: "#5856D6" },
                  11: { icon: Award, color: "#0071E3" },
                };

                const renderBullets = (bullets: string[]) => (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {bullets.map((b, i) => {
                      const isPos = b.startsWith("✓ ");
                      const isWarn = b.startsWith("⚠ ");
                      const text = (isPos || isWarn) ? b.slice(2) : b;
                      const c = isPos ? "#34C759" : isWarn ? "#FF9500" : "#6E6E73";
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          {isPos ? (
                            <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <CheckCircle style={{ width: 11, height: 11, color: c, strokeWidth: 2.5 }} />
                            </div>
                          ) : isWarn ? (
                            <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <AlertTriangle style={{ width: 11, height: 11, color: c, strokeWidth: 2.5 }} />
                            </div>
                          ) : (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, marginTop: 7, flexShrink: 0, opacity: 0.5 }} />
                          )}
                          <span style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.7 }} lang="de">{hyphenateText(text)}</span>
                        </div>
                      );
                    })}
                  </div>
                );

                const renderProfileBars = (label: string, triad: Triad, accent: string) => (
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>{label}</p>
                    {(["impulsiv", "intuitiv", "analytisch"] as const).map(k => {
                      const val = triad[k];
                      const color = k === "impulsiv" ? "#C41E3A" : k === "intuitiv" ? "#F39200" : "#1A5DAB";
                      const lbl = k === "impulsiv" ? "Impulsiv" : k === "intuitiv" ? "Intuitiv" : "Analytisch";
                      return (
                        <div key={k} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: "#6E6E73" }}>{lbl}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round(val)}</span>
                          </div>
                          <div style={{ height: 7, borderRadius: 4, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}BB)`, width: `${(val / 67) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );

                return detailReport.map((sec) => {
                  const meta = SECTION_META[sec.num] || { icon: Target, color: "#0071E3" };
                  const Icon = meta.icon;

                  return (
                    <GlassCard key={sec.num} style={{ padding: "30px 28px" }} data-testid={`report-section-${sec.num}`}>
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 12,
                          background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginRight: 14, flexShrink: 0,
                          boxShadow: `0 4px 12px ${meta.color}30`,
                        }}>
                          <Icon style={{ width: 16, height: 16, color: "#FFF", strokeWidth: 2.2 }} />
                        </div>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{String(sec.num).padStart(2, "0")}</span>
                          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }}>{sec.title}</h2>
                        </div>
                      </div>

                      {sec.num === 2 && (
                        <div style={{
                          display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20,
                          background: "rgba(255,255,255,0.7)", borderRadius: 22, padding: "20px 22px",
                          border: "1px solid rgba(0,0,0,0.05)",
                        }}>
                          {renderProfileBars(isLeading ? "Führungskraft" : "Teammitglied", kandidat, "#F39200")}
                          <div style={{ width: 1, background: "rgba(0,0,0,0.06)", margin: "0 4px", alignSelf: "stretch" }} />
                          {renderProfileBars("Team", team, "#34C759")}
                        </div>
                      )}

                      {sec.num === 3 && (
                        <div style={{
                          display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap",
                        }}>
                          {[
                            { label: isLeading ? "Führungskraft" : "Teammitglied", value: result.diagnose.kandidatDominanz, color: "#F39200" },
                            { label: "Verschiebung", value: result.diagnose.kandidatDominanz === result.diagnose.teamDominanz ? "Verstärkung" : "Strukturwechsel", color: result.diagnose.kandidatDominanz === result.diagnose.teamDominanz ? "#34C759" : "#FF9500" },
                            { label: "Team", value: result.diagnose.teamDominanz, color: "#34C759" },
                          ].map((item, i) => (
                            <div key={i} style={{
                              flex: 1, minWidth: 120, padding: "14px 16px", borderRadius: 16,
                              background: `linear-gradient(135deg, ${item.color}08, ${item.color}03)`,
                              border: `1px solid ${item.color}15`,
                              textAlign: "center",
                            }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{item.label}</p>
                              <p style={{ fontSize: 15, fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.num === 5 && (
                        <div style={{
                          display: "flex", gap: 8, marginBottom: 18,
                        }}>
                          {[
                            { label: "Normal", icon: CheckCircle, color: "#34C759", bg: "rgba(52,199,89,0.08)" },
                            { label: "Kontrollierter Stress", icon: Activity, color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
                            { label: "Unkontrollierter Stress", icon: Flame, color: "#FF3B30", bg: "rgba(255,59,48,0.08)" },
                          ].map((phase, i) => (
                            <div key={i} style={{
                              flex: 1, padding: "10px 12px", borderRadius: 14, background: phase.bg,
                              display: "flex", alignItems: "center", gap: 8, border: `1px solid ${phase.color}15`,
                            }}>
                              <phase.icon style={{ width: 14, height: 14, color: phase.color, strokeWidth: 2.2, flexShrink: 0 }} />
                              <span style={{ fontSize: 11, fontWeight: 600, color: phase.color }}>{phase.label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.num === 6 && sec.subsections && (
                        <div style={{
                          position: "relative", paddingLeft: 24, marginBottom: 16,
                          borderLeft: "3px solid linear-gradient(180deg, #34C759, #0071E3, #5856D6)",
                        }}>
                          <div style={{ position: "absolute", left: -2, top: 0, bottom: 0, width: 3, borderRadius: 2, background: "linear-gradient(180deg, #34C759, #0071E3, #5856D6)" }} />
                          {sec.subsections.map((phase, pi) => {
                            const phaseColors = ["#34C759", "#0071E3", "#5856D6"];
                            const phaseIcons = [Target, Zap, Award];
                            const PhIcon = phaseIcons[pi] || Target;
                            const pColor = phaseColors[pi] || "#0071E3";
                            return (
                              <div key={pi} style={{ marginBottom: pi < sec.subsections!.length - 1 ? 20 : 0, position: "relative" }}>
                                <div style={{
                                  position: "absolute", left: -33, top: 2,
                                  width: 20, height: 20, borderRadius: "50%",
                                  background: pColor, display: "flex", alignItems: "center", justifyContent: "center",
                                  boxShadow: `0 2px 8px ${pColor}40`,
                                }}>
                                  <PhIcon style={{ width: 10, height: 10, color: "#FFF", strokeWidth: 2.5 }} />
                                </div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: pColor, margin: "0 0 6px" }}>{phase.title}</h4>
                                {phase.paragraphs?.map((p, ppi) => (
                                  <p key={ppi} style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: "0 0 8px" }} lang="de">{hyphenateText(p)}</p>
                                ))}
                                {phase.bullets && renderBullets(phase.bullets)}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(sec.num === 7 || sec.num === 8) && sec.bullets && (
                        <div style={{
                          background: sec.num === 7 ? "rgba(52,199,89,0.04)" : "rgba(255,149,0,0.04)",
                          borderRadius: 18, padding: "18px 20px", marginBottom: 12,
                          border: `1px solid ${sec.num === 7 ? "rgba(52,199,89,0.12)" : "rgba(255,149,0,0.12)"}`,
                        }}>
                          {renderBullets(sec.bullets)}
                        </div>
                      )}

                      {sec.num === 10 && sec.subsections && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
                          {sec.subsections.map((phase, pi) => {
                            const phaseColors = ["#34C759", "#0071E3", "#5856D6"];
                            const pColor = phaseColors[pi] || "#0071E3";
                            return (
                              <div key={pi} style={{
                                borderRadius: 18, padding: "18px 20px 14px",
                                background: `linear-gradient(135deg, ${pColor}06, ${pColor}02)`,
                                border: `1px solid ${pColor}15`,
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                  <div style={{
                                    width: 24, height: 24, borderRadius: 8,
                                    background: `${pColor}15`, display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: pColor }}>{pi + 1}</span>
                                  </div>
                                  <h4 style={{ fontSize: 13, fontWeight: 700, color: pColor, margin: 0 }}>{phase.title}</h4>
                                </div>
                                {phase.paragraphs?.map((p, ppi) => (
                                  <p key={ppi} style={{ fontSize: 12, color: "#48484A", lineHeight: 1.7, margin: "0 0 6px" }} lang="de">{hyphenateText(p)}</p>
                                ))}
                                {phase.bullets && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                                    {phase.bullets.map((b, bi) => (
                                      <div key={bi} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: pColor, marginTop: 6, flexShrink: 0, opacity: 0.5 }} />
                                        <span style={{ fontSize: 11.5, color: "#3A3A3C", lineHeight: 1.6 }}>{b}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {sec.num === 11 && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                          borderRadius: 18, marginBottom: 16,
                          background: `linear-gradient(135deg, ${tl.fill}08, ${tl.fill}03)`,
                          border: `1px solid ${tl.fill}18`,
                        }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: 16,
                            background: `linear-gradient(135deg, ${tl.fill}20, ${tl.fill}08)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: `0 4px 16px ${tl.fill}20`,
                          }}>
                            <TrafficLightAmpel tl={tdResult.trafficLight} />
                          </div>
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px" }}>Gesamtbewertung</p>
                            <p style={{ fontSize: 16, fontWeight: 700, color: tl.fill, margin: 0 }}>{tl.label}</p>
                          </div>
                        </div>
                      )}

                      {![6, 7, 8, 10].includes(sec.num) && sec.paragraphs && sec.paragraphs.length > 0 && (() => {
                        const first = sec.paragraphs[0];
                        const rest = sec.paragraphs.slice(1);
                        return (
                          <>
                            <div style={{
                              padding: "16px 20px", borderRadius: 18,
                              background: `linear-gradient(135deg, ${meta.color}0A, ${meta.color}04)`,
                              border: `1px solid ${meta.color}15`,
                              display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14,
                            }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                                background: `${meta.color}14`, display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <Lightbulb style={{ width: 14, height: 14, color: meta.color, strokeWidth: 2 }} />
                              </div>
                              <p style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.75, margin: 0, fontWeight: 450 }} lang="de">{hyphenateText(first)}</p>
                            </div>
                            {rest.map((p, i) => (
                              <p key={i} style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.9, margin: "0 0 10px" }} lang="de">{hyphenateText(p)}</p>
                            ))}
                          </>
                        );
                      })()}

                      {(sec.num === 7 || sec.num === 8) && sec.paragraphs?.map((p, i) => (
                        <p key={i} style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.9, margin: "0 0 10px" }} lang="de">{hyphenateText(p)}</p>
                      ))}

                      {![7, 8].includes(sec.num) && sec.bullets && (
                        <div style={{ marginTop: 6, marginBottom: 12 }}>
                          {renderBullets(sec.bullets)}
                        </div>
                      )}

                      {sec.num !== 6 && sec.num !== 10 && sec.subsections?.map((sub, si) => (
                        <div key={si} style={{ marginTop: sub.title ? 18 : 10 }}>
                          {sub.title && (
                            <h3 style={{ fontSize: 15, fontWeight: 650, color: "#1D1D1F", margin: "0 0 10px" }}>{sub.title}</h3>
                          )}
                          {sub.paragraphs?.map((p, pi) => (
                            <p key={pi} style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.9, margin: "0 0 10px" }} lang="de">{hyphenateText(p)}</p>
                          ))}
                          {sub.bullets && <div style={{ marginBottom: 10 }}>{renderBullets(sub.bullets)}</div>}
                          {sub.highlight && (
                            <div style={{
                              padding: "16px 20px", borderRadius: 18, marginTop: 12,
                              background: `linear-gradient(135deg, ${meta.color}08, ${meta.color}03)`,
                              border: `1px solid ${meta.color}12`,
                              borderLeft: `4px solid ${meta.color}`,
                            }}>
                              <p style={{ fontSize: 13.5, color: "#1D1D1F", lineHeight: 1.75, margin: 0, fontWeight: 550 }} lang="de">{hyphenateText(sub.highlight)}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </GlassCard>
                  );
                });
              })()}
            </>
          ) : (
            <>{(() => {
              const EXEC_SEC_META: { icon: typeof Target; color: string }[][] = [
                [
                  { icon: Users, color: "#0071E3" },
                  { icon: Zap, color: "#5856D6" },
                  { icon: Flame, color: "#FF3B30" },
                  { icon: TrendingUp, color: "#34C759" },
                  { icon: AlertTriangle, color: "#FF9500" },
                  { icon: Award, color: "#0071E3" },
                ],
                [
                  { icon: CalendarDays, color: "#34C759" },
                  { icon: Gauge, color: "#5856D6" },
                  { icon: Shield, color: "#0071E3" },
                  { icon: Target, color: "#34C759" },
                  { icon: Award, color: "#0071E3" },
                ],
              ];

              const renderExecBullets = (bullets: string[]) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {bullets.map((b, i) => {
                    const isPos = b.startsWith("✓ ");
                    const isWarn = b.startsWith("⚠ ");
                    const text = (isPos || isWarn) ? b.slice(2) : b;
                    const c = isPos ? "#34C759" : isWarn ? "#FF9500" : "#6E6E73";
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        {isPos ? (
                          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CheckCircle style={{ width: 11, height: 11, color: c, strokeWidth: 2.5 }} />
                          </div>
                        ) : isWarn ? (
                          <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1, background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <AlertTriangle style={{ width: 11, height: 11, color: c, strokeWidth: 2.5 }} />
                          </div>
                        ) : (
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, marginTop: 7, flexShrink: 0, opacity: 0.5 }} />
                        )}
                        <span style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.7 }} lang="de">{hyphenateText(text)}</span>
                      </div>
                    );
                  })}
                </div>
              );

              return (
                <>
                  {/* Executive Hero */}
                  <GlassCard style={{ padding: "36px 32px 30px", textAlign: "center", position: "relative", overflow: "hidden" }} data-testid="exec-header">
                    <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, rgba(52,199,89,0.06), rgba(52,170,220,0.04))", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, rgba(0,113,227,0.04), rgba(52,170,220,0.03))", pointerEvents: "none" }} />
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "linear-gradient(135deg, rgba(52,199,89,0.1), rgba(52,199,89,0.05))",
                      borderRadius: 20, padding: "5px 14px", marginBottom: 14,
                    }}>
                      <Briefcase style={{ width: 12, height: 12, color: "#34C759" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#34C759", textTransform: "uppercase", letterSpacing: "0.12em" }}>Executive Summary</span>
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.15, marginBottom: 6 }}>{beruf}</h1>
                    <p style={{ fontSize: 13, color: "#8E8E93", marginBottom: 18 }}>{bereich || "Systemische Analyse zur Besetzung"}</p>

                    <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A3C", background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10 }}>
                        {isLeading ? "Führungsposition" : "Teammitglied"}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A3C", background: "rgba(0,0,0,0.04)", padding: "6px 14px", borderRadius: 10 }}>
                        {result.diagnose.kandidatDominanz}
                      </span>
                    </div>

                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 12,
                      padding: "10px 20px", borderRadius: 16,
                      background: `${tl.bg}`,
                      border: `1px solid ${tl.fill}20`,
                    }}>
                      <TrafficLightAmpel tl={tdResult.trafficLight} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: tl.fill }}>{tl.label}</span>
                    </div>
                  </GlassCard>

                  {/* Quick KPI strip */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { label: isLeading ? "Führungskraft" : "Kandidat", value: result.diagnose.kandidatDominanz, color: "#F39200", icon: Users },
                      { label: "Verschiebung", value: result.diagnose.kandidatDominanz === result.diagnose.teamDominanz ? "Verstärkung" : "Strukturwechsel", color: result.diagnose.kandidatDominanz === result.diagnose.teamDominanz ? "#34C759" : "#FF9500", icon: Activity },
                      { label: "Team", value: result.diagnose.teamDominanz, color: "#34C759", icon: Users },
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

                  {execReport.map((page) => (
                    <div key={page.pageNum} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {page.pageNum === 2 && (
                        <div style={{ height: 1, margin: "12px 28px", background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 30%, rgba(0,0,0,0.06) 70%, transparent 100%)" }} />
                      )}
                      {page.pageNum === 2 && (
                        <GlassCard style={{ padding: "20px 28px", textAlign: "center" }}>
                          <h2 style={{ fontSize: 20, fontWeight: 750, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }}>{page.title}</h2>
                        </GlassCard>
                      )}

                      {page.sections.map((sec, si) => {
                        const meta = EXEC_SEC_META[page.pageNum - 1]?.[si] || { icon: Target, color: "#0071E3" };
                        const SIcon = meta.icon;
                        const isChancen = sec.title === "Chancen";
                        const isRisiken = sec.title === "Risiken";
                        const isStress = sec.title === "Verhalten unter Druck";
                        const isGesamt = sec.title === "Gesamtbewertung" || sec.title === "Abschließendes Urteil";
                        const isPrognose = sec.title === "Prognose";
                        const isKPI = sec.title === "Messbare Steuerungsindikatoren";

                        return (
                          <GlassCard key={si} style={{ padding: "26px 26px" }} data-testid={`exec-section-${page.pageNum}-${si}`}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: `0 3px 10px ${meta.color}25`, flexShrink: 0,
                              }}>
                                <SIcon style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
                              </div>
                              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{sec.title}</h3>
                            </div>

                            {isStress && (
                              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                                {[
                                  { label: "Normal", color: "#34C759", icon: CheckCircle },
                                  { label: "Kontrolliert", color: "#FF9500", icon: Activity },
                                  { label: "Unkontrolliert", color: "#FF3B30", icon: Flame },
                                ].map((ph, pi) => (
                                  <div key={pi} style={{
                                    flex: 1, minWidth: 100, padding: "8px 10px", borderRadius: 12,
                                    background: `${ph.color}08`, border: `1px solid ${ph.color}15`,
                                    display: "flex", alignItems: "center", gap: 6,
                                  }}>
                                    <ph.icon style={{ width: 12, height: 12, color: ph.color, strokeWidth: 2.2, flexShrink: 0 }} />
                                    <span style={{ fontSize: 10, fontWeight: 600, color: ph.color }}>{ph.label}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {isPrognose && sec.paragraphs && (
                              <div style={{ position: "relative", paddingLeft: 20, marginBottom: 12 }}>
                                <div style={{ position: "absolute", left: -1, top: 0, bottom: 0, width: 3, borderRadius: 2, background: "linear-gradient(180deg, #34C759, #0071E3, #5856D6)" }} />
                                {sec.paragraphs.map((p, pi) => {
                                  const phColors = ["#34C759", "#0071E3", "#5856D6"];
                                  const pCol = phColors[pi] || "#0071E3";
                                  return (
                                    <div key={pi} style={{ position: "relative", marginBottom: pi < sec.paragraphs!.length - 1 ? 14 : 0 }}>
                                      <div style={{
                                        position: "absolute", left: -27, top: 3,
                                        width: 14, height: 14, borderRadius: "50%",
                                        background: pCol, boxShadow: `0 2px 6px ${pCol}40`,
                                      }} />
                                      <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: 0, fontWeight: 450 }} lang="de">{hyphenateText(p)}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {isKPI && sec.bullets && (
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                                {sec.bullets.map((b, bi) => (
                                  <div key={bi} style={{
                                    flex: "1 1 calc(50% - 5px)", minWidth: 160,
                                    padding: "12px 14px", borderRadius: 14,
                                    background: "rgba(88,86,214,0.05)", border: "1px solid rgba(88,86,214,0.10)",
                                    display: "flex", alignItems: "center", gap: 8,
                                  }}>
                                    <div style={{
                                      width: 20, height: 20, borderRadius: 6,
                                      background: "rgba(88,86,214,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    }}>
                                      <Gauge style={{ width: 10, height: 10, color: "#5856D6", strokeWidth: 2.5 }} />
                                    </div>
                                    <span style={{ fontSize: 12, color: "#3A3A3C", lineHeight: 1.5, fontWeight: 500 }}>{b}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {(isChancen || isRisiken) && sec.bullets && (
                              <div style={{
                                background: isChancen ? "rgba(52,199,89,0.04)" : "rgba(255,149,0,0.04)",
                                borderRadius: 16, padding: "16px 18px", marginBottom: 10,
                                border: `1px solid ${isChancen ? "rgba(52,199,89,0.12)" : "rgba(255,149,0,0.12)"}`,
                              }}>
                                {renderExecBullets(sec.bullets)}
                              </div>
                            )}

                            {isGesamt && (
                              <div style={{
                                display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                                borderRadius: 16, marginBottom: 12,
                                background: `${tl.bg}`, border: `1px solid ${tl.fill}18`,
                              }}>
                                <TrafficLightAmpel tl={tdResult.trafficLight} />
                                <span style={{ fontSize: 14, fontWeight: 700, color: tl.fill }}>{tl.label}</span>
                              </div>
                            )}

                            {!isPrognose && !isKPI && sec.paragraphs?.map((p, pi) => (
                              <p key={pi} style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.8, margin: "0 0 8px" }} lang="de">{hyphenateText(p)}</p>
                            ))}

                            {!isChancen && !isRisiken && !isKPI && sec.bullets && (
                              <div style={{ marginTop: 8 }}>
                                {renderExecBullets(sec.bullets)}
                              </div>
                            )}

                            {sec.highlight && (
                              <div style={{
                                padding: "16px 20px", borderRadius: 18, marginTop: 14,
                                background: `linear-gradient(135deg, ${meta.color}08, ${meta.color}03)`,
                                border: `1px solid ${meta.color}12`,
                                borderLeft: `4px solid ${meta.color}`,
                              }}>
                                <p style={{ fontSize: 13.5, color: "#1D1D1F", lineHeight: 1.7, margin: 0, fontWeight: 600 }} lang="de">{hyphenateText(sec.highlight)}</p>
                              </div>
                            )}
                          </GlassCard>
                        );
                      })}
                    </div>
                  ))}
                </>
              );
            })()}</>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F5F5F7 0%, #FBFBFD 40%, #F5F5F7 100%)" }}>
      <GlobalNav />

      <div style={{
        position: "sticky", top: 48, zIndex: 90,
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
          Detailanalyse
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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* ═══ META HEADER ═══ */}
        <div style={{
          padding: "28px 32px 24px", borderRadius: 18, marginBottom: 28,
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
            Als PDF exportieren
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", margin: "0 0 2px", letterSpacing: "-0.02em" }}>bioLogic-TeamCheck</h2>
          <p style={{ fontSize: 12, color: "#8E8E93", margin: "0 0 18px", fontWeight: 500 }}>Recruiting-Entscheidungsgrundlage – Level 2</p>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 6, columnGap: 16, fontSize: 13 }}>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>Position:</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-position">{beruf}</span>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>Bereich:</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-bereich">{bereich || "–"}</span>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>Fokus:</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-fokus">{erfolgsfokusLabels.length > 0 ? erfolgsfokusLabels.join(", ") : "–"}</span>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>Rollencharakter:</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-charakter">{aufgabencharakter || "–"}</span>
            <span style={{ color: "#8E8E93", fontWeight: 500 }}>Datum:</span>
            <span style={{ color: "#3A3A3C", fontWeight: 600 }} data-testid="meta-datum">{new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
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
            {hyphenateText(result.systemwirkung.headline)}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* SECTION 1: DIAGNOSE */}
          <GlassCard data-testid="section-diagnose">
            <SectionHeader num={1} title="DIAGNOSE" icon={BarChart3} />

            {/* Rolle + Teamgröße */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>Rolle der neuen Person</p>
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
                    >{val ? "Führung" : "Teammitglied"}</button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", margin: "0 0 10px" }}>Teamgröße</p>
                <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3, marginBottom: 6 }}>
                  {(["KLEIN", "MITTEL", "GROSS"] as TeamSize[]).map(size => {
                    const labels: Record<TeamSize, string> = { KLEIN: "Klein (2–5)", MITTEL: "Mittel (6–12)", GROSS: "Groß (13+)" };
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
                  {teamSize === "KLEIN" ? "Kleine Teams: Jede Person hat hohen Einfluss auf die Dynamik." : teamSize === "GROSS" ? "Große Teams: Einzelpersonen verändern die Gesamtdynamik weniger stark." : "Mittlere Teams: Spürbarer, aber begrenzter Einfluss pro Person."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <ProfileCard title="Rollen-DNA (Soll)" num={1} triad={soll} dominanz={result.diagnose.sollDominanz} color="#0071E3" />
              <ProfileCard title="Kandidatenprofil (Ist)" num={2} triad={kandidat} dominanz={result.diagnose.kandidatDominanz} color="#F39200" onChange={setKandidat} testIdPrefix="slider-kand" />
              <ProfileCard title="Teamprofil (Ist)" num={3} triad={team} dominanz={result.diagnose.teamDominanz} color="#34C759" onChange={setTeam} testIdPrefix="slider-team" />
            </div>

            <div data-testid="diagnose-summary" style={{
              padding: "16px 20px", borderRadius: 14, marginBottom: 20,
              background: "rgba(142,142,147,0.08)",
            }}>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.7, margin: 0, fontWeight: 450 }} lang="de">
                {hyphenateText(generateDiagnoseSummary(kandidat, team, isLeading))}
              </p>
            </div>

            {/* Executive Header – Ampel + Headline + Detail */}
            {(() => {
              const tlKey = tdResult.trafficLight;
              const detail: Record<TrafficLight, { title: string; desc: string; bullets: string[]; recLabel: string; rec: string }> = {
                RED: {
                  title: "Deutliche Spannungen – klare Führung notwendig",
                  desc: "Arbeitslogiken unterscheiden sich stark. Ohne aktive Steuerung entstehen Leistungs- und Konfliktrisiken.",
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
                  bullets: [
                    "Entscheidungen werden schnell verstanden und akzeptiert.",
                    "Abstimmungen laufen reibungslos.",
                    "Tempo und Qualität bleiben stabil.",
                  ],
                  recLabel: "Was ist zu tun?",
                  rec: "Normale Führung und regelmäßige Abstimmung reichen aus.",
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
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: tl.bg, color: tl.fill }} data-testid="badge-status">{tl.label}</span>
                      </div>
                      <p style={{ fontSize: 12, color: "#8E8E93", margin: "4px 0 0", lineHeight: 1.5 }} data-testid="text-headline" lang="de">
                        {hyphenateText(tdResult.headline)}
                      </p>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }} data-testid="detail-title">{d.title}</p>
                    <p style={{ fontSize: 12, color: "#48484A", margin: "0 0 12px", lineHeight: 1.6 }} lang="de" data-testid="detail-desc">{hyphenateText(d.desc)}</p>

                    <p style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Was bedeutet das konkret?</p>
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
                </div>
              );
            })()}
          </GlassCard>

          {/* SECTIONS 2–6: Tabbed Detail Card */}
          <GlassCard data-testid="section-detail-tabs">
            <div style={{ display: "flex", gap: 3, background: "rgba(0,0,0,0.03)", borderRadius: 10, padding: 3, marginBottom: 26 }}>
              {([
                ["system", "Systemwirkung", Zap],
                ["stress", "Stressprofil", AlertTriangle],
                ["hebel", "Führungshebel", Flame],
                ["prognose", "Prognose", Clock],
                ["empfehlung", "Empfehlungen", Target],
                ["urteil", "Gesamturteil", Shield],
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

              {/* TAB: SYSTEMWIRKUNG */}
              {detailTab === "system" && (
                <div data-testid="content-system">
                  <SectionHeader num={2} title="SYSTEMWIRKUNG" icon={Zap} />

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <CheckCircle style={{ width: 16, height: 16, color: "#34C759", strokeWidth: 2.5 }} />
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Entscheidungslogik</h3>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", margin: "0 0 6px", letterSpacing: "0.04em" }}>Bisher</p>
                      <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">{hyphenateText(result.systemwirkung.entscheidungslogik.bisher)}</p>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", margin: "14px 0 6px", letterSpacing: "0.04em" }}>Mit {isLeading ? "der neuen Führungskraft" : "dem neuen Teammitglied"}</p>
                      <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">{hyphenateText(result.systemwirkung.entscheidungslogik.mitNeu)}</p>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", margin: "14px 0 6px", letterSpacing: "0.04em" }}>Für {isLeading ? "die Führungskraft" : "das Teammitglied"}</p>
                      <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">{hyphenateText(result.systemwirkung.entscheidungslogik.fuerFK)}</p>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)", margin: "0 0 24px" }} />

                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <CheckCircle style={{ width: 16, height: 16, color: "#34C759", strokeWidth: 2.5 }} />
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Prozesswirkung</h3>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <BulletList items={result.systemwirkung.prozessWirkung.positiv} color="#34C759" icon="dot" />
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <BulletList items={result.systemwirkung.prozessWirkung.negativ} color="#FF9500" icon="dot" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)", margin: "24px 0" }} />

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <CheckCircle style={{ width: 16, height: 16, color: "#34C759", strokeWidth: 2.5 }} />
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Qualitäts- und Fehlerwirkung</h3>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <BulletList items={result.systemwirkung.qualitaetsWirkung.positiv} color="#34C759" icon="dot" />
                      </div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <BulletList items={result.systemwirkung.qualitaetsWirkung.negativ} color="#FF9500" icon="dot" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: STRESSPROFIL */}
              {detailTab === "stress" && (
                <div data-testid="content-stress">
                  <SectionHeader num={3} title="STRESSPROFIL" icon={AlertTriangle} />
                  <p style={{ fontSize: 13.5, color: "#48484A", lineHeight: 1.75, margin: "0 0 18px" }} lang="de">
                    {hyphenateText(result.stressprofil.normalState)}
                  </p>
                  <div style={{
                    padding: "16px 20px", borderRadius: 16,
                    background: "rgba(255,59,48,0.04)", border: "1px solid rgba(255,59,48,0.10)",
                    marginBottom: 16,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#FF3B30", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Unkontrollierter Stress
                    </p>
                    <BulletList items={result.stressprofil.unkontrolliert} color="#FF3B30" icon="warning" />
                  </div>
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, margin: "0 0 14px" }} lang="de">
                    {hyphenateText(result.stressprofil.zweitKomponente)}
                  </p>
                  <div style={{
                    padding: "14px 18px", borderRadius: 14,
                    background: "rgba(0,113,227,0.04)", border: "1px solid rgba(0,113,227,0.10)",
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#0071E3", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Steuerung</p>
                    <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">
                      {hyphenateText(result.stressprofil.steuerung)}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: FÜHRUNGSHEBEL */}
              {detailTab === "hebel" && (
                <div data-testid="content-hebel">
                  <SectionHeader num={3} title="FÜHRUNGSHEBEL" icon={Flame} />
                  <p style={{ fontSize: 12, color: "#8E8E93", margin: "0 0 18px", fontWeight: 500 }}>Konkrete Steuerungsmaßnahmen für diese Führungskraft-Team-Kombination</p>

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
                      <p style={{ fontSize: 13, color: "#8E8E93", margin: 0 }}>Führungshebel werden nur im Führungsmodus angezeigt. Bitte „Führung" im Diagnose-Bereich aktivieren.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PROGNOSE */}
              {detailTab === "prognose" && (
                <div data-testid="content-prognose">
                  <SectionHeader num={4} title="PROGNOSE (90-TAGE-PERSPEKTIVE)" icon={Clock} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {result.prognose.phases.map((phase, i) => (
                      <div key={i} style={{
                        padding: "18px 20px", borderRadius: 18,
                        background: i === 0 ? "rgba(255,149,0,0.04)" : i === 1 ? "rgba(0,113,227,0.04)" : "rgba(52,199,89,0.04)",
                        border: `1px solid ${i === 0 ? "rgba(255,149,0,0.10)" : i === 1 ? "rgba(0,113,227,0.10)" : "rgba(52,199,89,0.10)"}`,
                      }} data-testid={`prognose-phase-${i}`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 9,
                            background: i === 0 ? "#FF9500" : i === 1 ? "#0071E3" : "#34C759",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF" }}>P{i + 1}</span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{phase.label}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: "0 0 8px" }} lang="de">
                          {hyphenateText(phase.description)}
                        </p>
                        {phase.bullets.length > 0 && (
                          <BulletList items={phase.bullets} color={i === 0 ? "#FF9500" : i === 1 ? "#0071E3" : "#34C759"} icon="dot" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: EMPFEHLUNGEN */}
              {detailTab === "empfehlung" && (
                <div data-testid="content-empfehlung">
                  <SectionHeader num={5} title="HANDLUNGSEMPFEHLUNGEN" icon={Target} />
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                    <div style={{
                      flex: 1, minWidth: 180, padding: "18px 16px", borderRadius: 18,
                      background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.10)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <CheckCircle style={{ width: 15, height: 15, color: "#34C759", strokeWidth: 2.5 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Kernchancen</span>
                      </div>
                      <BulletList items={result.handlungsempfehlungen.kernchancen} color="#34C759" icon="dot" />
                    </div>
                    <div style={{
                      flex: 1, minWidth: 180, padding: "18px 16px", borderRadius: 18,
                      background: "rgba(255,59,48,0.04)", border: "1px solid rgba(255,59,48,0.10)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <AlertTriangle style={{ width: 15, height: 15, color: "#FF3B30", strokeWidth: 2.5 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Risiken</span>
                      </div>
                      <BulletList items={result.handlungsempfehlungen.kernrisiken} color="#FF3B30" icon="dot" />
                    </div>
                    <div style={{
                      flex: 1, minWidth: 180, padding: "18px 16px", borderRadius: 18,
                      background: "rgba(0,113,227,0.04)", border: "1px solid rgba(0,113,227,0.10)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <Zap style={{ width: 15, height: 15, color: "#0071E3", strokeWidth: 2.5 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Top 3 Hebel</span>
                      </div>
                      <BulletList items={result.handlungsempfehlungen.topHebel} color="#0071E3" icon="check" />
                    </div>
                  </div>

                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)", margin: "0 0 24px" }} />

                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{
                      flex: 1, minWidth: 220, padding: "16px 18px", borderRadius: 16,
                      background: "rgba(255,149,0,0.04)", border: "1px solid rgba(255,149,0,0.10)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <AlertTriangle style={{ width: 15, height: 15, color: "#FF9500", strokeWidth: 2.5 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Eskalationsrisiko: {result.eskalationsrisiko.level}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: "0 0 10px" }} lang="de">{hyphenateText(result.eskalationsrisiko.description)}</p>
                      {result.eskalationsrisiko.triggers.length > 0 && (
                        <BulletList items={result.eskalationsrisiko.triggers} color="#FF9500" icon="warning" />
                      )}
                    </div>
                    <div style={{
                      flex: 1, minWidth: 220, padding: "16px 18px", borderRadius: 16,
                      background: "rgba(0,113,227,0.04)", border: "1px solid rgba(0,113,227,0.10)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <Shield style={{ width: 15, height: 15, color: "#0071E3", strokeWidth: 2.5 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Steuerbarkeit: {result.steuerbarkeit.bewertung}</span>
                      </div>
                      {result.steuerbarkeit.bedingungen.length > 0 && (
                        <BulletList items={result.steuerbarkeit.bedingungen} color="#0071E3" icon="check" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: GESAMTURTEIL */}
              {detailTab === "urteil" && (
                <div data-testid="content-urteil">
                  <SectionHeader num={6} title="GESAMTURTEIL" icon={Shield} />

                  <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                    {(["STRATEGISCH_CHANCEN", "ENTWICKLUNGSFAEHIG", "NO_GO"] as UrteilBadge[]).map(badge => {
                      const active = result.gesamturteil.badges.includes(badge);
                      const cfg = BADGE_CONFIG[badge];
                      return (
                        <div key={badge} style={{
                          padding: "8px 18px", borderRadius: 10,
                          background: active ? cfg.bg : "rgba(0,0,0,0.03)",
                          border: `1px solid ${active ? cfg.color + "25" : "rgba(0,0,0,0.06)"}`,
                          display: "flex", alignItems: "center", gap: 6,
                        }} data-testid={`badge-${badge.toLowerCase()}`}>
                          <CheckCircle style={{ width: 14, height: 14, color: active ? cfg.color : "#C7C7CC", strokeWidth: 2.5 }} />
                          <span style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? cfg.color : "#C7C7CC" }}>{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                    {[
                      { label: "Einschätzung", text: result.gesamturteil.einschaetzung, icon: "✓", color: "#34C759" },
                      { label: "Eskalationsrisiko", text: result.gesamturteil.eskalationsrisiko, icon: "⚠", color: "#FF9500" },
                      { label: "Risikoindikator", text: result.gesamturteil.risikoindikator, icon: "◉", color: "#FF3B30" },
                      { label: "Empfehlung", text: result.gesamturteil.empfehlung, icon: "→", color: "#0071E3" },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "12px 16px", borderRadius: 14,
                        background: `${item.color}06`, border: `1px solid ${item.color}12`,
                      }}>
                        <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1D1D1F", display: "block", marginBottom: 3 }}>{item.label}</span>
                          <span style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65 }} lang="de">{hyphenateText(item.text)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    padding: "16px 20px", borderRadius: 16,
                    background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,199,89,0.04))",
                    border: "1px solid rgba(0,113,227,0.10)",
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#0071E3", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Fazit</p>
                    <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.65, margin: 0 }} lang="de">
                      {hyphenateText(isLeading
                        ? "Die Konstellation ist kein strukturelles No-Go, sondern ein klarer Entwicklungs- und Führungsfall. Entscheidend ist, ob die Steuerungsbereitschaft vorhanden ist und die ersten 90 Tage aktiv gestaltet werden."
                        : "Die Konstellation ist kein strukturelles No-Go, sondern ein klarer Integrations- und Entwicklungsfall. Entscheidend ist, ob die Einbindung aktiv gestaltet wird und die ersten 90 Tage bewusst begleitet werden."
                      )}
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
