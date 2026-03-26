import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import logoPath from "@assets/LOGO_bio_1773853681939.png";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Anmeldung fehlgeschlagen");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf3 50%, #f5f7fb 100%)", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: 24 }}>
        <div style={{ background: "rgba(0,113,227,0.05)", border: "1px solid rgba(0,113,227,0.12)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#3A3A3C", lineHeight: 1.5 }} data-testid="login-test-hint">
          <span style={{ fontWeight: 700, color: "#0071E3", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Testzugang</span>
          <br />
          E-Mail: <span style={{ fontWeight: 600 }}>test@test.de</span>
          <br />
          Passwort: <span style={{ fontWeight: 600 }}>bio1!</span>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 32px", boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img src={logoPath} alt="bioLogic" style={{ height: 32, marginBottom: 16 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1D1D1F", margin: "0 0 6px", letterSpacing: "-0.02em" }} data-testid="text-login-title">Anmelden</h1>
            <p style={{ fontSize: 14, color: "#6E6E73", margin: 0 }}>Melden Sie sich mit Ihren Zugangsdaten an</p>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10, background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.15)", marginBottom: 20 }} data-testid="login-error">
              <AlertCircle style={{ width: 16, height: 16, color: "#FF3B30", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#C41E3A", fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#48484A", display: "block", marginBottom: 6 }}>E-Mail</label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#8E8E93" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                  style={{ width: "100%", padding: "10px 12px 10px 38px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#FAFBFC", transition: "border-color 0.15s" }}
                  placeholder="name@firma.de"
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#48484A", display: "block", marginBottom: 6 }}>Passwort</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#8E8E93" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                  style={{ width: "100%", padding: "10px 40px 10px 38px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#FAFBFC", transition: "border-color 0.15s" }}
                  placeholder="Passwort eingeben"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16, color: "#8E8E93" }} /> : <Eye style={{ width: 16, height: 16, color: "#8E8E93" }} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="button-login"
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 12,
                border: "none",
                background: loading ? "#8E8E93" : "#1D1D1F",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {loading ? "Anmelden..." : "Anmelden"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#8E8E93", marginTop: 20 }}>bioLogic HR Analytics</p>
      </div>
    </div>
  );
}
