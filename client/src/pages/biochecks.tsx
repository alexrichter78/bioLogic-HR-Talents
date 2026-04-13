import { useState } from "react";
import GlobalNav from "@/components/global-nav";
import { Building2, Lock, Plus, Trash2, Send, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

interface Participant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

let nextId = 1;

function createEmptyParticipant(): Participant {
  return { id: nextId++, firstName: "", lastName: "", email: "" };
}


export default function BioChecks() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [participants, setParticipants] = useState<Participant[]>([createEmptyParticipant()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{ email: string; status: string }[]>([]);
  const [cardOpen, setCardOpen] = useState(true);

  if (!user?.courseAccess && user?.role !== "subadmin") {
    return (
      <div className="page-gradient-bg">
        <GlobalNav />
        <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999, background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", padding: isMobile ? "4px 0 6px" : "5px 0 10px" }}>
            <div className="w-full mx-auto" style={{ maxWidth: 1100, padding: isMobile ? "0 12px" : "0 24px" }}>
              <div className="text-center">
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#1D1D1F" }}>
                  bioChecks
                </h1>
                <p style={{ fontSize: 13, color: "#6E6E73", fontWeight: 450, margin: 0 }}>
                  Unternehmen & extern
                </p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 600, margin: "0 auto", paddingTop: isMobile ? 130 : 160, padding: isMobile ? "130px 16px 40px" : "160px 24px 40px", textAlign: "center" }}>
          <div style={{
            background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
            borderRadius: 20, padding: isMobile ? "32px 20px" : "48px 40px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
            border: "1px solid rgba(0,0,0,0.04)",
          }}>
            <Lock style={{ width: 40, height: 40, color: "#8E8E93", marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }} data-testid="text-no-access-biochecks">Kein Zugang</h2>
            <p style={{ fontSize: 14, color: "#48484A", maxWidth: 400, margin: "0 auto 24px" }}>
              Dieser Bereich ist für Ihr Konto nicht freigeschaltet. Bitte wenden Sie sich an Ihren Administrator.
            </p>
            <button
              onClick={() => setLocation("/")}
              data-testid="button-back-home-biochecks"
              style={{
                padding: "10px 24px", borderRadius: 12,
                background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFF",
                border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,113,227,0.25)",
              }}
            >
              Zurück zur Startseite
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canManage = user?.role === "admin" || user?.role === "subadmin";

  if (!canManage) {
    return (
      <div className="page-gradient-bg">
        <GlobalNav />
        <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999, background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", padding: isMobile ? "4px 0 6px" : "5px 0 10px" }}>
            <div className="w-full mx-auto" style={{ maxWidth: 1100, padding: isMobile ? "0 12px" : "0 24px" }}>
              <div className="text-center">
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#1D1D1F" }} data-testid="text-biochecks-title">
                  bioChecks
                </h1>
                <p style={{ fontSize: 13, color: "#6E6E73", fontWeight: 450, margin: 0 }}>
                  Willkommen. Hier finden Sie Analysen für Unternehmen & externe Anforderungen.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto" style={{ maxWidth: 1100, paddingTop: isMobile ? 110 : 135, paddingBottom: isMobile ? 100 : 40, paddingLeft: isMobile ? 8 : 24, paddingRight: isMobile ? 8 : 24 }}>

          <div style={{
            background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
            borderRadius: 20, padding: isMobile ? "32px 20px" : "40px 32px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
            border: "1px solid rgba(0,0,0,0.04)", textAlign: "center",
          }} data-testid="card-biochecks-coming-soon">
            <p style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Inhalte in Vorbereitung</p>
            <p style={{ fontSize: 14, color: "#6E6E73", margin: 0, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
              Die Inhalte werden in Kürze freigeschaltet. Sie werden hier automatisch angezeigt, sobald sie verfügbar sind.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.1)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#FAFBFC",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#48484A",
    display: "block",
    marginBottom: 4,
  };

  function addParticipant() {
    setParticipants(prev => [...prev, createEmptyParticipant()]);
  }

  function removeParticipant(id: number) {
    setParticipants(prev => prev.filter(p => p.id !== id));
  }

  function updateParticipant(id: number, field: keyof Omit<Participant, "id">, value: string) {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const valid = participants.filter(p => p.firstName.trim() && p.lastName.trim() && p.email.trim());
    if (valid.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/enroll-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ participants: valid.map(({ firstName, lastName, email }) => ({ firstName, lastName, email })) }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.results || []);
        setSubmitted(true);
      } else {
        setError(data.error || "Freischaltung fehlgeschlagen");
      }
    } catch (err) {
      setError("Verbindungsfehler – bitte erneut versuchen");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    nextId = 1;
    setParticipants([createEmptyParticipant()]);
    setSubmitted(false);
    setResults([]);
    setError("");
  }

  return (
    <div className="page-gradient-bg">
      <GlobalNav />

      <div style={{ position: "fixed", top: isMobile ? 48 : 56, left: 0, right: 0, zIndex: 8999, background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", padding: isMobile ? "4px 0 6px" : "5px 0 10px" }}>
          <div className="w-full mx-auto" style={{ maxWidth: 1100, padding: isMobile ? "0 12px" : "0 24px" }}>
            <div className="text-center">
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#1D1D1F" }} data-testid="text-biochecks-title">
                bioChecks
              </h1>
              <p style={{ fontSize: 13, color: "#6E6E73", fontWeight: 450, margin: 0 }}>
                Zugänge freischalten für Unternehmen & externe Nutzer.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto" style={{ maxWidth: 1100, paddingTop: isMobile ? 110 : 135, paddingBottom: isMobile ? 100 : 40, paddingLeft: isMobile ? 8 : 24, paddingRight: isMobile ? 8 : 24 }}>

        <div style={{
          background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 20,
          boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
          border: "1px solid rgba(0,0,0,0.04)",
          overflow: "hidden",
        }} data-testid="card-biochecks-main">

          <button
            onClick={() => setCardOpen(!cardOpen)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 16px" : "20px 32px", border: "none", outline: "none", background: "transparent", cursor: "pointer", transition: "background 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.02)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            data-testid="button-toggle-biochecks-card"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Building2 style={{ width: 22, height: 22, color: "#0071E3", flexShrink: 0 }} />
              <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F" }}>
                Zugänge freischalten
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${cardOpen ? "rotate-180" : ""}`} />
          </button>

          {cardOpen && (<>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />

          {submitted ? (
            <div style={{ padding: isMobile ? "32px 20px" : "40px 32px", textAlign: "center" }} data-testid="card-biochecks-success">
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "linear-gradient(135deg, #34C759, #30B350)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                boxShadow: "0 4px 12px rgba(52,199,89,0.25)",
              }}>
                <CheckCircle2 style={{ width: 28, height: 28, color: "#FFF" }} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Zugänge freigeschaltet</p>
              <p style={{ fontSize: 14, color: "#6E6E73", margin: "0 0 24px", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                Die Teilnehmer wurden erfolgreich verarbeitet.
              </p>

              {results.length > 0 && (
                <div style={{ textAlign: "left", maxWidth: 500, margin: "0 auto 24px" }}>
                  {results.map((r, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", borderRadius: 10,
                      background: i % 2 === 0 ? "rgba(0,0,0,0.02)" : "transparent",
                      fontSize: 13,
                    }} data-testid={`biochecks-result-row-${i}`}>
                      <span style={{ color: "#1D1D1F" }}>{r.email}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 10,
                        background: r.status === "Erstellt" ? "rgba(52,199,89,0.12)" : r.status === "Aktualisiert" ? "rgba(0,113,227,0.1)" : "rgba(255,59,48,0.1)",
                        color: r.status === "Erstellt" ? "#34C759" : r.status === "Aktualisiert" ? "#0071E3" : "#FF3B30",
                      }}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleReset}
                data-testid="button-biochecks-new-enrollment"
                style={{
                  padding: "10px 24px", borderRadius: 12,
                  background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFF",
                  border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,113,227,0.25)",
                }}
              >
                Weitere Teilnehmer freischalten
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 16px", borderRadius: 12, margin: isMobile ? "16px 16px 0" : "16px 32px 0",
                  background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.15)",
                  fontSize: 13, color: "#FF3B30",
                }} data-testid="text-biochecks-error">
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <div>
                {!isMobile && (
                  <div style={{
                    display: "grid", gridTemplateColumns: "40px 1fr 1fr 1.3fr 40px",
                    gap: 12, padding: "14px 20px",
                    borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.02)",
                  }}>
                    <span />
                    <span style={{ ...labelStyle, paddingLeft: 14 }}>Vorname</span>
                    <span style={{ ...labelStyle, paddingLeft: 14 }}>Nachname</span>
                    <span style={{ ...labelStyle, paddingLeft: 14 }}>E-Mail-Adresse</span>
                    <span />
                  </div>
                )}

                {participants.map((p, idx) => (
                  <div
                    key={p.id}
                    data-testid={`biochecks-row-participant-${p.id}`}
                    style={{
                      display: isMobile ? "flex" : "grid",
                      flexDirection: isMobile ? "column" : undefined,
                      gridTemplateColumns: isMobile ? undefined : "40px 1fr 1fr 1.3fr 40px",
                      gap: isMobile ? 10 : 12,
                      padding: isMobile ? 16 : "14px 20px",
                      alignItems: isMobile ? "stretch" : "center",
                      borderBottom: idx < participants.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                    }}
                  >
                    {isMobile && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: 8,
                            background: "linear-gradient(135deg, #0071E3, #0071E3CC)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700, color: "#FFF",
                          }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>Teilnehmer {idx + 1}</span>
                        </div>
                        {participants.length > 1 && (
                          <button type="button" onClick={() => removeParticipant(p.id)} data-testid={`button-biochecks-remove-${p.id}`}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#FF3B30", padding: 4, display: "flex", alignItems: "center" }}>
                            <Trash2 style={{ width: 15, height: 15 }} />
                          </button>
                        )}
                      </div>
                    )}

                    {!isMobile && (
                      <div style={{
                        width: 26, height: 26, borderRadius: 8,
                        background: "linear-gradient(135deg, #0071E3, #0071E3CC)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "#FFF",
                      }}>
                        {idx + 1}
                      </div>
                    )}

                    {isMobile && <label style={labelStyle}>Vorname</label>}
                    <input type="text" value={p.firstName} onChange={e => updateParticipant(p.id, "firstName", e.target.value)}
                      placeholder="Vorname" style={inputStyle} required data-testid={`input-biochecks-firstname-${p.id}`} />

                    {isMobile && <label style={labelStyle}>Nachname</label>}
                    <input type="text" value={p.lastName} onChange={e => updateParticipant(p.id, "lastName", e.target.value)}
                      placeholder="Nachname" style={inputStyle} required data-testid={`input-biochecks-lastname-${p.id}`} />

                    {isMobile && <label style={labelStyle}>E-Mail-Adresse</label>}
                    <input type="email" value={p.email} onChange={e => updateParticipant(p.id, "email", e.target.value)}
                      placeholder="E-Mail-Adresse" style={inputStyle} required data-testid={`input-biochecks-email-${p.id}`} />

                    {!isMobile && (
                      participants.length > 1 ? (
                        <button type="button" onClick={() => removeParticipant(p.id)} data-testid={`button-biochecks-remove-${p.id}`}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#FF3B30", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trash2 style={{ width: 15, height: 15 }} />
                        </button>
                      ) : <span />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, padding: isMobile ? "20px 16px" : "24px 32px", justifyContent: "center", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={addParticipant}
                  data-testid="button-biochecks-add-participant"
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: 12,
                    background: "rgba(255,255,255,0.78)", border: "1px solid rgba(0,0,0,0.08)",
                    fontSize: 14, fontWeight: 600, color: "#1D1D1F", cursor: "pointer",
                    width: isMobile ? "100%" : "auto", justifyContent: "center",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <Plus style={{ width: 16, height: 16 }} />
                  Teilnehmer hinzufügen
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="button-biochecks-submit"
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 28px", borderRadius: 12,
                    background: submitting ? "rgba(0,113,227,0.5)" : "linear-gradient(135deg, #0071E3, #34AADC)",
                    color: "#FFF", border: "none",
                    fontSize: 14, fontWeight: 600, cursor: submitting ? "default" : "pointer",
                    boxShadow: submitting ? "none" : "0 2px 8px rgba(0,113,227,0.25)",
                    width: isMobile ? "100%" : "auto", justifyContent: "center",
                  }}
                >
                  <Send style={{ width: 16, height: 16 }} />
                  {submitting ? "Wird verarbeitet…" : "Zugänge freischalten"}
                </button>
              </div>
            </form>
          )}
          </>)}
        </div>
      </div>
    </div>
  );
}
