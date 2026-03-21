import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { computeTeamCheckV4, type TeamCheckV4Result } from "@/lib/teamcheck-v4-engine";
import type { TeamCheckV3Input } from "@/lib/teamcheck-v3-engine";
import { ArrowLeft } from "lucide-react";
import { COMP_HEX, BIO_COLORS } from "@/lib/bio-design";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/LOGO_bio_1773853681939.png";

function bewertungColor(b: string): string {
  if (b === "Gut passend") return BIO_COLORS.geeignet;
  if (b === "Teilweise passend") return BIO_COLORS.bedingt;
  return BIO_COLORS.nichtGeeignet;
}
function begleitungColor(s: string): string {
  if (s === "gering") return BIO_COLORS.geeignet;
  if (s === "mittel") return BIO_COLORS.bedingt;
  return BIO_COLORS.nichtGeeignet;
}
function risikoColor(r: string): string {
  if (r === "niedrig") return BIO_COLORS.geeignet;
  if (r === "erhöht") return BIO_COLORS.bedingt;
  return BIO_COLORS.nichtGeeignet;
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((p, i) => (
        <p key={i} style={{ margin: i > 0 ? "14px 0 0" : "0", color: "#48484A", lineHeight: 1.85, fontSize: 14 }}>{p}</p>
      ))}
    </>
  );
}

function makeCircleDataUrl(text: string, size: number, bgColor: string, textColor: string, fontSize: number, fontWeight: number = 800, shadow: boolean = false): string {
  const scale = 4;
  const s = size * scale;
  const c = document.createElement("canvas");
  c.width = s; c.height = s;
  const ctx = c.getContext("2d")!;
  if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.2)"; ctx.shadowBlur = 3 * scale; ctx.shadowOffsetY = 1 * scale; }
  ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - (shadow ? 2 * scale : 0), 0, Math.PI * 2);
  ctx.fillStyle = bgColor; ctx.fill(); ctx.shadowColor = "transparent";
  ctx.font = `${fontWeight} ${fontSize * scale}px Inter, Arial, sans-serif`;
  ctx.fillStyle = textColor; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(text);
  const textH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  ctx.fillText(text, s / 2, s / 2 + textH / 2 - m.actualBoundingBoxDescent);
  return c.toDataURL("image/png");
}

function SectionHead({ num, title }: { num: number; title: string }) {
  const circleUrl = makeCircleDataUrl(String(num), 28, "rgba(255,255,255,0.95)", "#343A48", 13, 800, true);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, marginLeft: -32, marginRight: -32, padding: "0 18px", height: 38, background: "linear-gradient(135deg, #343A48 0%, #3d4455 50%, #464f62 100%)", boxShadow: "0 2px 6px rgba(52,58,72,0.3)" }}>
      <img src={circleUrl} alt={String(num)} style={{ width: 28, height: 28, flexShrink: 0, display: "block" }} />
      <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.03em", lineHeight: "38px", height: 38, display: "inline-block" }}>{title}</span>
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 130, padding: "16px 18px", borderRadius: 12, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 11, color: "#8E8E93", marginBottom: 6, fontWeight: 600, letterSpacing: "0.02em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || "#1D1D1F" }} data-testid={`v4-tile-${label.toLowerCase().replace(/[\s\/]/g, "-")}`}>{value}</div>
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

function HintBox({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 20px", borderRadius: 12, background: `${color}08`, border: `1px solid ${color}20`, position: "relative" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "12px 0 0 12px", background: color }} />
      <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>{label}</p>
      {children}
    </div>
  );
}

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

  if (!result) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fb" }}>
        <GlobalNav />
        <div style={{ maxWidth: 1120, margin: "80px auto", padding: "0 20px", textAlign: "center", color: "#6E6E73" }}>Lade Bericht...</div>
      </div>
    );
  }

  const bCol = bewertungColor(result.gesamteinschaetzung);
  const bgCol = begleitungColor(result.begleitungsbedarf);
  const rCol = risikoColor(result.risikoImAlltag);
  const abwCol = result.teamPersonAbweichung > 40 ? BIO_COLORS.nichtGeeignet : result.teamPersonAbweichung > 20 ? BIO_COLORS.bedingt : BIO_COLORS.geeignet;

  const cardStyle = { padding: "20px 24px", borderRadius: 14, background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" } as const;
  const sectionGap = { paddingBottom: 44, marginBottom: 44 } as const;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif", color: "#1D1D1F", lineHeight: 1.6 }}>
      <GlobalNav />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "80px 20px 48px" }}>

        <div style={{ marginBottom: 18 }}>
          <button onClick={() => navigate("/team-report")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#1A5DAB", fontWeight: 600, fontSize: 14, padding: 0 }} data-testid="button-back-v4">
            <ArrowLeft size={16} /> Zurück zum TeamCheck
          </button>
        </div>

        <div ref={reportRef} data-testid="v4-report-wrapper">
          <div style={{ position: "relative", background: "#F8F9FB", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }}>

            {/* HEADER – bleibt grafisch gleich */}
            <div className="report-header report-header--auto" data-testid="v4-header">
              <img src={logoPath} alt="bioLogic" className="report-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="report-kicker">TEAMANALYSE</div>
              <h1 className="report-title report-title--flow">Integrationsanalyse</h1>
              <div className="report-subtitle report-subtitle--flow">{result.roleTitle || "Bericht"}</div>
              <div className="report-rings" />
            </div>

            {/* CONTENT */}
            <div style={{ padding: "32px 32px 0" }}>

              {/* EINLEITUNG */}
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 10px" }} data-testid="text-einleitung-v4">
                Dieser Bericht zeigt, wie die Arbeitsweise einer Person {result.roleType === "leadership" ? "in der Führungsrolle" : "im bestehenden Team"} voraussichtlich wirkt. Er macht sichtbar, wo Zusammenarbeit leicht gelingen kann, wo es im Alltag anspruchsvoller wird und an welchen Stellen Führung, Klarheit oder Begleitung besonders wichtig sind.
              </p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 10px" }}>
                Unterschiede sind dabei nicht automatisch ein Nachteil. Sie können ein Team sinnvoll ergänzen, neue Impulse bringen oder bestehende Lücken schliessen. Gleichzeitig können sie aber auch Reibung auslösen, wenn Erwartungen, Zusammenarbeit und Verantwortung nicht früh genug geklärt werden.
              </p>
              <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.75, margin: "0 0 28px", fontStyle: "italic" }}>
                Der Bericht versteht sich nicht als starres Urteil über eine Person. Er beschreibt typische Tendenzen im Arbeitsalltag und übersetzt sie in eine verständliche Einschätzung für die Praxis.
              </p>

              {/* SECTION 1 – Managementübersicht */}
              <SectionHead num={1} title="Managementübersicht" />

              <div data-testid="v4-section-summary" style={{ marginBottom: 32 }}>
                {/* Context row */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <Tile label="Rolle / Bereich" value={result.roleTitle || "–"} />
                  <Tile label="Kontext" value={result.roleLabel} />
                  <Tile label="Funktionsziel" value={result.teamGoalLabel} />
                </div>

                {/* Metric tiles */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                  <Tile label="Gesamteinschätzung" value={result.gesamteinschaetzung} color={bCol} />
                  <Tile label="Wirkung auf das Umfeld" value={result.wirkungAufUmfeld} />
                  <Tile label="Begleitungsbedarf" value={result.begleitungsbedarf} color={bgCol} />
                  <Tile label="Risiko im Alltag" value={result.risikoImAlltag} color={rCol} />
                </div>

                {/* Kurzfazit */}
                <HintBox label="Kurzfazit" color={bCol}>
                  <p style={{ fontSize: 14, lineHeight: 1.85, color: "#48484A", margin: 0 }} data-testid="v4-kurzfazit">{result.kurzfazit}</p>
                </HintBox>

                {/* Erste Empfehlung */}
                <div style={{ marginTop: 12 }}>
                  <HintBox label="Erste Empfehlung" color="#1A5DAB">
                    <p style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", margin: 0 }}>{result.ersteEmpfehlung}</p>
                  </HintBox>
                </div>
              </div>
            </div>

            {/* SECTIONS 2-8 */}
            <div style={{ padding: "12px 32px 48px" }}>

              {/* Section 2 – Warum dieses Ergebnis */}
              <div style={{ ...sectionGap, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-warum">
                <SectionHead num={2} title="Warum wir zu dieser Einschätzung kommen" />
                <Paragraphs text={result.warumText} />
              </div>

              {/* Section 3 – Wirkung */}
              <div style={{ ...sectionGap, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-wirkung">
                <SectionHead num={3} title={result.wirkungTitle} />
                <Paragraphs text={result.wirkungText} />
              </div>

              {/* Section 4 – Chancen und Risiken */}
              <div style={{ ...sectionGap, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-chancen-risiken">
                <SectionHead num={4} title="Chancen und Risiken dieser Besetzung" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={{ ...cardStyle, background: "rgba(52,199,89,0.03)", border: "1px solid rgba(52,199,89,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: "#34C759" }} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1B7A3D", margin: 0 }}>Chancen</p>
                    </div>
                    <Paragraphs text={result.chancenText} />
                    <ul style={{ margin: "14px 0 0", paddingLeft: 0, listStyleType: "none" }}>
                      {result.chancenPunkte.map((c, i) => (
                        <li key={i} style={{ fontSize: 13, lineHeight: 1.75, color: "#48484A", padding: "4px 0 4px 18px", position: "relative" }}>
                          <span style={{ position: "absolute", left: 0, top: 12, width: 5, height: 5, borderRadius: 3, background: "#34C759" }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ ...cardStyle, background: "rgba(255,59,48,0.03)", border: "1px solid rgba(255,59,48,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: "#FF3B30" }} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#C41E3A", margin: 0 }}>Risiken</p>
                    </div>
                    <Paragraphs text={result.risikenText} />
                    <ul style={{ margin: "14px 0 0", paddingLeft: 0, listStyleType: "none" }}>
                      {result.risikenPunkte.map((r, i) => (
                        <li key={i} style={{ fontSize: 13, lineHeight: 1.75, color: "#48484A", padding: "4px 0 4px 18px", position: "relative" }}>
                          <span style={{ position: "absolute", left: 0, top: 12, width: 5, height: 5, borderRadius: 3, background: "#FF3B30" }} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 5 – Was ohne Besetzung bleibt */}
              <div style={{ ...sectionGap, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-ohne">
                <SectionHead num={5} title="Was ohne diese Besetzung bestehen bleibt" />
                <Paragraphs text={result.ohneBesetzungText} />
              </div>

              {/* Section 6 – Alltag */}
              <div style={{ ...sectionGap, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-alltag">
                <SectionHead num={6} title="So könnte es im Alltag aussehen" />
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>
                  Hier wird sichtbar, wo Zusammenarbeit leicht läuft und wo Reibung entstehen kann.
                </p>
                <Paragraphs text={result.alltagText} />
              </div>

              {/* Section 7 – Leistung */}
              <div style={{ ...sectionGap, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-leistung">
                <SectionHead num={7} title="Was das für Leistung und Ergebnisse bedeutet" />
                <Paragraphs text={result.leistungText} />
              </div>

              {/* Section 8 – Druck */}
              <div style={{ ...sectionGap, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-druck">
                <SectionHead num={8} title="Wie sich die Besetzung unter Druck zeigen dürfte" />
                <Paragraphs text={result.druckText} />
              </div>

              {/* Section 9 – Empfehlungen */}
              <div style={{ marginBottom: 36 }} data-testid="v4-section-empfehlungen">
                <SectionHead num={9} title="Was jetzt wichtig ist" />
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>
                  Am Ende sollte der Bericht nicht nur beschreiben, sondern auch klar sagen, was jetzt sinnvoll ist.
                </p>
                <div style={{ display: "grid", gap: 12 }}>
                  {result.empfehlungen.map((emp, i) => (
                    <div key={emp.title} style={{ ...cardStyle, display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 14, background: "#1A5DAB", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, marginTop: 2 }}>{i + 1}</div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px" }}>{emp.title}</p>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{emp.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strukturvergleich – klein, unterstützend */}
              <div style={{ paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-struktur">
                <p style={{ fontSize: 11, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Ergänzung</p>
                <p style={{ fontSize: 13, color: "#8E8E93", margin: "0 0 14px" }}>Wie Team und Person im Vergleich arbeiten</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={cardStyle}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>So arbeitet das Team</p>
                    <div style={{ display: "grid", gap: 8 }}>
                      <BarRow label="Impulsiv" value={Math.round(result.teamProfile.impulsiv)} color={COMP_HEX.impulsiv} />
                      <BarRow label="Intuitiv" value={Math.round(result.teamProfile.intuitiv)} color={COMP_HEX.intuitiv} />
                      <BarRow label="Analytisch" value={Math.round(result.teamProfile.analytisch)} color={COMP_HEX.analytisch} />
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>So arbeitet die Person</p>
                    <div style={{ display: "grid", gap: 8 }}>
                      <BarRow label="Impulsiv" value={Math.round(result.personProfile.impulsiv)} color={COMP_HEX.impulsiv} />
                      <BarRow label="Intuitiv" value={Math.round(result.personProfile.intuitiv)} color={COMP_HEX.intuitiv} />
                      <BarRow label="Analytisch" value={Math.round(result.personProfile.analytisch)} color={COMP_HEX.analytisch} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
