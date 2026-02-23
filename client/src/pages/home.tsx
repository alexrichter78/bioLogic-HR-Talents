import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dna, Target, GitCompareArrows, Users, Sparkles, ShieldCheck, PlusCircle, FolderOpen, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 700ms cubic-bezier(0.4, 0, 0.2, 1), transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      {children}
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-start gap-2 flex-wrap px-6 py-5" data-testid="header">
      <img src={logoSrc} alt="bioLogic Logo" className="h-8 w-auto" data-testid="logo" />
    </header>
  );
}

function HeroSection() {
  return (
    <FadeIn delay={100}>
      <div className="relative flex flex-col items-center justify-center py-20 px-6 text-center" data-testid="hero-section">
        <div className="relative z-10">
          <h1
            style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1.1 }}
            className="dark:text-foreground/90 mb-2"
            data-testid="text-title"
          >
            RoleDNA
          </h1>
          <p style={{ fontSize: 13, color: "#8E8E93", fontWeight: 400, letterSpacing: "0.02em" }} className="mb-5" data-testid="text-by-biologic">
            by bioLogic
          </p>
          <p style={{ fontSize: 18, color: "#6E6E73", fontWeight: 400, lineHeight: 1.5, maxWidth: 480 }} className="mx-auto" data-testid="text-subtitle">
            Strukturelle Entscheidungen für Rolle, Persönlichkeit und Team(s).
          </p>
        </div>
      </div>
    </FadeIn>
  );
}

function ProfileCard() {
  const [, setLocation] = useLocation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  return (
    <FadeIn delay={300}>
      <div
        className="mx-auto max-w-2xl w-full text-center"
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 24,
          padding: "48px 40px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
        data-testid="card-profile"
      >
        <div className="flex flex-col items-center gap-4">
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Sparkles style={{ width: 28, height: 28, color: "#0071E3", strokeWidth: 1.5 }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }} className="dark:text-foreground/90" data-testid="text-no-profile">
            Starten Sie eine neue Analyse
          </h2>
          <p style={{ fontSize: 15, color: "#6E6E73", lineHeight: 1.6, maxWidth: 420 }} data-testid="text-profile-desc">
            Erstellen Sie eine Rollen-DNA und analysieren Sie strukturelle Passung sowie Entwicklungspotenzial auf Basis klarer Handlungsempfehlungen.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                height: 52,
                paddingLeft: 28,
                paddingRight: 28,
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #0071E3, #34AADC)",
                color: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(0,113,227,0.3)",
                transition: "all 200ms ease",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,113,227,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,113,227,0.3)";
              }}
              data-testid="button-analyse-starten"
            >
              <PlusCircle style={{ width: 18, height: 18 }} />
              Neue Rollen-DNA erstellen
            </button>
            <button
              style={{
                height: 52,
                paddingLeft: 28,
                paddingRight: 28,
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 14,
                border: "1.5px solid rgba(0,0,0,0.12)",
                cursor: "pointer",
                background: "rgba(255,255,255,0.8)",
                color: "#1D1D1F",
                transition: "all 200ms ease",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.8)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
              data-testid="button-analyse-oeffnen"
            >
              <FolderOpen style={{ width: 18, height: 18 }} />
              Bestehende Analyse öffnen
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <ShieldCheck style={{ width: 14, height: 14, color: "#8E8E93" }} strokeWidth={1.5} />
            <p style={{ fontSize: 12, color: "#8E8E93" }} data-testid="text-trust">
              Wissenschaftlich fundierte Methodik mit nachvollziehbarer Ergebnislogik
            </p>
          </div>
        </div>
      </div>
      {showResetConfirm && (
        <ConfirmResetModal
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={() => {
            localStorage.removeItem("rollenDnaState");
            localStorage.removeItem("rollenDnaCompleted");
            setShowResetConfirm(false);
            setLocation("/rollen-dna");
          }}
        />
      )}
    </FadeIn>
  );
}

const features = [
  {
    icon: Dna,
    title: "Rollen-DNA definieren",
    description: "Tätigkeiten, Kompetenzen und Erfolgsfaktoren strukturiert erfassen.",
    active: true,
  },
  {
    icon: Target,
    title: "Rollenprofil ermitteln",
    description: "Erforderliche Rollenstruktur aus der definierten Logik ableiten.",
    active: false,
  },
  {
    icon: GitCompareArrows,
    title: "Passung objektiv messen",
    description: "Abweichungen, Potenziale und Entwicklungsfelder sichtbar machen.",
    active: false,
  },
  {
    icon: Users,
    title: "Team-Dynamik analysieren",
    description: "Strukturelle Balance, Reibung und Ergänzungen im Team erkennen.",
    active: false,
  },
];

function ConfirmResetModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.15)" }}
        onClick={onCancel}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 420,
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "28px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
          zIndex: 9999,
          textAlign: "center",
        }}
        data-testid="modal-confirm-reset"
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", marginBottom: 12 }}>
          Sind Sie sich sicher?
        </h3>
        <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.6, marginBottom: 24 }}>
          Alle eingegebenen Daten werden gelöscht.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onCancel}
            style={{
              height: 44,
              paddingLeft: 24,
              paddingRight: 24,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 12,
              border: "1.5px solid rgba(0,0,0,0.12)",
              background: "transparent",
              color: "#1D1D1F",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            data-testid="button-cancel-reset"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            style={{
              height: 44,
              paddingLeft: 24,
              paddingRight: 24,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #0071E3, #34AADC)",
              color: "#FFFFFF",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,113,227,0.3)",
              transition: "all 150ms ease",
            }}
            data-testid="button-confirm-reset"
          >
            Weiter
          </button>
        </div>
      </div>
    </>
  );
}

function FeatureCards() {
  const [, setLocation] = useLocation();
  const [dnaCompleted, setDnaCompleted] = useState(false);
  useEffect(() => {
    setDnaCompleted(localStorage.getItem("rollenDnaCompleted") === "true");
    const handleStorage = () => setDnaCompleted(localStorage.getItem("rollenDnaCompleted") === "true");
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const resolvedFeatures = features.map((f, i) => ({
    ...f,
    active: i === 0 ? true : dnaCompleted,
  }));

  return (
    <FadeIn delay={500}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full" data-testid="feature-cards">
        {resolvedFeatures.map((feature, index) => (
          <div
            key={feature.title}
            onClick={feature.active ? () => setLocation(index === 0 ? "/rollen-dna" : "/rollen-dna") : undefined}
            style={{
              background: feature.active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)",
              backdropFilter: feature.active ? "blur(16px)" : "none",
              WebkitBackdropFilter: feature.active ? "blur(16px)" : "none",
              borderRadius: 20,
              padding: "28px 24px",
              border: feature.active ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(0,0,0,0.03)",
              boxShadow: feature.active ? "0 4px 20px rgba(0,0,0,0.04)" : "none",
              cursor: feature.active ? "pointer" : "not-allowed",
              opacity: feature.active ? 1 : 0.45,
              transition: "all 250ms ease",
            }}
            onMouseEnter={(e) => {
              if (feature.active) {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(0,0,0,0.06)";
              }
            }}
            onMouseLeave={(e) => {
              if (feature.active) {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)";
              }
            }}
            data-testid={`card-feature-${index}`}
          >
            <div className="flex items-start gap-4">
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: feature.active ? "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))" : "rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <feature.icon style={{
                  width: 20,
                  height: 20,
                  color: feature.active ? "#0071E3" : "#8E8E93",
                  strokeWidth: 1.5,
                }} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h3 style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: feature.active ? "#1D1D1F" : "#8E8E93",
                  }} data-testid={`text-feature-title-${index}`}>
                    {feature.title}
                  </h3>
                  {feature.active && (
                    <ArrowRight style={{ width: 14, height: 14, color: "#0071E3" }} />
                  )}
                </div>
                <p style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: feature.active ? "#6E6E73" : "#AEAEB2",
                }}>
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(252,205,210,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
          animation: "homeGradientShift 20s ease-in-out infinite alternate",
        }}
      />

      <style>{`
        @keyframes homeGradientShift {
          0% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.05) translate(-1%, 1%); }
          66% { transform: scale(1.02) translate(1%, -1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
      `}</style>

      <div className="relative z-10">
        <Header />
        <HeroSection />
        <div className="px-6 pb-16 flex flex-col gap-10">
          <ProfileCard />
          <FeatureCards />
        </div>
      </div>
    </div>
  );
}
