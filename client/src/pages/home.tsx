import { useState, useEffect, useRef } from "react";
import { PlusCircle, FolderOpen, DoorOpen, Bot, CheckCircle, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";
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
        <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.6, marginBottom: 24 }}>
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

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* ROLLENANALYSE CARD */}
          <FadeIn delay={200}>
            <div
              style={{
                background: "rgba(255,255,255,0.65)",
                backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                borderRadius: 24, padding: "40px 36px 36px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                border: "1px solid rgba(0,0,0,0.04)",
                marginBottom: 16,
              }}
              data-testid="card-profile"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Sparkles style={{ width: 20, height: 20, color: "#0071E3", strokeWidth: 1.5 }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", margin: 0 }} data-testid="text-no-profile">
                    Rollenanalyse
                  </h2>
                </div>
              </div>

              <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.65, margin: "0 0 28px" }} data-testid="text-profile-desc">
                Definieren Sie eine Rolle und analysieren Sie die strukturelle Passung. Sie erhalten klare Handlungsempfehlungen für Besetzung, Führung und Zusammenarbeit.
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
                  ].map((text, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle style={{ width: 13, height: 13, color: "#34C759", strokeWidth: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: "#6E6E73", fontWeight: 450 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>

          {/* KI-COACH CARD */}
          <FadeIn delay={400}>
            <div
              style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                borderRadius: 20, padding: "28px 32px 24px",
                border: "1px solid rgba(0,0,0,0.04)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
              data-testid="card-ki-coach"
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot style={{ width: 20, height: 20, color: "#0071E3", strokeWidth: 1.5 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 5px", letterSpacing: "-0.01em" }}>
                    KI-Coach – Beratung auf Basis der bioLogic-Systematik
                  </h3>
                  <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.6, margin: 0 }}>
                    Nutzen Sie den KI-Coach jederzeit für Recruiting, Teamfragen, Gesprächsvorbereitung oder konkrete Handlungsempfehlungen – auch unabhängig von einer Analyse.
                  </p>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 16, marginBottom: 18 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#8E8E93", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Typische Einsatzbereiche</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
                  {[
                    "Recruiting und Stellenanzeigen",
                    "Gesprächsvorbereitung",
                    "Teamkonstellationen analysieren",
                    "Konfliktmuster erkennen",
                  ].map((text, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle style={{ width: 12, height: 12, color: "#34C759", strokeWidth: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: "#6E6E73", fontWeight: 450 }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setLocation("/ki-coach")}
                  style={{
                    height: 42, paddingLeft: 20, paddingRight: 20, fontSize: 13, fontWeight: 600,
                    borderRadius: 12, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFFFFF",
                    boxShadow: "0 4px 14px rgba(0,113,227,0.25)", transition: "all 200ms ease",
                    display: "flex", alignItems: "center", gap: 7,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,113,227,0.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,113,227,0.25)"; }}
                  data-testid="button-ki-coach"
                >
                  <Bot style={{ width: 14, height: 14 }} />
                  KI-Coach öffnen
                </button>
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
            setShowResetConfirm(false);
            setLocation("/rollen-dna");
          }}
        />
      )}

      <button
        onClick={() => setLocation("/analyse")}
        style={{
          position: "fixed", bottom: 16, left: 16, width: 32, height: 32,
          borderRadius: 8, border: "none", background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0.15, transition: "opacity 200ms ease", zIndex: 50,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.4"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.15"; }}
        data-testid="button-hidden-analyse"
      >
        <DoorOpen style={{ width: 16, height: 16, color: "#8E8E93" }} />
      </button>
    </div>
  );
}
