import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import {
  computeTeamCheckV3,
  type TeamCheckV3Input,
  type TeamCheckV3Result,
} from "@/lib/teamcheck-v3-engine";
import { ArrowLeft } from "lucide-react";

function StatusBadge({ label }: { label: string }) {
  let cls = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ";
  if (label === "Passend") cls += "text-[#1f7a46] bg-[rgba(31,122,70,0.12)]";
  else if (label === "Bedingt passend") cls += "text-[#b76a00] bg-[rgba(183,106,0,0.12)]";
  else cls += "text-[#b42318] bg-[rgba(180,35,24,0.12)]";
  return <span className={cls} data-testid="badge-v3-passung">{label}</span>;
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((p, i) => (
        <p key={i} style={{ margin: "0 0 10px", color: "#1f2937", lineHeight: 1.7, fontSize: 15 }}>{p}</p>
      ))}
    </>
  );
}

function SectionCard({ num, title, children, testId }: { num: number; title: string; children: React.ReactNode; testId: string }) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5eaf2",
        borderRadius: 24,
        padding: "28px 28px 24px",
        boxShadow: "0 12px 32px rgba(16,24,40,0.06)",
      }}
      data-testid={testId}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "linear-gradient(135deg, #224a7a, #1a73e8)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{num}</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 54px", gap: 10, alignItems: "center" }}>
      <div style={{ fontSize: 13, color: "#5b6472", fontWeight: 600 }}>{label}</div>
      <div style={{ position: "relative", height: 14, borderRadius: 999, background: "#edf1f7", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 999, background: color, opacity: 0.88, width: `${value}%` }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700 }}>{value} %</div>
    </div>
  );
}

export default function TeamCheckReportV3() {
  const [, navigate] = useLocation();
  const [result, setResult] = useState<TeamCheckV3Result | null>(null);
  const [input, setInput] = useState<TeamCheckV3Input | null>(null);

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
        <div style={{ maxWidth: 1120, margin: "80px auto", padding: "0 20px", textAlign: "center", color: "#5b6472" }}>
          Lade Bericht...
        </div>
      </div>
    );
  }

  const steuerungsColor = result.steuerungsaufwand === "gering" ? "#1f7a46" : result.steuerungsaufwand === "mittel" ? "#b76a00" : "#b42318";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif", color: "#1f2937", lineHeight: 1.6 }}>
      <GlobalNav />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "80px 20px 48px" }}>

        <button
          onClick={() => navigate("/team-report")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#224a7a", fontWeight: 600, fontSize: 14, marginBottom: 18, padding: 0 }}
          data-testid="button-back-v3"
        >
          <ArrowLeft size={16} />
          Zurück zum TeamCheck
        </button>

        <div style={{ display: "grid", gap: 20 }}>

          <SectionCard num={1} title="Systemstatus" testId="v3-section-systemstatus">
            <p style={{ color: "#5b6472", fontSize: 14, margin: "0 0 16px" }}>
              Hier sieht die Führung sofort die Kernaussage.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <StatusBadge label={result.passung} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Rolle", value: result.roleTitle || "–" },
                { label: "Gesamtpassung", value: result.passung },
                { label: "Systemwirkung", value: result.systemwirkung },
                { label: "Teamprofil", value: result.teamLabel },
                { label: "Personenprofil", value: result.personLabel },
                { label: "Steuerungsaufwand", value: result.steuerungsaufwand },
              ].map((m) => (
                <div key={m.label} style={{ border: "1px solid #e5eaf2", borderRadius: 16, padding: 14, background: "#f9fbff" }}>
                  <div style={{ fontSize: 11, color: "#5b6472", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: m.label === "Steuerungsaufwand" ? steuerungsColor : "#111827",
                  }} data-testid={`v3-meta-${m.label.toLowerCase()}`}>{m.value}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard num={2} title="Managementfazit" testId="v3-section-fazit">
            <p style={{ fontSize: 16, lineHeight: 1.75, color: "#111827", margin: 0, fontWeight: 450 }} data-testid="v3-text-fazit">
              {result.managementFazit}
            </p>
          </SectionCard>

          <SectionCard num={3} title="Warum dieses Ergebnis" testId="v3-section-reasons">
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
              {result.reasonLines.map((r, i) => (
                <li key={i} style={{ fontSize: 15, lineHeight: 1.65 }} data-testid={`v3-reason-${i}`}>{r}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard num={4} title="Systemwirkung" testId="v3-section-systemwirkung">
            <p style={{ color: "#5b6472", fontSize: 14, margin: "0 0 14px" }}>
              Was passiert im Team, wenn diese Besetzung kommt?
            </p>
            <Paragraphs text={result.systemwirkungText} />
            <div style={{ marginTop: 16, border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#f9fbff" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Profilkonstellation</h4>
              <Paragraphs text={result.teamText} />
              <div style={{ height: 1, background: "#e5eaf2", margin: "12px 0" }} />
              <Paragraphs text={result.personText} />
            </div>
          </SectionCard>

          <SectionCard num={5} title="Strukturvergleich" testId="v3-section-strukturvergleich">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Teamprofil</h4>
                <div style={{ display: "grid", gap: 10 }}>
                  <BarRow label="Impulsiv" value={Math.round(result.teamProfile.impulsiv)} color="#C41E3A" />
                  <BarRow label="Intuitiv" value={Math.round(result.teamProfile.intuitiv)} color="#F39200" />
                  <BarRow label="Analytisch" value={Math.round(result.teamProfile.analytisch)} color="#1A5DAB" />
                </div>
              </div>
              <div style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700 }}>Person</h4>
                <div style={{ display: "grid", gap: 10 }}>
                  <BarRow label="Impulsiv" value={Math.round(result.personProfile.impulsiv)} color="#C41E3A" />
                  <BarRow label="Intuitiv" value={Math.round(result.personProfile.intuitiv)} color="#F39200" />
                  <BarRow label="Analytisch" value={Math.round(result.personProfile.analytisch)} color="#1A5DAB" />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: "12px 18px", borderRadius: 14, background: "#f0f4ff", border: "1px solid #dce4f5", textAlign: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#224a7a" }}>Team–Person-Abweichung: </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: result.teamPersonAbweichung > 40 ? "#b42318" : result.teamPersonAbweichung > 20 ? "#b76a00" : "#1f7a46" }} data-testid="v3-abweichung">
                {result.teamPersonAbweichung} Punkte
              </span>
            </div>
          </SectionCard>

          <SectionCard num={6} title="Team-Spannungsanalyse" testId="v3-section-tension">
            <div style={{ display: "grid", gap: 16 }}>
              {result.tension.map((t) => (
                <div key={t.key} style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }} data-testid={`v3-tension-${t.key}`}>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{t.title}</div>
                  <div style={{ display: "grid", gap: 10, margin: "12px 0 6px" }}>
                    <BarRow label="Team" value={t.teamValue} color="#9eb4cf" />
                    <BarRow label="Person" value={t.personValue} color="#224a7a" />
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.65 }}>{t.interpretation}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard num={7} title="Auswirkungen im Arbeitsalltag" testId="v3-section-impacts">
            <p style={{ color: "#5b6472", fontSize: 14, margin: "0 0 14px" }}>
              Wie wirkt sich die Besetzung konkret auf Entscheidungen, Arbeitsweise und den täglichen Rhythmus im Team aus?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {result.impacts.map((imp) => (
                <div key={imp.title} style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }} data-testid={`v3-impact-${imp.title.toLowerCase()}`}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{imp.title}</h4>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65 }}>{imp.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard num={8} title="Verhalten unter Druck" testId="v3-section-stress">
            <p style={{ color: "#5b6472", fontSize: 14, margin: "0 0 14px" }}>
              Was passiert, wenn der Druck steigt?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Kontrollierter Druck</h4>
                <Paragraphs text={result.stress.controlled} />
              </div>
              <div style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Unkontrollierter Stress</h4>
                <Paragraphs text={result.stress.uncontrolled} />
              </div>
            </div>
          </SectionCard>

          <SectionCard num={9} title="Risikoentwicklung über Zeit" testId="v3-section-risktimeline">
            <p style={{ color: "#5b6472", fontSize: 14, margin: "0 0 14px" }}>
              Wie entwickelt sich die Konstellation über die ersten 12 Monate?
            </p>
            <div style={{ display: "grid", gap: 14 }}>
              {result.riskTimeline.map((phase, i) => {
                const colors = [
                  { bg: "rgba(255,149,0,0.05)", border: "rgba(255,149,0,0.15)", badge: "#FF9500" },
                  { bg: "rgba(0,113,227,0.05)", border: "rgba(0,113,227,0.15)", badge: "#0071E3" },
                  { bg: "rgba(52,199,89,0.05)", border: "rgba(52,199,89,0.15)", badge: "#34C759" },
                ];
                const c = colors[i] || colors[0];
                return (
                  <div key={i} style={{ borderRadius: 18, padding: "18px 20px", background: c.bg, border: `1px solid ${c.border}` }} data-testid={`v3-risk-phase-${i}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 9, background: c.badge, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{i + 1}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{phase.label}</span>
                        <span style={{ fontSize: 13, color: "#5b6472", marginLeft: 8 }}>{phase.period}</span>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#374151" }}>{phase.text}</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard num={10} title="Chancen" testId="v3-section-chances">
            <p style={{ color: "#5b6472", fontSize: 14, margin: "0 0 14px" }}>
              Welches Potenzial steckt in dieser Konstellation?
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
              {result.chances.map((c, i) => (
                <li key={i} style={{ fontSize: 15, lineHeight: 1.65 }} data-testid={`v3-chance-${i}`}>{c}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard num={11} title="Risiken" testId="v3-section-risks">
            <p style={{ color: "#5b6472", fontSize: 14, margin: "0 0 14px" }}>
              Worauf muss geachtet werden, damit die Konstellation nicht ins Negative kippt?
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
              {result.risks.map((r, i) => (
                <li key={i} style={{ fontSize: 15, lineHeight: 1.65 }} data-testid={`v3-risk-${i}`}>{r}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard num={12} title="Handlungsempfehlung" testId="v3-section-advice">
            <p style={{ color: "#5b6472", fontSize: 14, margin: "0 0 14px" }}>
              Was kann die Führung konkret tun, um die Einbindung erfolgreich zu gestalten?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {result.advice.map((a) => (
                <div key={a.title} style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }} data-testid={`v3-advice-${a.title.toLowerCase().replace(/\s/g, "-")}`}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{a.title}</h4>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65 }}>{a.text}</p>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
