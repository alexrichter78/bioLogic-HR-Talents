import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, Briefcase, Heart, Shield, AlertTriangle, FileText } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

const COLORS = {
  imp: "#C41E3A",
  int: "#F39200",
  ana: "#1A5DAB",
};

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <div>
      {data.map((bar) => (
        <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: "#6E6E73", width: 72, flexShrink: 0 }}>{bar.label}</span>
          <div style={{ flex: 1, height: 26, borderRadius: 6, background: "rgba(0,0,0,0.04)", overflow: "hidden", position: "relative" }}>
            <div style={{
              width: `${Math.max(bar.value, 2)}%`,
              height: "100%",
              borderRadius: 6,
              background: bar.color,
              transition: "width 600ms ease",
              display: "flex",
              alignItems: "center",
              paddingLeft: 8,
              minWidth: 40,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>
                {bar.value} %
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, testId }: {
  icon: typeof BarChart3;
  title: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.02)",
        borderRadius: 14,
        padding: "20px 22px",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
      data-testid={testId}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Icon style={{ width: 15, height: 15, color: "#6E6E73", strokeWidth: 1.8 }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, margin: "12px 0 0 0" }}>
      {text}
    </p>
  );
}

function OverprintSection({ title, effects, summary }: {
  title: string;
  effects: string[];
  summary: string;
}) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.02)",
      borderRadius: 14,
      padding: "20px 22px",
      border: "1px solid rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <AlertTriangle style={{ width: 14, height: 14, color: "#6E6E73", strokeWidth: 1.8 }} />
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{title}</p>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#6E6E73", margin: "0 0 8px 0" }}>Mögliche Effekte:</p>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {effects.map((e, i) => (
          <li key={i} style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.7 }}>{e}</li>
        ))}
      </ul>
      <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.7, marginTop: 12, fontStyle: "italic" }}>
        {summary}
      </p>
    </div>
  );
}

export default function Bericht() {
  const [, setLocation] = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f0f2f5 0%, #e8eaef 40%, #dfe1e6 100%)" }} className="overflow-x-hidden">
      <div style={{ position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(255,255,255,0.82)" }} className="dark:!bg-background/90">
          <header className="flex items-center justify-between gap-4 px-6 py-4" data-testid="header-bericht">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation("/rollen-dna")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-back-bericht"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <img src={logoSrc} alt="bioLogic Logo" className="h-7 w-auto" data-testid="logo-bericht" />
              <span className="text-sm text-muted-foreground/70 font-light tracking-wide hidden sm:inline">RoleDynamics</span>
            </div>
          </header>
        </div>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-20 pt-6">
        <div className="text-center mb-8">
          <p style={{ fontSize: 11, fontWeight: 600, color: "#6E6E73", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            bioCheck-Bericht
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 8 }} data-testid="text-bericht-title">
            Analyse der strukturellen Wirklogik einer Rolle
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <SectionCard icon={BarChart3} title="Gesamtprofil" testId="bericht-gesamtprofil">
            <BarChart data={[
              { label: "Impulsiv", value: 32, color: COLORS.imp },
              { label: "Intuitiv", value: 22, color: COLORS.int },
              { label: "Analytisch", value: 46, color: COLORS.ana },
            ]} />
            <TextBlock text="Das Profil zeigt eine klare analytische Schwerpunktsetzung. Die Rolle ist strukturell ausgerichtet und verlangt Planungssicherheit, fachliche Präzision und nachvollziehbare Entscheidungsgrundlagen. Operative Handlungsfähigkeit ist erforderlich, jedoch eingebettet in definierte Abläufe und klare Prioritäten. Die intuitive Dimension ergänzt die Funktion, steht jedoch nicht im Zentrum der Anforderung." />
            <TextBlock text="Insgesamt beschreibt das Profil eine strukturgebende Rolle mit stabilisierender Wirkung." />
          </SectionCard>

          <SectionCard icon={Briefcase} title="Tätigkeitsstruktur" testId="bericht-taetigkeitsstruktur">
            <BarChart data={[
              { label: "Impulsiv", value: 35, color: COLORS.imp },
              { label: "Intuitiv", value: 18, color: COLORS.int },
              { label: "Analytisch", value: 47, color: COLORS.ana },
            ]} />
            <TextBlock text="Die Aufgaben sind überwiegend analytisch geprägt. Planung, Strukturierung und Qualitätssicherung bilden den Kern der Tätigkeit. Operative Umsetzung ist notwendig, erfolgt jedoch auf Basis klarer Vorgaben. Abstimmung findet funktional statt, ist jedoch nicht primärer Treiber der Rolle." />
          </SectionCard>

          <SectionCard icon={Heart} title="Humankompetenzen" testId="bericht-humankompetenzen">
            <BarChart data={[
              { label: "Impulsiv", value: 30, color: COLORS.imp },
              { label: "Intuitiv", value: 24, color: COLORS.int },
              { label: "Analytisch", value: 46, color: COLORS.ana },
            ]} />
            <TextBlock text="Die persönlichen Anforderungen sind vorwiegend analytisch ausgerichtet. Struktur, Genauigkeit und ein verlässliches Qualitätsverständnis prägen die Arbeitsweise. Eigeninitiative wird erwartet, bewegt sich jedoch innerhalb definierter Rahmenbedingungen. Zusammenarbeit unterstützt die Funktion, steht jedoch nicht im Vordergrund." />
          </SectionCard>

          <SectionCard icon={Shield} title="Führungskompetenzen" testId="bericht-fuehrungskompetenzen">
            <BarChart data={[
              { label: "Impulsiv", value: 38, color: COLORS.imp },
              { label: "Intuitiv", value: 20, color: COLORS.int },
              { label: "Analytisch", value: 42, color: COLORS.ana },
            ]} />
            <TextBlock text="Die Führungslogik ist ebenfalls strukturell geprägt, ergänzt durch eine spürbare impulsive Komponente. Die Rolle verlangt klare Prioritätensetzung, transparente Entscheidungen und konsequente Umsetzung im Verantwortungsbereich. Führung erfolgt über Struktur, Orientierung und eindeutige Verantwortlichkeiten. Beziehungsebene und Abstimmung sind vorhanden, jedoch nicht dominierend." />
          </SectionCard>

          <div style={{
            background: "linear-gradient(135deg, rgba(26,93,171,0.06) 0%, rgba(243,146,0,0.04) 100%)",
            borderRadius: 14,
            padding: "20px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
          }} data-testid="bericht-konsistenz">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <FileText style={{ width: 15, height: 15, color: "#6E6E73", strokeWidth: 1.8 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Konsistenz der Rolle</p>
            </div>
            <TextBlock text="Die analytische Dominanz zeigt sich über alle Ebenen hinweg. Tätigkeiten, persönliche Anforderungen und Führungslogik sind stimmig aufeinander ausgerichtet. Die Rolle erfüllt eine strukturgebende und stabilisierende Funktion innerhalb des organisationalen Gefüges." />
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(26,93,171,0.08) 0%, rgba(196,30,58,0.04) 50%, rgba(243,146,0,0.04) 100%)",
            borderRadius: 16,
            padding: "24px 22px",
            border: "1px solid rgba(26,93,171,0.08)",
          }} data-testid="bericht-fazit">
            <p style={{ fontSize: 11, fontWeight: 700, color: "#1A5DAB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Individuelles Fazit zur Rolle
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.6, margin: "0 0 8px 0" }}>
              Diese Rolle ist klar auf Struktur, Qualität und nachvollziehbare Entscheidungslogik ausgerichtet.
            </p>
            <TextBlock text="Erfolg entsteht durch saubere Priorisierung, verlässliche Prozesse und konsequente Umsetzung im definierten Verantwortungsrahmen." />
            <p style={{ fontSize: 14, color: "#1A5DAB", lineHeight: 1.75, marginTop: 12, fontWeight: 500 }}>
              Ihre Wirkung entfaltet sie durch Stabilität, Klarheit und planvolles Vorgehen.
            </p>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <AlertTriangle style={{ width: 16, height: 16, color: "#6E6E73", strokeWidth: 1.8 }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                Wirkung bei struktureller Überprägung
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <OverprintSection
                title="Wird die Rolle zu impulsiv ausgeprägt"
                effects={[
                  "Prozesse werden verkürzt",
                  "Entscheidungen werden beschleunigt",
                  "Prioritäten werden häufiger angepasst",
                  "Abstimmung wird reduziert",
                  "Dokumentationstiefe nimmt ab",
                ]}
                summary="Im Alltag bedeutet das: Tempo und Dynamik steigen. Gleichzeitig kann die notwendige strukturelle Absicherung verloren gehen. Die Rolle verliert an Stabilität und erzeugt mehr Bewegung als Ordnung."
              />
              <OverprintSection
                title="Wird die Rolle zu analytisch ausgeprägt"
                effects={[
                  "Entscheidungsprozesse verlängern sich",
                  "Absicherungsbedarf steigt",
                  "Detailtiefe nimmt zu",
                  "Reaktionsgeschwindigkeit sinkt",
                  "Risikoaversion erhöht sich",
                ]}
                summary="Im Alltag bedeutet das: Qualität und Systematik werden gestärkt. Gleichzeitig kann operative Dynamik eingeschränkt werden. Die Rolle wirkt kontrollierend statt gestaltend."
              />
              <OverprintSection
                title="Wird die Rolle zu intuitiv ausgeprägt"
                effects={[
                  "Abstimmung wird priorisiert",
                  "Konflikte werden moderiert statt entschieden",
                  "Prioritäten werden situativ angepasst",
                  "Harmonie gewinnt an Gewicht",
                  "Struktur tritt in den Hintergrund",
                ]}
                summary="Im Alltag bedeutet das: Zusammenarbeit funktioniert stabil. Gleichzeitig kann Klarheit in Zielsetzung und Verbindlichkeit abnehmen. Die Rolle verliert an struktureller Eindeutigkeit."
              />
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(26,93,171,0.06) 0%, rgba(243,146,0,0.04) 100%)",
            borderRadius: 14,
            padding: "22px 22px",
            border: "1px solid rgba(0,0,0,0.04)",
            marginTop: 4,
          }} data-testid="bericht-einordnung">
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6E6E73", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Abschließende Einordnung
            </p>
            <TextBlock text="Die Rolle ist klar strukturell angelegt und verlangt eine analytisch dominierte Grundausrichtung mit ergänzender Umsetzungsfähigkeit. Ihre Funktion besteht darin, Orientierung zu geben, Stabilität zu sichern und Entscheidungen nachvollziehbar zu gestalten." />
            <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.75, marginTop: 12, fontWeight: 600 }}>
              Sie ist nicht auf maximale Dynamik, sondern auf verlässliche Wirksamkeit ausgerichtet.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
