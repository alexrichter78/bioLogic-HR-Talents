import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeft, Save, FolderOpen, Check, ChevronDown, ArrowRight, Users, Target, Layers, Activity, CheckCircle2, MoreHorizontal, X, ChevronRight, Info } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";

type KompetenzTyp = "Impulsiv" | "Intuitiv" | "Analytisch";
type Niveau = "Niedrig" | "Mittel" | "Hoch";
type TaetigkeitKategorie = "haupt" | "neben" | "fuehrung";

interface Taetigkeit {
  id: number;
  name: string;
  kategorie: TaetigkeitKategorie;
  kompetenz: KompetenzTyp;
  niveau: Niveau;
}

const KOMPETENZ_COLORS: Record<KompetenzTyp, string> = {
  Impulsiv: "#C41E3A",
  Intuitiv: "#F39200",
  Analytisch: "#1A5DAB",
};

const KOMPETENZ_OPTIONS: KompetenzTyp[] = ["Impulsiv", "Intuitiv", "Analytisch"];
const NIVEAU_OPTIONS: Niveau[] = ["Niedrig", "Mittel", "Hoch"];

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/\nUmsatzwirkung",
  "Beziehungs- und\nNetzwerkstabilität",
  "Innovations- &\nTransformationsleistung",
  "Prozess- und\nEffizienzqualität",
  "Fachliche Exzellenz /\nExpertise",
  "Strategische Wirkung /\nPositionierung",
];

const SECTION_SUBTITLES: Record<string, string> = {
  fuehrung: "Wie viel Führung hat diese Rolle?",
  erfolgsfokus: "Woran wird der Erfolg dieser Rolle gemessen?",
  aufgabencharakter: "Ist die Rolle eher operativ oder strategisch?",
  arbeitslogik: "Was treibt die tägliche Arbeit an?",
};

function Header({ onSave, onLoad }: { onSave: () => void; onLoad: () => void }) {
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
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" data-testid="button-laden" onClick={onLoad}>
          <FolderOpen className="w-3.5 h-3.5" />
          Laden
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" data-testid="button-speichern" onClick={onSave}>
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
                <div className={`h-full rounded-full transition-all duration-700 ${
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

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}

function SectionDivider() {
  return (
    <div style={{ paddingTop: 48, paddingBottom: 48, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "40%", height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)" }} />
    </div>
  );
}

function PillGroup({
  options,
  selected,
  onSelect,
  multi = false,
  max,
  wrap = false,
  columns,
}: {
  options: string[];
  selected: string[];
  onSelect: (val: string) => void;
  multi?: boolean;
  max?: number;
  wrap?: boolean;
  columns?: number;
}) {
  return (
    <div className={columns ? "" : `flex ${wrap ? "flex-col gap-3" : "items-stretch gap-2"} p-1.5`}
      style={columns ? { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10, padding: 6 } : undefined}
    >
      {options.map((opt, idx) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={`${opt}-${idx}`}
            onClick={() => onSelect(opt)}
            className={`${wrap ? "" : "flex-1"} rounded-full font-medium select-none ${wrap ? "text-left" : "text-center"} min-w-0`}
            style={{
              minHeight: 48,
              paddingLeft: wrap ? 20 : 16,
              paddingRight: wrap ? 20 : 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: wrap ? 14 : 15,
              lineHeight: 1.3,
              whiteSpace: "pre-line",
              fontWeight: 500,
              border: isSelected ? "2px solid transparent" : "1.5px solid rgba(0,0,0,0.15)",
              cursor: "pointer",
              transition: "all 180ms cubic-bezier(0.4, 0, 0.2, 1)",
              background: isSelected ? "linear-gradient(135deg, #0071E3, #34AADC)" : "transparent",
              color: isSelected ? "#FFFFFF" : "#6E6E73",
              transform: isSelected ? "scale(1.02)" : "scale(1)",
              boxShadow: isSelected ? "0 4px 12px rgba(0,113,227,0.25)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.target as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.target as HTMLButtonElement).style.background = "transparent";
              }
            }}
            data-testid={`pill-${opt.toLowerCase().replace(/[\s\/-]+/g, "-")}-${idx}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PillGroupIndexed({
  options,
  selectedIndices,
  onSelectIndex,
  indexOffset = 0,
}: {
  options: string[];
  selectedIndices: number[];
  onSelectIndex: (globalIdx: number) => void;
  indexOffset?: number;
}) {
  return (
    <div className="flex items-stretch gap-2 p-1.5">
      {options.map((opt, idx) => {
        const globalIdx = indexOffset + idx;
        const isSelected = selectedIndices.includes(globalIdx);
        return (
          <button
            key={`${opt}-${globalIdx}`}
            onClick={() => onSelectIndex(globalIdx)}
            className="flex-1 rounded-full font-medium select-none text-center min-w-0"
            style={{
              minHeight: 48,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              fontSize: 15,
              lineHeight: 1.3,
              whiteSpace: "pre-line",
              fontWeight: 500,
              border: isSelected ? "2px solid transparent" : "1.5px solid rgba(0,0,0,0.15)",
              cursor: "pointer",
              transition: "all 180ms cubic-bezier(0.4, 0, 0.2, 1)",
              background: isSelected ? "linear-gradient(135deg, #0071E3, #34AADC)" : "transparent",
              color: isSelected ? "#FFFFFF" : "#6E6E73",
              transform: isSelected ? "scale(1.02)" : "scale(1)",
              boxShadow: isSelected ? "0 4px 12px rgba(0,113,227,0.25)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.target as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.target as HTMLButtonElement).style.background = "transparent";
              }
            }}
            data-testid={`pill-erfolgsfokus-${globalIdx}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SectionNumber({ num, isComplete }: { num: number; isComplete: boolean }) {
  return (
    <div style={{
      position: "absolute",
      top: -8,
      right: 8,
      fontSize: 64,
      fontWeight: 800,
      lineHeight: 1,
      pointerEvents: "none",
      userSelect: "none",
      transition: "color 500ms ease",
      color: isComplete ? "rgba(0,113,227,0.06)" : "rgba(0,0,0,0.03)",
    }}>
      {num}
    </div>
  );
}

function MiniProgressBar({ filled, total }: { filled: number; total: number }) {
  const pct = (filled / total) * 100;
  return (
    <div data-testid="mini-progress" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
      <div style={{
        flex: 1,
        height: 3,
        borderRadius: 2,
        background: "rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 2,
          background: "linear-gradient(90deg, #0071E3, #34AADC)",
          transition: "width 500ms cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: "#6E6E73", whiteSpace: "nowrap" }}>
        {filled} von {total}
      </span>
    </div>
  );
}

function SummaryBar({ fuehrung, erfolgsfokus, aufgabencharakter, arbeitslogik }: {
  fuehrung: string;
  erfolgsfokus: string[];
  aufgabencharakter: string;
  arbeitslogik: string;
}) {
  const items = [
    { label: "Führung", value: fuehrung },
    { label: "Fokus", value: erfolgsfokus.join(", ") },
    { label: "Aufgaben", value: aufgabencharakter },
    { label: "Logik", value: arbeitslogik },
  ];

  return (
    <div
      data-testid="summary-bar"
      style={{
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 16,
        padding: "16px 24px",
        marginTop: 32,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <CheckCircle2 style={{ width: 14, height: 14, color: "#34C759" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#34C759", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Zusammenfassung
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
        {items.map((item) => (
          <div key={item.label}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {item.label}
            </span>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#1D1D1F", marginTop: 2, lineHeight: 1.3 }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_TAETIGKEITEN: Taetigkeit[] = [
  { id: 1, name: "Kundenberatung und persönliche Bedarfsanalyse, um maßgeschneiderte Lösungen vorzuschlagen", kategorie: "haupt", kompetenz: "Intuitiv", niveau: "Mittel" },
  { id: 2, name: "Unabhängige Bewertung und Vergleich von Produkten verschiedener Anbieter für Kunden", kategorie: "haupt", kompetenz: "Analytisch", niveau: "Mittel" },
  { id: 3, name: "Erstellung detaillierter Angebote und Erläuterung der Konditionen und Leistungen", kategorie: "haupt", kompetenz: "Analytisch", niveau: "Mittel" },
  { id: 4, name: "Unterstützung von Kunden bei Vertragsabschlüssen und Dokumentation aller relevanten Daten", kategorie: "haupt", kompetenz: "Analytisch", niveau: "Mittel" },
  { id: 5, name: "Regelmäßige Überprüfung bestehender Verträge und Anpassung an veränderte Lebensumstände", kategorie: "haupt", kompetenz: "Analytisch", niveau: "Mittel" },
  { id: 6, name: "Beratung zu Schadensfällen und Hilfestellung bei der Schadensabwicklung", kategorie: "neben", kompetenz: "Intuitiv", niveau: "Mittel" },
  { id: 7, name: "Schulung und Aufklärung von Kunden über Risiken und notwendige Absicherungen", kategorie: "neben", kompetenz: "Intuitiv", niveau: "Mittel" },
  { id: 8, name: "Mitarbeiter entwickeln und fördern", kategorie: "fuehrung", kompetenz: "Intuitiv", niveau: "Hoch" },
];

function loadSavedState() {
  try {
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function RollenDNA() {
  const saved = useRef(loadSavedState());

  const [currentStep, setCurrentStep] = useState(saved.current?.currentStep ?? 1);
  const [allCollapsed, setAllCollapsed] = useState(saved.current?.allCollapsed ?? false);
  const [beruf, setBeruf] = useState(saved.current?.beruf ?? "");
  const [fuehrung, setFuehrung] = useState(saved.current?.fuehrung ?? "");
  const [erfolgsfokusIndices, setErfolgsfokusIndices] = useState<number[]>(saved.current?.erfolgsfokusIndices ?? []);
  const [showFuehrungInfo, setShowFuehrungInfo] = useState(false);
  const [aufgabencharakter, setAufgabencharakter] = useState(saved.current?.aufgabencharakter ?? "");
  const [arbeitslogik, setArbeitslogik] = useState(saved.current?.arbeitslogik ?? "");

  const [activeTab, setActiveTab] = useState<TaetigkeitKategorie>(saved.current?.activeTab ?? "haupt");
  const [taetigkeiten, setTaetigkeiten] = useState<Taetigkeit[]>(saved.current?.taetigkeiten ?? []);
  const [nextId, setNextId] = useState(saved.current?.nextId ?? 1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      beruf,
      fuehrung,
      erfolgsfokus: erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i].replace(/\n/g, " ")),
      erfolgsfokusIndices,
      aufgabencharakter,
      arbeitslogik,
      taetigkeiten,
      nextId,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = beruf ? beruf.replace(/[^a-zA-Z0-9äöüÄÖÜß\-_ ]/g, "").trim().replace(/\s+/g, "_") : "Rollenprofil";
    a.download = `${safeName}_RollenDNA.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.beruf !== undefined) setBeruf(data.beruf);
        if (data.fuehrung !== undefined) setFuehrung(data.fuehrung);
        if (data.erfolgsfokusIndices !== undefined) setErfolgsfokusIndices(data.erfolgsfokusIndices);
        if (data.aufgabencharakter !== undefined) setAufgabencharakter(data.aufgabencharakter);
        if (data.arbeitslogik !== undefined) setArbeitslogik(data.arbeitslogik);
        if (data.taetigkeiten !== undefined) setTaetigkeiten(data.taetigkeiten);
        if (data.nextId !== undefined) setNextId(data.nextId);
        setCurrentStep(3);
        setAllCollapsed(true);
        const loadedBeruf = data.beruf ?? beruf;
        const loadedFuehrung = data.fuehrung ?? fuehrung;
        const loadedErfolgsfokus = data.erfolgsfokusIndices ?? erfolgsfokusIndices;
        const loadedAufgaben = data.aufgabencharakter ?? aufgabencharakter;
        const loadedArbeits = data.arbeitslogik ?? arbeitslogik;
        const loadedTaetigkeiten = data.taetigkeiten ?? taetigkeiten;
        const isComplete = !!(loadedBeruf && loadedFuehrung && loadedErfolgsfokus.length > 0 && loadedAufgaben && loadedArbeits && loadedTaetigkeiten.length > 0);
        if (isComplete) {
          localStorage.setItem("rollenDnaCompleted", "true");
        } else {
          localStorage.removeItem("rollenDnaCompleted");
        }
      } catch {
        alert("Die Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  useEffect(() => {
    const state = {
      currentStep, allCollapsed, beruf, fuehrung, erfolgsfokusIndices,
      aufgabencharakter, arbeitslogik, activeTab, taetigkeiten, nextId,
    };
    localStorage.setItem("rollenDnaState", JSON.stringify(state));
  }, [currentStep, allCollapsed, beruf, fuehrung, erfolgsfokusIndices, aufgabencharakter, arbeitslogik, activeTab, taetigkeiten, nextId]);

  const filteredTaetigkeiten = taetigkeiten.filter(t => t.kategorie === activeTab);
  const hauptCount = taetigkeiten.filter(t => t.kategorie === "haupt").length;
  const nebenCount = taetigkeiten.filter(t => t.kategorie === "neben").length;
  const fuehrungCount = taetigkeiten.filter(t => t.kategorie === "fuehrung").length;
  const highCount = taetigkeiten.filter(t => t.niveau === "Hoch").length;

  const MAX_ITEMS: Record<TaetigkeitKategorie, number> = { haupt: 15, neben: 10, fuehrung: 10 };
  const currentTabCount = filteredTaetigkeiten.length;
  const currentTabMax = MAX_ITEMS[activeTab];
  const canAddMore = currentTabCount < currentTabMax;

  const hauptHighCount = taetigkeiten.filter(t => t.kategorie === "haupt" && t.niveau === "Hoch").length;
  const nebenHighCount = taetigkeiten.filter(t => t.kategorie === "neben" && t.niveau === "Hoch").length;
  const fuehrungHighCount = taetigkeiten.filter(t => t.kategorie === "fuehrung" && t.niveau === "Hoch").length;
  const MAX_HIGH = 5;
  const currentTabHighCount = activeTab === "haupt" ? hauptHighCount : activeTab === "neben" ? nebenHighCount : fuehrungHighCount;

  const handleNiveauChange = (id: number, niveau: Niveau) => {
    if (niveau === "Hoch") {
      const item = taetigkeiten.find(t => t.id === id);
      if (item && item.niveau !== "Hoch") {
        const catHighCount = taetigkeiten.filter(t => t.kategorie === item.kategorie && t.niveau === "Hoch").length;
        if (catHighCount >= MAX_HIGH) return;
      }
    }
    setTaetigkeiten(prev => prev.map(t => t.id === id ? { ...t, niveau } : t));
  };

  const handleKompetenzChange = (id: number, kompetenz: KompetenzTyp) => {
    setTaetigkeiten(prev => prev.map(t => t.id === id ? { ...t, kompetenz } : t));
  };

  const handleRemoveTaetigkeit = (id: number) => {
    setTaetigkeiten(prev => prev.filter(t => t.id !== id));
  };

  const handleRenameTaetigkeit = (id: number, newName: string) => {
    setTaetigkeiten(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const handleAddTaetigkeit = () => {
    const newT: Taetigkeit = {
      id: nextId,
      name: "Neue Tätigkeit",
      kategorie: activeTab,
      kompetenz: "Analytisch",
      niveau: "Mittel",
    };
    setTaetigkeiten(prev => [...prev, newT]);
    setNextId(prev => prev + 1);
  };

  const handleFuehrung = (val: string) => {
    setFuehrung(val);
    if (val === "Keine" && activeTab === "fuehrung") {
      setActiveTab("haupt");
    }
  };

  const handleErfolgsfokus = (globalIdx: number) => {
    setErfolgsfokusIndices((prev) => {
      if (prev.includes(globalIdx)) return prev.filter((i) => i !== globalIdx);
      if (prev.length >= 2) return [...prev.slice(1), globalIdx];
      return [...prev, globalIdx];
    });
  };

  const handleAufgabencharakter = (val: string) => {
    setAufgabencharakter(val);
  };

  const handleArbeitslogik = (val: string) => {
    setArbeitslogik(val);
  };

  const step1Valid = beruf.trim().length > 0;
  const step2Valid = fuehrung.length > 0;

  const completedSteps: number[] = [];
  if (currentStep > 1) completedSteps.push(1);
  if (currentStep > 2) completedSteps.push(2);

  const goToStep = (step: number) => setCurrentStep(step);

  const sectionsFilled = [
    fuehrung.length > 0,
    erfolgsfokusIndices.length > 0,
    aufgabencharakter.length > 0,
    arbeitslogik.length > 0,
  ].filter(Boolean).length;

  const allSectionsFilled = sectionsFilled === 4;

  return (
    <>
    {showFuehrungInfo && (
      <>
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.15)" }}
          onClick={() => setShowFuehrungInfo(false)}
        />
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 440,
            maxHeight: "80vh",
            overflowY: "auto",
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "28px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
            zIndex: 9999,
          }}
          data-testid="popup-fuehrung-info"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>Definition Führungsverantwortung</h4>
            <button
              onClick={() => setShowFuehrungInfo(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8E8E93", padding: 2 }}
              data-testid="button-close-fuehrung-info"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.6, marginBottom: 16 }}>
            Bitte ordnen Sie die Rolle nach der tatsächlichen Weisungs- und Personalverantwortung ein – nicht nach dem Jobtitel. Entscheidend ist, welche formale Entscheidungsmacht und Ergebnisverantwortung mit der Rolle verbunden sind.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Keine", desc: "Keine Weisungs- oder Steuerungsverantwortung." },
              { label: "Koordination", desc: "Steuert Zusammenarbeit, aber ohne formale Weisungs- oder Personalverantwortung." },
              { label: "Fachliche Führung", desc: "Führt fachlich (Qualität, Standards, Prioritäten), aber ohne Personalentscheidungen." },
              { label: "Disziplinarische Führung", desc: "Personalverantwortung inkl. Ziele, Entwicklung, Entscheidungen und Ergebnis-KPIs." },
            ].map(item => (
              <div key={item.label}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{item.label}: </span>
                <span style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.5 }}>{item.desc}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", lineHeight: 1.6 }}>
              Im Zweifel orientieren Sie sich bitte an folgender Leitfrage:<br />
              Hat die Rolle formale Zielvereinbarungs- und Beurteilungsverantwortung für Mitarbeitende?<br />
              Wenn ja, liegt in der Regel disziplinarische Führung vor.
            </p>
          </div>
        </div>
      </>
    )}
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 20% 60%, rgba(252,205,210,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 100% 70% at 80% 30%, rgba(186,220,248,0.35) 0%, transparent 50%), " +
            "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(200,235,210,0.3) 0%, transparent 50%)",
          animation: "gradientShift 20s ease-in-out infinite alternate",
        }}
      />

      <style>{`
        @keyframes gradientShift {
          0% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.05) translate(-1%, 1%); }
          66% { transform: scale(1.02) translate(1%, -1%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 4px 12px rgba(0,113,227,0.25); }
          50% { box-shadow: 0 4px 20px rgba(0,113,227,0.4); }
          100% { box-shadow: 0 4px 12px rgba(0,113,227,0.25); }
        }
      `}</style>

      <div className="relative z-10 flex flex-col min-h-screen">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleFileChange}
          data-testid="input-file-load"
        />
        <Header onSave={handleSave} onLoad={handleLoad} />

        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-20">
          <div className="text-center mt-8 mb-10">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground/90 mb-2" data-testid="text-rollen-dna-title">
              Rollenprofil ermitteln
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto" data-testid="text-rollen-dna-subtitle">
              Erforderliche Rollenstruktur aus der definierten Logik ableiten.
            </p>
          </div>

          {!allCollapsed && (
          <div className="mb-12">
            <StepProgress currentStep={currentStep} completedSteps={completedSteps} />
          </div>
          )}

          <div className="space-y-5">

            {allCollapsed ? null : currentStep === 1 ? (
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
                      className="gap-2"
                      style={{
                        height: 52,
                        paddingLeft: 32,
                        paddingRight: 32,
                        fontSize: 16,
                        fontWeight: 600,
                        borderRadius: 14,
                        background: step1Valid ? "linear-gradient(135deg, #0071E3, #34AADC)" : undefined,
                        border: "none",
                        boxShadow: step1Valid ? "0 4px 16px rgba(0,113,227,0.3)" : undefined,
                      }}
                      data-testid="button-step-1-weiter"
                    >
                      Weiter
                      <ArrowRight className="w-5 h-5" />
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

            {allCollapsed ? null : currentStep === 2 ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400" data-testid="card-step-2">
                <div className="mb-6">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">Schritt 2</span>
                  <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }} className="dark:text-foreground/90 mt-1" data-testid="text-step-2-title">
                    Rahmenbedingungen der Rolle
                  </h2>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderRadius: 24,
                    padding: "48px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                  className="dark:bg-card/40"
                >
                  <MiniProgressBar filled={sectionsFilled} total={4} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

                    <FadeInSection delay={0}>
                      <div data-testid="section-fuehrung" className="relative">
                        <SectionNumber num={1} isComplete={fuehrung.length > 0} />
                        <div className="flex items-center gap-3">
                          <Users style={{ width: 20, height: 20, color: "#6E6E73", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#1D1D1F" }} className="dark:text-foreground/90">
                            Führungsverantwortung
                          </h3>
                          <div style={{ position: "relative" }}>
                            <button
                              onClick={() => setShowFuehrungInfo(prev => !prev)}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                border: "1.5px solid rgba(0,113,227,0.4)",
                                background: "transparent",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#0071E3",
                                transition: "all 150ms ease",
                                padding: 0,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,113,227,0.08)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              data-testid="button-fuehrung-info"
                            >
                              <Info style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, paddingLeft: 32 }}>
                          {SECTION_SUBTITLES.fuehrung}
                        </p>
                        <div style={{ marginTop: 28 }}>
                          <PillGroup
                            options={["Keine", "Projekt-/Teamkoordination", "Fachliche Führung", "Disziplinarische Führung mit Ergebnisverantwortung"]}
                            selected={[fuehrung]}
                            onSelect={handleFuehrung}
                            columns={2}
                          />
                        </div>
                      </div>
                    </FadeInSection>

                    <SectionDivider />

                    <FadeInSection delay={100}>
                      <div data-testid="section-erfolgsfokus" className="relative">
                        <SectionNumber num={2} isComplete={erfolgsfokusIndices.length > 0} />
                        <div className="flex items-center gap-3">
                          <Target style={{ width: 20, height: 20, color: "#6E6E73", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#1D1D1F" }} className="dark:text-foreground/90">
                            Erfolgsfokus
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, paddingLeft: 32 }}>
                          {SECTION_SUBTITLES.erfolgsfokus}
                        </p>
                        <div style={{ marginTop: 28 }} className="flex flex-col gap-2">
                          <PillGroupIndexed
                            options={ERFOLGSFOKUS_LABELS.slice(0, 3)}
                            selectedIndices={erfolgsfokusIndices}
                            onSelectIndex={handleErfolgsfokus}
                            indexOffset={0}
                          />
                          <PillGroupIndexed
                            options={ERFOLGSFOKUS_LABELS.slice(3, 6)}
                            selectedIndices={erfolgsfokusIndices}
                            onSelectIndex={handleErfolgsfokus}
                            indexOffset={3}
                          />
                        </div>
                      </div>
                    </FadeInSection>

                    <SectionDivider />

                    <FadeInSection delay={200}>
                      <div data-testid="section-aufgabencharakter" className="relative">
                        <SectionNumber num={3} isComplete={aufgabencharakter.length > 0} />
                        <div className="flex items-center gap-3">
                          <Layers style={{ width: 20, height: 20, color: "#6E6E73", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#1D1D1F" }} className="dark:text-foreground/90">
                            Aufgabencharakter
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, paddingLeft: 32 }}>
                          {SECTION_SUBTITLES.aufgabencharakter}
                        </p>
                        <div style={{ marginTop: 28 }}>
                          <PillGroup
                            options={["Überwiegend operativ", "Gemischt", "Überwiegend strategisch"]}
                            selected={[aufgabencharakter]}
                            onSelect={handleAufgabencharakter}
                          />
                        </div>
                      </div>
                    </FadeInSection>

                    <SectionDivider />

                    <FadeInSection delay={300}>
                      <div data-testid="section-arbeitslogik" className="relative">
                        <SectionNumber num={4} isComplete={arbeitslogik.length > 0} />
                        <div className="flex items-center gap-3">
                          <Activity style={{ width: 20, height: 20, color: "#6E6E73", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#1D1D1F" }} className="dark:text-foreground/90">
                            Arbeitslogik
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, paddingLeft: 32 }}>
                          {SECTION_SUBTITLES.arbeitslogik}
                        </p>
                        <div style={{ marginTop: 28 }}>
                          <PillGroup
                            options={["Menschenorientiert", "Daten-/prozessorientiert", "Umsetzungsorientiert"]}
                            selected={[arbeitslogik]}
                            onSelect={handleArbeitslogik}
                          />
                        </div>
                      </div>
                    </FadeInSection>

                  </div>

                  {allSectionsFilled && (
                    <div style={{
                      opacity: 1,
                      animation: "fadeSlideUp 400ms ease-out",
                    }}>
                      <style>{`
                        @keyframes fadeSlideUp {
                          from { opacity: 0; transform: translateY(8px); }
                          to { opacity: 1; transform: translateY(0); }
                        }
                      `}</style>
                      <SummaryBar
                        fuehrung={fuehrung}
                        erfolgsfokus={erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i].replace(/\n/g, ""))}
                        aufgabencharakter={aufgabencharakter}
                        arbeitslogik={arbeitslogik}
                      />
                    </div>
                  )}

                  <div className="flex justify-end" style={{ marginTop: 40 }}>
                    <Button
                      disabled={!step2Valid}
                      onClick={() => goToStep(3)}
                      style={{
                        height: 52,
                        paddingLeft: 32,
                        paddingRight: 32,
                        fontSize: 16,
                        fontWeight: 600,
                        borderRadius: 14,
                        background: step2Valid ? "linear-gradient(135deg, #0071E3, #34AADC)" : undefined,
                        border: "none",
                        boxShadow: step2Valid ? "0 4px 16px rgba(0,113,227,0.3)" : undefined,
                      }}
                      className="gap-2"
                      data-testid="button-step-2-weiter"
                    >
                      Weiter
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : !allCollapsed && currentStep > 2 ? (
              <CollapsedStep
                step={2}
                title="Rahmenbedingungen der Rolle"
                summary={`${fuehrung} · ${erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i]).join(", ")} · ${aufgabencharakter} · ${arbeitslogik}`}
                onEdit={() => goToStep(2)}
              />
            ) : (
              <LockedStep step={2} title="Rahmenbedingungen der Rolle" />
            )}

            {allCollapsed ? null : currentStep === 3 ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400" data-testid="card-step-3">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-xs font-medium text-primary uppercase tracking-wider">Schritt 3</span>
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }} className="dark:text-foreground/90 mt-1" data-testid="text-step-3-title">
                      Tätigkeiten & Kompetenzen
                    </h2>
                    <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 4 }}>
                      Formen Sie die konkrete Struktur dieser Rolle.
                    </p>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "#8E8E93", lineHeight: 1.8 }}>
                    <div>Tätigkeiten <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{hauptCount} / 15</span></div>
                    <div>Humankompetenzen <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{nebenCount} / 10</span></div>
                    {fuehrung !== "Keine" && (
                      <div>Führungskompetenzen <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{fuehrungCount} / 10</span></div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderRadius: 24,
                    padding: "32px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                  className="dark:bg-card/40"
                >
                  <div className="flex items-center gap-2 mb-8" data-testid="tabs-taetigkeiten">
                    {([
                      { key: "haupt" as TaetigkeitKategorie, label: "Tätigkeiten" },
                      { key: "neben" as TaetigkeitKategorie, label: "Humankompetenzen" },
                      ...(fuehrung !== "Keine" ? [{ key: "fuehrung" as TaetigkeitKategorie, label: "Führungskompetenzen" }] : []),
                    ]).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                          height: 40,
                          paddingLeft: 20,
                          paddingRight: 20,
                          fontSize: 14,
                          fontWeight: 600,
                          borderRadius: 999,
                          border: "none",
                          cursor: "pointer",
                          transition: "all 200ms ease",
                          background: activeTab === tab.key ? "linear-gradient(135deg, #0071E3, #34AADC)" : "transparent",
                          color: activeTab === tab.key ? "#FFFFFF" : "#6E6E73",
                          boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,113,227,0.2)" : "none",
                        }}
                        data-testid={`tab-${tab.key}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    {filteredTaetigkeiten.length === 0 ? (
                      <div className="text-center py-12">
                        <p style={{ fontSize: 15, color: "#8E8E93" }}>
                          Noch keine {activeTab === "haupt" ? "Tätigkeiten" : activeTab === "neben" ? "Humankompetenzen" : "Führungskompetenzen"} hinzugefügt.
                        </p>
                      </div>
                    ) : (
                      filteredTaetigkeiten.map((t, idx) => (
                        <div key={t.id} data-testid={`taetigkeit-${t.id}`}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 16,
                              padding: "20px 0",
                            }}
                          >
                            <span style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: "#AEAEB2",
                              minWidth: 24,
                              paddingTop: 2,
                            }}>
                              {idx + 1}.
                            </span>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex items-start justify-between gap-3">
                                <textarea
                                  value={t.name}
                                  onChange={(e) => handleRenameTaetigkeit(t.id, e.target.value)}
                                  rows={2}
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 400,
                                    color: "#1D1D1F",
                                    lineHeight: 1.5,
                                    flex: 1,
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    padding: 0,
                                    borderBottom: "1px solid transparent",
                                    transition: "border-color 150ms ease",
                                    width: "100%",
                                    resize: "none",
                                    fontFamily: "inherit",
                                  }}
                                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = "rgba(0,113,227,0.3)"; }}
                                  onBlur={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
                                  data-testid={`input-taetigkeit-name-${t.id}`}
                                />
                                <button
                                  onClick={() => handleRemoveTaetigkeit(t.id)}
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#AEAEB2",
                                    transition: "all 150ms ease",
                                    flexShrink: 0,
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.color = "#FF3B30";
                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,59,48,0.06)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.color = "#AEAEB2";
                                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                  }}
                                  data-testid={`remove-taetigkeit-${t.id}`}
                                >
                                  <X style={{ width: 14, height: 14 }} />
                                </button>
                              </div>

                              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 500, color: "#AEAEB2", minWidth: 52, textTransform: "uppercase", letterSpacing: "0.5px" }}>Niveau</span>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    {NIVEAU_OPTIONS.map(n => {
                                      const catHighCount = taetigkeiten.filter(tt => tt.kategorie === t.kategorie && tt.niveau === "Hoch").length;
                                      const isHighDisabled = n === "Hoch" && t.niveau !== "Hoch" && catHighCount >= MAX_HIGH;
                                      return (
                                      <button
                                        key={n}
                                        onClick={() => !isHighDisabled && handleNiveauChange(t.id, n)}
                                        style={{
                                          height: 28,
                                          paddingLeft: 10,
                                          paddingRight: 10,
                                          fontSize: 12,
                                          fontWeight: 500,
                                          borderRadius: 999,
                                          border: t.niveau === n ? "1.5px solid transparent" : "1px solid rgba(0,0,0,0.1)",
                                          cursor: isHighDisabled ? "not-allowed" : "pointer",
                                          transition: "all 150ms ease",
                                          background: t.niveau === n ? "linear-gradient(135deg, #6B7280, #9CA3AF)" : "transparent",
                                          color: t.niveau === n ? "#FFFFFF" : isHighDisabled ? "#D1D1D6" : "#8E8E93",
                                          opacity: isHighDisabled ? 0.5 : 1,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                        data-testid={`niveau-${t.id}-${n.toLowerCase()}`}
                                      >
                                        {t.niveau === n && <Check style={{ width: 10, height: 10 }} />}
                                        {n}
                                      </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 500, color: "#AEAEB2", minWidth: 52, textTransform: "uppercase", letterSpacing: "0.5px" }}>Bereich</span>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    {KOMPETENZ_OPTIONS.map(k => (
                                      <button
                                        key={k}
                                        onClick={() => handleKompetenzChange(t.id, k)}
                                        style={{
                                          height: 28,
                                          paddingLeft: 10,
                                          paddingRight: 10,
                                          fontSize: 12,
                                          fontWeight: 600,
                                          borderRadius: 999,
                                          border: t.kompetenz === k ? "1.5px solid transparent" : "1px solid rgba(0,0,0,0.1)",
                                          cursor: "pointer",
                                          transition: "all 150ms ease",
                                          background: t.kompetenz === k ? KOMPETENZ_COLORS[k] : "transparent",
                                          color: t.kompetenz === k ? "#FFFFFF" : KOMPETENZ_COLORS[k],
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                        data-testid={`kompetenz-${t.id}-${k.toLowerCase()}`}
                                      >
                                        {k}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {idx < filteredTaetigkeiten.length - 1 && (
                            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent)" }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {canAddMore ? (
                    <div style={{
                      marginTop: 24,
                      paddingTop: 24,
                      borderTop: "1px dashed rgba(0,0,0,0.08)",
                      display: "flex",
                      justifyContent: "center",
                    }}>
                      <button
                        onClick={handleAddTaetigkeit}
                        style={{
                          height: 44,
                          paddingLeft: 24,
                          paddingRight: 24,
                          fontSize: 14,
                          fontWeight: 600,
                          borderRadius: 999,
                          border: "1.5px solid rgba(0,113,227,0.3)",
                          cursor: "pointer",
                          background: "transparent",
                          color: "#0071E3",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 200ms ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,113,227,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                        data-testid="button-taetigkeit-hinzufuegen"
                      >
                        <Plus style={{ width: 16, height: 16 }} />
                        Neue Tätigkeit hinzufügen
                      </button>
                    </div>
                  ) : null}

                  <p style={{ fontSize: 12, color: "#AEAEB2", textAlign: "center", marginTop: 16 }}>
                    {currentTabCount >= currentTabMax
                      ? `Maximum von ${currentTabMax} erreicht`
                      : `Maximal ${currentTabMax} ${activeTab === "haupt" ? "Tätigkeiten" : activeTab === "neben" ? "Humankompetenzen" : "Führungskompetenzen"}`
                    }
                    {currentTabHighCount > 0 && ` · Hoch: ${currentTabHighCount} / ${MAX_HIGH}`}
                  </p>
                </div>

                <div className="flex justify-end" style={{ marginTop: 24 }}>
                  <Button
                    className="gap-2"
                    style={{
                      height: 52,
                      paddingLeft: 32,
                      paddingRight: 32,
                      fontSize: 16,
                      fontWeight: 600,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #0071E3, #34AADC)",
                      border: "none",
                      boxShadow: "0 4px 16px rgba(0,113,227,0.3)",
                    }}
                    data-testid="button-step-3-fertig"
                    onClick={() => {
                      setAllCollapsed(true);
                      localStorage.setItem("rollenDnaCompleted", "true");
                    }}
                  >
                    Datenerfassung abgeschlossen
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <LockedStep step={3} title="Tätigkeiten & Kompetenzen" />
            )}

            {allCollapsed && (
              <div
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderRadius: 24,
                  padding: "32px 40px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.04)",
                  marginTop: 24,
                }}
                className="dark:bg-card/40"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 style={{ width: 24, height: 24, color: "#34C759" }} />
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F" }}>Datenerfassung abgeschlossen</h3>
                  </div>
                  <button
                    onClick={() => {
                      setAllCollapsed(false);
                      localStorage.removeItem("rollenDnaCompleted");
                    }}
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#0071E3",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    data-testid="button-reopen-steps"
                  >
                    Bearbeiten
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "#6E6E73" }}>
                  <div><span style={{ fontWeight: 600, color: "#1D1D1F" }}>Rolle:</span> {beruf}</div>
                  <div><span style={{ fontWeight: 600, color: "#1D1D1F" }}>Führung:</span> {fuehrung}</div>
                  <div><span style={{ fontWeight: 600, color: "#1D1D1F" }}>Erfolgsfokus:</span> {erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i].replace(/\n/g, " ")).join(", ")}</div>
                  <div><span style={{ fontWeight: 600, color: "#1D1D1F" }}>Aufgabencharakter:</span> {aufgabencharakter}</div>
                  <div><span style={{ fontWeight: 600, color: "#1D1D1F" }}>Arbeitslogik:</span> {arbeitslogik}</div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ fontWeight: 600, color: "#1D1D1F" }}>Tätigkeiten:</span> {hauptCount} · <span style={{ fontWeight: 600, color: "#1D1D1F" }}>Humankompetenzen:</span> {nebenCount}
                    {fuehrung !== "Keine" && <> · <span style={{ fontWeight: 600, color: "#1D1D1F" }}>Führungskompetenzen:</span> {fuehrungCount}</>}
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
    </>
  );
}
