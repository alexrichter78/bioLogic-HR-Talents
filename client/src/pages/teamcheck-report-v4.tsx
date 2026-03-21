import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { computeTeamCheckV4, type TeamCheckV4Result, type V4Block } from "@/lib/teamcheck-v4-engine";
import type { TeamCheckV3Input } from "@/lib/teamcheck-v3-engine";
import { ArrowLeft } from "lucide-react";
import { COMP_HEX, BIO_COLORS } from "@/lib/bio-design";
import logoPath from "@assets/LOGO_bio_1773853681939.png";

const bewColor = (b: string) => b === "Gut passend" ? BIO_COLORS.geeignet : b === "Teilweise passend" ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;
const bgColor = (s: string) => s === "gering" ? BIO_COLORS.geeignet : s === "mittel" ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;
const rColor = (r: string) => r === "niedrig" ? BIO_COLORS.geeignet : r === "erhöht" ? BIO_COLORS.bedingt : BIO_COLORS.nichtGeeignet;

function makeCircleDataUrl(text: string, size: number, bgColor: string, textColor: string, fontSize: number, fontWeight: number = 800): string {
  const scale = 4;
  const s = size * scale;
  const c = document.createElement("canvas");
  c.width = s; c.height = s;
  const ctx = c.getContext("2d")!;
  ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = 3 * scale; ctx.shadowOffsetY = 1 * scale;
  ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - 2 * scale, 0, Math.PI * 2);
  ctx.fillStyle = bgColor; ctx.fill(); ctx.shadowColor = "transparent";
  ctx.font = `${fontWeight} ${fontSize * scale}px Inter, Arial, sans-serif`;
  ctx.fillStyle = textColor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, s / 2, s / 2 + 1 * scale);
  return c.toDataURL("image/png");
}

function SectionHead({ num, title }: { num: number; title: string }) {
  const url = makeCircleDataUrl(String(num), 28, "rgba(255,255,255,0.95)", "#343A48", 13);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, marginLeft: -32, marginRight: -32, padding: "0 18px", height: 38, background: "linear-gradient(135deg, #343A48 0%, #3d4455 50%, #464f62 100%)", boxShadow: "0 2px 6px rgba(52,58,72,0.3)" }}>
      <img src={url} alt={String(num)} style={{ width: 28, height: 28, flexShrink: 0 }} />
      <span style={{ fontSize: 15, fontWeight: 700, color: "#FFF", letterSpacing: "0.03em" }}>{title}</span>
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 130, padding: "16px 18px", borderRadius: 12, background: "#FFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} data-testid={`v4-tile-${label.toLowerCase().replace(/[\s\/]/g, "-")}`}>
      <div style={{ fontSize: 11, color: "#8E8E93", marginBottom: 6, fontWeight: 600, letterSpacing: "0.02em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || "#1D1D1F" }}>{value}</div>
    </div>
  );
}

function Kernaussage({ text, color }: { text: string; color?: string }) {
  const c = color || "#1A5DAB";
  return (
    <div style={{ marginTop: 20, padding: "14px 20px", borderRadius: 10, background: `${c}08`, borderLeft: `3px solid ${c}` }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Kurz gesagt</p>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: "#48484A", margin: 0, fontWeight: 500 }}>{text}</p>
    </div>
  );
}

function ContentCard({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ padding: "18px 20px", borderRadius: 12, background: "#FFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>{title}</p>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: "#48484A", margin: 0 }}>{text}</p>
    </div>
  );
}

function HintBox({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 20px", borderRadius: 12, background: `${color}08`, border: `1px solid ${color}18`, position: "relative" }}>
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

function BulletList({ items, color }: { items: string[]; color: string }) {
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

const sectionStyle = { paddingBottom: 40, marginBottom: 40, borderBottom: "1px solid rgba(0,0,0,0.05)" } as const;
const cardBase = { padding: "20px 24px", borderRadius: 14, background: "#FFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" } as const;

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

  const bCol = bewColor(result.gesamteinschaetzung);

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

            {/* HEADER */}
            <div className="report-header report-header--auto" data-testid="v4-header">
              <img src={logoPath} alt="bioLogic" className="report-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="report-kicker">TEAMANALYSE</div>
              <h1 className="report-title report-title--flow">Integrationsanalyse</h1>
              <div className="report-subtitle report-subtitle--flow">{result.roleTitle || "Bericht"}</div>
              <div className="report-rings" />
            </div>

            {/* CONTENT */}
            <div style={{ padding: "32px 32px 0" }}>

              {/* Einleitung – max 2 kurze Absätze */}
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 8px" }} data-testid="text-einleitung-v4">
                Dieser Bericht zeigt, wie die Person {result.roleType === "leadership" ? "in der Führungsrolle" : "im bestehenden Team"} voraussichtlich wirken wird. Er hilft dabei, früh zu erkennen, wo Zusammenarbeit gut gelingen kann und wo im Alltag mehr Führung, Klarheit oder Begleitung nötig ist.
              </p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 28px" }}>
                Unterschiede sind dabei nicht automatisch negativ. Sie können ein Team sinnvoll ergänzen, brauchen aber klare Erwartungen und gute Abstimmung, damit daraus Stärke statt Reibung entsteht.
              </p>

              {/* SECTION 1 – Managementübersicht */}
              <SectionHead num={1} title="Managementübersicht" />

              <div data-testid="v4-section-summary" style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <Tile label="Rolle / Bereich" value={result.roleTitle || "–"} />
                  <Tile label="Kontext" value={result.roleLabel} />
                  <Tile label="Funktionsziel" value={result.teamGoalLabel} />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                  <Tile label="Gesamteinschätzung" value={result.gesamteinschaetzung} color={bCol} />
                  <Tile label="Wirkung auf das Umfeld" value={result.wirkungAufUmfeld} />
                  <Tile label="Begleitungsbedarf" value={result.begleitungsbedarf} color={bgColor(result.begleitungsbedarf)} />
                  <Tile label="Risiko im Alltag" value={result.risikoImAlltag} color={rColor(result.risikoImAlltag)} />
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <HintBox label="Kurzfazit" color={bCol}>
                    <p style={{ fontSize: 14, lineHeight: 1.8, color: "#48484A", margin: 0 }} data-testid="v4-kurzfazit">{result.kurzfazit}</p>
                  </HintBox>
                  <HintBox label="Erste Empfehlung" color="#1A5DAB">
                    <p style={{ fontSize: 14, lineHeight: 1.75, color: "#48484A", margin: 0 }}>{result.ersteEmpfehlung}</p>
                  </HintBox>
                </div>
              </div>
            </div>

            {/* SECTIONS 2–9 */}
            <div style={{ padding: "12px 32px 48px" }}>

              {/* S2 – Warum */}
              <div style={sectionStyle} data-testid="v4-section-warum">
                <SectionHead num={2} title="Warum wir zu dieser Einschätzung kommen" />
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>
                  Entscheidend ist das Zusammenspiel aus drei Punkten: wie die Person arbeitet, wie das Team arbeitet und was die Abteilung braucht.
                </p>
                <div style={{ display: "grid", gap: 12, marginBottom: 0 }}>
                  {result.warumBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                <Kernaussage text={result.warumKernaussage} />
              </div>

              {/* S3 – Wirkung */}
              <div style={sectionStyle} data-testid="v4-section-wirkung">
                <SectionHead num={3} title={result.wirkungTitle} />
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>
                  {result.roleType === "leadership"
                    ? "Wie die Person führen würde und was das für das Team bedeutet."
                    : "Wie die Person im Teamalltag spürbar wird."}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.wirkungBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                <Kernaussage text={result.wirkungKernaussage} />
              </div>

              {/* S4 – Chancen & Risiken */}
              <div style={sectionStyle} data-testid="v4-section-chancen-risiken">
                <SectionHead num={4} title="Chancen und Risiken dieser Besetzung" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={{ ...cardBase, background: "rgba(52,199,89,0.03)", border: "1px solid rgba(52,199,89,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: "#34C759" }} />
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1B7A3D", margin: 0 }}>Chancen</p>
                    </div>
                    <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, margin: "0 0 12px" }}>{result.chancenEinleitung}</p>
                    <BulletList items={result.chancenPunkte} color="#34C759" />
                  </div>
                  <div style={{ ...cardBase, background: "rgba(255,59,48,0.03)", border: "1px solid rgba(255,59,48,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: "#FF3B30" }} />
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#C41E3A", margin: 0 }}>Risiken</p>
                    </div>
                    <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, margin: "0 0 12px" }}>{result.risikenEinleitung}</p>
                    <BulletList items={result.risikenPunkte} color="#FF3B30" />
                  </div>
                </div>
              </div>

              {/* S5 – Ohne Besetzung */}
              <div style={sectionStyle} data-testid="v4-section-ohne">
                <SectionHead num={5} title="Was ohne diese Besetzung bestehen bleibt" />
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>
                  Nicht zu besetzen ist keine neutrale Entscheidung.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={cardBase}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#34C759", margin: "0 0 12px" }}>Was kurzfristig erhalten bleibt</p>
                    <BulletList items={result.ohneErhalten} color="#34C759" />
                  </div>
                  <div style={cardBase}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#FF3B30", margin: "0 0 12px" }}>Was weiter ungelöst bleibt</p>
                    <BulletList items={result.ohneUngeloest} color="#FF3B30" />
                  </div>
                </div>
                <Kernaussage text={result.ohneKernaussage} color="#6E6E73" />
              </div>

              {/* S6 – Alltag */}
              <div style={sectionStyle} data-testid="v4-section-alltag">
                <SectionHead num={6} title="So könnte es im Alltag aussehen" />
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>
                  Hier wird sichtbar, wo Zusammenarbeit leicht läuft und wo Reibung entstehen kann.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.alltagBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                {result.alltagWarnzeichen.length > 0 && (
                  <div style={{ marginTop: 16, padding: "16px 20px", borderRadius: 12, background: "rgba(255,149,0,0.05)", border: "1px solid rgba(255,149,0,0.15)" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#CC7700", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Warnzeichen im Alltag</p>
                    <BulletList items={result.alltagWarnzeichen} color="#FF9500" />
                  </div>
                )}
                <Kernaussage text={result.alltagKernaussage} />
              </div>

              {/* S7 – Leistung */}
              <div style={sectionStyle} data-testid="v4-section-leistung">
                <SectionHead num={7} title="Was das für Leistung und Ergebnisse bedeutet" />
                <div style={{ display: "grid", gap: 12 }}>
                  {result.leistungBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                <Kernaussage text={result.leistungKernaussage} />
              </div>

              {/* S8 – Druck */}
              <div style={sectionStyle} data-testid="v4-section-druck">
                <SectionHead num={8} title="Wie sich die Besetzung unter Druck zeigen dürfte" />
                <div style={{ display: "grid", gap: 12 }}>
                  {result.druckBlocks.map(b => <ContentCard key={b.title} title={b.title} text={b.text} />)}
                </div>
                <Kernaussage text={result.druckKernaussage} />
              </div>

              {/* S9 – Empfehlungen */}
              <div style={{ marginBottom: 36 }} data-testid="v4-section-empfehlungen">
                <SectionHead num={9} title="Was jetzt wichtig ist" />
                <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>
                  Nicht nur beschreiben, sondern klar sagen, was jetzt sinnvoll ist.
                </p>
                <div style={{ display: "grid", gap: 10 }}>
                  {result.empfehlungen.map((emp, i) => (
                    <div key={emp.title} style={{ ...cardBase, display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 15, background: "#1A5DAB", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, marginTop: 1 }}>{i + 1}</div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>{emp.title}</p>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: "#48484A" }}>{emp.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profilvergleich – klein, unterstützend */}
              <div style={{ paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.05)" }} data-testid="v4-section-struktur">
                <p style={{ fontSize: 11, fontWeight: 700, color: "#A0A0A5", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Ergänzung</p>
                <p style={{ fontSize: 13, color: "#8E8E93", margin: "0 0 14px" }}>Wie Team und Person im Vergleich arbeiten</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={cardBase}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>So arbeitet das Team</p>
                    <div style={{ display: "grid", gap: 8 }}>
                      <BarRow label="Impulsiv" value={Math.round(result.teamProfile.impulsiv)} color={COMP_HEX.impulsiv} />
                      <BarRow label="Intuitiv" value={Math.round(result.teamProfile.intuitiv)} color={COMP_HEX.intuitiv} />
                      <BarRow label="Analytisch" value={Math.round(result.teamProfile.analytisch)} color={COMP_HEX.analytisch} />
                    </div>
                  </div>
                  <div style={cardBase}>
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
