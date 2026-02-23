import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeft, Save, FolderOpen, Check, ChevronDown, ArrowRight } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/Umsatzdruck",
  "Beziehungsaufbau",
  "Innovations-/Entwicklungsfokus",
  "Prozessqualität & Struktur",
  "Fachliche Präzision",
  "Fachliche Präzision",
];

function Header() {
  const [, setLocation] = useLocation();
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4" data-testid="header-rollen-dna">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <img src={logoSrc} alt="bioLogic Logo" className="h-7 w-auto" data-testid="logo-rollen-dna" />
        <span className="text-sm text-muted-foreground/70 font-light tracking-wide hidden sm:inline">RoleDynamics</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" data-testid="button-laden">
          <FolderOpen className="w-3.5 h-3.5" />
          Laden
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" data-testid="button-speichern">
          <Save className="w-3.5 h-3.5" />
          Speichern
        </Button>
      </div>
    </header>
  );
}

function StepProgress({ currentStep, completedSteps }: { currentStep: number; completedSteps: number[] }) {
  const steps = [
    { num: 1, label: "Rolle auswählen" },
    { num: 2, label: "Rahmenbedingungen" },
    { num: 3, label: "Tätigkeiten" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-lg mx-auto" data-testid="step-progress">
      {steps.map((step, idx) => {
        const isDone = completedSteps.includes(step.num);
        const isCurrent = step.num === currentStep;
        return (
          <div key={step.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500 ${
                isDone
                  ? "bg-green-500 text-white"
                  : isCurrent
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-muted/50 dark:bg-muted/30 text-muted-foreground/40"
              }`} data-testid={`step-num-${step.num}`}>
                {isDone ? <Check className="w-4 h-4" strokeWidth={2.5} /> : step.num}
              </span>
              <span className={`text-xs transition-colors duration-300 whitespace-nowrap ${
                isDone
                  ? "font-medium text-green-600 dark:text-green-400"
                  : isCurrent
                    ? "font-semibold text-foreground/90"
                    : "text-muted-foreground/40"
              }`} data-testid={`step-label-${step.num}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 mt-[-18px] rounded-full overflow-hidden bg-muted/30">
                <div className={`h-full transition-all duration-700 rounded-full ${
                  isDone ? "bg-green-400 w-full" : "bg-transparent w-0"
                }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CollapsedStep({
  step,
  title,
  summary,
  onEdit,
}: {
  step: number;
  title: string;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/40 dark:bg-card/40 backdrop-blur-sm border border-card-border cursor-pointer hover:bg-white/60 dark:hover:bg-card/50 transition-all duration-200"
      onClick={onEdit}
      data-testid={`collapsed-step-${step}`}
    >
      <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground/80">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{summary}</p>
      </div>
      <ChevronDown className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
    </div>
  );
}

function LockedStep({ step, title }: { step: number; title: string }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl bg-muted/20 dark:bg-muted/10 border border-border/20 opacity-50"
      data-testid={`locked-step-${step}`}
    >
      <span className="w-8 h-8 rounded-full bg-muted/50 dark:bg-muted/30 text-muted-foreground/40 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
        {step}
      </span>
      <p className="text-sm font-medium text-muted-foreground/40">{title}</p>
    </div>
  );
}

function SectionNumber({ num }: { num: number }) {
  return (
    <span className="text-sm font-semibold text-foreground/40 tabular-nums w-5 flex-shrink-0">{num}</span>
  );
}

function PillSelector({
  options,
  selected,
  onToggle,
  max,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all duration-200 border ${
              isSelected
                ? "bg-foreground/5 dark:bg-foreground/10 border-foreground/20 text-foreground font-medium"
                : "bg-transparent border-transparent text-muted-foreground hover:text-foreground/80"
            }`}
            data-testid={`pill-${opt.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {opt}
          </button>
        );
      })}
      {max && (
        <span className="text-xs text-muted-foreground/50 ml-1">(max. {max} auswählbar)</span>
      )}
    </div>
  );
}

function CheckboxGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-2.5">
      {options.map((label, idx) => {
        const isChecked = selected.includes(label);
        return (
          <button
            key={`${label}-${idx}`}
            onClick={() => onToggle(label)}
            className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors group text-left"
            data-testid={`checkbox-${label.toLowerCase().replace(/[\s\/&]+/g, "-")}-${idx}`}
          >
            <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
              isChecked
                ? "text-primary"
                : "text-transparent group-hover:text-muted-foreground/20"
            }`}>
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            </span>
            <span className={isChecked ? "text-foreground/90" : "text-muted-foreground"}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SegmentedControl({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
}) {
  return (
    <div className="flex items-stretch gap-0 w-full">
      {options.map((opt, idx) => {
        const isSelected = selected === opt;
        return (
          <button
            key={`${opt}-${idx}`}
            onClick={() => onSelect(opt)}
            className={`flex-1 px-3 py-2 text-sm transition-all duration-200 text-center break-words min-w-0 ${
              isSelected
                ? "bg-primary/15 dark:bg-primary/25 text-primary font-medium rounded-lg shadow-sm"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
            data-testid={`segment-${opt.toLowerCase().replace(/[\s\/-]+/g, "-")}`}
          >
            {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 align-middle" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function RollenDNA() {
  const [currentStep, setCurrentStep] = useState(1);
  const [beruf, setBeruf] = useState("");
  const [fuehrung, setFuehrung] = useState<string[]>(["Führung"]);
  const [erfolgsfokus, setErfolgsfokus] = useState<string[]>([
    "Ergebnis-/Umsatzdruck",
    "Beziehungsaufbau",
    "Prozessqualität & Struktur",
  ]);
  const [aufgabencharakter, setAufgabencharakter] = useState("Gemischt");
  const [arbeitslogik, setArbeitslogik] = useState("Daten-/prozessorientiert");

  const toggleFuehrung = (val: string) => {
    setFuehrung((prev) => {
      if (prev.includes(val)) return prev.filter((v) => v !== val);
      if (prev.length >= 2) return [...prev.slice(1), val];
      return [...prev, val];
    });
  };

  const toggleErfolgsfokus = (val: string) => {
    setErfolgsfokus((prev) => {
      if (prev.includes(val)) return prev.filter((v) => v !== val);
      if (prev.length >= 2) return [...prev.slice(1), val];
      return [...prev, val];
    });
  };

  const step1Valid = beruf.trim().length > 0;
  const step2Valid = fuehrung.length > 0;

  const completedSteps: number[] = [];
  if (currentStep > 1) completedSteps.push(1);
  if (currentStep > 2) completedSteps.push(2);

  const goToStep = (step: number) => setCurrentStep(step);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 relative">
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
        <Header />

        <main className="flex-1 w-full max-w-2xl mx-auto px-6 pb-20">
          <div className="text-center mt-8 mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground/90 mb-2" data-testid="text-rollen-dna-title">
              Rollen-DNA
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto" data-testid="text-rollen-dna-subtitle">
              Analysieren und definieren Sie präzise die Anforderungen für eine spezifische Rolle.
            </p>
          </div>

          <div className="mb-12">
            <StepProgress currentStep={currentStep} completedSteps={completedSteps} />
          </div>

          <div className="space-y-5">

            {currentStep === 1 ? (
              <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-card-border animate-in fade-in slide-in-from-bottom-2 duration-400" data-testid="card-step-1">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-primary uppercase tracking-wider">Schritt 1</span>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground/90 mb-5" data-testid="text-step-1-title">
                    Rolle auswählen
                  </h2>

                  <div className="relative mb-6" data-testid="input-beruf-wrapper">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                    <Input
                      type="search"
                      placeholder="Beruf eingeben"
                      value={beruf}
                      onChange={(e) => setBeruf(e.target.value)}
                      className="pl-10 bg-muted/30 dark:bg-muted/20 border-border/40 focus:border-primary/40 h-11 text-sm"
                      data-testid="input-beruf"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      disabled={!step1Valid}
                      onClick={() => goToStep(2)}
                      className="gap-2 rounded-lg px-6"
                      data-testid="button-step-1-weiter"
                    >
                      Weiter
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <CollapsedStep
                step={1}
                title="Rolle auswählen"
                summary={beruf}
                onEdit={() => goToStep(1)}
              />
            )}

            {currentStep === 2 ? (
              <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-card-border animate-in fade-in slide-in-from-bottom-2 duration-400" data-testid="card-step-2">
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">Schritt 2</span>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground/90" data-testid="text-step-2-title">
                      Rahmenbedingungen der Rolle
                    </h2>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-start gap-3" data-testid="section-fuehrung">
                      <SectionNumber num={1} />
                      <div className="flex-1 space-y-3">
                        <h3 className="text-sm font-semibold text-foreground/90">Führungsverantwortung</h3>
                        <PillSelector
                          options={["Keine", "Koordination", "Führung"]}
                          selected={fuehrung}
                          onToggle={toggleFuehrung}
                          max={2}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border/20" />

                    <div className="flex items-start gap-3" data-testid="section-erfolgsfokus">
                      <SectionNumber num={2} />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-sm font-semibold text-foreground/90">Erfolgsfokus</h3>
                          <span className="text-xs text-muted-foreground/50">(max. 2 auswählbar)</span>
                        </div>
                        <CheckboxGrid
                          options={ERFOLGSFOKUS_LABELS}
                          selected={erfolgsfokus}
                          onToggle={toggleErfolgsfokus}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border/20" />

                    <div className="flex items-start gap-3" data-testid="section-aufgabencharakter">
                      <SectionNumber num={3} />
                      <div className="flex-1 space-y-3">
                        <h3 className="text-sm font-semibold text-foreground/90">Aufgabencharakter</h3>
                        <p className="text-xs text-muted-foreground/60">
                          Das Profil die konkrete Stelle besser trifft, beantworten Sie 4 kurze Fragen.
                        </p>
                        <SegmentedControl
                          options={["Überwiegend operativ", "Gemischt", "Überwiegend strategisch"]}
                          selected={aufgabencharakter}
                          onSelect={setAufgabencharakter}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border/20" />

                    <div className="flex items-start gap-3" data-testid="section-arbeitslogik">
                      <SectionNumber num={4} />
                      <div className="flex-1 space-y-3">
                        <h3 className="text-sm font-semibold text-foreground/90">Arbeitslogik</h3>
                        <SegmentedControl
                          options={["Menschenorientiert", "Daten-/prozessorientiert", "Umsetzungsorientiert"]}
                          selected={arbeitslogik}
                          onSelect={setArbeitslogik}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      disabled={!step2Valid}
                      onClick={() => goToStep(3)}
                      className="gap-2 rounded-lg px-6"
                      data-testid="button-step-2-weiter"
                    >
                      Weiter
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : currentStep > 2 ? (
              <CollapsedStep
                step={2}
                title="Rahmenbedingungen der Rolle"
                summary={`${fuehrung.join(", ")} · ${erfolgsfokus.length} Erfolgsfaktoren · ${aufgabencharakter} · ${arbeitslogik}`}
                onEdit={() => goToStep(2)}
              />
            ) : (
              <LockedStep step={2} title="Rahmenbedingungen der Rolle" />
            )}

            {currentStep === 3 ? (
              <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-card-border animate-in fade-in slide-in-from-bottom-2 duration-400" data-testid="card-step-3">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-medium text-primary uppercase tracking-wider">Schritt 3</span>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground/90 mb-6" data-testid="text-step-3-title">
                    Tätigkeiten & Kompetenzen
                  </h2>

                  <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-sm text-muted-foreground/50" data-testid="text-no-taetigkeiten">
                      Noch keine Tätigkeiten hinzugefügt.
                    </p>
                    <Button
                      className="gap-1.5 rounded-lg px-6"
                      data-testid="button-taetigkeit-hinzufuegen"
                    >
                      <Plus className="w-4 h-4" />
                      Tätigkeit hinzufügen
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <LockedStep step={3} title="Tätigkeiten & Kompetenzen" />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
