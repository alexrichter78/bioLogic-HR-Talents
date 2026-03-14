import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import {
  computeTeamCheckV3,
  type TeamCheckV3Input,
  type TeamCheckV3Result,
} from "@/lib/teamcheck-v3-engine";
import { ArrowLeft, BarChart3, Users, Zap, Shield, Layers, Activity, Flame, Clock, Sparkles, AlertTriangle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { COMP_HEX, TC_SECTION_COLORS, BIO_COLORS } from "@/lib/bio-design";
import { buildTeamCheckPdf } from "@/lib/teamcheck-pdf-builder";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

function passungColor(p: string): string {
  if (p === "Passend") return BIO_COLORS.geeignet;
  if (p === "Bedingt passend") return BIO_COLORS.bedingt;
  return BIO_COLORS.nichtGeeignet;
}

function steuerColor(s: string): string {
  if (s === "gering") return BIO_COLORS.geeignet;
  if (s === "mittel") return BIO_COLORS.bedingt;
  return BIO_COLORS.nichtGeeignet;
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((p, i) => (
        <p key={i} style={{ margin: i > 0 ? "10px 0 0" : "0", color: "#48484A", lineHeight: 1.85, fontSize: 14 }}>{p}</p>
      ))}
    </>
  );
}

function SectionHead({ num, icon: Icon, title, iconColor }: { num: number; icon?: any; title: string; iconColor?: string }) {
  return (
    <div className="bio-section-head" style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24, borderRadius: 10, overflow: "hidden", background: iconColor || "#1A5DAB" }}>
      <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "#FFF" }}>{num}</span>
      </div>
      {Icon && (
        <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon style={{ width: 15, height: 15, color: "#FFF", strokeWidth: 2.2 }} />
        </div>
      )}
      <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0 16px" }}>{title}</span>
    </div>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 54px", gap: 10, alignItems: "center" }}>
      <div style={{ fontSize: 13, color: "#6E6E73", fontWeight: 600 }}>{label}</div>
      <div style={{ position: "relative", height: 16, borderRadius: 999, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}CC)`, width: `${value}%`, boxShadow: `0 0 12px ${color}30`, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>{value} %</div>
    </div>
  );
}

const sectionIcons = [BarChart3, CheckCircle2, Zap, Activity, Layers, Users, Shield, Flame, Clock, Sparkles, AlertTriangle, CheckCircle2];

export default function TeamCheckReportV3() {
  const [, navigate] = useLocation();
  const [result, setResult] = useState<TeamCheckV3Result | null>(null);
  const [input, setInput] = useState<TeamCheckV3Input | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  async function handlePdf() {
    if (!result || pdfBusy) return;
    setPdfBusy(true);
    try {
      const name = (result.roleTitle || "TeamCheck").replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_");
      await buildTeamCheckPdf(result, `TeamCheck_${name}.pdf`);
    } catch (e) {
      console.error("PDF error", e);
      toast({ title: "PDF-Fehler", description: "Der PDF-Export konnte nicht erstellt werden.", variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  }

  useEffect(() => {
    const raw = sessionStorage.getItem("teamcheckV3Input");
    if (!raw) {
      navigate("/team-report");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as TeamCheckV3Input;
      setInput(parsed);
      setResult(computeTeamCheckV3(parsed));
    } catch {
      navigate("/team-report");
    }
  }, [navigate]);

  if (!result || !input) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fb" }}>
        <GlobalNav />
        <div style={{ maxWidth: 1120, margin: "80px auto", padding: "0 20px", textAlign: "center", color: "#6E6E73" }}>
          Lade Bericht...
        </div>
      </div>
    );
  }

  const pCol = passungColor(result.passung);
  const sCol = steuerColor(result.steuerungsaufwand);
  const sep = { paddingBottom: 36, marginBottom: 36 } as const;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif", color: "#1D1D1F", lineHeight: 1.6 }}>
      <GlobalNav />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "80px 20px 48px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <button
            onClick={() => navigate("/team-report")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#1A5DAB", fontWeight: 600, fontSize: 14, padding: 0 }}
            data-testid="button-back-v3"
          >
            <ArrowLeft size={16} />
            Zurück zum TeamCheck
          </button>
          <button
            onClick={handlePdf}
            disabled={pdfBusy}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1A5DAB", border: "none", cursor: pdfBusy ? "wait" : "pointer", color: "#fff", fontWeight: 600, fontSize: 14, padding: "8px 18px", borderRadius: 8, opacity: pdfBusy ? 0.6 : 1, transition: "opacity 0.2s" }}
            data-testid="button-pdf-v3"
          >
            {pdfBusy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            PDF
          </button>
        </div>

        <div ref={reportRef} data-testid="v3-report-wrapper">
          <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }}>

            <div style={{ background: "linear-gradient(135deg, #343A48, #2A2F3A)", padding: "32px 44px 28px", position: "relative" }} data-testid="v3-header">
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${pCol}, ${pCol}60, transparent)` }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={logoPath} alt="bioLogic" style={{ height: 28, opacity: 0.9 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.16em", textTransform: "uppercase" }}>TeamCheck Bericht</span>
                </div>
              </div>

              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2 }} data-testid="v3-title">
                {result.roleTitle || "TeamCheck"}
              </h1>

              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 18px", lineHeight: 1.6 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: COMP_HEX.analytisch, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Team:</span> {result.teamLabel}
                </span>
                <span style={{ margin: "0 10px", color: "rgba(255,255,255,0.2)" }}>|</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: COMP_HEX.intuitiv, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Person:</span> {result.personLabel}
                </span>
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 10, background: `${pCol}18`, border: `1px solid ${pCol}30` }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: pCol, boxShadow: `0 0 6px ${pCol}60` }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: pCol }} data-testid="badge-v3-passung">{result.passung}</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: sCol }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>Steuerungsaufwand: {result.steuerungsaufwand}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: "36px 44px 48px" }}>

              {/* Section 1 – Systemstatus */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-systemstatus">
                <SectionHead num={1} icon={sectionIcons[0]} title="Systemstatus" iconColor={TC_SECTION_COLORS[0]} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ marginBottom: 16 }}>
                  {[
                    { label: "Rolle", value: result.roleTitle || "–" },
                    { label: "Gesamtpassung", value: result.passung, color: pCol },
                    { label: "Systemwirkung", value: result.systemwirkung },
                    { label: "Teamprofil", value: result.teamLabel },
                    { label: "Personenprofil", value: result.personLabel },
                    { label: "Steuerungsaufwand", value: result.steuerungsaufwand, color: sCol },
                  ].map(m => (
                    <div key={m.label} style={{ padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: 10, color: "#8E8E93", marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: (m as any).color || "#1D1D1F" }} data-testid={`v3-meta-${m.label.toLowerCase()}`}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2 – Managementfazit */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-fazit">
                <SectionHead num={2} icon={sectionIcons[1]} title="Managementfazit" iconColor={TC_SECTION_COLORS[1]} />
                <div style={{ padding: "24px 28px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "14px 0 0 14px", background: `linear-gradient(180deg, ${pCol}, ${pCol}40)` }} />
                  <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: 0, fontWeight: 450 }} data-testid="v3-text-fazit">
                    {result.managementFazit}
                  </p>
                </div>
              </div>

              {/* Section 3 – Warum dieses Ergebnis */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-reasons">
                <SectionHead num={3} icon={sectionIcons[2]} title="Warum dieses Ergebnis" iconColor={TC_SECTION_COLORS[2]} />
                <ul style={{ margin: 0, paddingLeft: 16, listStyleType: "none", display: "grid", gap: 8 }}>
                  {result.reasonLines.map((r, i) => (
                    <li key={i} style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", paddingLeft: 14, position: "relative" }} data-testid={`v3-reason-${i}`}>
                      <span style={{ position: "absolute", left: 0, top: 10, width: 5, height: 5, borderRadius: 3, background: pCol }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 4 – Systemwirkung */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-systemwirkung">
                <SectionHead num={4} icon={sectionIcons[3]} title="Systemwirkung" iconColor={TC_SECTION_COLORS[3]} />
                <Paragraphs text={result.systemwirkungText} />
                <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Teamprofil</p>
                    <Paragraphs text={result.teamText} />
                  </div>
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Personenprofil</p>
                    <Paragraphs text={result.personText} />
                  </div>
                </div>
              </div>

              {/* Section 5 – Strukturvergleich */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-strukturvergleich">
                <SectionHead num={5} icon={sectionIcons[4]} title="Strukturvergleich" iconColor={TC_SECTION_COLORS[4]} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Teamprofil</p>
                    <div style={{ display: "grid", gap: 10 }}>
                      <BarRow label="Impulsiv" value={Math.round(result.teamProfile.impulsiv)} color={COMP_HEX.impulsiv} />
                      <BarRow label="Intuitiv" value={Math.round(result.teamProfile.intuitiv)} color={COMP_HEX.intuitiv} />
                      <BarRow label="Analytisch" value={Math.round(result.teamProfile.analytisch)} color={COMP_HEX.analytisch} />
                    </div>
                  </div>
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Person</p>
                    <div style={{ display: "grid", gap: 10 }}>
                      <BarRow label="Impulsiv" value={Math.round(result.personProfile.impulsiv)} color={COMP_HEX.impulsiv} />
                      <BarRow label="Intuitiv" value={Math.round(result.personProfile.intuitiv)} color={COMP_HEX.intuitiv} />
                      <BarRow label="Analytisch" value={Math.round(result.personProfile.analytisch)} color={COMP_HEX.analytisch} />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 14, padding: "14px 20px", borderRadius: 14, background: `${pCol}08`, border: `1px solid ${pCol}18`, textAlign: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#48484A" }}>Team–Person-Abweichung: </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: result.teamPersonAbweichung > 40 ? BIO_COLORS.nichtGeeignet : result.teamPersonAbweichung > 20 ? BIO_COLORS.bedingt : BIO_COLORS.geeignet }} data-testid="v3-abweichung">
                    {result.teamPersonAbweichung} Punkte
                  </span>
                </div>
              </div>

              {/* Section 6 – Team-Spannungsanalyse */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-tension">
                <SectionHead num={6} icon={sectionIcons[5]} title="Team-Spannungsanalyse" iconColor={TC_SECTION_COLORS[5]} />
                <div style={{ display: "grid", gap: 14 }}>
                  {result.tension.map(t => (
                    <div key={t.key} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }} data-testid={`v3-tension-${t.key}`}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>{t.title}</p>
                      <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
                        <BarRow label="Team" value={t.teamValue} color="#9eb4cf" />
                        <BarRow label="Person" value={t.personValue} color="#1A5DAB" />
                      </div>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{t.interpretation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7 – Auswirkungen im Arbeitsalltag */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-impacts">
                <SectionHead num={7} icon={sectionIcons[6]} title="Auswirkungen im Arbeitsalltag" iconColor={TC_SECTION_COLORS[6]} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.impacts.map(imp => (
                    <div key={imp.title} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }} data-testid={`v3-impact-${imp.title.toLowerCase()}`}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{imp.title}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{imp.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 8 – Verhalten unter Druck */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-stress">
                <SectionHead num={8} icon={sectionIcons[7]} title="Verhalten unter Druck" iconColor={TC_SECTION_COLORS[7]} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "rgba(255,149,0,0.04)", border: "1px solid rgba(255,149,0,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: "#FF9500" }} />
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#FF9500", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Kontrollierter Druck</p>
                    </div>
                    <Paragraphs text={result.stress.controlled} />
                  </div>
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "rgba(255,59,48,0.04)", border: "1px solid rgba(255,59,48,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: "#FF3B30" }} />
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#FF3B30", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Unkontrollierter Stress</p>
                    </div>
                    <Paragraphs text={result.stress.uncontrolled} />
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.75, margin: "14px 0 0", fontStyle: "italic" }}>
                  Unter zunehmendem Arbeitsdruck können sich diese Verhaltensmuster verstärken. Dadurch entstehen im Arbeitsalltag Risiken für Abstimmung, Führung und Zusammenarbeit.
                </p>
              </div>

              {/* Section 9 – Risikoentwicklung über Zeit */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-risktimeline">
                <SectionHead num={9} icon={sectionIcons[8]} title="Risikoentwicklung über Zeit" iconColor={TC_SECTION_COLORS[8]} />
                <div style={{ position: "relative", paddingLeft: 28 }}>
                  <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: "rgba(0,0,0,0.08)", borderRadius: 1 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {result.riskTimeline.map((phase, i) => {
                      const phaseCol = i === 0 ? "#FF9500" : i === 1 ? "#1A5DAB" : "#34C759";
                      return (
                        <div key={i} style={{ position: "relative" }} data-testid={`v3-risk-phase-${i}`}>
                          <div style={{ position: "absolute", left: -23, top: 5, width: 12, height: 12, borderRadius: 6, background: phaseCol, border: "2px solid #FFF", boxShadow: `0 0 0 2px ${phaseCol}30` }} />
                          <div style={{ padding: "14px 20px", borderRadius: 14, background: `${phaseCol}08`, border: `1px solid ${phaseCol}15` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{phase.label}</span>
                              <span style={{ fontSize: 12, color: "#8E8E93", fontWeight: 500 }}>{phase.period}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{phase.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 10 – Chancen */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-chances">
                <SectionHead num={10} icon={sectionIcons[9]} title="Chancen" iconColor={TC_SECTION_COLORS[9]} />
                <ul style={{ margin: 0, paddingLeft: 16, listStyleType: "none", display: "grid", gap: 8 }}>
                  {result.chances.map((c, i) => (
                    <li key={i} style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", paddingLeft: 14, position: "relative" }} data-testid={`v3-chance-${i}`}>
                      <span style={{ position: "absolute", left: 0, top: 10, width: 5, height: 5, borderRadius: 3, background: BIO_COLORS.geeignet }} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 11 – Risiken */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-risks">
                <SectionHead num={11} icon={sectionIcons[10]} title="Risiken" iconColor={TC_SECTION_COLORS[10]} />
                <ul style={{ margin: 0, paddingLeft: 16, listStyleType: "none", display: "grid", gap: 8 }}>
                  {result.risks.map((r, i) => (
                    <li key={i} style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", paddingLeft: 14, position: "relative" }} data-testid={`v3-risk-${i}`}>
                      <span style={{ position: "absolute", left: 0, top: 10, width: 5, height: 5, borderRadius: 3, background: BIO_COLORS.nichtGeeignet }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 12 – Handlungsempfehlung */}
              <div style={{ paddingBottom: 12 }} data-testid="v3-section-advice">
                <SectionHead num={12} icon={sectionIcons[11]} title="Handlungsempfehlung" iconColor={TC_SECTION_COLORS[11]} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.advice.map(a => (
                    <div key={a.title} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }} data-testid={`v3-advice-${a.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{a.title}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{a.text}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
