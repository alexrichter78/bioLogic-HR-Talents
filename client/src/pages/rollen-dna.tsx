import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeft, Save, FolderOpen, Check, ChevronDown, ArrowRight, Users, Target, Layers, Activity, CheckCircle2, MoreHorizontal, X, ChevronRight, Info, RefreshCw, Briefcase, Heart, Settings, Shield, BarChart3, Lightbulb, FileText, MessageSquare, LayoutGrid, Wrench, UserCheck, Hash } from "lucide-react";
import logoSrc from "@assets/bioLogic-Logo-Transparent_1771718118370.png";
import GlobalNav from "@/components/global-nav";
import { BERUFE, type BerufLand } from "@/data/berufe";

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

const LEVEL_MULTIPLIER: Record<Niveau, number> = { Niedrig: 0.6, Mittel: 1.0, Hoch: 1.8 };

interface BioGram { imp: number; int: number; ana: number; }

function roundPercentages(p1: number, p2: number, p3: number): [number, number, number] {
  const factor = 10;
  const raw = [p1 * factor, p2 * factor, p3 * factor];
  const flo = [Math.floor(raw[0]), Math.floor(raw[1]), Math.floor(raw[2])];
  const rest = [raw[0] - flo[0], raw[1] - flo[1], raw[2] - flo[2]];
  const targetSum = 100 * factor;
  let missing = targetSum - (flo[0] + flo[1] + flo[2]);
  while (missing > 0) {
    let maxIdx = 0;
    if (rest[1] > rest[maxIdx]) maxIdx = 1;
    if (rest[2] > rest[maxIdx]) maxIdx = 2;
    flo[maxIdx] += 1;
    rest[maxIdx] = 0;
    missing -= 1;
  }
  return [flo[0] / factor, flo[1] / factor, flo[2] / factor];
}

function calcBioGram(items: Taetigkeit[]): BioGram {
  if (items.length === 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  let sImp = 0, sInt = 0, sAna = 0;
  for (const t of items) {
    const w = LEVEL_MULTIPLIER[t.niveau] ?? 1.0;
    if (t.kompetenz === "Impulsiv") sImp += w;
    else if (t.kompetenz === "Intuitiv") sInt += w;
    else if (t.kompetenz === "Analytisch") sAna += w;
  }
  const total = sImp + sInt + sAna;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const [imp, int, ana] = roundPercentages((sImp / total) * 100, (sInt / total) * 100, (sAna / total) * 100);
  return { imp, int, ana };
}

type ResultKey =
  | "IMP_INT_ANA" | "IMP_ANA_INT" | "INT_IMP_ANA" | "INT_ANA_IMP" | "ANA_IMP_INT" | "ANA_INT_IMP"
  | "IMP_INT__ANA" | "IMP_ANA__INT" | "INT_IMP__ANA" | "INT_ANA__IMP" | "ANA_IMP__INT" | "ANA_INT__IMP"
  | "BALANCED";

type RoleResultEntry = { headline: string; summary: string; focus: string; transfer: string; leadership: string };

const DUAL_THRESHOLD = 5;
const BALANCED_THRESHOLD = 5;

const DIMENSION_LABELS: Record<string, string> = { IMP: "Impulsiv", INT: "Intuitiv", ANA: "Analytisch" };
const DIMENSION_PLAIN: Record<string, string> = {
  IMP: "Umsetzung und Entscheidungskraft",
  INT: "Zusammenarbeit und Kommunikation",
  ANA: "Struktur und Planung",
};

type RoleAnalysis = {
  resultKey: ResultKey;
  dominanceType: "single" | "dual" | "balanced";
  sorted: { key: string; value: number }[];
  topGap: number;
  bottomGap: number;
  bottomTwoClose: boolean;
  intensityLabel: string;
};

function getRoleAnalysis(imp: number, int: number, ana: number): RoleAnalysis {
  const vals = [
    { key: "IMP", value: imp },
    { key: "INT", value: int },
    { key: "ANA", value: ana },
  ].sort((a, b) => b.value - a.value);
  const maxV = vals[0].value, midV = vals[1].value, minV = vals[2].value;
  const topGap = maxV - midV;
  const bottomGap = midV - minV;
  const bottomTwoClose = bottomGap <= DUAL_THRESHOLD;

  let resultKey: ResultKey;
  let dominanceType: "single" | "dual" | "balanced";

  if (maxV - minV <= BALANCED_THRESHOLD) {
    resultKey = "BALANCED";
    dominanceType = "balanced";
  } else if (topGap <= DUAL_THRESHOLD && bottomGap > DUAL_THRESHOLD) {
    resultKey = `${vals[0].key}_${vals[1].key}__${vals[2].key}` as ResultKey;
    dominanceType = "dual";
  } else {
    resultKey = `${vals[0].key}_${vals[1].key}_${vals[2].key}` as ResultKey;
    dominanceType = "single";
  }

  let intensityLabel = "";
  if (dominanceType === "single") {
    if (topGap >= 15) intensityLabel = "sehr deutlich";
    else if (topGap >= 10) intensityLabel = "deutlich";
    else if (topGap >= 6) intensityLabel = "erkennbar";
  }

  return { resultKey, dominanceType, sorted: vals, topGap, bottomGap, bottomTwoClose, intensityLabel };
}

function getContextLines(analysis: RoleAnalysis): string[] {
  const s = analysis.sorted;
  const d0 = DIMENSION_PLAIN[s[0].key], l0 = DIMENSION_LABELS[s[0].key];
  const d1 = DIMENSION_PLAIN[s[1].key], l1 = DIMENSION_LABELS[s[1].key];
  const d2 = DIMENSION_PLAIN[s[2].key], l2 = DIMENSION_LABELS[s[2].key];

  if (analysis.dominanceType === "balanced") {
    return [
      "Alle drei Bereiche liegen auf einem ähnlichen Niveau. Es gibt keinen klaren Schwerpunkt.",
    ];
  }

  if (analysis.dominanceType === "dual") {
    return [
      `${d0} (${l0}) und ${d1} (${l1}) sind hier gleich stark ausgeprägt.`,
      `${d2} (${l2}) tritt dagegen in den Hintergrund.`,
    ];
  }

  const lines: string[] = [];
  if (analysis.intensityLabel) {
    lines.push(`Der Schwerpunkt liegt ${analysis.intensityLabel} auf ${d0} (${l0}).`);
  } else {
    lines.push(`Der Schwerpunkt liegt auf ${d0} (${l0}).`);
  }

  if (analysis.bottomTwoClose) {
    lines.push(`${d1} (${l1}) und ${d2} (${l2}) liegen nah beieinander und bilden gemeinsam den Hintergrund.`);
  } else {
    lines.push(`${d1} (${l1}) spielt die zweite Rolle. ${d2} (${l2}) hat das geringste Gewicht.`);
  }

  return lines;
}

function getRoleResultKey(imp: number, int: number, ana: number): ResultKey {
  return getRoleAnalysis(imp, int, ana).resultKey;
}

const roleResultTexts: Record<ResultKey, RoleResultEntry> = {
  IMP_INT_ANA: {
    headline: "Schwerpunkt: Umsetzung und Zusammenarbeit",
    summary: "Diese Rolle ist stark auf Umsetzung und Bewegung ausgerichtet. Entscheidungen werden zügig getroffen und Themen aktiv vorangebracht.",
    focus: "Gleichzeitig spielt der Umgang mit Menschen eine wichtige Rolle. Abstimmung, Kommunikation und die Fähigkeit, andere mitzunehmen, unterstützen die Handlungsorientierung.",
    transfer: "Struktur und Planung sind vorhanden, stehen jedoch nicht im Vordergrund. Die Rolle wirkt besonders dort stark, wo Tempo, klare Ziele und Zusammenarbeit zusammenkommen.",
    leadership: "In der Führungsarbeit zeigt sich das durch sichtbare Präsenz, klare Richtung und motivierende Ansprache.",
  },
  IMP_ANA_INT: {
    headline: "Schwerpunkt: Umsetzung und Struktur",
    summary: "Diese Rolle verbindet Entscheidungsstärke mit strukturiertem Vorgehen.",
    focus: "Themen werden konsequent vorangebracht, gleichzeitig wird darauf geachtet, dass Planung, Ordnung und fachliche Qualität erhalten bleiben.",
    transfer: "Der Umgang mit Menschen unterstützt die Arbeit, steht jedoch weniger im Mittelpunkt als Ergebnisorientierung und klare Abläufe. Besonders wirksam ist die Rolle dort, wo Verantwortung übernommen, Entscheidungen getroffen und Projekte sauber umgesetzt werden müssen.",
    leadership: "In der Führungsarbeit zeigt sich das durch klare Steuerung, hohe Verbindlichkeit und einen starken Fokus auf Ergebnisse.",
  },
  INT_IMP_ANA: {
    headline: "Schwerpunkt: Zusammenarbeit und Umsetzung",
    summary: "Diese Rolle ist stark von Zusammenarbeit und Kommunikation geprägt.",
    focus: "Menschen zusammenzubringen, Themen zu besprechen und gemeinsame Lösungen zu entwickeln steht im Vordergrund. Gleichzeitig bringt die Rolle genügend Energie mit, um Ideen auch in Bewegung zu bringen und Entscheidungen anzustoßen.",
    transfer: "Struktur und Planung unterstützen die Arbeit, sind jedoch nicht der zentrale Fokus. Besonders stark wirkt die Rolle dort, wo Abstimmung, Dynamik und gemeinsame Umsetzung zusammenkommen.",
    leadership: "In der Führungsarbeit zeigt sich das durch offene Kommunikation, Nähe zum Team und motivierende Aktivität.",
  },
  INT_ANA_IMP: {
    headline: "Schwerpunkt: Zusammenarbeit und Struktur",
    summary: "Diese Rolle verbindet Teamorientierung mit strukturiertem Arbeiten.",
    focus: "Kommunikation, Abstimmung und ein gutes Gespür für Menschen gehen Hand in Hand mit Planung, klaren Abläufen und fachlicher Sorgfalt.",
    transfer: "Entscheidungen werden meist überlegt getroffen und gut abgestimmt. Besonders wirksam ist die Rolle dort, wo Zusammenarbeit und verlässliche Strukturen gleichzeitig wichtig sind.",
    leadership: "In der Führungsarbeit zeigt sich das durch klare Orientierung, nachvollziehbare Entscheidungen und einen offenen Austausch mit dem Team.",
  },
  ANA_IMP_INT: {
    headline: "Schwerpunkt: Struktur und Umsetzung",
    summary: "Diese Rolle ist stark von Struktur, fachlicher Präzision und Planung geprägt.",
    focus: "Gleichzeitig besteht eine deutliche Bereitschaft, Entscheidungen zu treffen und Themen konsequent umzusetzen.",
    transfer: "Zusammenarbeit unterstützt die Arbeit, steht jedoch weniger im Vordergrund als Qualität, Klarheit und fachliche Ordnung. Die Rolle wirkt besonders stark dort, wo komplexe Aufgaben sauber analysiert und anschließend entschlossen umgesetzt werden müssen.",
    leadership: "In der Führungsarbeit zeigt sich das durch klare Struktur, sachliche Entscheidungen und eine konsequente Ergebnisorientierung.",
  },
  ANA_INT_IMP: {
    headline: "Schwerpunkt: Struktur und Zusammenarbeit",
    summary: "Diese Rolle verbindet fachliche Struktur mit einer kooperativen Arbeitsweise.",
    focus: "Planung, Qualität und klare Abläufe spielen eine wichtige Rolle, gleichzeitig wird Wert auf Abstimmung und Zusammenarbeit gelegt.",
    transfer: "Entscheidungen entstehen meist aus sorgfältiger Überlegung und gemeinsamer Klärung. Besonders stark wirkt die Rolle dort, wo verlässliche Prozesse und gute Zusammenarbeit miteinander verbunden werden müssen.",
    leadership: "In der Führungsarbeit zeigt sich das durch ruhige Steuerung, klare Strukturen und eine hohe Dialogfähigkeit.",
  },
  IMP_INT__ANA: {
    headline: "Gleichgewicht: Umsetzung und Zusammenarbeit",
    summary: "Diese Rolle verbindet Handlungsenergie und Menschenorientierung in nahezu gleicher Stärke.",
    focus: "Entscheidungen werden schnell getroffen, gleichzeitig wird viel Wert auf Kommunikation und Abstimmung gelegt.",
    transfer: "Struktur und Planung unterstützen die Arbeit, stehen jedoch weniger im Mittelpunkt. Besonders stark wirkt die Rolle dort, wo Dynamik, Austausch und gemeinsame Umsetzung gefragt sind.",
    leadership: "In der Führungsarbeit zeigt sich das durch aktive Präsenz, direkte Ansprache und eine motivierende Wirkung auf das Team.",
  },
  IMP_ANA__INT: {
    headline: "Gleichgewicht: Umsetzung und Struktur",
    summary: "Diese Rolle vereint Entscheidungskraft und strukturiertes Arbeiten.",
    focus: "Themen werden klar vorangebracht, gleichzeitig wird auf Planung, Ordnung und fachliche Qualität geachtet.",
    transfer: "Der soziale Austausch unterstützt die Arbeit, spielt jedoch eine geringere Rolle. Die Rolle wirkt besonders stark dort, wo Verantwortung übernommen, Entscheidungen getroffen und Ergebnisse zuverlässig umgesetzt werden müssen.",
    leadership: "In der Führungsarbeit zeigt sich das durch klare Richtung, strukturierte Steuerung und hohe Ergebnisverantwortung.",
  },
  INT_IMP__ANA: {
    headline: "Gleichgewicht: Zusammenarbeit und Umsetzung",
    summary: "Diese Rolle verbindet Zusammenarbeit und Handlungsorientierung.",
    focus: "Menschen einzubinden, Themen zu besprechen und gleichzeitig Bewegung in Prozesse zu bringen prägt die Arbeitsweise.",
    transfer: "Struktur und Planung sind vorhanden, stehen jedoch weniger im Mittelpunkt. Die Rolle wirkt besonders stark dort, wo Austausch, Dynamik und gemeinsame Entscheidungen wichtig sind.",
    leadership: "In der Führungsarbeit zeigt sich das durch offene Kommunikation, Präsenz im Team und eine aktivierende Wirkung.",
  },
  INT_ANA__IMP: {
    headline: "Gleichgewicht: Zusammenarbeit und Struktur",
    summary: "Diese Rolle verbindet Teamorientierung und strukturiertes Arbeiten in nahezu gleicher Stärke.",
    focus: "Zusammenarbeit, Kommunikation und Abstimmung gehen Hand in Hand mit Planung, klaren Abläufen und fachlicher Ordnung.",
    transfer: "Entscheidungen entstehen meist überlegt und im Austausch mit anderen. Besonders stark wirkt die Rolle dort, wo Menschen zusammenarbeiten und gleichzeitig stabile Prozesse notwendig sind.",
    leadership: "In der Führungsarbeit zeigt sich das durch nachvollziehbare Entscheidungen, klare Strukturen und einen offenen Dialog mit dem Team.",
  },
  ANA_IMP__INT: {
    headline: "Gleichgewicht: Struktur und Umsetzung",
    summary: "Diese Rolle verbindet fachliche Präzision mit konsequenter Umsetzung.",
    focus: "Planung und Struktur bilden die Grundlage, gleichzeitig werden Entscheidungen klar getroffen und Ergebnisse aktiv vorangetrieben.",
    transfer: "Zusammenarbeit unterstützt die Arbeit, steht jedoch weniger im Mittelpunkt. Die Rolle wirkt besonders stark dort, wo klare Entscheidungen und saubere Umsetzung gefragt sind.",
    leadership: "In der Führungsarbeit zeigt sich das durch strukturierte Steuerung, klare Verantwortung und einen hohen Anspruch an Ergebnisse.",
  },
  ANA_INT__IMP: {
    headline: "Gleichgewicht: Struktur und Zusammenarbeit",
    summary: "Diese Rolle verbindet fachliche Struktur mit kooperativer Zusammenarbeit.",
    focus: "Planung, Qualität und klare Abläufe gehen Hand in Hand mit Abstimmung und gemeinsamer Lösungsfindung.",
    transfer: "Entscheidungen entstehen meist durch sorgfältige Abwägung und Austausch. Besonders wirksam ist die Rolle dort, wo verlässliche Prozesse und gute Zusammenarbeit miteinander verbunden werden müssen.",
    leadership: "In der Führungsarbeit zeigt sich das durch ruhige Steuerung, klare Orientierung und eine hohe Anschlussfähigkeit im Team.",
  },
  BALANCED: {
    headline: "Ausgewogenes Rollenprofil",
    summary: "Diese Rolle zeigt eine gleichmäßige Verteilung der drei Dimensionen Impulsiv, Intuitiv und Analytisch.",
    focus: "Je nach Situation kann zwischen Handlung, Zusammenarbeit und Analyse flexibel gewechselt werden. Die Arbeitsweise passt sich häufig den Anforderungen der jeweiligen Aufgabe an.",
    transfer: "Die Rolle wirkt besonders stark dort, wo unterschiedliche Anforderungen zusammenkommen und ein flexibles Vorgehen notwendig ist.",
    leadership: "In der Führungsarbeit zeigt sich das durch situationsabhängige Steuerung und eine ausgewogene Verbindung von Klarheit, Dialog und Handlung.",
  },
};

const analysisPrincipleText = {
  title: "Grundprinzip der Analyse",
  body: [
    "Jeder Mensch verfügt über die drei grundlegenden Denk- und Handlungsweisen Impulsiv, Intuitiv und Analytisch.",
    "Alle drei Anteile sind immer vorhanden. Der Unterschied liegt in ihrer Reihenfolge und Gewichtung.",
    "Diese Struktur prägt, wie Menschen im Alltag entscheiden, kommunizieren und handeln.",
    "Je nach Situation kann sich die sichtbare Wirkung verändern: im Arbeitsalltag, unter Stress oder in entspannten Situationen.",
  ],
};

const roleRequirementText = {
  intro: [
    "Diese Auswertung beschreibt die Wirklogik der Rolle.",
    "Die Anforderungen werden den drei Dimensionen Impulsiv, Intuitiv und Analytisch zugeordnet.",
    "So wird sichtbar, welche Form von Wirksamkeit die Rolle im Arbeitsalltag hauptsächlich verlangt.",
  ],
  outro: "Das Gesamtprofil zeigt, wo der Schwerpunkt liegt und wie die drei Dimensionen zueinander gewichtet sind.",
};

function generateBioCheckText(bg: BioGram, isLeadership: boolean, _fuehrungsBg?: BioGram): string {
  const key = getRoleResultKey(bg.imp, bg.int, bg.ana);
  const t = roleResultTexts[key];
  let text = `${t.headline}\n${t.summary}\n${t.focus}\n${t.transfer}`;
  if (isLeadership) text += `\n${t.leadership}`;
  return text;
}

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/\nUmsatzwirkung",
  "Beziehungs- und\nNetzwerkstabilität",
  "Innovations- &\nTransformationsleistung",
  "Prozess- und\nEffizienzqualität",
  "Fachliche Exzellenz /\nExpertise",
  "Strategische Wirkung /\nPositionierung",
];

const ERFOLGSFOKUS_DISPLAY = [
  { label: "Ergebnisse und Zielerreichung", desc: "Erfolg zeigt sich vor allem in Resultaten, Umsatz oder messbaren Leistungen." },
  { label: "Zusammenarbeit und Netzwerk", desc: "Erfolg entsteht durch stabile Beziehungen, Kommunikation und Abstimmung." },
  { label: "Innovation und Weiterentwicklung", desc: "Erfolg zeigt sich durch neue Ideen, Veränderungen oder Weiterentwicklung." },
  { label: "Prozesse und Effizienz", desc: "Erfolg wird über stabile Abläufe, Qualität und Effizienz erreicht." },
  { label: "Fachliche Qualität und Expertise", desc: "Erfolg basiert auf hoher fachlicher Kompetenz und präziser Arbeit." },
  { label: "Strategische Wirkung", desc: "Erfolg zeigt sich in langfristiger Ausrichtung und Positionierung." },
];

type DescOption = { value: string; label: string; desc: string };

const AUFGABENCHARAKTER_OPTIONS: DescOption[] = [
  { value: "überwiegend operativ", label: "Praktische Umsetzung im Tagesgeschäft", desc: "Die Rolle arbeitet überwiegend operativ und setzt Aufgaben direkt um." },
  { value: "überwiegend systemisch", label: "Umsetzung mit strukturiertem Vorgehen", desc: "Praxis und Planung greifen ineinander. Aufgaben werden umgesetzt und gleichzeitig strukturiert gesteuert." },
  { value: "überwiegend strategisch", label: "Analyse, Planung und strategische Steuerung", desc: "Entscheidungen entstehen vor allem durch Analyse, Planung und Bewertung." },
  { value: "Gemischt", label: "Ausgewogene Mischung", desc: "Die Rolle verbindet operative Arbeit, Analyse und Abstimmung." },
];

const ARBEITSLOGIK_OPTIONS: DescOption[] = [
  { value: "Umsetzungsorientiert", label: "Umsetzung und Ergebnisse", desc: "Die Rolle ist stark handlungsorientiert und arbeitet auf konkrete Resultate hin." },
  { value: "Daten-/prozessorientiert", label: "Analyse und Struktur", desc: "Die Arbeit basiert auf Daten, Planung und systematischem Vorgehen." },
  { value: "Menschenorientiert", label: "Zusammenarbeit und Kommunikation", desc: "Abstimmung, Beziehungen und Kommunikation stehen im Mittelpunkt." },
  { value: "Ausgewogen", label: "Ausgewogene Mischung", desc: "Keine Arbeitsweise steht klar im Vordergrund." },
];

const FUEHRUNG_OPTIONS: DescOption[] = [
  { value: "Keine", label: "Keine Führungsverantwortung", desc: "Die Rolle arbeitet ohne direkte Führung von Mitarbeitenden." },
  { value: "Projekt-/Teamkoordination", label: "Projekt- oder Teamkoordination", desc: "Die Rolle koordiniert Aufgaben oder Projekte, ohne disziplinarische Verantwortung." },
  { value: "Fachliche Führung", label: "Fachliche Führung", desc: "Die Rolle steuert fachliche Arbeit und Qualität im Team." },
  { value: "Disziplinarische Führung mit Ergebnisverantwortung", label: "Disziplinarische Führung", desc: "Die Rolle trägt Verantwortung für Mitarbeitende, Ergebnisse und Entwicklung." },
];

const SECTION_SUBTITLES: Record<string, string> = {
  aufgabencharakter: "Welche Art von Aufgaben prägt diese Rolle hauptsächlich?",
  arbeitslogik: "Was prägt die tägliche Arbeit dieser Rolle am stärksten?",
  erfolgsfokus: "Woran wird der Erfolg dieser Rolle hauptsächlich gemessen?",
  fuehrung: "Welche Führungsrolle gehört zu dieser Position?",
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
                    ? "bg-green-500 text-white shadow-md shadow-green-500/25"
                    : "bg-green-50 dark:bg-green-900/20 text-green-300 dark:text-green-400/50"
              }`} data-testid={`step-num-${step.num}`}>
                {isDone ? <Check className="w-4 h-4" strokeWidth={2.5} /> : step.num}
              </span>
              <span className={`text-xs transition-colors duration-300 whitespace-nowrap ${
                isDone
                  ? "font-medium text-green-600 dark:text-green-400"
                  : isCurrent
                    ? "font-semibold text-green-700 dark:text-green-400"
                    : "text-green-300/60 dark:text-green-400/40"
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
      style={{ position: "relative", zIndex: 1 }}
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
              border: isSelected ? "2px solid transparent" : "2px solid rgba(0,0,0,0.10)",
              cursor: "pointer",
              transition: "background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
              background: isSelected ? "linear-gradient(135deg, #0071E3, #34AADC)" : "transparent",
              color: isSelected ? "#FFFFFF" : "#6E6E73",
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
              border: isSelected ? "2px solid transparent" : "2px solid rgba(0,0,0,0.10)",
              cursor: "pointer",
              transition: "background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
              background: isSelected ? "linear-gradient(135deg, #0071E3, #34AADC)" : "transparent",
              color: isSelected ? "#FFFFFF" : "#6E6E73",
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

function DescriptiveOptionGroup({
  options,
  selectedValue,
  onSelect,
}: {
  options: DescOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 4 }}>
      {options.map((opt, idx) => {
        const isSelected = selectedValue === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
              padding: "14px 18px",
              borderRadius: 14,
              border: isSelected ? "2px solid #0071E3" : "2px solid rgba(0,0,0,0.08)",
              background: isSelected ? "rgba(0,113,227,0.06)" : "transparent",
              cursor: "pointer",
              transition: "background 180ms ease, border-color 180ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.03)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
            data-testid={`option-${opt.value.toLowerCase().replace(/[\s\/-]+/g, "-")}-${idx}`}
          >
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              color: isSelected ? "#0071E3" : "#1D1D1F",
              lineHeight: 1.3,
            }}>{opt.label}</span>
            <span style={{
              fontSize: 13,
              color: "#8E8E93",
              lineHeight: 1.5,
              marginTop: 3,
            }}>{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

function DescriptiveOptionGroupIndexed({
  options,
  selectedIndices,
  onSelectIndex,
}: {
  options: { label: string; desc: string }[];
  selectedIndices: number[];
  onSelectIndex: (idx: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 4 }}>
      {options.map((opt, idx) => {
        const isSelected = selectedIndices.includes(idx);
        return (
          <button
            key={idx}
            onClick={() => onSelectIndex(idx)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
              padding: "14px 18px",
              borderRadius: 14,
              border: isSelected ? "2px solid #0071E3" : "2px solid rgba(0,0,0,0.08)",
              background: isSelected ? "rgba(0,113,227,0.06)" : "transparent",
              cursor: "pointer",
              transition: "background 180ms ease, border-color 180ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.03)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
            data-testid={`option-erfolgsfokus-${idx}`}
          >
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              color: isSelected ? "#0071E3" : "#1D1D1F",
              lineHeight: 1.3,
            }}>{opt.label}</span>
            <span style={{
              fontSize: 13,
              color: "#8E8E93",
              lineHeight: 1.5,
              marginTop: 3,
            }}>{opt.desc}</span>
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

function SummaryBar({ beruf, fuehrung, erfolgsfokusIndices, aufgabencharakter, arbeitslogik }: {
  beruf: string;
  fuehrung: string;
  erfolgsfokusIndices: number[];
  aufgabencharakter: string;
  arbeitslogik: string;
}) {
  const arbeitsOpt = ARBEITSLOGIK_OPTIONS.find(o => o.value === arbeitslogik);
  const fuehrungOpt = FUEHRUNG_OPTIONS.find(o => o.value === fuehrung);
  const fokusLabels = erfolgsfokusIndices.map(i => ERFOLGSFOKUS_DISPLAY[i]?.label).filter(Boolean);
  const rollenName = beruf || "diese Rolle";

  const aufgabenSatz: Record<string, string> = {
    "überwiegend operativ": `verbindet praktische Arbeit mit direkter Umsetzung im Tagesgeschäft`,
    "überwiegend systemisch": `verbindet praktische Arbeit mit strukturierter Planung und Steuerung`,
    "überwiegend strategisch": `ist geprägt durch Analyse, Planung und strategische Entscheidungen`,
    "Gemischt": `verbindet praktische Arbeit mit Analyse und Abstimmung im Team`,
  };

  const arbeitsSatz: Record<string, string> = {
    "Umsetzungsorientiert": `Aufgaben umzusetzen und konkrete Ergebnisse zu erreichen`,
    "Daten-/prozessorientiert": `Daten auszuwerten, Abläufe zu planen und systematisch vorzugehen`,
    "Menschenorientiert": `Abstimmung, Zusammenarbeit und Kommunikation im Team`,
    "Ausgewogen": `eine ausgewogene Verbindung verschiedener Arbeitsweisen`,
  };

  const arbeitsDetail: Record<string, [string, string]> = {
    "Umsetzungsorientiert": [
      "Die Rolle arbeitet stark praktisch und lösungsorientiert.",
      "Aufgaben werden direkt angegangen und in konkrete Ergebnisse überführt.",
    ],
    "Daten-/prozessorientiert": [
      "Die Arbeit basiert auf Daten, klaren Strukturen und systematischem Vorgehen.",
      "Entscheidungen werden analytisch vorbereitet und nachvollziehbar umgesetzt.",
    ],
    "Menschenorientiert": [
      "Kommunikation und Beziehungspflege stehen im Mittelpunkt der täglichen Arbeit.",
      "Ergebnisse entstehen durch Abstimmung, Vertrauen und Zusammenarbeit.",
    ],
    "Ausgewogen": [
      "Die Arbeitsweise verbindet Umsetzung, Analyse und Kommunikation.",
      "Flexibilität im Vorgehen ist entscheidend für den Erfolg.",
    ],
  };

  const fuehrungDetail: Record<string, string> = {
    "Keine": "Die Rolle arbeitet eigenverantwortlich ohne direkte Führung von Mitarbeitenden.",
    "Projekt-/Teamkoordination": "Die Rolle koordiniert Aufgaben und Projekte und sorgt für eine reibungslose Zusammenarbeit im Team.",
    "Fachliche Führung": "Die Rolle übernimmt fachliche Verantwortung im Team und stellt sicher, dass Arbeit und Qualität zuverlässig umgesetzt werden.",
    "Disziplinarische Führung mit Ergebnisverantwortung": "Die Rolle trägt Verantwortung für Mitarbeitende, deren Entwicklung und die Erreichung konkreter Ergebnisse.",
  };

  const fokusKurz: Record<string, string> = {
    "Ergebnisse und Zielerreichung": "konkreten Resultaten und messbarer Leistung",
    "Zusammenarbeit und Netzwerk": "einer guten Zusammenarbeit und stabilen Beziehungen",
    "Innovation und Weiterentwicklung": "neuen Ideen und kontinuierlicher Weiterentwicklung",
    "Prozesse und Effizienz": "stabilen Abläufen und effizienter Arbeit",
    "Fachliche Qualität und Expertise": "hoher fachlicher Qualität und Expertise",
    "Strategische Wirkung": "langfristiger Wirkung und strategischer Positionierung",
  };

  const aufgText = aufgabenSatz[aufgabencharakter] || "verbindet verschiedene Aufgabenbereiche";
  const arbText = arbeitsSatz[arbeitslogik] || "unterschiedliche Arbeitsweisen";
  const fokusTeile = fokusLabels.map(l => fokusKurz[l] || l.toLowerCase()).filter(Boolean);
  let fokusSatz = "";
  if (fokusTeile.length === 1) fokusSatz = `Der Erfolg dieser Rolle zeigt sich vor allem in ${fokusTeile[0]}.`;
  else if (fokusTeile.length === 2) fokusSatz = `Der Erfolg dieser Rolle zeigt sich vor allem in ${fokusTeile[0]} und ${fokusTeile[1]}.`;
  else if (fokusTeile.length > 2) fokusSatz = `Der Erfolg dieser Rolle zeigt sich vor allem in ${fokusTeile.slice(0, -1).join(", ")} und ${fokusTeile[fokusTeile.length - 1]}.`;

  const arbDetail = arbeitsDetail[arbeitslogik] || ["Die Arbeitsweise ist vielseitig und situationsabhängig.", ""];
  const fuehDetail = fuehrungDetail[fuehrung] || fuehrungOpt?.desc || "";

  const subHeadingIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="8" cy="8" r="8" fill="#34C759" />
      <path d="M5 8.2L7.2 10.4L11 5.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div
      data-testid="summary-bar"
      style={{
        background: "rgba(245,247,250,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 18,
        padding: "28px 28px 24px",
        marginTop: 32,
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, #34C759, #30B350)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(52,199,89,0.3)",
        }}>
          <CheckCircle2 style={{ width: 16, height: 16, color: "#fff", strokeWidth: 2.5 }} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.01em" }}>
          Zusammenfassung
        </span>
      </div>

      <p style={{ fontSize: 13.5, color: "#8E8E93", lineHeight: 1.6, margin: "0 0 8px" }}>
        So lässt sich die Rolle aktuell beschreiben:
      </p>
      <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.7, margin: "0 0 4px" }}>
        Die Rolle {rollenName} {aufgText}.
        {" "}Im Alltag geht es vor allem darum, {arbText}.
      </p>
      {fokusSatz && (
        <p style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.7, margin: "8px 0 0" }}>
          {fokusSatz}
        </p>
      )}

      <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 20, paddingTop: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {subHeadingIcon}
          <span style={{ fontSize: 15, fontWeight: 650, color: "#1D1D1F" }}>Arbeitsweise</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#3A3A3C", lineHeight: 1.5, margin: "0 0 4px" }}>
          {arbeitsOpt?.label}
        </p>
        <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.65, margin: 0 }}>
          {arbDetail[0]}
          {arbDetail[1] ? <><br />{arbDetail[1]}</> : null}
        </p>
      </div>

      <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {subHeadingIcon}
          <span style={{ fontSize: 15, fontWeight: 650, color: "#1D1D1F" }}>Führungsrolle</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#3A3A3C", lineHeight: 1.5, margin: "0 0 4px" }}>
          {fuehrungOpt?.label}
        </p>
        <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.65, margin: 0 }}>
          {fuehDetail}
        </p>
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
    const resetFlag = localStorage.getItem("rollenDnaReset");
    if (resetFlag) {
      localStorage.removeItem("rollenDnaReset");
      localStorage.removeItem("rollenDnaState");
      localStorage.removeItem("rollenDnaCompleted");
      localStorage.removeItem("kompetenzenCache");
      localStorage.removeItem("berichtCache");
      localStorage.removeItem("bioCheckTextOverride");
      localStorage.removeItem("bioCheckIntroOverride");
      localStorage.removeItem("bioCheckTextGenerated");
      localStorage.removeItem("analyseTexte");
      return null;
    }
    const raw = localStorage.getItem("rollenDnaState");
    if (raw) {
      const state = JSON.parse(raw);
      if ((!state.taetigkeiten || state.taetigkeiten.length === 0) && state.beruf) {
        try {
          const cached = localStorage.getItem("kompetenzenCache");
          if (cached) {
            const cacheData = JSON.parse(cached);
            if (cacheData.taetigkeiten && cacheData.taetigkeiten.length > 0) {
              state.taetigkeiten = cacheData.taetigkeiten;
              state.nextId = Math.max(...cacheData.taetigkeiten.map((t: any) => t.id)) + 1;
            }
          }
        } catch {}
      }
      if (state.taetigkeiten && state.taetigkeiten.length > 0) {
        state.allCollapsed = true;
        state.currentStep = 3;
      } else if (state.beruf && state.fuehrung && state.erfolgsfokusIndices?.length > 0 && state.aufgabencharakter && state.arbeitslogik) {
        state.currentStep = 3;
      }
      return state;
    }
  } catch {}
  return null;
}

export default function RollenDNA() {
  const [, setLocation] = useLocation();
  const saved = useRef(loadSavedState());

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [currentStep, setCurrentStep] = useState(saved.current?.currentStep ?? 1);
  const [allCollapsed, setAllCollapsed] = useState(saved.current?.allCollapsed ?? false);
  const [beruf, setBeruf] = useState(saved.current?.beruf ?? "");
  const [fuehrung, setFuehrung] = useState(saved.current?.fuehrung ?? "");
  const [erfolgsfokusIndices, setErfolgsfokusIndices] = useState<number[]>(saved.current?.erfolgsfokusIndices ?? []);
  const [showFuehrungInfo, setShowFuehrungInfo] = useState(false);
  const [aufgabencharakter, setAufgabencharakter] = useState(saved.current?.aufgabencharakter ?? "");
  const [arbeitslogik, setArbeitslogik] = useState(saved.current?.arbeitslogik ?? "");
  const [zusatzInfo, setZusatzInfo] = useState(saved.current?.zusatzInfo ?? "");

  const [activeTab, setActiveTab] = useState<TaetigkeitKategorie>(saved.current?.activeTab ?? "haupt");
  const [taetigkeiten, setTaetigkeiten] = useState<Taetigkeit[]>(saved.current?.taetigkeiten ?? []);
  const [nextId, setNextId] = useState(saved.current?.nextId ?? 1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalNames = useRef<Map<number, string>>(
    new Map(saved.current?.taetigkeiten?.map((t: Taetigkeit) => [t.id, t.name]) ?? [])
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [bioCheckOpen, setBioCheckOpen] = useState(false);
  const [bioCheckTextOverride, setBioCheckTextOverride] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem("bioCheckTextOverride");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const bioCheckIntroOverride = (() => {
    try {
      const raw = localStorage.getItem("bioCheckIntroOverride");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedLaender, setSelectedLaender] = useState<Set<BerufLand>>(new Set(["DE", "CH", "AT"]));
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (taetigkeiten.length > 0 && originalNames.current.size === 0) {
      originalNames.current = new Map(taetigkeiten.map(t => [t.id, t.name]));
    }
  }, []);

  useEffect(() => {
    const checkReset = () => {
      const resetFlag = localStorage.getItem("rollenDnaReset");
      if (resetFlag) {
        localStorage.removeItem("rollenDnaReset");
        localStorage.removeItem("rollenDnaState");
        localStorage.removeItem("rollenDnaCompleted");
        localStorage.removeItem("kompetenzenCache");
        localStorage.removeItem("berichtCache");
        localStorage.removeItem("bioCheckTextOverride");
        localStorage.removeItem("bioCheckIntroOverride");
        localStorage.removeItem("bioCheckTextGenerated");
        localStorage.removeItem("analyseTexte");
        setCurrentStep(1);
        setAllCollapsed(false);
        setBeruf("");
        setFuehrung("");
        setErfolgsfokusIndices([]);
        setAufgabencharakter("");
        setArbeitslogik("");
        setZusatzInfo("");
        setActiveTab("haupt");
        setTaetigkeiten([]);
        setNextId(1);
        setBioCheckTextOverride(null);
        originalNames.current = new Map();
        window.scrollTo(0, 0);
      }
    };
    checkReset();
    window.addEventListener("rollenDnaResetTriggered", checkReset);
    return () => window.removeEventListener("rollenDnaResetTriggered", checkReset);
  }, []);

  const toggleLand = (land: BerufLand) => {
    setSelectedLaender(prev => {
      const next = new Set(prev);
      if (next.has(land)) {
        if (next.size > 1) next.delete(land);
      } else {
        next.add(land);
      }
      return next;
    });
    setHighlightedIndex(-1);
  };

  const filteredBerufe = (() => {
    const q = beruf.trim().toLowerCase();
    if (q.length === 0) return [];
    const matches = BERUFE.filter(b => b.name.toLowerCase().includes(q) && selectedLaender.has(b.land));
    matches.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      const aExact = aLower === q;
      const bExact = bLower === q;
      if (aExact !== bExact) return aExact ? -1 : 1;
      const aStarts = aLower.startsWith(q);
      const bStarts = bLower.startsWith(q);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      const aIdx = aLower.indexOf(q);
      const bIdx = bLower.indexOf(q);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.name.length - b.name.length;
    });
    return matches.slice(0, 20);
  })();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      zusatzInfo,
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
        if (data.zusatzInfo !== undefined) setZusatzInfo(data.zusatzInfo);
        if (data.taetigkeiten !== undefined) setTaetigkeiten(data.taetigkeiten);
        if (data.nextId !== undefined) setNextId(data.nextId);
        setCurrentStep(3);
        setAllCollapsed(true);
        const loadedBeruf = data.beruf ?? beruf;
        const loadedFuehrung = data.fuehrung ?? fuehrung;
        const loadedErfolgsfokus = data.erfolgsfokusIndices ?? erfolgsfokusIndices;
        const loadedAufgaben = data.aufgabencharakter ?? aufgabencharakter;
        const loadedArbeits = data.arbeitslogik ?? arbeitslogik;
        const loadedZusatz = data.zusatzInfo ?? "";
        const loadedTaetigkeiten = data.taetigkeiten ?? taetigkeiten;
        originalNames.current = new Map(loadedTaetigkeiten.map((t: Taetigkeit) => [t.id, t.name]));
        const isComplete = !!(loadedBeruf && loadedFuehrung && loadedErfolgsfokus.length > 0 && loadedAufgaben && loadedArbeits && loadedTaetigkeiten.length > 0);
        if (isComplete) {
          localStorage.setItem("rollenDnaCompleted", "true");
        } else {
          localStorage.removeItem("rollenDnaCompleted");
        }

        if (loadedTaetigkeiten.length > 0) {
          const erfText = loadedErfolgsfokus
            .map((i: number) => ERFOLGSFOKUS_LABELS[i]?.replace(/\n/g, " "))
            .filter(Boolean)
            .join(", ");
          const cacheKey = JSON.stringify({
            beruf: loadedBeruf,
            fuehrung: loadedFuehrung,
            erfolgsfokus: erfText,
            aufgabencharakter: loadedAufgaben,
            arbeitslogik: loadedArbeits,
            zusatzInfo: loadedZusatz,
          });
          localStorage.setItem("kompetenzenCache", JSON.stringify({ key: cacheKey, taetigkeiten: loadedTaetigkeiten }));
        }
      } catch {
        alert("Die Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredTaetigkeiten = taetigkeiten.filter(t => t.kategorie === activeTab);
  const hauptCount = taetigkeiten.filter(t => t.kategorie === "haupt").length;
  const nebenCount = taetigkeiten.filter(t => t.kategorie === "neben").length;
  const fuehrungCount = taetigkeiten.filter(t => t.kategorie === "fuehrung").length;
  const highCount = taetigkeiten.filter(t => t.niveau === "Hoch").length;

  const bioGramHaupt = calcBioGram(taetigkeiten.filter(t => t.kategorie === "haupt"));
  const bioGramNeben = calcBioGram(taetigkeiten.filter(t => t.kategorie === "neben"));
  const bioGramFuehrung = calcBioGram(taetigkeiten.filter(t => t.kategorie === "fuehrung"));

  const bioGramRahmen = (() => {
    let sImp = 0, sInt = 0, sAna = 0;

    if (fuehrung === "Fachliche Führung") sAna += 1.0;
    else if (fuehrung === "Projekt-/Teamkoordination") sInt += 1.0;
    else if (fuehrung.startsWith("Disziplinarische")) sImp += 1.0;

    for (const idx of erfolgsfokusIndices) {
      if (idx === 0 || idx === 2) sImp += 1.0;
      else if (idx === 1 || idx === 5) sInt += 1.0;
      else if (idx === 3 || idx === 4) sAna += 1.0;
    }

    if (aufgabencharakter === "überwiegend operativ") sImp += 1.0;
    else if (aufgabencharakter === "überwiegend systemisch") sInt += 1.0;
    else if (aufgabencharakter === "überwiegend strategisch") sAna += 1.0;

    if (arbeitslogik === "Umsetzungsorientiert") sImp += 1.0;
    else if (arbeitslogik === "Menschenorientiert") sInt += 1.0;
    else if (arbeitslogik === "Daten-/prozessorientiert") sAna += 1.0;

    const total = sImp + sInt + sAna;
    if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 } as BioGram;
    const [imp, int, ana] = roundPercentages((sImp / total) * 100, (sInt / total) * 100, (sAna / total) * 100);
    return { imp, int, ana } as BioGram;
  })();

  const bioGramGesamt = (() => {
    const all = [bioGramHaupt, bioGramNeben, bioGramFuehrung, bioGramRahmen];
    let vals = [
      all.reduce((s, g) => s + g.imp, 0) / all.length,
      all.reduce((s, g) => s + g.int, 0) / all.length,
      all.reduce((s, g) => s + g.ana, 0) / all.length,
    ];
    const MAX = 67;
    const peak = Math.max(...vals);
    if (peak > MAX) {
      const scale = MAX / peak;
      vals = vals.map(v => v * scale);
    }
    const [imp, int, ana] = roundPercentages(vals[0], vals[1], vals[2]);
    return { imp, int, ana } as BioGram;
  })();

  useEffect(() => {
    const state = {
      currentStep, allCollapsed, beruf, fuehrung, erfolgsfokusIndices,
      aufgabencharakter, arbeitslogik, zusatzInfo, activeTab, taetigkeiten, nextId,
      bioGramGesamt: { imp: bioGramGesamt.imp, int: bioGramGesamt.int, ana: bioGramGesamt.ana },
      bioGramHaupt: { imp: bioGramHaupt.imp, int: bioGramHaupt.int, ana: bioGramHaupt.ana },
      bioGramNeben: { imp: bioGramNeben.imp, int: bioGramNeben.int, ana: bioGramNeben.ana },
      bioGramFuehrung: { imp: bioGramFuehrung.imp, int: bioGramFuehrung.int, ana: bioGramFuehrung.ana },
      bioGramRahmen: { imp: bioGramRahmen.imp, int: bioGramRahmen.int, ana: bioGramRahmen.ana },
    };
    localStorage.setItem("rollenDnaState", JSON.stringify(state));
  }, [currentStep, allCollapsed, beruf, fuehrung, erfolgsfokusIndices, aufgabencharakter, arbeitslogik, zusatzInfo, activeTab, taetigkeiten, nextId, bioGramGesamt, bioGramHaupt, bioGramNeben, bioGramFuehrung, bioGramRahmen]);

  const isLeadershipRole = fuehrung !== "Keine";
  const bioCheckTextGenerated = generateBioCheckText(bioGramGesamt, isLeadershipRole, isLeadershipRole ? bioGramFuehrung : undefined);
  const bioCheckText = bioCheckTextOverride ?? bioCheckTextGenerated;

  useEffect(() => {
    localStorage.setItem("bioCheckTextGenerated", JSON.stringify(bioCheckTextGenerated));
  }, [bioCheckTextGenerated]);

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

  const changedIds = taetigkeiten.filter(t => {
    const orig = originalNames.current.get(t.id);
    return orig !== undefined && orig !== t.name;
  }).map(t => t.id);

  const handleReclassify = async () => {
    const changed = taetigkeiten.filter(t => changedIds.includes(t.id));
    if (changed.length === 0) return;
    setIsReclassifying(true);
    try {
      const resp = await fetch("/api/reclassify-kompetenzen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beruf,
          fuehrung,
          aufgabencharakter,
          arbeitslogik,
          items: changed.map(t => ({ name: t.name, kategorie: t.kategorie })),
        }),
      });
      if (!resp.ok) throw new Error("Reclassify failed");
      const data = await resp.json();
      const results: { kompetenz?: KompetenzTyp }[] = data.results || [];
      setTaetigkeiten(prev => {
        const updated = [...prev];
        const validValues = ["Impulsiv", "Intuitiv", "Analytisch"];
        changed.forEach((t, i) => {
          let raw = results[i]?.kompetenz;
          if (!raw) return;
          let resolved: string | undefined;
          if (validValues.includes(raw)) {
            resolved = raw;
          } else if (raw.includes("|")) {
            resolved = raw.split("|").map((s: string) => s.trim()).find((s: string) => validValues.includes(s));
          }
          if (resolved) {
            const idx = updated.findIndex(u => u.id === t.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], kompetenz: resolved as KompetenzTyp };
            }
            originalNames.current.set(t.id, t.name);
          }
        });
        return updated;
      });
    } catch (err) {
      console.error("Neubewertung fehlgeschlagen:", err);
    } finally {
      setIsReclassifying(false);
    }
  };

  const handleAddTaetigkeit = () => {
    const newT: Taetigkeit = {
      id: nextId,
      name: "Neue Tätigkeit",
      kategorie: activeTab,
      kompetenz: "Analytisch",
      niveau: "Mittel",
    };
    originalNames.current.set(nextId, "Neue Tätigkeit");
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

  const buildCacheKey = () => {
    const erfolgsfokusText = erfolgsfokusIndices
      .map(i => ERFOLGSFOKUS_LABELS[i]?.replace(/\n/g, " "))
      .filter(Boolean)
      .join(", ");
    return JSON.stringify({ beruf, fuehrung, erfolgsfokus: erfolgsfokusText, aufgabencharakter, arbeitslogik, zusatzInfo });
  };

  const generateKompetenzen = async (forceRegenerate = false) => {
    if (!beruf) return;

    const cacheKey = buildCacheKey();

    if (!forceRegenerate) {
      try {
        const cached = localStorage.getItem("kompetenzenCache");
        if (cached) {
          const cacheData = JSON.parse(cached);
          if (cacheData.key === cacheKey && cacheData.taetigkeiten && cacheData.taetigkeiten.length > 0) {
            setTaetigkeiten(cacheData.taetigkeiten);
            setNextId(Math.max(...cacheData.taetigkeiten.map((t: Taetigkeit) => t.id)) + 1);
            originalNames.current = new Map(cacheData.taetigkeiten.map((t: Taetigkeit) => [t.id, t.name]));
            return;
          }
        }
      } catch {}
    }

    setIsGenerating(true);
    setGeneratingStep(0);
    try {
      const erfolgsfokusText = erfolgsfokusIndices
        .map(i => ERFOLGSFOKUS_LABELS[i]?.replace(/\n/g, " "))
        .filter(Boolean)
        .join(", ");
      let analyseTexte: { bereich1?: string; bereich2?: string; bereich3?: string } = {};
      try {
        const raw = localStorage.getItem("analyseTexte");
        if (raw) analyseTexte = JSON.parse(raw);
      } catch {}

      const stepTimer1 = setTimeout(() => setGeneratingStep(1), 2500);
      const stepTimer2 = setTimeout(() => setGeneratingStep(2), 5500);

      const resp = await fetch("/api/generate-kompetenzen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beruf, fuehrung, erfolgsfokus: erfolgsfokusText, aufgabencharakter, arbeitslogik, zusatzInfo, analyseTexte }),
      });
      if (!resp.ok) throw new Error("Fehler bei der Generierung");
      const data = await resp.json();

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setGeneratingStep(3);

      await new Promise(resolve => setTimeout(resolve, 600));

      let id = nextId;
      const generated: Taetigkeit[] = [];
      for (const item of data.haupt || []) {
        generated.push({ id: id++, name: item.name, kategorie: "haupt", kompetenz: item.kompetenz, niveau: item.niveau });
      }
      for (const item of data.neben || []) {
        generated.push({ id: id++, name: item.name, kategorie: "neben", kompetenz: item.kompetenz, niveau: item.niveau });
      }
      for (const item of data.fuehrung || []) {
        generated.push({ id: id++, name: item.name, kategorie: "fuehrung", kompetenz: item.kompetenz, niveau: item.niveau });
      }
      setTaetigkeiten(generated);
      setNextId(id);
      originalNames.current = new Map(generated.map(t => [t.id, t.name]));

      localStorage.setItem("kompetenzenCache", JSON.stringify({ key: cacheKey, taetigkeiten: generated }));
    } catch (err) {
      console.error("KI-Generierung fehlgeschlagen:", err);
    } finally {
      setIsGenerating(false);
      setGeneratingStep(0);
    }
  };

  const didAutoGenerate = useRef(false);
  useEffect(() => {
    if (!didAutoGenerate.current && currentStep === 3 && taetigkeiten.length === 0 && beruf && !isGenerating) {
      didAutoGenerate.current = true;
      generateKompetenzen();
    }
  });

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (step === 3 && currentStep === 2) {
      generateKompetenzen();
    }
  };

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
    <div className="min-h-screen relative">
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
          0% { opacity: 0.85; }
          50% { opacity: 1; }
          100% { opacity: 0.85; }
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
        <GlobalNav />
        <div style={{ position: "fixed", top: 56, left: 0, right: 0, zIndex: 8999 }}>
          <div className="dark:!bg-background/90 pb-2" style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(255,255,255,0.82)" }}>
            <div className="w-full mx-auto px-6" style={{ maxWidth: 1100 }}>
              <div className="text-center mt-2 mb-1">
                <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "#1D1D1F" }} data-testid="text-rollen-dna-title">
                  Rollen-DNA erfassen
                </h1>
                <p style={{ fontSize: 13, color: "#8E8E93", fontWeight: 450, margin: 0 }} data-testid="text-rollen-dna-subtitle">
                  Strukturprofil der Rolle definieren und Entscheidungsgrundlage erstellen.
                </p>
              </div>

            </div>
          </div>
        </div>

        <main className="flex-1 w-full mx-auto px-6 pb-20" style={{ maxWidth: 1100, paddingTop: allCollapsed ? 105 : 115, transition: "padding-top 300ms ease" }}>
          <div className="space-y-5">

            {allCollapsed ? null : currentStep === 1 ? (
              <Card className="bg-white/60 dark:bg-card/60 backdrop-blur-sm border-card-border animate-in fade-in slide-in-from-bottom-2 duration-400" style={{ overflow: "visible", position: "relative", zIndex: 100 }} data-testid="card-step-1">
                <div style={{ padding: "32px 32px 28px", overflow: "visible" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "#34C759", color: "#fff" }}>1</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>2</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>3</div>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em", margin: "0 0 8px" }} data-testid="text-step-1-title">
                    Welche Rolle möchten Sie analysieren?
                  </h2>
                  <p style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.6, margin: "0 0 28px" }}>
                    Geben Sie die Berufsbezeichnung oder Stellenbezeichnung ein, z.B. „Vertriebsleiter", „HR Business Partner" oder „Projektmanager IT".
                    <br />
                    Kein passender Vorschlag? Einfach ausschreiben – wir erkennen die Rolle automatisch.
                  </p>

                  <div className="mb-0" style={{ zIndex: 100 }} data-testid="input-beruf-wrapper">
                    <div className="relative" style={{ zIndex: 100 }}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 z-10" />
                      <Input
                        ref={inputRef}
                        type="text"
                        autoComplete="off"
                        placeholder="z.B. Key Account Manager, Teamleiter Produktion, ..."
                        value={beruf}
                        onChange={(e) => {
                          setBeruf(e.target.value);
                          setShowSuggestions(true);
                          setHighlightedIndex(-1);
                        }}
                        onFocus={() => { if (beruf.trim().length > 0) setShowSuggestions(true); }}
                        onKeyDown={(e) => {
                          if (!showSuggestions || filteredBerufe.length === 0) return;
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setHighlightedIndex(prev => Math.min(prev + 1, filteredBerufe.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setHighlightedIndex(prev => Math.max(prev - 1, 0));
                          } else if (e.key === "Enter" && highlightedIndex >= 0) {
                            e.preventDefault();
                            setBeruf(filteredBerufe[highlightedIndex].name);
                            setShowSuggestions(false);
                            setHighlightedIndex(-1);
                          } else if (e.key === "Escape") {
                            setShowSuggestions(false);
                          }
                        }}
                        className="pl-10 border-border/40 focus:border-primary/40 h-11 text-sm placeholder:text-muted-foreground/40"
                        style={{ background: "rgba(255, 248, 225, 0.5)" }}
                        data-testid="input-beruf"
                      />

                      {showSuggestions && filteredBerufe.length > 0 && (
                        <div
                          ref={suggestionsRef}
                          data-testid="beruf-suggestions"
                          className="bg-white dark:bg-card border border-border/20"
                          style={{
                            position: "absolute",
                            top: 52,
                            left: 0,
                            right: 0,
                            zIndex: 9999,
                            borderRadius: 14,
                            boxShadow: "0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ maxHeight: 480, overflowY: "auto" }}>
                            {filteredBerufe.map((b, idx) => {
                              const matchStart = b.name.toLowerCase().indexOf(beruf.toLowerCase());
                              const matchEnd = matchStart + beruf.length;
                              const katParts = b.kategorie ? b.kategorie.split(" > ") : [];
                              return (
                                <div
                                  key={b.name}
                                  data-testid={`suggestion-${idx}`}
                                  onClick={() => {
                                    setBeruf(b.name);
                                    setShowSuggestions(false);
                                    setHighlightedIndex(-1);
                                  }}
                                  onMouseEnter={() => setHighlightedIndex(idx)}
                                  style={{
                                    padding: "16px 20px",
                                    cursor: "pointer",
                                    background: idx === highlightedIndex ? "rgba(0,113,227,0.05)" : "transparent",
                                    borderBottom: idx < filteredBerufe.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                                    transition: "background 0.15s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                  }}
                                >
                                  <div style={{
                                    width: 42, height: 42, borderRadius: 10,
                                    background: "rgba(0,0,0,0.035)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                  }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                      <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.35, color: "#1D1D1F" }}>
                                      {matchStart >= 0 ? (
                                        <>
                                          {b.name.slice(0, matchStart)}
                                          <span style={{ color: "#0071E3" }}>{b.name.slice(matchStart, matchEnd)}</span>
                                          {b.name.slice(matchEnd)}
                                        </>
                                      ) : b.name}
                                    </div>
                                    <div style={{ fontSize: 13, color: "#8E8E93", marginTop: 4, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 4 }}>
                                      {katParts.length > 1 ? (
                                        <>
                                          <span>{katParts[0]}</span>
                                          <span style={{ color: "#CACACA" }}>›</span>
                                          <span>{katParts.slice(1).join(" › ")}</span>
                                        </>
                                      ) : b.kategorie}
                                    </div>
                                  </div>
                                  <div style={{ color: "rgba(0,0,0,0.15)", flexShrink: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="9 18 15 12 9 6"/>
                                    </svg>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>


                    <div style={{ marginTop: 28 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: "#6E6E73", margin: "0 0 2px" }}>Arbeitsmarkt</p>
                      <p style={{ fontSize: 12, color: "#AEAEB2", margin: "0 0 8px" }}>
                        Vorschläge werden für die aktiven Länder angezeigt. Zum Ein- oder Ausschalten einfach klicken.
                      </p>
                      <div className="flex items-center gap-2" data-testid="land-filter">
                        {([
                          { land: "DE" as BerufLand, label: "DE", flag: (<svg viewBox="0 0 20 14" className="w-4 h-3 rounded-[2px] overflow-hidden"><rect y="0" width="20" height="4.67" fill="#000"/><rect y="4.67" width="20" height="4.67" fill="#D00"/><rect y="9.33" width="20" height="4.67" fill="#FFCE00"/></svg>) },
                          { land: "CH" as BerufLand, label: "CH", flag: (<svg viewBox="0 0 20 14" className="w-4 h-3 rounded-[2px] overflow-hidden"><rect width="20" height="14" fill="#D52B1E"/><rect x="8" y="2.5" width="4" height="9" fill="#FFF"/><rect x="5.5" y="5" width="9" height="4" fill="#FFF"/></svg>) },
                          { land: "AT" as BerufLand, label: "AT", flag: (<svg viewBox="0 0 20 14" className="w-4 h-3 rounded-[2px] overflow-hidden"><rect y="0" width="20" height="4.67" fill="#ED2939"/><rect y="4.67" width="20" height="4.67" fill="#FFF"/><rect y="9.33" width="20" height="4.67" fill="#ED2939"/></svg>) },
                        ]).map(({ land, label, flag }) => {
                          const active = selectedLaender.has(land);
                          return (
                            <button
                              key={land}
                              type="button"
                              data-testid={`filter-${land.toLowerCase()}`}
                              onClick={() => toggleLand(land)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                                cursor: "pointer", transition: "all 200ms ease",
                                border: active ? "2px solid #0071E3" : "1.5px solid rgba(0,0,0,0.08)",
                                background: active ? "rgba(0,113,227,0.10)" : "rgba(0,0,0,0.02)",
                                color: active ? "#0071E3" : "#AEAEB2",
                                boxShadow: active ? "0 2px 8px rgba(0,113,227,0.15)" : "none",
                              }}
                            >
                              <span style={{ opacity: active ? 1 : 0.35, transition: "opacity 200ms ease" }}>{flag}</span>
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: 32, borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 24 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: "0 0 6px" }}>Optionale Ergänzungen</p>
                      <p style={{ fontSize: 12.5, color: "#AEAEB2", margin: "0 0 12px" }}>
                        Was macht diese Rolle in Ihrem Unternehmen besonders? Je konkreter, desto genauer die Analyse.
                      </p>
                      <textarea
                        value={zusatzInfo}
                        onChange={(e) => setZusatzInfo(e.target.value)}
                        placeholder="z.B. Schwerpunkt Key Account, hoher Reiseanteil, Schichtmodell, Branche Pharma, ..."
                        className="w-full border border-border/40 focus:border-primary/40 rounded-lg px-3 py-2 text-sm resize-none placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                        style={{ background: "rgba(255, 248, 225, 0.5)" }}
                        rows={2}
                        data-testid="input-zusatzinfo"
                      />
                    </div>

                  </div>

                  <div className="flex justify-end" style={{ marginTop: 24 }}>
                    <Button
                      disabled={!step1Valid}
                      onClick={() => goToStep(2)}
                      className="gap-2"
                      style={{
                        height: 48,
                        paddingLeft: 28,
                        paddingRight: 28,
                        fontSize: 15,
                        fontWeight: 600,
                        borderRadius: 14,
                        background: step1Valid ? "linear-gradient(135deg, #0071E3, #34AADC)" : undefined,
                        border: "none",
                        boxShadow: step1Valid ? "0 4px 16px rgba(0,113,227,0.3)" : undefined,
                      }}
                      data-testid="button-step-1-weiter"
                    >
                      Rolle analysieren
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <CollapsedStep
                step={1}
                title="Ausgewählte Rolle"
                summary={beruf}
                onEdit={() => goToStep(1)}
              />
            )}

            {allCollapsed ? null : currentStep === 2 ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400" data-testid="card-step-2">
                <div className="mb-6">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>✓</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "#34C759", color: "#fff" }}>2</div>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>3</div>
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }} className="dark:text-foreground/90" data-testid="text-step-2-title">
                    Rahmenbedingungen der Rolle
                  </h2>
                  <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6 }}>
                    Definieren Sie die grundlegenden Merkmale dieser Position. Die Angaben helfen dabei, die strukturelle Rollenlogik zu bestimmen.
                  </p>
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
                      <div data-testid="section-aufgabencharakter" className="relative">
                        <SectionNumber num={1} isComplete={aufgabencharakter.length > 0} />
                        <div className="flex items-center gap-3">
                          <Layers style={{ width: 20, height: 20, color: "#6E6E73", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#1D1D1F" }} className="dark:text-foreground/90">
                            Art der Aufgaben
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, paddingLeft: 32 }}>
                          {SECTION_SUBTITLES.aufgabencharakter}
                        </p>
                        <div style={{ marginTop: 20 }}>
                          <DescriptiveOptionGroup
                            options={AUFGABENCHARAKTER_OPTIONS}
                            selectedValue={aufgabencharakter}
                            onSelect={handleAufgabencharakter}
                          />
                        </div>
                      </div>
                    </FadeInSection>

                    <SectionDivider />

                    <FadeInSection delay={100}>
                      <div data-testid="section-arbeitslogik" className="relative">
                        <SectionNumber num={2} isComplete={arbeitslogik.length > 0} />
                        <div className="flex items-center gap-3">
                          <Activity style={{ width: 20, height: 20, color: "#6E6E73", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#1D1D1F" }} className="dark:text-foreground/90">
                            Arbeitsweise der Rolle
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, paddingLeft: 32 }}>
                          {SECTION_SUBTITLES.arbeitslogik}
                        </p>
                        <div style={{ marginTop: 20 }}>
                          <DescriptiveOptionGroup
                            options={ARBEITSLOGIK_OPTIONS}
                            selectedValue={arbeitslogik}
                            onSelect={handleArbeitslogik}
                          />
                        </div>
                      </div>
                    </FadeInSection>

                    <SectionDivider />

                    <FadeInSection delay={200}>
                      <div data-testid="section-erfolgsfokus" className="relative">
                        <SectionNumber num={3} isComplete={erfolgsfokusIndices.length > 0} />
                        <div className="flex items-center gap-3">
                          <Target style={{ width: 20, height: 20, color: "#6E6E73", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#1D1D1F" }} className="dark:text-foreground/90">
                            Erfolgsfokus
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, paddingLeft: 32 }}>
                          {SECTION_SUBTITLES.erfolgsfokus}
                        </p>
                        <div style={{ marginTop: 20 }}>
                          <DescriptiveOptionGroupIndexed
                            options={ERFOLGSFOKUS_DISPLAY}
                            selectedIndices={erfolgsfokusIndices}
                            onSelectIndex={handleErfolgsfokus}
                          />
                        </div>
                      </div>
                    </FadeInSection>

                    <SectionDivider />

                    <FadeInSection delay={300}>
                      <div data-testid="section-fuehrung" className="relative">
                        <SectionNumber num={4} isComplete={fuehrung.length > 0} />
                        <div className="flex items-center gap-3">
                          <Users style={{ width: 20, height: 20, color: "#6E6E73", strokeWidth: 1.5 }} />
                          <h3 style={{ fontSize: 22, fontWeight: 600, color: "#1D1D1F" }} className="dark:text-foreground/90">
                            Führungsverantwortung
                          </h3>
                        </div>
                        <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 6, paddingLeft: 32 }}>
                          {SECTION_SUBTITLES.fuehrung}
                        </p>
                        <div style={{ marginTop: 20 }}>
                          <DescriptiveOptionGroup
                            options={FUEHRUNG_OPTIONS}
                            selectedValue={fuehrung}
                            onSelect={handleFuehrung}
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
                        beruf={beruf}
                        fuehrung={fuehrung}
                        erfolgsfokusIndices={erfolgsfokusIndices}
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
                summary={`${AUFGABENCHARAKTER_OPTIONS.find(o => o.value === aufgabencharakter)?.label || aufgabencharakter} · ${ARBEITSLOGIK_OPTIONS.find(o => o.value === arbeitslogik)?.label || arbeitslogik} · ${erfolgsfokusIndices.map(i => ERFOLGSFOKUS_DISPLAY[i]?.label).filter(Boolean).join(", ")} · ${FUEHRUNG_OPTIONS.find(o => o.value === fuehrung)?.label || fuehrung}`}
                onEdit={() => goToStep(2)}
              />
            ) : (
              <LockedStep step={2} title="Rahmenbedingungen der Rolle" />
            )}

            {allCollapsed ? null : currentStep === 3 ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400" data-testid="card-step-3">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>✓</div>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.06)", color: "#AEAEB2" }}>✓</div>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "#34C759", color: "#fff" }}>3</div>
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }} className="dark:text-foreground/90" data-testid="text-step-3-title">
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0,
                      background: "rgba(0,0,0,0.04)",
                      borderRadius: 12,
                      padding: 3,
                      marginBottom: 28,
                    }}
                    data-testid="tabs-taetigkeiten"
                  >
                    {([
                      { key: "haupt" as TaetigkeitKategorie, label: "Tätigkeiten", count: hauptCount },
                      { key: "neben" as TaetigkeitKategorie, label: "Humankompetenzen", count: nebenCount },
                      ...(fuehrung !== "Keine" ? [{ key: "fuehrung" as TaetigkeitKategorie, label: "Führungskompetenzen", count: fuehrungCount }] : []),
                    ]).map(tab => {
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          style={{
                            flex: 1,
                            height: 38,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 13,
                            fontWeight: isActive ? 650 : 500,
                            borderRadius: 10,
                            border: "none",
                            cursor: "pointer",
                            transition: "background 200ms ease, color 200ms ease",
                            background: isActive ? "rgba(0,113,227,0.08)" : "transparent",
                            color: isActive ? "#0071E3" : "#8E8E93",
                            boxShadow: "none",
                          }}
                          data-testid={`tab-${tab.key}`}
                        >
                          {tab.label}
                          {tab.count > 0 && (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              minWidth: 20,
                              height: 20,
                              borderRadius: 10,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 5px",
                              background: isActive ? "rgba(0,113,227,0.12)" : "rgba(0,0,0,0.06)",
                              color: isActive ? "#0071E3" : "#AEAEB2",
                            }}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    {isGenerating ? (
                      <div className="text-center py-16" data-testid="loading-ki">
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
                          KI erstellt Kompetenzprofil für „{beruf}“
                        </p>
                        <p style={{ fontSize: 13, color: "#8E8E93", marginTop: 4, marginBottom: 20 }}>
                          Das kann einige Sekunden dauern.
                        </p>
                        <div style={{ display: "inline-flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
                          {[
                            { label: "Tätigkeiten werden erstellt", step: 0 },
                            { label: "Humankompetenzen werden ermittelt", step: 1 },
                            { label: "Führungskompetenzen werden analysiert", step: 2 },
                          ].map((item) => {
                            const done = generatingStep > item.step;
                            const active = generatingStep === item.step;
                            return (
                              <div
                                key={item.step}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  opacity: active || done ? 1 : 0.35,
                                  transition: "opacity 400ms ease",
                                }}
                                data-testid={`loading-step-${item.step}`}
                              >
                                <div style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: done ? "#34C759" : "transparent",
                                  border: done ? "none" : active ? "2px solid #0071E3" : "2px solid #D1D1D6",
                                  transition: "all 300ms ease",
                                  flexShrink: 0,
                                }}>
                                  {done ? (
                                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                      <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  ) : active ? (
                                    <div style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      border: "2px solid #0071E3",
                                      borderTopColor: "transparent",
                                      animation: "spin 0.7s linear infinite",
                                    }} />
                                  ) : null}
                                </div>
                                <span style={{
                                  fontSize: 14,
                                  fontWeight: active ? 500 : 400,
                                  color: done ? "#34C759" : active ? "#1D1D1F" : "#8E8E93",
                                  transition: "color 300ms ease",
                                }}>
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      </div>
                    ) : filteredTaetigkeiten.length === 0 ? (
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
                              color: changedIds.includes(t.id) ? "#D97706" : "#AEAEB2",
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
                                    {NIVEAU_OPTIONS.map(n => (
                                      <button
                                        key={n}
                                        onClick={() => handleNiveauChange(t.id, n)}
                                        style={{
                                          height: 28,
                                          paddingLeft: 10,
                                          paddingRight: 10,
                                          fontSize: 12,
                                          fontWeight: 500,
                                          borderRadius: 999,
                                          border: t.niveau === n ? "1.5px solid transparent" : "1px solid rgba(0,0,0,0.15)",
                                          cursor: "pointer",
                                          transition: "all 150ms ease",
                                          background: t.niveau === n ? "linear-gradient(135deg, #6B7280, #9CA3AF)" : "rgba(0,0,0,0.03)",
                                          color: t.niveau === n ? "#FFFFFF" : "#3A3A3C",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4,
                                        }}
                                        className={t.niveau !== n ? "hover:bg-muted/40" : ""}
                                        data-testid={`niveau-${t.id}-${n.toLowerCase()}`}
                                      >
                                        {t.niveau === n && <Check style={{ width: 10, height: 10 }} />}
                                        {n}
                                      </button>
                                    ))}
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
                  </p>
                </div>

                <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
                  <div>
                    {changedIds.length > 0 && (
                      <button
                        onClick={handleReclassify}
                        disabled={isReclassifying}
                        className="flex items-center gap-2 text-sm font-medium transition-all"
                        style={{
                          height: 44,
                          paddingLeft: 20,
                          paddingRight: 20,
                          borderRadius: 12,
                          border: "1.5px solid rgba(243,146,0,0.4)",
                          background: "rgba(243,146,0,0.06)",
                          color: "#D97706",
                          cursor: isReclassifying ? "wait" : "pointer",
                          opacity: isReclassifying ? 0.7 : 1,
                        }}
                        data-testid="button-reclassify"
                      >
                        <RefreshCw className={`w-4 h-4 ${isReclassifying ? "animate-spin" : ""}`} />
                        {isReclassifying
                          ? "Wird bewertet..."
                          : `Änderungen neu bewerten (${changedIds.length})`
                        }
                      </button>
                    )}
                  </div>
                  {(() => {
                    const isIncomplete = !beruf || !fuehrung || erfolgsfokusIndices.length === 0 || !aufgabencharakter || !arbeitslogik || taetigkeiten.length === 0;
                    return (
                      <Button
                        className="gap-2"
                        disabled={isIncomplete}
                        style={{
                          height: 52,
                          paddingLeft: 32,
                          paddingRight: 32,
                          fontSize: 16,
                          fontWeight: 600,
                          borderRadius: 14,
                          background: isIncomplete ? "rgba(0,0,0,0.08)" : "linear-gradient(135deg, #0071E3, #34AADC)",
                          border: "none",
                          boxShadow: isIncomplete ? "none" : "0 4px 16px rgba(0,113,227,0.3)",
                          color: isIncomplete ? "rgba(0,0,0,0.25)" : "#fff",
                          cursor: isIncomplete ? "not-allowed" : "pointer",
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
                    );
                  })()}
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderRadius: 20,
                    padding: "28px 32px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.04)",
                    marginTop: 28,
                  }}
                  data-testid="card-biocheck"
                >
                  <button
                    onClick={() => setBioCheckOpen(!bioCheckOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    data-testid="button-biocheck-toggle"
                  >
                    <div className="flex items-center gap-2.5">
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #0071E3, #34AADC)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" />
                          <circle cx="8" cy="8" r="2.5" fill="white" />
                        </svg>
                      </div>
                      <span style={{ color: "#1D1D1F", display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 700, flexShrink: 0 }}>Kurzanalyse der Rolle:</span>
                        <span style={{ fontSize: 16 }}>{beruf}{fuehrung && fuehrung !== "Keine" ? " mit Führungsverantwortung" : ""}</span>
                      </span>
                    </div>
                    <ChevronDown style={{
                      width: 18,
                      height: 18,
                      color: "#8E8E93",
                      transform: bioCheckOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 300ms ease",
                    }} />
                  </button>

                  {bioCheckOpen && (<>
                    {bioCheckIntroOverride ? (
                      <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.8, marginTop: 14, whiteSpace: "pre-line" }} data-testid="text-biocheck-intro">
                        {bioCheckIntroOverride}
                      </p>
                    ) : (<>
                      <div style={{
                        marginTop: 16,
                        padding: "16px 18px",
                        borderRadius: 14,
                        background: "rgba(0,0,0,0.02)",
                        border: "1px solid rgba(0,0,0,0.04)",
                      }} data-testid="card-grundprinzip">
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0" }}>{analysisPrincipleText.title}</h3>
                        {analysisPrincipleText.body.map((line, i) => (
                          <p key={i} style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.7, margin: i === 0 ? 0 : "6px 0 0 0" }}>{line}</p>
                        ))}
                      </div>

                      <div style={{ marginTop: 14 }} data-testid="card-anforderungsprofil">
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0" }}>Anforderungsprofil der Rolle</h3>
                        <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.7, margin: "0 0 14px 0" }}>
                          {roleRequirementText.intro.join(" ")}
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                          {[
                            { label: "Impulsiv", color: "#C41E3A", bg: "rgba(196,30,58,0.05)", border: "rgba(196,30,58,0.12)", desc: "Umsetzung, Entscheidung und Ergebnisverantwortung" },
                            { label: "Intuitiv", color: "#F39200", bg: "rgba(243,146,0,0.05)", border: "rgba(243,146,0,0.12)", desc: "Zusammenarbeit und kontextbezogenes Handeln" },
                            { label: "Analytisch", color: "#1A5DAB", bg: "rgba(26,93,171,0.05)", border: "rgba(26,93,171,0.12)", desc: "Struktur, Planung und fachliche Präzision" },
                          ].map(d => (
                            <div key={d.label} style={{
                              background: d.bg,
                              border: `1px solid ${d.border}`,
                              borderRadius: 10,
                              padding: "10px 12px",
                            }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: d.color, margin: "0 0 4px 0" }}>{d.label}</p>
                              <p style={{ fontSize: 11, color: "#6E6E73", lineHeight: 1.5, margin: 0 }}>{d.desc}</p>
                            </div>
                          ))}
                        </div>

                      </div>
                    </>)}

                    {(() => {
                      const analysis = getRoleAnalysis(bioGramGesamt.imp, bioGramGesamt.int, bioGramGesamt.ana);
                      const rt = roleResultTexts[analysis.resultKey];
                      return (
                        <div style={{
                          marginTop: 18,
                          padding: "16px 18px",
                          borderRadius: 14,
                          background: "rgba(0,0,0,0.02)",
                          border: "1px solid rgba(0,0,0,0.04)",
                        }} data-testid="box-biocheck-description">
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%",
                              background: "linear-gradient(135deg, rgba(0,113,227,0.12), rgba(52,170,220,0.12))",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              <Lightbulb size={14} style={{ color: "#0071E3" }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.04em" }}>Ergebnis der Analyse</span>
                          </div>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px 0" }} data-testid="text-biocheck-line-0">{rt.headline}</h3>
                          <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.7, margin: "0 0 6px 0" }} data-testid="text-biocheck-line-1">{rt.summary}</p>
                          <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.7, margin: "0 0 6px 0" }} data-testid="text-biocheck-line-2">{rt.focus}</p>
                          <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.7, margin: 0 }} data-testid="text-biocheck-line-3">{rt.transfer}</p>
                          {isLeadershipRole && (
                            <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.7, margin: "6px 0 0 0" }} data-testid="text-biocheck-line-4">{rt.leadership}</p>
                          )}
                        </div>
                      );
                    })()}

                    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {[
                        { title: "Tätigkeiten", key: "haupttaetigkeiten", data: bioGramHaupt, icon: Briefcase },
                        { title: "Humankompetenzen", key: "humankompetenzen", data: bioGramNeben, icon: Heart },
                        { title: "Rahmenbedingungen der Stelle", key: "rahmenbedingungen", data: bioGramRahmen, icon: Settings },
                        ...(isLeadershipRole ? [{ title: "Führungskompetenzen", key: "fuehrungskompetenzen", data: bioGramFuehrung, icon: Shield }] : []),
                      ].map((section) => (
                        <div
                          key={section.key}
                          style={{
                            background: "rgba(0,0,0,0.02)",
                            borderRadius: 14,
                            padding: "16px 18px",
                            border: "1px solid rgba(0,0,0,0.04)",
                          }}
                          data-testid={`biocheck-section-${section.key}`}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <section.icon style={{ width: 15, height: 15, color: "#6E6E73", strokeWidth: 1.8 }} />
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                              {section.title}
                            </p>
                          </div>
                          {[
                            { label: "Impulsiv", color: "#C41E3A", value: section.data.imp },
                            { label: "Intuitiv", color: "#F39200", value: section.data.int },
                            { label: "Analytisch", color: "#1A5DAB", value: section.data.ana },
                          ].map((bar) => (
                            <div
                              key={bar.label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                              }}
                            >
                              <span style={{
                                fontSize: 12,
                                color: "#6E6E73",
                                width: 62,
                                flexShrink: 0,
                              }}>
                                {bar.label}
                              </span>
                              <div style={{
                                flex: 1,
                                height: 24,
                                borderRadius: 6,
                                background: "rgba(0,0,0,0.04)",
                                overflow: "hidden",
                                position: "relative",
                              }}>
                                <div style={{
                                  width: bar.value === 0 ? "0%" : `${Math.max(bar.value, 2)}%`,
                                  height: "100%",
                                  borderRadius: 6,
                                  background: bar.color,
                                  transition: "width 600ms ease",
                                  display: "flex",
                                  alignItems: "center",
                                  paddingLeft: 8,
                                  minWidth: bar.value === 0 ? 0 : 40,
                                }}>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {Math.round(bar.value)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        background: "rgba(0,0,0,0.02)",
                        borderRadius: 14,
                        padding: "16px 18px",
                        border: "1px solid rgba(0,0,0,0.04)",
                        marginTop: 16,
                      }}
                      data-testid="biocheck-section-gesamt"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <BarChart3 style={{ width: 16, height: 16, color: "#6E6E73", strokeWidth: 1.8 }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                          Gesamtprofil der Stellenanforderung
                        </p>
                      </div>
                      {(() => {
                        const bars = [
                          { label: "Impulsiv", color: "#C41E3A", value: bioGramGesamt.imp },
                          { label: "Intuitiv", color: "#F39200", value: bioGramGesamt.int },
                          { label: "Analytisch", color: "#1A5DAB", value: bioGramGesamt.ana },
                        ];
                        return bars.map((bar) => {
                          const widthPct = (bar.value / 67) * 100;
                          return (
                            <div
                              key={bar.label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                              }}
                            >
                              <span style={{ fontSize: 12, color: "#6E6E73", width: 62, flexShrink: 0 }}>
                                {bar.label}
                              </span>
                              <div style={{
                                flex: 1,
                                height: 28,
                                borderRadius: 6,
                                background: "rgba(0,0,0,0.04)",
                                overflow: "hidden",
                                position: "relative",
                              }}>
                                <div style={{
                                  width: bar.value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 3), 100)}%`,
                                  height: "100%",
                                  borderRadius: 6,
                                  background: bar.color,
                                  transition: "width 600ms ease",
                                  display: "flex",
                                  alignItems: "center",
                                  paddingLeft: 8,
                                  minWidth: bar.value === 0 ? 0 : 40,
                                }}>
                                  <span style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {Math.round(bar.value)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>)}
                </div>
              </div>
            ) : (
              <LockedStep step={3} title="Tätigkeiten & Kompetenzen" />
            )}

            {allCollapsed && (
              <>
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
                <button
                  onClick={() => setSummaryOpen(!summaryOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: summaryOpen ? 16 : 0,
                  }}
                  data-testid="button-summary-toggle"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 style={{ width: 24, height: 24, color: "#34C759" }} />
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Datenerfassung abgeschlossen</h3>
                  </div>
                  <ChevronDown style={{
                    width: 18,
                    height: 18,
                    color: "#8E8E93",
                    transform: summaryOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 300ms ease",
                  }} />
                </button>

                {summaryOpen && (
                  <>
                <p style={{ fontSize: 13, color: "#8E8E93", margin: "0 0 16px 0" }}>Das Rollenprofil wurde erfolgreich erstellt.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} data-testid="dna-summary-grid">
                  {[
                    { icon: Briefcase, label: "Rolle", value: beruf },
                    { icon: LayoutGrid, label: "Aufgabenstruktur", value: AUFGABENCHARAKTER_OPTIONS.find(o => o.value === aufgabencharakter)?.label || aufgabencharakter },
                    { icon: Wrench, label: "Arbeitsweise", value: ARBEITSLOGIK_OPTIONS.find(o => o.value === arbeitslogik)?.label || arbeitslogik },
                    { icon: Target, label: "Erfolgsfokus", value: erfolgsfokusIndices.map(i => ERFOLGSFOKUS_DISPLAY[i]?.label).filter(Boolean).join(", ") },
                    { icon: UserCheck, label: "Führung", value: FUEHRUNG_OPTIONS.find(o => o.value === fuehrung)?.label || fuehrung },
                  ].map(card => (
                    <div
                      key={card.label}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: "rgba(0,0,0,0.02)",
                        border: "1px solid rgba(0,0,0,0.04)",
                      }}
                      data-testid={`summary-${card.label.toLowerCase()}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                        <card.icon style={{ width: 14, height: 14, color: "#8E8E93", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 650, color: "#1D1D1F" }}>{card.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#6E6E73", margin: 0, lineHeight: 1.5, paddingLeft: 21 }}>{card.value}</p>
                    </div>
                  ))}
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid rgba(0,0,0,0.04)",
                    }}
                    data-testid="summary-kompetenzanzahl"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <Hash style={{ width: 14, height: 14, color: "#8E8E93", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 650, color: "#1D1D1F" }}>Tätigkeits-/Kompetenzanzahl</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, paddingLeft: 21, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#6E6E73" }}><strong style={{ color: "#1D1D1F" }}>{hauptCount}</strong> Tätigkeiten</span>
                      <span style={{ fontSize: 12, color: "#6E6E73" }}><strong style={{ color: "#1D1D1F" }}>{nebenCount}</strong> Humankompetenzen</span>
                      {fuehrung !== "Keine" && <span style={{ fontSize: 12, color: "#6E6E73" }}><strong style={{ color: "#1D1D1F" }}>{fuehrungCount}</strong> Führung</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
                  <button
                    onClick={() => {
                      setAllCollapsed(false);
                      localStorage.removeItem("rollenDnaCompleted");
                    }}
                    style={{
                      height: 48,
                      paddingLeft: 20,
                      paddingRight: 20,
                      fontSize: 14,
                      fontWeight: 500,
                      borderRadius: 14,
                      border: "none",
                      cursor: "pointer",
                      background: "transparent",
                      color: "#6E6E73",
                      transition: "all 200ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#1D1D1F";
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#6E6E73";
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                    data-testid="button-rolle-bearbeiten"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Datenerfassung bearbeiten
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      height: 48,
                      paddingLeft: 24,
                      paddingRight: 24,
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 14,
                      border: "1.5px solid #0071E3",
                      cursor: "pointer",
                      background: "transparent",
                      color: "#0071E3",
                      transition: "all 200ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      justifyContent: "center",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,113,227,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }}
                    data-testid="button-profil-speichern"
                  >
                    <Save className="w-4 h-4" />
                    Profil speichern
                  </button>
                  <button
                    onClick={() => setLocation("/bericht")}
                    style={{
                      height: 48,
                      paddingLeft: 28,
                      paddingRight: 28,
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 14,
                      border: "none",
                      cursor: "pointer",
                      background: "linear-gradient(135deg, #0071E3, #34AADC)",
                      color: "#FFFFFF",
                      boxShadow: "0 4px 16px rgba(0,113,227,0.3)",
                      transition: "all 200ms ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      justifyContent: "center",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,113,227,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,113,227,0.3)";
                    }}
                    data-testid="button-entscheidungsbericht"
                  >
                    <FileText className="w-4 h-4" />
                    Entscheidungsbericht erstellen
                  </button>
                </div>
                  </>
                )}
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderRadius: 20,
                  padding: "28px 32px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.04)",
                  marginTop: 24,
                }}
                data-testid="card-biocheck-collapsed"
              >
                <button
                  onClick={() => setBioCheckOpen(!bioCheckOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  data-testid="button-biocheck-collapsed-toggle"
                >
                  <div className="flex items-center gap-2.5">
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0071E3, #34AADC)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5" />
                        <circle cx="8" cy="8" r="2.5" fill="white" />
                      </svg>
                    </div>
                    <span style={{ color: "#1D1D1F", display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, flexShrink: 0 }}>Kurzanalyse der Rolle:</span>
                      <span style={{ fontSize: 16 }}>{beruf}{fuehrung && fuehrung !== "Keine" ? " mit Führungsverantwortung" : ""}</span>
                    </span>
                  </div>
                  <ChevronDown style={{
                    width: 18,
                    height: 18,
                    color: "#8E8E93",
                    transform: bioCheckOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 300ms ease",
                  }} />
                </button>

                {bioCheckOpen && (<>
                  {bioCheckIntroOverride ? (
                    <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.8, marginTop: 14, whiteSpace: "pre-line" }} data-testid="text-biocheck-intro-collapsed">
                      {bioCheckIntroOverride}
                    </p>
                  ) : (<>
                    <div style={{
                      marginTop: 16,
                      padding: "16px 18px",
                      borderRadius: 14,
                      background: "rgba(0,0,0,0.02)",
                      border: "1px solid rgba(0,0,0,0.04)",
                    }} data-testid="card-grundprinzip-collapsed">
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0" }}>{analysisPrincipleText.title}</h3>
                      {analysisPrincipleText.body.map((line, i) => (
                        <p key={i} style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.7, margin: i === 0 ? 0 : "6px 0 0 0" }}>{line}</p>
                      ))}
                    </div>

                    <div style={{ marginTop: 14 }} data-testid="card-anforderungsprofil-collapsed">
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px 0" }}>Anforderungsprofil der Rolle</h3>
                      <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.7, margin: "0 0 14px 0" }}>
                        {roleRequirementText.intro.join(" ")}
                      </p>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        {[
                          { label: "Impulsiv", color: "#C41E3A", bg: "rgba(196,30,58,0.05)", border: "rgba(196,30,58,0.12)", desc: "Umsetzung, Entscheidung und Ergebnisverantwortung" },
                          { label: "Intuitiv", color: "#F39200", bg: "rgba(243,146,0,0.05)", border: "rgba(243,146,0,0.12)", desc: "Zusammenarbeit und kontextbezogenes Handeln" },
                          { label: "Analytisch", color: "#1A5DAB", bg: "rgba(26,93,171,0.05)", border: "rgba(26,93,171,0.12)", desc: "Struktur, Planung und fachliche Präzision" },
                        ].map(d => (
                          <div key={d.label} style={{
                            background: d.bg,
                            border: `1px solid ${d.border}`,
                            borderRadius: 10,
                            padding: "10px 12px",
                          }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: d.color, margin: "0 0 4px 0" }}>{d.label}</p>
                            <p style={{ fontSize: 11, color: "#6E6E73", lineHeight: 1.5, margin: 0 }}>{d.desc}</p>
                          </div>
                        ))}
                      </div>

                      <p style={{ fontSize: 12, color: "#8E8E93", lineHeight: 1.6, margin: "12px 0 0 0" }}>{roleRequirementText.outro}</p>
                    </div>
                  </>)}

                  {(() => {
                    const analysis = getRoleAnalysis(bioGramGesamt.imp, bioGramGesamt.int, bioGramGesamt.ana);
                    const rt = roleResultTexts[analysis.resultKey];
                    return (
                      <div style={{
                        marginTop: 18,
                        padding: "16px 18px",
                        borderRadius: 14,
                        background: "rgba(0,0,0,0.02)",
                        border: "1px solid rgba(0,0,0,0.04)",
                      }} data-testid="box-biocheck-description-collapsed">
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "linear-gradient(135deg, rgba(0,113,227,0.12), rgba(52,170,220,0.12))",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <Lightbulb size={14} style={{ color: "#0071E3" }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#0071E3", textTransform: "uppercase", letterSpacing: "0.04em" }}>Ergebnis der Analyse</span>
                        </div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px 0" }} data-testid="text-biocheck-collapsed-line-0">{rt.headline}</h3>
                        <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.7, margin: "0 0 6px 0" }} data-testid="text-biocheck-collapsed-line-1">{rt.summary}</p>
                        <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.7, margin: "0 0 6px 0" }} data-testid="text-biocheck-collapsed-line-2">{rt.focus}</p>
                        <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.7, margin: 0 }} data-testid="text-biocheck-collapsed-line-3">{rt.transfer}</p>
                        {isLeadershipRole && (
                          <p style={{ fontSize: 14, color: "#1D1D1F", lineHeight: 1.7, margin: "6px 0 0 0" }} data-testid="text-biocheck-collapsed-line-4">{rt.leadership}</p>
                        )}
                      </div>
                    );
                  })()}

                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {[
                        { title: "Tätigkeiten", key: "haupttaetigkeiten", data: bioGramHaupt, icon: Briefcase },
                        { title: "Humankompetenzen", key: "humankompetenzen", data: bioGramNeben, icon: Heart },
                        { title: "Rahmenbedingungen der Stelle", key: "rahmenbedingungen", data: bioGramRahmen, icon: Settings },
                        ...(isLeadershipRole ? [{ title: "Führungskompetenzen", key: "fuehrungskompetenzen", data: bioGramFuehrung, icon: Shield }] : []),
                      ].map((section) => (
                        <div
                          key={section.key}
                          style={{
                            background: "rgba(0,0,0,0.02)",
                            borderRadius: 14,
                            padding: "16px 18px",
                            border: "1px solid rgba(0,0,0,0.04)",
                          }}
                          data-testid={`biocheck-collapsed-${section.key}`}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <section.icon style={{ width: 15, height: 15, color: "#6E6E73", strokeWidth: 1.8 }} />
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                              {section.title}
                            </p>
                          </div>
                          {[
                            { label: "Impulsiv", color: "#C41E3A", value: section.data.imp },
                            { label: "Intuitiv", color: "#F39200", value: section.data.int },
                            { label: "Analytisch", color: "#1A5DAB", value: section.data.ana },
                          ].map((bar) => (
                            <div
                              key={bar.label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                              }}
                            >
                              <span style={{
                                fontSize: 12,
                                color: "#6E6E73",
                                width: 62,
                                flexShrink: 0,
                              }}>
                                {bar.label}
                              </span>
                              <div style={{
                                flex: 1,
                                height: 24,
                                borderRadius: 6,
                                background: "rgba(0,0,0,0.04)",
                                overflow: "hidden",
                                position: "relative",
                              }}>
                                <div style={{
                                  width: bar.value === 0 ? "0%" : `${Math.max(bar.value, 2)}%`,
                                  height: "100%",
                                  borderRadius: 6,
                                  background: bar.color,
                                  transition: "width 600ms ease",
                                  display: "flex",
                                  alignItems: "center",
                                  paddingLeft: 8,
                                  minWidth: bar.value === 0 ? 0 : 40,
                                }}>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {Math.round(bar.value)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        background: "rgba(0,0,0,0.02)",
                        borderRadius: 14,
                        padding: "16px 18px",
                        border: "1px solid rgba(0,0,0,0.04)",
                        marginTop: 16,
                      }}
                      data-testid="biocheck-collapsed-gesamt"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <BarChart3 style={{ width: 16, height: 16, color: "#6E6E73", strokeWidth: 1.8 }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                          Gesamtprofil der Stellenanforderung
                        </p>
                      </div>
                      {(() => {
                        const bars = [
                          { label: "Impulsiv", color: "#C41E3A", value: bioGramGesamt.imp },
                          { label: "Intuitiv", color: "#F39200", value: bioGramGesamt.int },
                          { label: "Analytisch", color: "#1A5DAB", value: bioGramGesamt.ana },
                        ];
                        return bars.map((bar) => {
                          const widthPct = (bar.value / 67) * 100;
                          return (
                            <div
                              key={bar.label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10,
                              }}
                            >
                              <span style={{ fontSize: 12, color: "#6E6E73", width: 62, flexShrink: 0 }}>
                                {bar.label}
                              </span>
                              <div style={{
                                flex: 1,
                                height: 28,
                                borderRadius: 6,
                                background: "rgba(0,0,0,0.04)",
                                overflow: "hidden",
                                position: "relative",
                              }}>
                                <div style={{
                                  width: bar.value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 3), 100)}%`,
                                  height: "100%",
                                  borderRadius: 6,
                                  background: bar.color,
                                  transition: "width 600ms ease",
                                  display: "flex",
                                  alignItems: "center",
                                  paddingLeft: 8,
                                  minWidth: bar.value === 0 ? 0 : 40,
                                }}>
                                  <span style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {Math.round(bar.value)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                  </div>
                </>)}
              </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
    </>
  );
}
