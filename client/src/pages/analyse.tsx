import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import GlobalNav from "@/components/global-nav";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";

const DEFAULT_BEREICH1 = `IMPULSIV = Handlungs- und Umsetzungskompetenz (MACHEN & DURCHSETZEN)

Kernfrage: Braucht diese Tätigkeit primär DURCHSETZUNGSKRAFT — Entscheidungen unter Unsicherheit treffen, Ergebnisse gegen Widerstände erzielen, Tempo und Pragmatismus?

Typische Sachverhalte (Impulsiv):
- Entscheidungen treffen und Verantwortung für Konsequenzen übernehmen
- Verhandlungen führen mit dem Ziel, Ergebnisse durchzusetzen
- Zielvorgaben definieren, einfordern und kontrollieren
- Eskalation bei Zielkonflikten oder Blockaden
- Priorisierung unter Zeitdruck und Ressourcenknappheit
- Steuerung externer Dienstleister und Durchsetzung von Leistungsanforderungen
- Budget- und Ergebnisverantwortung
- Personalentscheidungen (Einstellung, Trennung, Beförderung)
- Pragmatisches Handeln statt Perfektionismus
- Krisenmanagement und schnelle Reaktion auf unvorhergesehene Ereignisse

NICHT Impulsiv:
- Rein operative Tätigkeiten ohne Entscheidungsspielraum (→ Analytisch)
- Körperliche Arbeit oder Routineaufgaben ohne Ergebnisverantwortung (→ Analytisch)
- Abstimmungen auf Augenhöhe ohne Durchsetzungskomponente (→ Intuitiv)`;

const DEFAULT_BEREICH2 = `INTUITIV = Sozial- und Beziehungskompetenz (FÜHLEN & VERBINDEN)

Kernfrage: Braucht diese Tätigkeit primär EMOTIONALE INTELLIGENZ — Menschen lesen, Beziehungen gestalten, Vertrauen aufbauen, Stimmungen wahrnehmen?

Typische Sachverhalte (Intuitiv):
- Direkte zwischenmenschliche Interaktion als KERN der Tätigkeit
- Empathie, aktives Zuhören und Verständnis für den Menschen
- Teamführung und Mitarbeiterentwicklung auf persönlicher Ebene
- Moderation von Gruppendiskussionen und Workshops
- Konfliktlösung durch Gespräch und Beziehungsarbeit
- Coaching, Mentoring und persönliche Begleitung
- Aufbau und Pflege von Netzwerken und Vertrauensbeziehungen
- Kundenbetreuung mit direktem persönlichem Kontakt
- Feedbackgespräche und Mitarbeitergespräche
- Interkulturelle Sensibilität in der Zusammenarbeit

NICHT Intuitiv (häufige Fehlzuordnungen):
- Reinigung, Pflege von Räumen oder Gegenständen — auch wenn Wörter wie "Empfang" oder "Gäste" vorkommen (→ Analytisch, weil es um Sorgfalt und Prozesse geht, nicht um menschliche Interaktion)
- Dokumentation, Berichte, Reports — auch über soziale Themen (→ Analytisch)
- Koordination von Terminen und Abläufen ohne persönliche Beziehungsgestaltung (→ Analytisch)
- Einhaltung von Hygienevorschriften, Sicherheitsstandards (→ Analytisch)
- Bestellung, Lagerhaltung, Warenwirtschaft (→ Analytisch)
- Durchsetzung von Entscheidungen gegenüber Mitarbeitern (→ Impulsiv)
- Verhandlung von Preisen und Konditionen (→ Impulsiv)`;

const DEFAULT_BEREICH3 = `ANALYTISCH = Fach- und Methodenkompetenz (DENKEN & VERSTEHEN)

Kernfrage: Braucht diese Tätigkeit primär KOPFARBEIT — Wissen anwenden, Daten verarbeiten, Systeme bedienen, Sachverhalte durchdringen, fachlich bewerten?

Typische Sachverhalte (Analytisch):
- Systematisches Arbeiten in Systemen (ERP, CRM, SAP, Software, Datenbanken)
- Fachliches Bewerten und sachliches Abwägen — auch wenn Wörter wie "klären" oder "Konflikt" vorkommen
- Arbeit mit Daten, Zahlen, Terminen, Prozessen
- Dokumentation, Reporting, Monitoring
- Fachwissen vermitteln oder erklären
- Qualitätskontrolle und Einhaltung von Standards
- Planung, Strukturierung und Organisation von Abläufen
- Reinigung, Instandhaltung, Wartung, Pflege (physische Sorgfaltstätigkeiten)
- Einkauf, Bestellung, Lagerverwaltung, Inventur
- Rezepturentwicklung, Speiseplanung, Kalkulation
- Einhaltung von Hygienevorschriften und Sicherheitsstandards
- Technische Prüfung und Fehlerbehebung

NICHT Analytisch:
- Persönliche Mitarbeitergespräche mit Beziehungsfokus (→ Intuitiv)
- Durchsetzung von Entscheidungen gegen Widerstände (→ Impulsiv)
- Verhandlungen mit Ergebnisdruck (→ Impulsiv)`;

function loadSaved() {
  try {
    const raw = localStorage.getItem("analyseTexte");
    if (raw) {
      const data = JSON.parse(raw);
      return {
        bereich1: data.bereich1 ?? DEFAULT_BEREICH1,
        bereich2: data.bereich2 ?? DEFAULT_BEREICH2,
        bereich3: data.bereich3 ?? DEFAULT_BEREICH3,
      };
    }
  } catch {}
  return { bereich1: DEFAULT_BEREICH1, bereich2: DEFAULT_BEREICH2, bereich3: DEFAULT_BEREICH3 };
}


export default function Analyse() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user || user.role !== "admin") return null;

  const initial = loadSaved();
  const [bereich1, setBereich1] = useState(initial.bereich1);
  const [bereich2, setBereich2] = useState(initial.bereich2);
  const [bereich3, setBereich3] = useState(initial.bereich3);
  const [saved, setSaved] = useState(true);

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("analyseTexte", JSON.stringify({ bereich1, bereich2, bereich3 }));
    setSaved(true);
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 12,
    border: "1.5px solid rgba(0,0,0,0.08)",
    padding: "12px 14px",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    color: "#1D1D1F",
    background: "rgba(255,255,255,0.6)",
    resize: "vertical",
    outline: "none",
    transition: "border-color 200ms ease",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: 20,
    padding: "24px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
    border: "1px solid rgba(0,0,0,0.04)",
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(252,205,210,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <GlobalNav />

        <main className="flex-1 w-full mx-auto pb-20" style={{ maxWidth: 1100, paddingLeft: isMobile ? 8 : 24, paddingRight: isMobile ? 8 : 24, paddingBottom: isMobile ? 100 : 80 }}>
          <div className="text-center mt-8 mb-10">
            <h1
              className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground/90 mb-2"
              data-testid="text-analyse-title"
            >
              Stammdaten (Analysehilfe)
            </h1>
          </div>

          <div className="flex flex-col gap-6">
            <div style={cardStyle}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 8, display: "block" }} data-testid="label-bereich1">
                Impulsive Daten
              </label>
              <textarea
                value={bereich1}
                onChange={handleChange(setBereich1)}
                rows={6}
                style={textareaStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,113,227,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                data-testid="textarea-bereich1"
              />
            </div>

            <div style={cardStyle}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 8, display: "block" }} data-testid="label-bereich2">
                Intuitive Daten
              </label>
              <textarea
                value={bereich2}
                onChange={handleChange(setBereich2)}
                rows={6}
                style={textareaStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,113,227,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                data-testid="textarea-bereich2"
              />
            </div>

            <div style={cardStyle}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 8, display: "block" }} data-testid="label-bereich3">
                Analytische Daten
              </label>
              <textarea
                value={bereich3}
                onChange={handleChange(setBereich3)}
                rows={6}
                style={textareaStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,113,227,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                data-testid="textarea-bereich3"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSave}
                disabled={saved}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "10px 28px",
                  borderRadius: 10,
                  border: "none",
                  background: saved ? "rgba(0,0,0,0.06)" : "#0071E3",
                  color: saved ? "#8E8E93" : "#fff",
                  cursor: saved ? "default" : "pointer",
                  transition: "all 200ms ease",
                }}
                data-testid="button-save-bereiche"
              >
                {saved ? "Gespeichert" : "Bereiche speichern"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
