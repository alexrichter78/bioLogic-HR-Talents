import { useState, useEffect, useRef } from "react";
import { PlusCircle, FolderOpen, Bot, CheckCircle, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import logoSrc from "@assets/1_1773849007741.png";
import illustrationRollenanalyse from "@assets/stellenanalyse_v3.png";
import illustrationKiCoach from "@assets/ki_coach_v5.png";

import GlobalNav from "@/components/global-nav";

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
          maxWidth: "90vw",
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
        <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, marginBottom: 24 }}>
          Alle eingegebenen Daten werden gelöscht.
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              height: 44, paddingLeft: 24, paddingRight: 24, fontSize: 14, fontWeight: 600,
              borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.12)",
              background: "transparent", color: "#1D1D1F", cursor: "pointer", transition: "all 150ms ease",
            }}
            data-testid="button-cancel-reset"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            style={{
              height: 44, paddingLeft: 24, paddingRight: 24, fontSize: 14, fontWeight: 600,
              borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
              cursor: "pointer", boxShadow: "0 4px 12px rgba(0,113,227,0.3)", transition: "all 150ms ease",
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

export default function Home() {
  const [, setLocation] = useLocation();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const state = {
          currentStep: 3,
          allCollapsed: true,
          beruf: data.beruf ?? "",
          fuehrung: data.fuehrung ?? "",
          erfolgsfokusIndices: data.erfolgsfokusIndices ?? [],
          aufgabencharakter: data.aufgabencharakter ?? "",
          arbeitslogik: data.arbeitslogik ?? "",
          activeTab: "haupt",
          taetigkeiten: data.taetigkeiten ?? [],
          nextId: data.nextId ?? 1,
        };
        localStorage.setItem("rollenDnaState", JSON.stringify(state));
        localStorage.setItem("rollenDnaCompleted", "true");
        window.dispatchEvent(new Event("rollenDnaUpdated"));
      } catch {
        alert("Die Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleNewAnalyse = () => {
    const raw = localStorage.getItem("rollenDnaState");
    let hasData = false;
    if (raw) {
      try {
        const state = JSON.parse(raw);
        hasData = !!(state.beruf || state.fuehrung || (state.erfolgsfokusIndices && state.erfolgsfokusIndices.length > 0) || (state.taetigkeiten && state.taetigkeiten.length > 0));
      } catch {}
    }
    if (hasData) {
      setShowResetConfirm(true);
    } else {
      localStorage.setItem("rollenDnaReset", "1");
      window.dispatchEvent(new Event("rollenDnaResetTriggered"));
      setLocation("/rollen-dna");
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background:
            "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(252,205,210,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
          animation: "homeGradientPulse 12s ease-in-out infinite alternate",
        }}
      />
      <style>{`
        @keyframes homeGradientPulse {
          0% { opacity: 0.85; }
          50% { opacity: 1; }
          100% { opacity: 0.85; }
        }
        @media (max-width: 600px) {
          .home-illustration-hide-mobile {
            display: none !important;
          }
        }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileLoad}
        data-testid="input-file-home-load"
      />

      <div style={{ position: "relative", zIndex: 10 }}>
        <GlobalNav />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* ROLLENANALYSE CARD */}
          <FadeIn delay={200}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 20, padding: "28px 32px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                border: "1px solid rgba(0,0,0,0.04)",
                marginBottom: 16,
                display: "flex", alignItems: "center", gap: 32,
              }}
              data-testid="card-profile"
            >
              <div style={{ flexShrink: 0, width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }} className="home-illustration-hide-mobile">
                <img src={illustrationRollenanalyse} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", margin: 0 }} data-testid="text-no-profile">
                    Stellenanalyse
                  </h2>
                  <p style={{ fontSize: 14, color: "#48484A", margin: "3px 0 0", fontWeight: 450 }}>
                    Strukturelle Passung für sichere Besetzungsentscheidungen
                  </p>
                </div>

                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.65, margin: "0 0 28px", fontWeight: 600 }} data-testid="text-profile-desc">
                  Definieren Sie eine Stelle und analysieren Sie die strukturelle Passung. Die Analyse liefert klare Handlungsempfehlungen für Besetzung, Führung und Zusammenarbeit.
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                  <button
                    onClick={handleNewAnalyse}
                    style={{
                      height: 48, paddingLeft: 24, paddingRight: 24, fontSize: 15, fontWeight: 600,
                      borderRadius: 14, border: "none", cursor: "pointer",
                      background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
                      boxShadow: "0 4px 16px rgba(0,113,227,0.3)", transition: "all 200ms ease",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,113,227,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,113,227,0.3)"; }}
                    data-testid="button-analyse-starten"
                  >
                    <PlusCircle style={{ width: 17, height: 17 }} />
                    Neue Analyse
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      height: 48, paddingLeft: 24, paddingRight: 24, fontSize: 15, fontWeight: 600,
                      borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.10)", cursor: "pointer",
                      background: "rgba(255,255,255,0.8)", color: "#1D1D1F", transition: "all 200ms ease",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.transform = "translateY(0)"; }}
                    data-testid="button-analyse-oeffnen"
                  >
                    <FolderOpen style={{ width: 17, height: 17 }} />
                    Analyse öffnen
                  </button>
                </div>

                <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                    {[
                      "Wissenschaftlich fundierte Methodik",
                      "Transparente Ergebnislogik",
                      "Klare Entscheidungsstruktur",
                      "Reduziert Fehlbesetzungsrisiken",
                    ].map((text, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle style={{ width: 13, height: 13, color: "#34C759", strokeWidth: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: "#48484A", fontWeight: 450 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* KI-COACH CARD */}
          <FadeIn delay={400}>
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 20, padding: "28px 32px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                border: "1px solid rgba(0,0,0,0.04)",
                display: "flex", alignItems: "center", gap: 32,
              }}
              data-testid="card-ki-coach"
            >
              <div style={{ flexShrink: 0, width: 180, height: 180, borderRadius: 20, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} className="home-illustration-hide-mobile">
                <img src={illustrationKiCoach} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: 0, letterSpacing: "-0.02em" }}>
                    KI-Coach
                  </h3>
                  <p style={{ fontSize: 14, color: "#48484A", margin: "3px 0 0", fontWeight: 450 }}>
                    Coaching und Beratung auf Basis der bioLogic-Systematik
                  </p>
                </div>

                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.65, margin: "0 0 24px", fontWeight: 600 }}>
                  Nutzen Sie den KI-Coach für Recruiting, Teamfragen, Gesprächsvorbereitung und konkrete Handlungsempfehlungen – jederzeit, auch ohne Analyse.
                </p>

                <div style={{ marginBottom: 24 }}>
                  <button
                    onClick={() => setLocation("/ki-coach")}
                    style={{
                      height: 48, paddingLeft: 24, paddingRight: 24, fontSize: 15, fontWeight: 600,
                      borderRadius: 14, border: "none", cursor: "pointer",
                      background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
                      boxShadow: "0 4px 16px rgba(0,113,227,0.3)", transition: "all 200ms ease",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,113,227,0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,113,227,0.25)"; }}
                    data-testid="button-ki-coach"
                  >
                    <Bot style={{ width: 17, height: 17 }} />
                    KI-Coach öffnen
                  </button>
                </div>

                <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#48484A", margin: "0 0 10px" }}>Typische Einsatzbereiche</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
                    {[
                      "Recruiting und Stellenanzeigen",
                      "Gesprächsvorbereitung",
                      "Analyse von Teamkonstellationen",
                      "Konfliktmuster erkennen und lösen",
                    ].map((text, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle style={{ width: 12, height: 12, color: "#34C759", strokeWidth: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: "#48484A", fontWeight: 450 }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {showResetConfirm && (
        <ConfirmResetModal
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={() => {
            localStorage.removeItem("rollenDnaState");
            localStorage.removeItem("rollenDnaCompleted");
            localStorage.removeItem("kompetenzenCache");
            localStorage.removeItem("berichtCache");
            localStorage.removeItem("bioCheckTextOverride");
            localStorage.removeItem("bioCheckIntroOverride");
            localStorage.removeItem("bioCheckTextGenerated");
            localStorage.removeItem("analyseTexte");
            localStorage.setItem("rollenDnaReset", "1");
            window.dispatchEvent(new Event("rollenDnaResetTriggered"));
            setShowResetConfirm(false);
            setLocation("/rollen-dna");
          }}
        />
      )}

    </div>
  );
}
