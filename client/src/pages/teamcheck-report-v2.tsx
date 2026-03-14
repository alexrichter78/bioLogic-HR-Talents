import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import {
  computeTeamCheckV2,
  type TeamCheckV2Input,
  type TeamCheckV2Result,
} from "@/lib/teamcheck-v2-engine";
import { dominanceModeOf, type ComponentKey } from "@/lib/jobcheck-engine";
import { ArrowLeft } from "lucide-react";

function StatusBadge({ label }: { label: string }) {
  let cls = "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-bold ";
  if (label === "Passend") cls += "text-[#1f7a46] bg-[rgba(31,122,70,0.12)]";
  else if (label === "Bedingt passend") cls += "text-[#b76a00] bg-[rgba(183,106,0,0.12)]";
  else cls += "text-[#b42318] bg-[rgba(180,35,24,0.12)]";
  return <span className={cls} data-testid="badge-passung">{label}</span>;
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n+/).map((p, i) => (
        <p key={i} style={{ margin: "0 0 10px", color: "#1f2937", lineHeight: 1.6 }}>{p}</p>
      ))}
    </>
  );
}

export default function TeamCheckReportV2() {
  const [, navigate] = useLocation();
  const [result, setResult] = useState<TeamCheckV2Result | null>(null);
  const [input, setInput] = useState<TeamCheckV2Input | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("teamcheckV2Input");
    if (!raw) {
      navigate("/team-report");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as TeamCheckV2Input;
      setInput(parsed);
      setResult(computeTeamCheckV2(parsed));
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

  const successFocusText = input.successFocus?.join(", ") || "-";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", fontFamily: "Inter, Arial, Helvetica, sans-serif", color: "#1f2937", lineHeight: 1.6 }}>
      <GlobalNav />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "80px 20px 48px" }}>

        <button
          onClick={() => navigate("/team-report")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#224a7a", fontWeight: 600, fontSize: 14, marginBottom: 18, padding: 0 }}
          data-testid="button-back-team-report"
        >
          <ArrowLeft size={16} />
          Zurück zum TeamCheck
        </button>

        <section
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
            border: "1px solid #e5eaf2",
            borderRadius: 28,
            padding: 28,
            boxShadow: "0 12px 32px rgba(16,24,40,0.08)",
            marginBottom: 18,
          }}
          data-testid="section-hero"
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#224a7a", marginBottom: 8 }}>
                bioLogic TeamCheck
              </div>
              <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "0 0 10px" }}>
                Team-Systemreport · Organisationsdiagnose
              </h1>
              <p style={{ color: "#5b6472", maxWidth: 820, margin: 0 }}>
                Dieser Bericht zeigt, was passiert, wenn die Besetzung in der Rolle {input.roleTitle || "–"} auf das bestehende Team trifft – wo es passt, wo es reibt und was die Führung wissen muss.
              </p>
            </div>

            <div style={{ minWidth: 300, background: "#f9fbff", border: "1px solid #e5eaf2", borderRadius: 20, padding: 18 }}>
              <StatusBadge label={result.passung} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12, marginTop: 18 }}>
                {[
                  { label: "Gesamtstatus", value: result.passung },
                  { label: "Rollenkontext", value: result.roleLabel },
                  { label: "Systemwirkung", value: result.systemwirkung },
                  { label: "Teamprofil", value: result.teamLabel },
                  { label: "Besetzungsprofil", value: result.personLabel },
                ].map((m) => (
                  <div key={m.label} style={{ background: "#fff", border: "1px solid #e5eaf2", borderRadius: 16, padding: 14 }}>
                    <div style={{ fontSize: 12, color: "#5b6472", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }} data-testid={`meta-${m.label.toLowerCase()}`}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
            {[
              { label: "Rolle", value: input.roleTitle || "-" },
              { label: "Aufgabenstruktur", value: input.taskStructure || "-" },
              { label: "Arbeitsweise", value: input.workStyle || "-" },
              { label: "Erfolgsfokus", value: successFocusText },
            ].map((t) => (
              <div key={t.label} style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 16, background: "#f9fbff" }}>
                <div style={{ fontSize: 12, color: "#5b6472", marginBottom: 6 }}>{t.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700 }} data-testid={`info-${t.label.toLowerCase()}`}>{t.value}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: "grid", gap: 18 }}>

          <Card title="Gesamtbewertung" intro="Wie gut passt die Besetzung ins aktuelle Teamumfeld – und was bedeutet das für die Zusammenarbeit im Alltag?" testId="section-gesamtbewertung">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { label: "Passung zum Team", value: result.passung },
                { label: "Systemwirkung", value: result.systemwirkung },
                { label: "Teamprägung", value: result.teamLabel },
                { label: "Besetzungsprägung", value: result.personLabel },
              ].map((s) => (
                <div key={s.label} style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 16, background: "#f9fbff" }}>
                  <div style={{ fontSize: 12, color: "#5b6472", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }} data-testid={`summary-${s.label.toLowerCase().replace(/\s/g, "-")}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Warum dieses Ergebnis" intro="Welche Faktoren haben zu dieser Einschätzung geführt?" testId="section-reasons">
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
              {result.reasons.map((r, i) => (
                <li key={i} data-testid={`reason-${i}`}>{r}</li>
              ))}
            </ul>
          </Card>

          <Card title="Team-Spannungsanalyse" intro="Wo liegen Stabilität und Ergänzung – und wo ist mit spürbarer Reibung zu rechnen?" testId="section-tension">
            <div style={{ display: "grid", gap: 16 }}>
              {result.tension.map((t) => (
                <div key={t.key} style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }} data-testid={`tension-${t.key}`}>
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{t.title}</div>
                  <div style={{ display: "grid", gap: 10, margin: "12px 0 6px" }}>
                    <BarRow label="Team" value={t.teamValue} color="#9eb4cf" />
                    <BarRow label="Person" value={t.personValue} color="#224a7a" />
                  </div>
                  <p style={{ margin: "8px 0 0" }}>{t.interpretation}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Systemwirkung" intro="Was passiert im Team, wenn diese Besetzung kommt – und welche Dynamik entsteht dadurch?" testId="section-systemwirkung">
            <Paragraphs text={result.systemwirkungText} />
            <div style={{ marginTop: 16, border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#f9fbff" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>Profilkonstellation</h4>
              <p style={{ margin: "0 0 8px" }}><strong>Team:</strong> {result.teamText}</p>
              <p style={{ margin: 0 }}><strong>Besetzung:</strong> {result.personText}</p>
            </div>
          </Card>

          <Card title="Auswirkungen im Arbeitsalltag" intro="Wie wirkt sich die Besetzung konkret auf Entscheidungen, Arbeitsweise und den täglichen Rhythmus im Team aus?" testId="section-impacts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {result.impacts.map((imp) => (
                <div key={imp.title} style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }} data-testid={`impact-${imp.title.toLowerCase()}`}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>{imp.title}</h4>
                  <p style={{ margin: 0 }}>{imp.text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Verhalten unter Druck und Stress" intro="Was passiert, wenn der Druck steigt – und wie verändert sich das Verhalten der Besetzung im Team?" testId="section-stress">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>Kontrollierter Druck</h4>
                <Paragraphs text={result.stress.controlled} />
              </div>
              <div style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>Unkontrollierter Stress</h4>
                <Paragraphs text={result.stress.uncontrolled} />
              </div>
            </div>
          </Card>

          <Card title="Chancen" intro="Welches Potenzial steckt in dieser Konstellation?" testId="section-chances">
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
              {result.chances.map((c, i) => (
                <li key={i} data-testid={`chance-${i}`}>{c}</li>
              ))}
            </ul>
          </Card>

          <Card title="Risiken" intro="Worauf muss geachtet werden, damit die Konstellation nicht ins Negative kippt?" testId="section-risks">
            <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
              {result.risks.map((r, i) => (
                <li key={i} data-testid={`risk-${i}`}>{r}</li>
              ))}
            </ul>
          </Card>

          <Card title="Handlungsempfehlung" intro="Was kann die Führung konkret tun, um die Einbindung erfolgreich zu gestalten?" testId="section-advice">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {result.advice.map((a) => (
                <div key={a.title} style={{ border: "1px solid #e5eaf2", borderRadius: 18, padding: 18, background: "#fff" }} data-testid={`advice-${a.title.toLowerCase().replace(/\s/g, "-")}`}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 17 }}>{a.title}</h4>
                  <p style={{ margin: 0 }}>{a.text}</p>
                </div>
              ))}
            </div>
            <p style={{ color: "#5b6472", fontSize: 13, marginTop: 8 }}>
              Hinweis: Das System leitet den Rollenkontext automatisch aus der Führungsverantwortung ab. Eine manuelle Auswahl zwischen Führungskraft und Teammitglied ist nicht erforderlich.
            </p>
          </Card>


        </div>
      </div>
    </div>
  );
}

function Card({ title, intro, children, testId }: { title: string; intro: string; children: React.ReactNode; testId: string }) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5eaf2",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 12px 32px rgba(16,24,40,0.08)",
      }}
      data-testid={testId}
    >
      <h2 style={{ margin: "0 0 14px", fontSize: 23, lineHeight: 1.2 }}>{title}</h2>
      <p style={{ color: "#5b6472", marginTop: -4, marginBottom: 16 }}>{intro}</p>
      {children}
    </section>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 54px", gap: 10, alignItems: "center" }}>
      <div style={{ fontSize: 13, color: "#5b6472", fontWeight: 600 }}>{label}</div>
      <div style={{ position: "relative", height: 12, borderRadius: 999, background: "#edf1f7", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: "100%", borderRadius: 999, background: color, opacity: 0.92, width: `${value}%` }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700 }}>{value}%</div>
    </div>
  );
}
