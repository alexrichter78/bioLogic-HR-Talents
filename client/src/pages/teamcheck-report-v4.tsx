import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { computeTeamCheckV4, type TeamCheckV4Result, type V4Block, type V4Bullet } from "@/lib/teamcheck-v4-engine";
import type { TeamCheckV3Input } from "@/lib/teamcheck-v3-engine";
import { ArrowLeft, Printer } from "lucide-react";
import { COMP_HEX, BIO_COLORS } from "@/lib/bio-design";
import logoPath from "@assets/LOGO_bio_1773853681939.png";

const bewColor = (b: string) => {
  if (b === "Gut passend") return BIO_COLORS.geeignet;
  if (b === "Im Team passend, f\u00FCr die Aufgabe weniger geeignet") return BIO_COLORS.bedingt;
  if (b === "Teilweise passend") return BIO_COLORS.bedingt;
  if (b === "F\u00FCr die Aufgabe passend, im Team herausfordernd") return BIO_COLORS.bedingt;
  if (b === "Eingeschr\u00E4nkt passend") return BIO_COLORS.bedingt;
  if (b === "Strategisch sinnvoll, aber anspruchsvoll") return BIO_COLORS.bedingt;
  return BIO_COLORS.nichtGeeignet;
};
const axisColor = (v: string) => v === "hoch" ? BIO_COLORS.geeignet : v === "mittel" ? BIO_COLORS.bedingt : v === "gering" ? BIO_COLORS.nichtGeeignet : "#94a3b8";
const axisLabel = (v: string) => v === "hoch" ? "Hoch" : v === "mittel" ? "Mittel" : v === "gering" ? "Gering" : "Nicht bewertbar";
const bgColor = (s: string) => s === "gering" ? BIO_COLORS.geeignet : s === "mittel" ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;
const rColor = (r: string) => r === "niedrig" ? BIO_COLORS.geeignet : r === "erh\u00F6ht" ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;

const SECTIONS = [
  { id: "summary", num: 1, label: "Management\u00FCbersicht" },
  { id: "warum", num: 2, label: "Einsch\u00E4tzung" },
  { id: "wirkung", num: 3, label: "Wirkung" },
  { id: "chancen-risiken", num: 4, label: "Chancen & Risiken" },
  { id: "ohne", num: 5, label: "Ohne Besetzung" },
  { id: "alltag", num: 6, label: "Alltag" },
  { id: "leistung", num: 7, label: "Leistung" },
  { id: "druck", num: 8, label: "Unter Druck" },
  { id: "empfehlungen", num: 9, label: "Empfehlungen" },
];

function SectionHead({ num, title, id }: { num: number; title: string; id: string }) {
  return (
    <div id={`s-${id}`} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 12, borderBottom: "2px solid rgba(0,0,0,0.06)", scrollMarginTop: 80 }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, background: "#343A48", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{num}</div>
      <span style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>{title}</span>
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 130, padding: "14px 16px", borderRadius: 12, background: "#FFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} data-testid={`v4-tile-${label.toLowerCase().replace(/[\s\/]/g, "-")}`}>
      <div style={{ fontSize: 11, color: "#8E8E93", marginBottom: 5, fontWeight: 600, letterSpacing: "0.02em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color || "#1D1D1F" }}>{value}</div>
    </div>
  );
}

function Kernaussage({ text, color }: { text: string; color?: string }) {
  const c = color || "#1A5DAB";
  return (
    <div style={{ marginTop: 20, padding: "14px 20px", borderRadius: 10, background: `${c}0D`, borderLeft: `3px solid ${c}` }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Kurz gesagt</p>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: "#48484A", margin: 0, fontWeight: 500 }}>{text}</p>
    </div>
  );
}

function ContentCard({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ padding: "18px 20px", borderRadius: 12, background: "#FFF", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{title}</p>
      <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "#48484A", margin: 0 }}>{text}</p>
    </div>
  );
}

function HintBox({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 20px", borderRadius: 12, background: `${color}0D`, border: `1px solid ${color}20`, position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "12px 0 0 12px", background: color }} />
      <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>{label}</p>
      {children}
    </div>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 46px", gap: 10, alignItems: "center" }}>
      <div style={{ fontSize: 13, color: "#6E6E73", fontWeight: 600 }}>{label}</div>
      <div style={{ position: "relative", height: 14, borderRadius: 999, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}CC)`, width: `${value}%`, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>{value}%</div>
    </div>
  );
}

function SimpleBulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyleType: "none" }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, lineHeight: 1.8, color: "#48484A", padding: "3px 0 3px 20px", position: "relative" }}>
          <span style={{ position: "absolute", left: 0, top: 14, width: 6, height: 6, borderRadius: 3, background: color }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function DetailBulletList({ items, color }: { items: V4Bullet[]; color: string }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyleType: "none" }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, lineHeight: 1.7, color: "#48484A", padding: "5px 0 5px 20px", position: "relative" }}>
          <span style={{ position: "absolute", left: 0, top: 14, width: 6, height: 6, borderRadius: 3, background: color }} />
          <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{item.point}:</span>{" "}
          <span>{item.detail}</span>
        </li>
      ))}
    </ul>
  );
}

function IntroText({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 14.5, lineHeight: 1.85, color: "#48484A", margin: "0 0 20px" }}>{text}</p>
  );
}

const sectionStyle = { paddingBottom: 40, marginBottom: 40, borderBottom: "1px solid rgba(0,0,0,0.05)" } as const;
const cardBase = { padding: "20px 24px", borderRadius: 14, background: "#FFF", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" } as const;

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

  const scrollTo = useCallback((id: string) => {
    document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
            <ArrowLeft size={16} /> {"Zur\u00FCck zum TeamCheck"}
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

            {/* === Intro === */}
            <div style={{ padding: "28px 32px 0" }}>
              <p style={{ fontSize: 14.5, color: "#48484A", lineHeight: 1.85, margin: "0 0 8px" }} data-testid="text-einleitung-v4">
                {"Dieser Bericht zeigt, wie die Person "}
                {result.roleType === "leadership" ? "in der F\u00FChrungsrolle" : "im bestehenden Team"}
                {" voraussichtlich wirken wird. Er hilft dabei, fr\u00FCh zu erkennen, wo Zusammenarbeit gut gelingen kann und wo im Alltag mehr F\u00FChrung, Klarheit oder Begleitung n\u00F6tig ist."}
              </p>
              <p style={{ fontSize: 14.5, color: "#48484A", lineHeight: 1.85, margin: "0 0 24px" }}>
                {"Unterschiede sind dabei nicht automatisch negativ. Sie k\u00F6nnen ein Team sinnvoll erg\u00E4nzen, brauchen aber klare Erwartungen und gute Abstimmung, damit daraus St\u00E4rke statt Reibung entsteht."}
              </p>

              <div data-pdf-block style={{ background: "linear-gradient(135deg, rgba(255,59,48,0.06) 0%, rgba(255,59,48,0.03) 100%)", borderRadius: 10, padding: "16px 20px", border: "1px solid rgba(255,59,48,0.2)", marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                  Die Aussagen beschreiben dabei keine starren Persönlichkeitsbilder, sondern wiederkehrende und im Arbeitskontext erkennbare Tendenzen. Die Analyse ist wertfrei zu verstehen und dient als Orientierung für die Einschätzung von Passung und Wirksamkeit. Da jede Person individuell ist, ersetzt sie keine Einzelfallbetrachtung, sondern ergänzt diese um eine strukturierte und fundierte Entscheidungsgrundlage.
                </p>
              </div>

              <SectionHead num={1} title="Gesamtbewertung" id="gesamtbewertung" />

              <div style={{ margin: "0 0 24px" }} data-testid="v4-hero-bewertung">
                <div style={{ fontSize: 28, fontWeight: 800, color: bCol, marginBottom: 10, letterSpacing: "-0.02em" }}>{result.gesamteinschaetzung}</div>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "#48484A", margin: 0 }} data-testid="v4-kurzfazit">{result.kurzfazit}</p>

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
              </div>

              {/* Team-Kontext */}
              <div style={{ padding: "12px 18px", borderRadius: 10, background: "rgba(26,93,171,0.05)", border: "1px solid rgba(26,93,171,0.1)", marginBottom: 20 }}>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "#48484A", margin: 0 }} data-testid="v4-team-kontext">{result.teamKontext}</p>
              </div>
            </div>

            {/* === TOC === */}
            <div style={{ padding: "0 32px 0" }}>

              {/* Inhaltsverzeichnis */}
              <div style={{ padding: "16px 20px", borderRadius: 12, background: "#FFF", border: "1px solid rgba(0,0,0,0.06)", marginBottom: 32 }} className="no-print" data-testid="v4-toc">
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Inhalt</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 4px" }}>
                  {SECTIONS.map(s => (
                    <button key={s.id} onClick={() => scrollTo(s.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 13, color: "#48484A", fontWeight: 500, transition: "background 0.15s" }} onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")} onMouseLeave={e => (e.currentTarget.style.background = "none")} data-testid={`toc-link-${s.id}`}>
                      <span style={{ width: 20, height: 20, borderRadius: 10, background: "#343A48", color: "#FFF", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.num}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* S1 */}
              <SectionHead num={1} title={"Management\u00FCbersicht"} id="summary" />
              <div data-testid="v4-section-summary" style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <Tile label="Rolle / Bereich" value={result.roleTitle || "\u2013"} />
                  <Tile label="Kontext" value={result.roleLabel} />
                  {result.teamGoalLabel && result.teamGoalLabel !== "Kein festgelegtes Funktionsziel" && (
                    <Tile label="Funktionsziel" value={result.teamGoalLabel} />
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                  <Tile label="Wirkung auf das Umfeld" value={result.wirkungAufUmfeld} />
                  <Tile label="Begleitungsbedarf" value={result.begleitungsbedarf} color={bgColor(result.begleitungsbedarf)} />
                  <Tile label="Risiko im Alltag" value={result.risikoImAlltag} color={rColor(result.risikoImAlltag)} />
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <HintBox label={"Managementeinsch\u00E4tzung"} color="#343A48">
                    <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "#48484A", margin: 0 }} data-testid="v4-management-einschaetzung">{result.managementEinschaetzung}</p>
                  </HintBox>
                  <HintBox label="Erste Empfehlung" color="#1A5DAB">
                    <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "#48484A", margin: 0 }}>{result.ersteEmpfehlung}</p>
                  </HintBox>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <HintBox label={"Gr\u00F6sstes Risiko"} color="#FF3B30">
                      <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "#48484A", margin: 0 }} data-testid="v4-hauptrisiko">{result.hauptrisiko}</p>
                    </HintBox>
                    <HintBox label={"Gr\u00F6sste Chance"} color="#34C759">
                      <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "#48484A", margin: 0 }} data-testid="v4-hauptchance">{result.hauptchance}</p>
                    </HintBox>
                  </div>
                  <HintBox label="Integrationsprognose" color="#6E6E73">
                    <p style={{ fontSize: 14.5, lineHeight: 1.75, color: "#48484A", margin: 0 }} data-testid="v4-integrationsprognose">{result.integrationsprognose}</p>
                  </HintBox>
                </div>
              </div>

              {/* \u00DCbergang */}
              <div style={{ padding: "14px 20px", borderRadius: 10, background: "rgba(0,0,0,0.02)", marginBottom: 40, borderLeft: "3px solid rgba(0,0,0,0.08)" }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#6E6E73", margin: 0, fontStyle: "italic" }}>{"Die folgenden Abschnitte erl\u00E4utern im Detail, wie wir zu dieser Einsch\u00E4tzung kommen und was sie konkret f\u00FCr den Alltag bedeutet."}</p>
              </div>
            </div>

            <div style={{ padding: "0 32px 48px" }}>

              {/* S2 */}
              <div style={sectionStyle} data-testid="v4-section-warum">
                <SectionHead num={2} title={"Warum wir zu dieser Einsch\u00E4tzung kommen"} id="warum" />
                <IntroText text={result.warumEinleitung} />
                <div style={{ display: "grid", gap: 12 }}>
                  {result.warumBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                <Kernaussage text={result.warumKernaussage} />
              </div>

              {/* S3 */}
              <div style={sectionStyle} data-testid="v4-section-wirkung">
                <SectionHead num={3} title={result.wirkungTitle} id="wirkung" />
                <IntroText text={result.wirkungEinleitung} />
                <div style={{ display: "grid", gap: 12 }}>
                  {result.wirkungBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                <Kernaussage text={result.wirkungKernaussage} />
              </div>

              {/* S4 */}
              <div style={sectionStyle} data-testid="v4-section-chancen-risiken">
                <SectionHead num={4} title="Chancen und Risiken dieser Besetzung" id="chancen-risiken" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={{ ...cardBase, background: "rgba(52,199,89,0.05)", border: "1px solid rgba(52,199,89,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: "#34C759" }} />
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#1B7A3D", margin: 0 }}>Chancen</p>
                    </div>
                    <p style={{ fontSize: 14.5, color: "#48484A", lineHeight: 1.75, margin: "0 0 14px" }}>{result.chancenEinleitung}</p>
                    <DetailBulletList items={result.chancenPunkte} color="#34C759" />
                  </div>
                  <div style={{ ...cardBase, background: "rgba(255,59,48,0.05)", border: "1px solid rgba(255,59,48,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: "#FF3B30" }} />
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#C41E3A", margin: 0 }}>Risiken</p>
                    </div>
                    <p style={{ fontSize: 14.5, color: "#48484A", lineHeight: 1.75, margin: "0 0 14px" }}>{result.risikenEinleitung}</p>
                    <DetailBulletList items={result.risikenPunkte} color="#FF3B30" />
                  </div>
                </div>
              </div>

              {/* S5 */}
              <div style={sectionStyle} data-testid="v4-section-ohne">
                <SectionHead num={5} title="Was ohne diese Besetzung bestehen bleibt" id="ohne" />
                <IntroText text={"Nicht zu besetzen ist keine neutrale Entscheidung. Auch wenn kurzfristig Ruhe erhalten bleibt, bleiben bestehende Probleme weiterhin ungel\u00F6st."} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={cardBase}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#34C759", margin: "0 0 12px" }}>Was kurzfristig erhalten bleibt</p>
                    <SimpleBulletList items={result.ohneErhalten} color="#34C759" />
                  </div>
                  <div style={cardBase}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#FF3B30", margin: "0 0 12px" }}>{"Was weiter ungel\u00F6st bleibt"}</p>
                    <SimpleBulletList items={result.ohneUngeloest} color="#FF3B30" />
                  </div>
                </div>
                <Kernaussage text={result.ohneKernaussage} color="#6E6E73" />
              </div>

              {/* S6 */}
              <div style={sectionStyle} data-testid="v4-section-alltag">
                <SectionHead num={6} title={"So k\u00F6nnte es im Alltag aussehen"} id="alltag" />
                <IntroText text={result.alltagEinleitung} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.alltagBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                {result.alltagWarnzeichen.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: "#6B7280", margin: "0 0 8px", fontStyle: "italic" }}>{"Bleiben die folgenden Signale \u00FCber mehrere Wochen bestehen, spricht das daf\u00FCr, dass die Integration nicht stabil verl\u00E4uft und aktiv nachgesteuert werden muss."}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(255,149,0,0.07)", border: "1px solid rgba(255,149,0,0.18)" }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#CC7700", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Warnzeichen</p>
                        <SimpleBulletList items={result.alltagWarnzeichen} color="#FF9500" />
                      </div>
                      {result.alltagPositivzeichen.length > 0 && (
                        <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(52,199,89,0.06)", border: "1px solid rgba(52,199,89,0.15)" }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#1B7A3D", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{"Positive Signale nach 2\u20134 Wochen"}</p>
                          <SimpleBulletList items={result.alltagPositivzeichen} color="#34C759" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Kernaussage text={result.alltagKernaussage} />
              </div>

              {/* S7 */}
              <div style={sectionStyle} data-testid="v4-section-leistung">
                <SectionHead num={7} title={"Was das f\u00FCr Leistung und Ergebnisse bedeutet"} id="leistung" />
                <IntroText text={result.leistungEinleitung} />
                <div style={{ display: "grid", gap: 12 }}>
                  {result.leistungBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                <Kernaussage text={result.leistungKernaussage} />
              </div>

              {/* S8 */}
              <div style={sectionStyle} data-testid="v4-section-druck">
                <SectionHead num={8} title={"Wie sich die Besetzung unter Druck zeigen d\u00FCrfte"} id="druck" />
                <div style={{ display: "grid", gap: 12 }}>
                  {result.druckBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                <Kernaussage text={result.druckKernaussage} />
              </div>

              {/* S9 */}
              <div style={{ marginBottom: 36, padding: "28px 24px", borderRadius: 16, background: "rgba(26,93,171,0.04)", border: "1px solid rgba(26,93,171,0.10)" }} data-testid="v4-section-empfehlungen">
                <SectionHead num={9} title="Was jetzt wichtig ist" id="empfehlungen" />
                <IntroText text={"Nicht nur beschreiben, sondern klar sagen, was jetzt sinnvoll ist."} />
                <div style={{ display: "grid", gap: 10 }}>
                  {result.empfehlungen.map((emp, i) => (
                    <div key={emp.title} style={{ ...cardBase, display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 15, background: "#1A5DAB", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginTop: 1 }}>{i + 1}</div>
                      <div>
                        <p style={{ fontSize: 14.5, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{emp.title}</p>
                        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: "#48484A" }}>{emp.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profilvergleich kompakt */}
              <div style={{ padding: "20px 24px", borderRadius: 14, background: "#FFF", border: "1px solid rgba(0,0,0,0.06)", marginBottom: 36 }} data-testid="v4-section-struktur">
                <p style={{ fontSize: 11, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>{"Erg\u00E4nzung \u2013 Wie Team und Person im Vergleich arbeiten"}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Team</p>
                    <div style={{ display: "grid", gap: 8 }}>
                      <BarRow label="Impulsiv" value={Math.round(result.teamProfile.impulsiv)} color={COMP_HEX.impulsiv} />
                      <BarRow label="Intuitiv" value={Math.round(result.teamProfile.intuitiv)} color={COMP_HEX.intuitiv} />
                      <BarRow label="Analytisch" value={Math.round(result.teamProfile.analytisch)} color={COMP_HEX.analytisch} />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Person</p>
                    <div style={{ display: "grid", gap: 8 }}>
                      <BarRow label="Impulsiv" value={Math.round(result.personProfile.impulsiv)} color={COMP_HEX.impulsiv} />
                      <BarRow label="Intuitiv" value={Math.round(result.personProfile.intuitiv)} color={COMP_HEX.intuitiv} />
                      <BarRow label="Analytisch" value={Math.round(result.personProfile.analytisch)} color={COMP_HEX.analytisch} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "24px 0", borderTop: "1px solid rgba(0,0,0,0.06)" }} data-testid="v4-footer">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 12, color: "#A0A0A5", margin: "0 0 4px", fontWeight: 600 }}>{"bioLogic \u00B7 Integrationsanalyse"}</p>
                    <p style={{ fontSize: 12, color: "#B0B0B5", margin: "0 0 4px" }}>{"Erstellt am " + today}</p>
                    <p style={{ fontSize: 11, color: "#B0B0B5", margin: 0, lineHeight: 1.6 }}>{"Diese Analyse basiert auf dem bioLogic-Modell und erg\u00E4nzt die pers\u00F6nliche Einsch\u00E4tzung. Sie ersetzt kein Gespr\u00E4ch und keine individuelle Beurteilung."}</p>
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
