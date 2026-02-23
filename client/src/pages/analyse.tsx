import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

const DEFAULT_BEREICH1 = `Noch keine Analyse vorhanden. Erstelle zuerst ein vollständiges Rollenprofil, um die KI-Analyse zu starten.`;
const DEFAULT_BEREICH2 = `Noch keine Analyse vorhanden. Erstelle zuerst ein vollständiges Rollenprofil, um die KI-Analyse zu starten.`;
const DEFAULT_BEREICH3 = `Noch keine Analyse vorhanden. Erstelle zuerst ein vollständiges Rollenprofil, um die KI-Analyse zu starten.`;

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/Umsatzwirkung",
  "Beziehungs- und Netzwerkstabilität",
  "Qualitäts- und Prozesssicherheit",
  "Innovations- und Zukunftsfähigkeit",
];

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

function loadRollenDna() {
  try {
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function Analyse() {
  const [, setLocation] = useLocation();
  const initial = loadSaved();
  const [bereich1, setBereich1] = useState(initial.bereich1);
  const [bereich2, setBereich2] = useState(initial.bereich2);
  const [bereich3, setBereich3] = useState(initial.bereich3);
  const [saved, setSaved] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setter(e.target.value);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("analyseTexte", JSON.stringify({ bereich1, bereich2, bereich3 }));
    setSaved(true);
  };

  const runAnalyse = async () => {
    const dna = loadRollenDna();
    if (!dna || !dna.beruf || !dna.taetigkeiten || dna.taetigkeiten.length === 0) return;

    setIsAnalyzing(true);
    try {
      const erfolgsfokusText = (dna.erfolgsfokusIndices || [])
        .map((i: number) => ERFOLGSFOKUS_LABELS[i])
        .filter(Boolean)
        .join(", ");

      const resp = await fetch("/api/generate-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beruf: dna.beruf,
          fuehrung: dna.fuehrung,
          erfolgsfokus: erfolgsfokusText,
          aufgabencharakter: dna.aufgabencharakter,
          arbeitslogik: dna.arbeitslogik,
          taetigkeiten: dna.taetigkeiten,
        }),
      });

      if (!resp.ok) throw new Error("Analyse-Fehler");
      const data = await resp.json();

      if (data.bereich1) { setBereich1(data.bereich1); }
      if (data.bereich2) { setBereich2(data.bereich2); }
      if (data.bereich3) { setBereich3(data.bereich3); }

      localStorage.setItem("analyseTexte", JSON.stringify({
        bereich1: data.bereich1 || bereich1,
        bereich2: data.bereich2 || bereich2,
        bereich3: data.bereich3 || bereich3,
      }));
      setSaved(true);
    } catch (err) {
      console.error("Analyse-Generierung fehlgeschlagen:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const dna = loadRollenDna();
    const hasProfile = dna && dna.beruf && dna.taetigkeiten && dna.taetigkeiten.length > 0;
    const hasDefaultTexts = bereich1 === DEFAULT_BEREICH1 && bereich2 === DEFAULT_BEREICH2;
    if (hasProfile && hasDefaultTexts) {
      runAnalyse();
    }
  }, []);

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

  const dna = loadRollenDna();
  const hasProfile = dna && dna.beruf && dna.taetigkeiten && dna.taetigkeiten.length > 0;

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
        <header className="flex items-center justify-between gap-4 px-6 py-4" data-testid="header-analyse">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-back-analyse"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={logoSrc} alt="bioLogic Logo" className="h-7 w-auto" data-testid="logo-analyse" />
            <span className="text-sm text-muted-foreground/70 font-light tracking-wide hidden sm:inline">Analyse</span>
          </div>
          <div className="flex items-center gap-2">
            {hasProfile && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                style={{ color: "#0071E3", fontWeight: 500 }}
                onClick={runAnalyse}
                disabled={isAnalyzing}
                data-testid="button-analyse-neu-berechnen"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Berechne..." : "Neu berechnen"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              style={{
                color: saved ? "#8E8E93" : "#0071E3",
                fontWeight: saved ? 400 : 600,
              }}
              onClick={handleSave}
              data-testid="button-analyse-speichern"
            >
              <Save className="w-3.5 h-3.5" />
              {saved ? "Gespeichert" : "Speichern"}
            </Button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-20">
          <div className="text-center mt-8 mb-10">
            <h1
              className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground/90 mb-2"
              data-testid="text-analyse-title"
            >
              Analyse
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-analyse-subtitle">
              {hasProfile ? `Rollenanalyse für „${dna.beruf}"` : "Interne Analysebereiche"}
            </p>
          </div>

          {isAnalyzing && (
            <div className="text-center py-8 mb-6" data-testid="loading-analyse">
              <div style={{
                width: 40,
                height: 40,
                border: "3px solid rgba(0,113,227,0.15)",
                borderTopColor: "#0071E3",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }} />
              <p style={{ fontSize: 15, color: "#0071E3", fontWeight: 500 }}>
                KI analysiert das Rollenprofil...
              </p>
              <p style={{ fontSize: 13, color: "#8E8E93", marginTop: 4 }}>
                Das kann einige Sekunden dauern.
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          <div className="flex flex-col gap-6" style={{ opacity: isAnalyzing ? 0.4 : 1, transition: "opacity 300ms" }}>
            <div style={cardStyle}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 8, display: "block" }} data-testid="label-bereich1">
                Kompetenzverteilung & Rollenprofil
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
                Tätigkeitsanalyse & Anforderungsprofil
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
                Empfehlungen & Entwicklungspotenziale
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
          </div>
        </main>
      </div>
    </div>
  );
}
