import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useRegion, type Region } from "@/lib/region";
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import logoPath from "@assets/Logo_bioLogic_1774652440525.gif";

const FLAG_OPTIONS: { value: Region; label: string; flag: JSX.Element }[] = [
  { value: "DE", label: "DE", flag: <svg viewBox="0 0 20 14" style={{ width: 20, height: 14, borderRadius: 2, overflow: "hidden", display: "block" }}><rect y="0" width="20" height="4.67" fill="#000"/><rect y="4.67" width="20" height="4.67" fill="#D00"/><rect y="9.33" width="20" height="4.67" fill="#FFCE00"/></svg> },
  { value: "CH", label: "CH", flag: <svg viewBox="0 0 20 14" style={{ width: 20, height: 14, borderRadius: 2, overflow: "hidden", display: "block" }}><rect width="20" height="14" fill="#D52B1E"/><rect x="8" y="2.5" width="4" height="9" fill="#FFF"/><rect x="5.5" y="5" width="9" height="4" fill="#FFF"/></svg> },
  { value: "AT", label: "AT", flag: <svg viewBox="0 0 20 14" style={{ width: 20, height: 14, borderRadius: 2, overflow: "hidden", display: "block" }}><rect y="0" width="20" height="4.67" fill="#ED2939"/><rect y="4.67" width="20" height="4.67" fill="#FFF"/><rect y="9.33" width="20" height="4.67" fill="#ED2939"/></svg> },
  { value: "EN", label: "EN", flag: <svg viewBox="0 0 20 14" style={{ width: 20, height: 14, borderRadius: 2, overflow: "hidden", display: "block" }}><rect width="20" height="14" fill="#012169"/><polygon points="0,0 20,14 20,11.5 2.5,0" fill="#FFF"/><polygon points="20,0 0,14 0,11.5 17.5,0" fill="#FFF"/><polygon points="0,0 20,14 20,12.6 1.4,0" fill="#C8102E"/><polygon points="20,0 0,14 0,12.6 18.6,0" fill="#C8102E"/><polygon points="0,0 20,14 20,14 0,0" fill="none"/><rect x="8" y="0" width="4" height="14" fill="#FFF"/><rect x="0" y="5" width="20" height="4" fill="#FFF"/><rect x="9" y="0" width="2" height="14" fill="#C8102E"/><rect x="0" y="6" width="20" height="2" fill="#C8102E"/></svg> },
  { value: "FR", label: "FR", flag: <svg viewBox="0 0 20 14" style={{ width: 20, height: 14, borderRadius: 2, overflow: "hidden", display: "block" }}><rect width="6.67" height="14" fill="#002395"/><rect x="6.67" width="6.67" height="14" fill="#FFF"/><rect x="13.33" width="6.67" height="14" fill="#ED2939"/></svg> },
];

export default function Login() {
  const { login } = useAuth();
  const { region, setRegion } = useRegion();
  const en = region === "EN";
  const fr = region === "FR";
  const [, setLocation] = useLocation();
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
      setError(result.error || (fr ? "Connexion échouée" : en ? "Login failed" : "Anmeldung fehlgeschlagen"));
    } else {
      setLocation("/");
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
        setResetError(data.error || (fr ? "Erreur de demande" : en ? "Request error" : "Fehler bei der Anfrage"));
      }
    } catch {
      setResetError((fr ? "Erreur de connexion" : en ? "Connection error" : "Verbindungsfehler"));
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
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", margin: "0 0 8px" }}>{fr ? "Demande envoyée" : en ? "Request sent" : "Anfrage gesendet"}</h2>
                <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px", lineHeight: 1.5 }}>
                  {en
                    ? "If an account with this email exists, you will receive a link to reset your password."
                    : "Falls ein Konto mit dieser E-Mail existiert, erhältst du einen Link zum Zurücksetzen des Passworts."}
                </p>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(""); }}
                  data-testid="button-back-to-login"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer" }}
                >
                  <ArrowLeft style={{ width: 16, height: 16 }} />
                  {fr ? "Retour à la connexion" : en ? "Back to sign in" : "Zurück zur Anmeldung"}
                </button>
              </div>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1F2937", margin: "0 0 6px" }}>{fr ? "Mot de passe oublié" : en ? "Forgot password" : "Passwort vergessen"}</h2>
                  <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>{fr ? "Saisis ton adresse e-mail" : en ? "Enter your email address" : "Gib deine E-Mail-Adresse ein"}</p>
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
                        onInvalid={e => { const el = e.target as HTMLInputElement; if (el.validity.valueMissing) { el.setCustomValidity(fr ? "Merci de remplir ce champ." : en ? "Please fill in this field." : "Füllen Sie dieses Feld aus."); } else if (el.validity.typeMismatch) { el.setCustomValidity(fr ? "Merci d'entrer une adresse e-mail valide." : en ? "Please enter a valid email address." : "Geben Sie eine gültige E-Mail-Adresse ein."); } else { el.setCustomValidity(""); } }}
                        onInput={e => (e.target as HTMLInputElement).setCustomValidity("")}
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
                    {resetLoading ? (fr ? "Envoi..." : en ? "Sending..." : "Senden...") : (fr ? "Demander le lien" : en ? "Request link" : "Link anfordern")}
                  </button>
                </form>

                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => { setShowReset(false); setResetError(""); }}
                    data-testid="button-back-to-login-form"
                    style={{ fontSize: 13, fontWeight: 600, color: "#3B82F6", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <ArrowLeft style={{ width: 14, height: 14 }} />
                    {fr ? "Retour à la connexion" : en ? "Back to sign in" : "Zurück zur Anmeldung"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, marginBottom: 4 }}>
            {FLAG_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRegion(opt.value)}
                data-testid={`login-region-${opt.value.toLowerCase()}`}
                title={opt.label}
                style={{
                  display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "5px 8px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: region === opt.value ? "rgba(0,113,227,0.1)" : "transparent",
                  boxShadow: region === opt.value ? "0 0 0 1.5px rgba(0,113,227,0.3)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {opt.flag}
                <span style={{ fontSize: 10, fontWeight: 600, color: region === opt.value ? "#0071E3" : "#9CA3AF", letterSpacing: "0.04em" }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
            <a href="/impressum" data-testid="link-impressum-reset" className="footer-link">{fr ? "Mentions légales" : en ? "Legal Notice" : "Impressum"}</a>
            <a href="/datenschutz" data-testid="link-datenschutz-reset" className="footer-link">{fr ? "Politique de confidentialité" : en ? "Privacy Policy" : "Datenschutz"}</a>
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
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{fr ? "Nom d'utilisateur" : en ? "Username" : "Benutzername"}</label>
              <div style={{ position: "relative" }}>
                <User style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9CA3AF" }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  data-testid="input-username"
                  style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#F9FAFB", transition: "border-color 0.2s, box-shadow 0.2s", color: "#1F2937" }}
                  placeholder={fr ? "Nom d'utilisateur" : en ? "Username" : "Benutzername"}
                  onInvalid={e => { const el = e.target as HTMLInputElement; el.setCustomValidity(fr ? "Merci de remplir ce champ." : en ? "Please fill in this field." : "Füllen Sie dieses Feld aus."); }}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity("")}
                  onFocus={(e) => { e.target.style.borderColor = "#3B82F6"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{fr ? "Mot de passe" : en ? "Password" : "Passwort"}</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#9CA3AF" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                  style={{ width: "100%", padding: "12px 42px 12px 42px", borderRadius: 12, border: "1.5px solid #E5E7EB", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#F9FAFB", transition: "border-color 0.2s, box-shadow 0.2s", color: "#1F2937" }}
                  placeholder={fr ? "Saisir le mot de passe" : en ? "Enter password" : "Passwort eingeben"}
                  onInvalid={e => { const el = e.target as HTMLInputElement; el.setCustomValidity(fr ? "Merci de remplir ce champ." : en ? "Please fill in this field." : "Füllen Sie dieses Feld aus."); }}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity("")}
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
                {fr ? "Mot de passe oublié ?" : en ? "Forgot password?" : "Passwort vergessen?"}
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
              {loading ? (fr ? "Connexion..." : en ? "Signing in..." : "Anmelden...") : (fr ? "Se connecter" : en ? "Sign in" : "Anmelden")}
            </button>
          </form>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, marginBottom: 4 }}>
          {FLAG_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRegion(opt.value)}
              data-testid={`login-region-${opt.value.toLowerCase()}`}
              title={opt.label}
              style={{
                display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "5px 8px", borderRadius: 8, border: "none", cursor: "pointer",
                background: region === opt.value ? "rgba(0,113,227,0.1)" : "transparent",
                boxShadow: region === opt.value ? "0 0 0 1.5px rgba(0,113,227,0.3)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {opt.flag}
              <span style={{ fontSize: 10, fontWeight: 600, color: region === opt.value ? "#0071E3" : "#9CA3AF", letterSpacing: "0.04em" }}>{opt.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
          <a href="/impressum" data-testid="link-impressum" className="footer-link">{fr ? "Mentions légales" : en ? "Legal Notice" : "Impressum"}</a>
          <a href="/datenschutz" data-testid="link-datenschutz" className="footer-link">{fr ? "Politique de confidentialité" : en ? "Privacy Policy" : "Datenschutz"}</a>
          <a href="/disclaimer" data-testid="link-disclaimer" className="footer-link">Disclaimer</a>
        </div>
      </div>
      </div>
  );
}
