import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { computeTeamCheckV4, type TeamCheckV4Result, type V4Block } from "@/lib/teamcheck-v4-engine";
import type { TeamCheckV3Input } from "@/lib/teamcheck-v3-engine";
import { ArrowLeft, Printer } from "lucide-react";
import { BIO_COLORS } from "@/lib/bio-design";
import logoPath from "@assets/LOGO_bio_1773853681939.png";

const bewColor = (b: string) => {
  if (b === "Gut passend") return BIO_COLORS.geeignet;
  if (b === "Kritisch") return BIO_COLORS.nichtGeeignet;
  return BIO_COLORS.bedingt;
};
const axisColor = (v: string) => v === "hoch" ? BIO_COLORS.geeignet : v === "mittel" ? BIO_COLORS.bedingt : v === "gering" ? BIO_COLORS.nichtGeeignet : "#94a3b8";
const axisLabel = (v: string) => v === "hoch" ? "Hoch" : v === "mittel" ? "Mittel" : v === "gering" ? "Gering" : "Nicht bewertbar";

function SectionHead({ num, title, id }: { num: number; title: string; id: string }) {
  return (
    <div id={`s-${id}`} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 12, borderBottom: "2px solid rgba(0,0,0,0.06)", scrollMarginTop: 80 }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: "#343A48", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{num}</div>
      <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>{title}</span>
    </div>
  );
}

function SubHead({ num, title, color }: { num: number; title: string; color?: string }) {
  const c = color || "#0F3A6E";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ width: 24, height: 24, borderRadius: 12, background: c, color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{num}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", textDecoration: "underline", textUnderlineOffset: 3 }}>{title}</span>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((para, i) => (
        <p key={i} style={bodyText}>{para}</p>
      ))}
    </>
  );
}

const bodyText: React.CSSProperties = { fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: "0 0 12px", textAlign: "justify", textAlignLast: "left", hyphens: "auto", WebkitHyphens: "auto" } as any;
const sectionStyle = { paddingBottom: 40, marginBottom: 40, borderBottom: "1px solid rgba(0,0,0,0.05)" } as const;

export default function TeamCheckReportV4() {
  const [, navigate] = useLocation();
  const [result, setResult] = useState<TeamCheckV4Result | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("teamcheckV4Input");
    if (!raw) { navigate("/team-report"); return; }
    try {
      const parsed = JSON.parse(raw) as TeamCheckV3Input;
      setResult(computeTeamCheckV4(parsed));
    } catch { navigate("/team-report"); }
  }, [navigate]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  if (!result) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fb" }}>
        <GlobalNav />
        <div style={{ maxWidth: 1120, margin: "80px auto", padding: "0 20px", textAlign: "center", color: "#6E6E73" }}>Lade Bericht...</div>
      </div>
    );
  }

  const bCol = bewColor(result.gesamteinschaetzung);
  const today = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif", color: "#1D1D1F", lineHeight: 1.6 }} className="v4-report-page">
      <GlobalNav />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "80px 20px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }} className="no-print">
          <button onClick={() => navigate("/team-report")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#1A5DAB", fontWeight: 600, fontSize: 14, padding: 0 }} data-testid="button-back-v4">
            <ArrowLeft size={16} /> Zurück zum TeamCheck
          </button>
          <button onClick={handlePrint} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#343A48", border: "none", cursor: "pointer", color: "#FFF", fontWeight: 600, fontSize: 13, padding: "8px 16px", borderRadius: 8 }} data-testid="button-print-v4">
            <Printer size={14} /> Drucken / PDF
          </button>
        </div>

        <div ref={reportRef} data-testid="v4-report-wrapper">
          <div style={{ position: "relative", background: "#F8F9FB", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }}>

            <div className="report-header report-header--auto" data-testid="v4-header">
              <img src={logoPath} alt="bioLogic" className="report-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="report-kicker">TEAMANALYSE</div>
              <h1 className="report-title report-title--flow">Integrationsanalyse</h1>
              <div className="report-subtitle report-subtitle--flow">{result.roleTitle || "Teamsimulation"}</div>
              <div className="report-rings" />
            </div>

            <div style={{ padding: "28px 32px 0" }}>
              <p style={{ fontSize: 14.5, color: "#48484A", lineHeight: 1.85, margin: "0 0 8px" }} data-testid="text-einleitung-v4">
                Dieser Bericht zeigt, wie die Person {result.roleType === "leadership" ? "in der Führungsrolle" : "im bestehenden Team"} voraussichtlich wirken wird. Er hilft dabei, früh zu erkennen, wo Zusammenarbeit gut gelingen kann und wo im Alltag mehr Führung, Klarheit oder Begleitung nötig ist.
              </p>
              <p style={{ fontSize: 14.5, color: "#48484A", lineHeight: 1.85, margin: "0 0 24px" }}>
                Unterschiede sind dabei nicht automatisch negativ. Sie können ein Team sinnvoll ergänzen, brauchen aber klare Erwartungen und gute Abstimmung, damit daraus Stärke statt Reibung entsteht.
              </p>

              <div data-pdf-block style={{ background: "linear-gradient(135deg, rgba(255,59,48,0.06) 0%, rgba(255,59,48,0.03) 100%)", borderRadius: 10, padding: "16px 20px", border: "1px solid rgba(255,59,48,0.2)", marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                  Die Aussagen beschreiben dabei keine starren Persönlichkeitsbilder, sondern wiederkehrende und im Arbeitskontext erkennbare Tendenzen. Die Analyse ist wertfrei zu verstehen und dient als Orientierung für die Einschätzung von Passung und Wirksamkeit. Da jede Person individuell ist, ersetzt sie keine Einzelfallbetrachtung, sondern ergänzt diese um eine strukturierte und fundierte Entscheidungsgrundlage.
                </p>
              </div>

              {/* === Section 1: Gesamtbewertung === */}
              <SectionHead num={1} title="Gesamtbewertung" id="gesamtbewertung" />

              <div style={{ margin: "0 0 24px" }} data-testid="v4-hero-bewertung">
                <TextBlock text={result.gesamtbewertungText} />

                <div style={{ fontSize: 28, fontWeight: 800, color: bCol, margin: "20px 0 0", letterSpacing: "-0.02em" }} data-testid="v4-gesamt-label">{result.gesamteinschaetzung}</div>

                <div style={{ display: "flex", gap: 16, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(0,0,0,0.06)" }} data-testid="v4-two-axis">
                  <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${axisColor(result.passungZumTeam)}08`, border: `1px solid ${axisColor(result.passungZumTeam)}25` }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Passung zum Team</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: axisColor(result.passungZumTeam) }} data-testid="v4-passung-team">{axisLabel(result.passungZumTeam)}</div>
                  </div>
                  {result.beitragZurAufgabe !== "nicht bewertbar" && (
                    <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: `${axisColor(result.beitragZurAufgabe)}08`, border: `1px solid ${axisColor(result.beitragZurAufgabe)}25` }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Beitrag zur Aufgabe</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: axisColor(result.beitragZurAufgabe) }} data-testid="v4-beitrag-aufgabe">{axisLabel(result.beitragZurAufgabe)}</div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 16, marginTop: 16 }} data-testid="v4-kurzueberblick">
                  <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "rgba(26,93,171,0.04)", border: "1px solid rgba(26,93,171,0.12)" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Hauptstärke</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.5 }} data-testid="v4-hauptstaerke">{result.hauptstaerke}</div>
                  </div>
                  <div style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: "rgba(255,149,0,0.04)", border: "1px solid rgba(255,149,0,0.15)" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Hauptabweichung</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.5 }} data-testid="v4-hauptabweichung">{result.hauptabweichung}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "12px 18px", borderRadius: 10, background: "rgba(26,93,171,0.05)", border: "1px solid rgba(26,93,171,0.1)", marginBottom: 20 }}>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "#48484A", margin: 0 }} data-testid="v4-team-kontext">{result.teamKontext}</p>
              </div>
            </div>

            <div style={{ padding: "0 32px 48px" }}>

              {/* === Section 2: Warum dieses Ergebnis entsteht === */}
              <div style={sectionStyle} data-testid="v4-section-warum">
                <SectionHead num={2} title="Warum dieses Ergebnis entsteht" id="warum" />
                <TextBlock text={result.warumText} />
              </div>

              {/* === Section 3: Wirkung im Arbeitsalltag === */}
              <div style={sectionStyle} data-testid="v4-section-wirkung">
                <SectionHead num={3} title="Wirkung im Arbeitsalltag" id="wirkung" />
                <TextBlock text={result.wirkungAlltagText} />
              </div>

              {/* === Section 4: Chancen und Risiken === */}
              <div style={sectionStyle} data-testid="v4-section-chancen-risiken">
                <SectionHead num={4} title="Chancen und Risiken dieser Besetzung" id="chancen-risiken" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div style={{ padding: "20px", borderRadius: 12, background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 11, background: "#1B7A3D", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>+</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#1B7A3D" }}>Chancen</span>
                    </div>
                    {result.chancen.map((ch, i) => (
                      <div key={i} style={{ marginBottom: i < result.chancen.length - 1 ? 16 : 0, paddingBottom: i < result.chancen.length - 1 ? 16 : 0, borderBottom: i < result.chancen.length - 1 ? "1px solid rgba(52,199,89,0.12)" : "none" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{ch.title}</p>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#6E6E73", margin: 0 }}>{ch.text}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "20px", borderRadius: 12, background: "rgba(255,59,48,0.03)", border: "1px solid rgba(255,59,48,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 11, background: "#C41E3A", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>–</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#C41E3A" }}>Risiken</span>
                    </div>
                    {result.risiken.map((ri, i) => (
                      <div key={i} style={{ marginBottom: i < result.risiken.length - 1 ? 16 : 0, paddingBottom: i < result.risiken.length - 1 ? 16 : 0, borderBottom: i < result.risiken.length - 1 ? "1px solid rgba(255,59,48,0.08)" : "none" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{ri.title}</p>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: "#6E6E73", margin: 0 }}>{ri.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "14px 20px", borderRadius: 10, background: "rgba(0,0,0,0.02)", borderLeft: "3px solid rgba(0,0,0,0.08)" }}>
                  <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: 0, fontStyle: "italic" }} data-testid="v4-chancen-einordnung">{result.chancenRisikenEinordnung}</p>
                </div>
              </div>

              {/* === Section 5: Verhalten unter Druck === */}
              <div style={sectionStyle} data-testid="v4-section-druck">
                <SectionHead num={5} title="Verhalten unter Druck" id="druck" />
                <TextBlock text={result.druckText} />
              </div>

              {/* === Section 6 (only Führungskraft): Führungshinweis === */}
              {result.fuehrungshinweis && (
                <div style={sectionStyle} data-testid="v4-section-fuehrung">
                  <SectionHead num={6} title="Was als Führungskraft für dieses Team wichtig ist" id="fuehrung" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                    {result.fuehrungshinweis.map((item, i) => (
                      <div key={item.title} style={{ padding: "18px 20px", borderRadius: 12, background: "#FFF", borderLeft: "3px solid #343A48", border: "1px solid rgba(0,0,0,0.06)", borderLeftWidth: 3, borderLeftColor: "#343A48", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }} data-testid={`v4-fuehrung-${i}`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <span style={{ width: 22, height: 22, borderRadius: 11, background: "#343A48", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", lineHeight: 1.35 }}>{item.title}</span>
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.75, color: "#6E6E73", margin: 0 }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === Section 6/7: Was jetzt wichtig ist === */}
              <div style={{ marginBottom: 36 }} data-testid="v4-section-empfehlungen">
                <SectionHead num={result.fuehrungshinweis ? 7 : 6} title="Was jetzt wichtig ist" id="empfehlungen" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {result.empfehlungen.map((emp, i) => (
                    <div key={emp.title} style={{ padding: "18px 20px", borderRadius: 12, background: "#FFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }} data-testid={`v4-empfehlung-${i}`}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 11, background: "#1A5DAB", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", lineHeight: 1.35 }}>{emp.title}</span>
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.75, color: "#6E6E73", margin: 0 }}>{emp.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "24px 0", borderTop: "1px solid rgba(0,0,0,0.06)" }} data-testid="v4-footer">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 12, color: "#A0A0A5", margin: "0 0 4px", fontWeight: 600 }}>bioLogic · Integrationsanalyse</p>
                    <p style={{ fontSize: 12, color: "#B0B0B5", margin: "0 0 4px" }}>Erstellt am {today}</p>
                    <p style={{ fontSize: 11, color: "#B0B0B5", margin: 0, lineHeight: 1.6 }}>Diese Analyse basiert auf dem bioLogic-Modell und ergänzt die persönliche Einschätzung. Sie ersetzt kein Gespräch und keine individuelle Beurteilung.</p>
                  </div>
                  <img src={logoPath} alt="bioLogic" style={{ height: 28, opacity: 0.3 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
