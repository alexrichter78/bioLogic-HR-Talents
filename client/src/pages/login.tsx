import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Anmeldung fehlgeschlagen");
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (res.ok) {
        setResetSent(true);
      } else {
        const data = await res.json();
        setResetError(data.error || "Fehler bei der Anfrage");
      }
    } catch {
      setResetError("Verbindungsfehler");
    }
    setResetLoading(false);
  };

  if (showReset) {
    return (
      <div className="page-gradient-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 400, padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
              <img src={logoPath} alt="bioLogic" style={{ height: 56, objectFit: "contain", marginBottom: 14 }} data-testid="img-reset-logo" />
              <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 14 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>HR Talents</span>
            </div>

            {resetSent ? (
              <div style={{ textAlign: "center" }}>
                <CheckCircle style={{ width: 40, height: 40, color: "#34C759", margin: "0 auto 16px" }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", margin: "0 0 8px" }}>Anfrage gesendet</h2>
                <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px", lineHeight: 1.5 }}>
                  Falls ein Konto mit dieser E-Mail existiert, erhalten Sie einen Link zum Zurücksetzen des Passworts.
                </p>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(""); }}
                  data-testid="button-back-to-login"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer" }}
                >
                  <ArrowLeft style={{ width: 16, height: 16 }} />
                  Zurück zur Anmeldung
                </button>
              </div>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", margin: "0 0 6px" }}>Passwort vergessen</h2>
                  <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Geben Sie Ihre E-Mail-Adresse ein</p>
                </div>

                {resetError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.12)", marginBottom: 16 }} data-testid="reset-error">
                    <AlertCircle style={{ width: 15, height: 15, color: "#FF3B30", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#C41E3A", fontWeight: 500 }}>{resetError}</span>
                  </div>
                )}

                <form onSubmit={handleResetRequest}>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>E-Mail</label>
                    <div style={{ position: "relative" }}>
                      <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9CA3AF" }} />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        data-testid="input-reset-email"
                        style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#F9FAFB", transition: "border-color 0.2s, box-shadow 0.2s", color: "#1F2937" }}
                        placeholder="name@firma.de"
                        onFocus={(e) => { e.target.style.borderColor = "#3B82F6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    data-testid="button-send-reset"
                    style={{
                      width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                      background: resetLoading ? "#9CA3AF" : "linear-gradient(135deg, #0071E3, #34AADC)",
                      color: "#fff", fontSize: 15, fontWeight: 600,
                      cursor: resetLoading ? "wait" : "pointer",
                      transition: "all 0.2s ease", letterSpacing: "0.02em",
                      boxShadow: resetLoading ? "none" : "0 2px 8px rgba(0,113,227,0.25)",
                      marginBottom: 16,
                    }}
                  >
                    {resetLoading ? "Senden..." : "Link anfordern"}
                  </button>
                </form>

                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => { setShowReset(false); setResetError(""); }}
                    data-testid="button-back-to-login-form"
                    style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <ArrowLeft style={{ width: 14, height: 14 }} />
                    Zurück zur Anmeldung
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20 }}>
            <a href="/impressum" data-testid="link-impressum-reset" className="footer-link">Impressum</a>
            <a href="/datenschutz" data-testid="link-datenschutz-reset" className="footer-link">Datenschutz</a>
            <a href="/disclaimer" data-testid="link-disclaimer-reset" className="footer-link">Disclaimer</a>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="page-gradient-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
            <img src={logoPath} alt="bioLogic" style={{ height: 56, objectFit: "contain", marginBottom: 14 }} data-testid="img-login-logo" />
            <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }} data-testid="text-login-subtitle">HR Talents</span>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.12)", marginBottom: 20 }} data-testid="login-error">
              <AlertCircle style={{ width: 15, height: 15, color: "#FF3B30", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#C41E3A", fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Benutzername</label>
              <div style={{ position: "relative" }}>
                <User style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9CA3AF" }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  data-testid="input-username"
                  style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#F9FAFB", transition: "border-color 0.2s, box-shadow 0.2s", color: "#1F2937" }}
                  placeholder="Benutzername"
                  onFocus={(e) => { e.target.style.borderColor = "#3B82F6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Passwort</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9CA3AF" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                  style={{ width: "100%", padding: "12px 42px 12px 42px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#F9FAFB", transition: "border-color 0.2s, box-shadow 0.2s", color: "#1F2937" }}
                  placeholder="Passwort eingeben"
                  onFocus={(e) => { e.target.style.borderColor = "#3B82F6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16, color: "#9CA3AF" }} /> : <Eye style={{ width: 16, height: 16, color: "#9CA3AF" }} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right", marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => setShowReset(true)}
                data-testid="button-forgot-password"
                style={{ fontSize: 13, fontWeight: 500, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Passwort vergessen?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="button-login"
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 12,
                border: "none",
                background: loading ? "#9CA3AF" : "linear-gradient(135deg, #0071E3, #34AADC)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                transition: "all 0.2s ease",
                letterSpacing: "0.02em",
                boxShadow: loading ? "none" : "0 2px 8px rgba(0,113,227,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,113,227,0.35)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = loading ? "none" : "0 2px 8px rgba(0,113,227,0.3)"; }}
            >
              {loading && <div className="bio-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {loading ? "Anmelden..." : "Anmelden"}
            </button>
          </form>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20 }}>
          <a href="/impressum" data-testid="link-impressum" className="footer-link">Impressum</a>
          <a href="/datenschutz" data-testid="link-datenschutz" className="footer-link">Datenschutz</a>
          <a href="/disclaimer" data-testid="link-disclaimer" className="footer-link">Disclaimer</a>
        </div>
      </div>
      </div>
  );
}
