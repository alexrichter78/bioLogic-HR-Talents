import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import {
  computeTeamCheckV3,
  type TeamCheckV3Input,
  type TeamCheckV3Result,
} from "@/lib/teamcheck-v3-engine";
import { ArrowLeft, Zap, Shield, Layers, Activity, Flame, Clock, Sparkles, AlertTriangle, CheckCircle2, Download, Loader2, TrendingUp, GitCompare, Users } from "lucide-react";
import { COMP_HEX, TC_SECTION_COLORS, BIO_COLORS } from "@/lib/bio-design";
import { buildTeamCheckPdf } from "@/lib/teamcheck-pdf-builder";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/LOGO_bio_1773853681939.png";

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

function risikoColor(r: string): string {
  if (r === "gering") return BIO_COLORS.geeignet;
  if (r === "mittel") return BIO_COLORS.bedingt;
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

function MetricBadge({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.50)", marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color || "rgba(255,255,255,0.90)" }} data-testid={`v3-status-${label.toLowerCase().replace(/\s/g, "-")}`}>{value}</div>
    </div>
  );
}

function OverviewRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#6E6E73" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: valueColor || "#1D1D1F", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

const sectionIcons = [Zap, Activity, Layers, Users, Shield, TrendingUp, Flame, Clock, Sparkles, AlertTriangle, CheckCircle2, GitCompare];

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
  const rCol = risikoColor(result.integrationsrisiko);
  const abwCol = result.teamPersonAbweichung > 40 ? BIO_COLORS.nichtGeeignet : result.teamPersonAbweichung > 20 ? BIO_COLORS.bedingt : BIO_COLORS.geeignet;
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

            {/* ─── EXECUTIVE DECISION PAGE (Header + consolidated Section 1) ─── */}
            <div style={{ background: "linear-gradient(135deg, #343A48, #2A2F3A)", padding: "36px 44px 0", position: "relative" }} data-testid="v3-header">

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <img src={logoPath} alt="bioLogic" style={{ height: 52, marginBottom: 14 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 18 }}>
                    <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.25)", marginRight: 10 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.50)", letterSpacing: "0.18em", textTransform: "uppercase" }}>TeamCheck Bericht</span>
                  </div>
                </div>
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#FFFFFF", margin: "0 0 22px", letterSpacing: "-0.02em", lineHeight: 1.2 }} data-testid="v3-title">
                {result.roleTitle || "TeamCheck"}
              </h1>

              {/* SYSTEMSTATUS – 4 key metrics */}
              <div data-testid="v3-section-systemstatus" style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 10px" }}>Systemstatus</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <MetricBadge label="Gesamtpassung" value={result.passung} color={pCol} />
                  <MetricBadge label="Systemwirkung" value={result.systemwirkung} />
                  <MetricBadge label="Steuerungsaufwand" value={result.steuerungsaufwand} color={sCol} />
                  <MetricBadge label="Integrationsrisiko" value={result.integrationsrisiko} color={rCol} />
                </div>
              </div>

              {/* SYSTEMÜBERBLICK */}
              <div style={{ marginBottom: 22, padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} data-testid="v3-section-ueberblick">
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px" }}>Systemüberblick</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Teamprofil</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{result.teamLabel}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Personenprofil</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{result.personLabel}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Team–Person-Abweichung</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: abwCol }}>{result.teamPersonAbweichung} Punkte</span>
                  </div>
                </div>
              </div>

              {/* STRUKTURKONSTELLATION */}
              <div style={{ marginBottom: 22, padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} data-testid="v3-section-strukturkonstellation">
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px" }}>Strukturkonstellation</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Dominanz Team</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{result.strukturdiagnose.teamDominant}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>Dominanz Person</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{result.strukturdiagnose.personDominant}</span>
                </div>
                <div style={{ padding: "10px 0 4px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 6px" }}>Strukturwirkung</p>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,0.70)" }}>
                    {result.strukturdiagnose.strukturwirkung.split(/\n\n+/)[0]}
                  </p>
                </div>
              </div>

              {/* MANAGEMENTKURZFAZIT */}
              <div style={{ marginBottom: 22, padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }} data-testid="v3-section-fazit">
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "12px 0 0 12px", background: `linear-gradient(180deg, ${pCol}, ${pCol}40)` }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px" }}>Managementkurzfazit</p>
                <p style={{ fontSize: 13, lineHeight: 1.85, color: "rgba(255,255,255,0.75)", margin: 0 }} data-testid="v3-text-fazit">
                  {result.managementFazit}
                </p>
              </div>

              {/* INTEGRATIONSFAKTOR (compact) */}
              <div style={{ marginBottom: 0, padding: "16px 20px 20px", borderRadius: "12px 12px 0 0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none" }} data-testid="v3-section-integration-header">
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.40)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px" }}>Integrationsfaktor</p>
                <div style={{ display: "flex", gap: 18 }}>
                  <div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", fontWeight: 600 }}>Integrationsdauer</span>
                    <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{result.integrationsfaktor.integrationsdauer}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", fontWeight: 600 }}>Führungsaufwand</span>
                    <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: sCol }}>{result.steuerungsaufwand}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", fontWeight: 600 }}>Erfolgsfaktor</span>
                    <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.70)", lineHeight: 1.5 }}>{result.erfolgsfaktor}</p>
                  </div>
                </div>
              </div>

            </div>
            {/* ─── END EXECUTIVE DECISION PAGE ─── */}

            <div style={{ padding: "36px 44px 48px" }}>

              {/* Section 2 – Warum dieses Ergebnis */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-reasons">
                <SectionHead num={2} icon={sectionIcons[0]} title="Warum dieses Ergebnis" iconColor={TC_SECTION_COLORS[0]} />
                <ul style={{ margin: 0, paddingLeft: 16, listStyleType: "none", display: "grid", gap: 8 }}>
                  {result.reasonLines.map((r, i) => (
                    <li key={i} style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", paddingLeft: 14, position: "relative" }} data-testid={`v3-reason-${i}`}>
                      <span style={{ position: "absolute", left: 0, top: 10, width: 5, height: 5, borderRadius: 3, background: pCol }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3 – Systemwirkung */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-systemwirkung">
                <SectionHead num={3} icon={sectionIcons[1]} title="Systemwirkung" iconColor={TC_SECTION_COLORS[1]} />
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

              {/* Section 4 – Strukturvergleich */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-strukturvergleich">
                <SectionHead num={4} icon={sectionIcons[2]} title="Strukturvergleich" iconColor={TC_SECTION_COLORS[2]} />
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
                  <span style={{ fontSize: 18, fontWeight: 800, color: abwCol }} data-testid="v3-abweichung">
                    {result.teamPersonAbweichung} Punkte
                  </span>
                </div>
              </div>

              {/* Section 5 – Team-Spannungsanalyse */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-tension">
                <SectionHead num={5} icon={sectionIcons[3]} title="Team-Spannungsanalyse" iconColor={TC_SECTION_COLORS[3]} />
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

              {/* Section 6 – Auswirkungen im Arbeitsalltag */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-impacts">
                <SectionHead num={6} icon={sectionIcons[4]} title="Auswirkungen im Arbeitsalltag" iconColor={TC_SECTION_COLORS[4]} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.impacts.map(imp => (
                    <div key={imp.title} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }} data-testid={`v3-impact-${imp.title.toLowerCase()}`}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{imp.title}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{imp.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7 – Auswirkungen auf Leistung und Ergebnisse */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-leistung">
                <SectionHead num={7} icon={sectionIcons[5]} title="Auswirkungen auf Leistung und Ergebnisse" iconColor={TC_SECTION_COLORS[5]} />
                <div style={{ display: "grid", gap: 14 }}>
                  {[
                    { label: "Entscheidungsqualität", text: result.leistungswirkung.entscheidungsqualitaet },
                    { label: "Umsetzungsgeschwindigkeit", text: result.leistungswirkung.umsetzungsgeschwindigkeit },
                    { label: "Prioritätensetzung", text: result.leistungswirkung.prioritaetensetzung },
                    { label: "Wirkung auf Ergebnisse", text: result.leistungswirkung.wirkungAufErgebnisse },
                  ].map(item => (
                    <div key={item.label} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }} data-testid={`v3-leistung-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 8 – Verhalten unter Druck */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-stress">
                <SectionHead num={8} icon={sectionIcons[6]} title="Verhalten unter Druck" iconColor={TC_SECTION_COLORS[6]} />
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
                <SectionHead num={9} icon={sectionIcons[7]} title="Risikoentwicklung über Zeit" iconColor={TC_SECTION_COLORS[7]} />
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
                <SectionHead num={10} icon={sectionIcons[8]} title="Chancen" iconColor={TC_SECTION_COLORS[8]} />
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
                <SectionHead num={11} icon={sectionIcons[9]} title="Risiken" iconColor={TC_SECTION_COLORS[9]} />
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
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v3-section-advice">
                <SectionHead num={12} icon={sectionIcons[10]} title="Handlungsempfehlung" iconColor={TC_SECTION_COLORS[10]} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.advice.map(a => (
                    <div key={a.title} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }} data-testid={`v3-advice-${a.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{a.title}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{a.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 13 – Alternativwirkung */}
              <div style={{ paddingBottom: 12 }} data-testid="v3-section-alternativ">
                <SectionHead num={13} icon={sectionIcons[11]} title="Alternativwirkung" iconColor={TC_SECTION_COLORS[11]} />
                <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: "0 0 16px" }}>
                  Neben der Frage, wie sich die Besetzung auf das Team auswirkt, ist auch relevant, welche Wirkung ohne diese Besetzung bestehen bleibt.
                </p>
                <Paragraphs text={result.alternativwirkung} />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
