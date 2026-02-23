import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, ArrowLeft, Save, FolderOpen, ArrowDown, Check } from "lucide-react";
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
            className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 border ${
              isSelected
                ? "bg-foreground/5 dark:bg-foreground/10 border-foreground/20 text-foreground font-medium"
                : "bg-transparent border-border/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground/80"
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

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors group"
      data-testid={`checkbox-${label.toLowerCase().replace(/[\s\/&]+/g, "-")}`}
    >
      <span className={`w-4 h-4 rounded-sm flex items-center justify-center transition-colors ${
        checked
          ? "text-primary"
          : "text-muted-foreground/30 group-hover:text-muted-foreground/50"
      }`}>
        <Check className="w-3.5 h-3.5" strokeWidth={checked ? 2.5 : 1.5} />
      </span>
      <span className={checked ? "font-medium" : ""}>{label}</span>
    </button>
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
    <div className="inline-flex items-center gap-1 rounded-full bg-muted/40 dark:bg-muted/30 p-1">
      {options.map((opt) => {
        const isSelected = selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 whitespace-nowrap ${
              isSelected
                ? "bg-primary/15 dark:bg-primary/25 text-primary font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
            data-testid={`segment-${opt.toLowerCase().replace(/[\s\/-]+/g, "-")}`}
          >
            {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 align-middle" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function TabBar({
  tabs,
  active,
  onSelect,
}: {
  tabs: { label: string; count?: string }[];
  active: string;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-border/50">
      {tabs.map((tab) => {
        const isActive = active === tab.label;
        return (
          <button
            key={tab.label}
            onClick={() => onSelect(tab.label)}
            className={`px-4 py-2.5 text-sm transition-all duration-200 border-b-2 -mb-px ${
              isActive
                ? "border-foreground text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground/70"
            }`}
            data-testid={`tab-${tab.label.toLowerCase().replace(/[\s\/]+/g, "-")}`}
          >
            {tab.label}
            {tab.count && (
              <span className="ml-1.5 text-xs text-muted-foreground/50">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function RollenDNA() {
  const [beruf, setBeruf] = useState("");
  const [fuehrung, setFuehrung] = useState<string[]>(["Führung"]);
  const [erfolgsfokus, setErfolgsfokus] = useState<string[]>([
    "Ergebnis-/Umsatzdruck",
    "Beziehungsaufbau",
    "Innovations-/Entwicklungsfokus",
    "Prozessqualität & Struktur",
    "Fachliche Präzision",
  ]);
  const [aufgabencharakter, setAufgabencharakter] = useState("Gemischt");
  const [arbeitslogik, setArbeitslogik] = useState("Daten-/prozessorientiert");
  const [hinweise, setHinweise] = useState("");
  const [activeTab, setActiveTab] = useState("Haupttätigkeiten");

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

  const tabs = [
    { label: "Haupttätigkeiten" },
    { label: "Nebentätigkeiten", count: "0/15" },
    { label: "Humankompetenzen", count: "0/10" },
  ];

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

        <main className="flex-1 w-full max-w-2xl mx-auto px-6 pb-16">
          <div className="text-center mt-8 mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground/90 mb-2" data-testid="text-rollen-dna-title">
              Rollen-DNA
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto" data-testid="text-rollen-dna-subtitle">
              Analysieren und definieren Sie präzise die Anforderungen für eine spezifische Rolle.
            </p>
          </div>

          <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-card-border overflow-hidden" data-testid="card-rollen-dna-form">
            <div className="p-6 space-y-8">

              <div className="relative" data-testid="input-beruf-wrapper">
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

              <div className="border-t border-border/30" />

              <div className="space-y-6">

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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                      {ERFOLGSFOKUS_LABELS.map((label, idx) => (
                        <CheckboxOption
                          key={`${label}-${idx}`}
                          label={label}
                          checked={erfolgsfokus.includes(label)}
                          onChange={() => toggleErfolgsfokus(label)}
                        />
                      ))}
                    </div>
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

                <div className="border-t border-border/20" />

                <div className="flex items-start gap-3" data-testid="section-hinweise">
                  <SectionNumber num={5} />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground/90">Hinweise zur Stelle</h3>
                    <Textarea
                      placeholder="Freitext hier eingeben ..."
                      value={hinweise}
                      onChange={(e) => setHinweise(e.target.value)}
                      className="bg-muted/20 dark:bg-muted/15 border-border/30 focus:border-primary/40 min-h-[80px] text-sm resize-none"
                      data-testid="textarea-hinweise"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/30" />

              <div className="space-y-4" data-testid="section-taetigkeiten">
                <TabBar tabs={tabs} active={activeTab} onSelect={setActiveTab} />

                <div className="flex flex-col items-center gap-4 py-8">
                  <p className="text-sm text-muted-foreground/50" data-testid="text-no-taetigkeiten">
                    Noch keine Tätigkeiten hinzugefügt.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 rounded-full px-5"
                    data-testid="button-taetigkeit-hinzufuegen"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tätigkeit hinzufügen
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end mt-6">
            <button className="w-10 h-10 rounded-full bg-foreground/5 dark:bg-foreground/10 border border-border/40 flex items-center justify-center text-muted-foreground/60 hover:text-foreground/80 transition-colors" data-testid="button-scroll-down">
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
