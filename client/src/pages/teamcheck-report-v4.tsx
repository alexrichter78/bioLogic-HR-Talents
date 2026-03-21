import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { computeTeamCheckV4, type TeamCheckV4Result } from "@/lib/teamcheck-v4-engine";
import type { TeamCheckV3Input } from "@/lib/teamcheck-v3-engine";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { COMP_HEX, BIO_COLORS } from "@/lib/bio-design";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/LOGO_bio_1773853681939.png";

function bewertungColor(b: string): string {
  if (b === "Stimmig") return BIO_COLORS.geeignet;
  if (b === "Bedingt stimmig") return BIO_COLORS.bedingt;
  return BIO_COLORS.nichtGeeignet;
}
function steuerColor(s: string): string {
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
        <p key={i} style={{ margin: i > 0 ? "10px 0 0" : "0", color: "#48484A", lineHeight: 1.85, fontSize: 14 }}>{p}</p>
      ))}
    </>
  );
}

function makeCircleDataUrl(text: string, size: number, bgColor: string, textColor: string, fontSize: number, fontWeight: number = 800, shadow: boolean = false): string {
  const scale = 4;
  const s = size * scale;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d")!;
  if (shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 3 * scale;
    ctx.shadowOffsetY = 1 * scale;
  }
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - (shadow ? 2 * scale : 0), 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.font = `${fontWeight} ${fontSize * scale}px Inter, Arial, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(text);
  const textH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const yPos = s / 2 + textH / 2 - m.actualBoundingBoxDescent;
  ctx.fillText(text, s / 2, yPos);
  return c.toDataURL("image/png");
}

function SectionHead({ num, title }: { num: number; title: string }) {
  const circleUrl = makeCircleDataUrl(String(num).padStart(2, "0"), 28, "rgba(255,255,255,0.95)", "#343A48", 12, 800, true);
  return (
    <div className="bio-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, marginLeft: -32, marginRight: -32, padding: "0 18px", height: 38, background: "linear-gradient(135deg, #343A48 0%, #3d4455 50%, #464f62 100%)", boxShadow: "0 2px 6px rgba(52,58,72,0.3)" }}>
      <img src={circleUrl} alt={String(num).padStart(2, "0")} style={{ width: 28, height: 28, flexShrink: 0, display: "block" }} />
      <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.03em", lineHeight: "38px", height: 38, display: "inline-block" }}>{title}</span>
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
    <div style={{ flex: 1, minWidth: 0, padding: "14px 16px", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 10, color: "#A0A0A5", marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color || "#1D1D1F" }} data-testid={`v4-status-${label.toLowerCase().replace(/\s/g, "-")}`}>{value}</div>
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

export default function TeamCheckReportV4() {
  const [, navigate] = useLocation();
  const [result, setResult] = useState<TeamCheckV4Result | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const raw = sessionStorage.getItem("teamcheckV4Input");
    if (!raw) {
      navigate("/team-report");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as TeamCheckV3Input;
      setResult(computeTeamCheckV4(parsed));
    } catch {
      navigate("/team-report");
    }
  }, [navigate]);

  if (!result) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fb" }}>
        <GlobalNav />
        <div style={{ maxWidth: 1120, margin: "80px auto", padding: "0 20px", textAlign: "center", color: "#6E6E73" }}>
          Lade Bericht...
        </div>
      </div>
    );
  }

  const bCol = bewertungColor(result.gesamtbewertung);
  const sCol = steuerColor(result.steuerungsaufwand);
  const rCol = risikoColor(result.risikoniveau);
  const abwCol = result.teamPersonAbweichung > 40 ? BIO_COLORS.nichtGeeignet : result.teamPersonAbweichung > 20 ? BIO_COLORS.bedingt : BIO_COLORS.geeignet;
  const sep = { paddingBottom: 36, marginBottom: 36 } as const;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif", color: "#1D1D1F", lineHeight: 1.6 }}>
      <GlobalNav />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "80px 20px 48px" }}>

        <div style={{ marginBottom: 18 }}>
          <button
            onClick={() => navigate("/team-report")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#1A5DAB", fontWeight: 600, fontSize: 14, padding: 0 }}
            data-testid="button-back-v4"
          >
            <ArrowLeft size={16} />
            Zurück zum TeamCheck
          </button>
        </div>

        <div ref={reportRef} data-testid="v4-report-wrapper">
          <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }}>

            <div className="report-header report-header--auto" data-testid="v4-header">
              <img src={logoPath} alt="bioLogic" className="report-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="report-kicker">TEAMANALYSE</div>
              <h1 className="report-title report-title--flow">Integrationsanalyse</h1>
              <div className="report-subtitle report-subtitle--flow">{result.roleTitle || "Bericht"}</div>
              <div className="report-rings" />
            </div>

            <div style={{ padding: "28px 32px 0" }}>

              {/* EINLEITUNG */}
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 16px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-einleitung-v4">
                Dieser Bericht zeigt, wie die Arbeitsweise der Person {result.roleType === "leadership" ? "in der Führungsrolle" : "im bestehenden Team"} voraussichtlich wirkt. Er macht sichtbar, wo gute Anschlussfähigkeit besteht, wo Reibung entstehen kann und welcher Führungs-, Integrations- oder Klärungsaufwand im Alltag zu erwarten ist. Unterschiede sind dabei nicht automatisch negativ. Sie können Stabilität, Ergänzung oder Entwicklung bringen, verlangen aber je nach Konstellation mehr Steuerung.
              </p>
              <div style={{ background: "linear-gradient(135deg, rgba(255,59,48,0.06) 0%, rgba(255,59,48,0.03) 100%)", borderRadius: 10, padding: "16px 20px", border: "1px solid rgba(255,59,48,0.2)", marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                  Die Aussagen beschreiben keine starren Persönlichkeitsbilder, sondern wiederkehrende und im Arbeitskontext erkennbare Tendenzen. Die Analyse ist wertfrei zu verstehen und dient als Orientierung für die Einschätzung von Passung und Wirksamkeit.
                </p>
              </div>

              {/* SECTION 1 – Management Summary */}
              <SectionHead num={1} title="Management Summary" />

              <div data-testid="v4-section-summary" style={{ marginBottom: 22 }}>
                <div style={{ marginBottom: 14, padding: "16px 20px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    <OverviewRow label="Rolle / Bereich" value={result.roleTitle || "–"} />
                    <OverviewRow label="Kontext" value={result.roleLabel} />
                    <OverviewRow label="Funktionsziel" value={result.teamGoalLabel} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                  <MetricBadge label="Gesamtbewertung" value={result.gesamtbewertung} color={bCol} />
                  <MetricBadge label="Systemwirkung" value={result.systemwirkung} />
                  <MetricBadge label="Steuerungsaufwand" value={result.steuerungsaufwand} color={sCol} />
                  <MetricBadge label="Risikoniveau" value={result.risikoniveau} color={rCol} />
                </div>

                <div style={{ marginBottom: 14, padding: "16px 20px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "12px 0 0 12px", background: `linear-gradient(180deg, ${bCol}, ${bCol}40)` }} />
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px" }}>Kurzfazit</p>
                  <p style={{ fontSize: 13, lineHeight: 1.85, color: "#48484A", margin: 0 }} data-testid="v4-kurzfazit">{result.kurzfazit}</p>
                </div>

                <div style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(26,93,171,0.04)", border: "1px solid rgba(26,93,171,0.12)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#1A5DAB", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 6px" }}>Erste Empfehlung</p>
                  <p style={{ fontSize: 13, lineHeight: 1.75, color: "#48484A", margin: 0 }}>{result.ersteEmpfehlung}</p>
                </div>
              </div>

              {/* SYSTEMÜBERBLICK */}
              <div style={{ marginBottom: 22, padding: "16px 20px", borderRadius: 12, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }} data-testid="v4-section-ueberblick">
                <p style={{ fontSize: 10, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 8px" }}>Systemüberblick</p>
                <OverviewRow label="Teamprofil" value={result.teamLabel} />
                <OverviewRow label="Personenprofil" value={result.personLabel} />
                <OverviewRow label="Team–Person-Abweichung" value={`${result.teamPersonAbweichung} Punkte`} valueColor={abwCol} />
                {result.teamGoalAbweichung !== null && (
                  <OverviewRow label="Team–Funktionsziel" value={`${result.teamGoalAbweichung} Punkte`} valueColor={result.teamGoalAbweichung <= 20 ? "#34C759" : result.teamGoalAbweichung <= 40 ? "#FF9500" : "#FF3B30"} />
                )}
                {result.personGoalAbweichung !== null && (
                  <OverviewRow label="Person–Funktionsziel" value={`${result.personGoalAbweichung} Punkte`} valueColor={result.personGoalAbweichung <= 20 ? "#34C759" : result.personGoalAbweichung <= 40 ? "#FF9500" : "#FF3B30"} />
                )}
              </div>

            </div>

            <div style={{ padding: "36px 44px 48px" }}>

              {/* Section 2 – Warum dieses Ergebnis */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-warum">
                <SectionHead num={2} title="Warum dieses Ergebnis" />
                <div style={{ display: "grid", gap: 14 }}>
                  {[
                    { title: "Ausgangslage", text: result.ausgangslage },
                    { title: "Gemeinsame Stärke", text: result.gemeinsameStaerke },
                    { title: "Kritische Abweichung", text: result.kritischeAbweichung },
                    { title: "Bedeutung des Funktionsziels", text: result.bedeutungFunktionsziel },
                  ].map(block => (
                    <div key={block.title} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{block.title}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{block.text}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.75, margin: "14px 0 0", fontStyle: "italic" }}>{result.warumFazit}</p>
              </div>

              {/* Section 3 – Wirkung im System */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-wirkung">
                <SectionHead num={3} title={result.wirkungTitle} />
                <div style={{ display: "grid", gap: 14 }}>
                  {result.wirkungBlocks.map(block => (
                    <div key={block.title} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{block.title}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{block.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4 – Chancen und Risiken */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-chancen-risiken">
                <SectionHead num={4} title="Chancen und Risiken" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "rgba(52,199,89,0.04)", border: "1px solid rgba(52,199,89,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: "#34C759" }} />
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#34C759", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Chancen</p>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, listStyleType: "none", display: "grid", gap: 8 }}>
                      {result.chancen.map((c, i) => (
                        <li key={i} style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", paddingLeft: 14, position: "relative" }}>
                          <span style={{ position: "absolute", left: 0, top: 10, width: 5, height: 5, borderRadius: 3, background: BIO_COLORS.geeignet }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ padding: "18px 22px", borderRadius: 14, background: "rgba(255,59,48,0.04)", border: "1px solid rgba(255,59,48,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: "#FF3B30" }} />
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#FF3B30", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Risiken</p>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, listStyleType: "none", display: "grid", gap: 8 }}>
                      {result.risiken.map((r, i) => (
                        <li key={i} style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", paddingLeft: 14, position: "relative" }}>
                          <span style={{ position: "absolute", left: 0, top: 10, width: 5, height: 5, borderRadius: 3, background: BIO_COLORS.nichtGeeignet }} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.75, margin: "14px 0 0", fontStyle: "italic" }}>{result.chancenRisikenFazit}</p>
              </div>

              {/* Section 5 – Was ohne diese Besetzung bleibt */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-ohne">
                <SectionHead num={5} title="Was ohne diese Besetzung bestehen bleibt" />
                <ul style={{ margin: 0, paddingLeft: 16, listStyleType: "none", display: "grid", gap: 8 }}>
                  {result.ohneBesetzung.map((item, i) => (
                    <li key={i} style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", paddingLeft: 14, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, top: 10, width: 5, height: 5, borderRadius: 3, background: "#8E8E93" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 6 – Auswirkungen im Alltag */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-alltag">
                <SectionHead num={6} title="Wie sich die Konstellation im Alltag zeigen dürfte" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.alltagsboxen.map(box => (
                    <div key={box.title} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{box.title}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{box.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7 – Leistung und Ergebnisse */}
              <div style={{ ...sep, borderBottom: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-leistung">
                <SectionHead num={7} title="Was das für Leistung, Qualität und Ergebnisse bedeutet" />
                <div style={{ display: "grid", gap: 14 }}>
                  {[
                    { title: "Kurzfristige Wirkung", text: result.kurzfristigeWirkung },
                    { title: "Mittelfristige Wirkung", text: result.mittelfristigeWirkung },
                    { title: "Einfluss auf Ergebnisqualität", text: result.ergebnisqualitaet },
                    { title: "Einfluss auf Umsetzungsgeschwindigkeit", text: result.umsetzungsgeschwindigkeit },
                  ].map(item => (
                    <div key={item.title} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{item.title}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{item.text}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.75, margin: "14px 0 0", fontStyle: "italic" }}>{result.leistungFazit}</p>
              </div>

              {/* Section 8 – Verhalten unter Druck + Empfehlungen */}
              <div style={{ paddingBottom: 12 }} data-testid="v4-section-druck">
                <SectionHead num={8} title="Verhalten unter Druck + Handlungsempfehlungen" />

                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Verhalten unter Druck</p>
                  <Paragraphs text={result.druckverhalten} />
                </div>

                <p style={{ fontSize: 11, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Handlungsempfehlungen</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.handlungsempfehlungen.map(emp => (
                    <div key={emp.title} style={{ padding: "18px 22px", borderRadius: 14, background: "linear-gradient(135deg, #f8f9fb, #f1f3f8)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{emp.title}</p>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{emp.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strukturvergleich */}
              <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-struktur">
                <p style={{ fontSize: 11, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Strukturvergleich</p>
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
                <div style={{ marginTop: 14, padding: "14px 20px", borderRadius: 14, background: `${bCol}08`, border: `1px solid ${bCol}18`, textAlign: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#48484A" }}>Team–Person-Abweichung: </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: abwCol }} data-testid="v4-abweichung">{result.teamPersonAbweichung} Punkte</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
