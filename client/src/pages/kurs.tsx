import { useState } from "react";
import GlobalNav from "@/components/global-nav";
import { GraduationCap, Lock, Plus, Trash2, Send, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
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

export default function Kurs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [participants, setParticipants] = useState<Participant[]>([createEmptyParticipant()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{ email: string; status: string }[]>([]);

  if (!user?.courseAccess && user?.role !== "admin") {
    return (
      <>
        <GlobalNav />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 80px)", padding: 24, textAlign: "center" }}>
          <Lock style={{ width: 48, height: 48, color: "#8E8E93", marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }} data-testid="text-no-access">Kein Zugang</h2>
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

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <>
        <GlobalNav />
        <div style={{ paddingTop: isMobile ? 60 : 80 }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, #34C759, #30B350)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
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
    <>
      <GlobalNav />
      <div style={{ paddingTop: isMobile ? 60 : 80 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "24px 16px" : "40px 24px" }}>

          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, #34C759, #30B350)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <GraduationCap style={{ width: 28, height: 28, color: "#FFF" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#34C759", letterSpacing: "-0.02em", margin: "0 0 8px" }} data-testid="text-kurs-title">
              Kurszugänge freischalten
            </h1>
            <p style={{ fontSize: 14, color: "#48484A", maxWidth: 500, margin: "0 auto" }} data-testid="text-kurs-subtitle">
              Hier können Sie mehrere Personen für den bioLogic-Kursbereich freischalten.
              Fügen Sie alle Teilnehmer hinzu und starten Sie die Freischaltung gesammelt.
            </p>
          </div>

          {submitted ? (
            <div style={{
              padding: 40, borderRadius: 20, background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              textAlign: "center",
            }} data-testid="card-success">
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, #34C759, #30B350)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <CheckCircle2 style={{ width: 28, height: 28, color: "#FFF" }} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Zugänge freigeschaltet</p>
              <p style={{ fontSize: 14, color: "#6E6E73", margin: "0 0 20px", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                Die Teilnehmer wurden erfolgreich für den Kursbereich verarbeitet.
              </p>

              {results.length > 0 && (
                <div style={{ textAlign: "left", maxWidth: 500, margin: "0 auto 24px" }}>
                  {results.map((r, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 12px", borderRadius: 8,
                      background: i % 2 === 0 ? "#F9FAF9" : "transparent",
                      fontSize: 13,
                    }} data-testid={`result-row-${i}`}>
                      <span style={{ color: "#1D1D1F" }}>{r.email}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 10,
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
                data-testid="button-new-enrollment"
                style={{
                  padding: "10px 24px", borderRadius: 12,
                  background: "linear-gradient(135deg, #0071E3, #34AADC)", color: "#FFF",
                  border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer",
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
                  padding: "10px 16px", borderRadius: 10, marginBottom: 16,
                  background: "rgba(255,59,48,0.06)", border: "1px solid rgba(255,59,48,0.15)",
                  fontSize: 13, color: "#FF3B30",
                }} data-testid="text-error">
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {participants.map((p, idx) => (
                  <div
                    key={p.id}
                    data-testid={`card-participant-${p.id}`}
                    style={{
                      padding: isMobile ? 16 : 24, borderRadius: 16, background: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%",
                          background: "linear-gradient(135deg, #34C759, #30B350)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <UserPlus style={{ width: 15, height: 15, color: "#FFF" }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#1D1D1F" }}>
                          Teilnehmer {idx + 1}
                        </span>
                      </div>
                      {participants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.id)}
                          data-testid={`button-remove-participant-${p.id}`}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#FF3B30", padding: 4, borderRadius: 6,
                            display: "flex", alignItems: "center",
                          }}
                        >
                          <Trash2 style={{ width: 16, height: 16 }} />
                        </button>
                      )}
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      gap: 12,
                      marginBottom: 12,
                    }}>
                      <div>
                        <label style={labelStyle}>Vorname</label>
                        <input
                          type="text"
                          value={p.firstName}
                          onChange={e => updateParticipant(p.id, "firstName", e.target.value)}
                          placeholder="Vorname"
                          style={inputStyle}
                          required
                          data-testid={`input-firstname-${p.id}`}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Nachname</label>
                        <input
                          type="text"
                          value={p.lastName}
                          onChange={e => updateParticipant(p.id, "lastName", e.target.value)}
                          placeholder="Nachname"
                          style={inputStyle}
                          required
                          data-testid={`input-lastname-${p.id}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>E-Mail-Adresse</label>
                      <input
                        type="email"
                        value={p.email}
                        onChange={e => updateParticipant(p.id, "email", e.target.value)}
                        placeholder="E-Mail-Adresse"
                        style={inputStyle}
                        required
                        data-testid={`input-email-${p.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, marginTop: 20, justifyContent: "center", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={addParticipant}
                  data-testid="button-add-participant"
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", borderRadius: 12,
                    background: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)",
                    fontSize: 14, fontWeight: 600, color: "#1D1D1F", cursor: "pointer",
                    width: isMobile ? "100%" : "auto", justifyContent: "center",
                  }}
                >
                  <Plus style={{ width: 16, height: 16 }} />
                  Teilnehmer hinzufügen
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="button-submit-enrollment"
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "12px 28px", borderRadius: 12,
                    background: submitting ? "#A8D8A8" : "linear-gradient(135deg, #34C759, #30B350)",
                    color: "#FFF", border: "none",
                    fontSize: 15, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                    width: isMobile ? "100%" : "auto", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(52,199,89,0.3)",
                  }}
                >
                  <Send style={{ width: 16, height: 16 }} />
                  {submitting ? "Wird freigeschaltet…" : "Zugänge freischalten"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </>
  );
}
