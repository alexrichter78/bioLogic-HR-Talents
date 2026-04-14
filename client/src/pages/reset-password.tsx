import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setValid(false);
      return;
    }
    setToken(t);
    fetch(`/api/auth/verify-reset/${t}`)
      .then(res => {
        setValid(res.ok);
      })
      .catch(() => setValid(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }
    if (password.length < 4) {
      setError("Passwort muss mindestens 4 Zeichen lang sein");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Fehler beim Zurücksetzen");
      }
    } catch {
      setError("Verbindungsfehler");
    }
    setLoading(false);
  };

  return (
    <div className="page-gradient-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, Arial, Helvetica, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: 24 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "48px 36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 12px 48px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
            <img src={logoPath} alt="bioLogic" style={{ height: 56, objectFit: "contain", marginBottom: 14 }} data-testid="img-reset-logo" />
            <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, transparent, #D1D5DB, transparent)", marginBottom: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>HR Talents</span>
          </div>

          {valid === null && (
            <p style={{ textAlign: "center", color: "#6B7280", fontSize: 14 }}>Wird überprüft...</p>
          )}

          {valid === false && (
            <div style={{ textAlign: "center" }}>
              <AlertCircle style={{ width: 40, height: 40, color: "#FF3B30", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", margin: "0 0 8px" }}>Link ungültig</h2>
              <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px" }}>
                Dieser Link ist ungültig oder abgelaufen.
              </p>
              <button
                onClick={() => setLocation("/")}
                data-testid="button-back-login"
                style={{ fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer" }}
              >
                Zur Anmeldung
              </button>
            </div>
          )}

          {valid === true && !success && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", margin: "0 0 6px" }}>Neues Passwort setzen</h2>
                <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Gib dein neues Passwort ein</p>
              </div>

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.12)", marginBottom: 16 }} data-testid="reset-error">
                  <AlertCircle style={{ width: 15, height: 15, color: "#FF3B30", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#C41E3A", fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Neues Passwort</label>
                  <div style={{ position: "relative" }}>
                    <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9CA3AF" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="input-new-password"
                      style={{ width: "100%", padding: "12px 42px 12px 42px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#F9FAFB", color: "#1F2937" }}
                      placeholder="Neues Passwort"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
                    >
                      {showPassword ? <EyeOff style={{ width: 16, height: 16, color: "#9CA3AF" }} /> : <Eye style={{ width: 16, height: 16, color: "#9CA3AF" }} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Passwort bestätigen</label>
                  <div style={{ position: "relative" }}>
                    <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9CA3AF" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      data-testid="input-confirm-password"
                      style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#F9FAFB", color: "#1F2937" }}
                      placeholder="Passwort wiederholen"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="button-set-password"
                  style={{
                    width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                    background: loading ? "#9CA3AF" : "linear-gradient(135deg, #0071E3, #34AADC)",
                    color: "#fff", fontSize: 15, fontWeight: 600,
                    cursor: loading ? "wait" : "pointer",
                    boxShadow: loading ? "none" : "0 2px 8px rgba(0,113,227,0.25)",
                  }}
                >
                  {loading ? "Speichern..." : "Passwort setzen"}
                </button>
              </form>
            </>
          )}

          {success && (
            <div style={{ textAlign: "center" }}>
              <CheckCircle style={{ width: 40, height: 40, color: "#34C759", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", margin: "0 0 8px" }}>Passwort geändert</h2>
              <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px" }}>
                Dein Passwort wurde erfolgreich zurückgesetzt.
              </p>
              <button
                onClick={() => setLocation("/")}
                data-testid="button-to-login"
                style={{
                  padding: "12px 32px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #0071E3, #34AADC)",
                  color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,113,227,0.25)",
                }}
              >
                Zur Anmeldung
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
