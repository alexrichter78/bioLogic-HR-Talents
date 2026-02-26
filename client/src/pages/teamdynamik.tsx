import { useLocation } from "wouter";
import { Users } from "lucide-react";
import GlobalNav from "@/components/global-nav";

function GlassCard({ children, style, testId }: { children: React.ReactNode; style?: React.CSSProperties; testId?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.78)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      borderRadius: 32, padding: "36px 32px",
      boxShadow: "0 2px 20px rgba(0,0,0,0.03), 0 12px 48px rgba(0,0,0,0.05)",
      border: "1px solid rgba(255,255,255,0.7)",
      ...style,
    }} data-testid={testId}>{children}</div>
  );
}

export default function Teamdynamik() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }}>
      <GlobalNav />
      <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 60px)" }}>
        <GlassCard testId="teamdynamik-placeholder">
          <div className="text-center" style={{ padding: "24px 44px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg, rgba(0,113,227,0.08), rgba(52,170,220,0.06))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Users style={{ width: 24, height: 24, color: "#0071E3" }} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", marginBottom: 8 }} data-testid="text-teamdynamik-title">Teamdynamik</p>
            <p style={{ fontSize: 14, color: "#8E8E93", marginBottom: 20, maxWidth: 280 }} data-testid="text-teamdynamik-desc">Dieser Bereich wird in Kürze verfügbar sein.</p>
            <button
              onClick={() => setLocation("/rollen-dna")}
              style={{ background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,113,227,0.25)" }}
              data-testid="button-goto-rollen-dna"
            >
              Zur Datenerfassung
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
