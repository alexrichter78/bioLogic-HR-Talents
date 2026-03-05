import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Download, AlertTriangle, CheckCircle } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { BERUFE } from "@/data/berufe";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

type BG = { imp: number; int: number; ana: number };
type ProfileType = "balanced_all" | "strong_imp" | "strong_ana" | "strong_int" |
  "dominant_imp" | "dominant_ana" | "dominant_int" |
  "light_imp" | "light_ana" | "light_int" |
  "hybrid_imp_ana" | "hybrid_ana_int" | "hybrid_imp_int";
type Intensity = "strong" | "clear" | "light" | "balanced";

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

function calcBioGram(taetigkeiten: any[]): BG {
  if (!taetigkeiten.length) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const weights: Record<string, number> = { Niedrig: 0.6, Mittel: 1.0, Hoch: 1.8 };
  let sI = 0, sN = 0, sA = 0;
  for (const t of taetigkeiten) {
    const w = weights[t.niveau] || 1.0;
    if (t.kompetenz === "Impulsiv") sI += w;
    else if (t.kompetenz === "Intuitiv") sN += w;
    else sA += w;
  }
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const [imp, int, ana] = roundPercentages((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
  return { imp, int, ana };
}

function computeGesamt(haupt: BG, neben: BG, fuehrung: BG, rahmen: BG): BG {
  const all = [haupt, neben, fuehrung, rahmen];
  let vals = [
    all.reduce((s, g) => s + g.imp, 0) / 4,
    all.reduce((s, g) => s + g.int, 0) / 4,
    all.reduce((s, g) => s + g.ana, 0) / 4,
  ];
  const MAX = 67;
  const peak = Math.max(...vals);
  if (peak > MAX) {
    const scale = MAX / peak;
    vals = vals.map(v => v * scale);
  }
  const [imp, int, ana] = roundPercentages(vals[0], vals[1], vals[2]);
  return { imp, int, ana };
}

function computeRahmen(state: any): BG {
  let sI = 0, sN = 0, sA = 0;
  const f = state.fuehrung || "";
  if (f === "Fachliche Führung") sA += 1;
  else if (f === "Projekt-/Teamkoordination") sN += 1;
  else if (f.startsWith("Disziplinarische")) sI += 1;
  for (const idx of (state.erfolgsfokusIndices || [])) {
    if (idx === 0 || idx === 2) sI += 1;
    else if (idx === 1 || idx === 5) sN += 1;
    else if (idx === 3 || idx === 4) sA += 1;
  }
  if (state.aufgabencharakter === "überwiegend operativ") sI += 1;
  else if (state.aufgabencharakter === "überwiegend systemisch") sN += 1;
  else if (state.aufgabencharakter === "überwiegend strategisch") sA += 1;
  if (state.arbeitslogik === "Umsetzungsorientiert") sI += 1;
  else if (state.arbeitslogik === "Menschenorientiert") sN += 1;
  else if (state.arbeitslogik === "Daten-/prozessorientiert") sA += 1;
  const total = sI + sN + sA;
  if (total <= 0) return { imp: 33.3, int: 33.3, ana: 33.4 };
  const [imp, int, ana] = roundPercentages((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
  return { imp, int, ana };
}

function classifyProfile(bg: BG): { type: ProfileType; intensity: Intensity } {
  const vals = [
    { key: "imp", value: bg.imp },
    { key: "int", value: bg.int },
    { key: "ana", value: bg.ana },
  ].sort((a, b) => b.value - a.value || SORT_PRIORITY[a.key] - SORT_PRIORITY[b.key]);
  const [max, second, third] = vals;
  const gap12 = max.value - second.value;
  const gap23 = second.value - third.value;
  const abII = Math.abs(bg.imp - bg.int);
  const abIA = Math.abs(bg.imp - bg.ana);
  const abNA = Math.abs(bg.int - bg.ana);

  if (abII <= 6 && abIA <= 6 && abNA <= 6) return { type: "balanced_all", intensity: "balanced" };
  if (max.value >= 55) return { type: `strong_${max.key}` as ProfileType, intensity: "strong" };
  if (gap12 >= 8) return { type: `dominant_${max.key}` as ProfileType, intensity: "clear" };
  if (gap12 <= 5 && gap23 > 5) {
    const k1 = max.key, k2 = second.key;
    const hybridKey = `hybrid_${k1}_${k2}`;
    const validHybrids = ["hybrid_imp_ana", "hybrid_ana_int", "hybrid_imp_int"];
    const reverseMap: Record<string, string> = { "hybrid_ana_imp": "hybrid_imp_ana", "hybrid_int_ana": "hybrid_ana_int", "hybrid_int_imp": "hybrid_imp_int" };
    const resolved = validHybrids.includes(hybridKey) ? hybridKey : (reverseMap[hybridKey] || "hybrid_imp_ana");
    const hybridIntensity: Intensity = gap23 >= 15 ? "strong" : gap23 >= 8 ? "clear" : "light";
    return { type: resolved as ProfileType, intensity: hybridIntensity };
  }
  if (gap12 >= 5) return { type: `light_${max.key}` as ProfileType, intensity: "light" };
  return { type: "balanced_all", intensity: "balanced" };
}

const SORT_PRIORITY: Record<string, number> = { imp: 0, int: 1, ana: 2 };

function sortedTriad(bg: BG) {
  return [
    { key: "imp" as const, label: "Impulsiv", value: bg.imp },
    { key: "int" as const, label: "Intuitiv", value: bg.int },
    { key: "ana" as const, label: "Analytisch", value: bg.ana },
  ].sort((a, b) => b.value - a.value || SORT_PRIORITY[a.key] - SORT_PRIORITY[b.key]);
}

function dominant(bg: BG) { return sortedTriad(bg)[0]; }
function secondary(bg: BG) { return sortedTriad(bg)[1]; }
function weakest(bg: BG) { return sortedTriad(bg)[2]; }

function kompShort(k: string): string {
  if (k === "imp" || k === "Impulsiv") return "Entscheidungskraft und Umsetzung";
  if (k === "int" || k === "Intuitiv") return "Vertrauen und Beziehungsgestaltung";
  return "Strukturierte Arbeitsweise";
}

function kompLabel(k: string): string {
  if (k === "imp" || k === "Impulsiv" || k === "impulsiv") return "Handlungs- und Umsetzungskompetenz";
  if (k === "int" || k === "Intuitiv" || k === "intuitiv") return "Sozial- und Beziehungskompetenz";
  return "Fach- und Methodenkompetenz";
}

function kompAdj(k: string): string {
  if (k === "imp" || k === "Impulsiv") return "handlungsorientiert";
  if (k === "int" || k === "Intuitiv") return "beziehungsorientiert";
  return "strukturiert";
}

const ERFOLGSFOKUS_LABELS = [
  "Ergebnis-/ Umsatzwirkung",
  "Beziehungs- und Netzwerkstabilität",
  "Innovations- & Transformationsleistung",
  "Prozess- und Effizienzqualität",
  "Fachliche Exzellenz / Expertise",
  "Strategische Wirkung / Positionierung",
];

type ReportData = {
  beruf: string;
  bereich: string;
  isLeadership: boolean;
  fuehrungstyp: string;
  aufgabencharakter: string;
  arbeitslogik: string;
  gesamt: BG;
  haupt: BG;
  neben: BG;
  fuehrung: BG;
  rahmen: BG;
  profileType: ProfileType;
  intensity: Intensity;
  dom: { key: string; label: string; value: number };
  sec: { key: string; label: string; value: number };
  wk: { key: string; label: string; value: number };
  taetigkeiten: any[];
  erfolgsfokusIndices: number[];
};

function behaviorDesc(k: string): string {
  if (k === "imp") return "schnelles Handeln und klare Entscheidungen";
  if (k === "int") return "persönlichen Kontakt und Beziehungsarbeit";
  return "sorgfältige Analyse und strukturiertes Arbeiten";
}

function buildStressTexts(bg: BG) {
  const vals = [
    { key: "imp", value: bg.imp },
    { key: "int", value: bg.int },
    { key: "ana", value: bg.ana },
  ].sort((a, b) => b.value - a.value || SORT_PRIORITY[a.key] - SORT_PRIORITY[b.key]);
  const [top, mid] = vals;
  const gap12 = Math.round(top.value - mid.value);
  const gap23 = Math.round(mid.value - vals[2].value);
  const hasDualDominance = gap12 <= 5;
  const hasSecondaryCompetition = gap12 >= 10 && gap23 <= 5;
  const hasFullSymmetry = gap12 <= 5 && gap23 <= 5;

  let controlled = "";
  if (hasFullSymmetry) {
    controlled = "Wenn der Arbeitsdruck steigt, fehlt eine klare Richtung. Die Person wechselt zwischen verschiedenen Herangehensweisen. Mal handelt sie schnell, mal sucht sie den Austausch, mal vertieft sie sich in Details. Das kann im Team zu Verunsicherung führen, weil das Verhalten schwer einzuschätzen ist.";
  } else if (hasDualDominance) {
    controlled = `Wenn der Arbeitsdruck steigt, setzt sich eine der beiden starken Seiten durch. Die Person fokussiert sich entweder auf ${behaviorDesc(top.key)} oder auf ${behaviorDesc(mid.key)}. Das schafft kurzfristig Klarheit und stabilisiert die Situation. Gleichzeitig kann die andere Seite zu kurz kommen.`;
  } else {
    controlled = `Wenn der Arbeitsdruck steigt, zeigt sich die Stärke der Rolle besonders deutlich. Die Person setzt dann vor allem auf ${behaviorDesc(top.key)}. Das gibt dem Umfeld Sicherheit und Orientierung. Andere Anforderungen treten in den Hintergrund.`;
  }

  let uncontrolled = "";
  if (hasFullSymmetry) {
    uncontrolled = "Wenn der Druck sehr hoch wird, fehlt ein klarer Rückfallmechanismus. Das Verhalten wird widersprüchlich. Die Person versucht gleichzeitig zu handeln, abzustimmen und zu analysieren. Entscheidungen werden sprunghaft oder bleiben ganz aus.";
  } else if (hasSecondaryCompetition) {
    uncontrolled = "Wenn der Druck sehr hoch wird, verliert die Person ihre klare Linie. Das Verhalten wird wechselhaft. Sie springt zwischen verschiedenen Ansätzen, ohne sich festzulegen.";
  } else if (hasDualDominance) {
    uncontrolled = `Wenn der Druck sehr hoch wird, geraten die beiden starken Seiten in Konflikt. ${behaviorDesc(top.key).charAt(0).toUpperCase() + behaviorDesc(top.key).slice(1)} und ${behaviorDesc(mid.key)} stehen sich im Weg. Entscheidungen werden zögerlich oder sprunghaft, weil keine klare Linie dominiert.`;
  } else {
    uncontrolled = `Wenn der Druck sehr hoch wird, verschiebt sich das Verhalten spürbar. Die Person setzt dann stärker auf ${behaviorDesc(mid.key)}. ${mid.key === "ana" ? "Entscheidungen werden vorsichtiger und langsamer. Details gewinnen zu viel Gewicht." : mid.key === "int" ? "Entscheidungen werden stärker über Abstimmung und Konsens gesucht, auch wenn schnelles Handeln nötig wäre." : "Entscheidungen werden direkter und schneller, teils ohne ausreichende Prüfung."}`;
  }

  return { controlled, uncontrolled };
}

function buildTeamwirkung(data: ReportData) {
  const { isLeadership, dom, fuehrungstyp } = data;

  if (isLeadership) {
    if (dom.key === "imp") {
      return `Die Rolle übernimmt ${fuehrungstyp.toLowerCase()} im Team. Die Führungskraft gibt das Tempo vor, setzt klare Prioritäten und trifft Entscheidungen verbindlich. Teammitglieder wissen, woran sie sind. In Situationen mit hohem Handlungsdruck zeigt diese Führung ihre größte Stärke.`;
    } else if (dom.key === "int") {
      return `Die Rolle übernimmt ${fuehrungstyp.toLowerCase()} im Team. Die Führungskraft baut Vertrauen auf, bringt unterschiedliche Perspektiven zusammen und sorgt dafür, dass Entscheidungen vom Team getragen werden. Teammitglieder orientieren sich an dieser Person besonders bei schwierigen zwischenmenschlichen Situationen.`;
    } else {
      return `Die Rolle übernimmt ${fuehrungstyp.toLowerCase()} im Team. Die Führungskraft steuert über fachliche Expertise, klare Standards und nachvollziehbare Prozesse. Teammitglieder vertrauen auf die methodische Sicherheit und die sachliche Herangehensweise.`;
    }
  }

  if (dom.key === "imp") {
    return "Die Rolle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung vor allem über schnelle Ergebnisse und klare Priorisierung. Kolleginnen und Kollegen orientieren sich an dieser Arbeitsweise, besonders bei Umsetzungsfragen und operativen Entscheidungen.";
  } else if (dom.key === "int") {
    return "Die Rolle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung vor allem über Vertrauen und persönlichen Kontakt. Kolleginnen und Kollegen orientieren sich an dieser Person, besonders bei zwischenmenschlichen Situationen und Teamabstimmungen.";
  }
  return "Die Rolle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung vor allem über fachliche Tiefe und verlässliche Arbeitsergebnisse. Kolleginnen und Kollegen orientieren sich an dieser Arbeitsweise, besonders bei fachlichen Fragen und Prozessthemen.";
}

function buildSpannungsfelder(data: ReportData): string[] {
  const { dom, sec, wk, isLeadership, profileType } = data;
  const fields: string[] = [];

  if (dom.key === "imp") {
    fields.push("Tempo und Ergebnisorientierung vs. Sorgfalt und Absicherung");
    if (isLeadership) fields.push("Durchsetzungskraft vs. Mitarbeiterbindung und Teamakzeptanz");
    else fields.push("Eigeninitiative und schnelles Handeln vs. Abstimmung im Team");
  } else if (dom.key === "int") {
    fields.push("Persönliche Beziehungspflege vs. wirtschaftliche Kalkulation");
    fields.push("Individuelle Beratung und Empathie vs. Zeitdruck und Effizienz");
    if (isLeadership) fields.push("Konsensorientierung vs. klare Entscheidungen unter Zeitdruck");
    else fields.push("Teamorientierung vs. eigenverantwortliches Handeln");
  } else {
    fields.push("Gründlichkeit und Qualitätsanspruch vs. Pragmatismus und Geschwindigkeit");
    fields.push("Kontrolle und Standards vs. Flexibilität und Anpassung");
    if (isLeadership) fields.push("Detailsteuerung vs. strategischer Überblick und Delegation");
    else fields.push("Systematische Arbeitsweise vs. kreative Lösungsansätze");
  }

  if (profileType.startsWith("hybrid_")) {
    fields.push("Zwei gleichstarke Anforderungen stehen im Wettbewerb um Aufmerksamkeit");
  }

  if (wk.key === "imp") fields.push("Reflexion und Gründlichkeit vs. Handlungsdruck");
  else if (wk.key === "int") fields.push("Sachliche Korrektheit vs. Beziehungspflege");
  else fields.push("Gespür und Erfahrung vs. Strukturbedarf");

  return fields;
}

function isNeutralProfile(bg: BG): boolean {
  const vals = [bg.imp, bg.int, bg.ana];
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  return (max - min) < 2;
}

function buildProfilherkunft(data: ReportData): { label: string; dom: string; pct: number }[] {
  const parts: { label: string; dom: string; pct: number }[] = [];
  const addPart = (label: string, bg: BG) => {
    if (isNeutralProfile(bg)) {
      parts.push({ label, dom: "Ausgeglichen", pct: 33 });
    } else {
      const d = dominant(bg);
      parts.push({ label, dom: d.label, pct: Math.round(d.value) });
    }
  };
  addPart("Kerntätigkeiten", data.haupt);
  addPart("Humankompetenzen", data.neben);
  if (data.isLeadership) {
    addPart("Führungskompetenz", data.fuehrung);
  }
  addPart("Rahmenbedingungen", data.rahmen);
  return parts;
}

function buildRahmenText(data: ReportData): string {
  const parts: string[] = [];
  if (data.aufgabencharakter) {
    const charMap: Record<string, string> = {
      "überwiegend operativ": "Der Aufgabencharakter ist überwiegend operativ. Die Rolle wirkt primär über direkte Umsetzung und konkretes Handeln.",
      "überwiegend systemisch": "Der Aufgabencharakter ist überwiegend systemisch. Die Rolle wirkt über Vernetzung, Koordination und das Zusammenführen verschiedener Perspektiven.",
      "überwiegend strategisch": "Der Aufgabencharakter ist überwiegend strategisch. Die Rolle wirkt über langfristige Planung, Richtungsentscheidungen und Steuerung.",
      "Gemischt": "Der Aufgabencharakter ist gemischt. Die Rolle wechselt situativ zwischen operativer Umsetzung, Koordination und strategischer Steuerung.",
    };
    parts.push(charMap[data.aufgabencharakter] || `Der Aufgabencharakter ist ${data.aufgabencharakter.toLowerCase()}.`);
  }
  if (data.arbeitslogik) {
    const logikMap: Record<string, string> = {
      "Umsetzungsorientiert": "Die Arbeitslogik ist umsetzungsorientiert. Wirkung entsteht durch schnelles Handeln und konkrete Ergebnisse.",
      "Menschenorientiert": "Die Arbeitslogik ist menschenorientiert. Wirkung entsteht durch Kommunikation, Beziehungsgestaltung und Abstimmung.",
      "Daten-/prozessorientiert": "Die Arbeitslogik ist daten- und prozessorientiert. Wirkung entsteht durch systematische Analyse und strukturierte Abläufe.",
    };
    parts.push(logikMap[data.arbeitslogik] || `Die Arbeitslogik ist ${data.arbeitslogik.toLowerCase()}.`);
  }
  if (data.isLeadership && data.fuehrungstyp) {
    parts.push(`Die Rolle umfasst ${data.fuehrungstyp.toLowerCase()}.`);
  }
  return parts.join(" ");
}

function buildErfolgsfokusText(data: ReportData, labels: string[]): string {
  if (labels.length === 0) return "";
  const FOKUS_DOMIN: Record<string, string> = {
    "Ergebnis-/ Umsatzwirkung": "imp",
    "Beziehungs- und Netzwerkstabilität": "int",
    "Innovations- & Transformationsleistung": "imp",
    "Prozess- und Effizienzqualität": "ana",
    "Fachliche Exzellenz / Expertise": "ana",
    "Strategische Wirkung / Positionierung": "int",
  };
  const needed = labels.map(l => FOKUS_DOMIN[l] || "ana");
  const unique = [...new Set(needed)];

  if (unique.length === 1 && unique[0] === data.dom.key) {
    return "Der Erfolgsfokus passt zur zentralen Anforderung der Rolle. Die Person wird in ihrem stärksten Bereich gemessen. Das erhöht die Wahrscheinlichkeit, dass sie liefern kann.";
  }
  if (unique.every(u => u === data.dom.key || u === data.sec.key)) {
    return "Der Erfolgsfokus wird durch die beiden stärksten Anforderungen der Rolle abgedeckt. Die Person kann auf ihre natürlichen Stärken zurückgreifen. Das erleichtert die Zielerreichung.";
  }
  const missingKey = unique.find(u => u !== data.dom.key && u !== data.sec.key);
  const missingDesc = missingKey === "imp" ? "schnelle Umsetzung und Ergebnisorientierung" : missingKey === "int" ? "Beziehungsarbeit und persönlichen Kontakt" : "systematische Analyse und Prozessqualität";
  return `Der Erfolgsfokus verlangt unter anderem ${missingDesc}. Diese Anforderung ist im Profil der Rolle nachrangig. Hier muss bewusst gesteuert werden, um den Erfolg abzusichern.`;
}

function buildProfilkonflikt(data: ReportData): string | null {
  const hauptDom = dominant(data.haupt);
  const { dom } = data;
  if (hauptDom.key === dom.key) return null;
  const hauptBehavior = hauptDom.key === "imp" ? "schnelles Handeln und Umsetzung" : hauptDom.key === "int" ? "persönlichen Kontakt und Beziehungsarbeit" : "strukturierte Analyse und Sorgfalt";
  const gesamtBehavior = dom.key === "imp" ? "Entscheidungskraft und Tempo" : dom.key === "int" ? "Beziehungsgestaltung und Kommunikation" : "methodisches Arbeiten und Qualitätssicherung";
  return `Hinweis: Die Kerntätigkeiten der Rolle verlangen vor allem ${hauptBehavior}. Das Gesamtprofil verschiebt sich jedoch in Richtung ${gesamtBehavior}. Rahmenbedingungen und ergänzende Anforderungen verändern das Anforderungsprofil. Im Besetzungsprozess sollte geprüft werden, ob die Person primär die Kerntätigkeiten oder das Gesamtpaket abbilden kann.`;
}

function buildKomponentenBedeutung(data: ReportData): { key: string; label: string; color: string; text: string }[] {
  const KOMP_TEXTE: Record<string, { label: string; color: string; text: string }> = {
    ana: {
      label: "Analytisch",
      color: COLORS.ana,
      text: "Analytisch bedeutet in dieser Rolle: strukturierte Priorisierung, saubere Abwägung und verlässliche Entscheidungsgrundlagen im Tagesgeschäft. Diese Komponente stabilisiert Qualität, ohne die Rolle in reines Abarbeiten zu ziehen.",
    },
    imp: {
      label: "Impulsiv",
      color: COLORS.imp,
      text: "Impulsiv bedeutet in dieser Rolle: aktives Priorisieren, zügiges Entscheiden im Tagesgeschäft und die Fähigkeit, Aufgaben konsequent zu Ende zu bringen. Diese Komponente verhindert Aufschub und erhöht Umsetzungsgeschwindigkeit.",
    },
    int: {
      label: "Intuitiv",
      color: COLORS.int,
      text: "Intuitiv bedeutet in dieser Rolle: situatives Erfassen von Kontext, passende Kommunikation und reibungsarme Zusammenarbeit. Diese Komponente stabilisiert Teamwirkung, ohne die Rolle von Fakten wegzuziehen.",
    },
  };
  const sorted = (["imp", "int", "ana"] as const)
    .map(k => ({ key: k, value: data.gesamt[k] }))
    .sort((a, b) => b.value - a.value || (a.key === "imp" ? -1 : a.key === "int" ? 0 : 1));
  return sorted.map(s => ({ key: s.key, ...KOMP_TEXTE[s.key] }));
}

function buildFehlbesetzung(data: ReportData): { label: string; bullets: string[] }[] {
  const { dom, sec, wk, isLeadership } = data;
  const risks: { label: string; bullets: string[] }[] = [];

  const hauptTaetigkeiten = (data.taetigkeiten || []).filter((t: any) => t.kategorie === "haupt");
  const hochItems = hauptTaetigkeiten.filter((t: any) => t.niveau === "Hoch");

  if (dom.key === "imp" || dom.value >= 45) {
    risks.push({
      label: "Wenn zu viel Tempo und zu wenig Sorgfalt",
      bullets: [
        dom.key === "int" ? "Beratung wird hektischer, Gesprächsqualität sinkt" : "Entscheidungen werden zu schnell und ohne Absicherung getroffen",
        isLeadership ? "Das Team kann das Tempo nicht mithalten, Frustration entsteht" : "Abstimmung mit Kolleginnen und Kollegen leidet",
        dom.key === "int" ? "Kunden und Gesprächspartner fühlen sich weniger individuell betreut" : "Prozessfehler und Qualitätsprobleme nehmen zu",
      ],
    });
  }

  if (dom.key === "ana" || wk.key === "int") {
    risks.push({
      label: "Wenn zu viel Kontrolle und zu wenig Nähe",
      bullets: [
        dom.key === "int" ? "Beratung wirkt distanzierter und unpersönlich" : "Überanalyse bremst Entscheidungen und Umsetzung",
        "Zwischenmenschliche Signale werden übersehen oder ignoriert",
        isLeadership ? "Teammitglieder fühlen sich kontrolliert statt geführt" : "Zusammenarbeit wird als starr und unflexibel empfunden",
      ],
    });
  }

  if (wk.key === "ana" || (dom.key === "int" && sec.key === "imp")) {
    risks.push({
      label: "Wenn Beziehung wichtiger wird als Struktur",
      bullets: [
        "Wirtschaftliche und prozessuale Aspekte werden vernachlässigt",
        "Abläufe verlieren an Klarheit und Verbindlichkeit",
        isLeadership ? "Standards werden zugunsten von Harmonie aufgeweicht" : "Dokumentation und Nachvollziehbarkeit leiden",
      ],
    });
  }

  if (wk.key === "imp") {
    risks.push({
      label: "Wenn Umsetzung zu langsam wird",
      bullets: [
        "Entscheidungen werden aufgeschoben oder zu lange abgewogen",
        "Chancen werden verpasst, weil die Reaktionsgeschwindigkeit fehlt",
        isLeadership ? "Das Team wartet auf klare Ansagen, die ausbleiben" : "Wichtige Aufgaben werden nicht rechtzeitig priorisiert",
      ],
    });
  }

  const conflicting = hochItems.filter((t: any) =>
    (dom.key === "imp" && t.kompetenz !== "Impulsiv") ||
    (dom.key === "int" && t.kompetenz !== "Intuitiv") ||
    (dom.key === "ana" && t.kompetenz !== "Analytisch")
  );
  if (conflicting.length >= 2 && risks.length < 3) {
    const namen = conflicting.slice(0, 2).map((t: any) => t.name).join(" und ");
    risks.push({
      label: "Wenn Kerntätigkeiten und Profil auseinanderfallen",
      bullets: [
        `Hochprioritäre Tätigkeiten wie ${namen} verlangen ein anderes Verhalten als das Rollenprofil`,
        "Die Person wird dauerhaft in einem Bereich gefordert, der nicht ihrer natürlichen Stärke entspricht",
        "Kompensation ist kurzfristig möglich. Langfristig steigen Erschöpfung und Fehlerquote",
      ],
    });
  }

  return risks.slice(0, 3);
}

function buildFazit(data: ReportData): { kernsatz: string; persoenlichkeit: string[] } {
  const { dom, sec, wk, beruf, isLeadership, taetigkeiten, profileType } = data;
  const hoch = (taetigkeiten || []).filter((t: any) => t.niveau === "Hoch");

  let kernsatz: string;
  if (profileType === "balanced_all") {
    kernsatz = `Die Rolle ${beruf} passt zu Persönlichkeiten, die vielseitig arbeiten können: schnell handeln, Beziehungen pflegen und gründlich analysieren. Wichtig ist die Fähigkeit, situativ zwischen diesen Anforderungen zu wechseln.`;
  } else {
    kernsatz = `Die Rolle ${beruf} passt besonders zu Persönlichkeiten, die:`;
  }

  const points: string[] = [];
  if (dom.key === "int") {
    points.push("Menschen schnell verstehen, Vertrauen aufbauen und im persönlichen Kontakt überzeugen");
  } else if (dom.key === "imp") {
    points.push("schnell entscheiden, klar priorisieren und Ergebnisse konsequent liefern");
  } else {
    points.push("systematisch denken, sorgfältig arbeiten und fundierte Entscheidungsgrundlagen liefern");
  }

  if (sec.key === "ana") points.push("gleichzeitig strukturiert arbeiten und Abläufe stabil halten");
  else if (sec.key === "int") points.push("gleichzeitig Beziehungen pflegen und das Team mitnehmen");
  else points.push("gleichzeitig handlungsfähig bleiben und Tempo halten");

  points.push("auch unter Druck ruhig und klar bleiben");

  if (hoch.length > 0) {
    points.push(`die kritischen Anforderungen (${hoch.slice(0, 3).map((t: any) => t.name).join(", ")}) auf hohem Niveau erfüllen`);
  }

  if (isLeadership) {
    points.push(`Führungswirkung entfalten und dabei das Team mitnehmen`);
  }

  return { kernsatz, persoenlichkeit: points };
}

const MAX_BIO = 67;

function ProfileBar({ label, value, color }: { label: string; value: number; color: string }) {
  const widthPct = (value / MAX_BIO) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 13, color: "#6E6E73", width: 72, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 28, borderRadius: 8, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{
          width: value === 0 ? "0%" : `${Math.min(Math.max(widthPct, 5), 100)}%`,
          height: "100%", borderRadius: 8, background: color,
          display: "flex", alignItems: "center", paddingLeft: 10,
          minWidth: value === 0 ? 0 : 44,
          transition: "width 300ms ease",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", whiteSpace: "nowrap" }}>{Math.round(value)} %</span>
        </div>
      </div>
    </div>
  );
}

export default function Rollenprofil() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<ReportData | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [kandidatenText, setKandidatenText] = useState<string | null>(null);
  const [kandidatenLoading, setKandidatenLoading] = useState(false);
  const [kandidatenError, setKandidatenError] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem("rollenDnaCompleted");
    if (completed !== "true") return;
    const raw = localStorage.getItem("rollenDnaState");
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      const taetigkeiten = state.taetigkeiten || [];
      const hauptItems = taetigkeiten.filter((t: any) => t.kategorie === "haupt");
      const nebenItems = taetigkeiten.filter((t: any) => t.kategorie === "neben");
      const fuehrungItems = taetigkeiten.filter((t: any) => t.kategorie === "fuehrung");

      let haupt = state.bioGramHaupt;
      let neben = state.bioGramNeben;
      let fuehrung = state.bioGramFuehrung;
      let rahmen = state.bioGramRahmen;
      if (!haupt) haupt = calcBioGram(hauptItems);
      if (!neben) neben = calcBioGram(nebenItems);
      if (!fuehrung) fuehrung = calcBioGram(fuehrungItems);
      if (!rahmen) rahmen = computeRahmen(state);

      const gesamt = state.bioGramGesamt || computeGesamt(haupt, neben, fuehrung, rahmen);
      const beruf = state.beruf || "Unbekannte Rolle";
      const bereich = BERUFE[beruf] || state.bereich || "";
      const fuehrungstyp = state.fuehrung || "Keine";
      const isLeadership = fuehrungstyp !== "Keine";
      const aufgabencharakter = state.aufgabencharakter || "";
      const arbeitslogik = state.arbeitslogik || "";
      const erfolgsfokusIndices = state.erfolgsfokusIndices || [];
      const { type: profileType, intensity } = classifyProfile(gesamt);
      const dom = dominant(gesamt);
      const sec = secondary(gesamt);
      const wk = weakest(gesamt);

      const newData = {
        beruf, bereich, isLeadership, fuehrungstyp, aufgabencharakter, arbeitslogik,
        gesamt, haupt, neben, fuehrung, rahmen, profileType, intensity,
        dom, sec, wk, taetigkeiten, erfolgsfokusIndices,
      };
      setData(newData);

      const hauptNamen = (taetigkeiten || [])
        .filter((t: any) => t.kategorie === "haupt")
        .map((t: any) => t.name)
        .sort()
        .join(",");
      const cacheKey = `kandidatenProfil_${beruf}_${bereich}_${fuehrungstyp}_${hauptNamen.slice(0, 200)}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setKandidatenText(cached);
      } else {
        setKandidatenLoading(true);
        fetch("/api/generate-kandidatenprofil", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            beruf, bereich, taetigkeiten,
            fuehrungstyp, aufgabencharakter, arbeitslogik,
          }),
        })
          .then(r => {
            if (!r.ok) throw new Error("API error");
            return r.json();
          })
          .then(json => {
            if (json.text) {
              setKandidatenText(json.text);
              try { localStorage.setItem(cacheKey, json.text); } catch {}
            } else {
              setKandidatenError(true);
            }
          })
          .catch(() => setKandidatenError(true))
          .finally(() => setKandidatenLoading(false));
      }
    } catch {}
  }, []);

  const handlePDF = async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#FFFFFF", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 10;
      let remaining = imgH;
      const usableH = pageH - 20;
      let page = 0;
      while (remaining > 0) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, y - (page * usableH), imgW, imgH);
        remaining -= usableH;
        page++;
        y = 10;
      }
      pdf.save(`Rollen-DNA_${data?.beruf || "Bericht"}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }}>
        <GlobalNav />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", borderRadius: 24, padding: "48px 32px", boxShadow: "0 2px 20px rgba(0,0,0,0.04)" }}>
            <AlertTriangle style={{ width: 40, height: 40, color: "#FF9500", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Keine Rollen-DNA vorhanden</h2>
            <p style={{ fontSize: 14, color: "#6E6E73", margin: "0 0 24px", lineHeight: 1.6 }}>
              Bitte erstellen Sie zuerst eine Rollen-DNA, um den Bericht generieren zu können.
            </p>
            <button
              onClick={() => setLocation("/rollen-dna")}
              data-testid="button-go-rollen-dna"
              style={{
                padding: "12px 28px", borderRadius: 12, border: "none",
                background: "#0071E3", color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Rollen-DNA erstellen
            </button>
          </div>
        </main>
      </div>
    );
  }

  const stress = buildStressTexts(data.gesamt);
  const teamwirkung = buildTeamwirkung(data);
  const spannungsfelder = buildSpannungsfelder(data);
  const fehlbesetzung = buildFehlbesetzung(data);
  const fazit = buildFazit(data);

  const hauptTaetigkeiten = (data.taetigkeiten || []).filter((t: any) => t.kategorie === "haupt");
  const hochItems = hauptTaetigkeiten.filter((t: any) => t.niveau === "Hoch");
  const erfolgsfokusLabels = data.erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i]).filter(Boolean);
  const profilherkunft = buildProfilherkunft(data);
  const rahmenText = buildRahmenText(data);
  const erfolgsfokusText = buildErfolgsfokusText(data, erfolgsfokusLabels);
  const profilkonflikt = buildProfilkonflikt(data);

  const komponentenBedeutung = buildKomponentenBedeutung(data);

  const topTaetigkeiten = hauptTaetigkeiten.slice(0, 4).map((t: any) => t.name);
  const taetigkeitenInText = topTaetigkeiten.length > 0
    ? topTaetigkeiten.join(", ")
    : null;

  const rollenBeschreibung = (() => {
    const tRef = taetigkeitenInText ? `Die zentralen Aufgaben wie ${taetigkeitenInText} ` : "Die zentralen Aufgaben ";
    if (data.dom.key === "int") {
      return `${tRef}verlangen eine Persönlichkeit, die ${data.isLeadership ? "ein Team führen kann und " : ""}schnell Vertrauen aufbaut, Bedürfnisse erkennt und im persönlichen Kontakt überzeugt. Die Person muss Menschen gewinnen können. ${data.sec.key === "ana" ? "Gleichzeitig braucht die Rolle eine strukturierte Arbeitsweise, damit Abläufe und Organisation stabil bleiben." : "Gleichzeitig braucht die Rolle Durchsetzungsfähigkeit, um Entscheidungen auch gegen Widerstände umzusetzen."}`;
    } else if (data.dom.key === "imp") {
      return `${tRef}erfordern eine Persönlichkeit, die ${data.isLeadership ? "ein Team antreibt und " : ""}schnell entscheidet, klar priorisiert und Ergebnisse konsequent liefert. Die Person muss handlungsfähig bleiben, auch wenn nicht alle Informationen vorliegen. ${data.sec.key === "int" ? "Gleichzeitig braucht die Rolle die Fähigkeit, Beziehungen zu pflegen und das Team mitzunehmen." : "Gleichzeitig braucht die Rolle Sorgfalt, damit Qualität und Nachhaltigkeit nicht auf der Strecke bleiben."}`;
    } else {
      return `${tRef}setzen eine Persönlichkeit voraus, die ${data.isLeadership ? "ein Team methodisch führt und " : ""}systematisch arbeitet, Qualität sichert und fundierte Entscheidungsgrundlagen liefert. Die Person muss sorgfältig und präzise arbeiten. ${data.sec.key === "int" ? "Gleichzeitig braucht die Rolle Empathie und Kommunikationsgeschick, um Erkenntnisse verständlich zu vermitteln." : "Gleichzeitig braucht die Rolle Handlungsfähigkeit, damit Analysen auch in konkrete Maßnahmen münden."}`;
    }
  })();

  const arbeitslogikText = (() => {
    if (data.dom.key === "int") {
      return `Im Alltag entsteht Wirkung vor allem im direkten Kontakt, ${data.isLeadership ? "mit dem Team, Stakeholdern und Entscheidungsträgern" : "mit Kolleginnen und Kollegen, Kundinnen und Kunden oder Gesprächspartnern"}. Entscheidungen werden häufig situativ und im Gespräch getroffen. ${data.sec.key === "ana" ? "Gleichzeitig braucht die Person die Fähigkeit, Abläufe zu organisieren und Prioritäten klar zu setzen." : "Gleichzeitig braucht die Person die Fähigkeit, schnell zu handeln und Ergebnisse zu liefern, auch wenn nicht alle einverstanden sind."}`;
    } else if (data.dom.key === "imp") {
      return `Im Alltag entsteht Wirkung vor allem über schnelles Handeln und klare Priorisierung. ${data.isLeadership ? "Als Führungskraft gibt diese Person das Tempo vor und treibt Ergebnisse aktiv voran." : "Die Person treibt Themen eigenständig voran und wartet nicht auf Anweisungen."} ${data.sec.key === "int" ? "Dabei darf der Blick für das Team und die Beziehungsebene nicht verloren gehen." : "Dabei braucht es gleichzeitig Sorgfalt, damit Qualität und Nachhaltigkeit gesichert bleiben."}`;
    } else {
      return `Im Alltag entsteht Wirkung über systematische Analyse, klare Prozesse und fundierte Entscheidungsgrundlagen. ${data.isLeadership ? "Als Führungskraft setzt diese Person auf nachvollziehbare Qualitätsstandards und transparente Steuerung." : "Die Person überzeugt durch fachliche Tiefe und sorgfältige Arbeitsweise."} ${data.sec.key === "int" ? "Gleichzeitig muss sie Erkenntnisse verständlich kommunizieren und im Team verankern." : "Gleichzeitig müssen Analysen in konkretes Handeln münden. Reine Theorie reicht nicht."}`;
    }
  })();

  const alltagsverhalten = (() => {
    const hochNamen = hochItems.slice(0, 3).map((t: any) => t.name);
    const hochRef = hochNamen.length > 0 ? `Besonders kritisch sind dabei ${hochNamen.join(", ")}. ` : "";
    if (data.dom.key === "int") {
      return `Im normalen Arbeitstag zeigt sich die Stärke dieser Rolle im persönlichen Kontakt. ${data.isLeadership ? "Die Führungskraft" : "Die Person"} baut Vertrauen auf, erkennt Bedürfnisse schnell und schafft ein Umfeld, in dem sich Menschen gehört fühlen. ${hochRef}${data.sec.key === "ana" ? "Damit das funktioniert, braucht die Rolle gleichzeitig klare Organisation. Abläufe, Dokumentation und Standards dürfen nicht zu kurz kommen." : "Damit das funktioniert, braucht die Rolle gleichzeitig Tempo und Entscheidungsfähigkeit. Nicht alles lässt sich im Konsens lösen."}`;
    } else if (data.dom.key === "imp") {
      return `Im normalen Arbeitstag zeigt sich die Stärke dieser Rolle in klarer Priorisierung und konsequenter Umsetzung. ${data.isLeadership ? "Die Führungskraft" : "Die Person"} treibt Ergebnisse voran und bleibt auch bei Widerständen handlungsfähig. ${hochRef}${data.sec.key === "int" ? "Damit das funktioniert, braucht die Rolle gleichzeitig Sensibilität für das Team. Wer nur Tempo macht, verliert die Leute." : "Damit das funktioniert, braucht die Rolle Sorgfalt bei Analysen und Qualitätssicherung. Schnelle Entscheidungen müssen trotzdem fundiert sein."}`;
    } else {
      return `Im normalen Arbeitstag zeigt sich die Stärke dieser Rolle in methodischer Arbeit, sauberer Dokumentation und hoher Qualität. ${data.isLeadership ? "Die Führungskraft" : "Die Person"} überzeugt durch fachliche Tiefe und nachvollziehbare Ergebnisse. ${hochRef}${data.sec.key === "int" ? "Damit das funktioniert, braucht die Rolle Kommunikationsgeschick. Fachlich richtige Ergebnisse müssen verständlich vermittelt werden." : "Damit das funktioniert, braucht die Rolle Handlungsbereitschaft. Wer nur analysiert, aber nicht entscheidet, blockiert den Fortschritt."}`;
    }
  })();

  const strukturprofilText = (() => {
    if (data.profileType === "balanced_all") {
      return "Diese Rolle verlangt keine klare Spezialisierung. Sie erfordert eine Persönlichkeit, die situativ zwischen schnellem Handeln, persönlichem Kontakt und gründlicher Analyse wechseln kann. Das macht die Besetzung anspruchsvoll. Die Person muss vielseitig sein, ohne beliebig zu wirken.";
    }
    if (data.profileType.startsWith("hybrid_")) {
      const domBehav = data.dom.key === "imp" ? "schnelles Handeln und Umsetzungsstärke" : data.dom.key === "int" ? "persönlichen Kontakt und Beziehungsarbeit" : "methodische Sorgfalt und Qualitätssicherung";
      const secBehav = data.sec.key === "imp" ? "schnelles Handeln und Umsetzungsstärke" : data.sec.key === "int" ? "persönlichen Kontakt und Beziehungsarbeit" : "methodische Sorgfalt und Qualitätssicherung";
      return `Diese Rolle verlangt gleichzeitig ${domBehav} und ${secBehav}. Beide Anforderungen sind nahezu gleichwertig. Die Person muss beides auf hohem Niveau mitbringen.`;
    }
    const domBehav = data.dom.key === "imp" ? "schnelles Handeln und klare Entscheidungen" : data.dom.key === "int" ? "persönlichen Kontakt und die Fähigkeit, Vertrauen aufzubauen" : "sorgfältige Analyse und strukturiertes Arbeiten";
    return `Das Profil dieser Rolle wird geprägt durch ${domBehav}. Das ist die zentrale Anforderung an die Person. ${data.sec.key === "ana" ? "Strukturierte Arbeitsweise sorgt dafür, dass Entscheidungen nachvollziehbar bleiben und Abläufe stabil funktionieren." : data.sec.key === "int" ? "Die Fähigkeit, Beziehungen aufzubauen und Menschen mitzunehmen, sorgt für Akzeptanz und Zusammenhalt." : "Gleichzeitig braucht es Handlungsfähigkeit, damit Ergebnisse auch tatsächlich umgesetzt werden."}`;
  })();

  const abschlussText = (() => {
    const domBenefit = data.dom.key === "int" ? "Beziehungsqualität und Vertrauen" : data.dom.key === "imp" ? "Tempo und Ergebnisorientierung" : "Qualität und Prozesssicherheit";
    const secBenefit = data.sec.key === "ana" ? "stabile Abläufe und Wirtschaftlichkeit" : data.sec.key === "int" ? "Teamzusammenhalt und Akzeptanz" : "schnelle Umsetzung und Verbindlichkeit";
    const riskText = `Fehlt diese Kombination, entstehen ${data.dom.key === "int" ? "entweder Beziehungsdefizite im direkten Kontakt" : data.dom.key === "imp" ? "entweder Tempo- und Umsetzungsprobleme" : "entweder Qualitäts- und Prozessmängel"} oder ${data.sec.key === "ana" ? "Instabilität in Organisation und Wirtschaftlichkeit" : data.sec.key === "int" ? "Akzeptanzprobleme im Team" : "Trägheit bei der Umsetzung"}.`;
    return `Diese Kombination sichert ${domBenefit} und ${secBenefit}${data.isLeadership ? ", und damit Führungswirksamkeit" : ""}. ${riskText}`;
  })();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #EDF3FC 0%, #F0F4F8 40%, #F5F7FA 100%)" }} lang="de">
      <GlobalNav rightSlot={
        <button
          onClick={handlePDF}
          disabled={pdfLoading}
          data-testid="button-pdf-export"
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 10,
            background: pdfLoading ? "rgba(0,113,227,0.04)" : "rgba(0,113,227,0.08)",
            border: "none", cursor: pdfLoading ? "default" : "pointer",
            fontSize: 13, fontWeight: 600, color: "#0071E3",
            transition: "all 200ms ease",
          }}
        >
          <Download style={{ width: 14, height: 14 }} />
          {pdfLoading ? "Wird erstellt..." : "PDF"}
        </button>
      } />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 80px" }}>
        <div ref={reportRef} style={{
          background: "#FFFFFF",
          borderRadius: 4,
          padding: "48px 44px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}>

          {/* ── HEADER ── */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#0071E3", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>bioLogic Strukturanalyse</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1D1D1F", margin: "0 0 6px", letterSpacing: "-0.025em" }} data-testid="text-report-title">
              Rollen-DNA: {data.beruf}
            </h1>
            {data.bereich && (
              <p style={{ fontSize: 13, color: "#8E8E93", margin: 0, fontWeight: 500 }}>{data.bereich}</p>
            )}
            <div style={{ width: 48, height: 3, background: "#0071E3", borderRadius: 2, margin: "20px auto 0" }} />
          </div>

          {/* ── SEITE 1: ROLLEN-DNA ── */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 20px", paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.08)" }} data-testid="section-1-title">
              Seite 1 · Rollen-DNA · die Entscheidungsgrundlage
            </h2>

            <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>Welche Persönlichkeit braucht diese Rolle?</p>

            {/* 1. Kurzbeschreibung */}
            <div style={{ marginTop: 24, marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>1. Kurzbeschreibung der Rolle</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {rollenBeschreibung}
              </p>
            </div>

            {/* 2. Strukturprofil */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>2. Strukturprofil der Rolle</p>
              <div style={{ maxWidth: 400, marginBottom: 14 }}>
                <ProfileBar label="Impulsiv" value={data.gesamt.imp} color={COLORS.imp} />
                <div style={{ height: 8 }} />
                <ProfileBar label="Intuitiv" value={data.gesamt.int} color={COLORS.int} />
                <div style={{ height: 8 }} />
                <ProfileBar label="Analytisch" value={data.gesamt.ana} color={COLORS.ana} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", margin: "0 0 10px" }}>Bedeutung der Komponenten</p>
                {komponentenBedeutung.map((kb, i) => (
                  <div key={i} style={{ marginBottom: i < komponentenBedeutung.length - 1 ? 10 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: kb.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{kb.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: "0 0 0 13px" }} lang="de" data-testid={`text-bedeutung-${kb.key}`}>
                      {kb.text}
                    </p>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 16px", textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {strukturprofilText}
              </p>

              <p style={{ fontSize: 12, fontWeight: 600, color: "#6E6E73", margin: "0 0 8px" }}>Profilherkunft</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {profilherkunft.map((p, i) => {
                  const c = p.dom === "Impulsiv" ? COLORS.imp : p.dom === "Intuitiv" ? COLORS.int : p.dom === "Analytisch" ? COLORS.ana : "#8E8E93";
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 10px", borderRadius: 8, background: "rgba(0,0,0,0.03)",
                      fontSize: 12, color: "#48484A",
                    }} data-testid={`profilherkunft-${i}`}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: c, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{p.label}:</span>
                      <span>{p.dom} ({p.pct} %)</span>
                    </div>
                  );
                })}
              </div>

              {profilkonflikt && (
                <div style={{
                  marginTop: 14, padding: "12px 16px", borderRadius: 10,
                  background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.15)",
                }}>
                  <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.7, margin: 0, fontWeight: 450 }} data-testid="text-profilkonflikt" lang="de">
                    {profilkonflikt}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Arbeitslogik */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>3. Arbeitslogik der Rolle</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {arbeitslogikText}
              </p>
            </div>

            {/* 4. Rahmenbedingungen */}
            {rahmenText && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>4. Rahmenbedingungen</p>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de" data-testid="text-rahmenbedingungen">
                  {rahmenText}
                </p>
              </div>
            )}

            {/* 5. Erfolgsfokus */}
            {erfolgsfokusText && (
              <div style={{ marginBottom: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>
                  {rahmenText ? "5." : "4."} Erfolgsfokus
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {erfolgsfokusLabels.map((l, i) => (
                    <span key={i} style={{
                      fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                      background: "rgba(0,113,227,0.06)", color: "#0071E3",
                    }} data-testid={`tag-erfolgsfokus-${i}`}>{l}</span>
                  ))}
                </div>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de" data-testid="text-erfolgsfokus">
                  {erfolgsfokusText}
                </p>
              </div>
            )}
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "0 0 40px" }} />

          {/* ── SEITE 2: VERHALTEN ── */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 20px", paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.08)" }} data-testid="section-2-title">
              Seite 2 · Verhalten der Rolle · Alltag und Stress
            </h2>

            {/* Verhalten im Alltag */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Verhalten im Alltag</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {alltagsverhalten}
              </p>
            </div>

            {/* Verhalten unter Druck */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Verhalten unter Druck</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {stress.controlled}
              </p>
            </div>

            {/* Verhalten bei starkem Stress */}
            <div style={{ marginBottom: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Verhalten bei starkem Stress</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {stress.uncontrolled}
              </p>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "0 0 40px" }} />

          {/* ── SEITE 3: TEAMWIRKUNG & RISIKEN ── */}
          <div>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 20px", paddingBottom: 8, borderBottom: "1px solid rgba(0,0,0,0.08)" }} data-testid="section-3-title">
              Seite 3 · Teamwirkung und Fehlbesetzungsrisiken
            </h2>

            {/* Führungswirkung / Teamwirkung */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>
                {data.isLeadership ? "Führungswirkung der Rolle" : "Teamwirkung der Rolle"}
              </p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {teamwirkung}
              </p>
            </div>

            {/* Spannungsfelder */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Spannungsfelder der Rolle</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, margin: "0 0 12px" }}>
                Typische Spannungen dieser Rolle sind:
              </p>
              <div style={{ paddingLeft: 4 }}>
                {spannungsfelder.map((sf, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1D1D1F", marginTop: 8, flexShrink: 0, opacity: 0.4 }} />
                    <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{sf}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "12px 0 0", textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {data.dom.key === "imp"
                  ? "Die Person muss diese Gegensätze situativ ausbalancieren, ohne dabei das Tempo und die Umsetzungsstärke zu verlieren."
                  : data.dom.key === "int"
                  ? "Die Person muss diese Gegensätze situativ ausbalancieren, ohne dabei den persönlichen Kontakt und das Vertrauen zu verlieren."
                  : "Die Person muss diese Gegensätze situativ ausbalancieren, ohne dabei die Sorgfalt und Qualitätssicherung zu verlieren."}
              </p>
            </div>

            {/* Fehlbesetzungsrisiken */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>Fehlbesetzungsrisiken</p>
              {fehlbesetzung.map((risk, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#3A3A3C", margin: "0 0 8px", fontStyle: "italic" }}>{risk.label}</p>
                  <div style={{ paddingLeft: 4 }}>
                    {risk.bullets.map((b, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF3B30", marginTop: 8, flexShrink: 0, opacity: 0.5 }} />
                        <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Typischer Kandidat (AI-generiert) */}
            {(kandidatenText || kandidatenLoading || kandidatenError) && (
              <div style={{ marginBottom: 28 }} data-testid="section-kandidatenprofil">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Typischer Kandidat für diese Rolle</p>
                {kandidatenLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "2px solid rgba(0,113,227,0.2)",
                      borderTopColor: "#0071E3",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <span style={{ fontSize: 13, color: "#8E8E93" }}>Wird generiert...</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : kandidatenError ? (
                  <p style={{ fontSize: 13, color: "#8E8E93", margin: 0, fontStyle: "italic" }}>
                    Kandidatenprofil konnte nicht geladen werden.
                  </p>
                ) : (
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any }} lang="de" data-testid="text-kandidatenprofil">
                    {kandidatenText}
                  </p>
                )}
              </div>
            )}

            {/* Entscheidungsfazit */}
            <div style={{
              marginTop: 32, padding: "24px 28px", borderRadius: 16,
              background: "linear-gradient(135deg, rgba(0,113,227,0.04), rgba(0,113,227,0.02))",
              border: "1px solid rgba(0,113,227,0.1)",
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>Entscheidungsfazit</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 14px", textAlign: "justify", textAlignLast: "left" as any }} lang="de">
                {fazit.kernsatz}
              </p>
              <div style={{ paddingLeft: 4 }}>
                {fazit.persoenlichkeit.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <CheckCircle style={{ width: 16, height: 16, color: "#34C759", marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{p}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "14px 0 0", textAlign: "justify", textAlignLast: "left" as any, fontWeight: 500 }} lang="de">
                {abschlussText}
              </p>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "#C7C7CC", margin: 0, letterSpacing: "0.02em" }}>
              bioLogic RoleDynamics · Strukturanalyse · Erstellt am {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
