import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, Briefcase, Heart, Shield, AlertTriangle, FileText, Lightbulb, CheckCircle2, ChevronDown, Check } from "lucide-react";
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

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 24,
        padding: "28px 28px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
        border: "1px solid rgba(0,0,0,0.04)",
        ...style,
      }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color }: { icon: typeof BarChart3; title: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: color
          ? `linear-gradient(135deg, ${color}10, ${color}18)`
          : "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon style={{ width: 16, height: 16, color: color || "#0071E3", strokeWidth: 1.8 }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{title}</p>
    </div>
  );
}

function CollapsibleSection({ icon, title, color, defaultOpen, children, testId }: {
  icon: typeof BarChart3;
  title: string;
  color?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  testId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <GlassCard testId={testId}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
        data-testid={`button-toggle-${testId}`}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: color
              ? `linear-gradient(135deg, ${color}10, ${color}18)`
              : "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <icon style={{ width: 16, height: 16, color: color || "#0071E3", strokeWidth: 1.8 }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>{title}</span>
        </div>
        <ChevronDown style={{
          width: 18,
          height: 18,
          color: "#8E8E93",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 300ms ease",
        }} />
      </button>
      {open && (
        <div style={{ marginTop: 16 }}>
          {children}
        </div>
      )}
    </GlassCard>
  );
}

function EffectCard({ title, color, effects, summary }: {
  title: string;
  color: string;
  effects: string[];
  summary: string;
}) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.02)",
      borderRadius: 16,
      padding: "20px 22px",
      border: `1px solid ${color}12`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          background: `${color}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <AlertTriangle style={{ width: 12, height: 12, color, strokeWidth: 2 }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{title}</p>
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#8E8E93", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mögliche Effekte</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {effects.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Check style={{ width: 12, height: 12, color: "#8E8E93", marginTop: 3, flexShrink: 0, strokeWidth: 2 }} />
            <span style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.6 }}>{e}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 14,
        padding: "12px 14px",
        background: `${color}06`,
        borderRadius: 10,
        borderLeft: `3px solid ${color}`,
      }}>
        <p style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.65, margin: 0 }}>
          {summary}
        </p>
      </div>
    </div>
  );
}

export default function Bericht() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(252,205,210,0.25) 0%, transparent 50%), " +
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10">
        <div style={{ position: "sticky", top: 0, zIndex: 200 }}>
          <div style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(255,255,255,0.82)" }}>
            <header className="flex items-center justify-between gap-4 px-6 py-4" data-testid="header-bericht">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLocation("/")}
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
          <div className="text-center mb-10">
            <h1
              style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.1 }}
              data-testid="text-bericht-title"
            >
              bioCheck-Bericht
            </h1>
            <p style={{ fontSize: 15, color: "#6E6E73", fontWeight: 400, lineHeight: 1.5, marginTop: 8 }}>
              Analyse der strukturellen Wirklogik einer Rolle
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <GlassCard testId="bericht-gesamtprofil">
              <SectionHeader icon={BarChart3} title="Gesamtprofil" />
              <BarChart data={[
                { label: "Impulsiv", value: 32, color: COLORS.imp },
                { label: "Intuitiv", value: 22, color: COLORS.int },
                { label: "Analytisch", value: 46, color: COLORS.ana },
              ]} />
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>
                Das Profil zeigt eine klare analytische Schwerpunktsetzung. Die Rolle ist strukturell ausgerichtet und verlangt Planungssicherheit, fachliche Präzision und nachvollziehbare Entscheidungsgrundlagen. Operative Handlungsfähigkeit ist erforderlich, jedoch eingebettet in definierte Abläufe und klare Prioritäten. Die intuitive Dimension ergänzt die Funktion, steht jedoch nicht im Zentrum der Anforderung.
              </p>
              <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.75, marginTop: 8, fontWeight: 600 }}>
                Insgesamt beschreibt das Profil eine strukturgebende Rolle mit stabilisierender Wirkung.
              </p>
            </GlassCard>

            <GlassCard testId="bericht-taetigkeitsstruktur">
              <SectionHeader icon={Briefcase} title="Tätigkeitsstruktur" color="#F39200" />
              <BarChart data={[
                { label: "Impulsiv", value: 35, color: COLORS.imp },
                { label: "Intuitiv", value: 18, color: COLORS.int },
                { label: "Analytisch", value: 47, color: COLORS.ana },
              ]} />
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>
                Die Aufgaben sind überwiegend analytisch geprägt. Planung, Strukturierung und Qualitätssicherung bilden den Kern der Tätigkeit. Operative Umsetzung ist notwendig, erfolgt jedoch auf Basis klarer Vorgaben. Abstimmung findet funktional statt, ist jedoch nicht primärer Treiber der Rolle.
              </p>
            </GlassCard>

            <GlassCard testId="bericht-humankompetenzen">
              <SectionHeader icon={Heart} title="Humankompetenzen" color="#C41E3A" />
              <BarChart data={[
                { label: "Impulsiv", value: 30, color: COLORS.imp },
                { label: "Intuitiv", value: 24, color: COLORS.int },
                { label: "Analytisch", value: 46, color: COLORS.ana },
              ]} />
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>
                Die persönlichen Anforderungen sind vorwiegend analytisch ausgerichtet. Struktur, Genauigkeit und ein verlässliches Qualitätsverständnis prägen die Arbeitsweise. Eigeninitiative wird erwartet, bewegt sich jedoch innerhalb definierter Rahmenbedingungen. Zusammenarbeit unterstützt die Funktion, steht jedoch nicht im Vordergrund.
              </p>
            </GlassCard>

            <GlassCard testId="bericht-fuehrungskompetenzen">
              <SectionHeader icon={Shield} title="Führungskompetenzen" color="#1A5DAB" />
              <BarChart data={[
                { label: "Impulsiv", value: 38, color: COLORS.imp },
                { label: "Intuitiv", value: 20, color: COLORS.int },
                { label: "Analytisch", value: 42, color: COLORS.ana },
              ]} />
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, marginTop: 16 }}>
                Die Führungslogik ist ebenfalls strukturell geprägt, ergänzt durch eine spürbare impulsive Komponente. Die Rolle verlangt klare Prioritätensetzung, transparente Entscheidungen und konsequente Umsetzung im Verantwortungsbereich. Führung erfolgt über Struktur, Orientierung und eindeutige Verantwortlichkeiten. Beziehungsebene und Abstimmung sind vorhanden, jedoch nicht dominierend.
              </p>
            </GlassCard>

            <GlassCard testId="bericht-konsistenz" style={{ borderLeft: "4px solid #0071E3" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <CheckCircle2 style={{ width: 20, height: 20, color: "#34C759" }} />
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Konsistenz der Rolle</p>
              </div>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75 }}>
                Die analytische Dominanz zeigt sich über alle Ebenen hinweg. Tätigkeiten, persönliche Anforderungen und Führungslogik sind stimmig aufeinander ausgerichtet. Die Rolle erfüllt eine strukturgebende und stabilisierende Funktion innerhalb des organisationalen Gefüges.
              </p>
            </GlassCard>

            <GlassCard testId="bericht-fazit" style={{
              background: "linear-gradient(135deg, rgba(0,113,227,0.06), rgba(52,170,220,0.04), rgba(255,255,255,0.65))",
              border: "1px solid rgba(0,113,227,0.10)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(0,113,227,0.12), rgba(52,170,220,0.12))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Lightbulb size={16} style={{ color: "#0071E3" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.06em" }}>Individuelles Fazit zur Rolle</span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F", lineHeight: 1.6, margin: "0 0 8px 0" }}>
                Diese Rolle ist klar auf Struktur, Qualität und nachvollziehbare Entscheidungslogik ausgerichtet.
              </p>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75, margin: "0 0 10px 0" }}>
                Erfolg entsteht durch saubere Priorisierung, verlässliche Prozesse und konsequente Umsetzung im definierten Verantwortungsrahmen.
              </p>
              <p style={{ fontSize: 14, color: "#0071E3", lineHeight: 1.75, fontWeight: 500 }}>
                Ihre Wirkung entfaltet sie durch Stabilität, Klarheit und planvolles Vorgehen.
              </p>
            </GlassCard>

            <GlassCard testId="bericht-ueberpraegung" style={{ padding: "32px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(255,149,0,0.10), rgba(255,59,48,0.08))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: "#FF9500", strokeWidth: 1.8 }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                  Wirkung bei struktureller Überprägung
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <EffectCard
                  title="Wird die Rolle zu impulsiv ausgeprägt"
                  color={COLORS.imp}
                  effects={[
                    "Prozesse werden verkürzt",
                    "Entscheidungen werden beschleunigt",
                    "Prioritäten werden häufiger angepasst",
                    "Abstimmung wird reduziert",
                    "Dokumentationstiefe nimmt ab",
                  ]}
                  summary="Im Alltag bedeutet das: Tempo und Dynamik steigen. Gleichzeitig kann die notwendige strukturelle Absicherung verloren gehen. Die Rolle verliert an Stabilität und erzeugt mehr Bewegung als Ordnung."
                />
                <EffectCard
                  title="Wird die Rolle zu analytisch ausgeprägt"
                  color={COLORS.ana}
                  effects={[
                    "Entscheidungsprozesse verlängern sich",
                    "Absicherungsbedarf steigt",
                    "Detailtiefe nimmt zu",
                    "Reaktionsgeschwindigkeit sinkt",
                    "Risikoaversion erhöht sich",
                  ]}
                  summary="Im Alltag bedeutet das: Qualität und Systematik werden gestärkt. Gleichzeitig kann operative Dynamik eingeschränkt werden. Die Rolle wirkt kontrollierend statt gestaltend."
                />
                <EffectCard
                  title="Wird die Rolle zu intuitiv ausgeprägt"
                  color={COLORS.int}
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
            </GlassCard>

            <GlassCard testId="bericht-einordnung" style={{
              background: "linear-gradient(135deg, rgba(0,113,227,0.04), rgba(52,170,220,0.04), rgba(255,255,255,0.65))",
              borderLeft: "4px solid #0071E3",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <FileText style={{ width: 16, height: 16, color: "#0071E3", strokeWidth: 1.8 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.06em" }}>Abschließende Einordnung</span>
              </div>
              <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.75 }}>
                Die Rolle ist klar strukturell angelegt und verlangt eine analytisch dominierte Grundausrichtung mit ergänzender Umsetzungsfähigkeit. Ihre Funktion besteht darin, Orientierung zu geben, Stabilität zu sichern und Entscheidungen nachvollziehbar zu gestalten.
              </p>
              <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.75, marginTop: 10, fontWeight: 600 }}>
                Sie ist nicht auf maximale Dynamik, sondern auf verlässliche Wirksamkeit ausgerichtet.
              </p>
            </GlassCard>

          </div>
        </main>
      </div>
    </div>
  );
}
