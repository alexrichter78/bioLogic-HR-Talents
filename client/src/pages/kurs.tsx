import GlobalNav from "@/components/global-nav";
import { GraduationCap, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Kurs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  if (!user?.courseAccess) {
    return (
      <>
        <GlobalNav />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 80px)", padding: 24, textAlign: "center" }}>
          <Lock style={{ width: 48, height: 48, color: "#8E8E93", marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Kein Zugang</h2>
          <p style={{ fontSize: 14, color: "#48484A", maxWidth: 400 }}>
            Der Kursbereich ist für Ihr Konto nicht freigeschaltet. Bitte wenden Sie sich an Ihren Administrator.
          </p>
          <button
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
            style={{
              marginTop: 20, padding: "10px 24px", borderRadius: 12,
              background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFF",
              border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Zurück zur Startseite
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalNav />
      <div style={{ paddingTop: isMobile ? 60 : 80 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #34C759, #30B350)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <GraduationCap style={{ width: 28, height: 28, color: "#FFF" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#34C759", letterSpacing: "-0.02em", margin: "0 0 8px" }} data-testid="text-kurs-title">
              Kursbereich
            </h1>
            <p style={{ fontSize: 14, color: "#48484A", maxWidth: 500, margin: "0 auto" }} data-testid="text-kurs-subtitle">
              Willkommen im Lernbereich. Hier finden Sie bald Kursmodule zu Führung, Teamdynamik und bioLogic-Kompetenzanalyse.
            </p>
          </div>

          <div style={{
            padding: 32, borderRadius: 20, background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            textAlign: "center",
          }} data-testid="card-coming-soon">
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1D1D1F", margin: "0 0 8px" }}>Inhalte in Vorbereitung</p>
            <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>
              Die Kursmodule werden in Kürze freigeschaltet. Sie werden hier automatisch angezeigt, sobald sie verfügbar sind.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
