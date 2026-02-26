import { Users } from "lucide-react";
import GlobalNav from "@/components/global-nav";

export default function Teamdynamik() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }} lang="de">
      <GlobalNav />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "80px 16px" }}>
        <div style={{
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 24, padding: "48px 32px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)",
          border: "1px solid rgba(255,255,255,0.7)",
          textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(0,113,227,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <Users style={{ width: 28, height: 28, color: "#0071E3" }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }} data-testid="text-page-title">Teamdynamik</h1>
          <p style={{ fontSize: 14, color: "#8E8E93", lineHeight: 1.6 }} data-testid="text-page-status">Dieser Bereich wird in Kürze verfügbar sein.</p>
        </div>
      </main>
    </div>
  );
}
