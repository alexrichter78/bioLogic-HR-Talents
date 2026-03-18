import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Download, AlertTriangle, BarChart3, Briefcase, Users, Sun, Gauge, Flame } from "lucide-react";
import GlobalNav from "@/components/global-nav";
import { BERUFE } from "@/data/berufe";
import logoSrc from "@assets/LOGO_bio_1773853681939.png";

const COLORS = { imp: "#C41E3A", int: "#F39200", ana: "#1A5DAB" };

const cleanTaskName = (n: string) => n.replace(/\.\s*$/, "").replace(/,\s*$/, "");

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
  const gap1 = max.value - second.value;
  const gap2 = second.value - third.value;

  const isExtreme = max.value >= 60 || gap1 >= 18;
  const isClear = gap1 >= 8;
  const isDual = gap1 <= 4 && gap2 >= 6;
  const isFullBal = gap1 <= 5 && gap2 <= 5;
  const isBalTendency = gap1 <= 7 && gap2 <= 7 && max.value > second.value;

  if (isExtreme) return { type: `strong_${max.key}` as ProfileType, intensity: "strong" };
  if (isDual) {
    const k1 = max.key, k2 = second.key;
    const hybridKey = `hybrid_${k1}_${k2}`;
    const validHybrids = ["hybrid_imp_ana", "hybrid_ana_int", "hybrid_imp_int"];
    const reverseMap: Record<string, string> = { "hybrid_ana_imp": "hybrid_imp_ana", "hybrid_int_ana": "hybrid_ana_int", "hybrid_int_imp": "hybrid_imp_int" };
    const resolved = validHybrids.includes(hybridKey) ? hybridKey : (reverseMap[hybridKey] || "hybrid_imp_ana");
    const hybridIntensity: Intensity = gap2 >= 15 ? "strong" : gap2 >= 8 ? "clear" : "light";
    return { type: resolved as ProfileType, intensity: hybridIntensity };
  }
  if (isClear) return { type: `dominant_${max.key}` as ProfileType, intensity: "clear" };
  if (isFullBal) return { type: "balanced_all", intensity: "balanced" };
  if (isBalTendency) return { type: `light_${max.key}` as ProfileType, intensity: "light" };
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

function buildStressTexts(bg: BG, isLeadership: boolean, fuehrungstyp: string) {
  const vals = [
    { key: "imp", value: bg.imp },
    { key: "int", value: bg.int },
    { key: "ana", value: bg.ana },
  ].sort((a, b) => b.value - a.value || SORT_PRIORITY[a.key] - SORT_PRIORITY[b.key]);
  const [top, mid] = vals;
  const gap12 = top.value - mid.value;
  const gap23 = mid.value - vals[2].value;
  const hasDualDominance = gap12 <= 4 && gap23 >= 6;
  const hasFullSymmetry = gap12 <= 5 && gap23 <= 5;

  const fk = isLeadership ? "Die Führungskraft" : "Die Person";
  const fkLower = isLeadership ? "die Führungskraft" : "die Person";
  const isFachlich = fuehrungstyp === "Fachliche Führung";
  const isDisziplinarisch = fuehrungstyp.startsWith("Disziplinarische");
  const isKoordination = fuehrungstyp.startsWith("Projekt");

  let controlled = "";
  if (hasFullSymmetry) {
    controlled = isLeadership
      ? `Unter zunehmendem Arbeitsdruck fehlt tendenziell eine klare Führungsrichtung. ${fk} neigt dazu, zwischen verschiedenen Herangehensweisen zu wechseln. Mal wird eher schnell entschieden, mal eher abgestimmt, mal eher analysiert. ${isDisziplinarisch ? "Das Team verliert dadurch tendenziell die Orientierung, weil die Führungslinie schwer einzuschätzen ist." : isFachlich ? "Im fachlichen Bereich kann dadurch eher Unsicherheit entstehen, weil klare Vorgaben fehlen." : "Im Projekt kann das eher zu Verzögerungen führen, weil die Koordinationslinie unklar wird."}`
      : "Unter zunehmendem Arbeitsdruck fehlt tendenziell eine klare Richtung. Die Person neigt dazu, zwischen verschiedenen Herangehensweisen zu wechseln. Mal handelt sie eher schnell, mal sucht sie eher den Austausch, mal vertieft sie sich vermehrt in Details. Das kann im Team zu Verunsicherung führen, weil das Verhalten schwer einzuschätzen ist.";
  } else if (hasDualDominance) {
    controlled = isLeadership
      ? `Unter zunehmendem Arbeitsdruck setzt sich tendenziell eine der beiden starken Seiten durch. ${fk} fokussiert sich dann eher auf ${behaviorDesc(top.key)} oder auf ${behaviorDesc(mid.key)}. ${isDisziplinarisch ? "Das schafft kurzfristig Klarheit für das Team. Die andere Führungsqualität kann dabei eher zu kurz kommen." : isFachlich ? "Das stabilisiert kurzfristig die fachliche Steuerung. Die andere Qualität tritt tendenziell in den Hintergrund." : "Das gibt dem Projekt kurzfristig Richtung. Die andere Seite kann dabei eher vernachlässigt werden."}`
      : `Unter zunehmendem Arbeitsdruck setzt sich tendenziell eine der beiden starken Seiten durch. Die Person fokussiert sich dann eher auf ${behaviorDesc(top.key)} oder auf ${behaviorDesc(mid.key)}. Das schafft kurzfristig Klarheit und stabilisiert die Situation. Gleichzeitig kann die andere Seite eher zu kurz kommen.`;
  } else {
    controlled = isLeadership
      ? `Unter zunehmendem Arbeitsdruck zeigt sich die Stärke der Führung besonders deutlich. ${fk} setzt dann verstärkt auf ${behaviorDesc(top.key)}. ${isDisziplinarisch ? "Das gibt dem Team Sicherheit und klare Orientierung." : isFachlich ? "Das sichert die fachliche Qualität und gibt dem Bereich Stabilität." : "Das gibt dem Projekt Richtung und Verlässlichkeit."} Andere Anforderungen treten tendenziell in den Hintergrund.`
      : `Unter zunehmendem Arbeitsdruck zeigt sich die Stärke der Stelle besonders deutlich. Die Person setzt dann verstärkt auf ${behaviorDesc(top.key)}. Das gibt dem Umfeld Sicherheit und Orientierung. Andere Anforderungen treten tendenziell in den Hintergrund.`;
  }

  let uncontrolled = "";
  const midSecClose = gap23 <= 5;
  const fSuffix = isDisziplinarisch
    ? " Das kann die Führungswirkung im Team beeinträchtigen."
    : isFachlich
    ? " Das kann die fachliche Steuerung beeinträchtigen."
    : isKoordination
    ? " Das kann die Koordination im Projekt beeinträchtigen."
    : "";

  if (hasFullSymmetry) {
    uncontrolled = isLeadership
      ? `In nicht mehr kontrollierbaren Situationen versucht ${fkLower} eher, mehrere Perspektiven gleichzeitig zu berücksichtigen: Tempo, Fakten und Beziehungen. Der Entscheidungsprozess dauert dadurch tendenziell länger, weil verschiedene Aspekte parallel abgewogen werden.${fSuffix}`
      : "In nicht mehr kontrollierbaren Situationen versucht die Person eher, mehrere Perspektiven gleichzeitig zu berücksichtigen: Tempo, Fakten und Beziehungen. Der Entscheidungsprozess dauert dadurch tendenziell länger, weil verschiedene Aspekte parallel abgewogen werden.";
  } else if (hasDualDominance) {
    if ((top.key === "imp" && mid.key === "ana") || (top.key === "ana" && mid.key === "imp")) {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen kann eher ein Wechsel zwischen schnellem Handeln und gründlicher Prüfung entstehen. ${fk} entscheidet zunächst zügig, neigt danach jedoch vermehrt dazu, die Entscheidung erneut zu analysieren und zu überprüfen.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen kann eher ein Wechsel zwischen schnellem Handeln und gründlicher Prüfung entstehen. Die Person entscheidet zunächst zügig, neigt danach jedoch vermehrt dazu, die Entscheidung erneut zu analysieren und zu überprüfen.";
    } else if ((top.key === "imp" && mid.key === "int") || (top.key === "int" && mid.key === "imp")) {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen schwankt ${fkLower} eher zwischen direkter Handlung und dem Wunsch, Beziehungen zu stabilisieren. Entscheidungen werden zunächst klar getroffen, tendenziell aber später noch einmal angepasst.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen schwankt die Person eher zwischen direkter Handlung und dem Wunsch, Beziehungen zu stabilisieren. Entscheidungen werden zunächst klar getroffen, tendenziell aber später noch einmal angepasst.";
    } else {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen versucht ${fkLower} vermehrt, gleichzeitig sachliche Richtigkeit und zwischenmenschliche Wirkung zu berücksichtigen. Es dauert dadurch tendenziell länger, bis eine Entscheidung endgültig getroffen wird.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen versucht die Person vermehrt, gleichzeitig sachliche Richtigkeit und zwischenmenschliche Wirkung zu berücksichtigen. Es dauert dadurch tendenziell länger, bis eine Entscheidung endgültig getroffen wird.";
    }
  } else if (top.key === "imp") {
    if (midSecClose) {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen verliert ${fkLower} tendenziell ihre klare Handlungsrichtung. Statt sofort zu entscheiden, beginnt eher ein innerer Wechsel zwischen Analyse und Beziehungsorientierung. Entscheidungen können dadurch vermehrt länger dauern oder mehrfach angepasst werden.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen verliert die Person tendenziell ihre klare Handlungsrichtung. Statt sofort zu entscheiden, beginnt eher ein innerer Wechsel zwischen Analyse und Beziehungsorientierung. Entscheidungen können dadurch vermehrt länger dauern oder mehrfach angepasst werden, weil zwei unterschiedliche Denkweisen gleichzeitig Einfluss nehmen.";
    } else if (mid.key === "ana") {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen verliert ${fkLower} tendenziell einen Teil ihrer schnellen Entscheidungsstärke. Sie beginnt eher stärker zu hinterfragen und sucht vermehrt nach zusätzlichen Informationen. Entscheidungen werden zunächst schnell angestoßen, anschließend jedoch wieder überprüft oder angepasst.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen verliert die Person tendenziell einen Teil ihrer schnellen Entscheidungsstärke. Sie beginnt eher stärker zu hinterfragen und sucht vermehrt nach zusätzlichen Informationen. Dadurch kann es passieren, dass Entscheidungen zunächst schnell angestoßen, anschließend jedoch wieder überprüft oder angepasst werden.";
    } else {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen schwankt ${fkLower} verstärkt zwischen schnellem Handeln und dem Wunsch, auf das Team Rücksicht zu nehmen. Entscheidungen werden zunächst eher direkt getroffen, später aber teilweise wieder relativiert, um Spannungen zu vermeiden.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen schwankt die Person verstärkt zwischen schnellem Handeln und dem Wunsch, auf Menschen und Beziehungen Rücksicht zu nehmen. Entscheidungen werden zunächst eher direkt getroffen, später aber teilweise wieder relativiert, um Spannungen oder Konflikte zu vermeiden.";
    }
  } else if (top.key === "ana") {
    if (midSecClose) {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen verliert ${fkLower} tendenziell ihre klare Struktur. Sie schwankt eher zwischen dem Wunsch, schnell zu handeln, und dem Bedürfnis, Beziehungen zu stabilisieren. Entscheidungen werden dadurch vermehrt überdacht oder angepasst.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen verliert die Person tendenziell ihre klare Struktur. Sie schwankt eher zwischen dem Wunsch, schnell zu handeln, und dem Bedürfnis, Beziehungen zu stabilisieren. Dadurch kann es passieren, dass Entscheidungen vermehrt überdacht oder angepasst werden.";
    } else if (mid.key === "imp") {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen steigt bei ${fkLower} verstärkt der Wunsch, Entscheidungen schneller zu treffen. Sie verlässt dann eher ihre sonst gründliche Vorgehensweise. Entscheidungen werden tendenziell schneller getroffen, ohne alle Details vollständig zu prüfen.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen steigt verstärkt der Wunsch, Entscheidungen schneller zu treffen. Die Person verlässt dann eher ihre sonst gründliche Vorgehensweise. Entscheidungen werden tendenziell schneller getroffen, ohne alle Details vollständig zu prüfen.";
    } else {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen versucht ${fkLower} vermehrt, neben Fakten auch die Wirkung auf das Team zu berücksichtigen. Entscheidungen können dadurch tendenziell länger dauern, weil sowohl sachliche Aspekte als auch zwischenmenschliche Auswirkungen bedacht werden.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen versucht die Person vermehrt, neben Fakten auch die Wirkung auf Menschen zu berücksichtigen. Entscheidungen können dadurch tendenziell länger dauern, weil sowohl sachliche Aspekte als auch zwischenmenschliche Auswirkungen bedacht werden.";
    }
  } else {
    // top.key === "int"
    if (midSecClose) {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen gerät ${fkLower} eher zwischen zwei unterschiedliche Entscheidungswege: schnelle Handlung und gründliche Analyse. Entscheidungen können dadurch tendenziell länger dauern oder vermehrt angepasst werden.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen gerät die Person eher zwischen zwei unterschiedliche Entscheidungswege: schnelle Handlung und gründliche Analyse. Entscheidungen können dadurch tendenziell länger dauern oder vermehrt angepasst werden.";
    } else if (mid.key === "imp") {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen steigt bei ${fkLower} verstärkt der Wunsch nach schneller Handlung. Sie verlässt dann eher ihre sonst stark beziehungsorientierte Vorgehensweise und entscheidet tendenziell direkter und spontaner. Für das Team kann dies ungewohnt entschlossen wirken.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen steigt verstärkt der Wunsch nach schneller Handlung. Die Person verlässt dann eher ihre sonst stark beziehungsorientierte Vorgehensweise und entscheidet tendenziell direkter und spontaner. Für andere kann dies ungewohnt entschlossen wirken.";
    } else {
      uncontrolled = isLeadership
        ? `In nicht mehr kontrollierbaren Situationen versucht ${fkLower} verstärkt, Entscheidungen auch sachlich abzusichern. Sie neigt dann eher dazu, länger über Optionen nachzudenken oder zusätzliche Informationen einzuholen, bevor eine Entscheidung endgültig getroffen wird.${fSuffix}`
        : "In nicht mehr kontrollierbaren Situationen versucht die Person verstärkt, Entscheidungen auch sachlich abzusichern. Sie neigt dann eher dazu, länger über Optionen nachzudenken oder zusätzliche Informationen einzuholen, bevor eine Entscheidung endgültig getroffen wird.";
    }
  }

  return { controlled, uncontrolled };
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function buildTeamwirkung(data: ReportData) {
  const { isLeadership, dom, sec, fuehrungstyp, profileType } = data;

  if (isLeadership) {
    const ft = lowerFirst(fuehrungstyp);
    if (profileType === "balanced_all") {
      return `Die Stelle übernimmt ${ft} im Team. Die Führungskraft wechselt situativ zwischen verschiedenen Herangehensweisen – mal entschlossen und tempoorientiert, mal beziehungsorientiert, mal analytisch-strukturiert. Teammitglieder erleben eine flexible Führung, die sich an unterschiedliche Anforderungen anpassen kann. Die Herausforderung liegt darin, dabei eine klare und verlässliche Linie zu halten.`;
    }
    if (profileType === "hybrid_imp_ana") {
      return `Die Stelle übernimmt ${ft} im Team. Die Führungskraft verbindet Tempo und Struktur – Entscheidungen werden zügig getroffen und gleichzeitig sorgfältig abgesichert. Teammitglieder orientieren sich an der klaren Richtung und der nachvollziehbaren Vorgehensweise. Die Herausforderung liegt darin, die zwischenmenschliche Ebene dabei nicht zu vernachlässigen.`;
    }
    if (profileType === "hybrid_imp_int") {
      return `Die Stelle übernimmt ${ft} im Team. Die Führungskraft verbindet Durchsetzungskraft mit persönlicher Zugewandtheit – Ergebnisse werden konsequent vorangetrieben, gleichzeitig wird auf den Zusammenhalt im Team geachtet. Teammitglieder erleben Dynamik und Aufmerksamkeit. Die Herausforderung liegt darin, Entscheidungen auch analytisch ausreichend abzusichern.`;
    }
    if (profileType === "hybrid_ana_int") {
      return `Die Stelle übernimmt ${ft} im Team. Die Führungskraft verbindet fachliche Tiefe mit kommunikativer Kompetenz – Entscheidungen werden fundiert vorbereitet und verständlich kommuniziert. Teammitglieder vertrauen auf die sachliche Herangehensweise und fühlen sich gleichzeitig eingebunden. Die Herausforderung liegt darin, Entscheidungen auch bei Unsicherheit zeitnah zu treffen.`;
    }
    if (dom.key === "imp") {
      return `Die Stelle übernimmt ${ft} im Team. Die Führungskraft gibt das Tempo vor, setzt klare Prioritäten und trifft Entscheidungen verbindlich. Teammitglieder wissen, woran sie sind. ${sec.key === "int" ? "Dabei achtet die Führungskraft auch auf den persönlichen Kontakt und die Stimmung im Team." : "Dabei sorgt die Führungskraft auch für die nötige Struktur und Qualitätssicherung."} In Situationen mit hohem Handlungsdruck zeigt diese Führung ihre größte Stärke.`;
    }
    if (dom.key === "int") {
      return `Die Stelle übernimmt ${ft} im Team. Die Führungskraft baut Vertrauen auf, bringt unterschiedliche Perspektiven zusammen und sorgt dafür, dass Entscheidungen vom Team getragen werden. ${sec.key === "ana" ? "Dabei sichert sie Ergebnisse auch über klare Strukturen und nachvollziehbare Prozesse ab." : "Dabei treibt sie Ergebnisse auch aktiv voran und setzt klare Prioritäten."} Teammitglieder orientieren sich an dieser Person besonders bei schwierigen zwischenmenschlichen Situationen.`;
    }
    return `Die Stelle übernimmt ${ft} im Team. Die Führungskraft steuert über fachliche Expertise, klare Standards und nachvollziehbare Prozesse. ${sec.key === "int" ? "Dabei achtet sie auch auf Kommunikation und ein konstruktives Miteinander im Team." : "Dabei sorgt sie auch für Umsetzungstempo und klare Entscheidungen."} Teammitglieder vertrauen auf die methodische Sicherheit und die sachliche Herangehensweise.`;
  }

  if (profileType === "balanced_all") {
    return "Die Stelle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung über Vielseitigkeit und Anpassungsfähigkeit. Kolleginnen und Kollegen erleben eine Person, die je nach Situation unterschiedlich reagiert – mal pragmatisch und schnell, mal einfühlsam und gesprächsbereit, mal gründlich und strukturiert. Die Herausforderung liegt darin, dabei als verlässlich und berechenbar wahrgenommen zu werden.";
  }
  if (profileType === "hybrid_imp_ana") {
    return "Die Stelle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung über die Verbindung von Tempo und Gründlichkeit. Kolleginnen und Kollegen orientieren sich an dieser Arbeitsweise, besonders wenn Aufgaben schnell und gleichzeitig sorgfältig erledigt werden müssen.";
  }
  if (profileType === "hybrid_imp_int") {
    return "Die Stelle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung über die Verbindung von Handlungsorientierung und persönlichem Kontakt. Kolleginnen und Kollegen erleben eine Person, die Ergebnisse vorantreibt und gleichzeitig den Zusammenhalt fördert.";
  }
  if (profileType === "hybrid_ana_int") {
    return "Die Stelle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung über die Verbindung von fachlicher Tiefe und kommunikativer Kompetenz. Kolleginnen und Kollegen orientieren sich an der sachlichen Herangehensweise und schätzen die verständliche Kommunikation.";
  }
  if (dom.key === "imp") {
    return `Die Stelle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung vor allem über schnelle Ergebnisse und klare Priorisierung. ${sec.key === "int" ? "Dabei pflegt die Person auch den persönlichen Kontakt und nimmt Rücksicht auf die Dynamik im Team." : "Dabei achtet die Person auch auf Genauigkeit und eine fundierte Grundlage für Entscheidungen."} Kolleginnen und Kollegen orientieren sich an dieser Arbeitsweise, besonders bei Umsetzungsfragen und operativen Entscheidungen.`;
  }
  if (dom.key === "int") {
    return `Die Stelle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung vor allem über Vertrauen und persönlichen Kontakt. ${sec.key === "ana" ? "Dabei sorgt die Person auch für Ordnung und eine verlässliche Arbeitsweise." : "Dabei bringt die Person auch Umsetzungsstärke und Eigeninitiative ein."} Kolleginnen und Kollegen orientieren sich an dieser Person, besonders bei zwischenmenschlichen Situationen und Teamabstimmungen.`;
  }
  return `Die Stelle hat keine direkte Führungsverantwortung. Im Team entsteht Wirkung vor allem über fachliche Tiefe und verlässliche Arbeitsergebnisse. ${sec.key === "int" ? "Dabei pflegt die Person auch den Austausch im Team und kommuniziert Ergebnisse verständlich." : "Dabei bringt die Person auch Umsetzungsstärke und Eigeninitiative ein, damit Analysen in konkretes Handeln überführt werden."} Kolleginnen und Kollegen orientieren sich an dieser Arbeitsweise, besonders bei fachlichen Fragen und Prozessthemen.`;
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
      "überwiegend operativ": "Der Aufgabencharakter ist überwiegend operativ. Die Stelle wirkt primär über direkte Umsetzung und konkretes Handeln.",
      "überwiegend systemisch": "Der Aufgabencharakter ist überwiegend systemisch. Die Stelle wirkt über Vernetzung, Koordination und das Zusammenführen verschiedener Perspektiven.",
      "überwiegend strategisch": "Der Aufgabencharakter ist überwiegend strategisch. Die Stelle wirkt über langfristige Planung, Richtungsentscheidungen und Steuerung.",
      "Gemischt": "Der Aufgabencharakter ist gemischt. Die Stelle wechselt situativ zwischen operativer Umsetzung, Koordination und strategischer Steuerung.",
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
    parts.push(`Die Stelle umfasst ${lowerFirst(data.fuehrungstyp)}.`);
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
    return "Der Erfolgsfokus passt zur zentralen Anforderung der Stelle. Erfolg wird im stärksten Bereich gemessen. Das erhöht die Wahrscheinlichkeit, dass die Stelle ihre Wirkung entfaltet.";
  }
  if (unique.every(u => u === data.dom.key || u === data.sec.key)) {
    return "Der Erfolgsfokus wird durch die beiden stärksten Anforderungen der Stelle abgedeckt. Die natürlichen Stärken der Stelle greifen hier direkt. Das erleichtert die Zielerreichung.";
  }
  const missingKey = unique.find(u => u !== data.dom.key && u !== data.sec.key);
  const missingDesc = missingKey === "imp" ? "schnelle Umsetzung und Ergebnisorientierung" : missingKey === "int" ? "Beziehungsarbeit und persönlichen Kontakt" : "systematische Analyse und Prozessqualität";
  return `Der Erfolgsfokus verlangt unter anderem ${missingDesc}. Diese Anforderung ist im Profil der Stelle nachrangig. Hier muss bewusst gesteuert werden, um den Erfolg abzusichern.`;
}

function buildProfilkonflikt(data: ReportData): string | null {
  const hauptDom = dominant(data.haupt);
  const { dom } = data;
  if (hauptDom.key === dom.key) return null;
  const hauptBehavior = hauptDom.key === "imp" ? "schnelles Handeln und Umsetzung" : hauptDom.key === "int" ? "persönlichen Kontakt und Beziehungsarbeit" : "strukturierte Analyse und Sorgfalt";
  const gesamtBehavior = dom.key === "imp" ? "Entscheidungskraft und Tempo" : dom.key === "int" ? "Beziehungsgestaltung und Kommunikation" : "methodisches Arbeiten und Qualitätssicherung";
  return `Hinweis: Die Kerntätigkeiten der Stelle verlangen vor allem ${hauptBehavior}. Das Gesamtprofil verschiebt sich jedoch in Richtung ${gesamtBehavior}. Rahmenbedingungen und ergänzende Anforderungen verändern das Anforderungsprofil. Im Besetzungsprozess sollte geprüft werden, ob die Person primär die Kerntätigkeiten oder das Gesamtpaket abbilden kann.`;
}

function buildKomponentenBedeutung(data: ReportData): { key: string; label: string; color: string; text: string; warning: string }[] {
  const KOMP_TEXTE: Record<string, { label: string; color: string; text: string; warning: string }> = {
    ana: {
      label: "Analytisch",
      color: COLORS.ana,
      text: "Sichert Struktur, Sorgfalt und nachvollziehbare Abläufe.",
      warning: "Fehlt dieser Anteil, entstehen Fehler in Planung, Kalkulation und Dokumentation.",
    },
    imp: {
      label: "Impulsiv",
      color: COLORS.imp,
      text: "Steht für zügiges Handeln, klare Prioritäten und konsequente Umsetzung.",
      warning: "Fehlt dieser Anteil, werden Entscheidungen verzögert und Chancen nicht genutzt.",
    },
    int: {
      label: "Intuitiv",
      color: COLORS.int,
      text: "Unterstützt das Erkennen von Bedürfnissen und die passende Abstimmung im Team.",
      warning: "Fehlt dieser Anteil, leidet die Zusammenarbeit und Vertrauen sinkt.",
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
      label: "Wenn Tempo wichtiger wird als Absicherung",
      bullets: [
        dom.key === "int" ? "Beratung wird hektischer, Gesprächsqualität sinkt" : "Entscheidungen werden zu schnell und ohne Absicherung getroffen",
        isLeadership ? "Das Team kann das Tempo nicht mithalten, Frustration entsteht" : "Abstimmung mit Kolleginnen und Kollegen leidet",
        dom.key === "int" ? "Kunden und Gesprächspartner fühlen sich weniger individuell betreut" : "Prozessfehler und Qualitätsprobleme nehmen zu",
      ],
    });
  }

  if (dom.key === "ana" || wk.key === "int") {
    risks.push({
      label: "Wenn Kontrolle den persönlichen Kontakt verdrängt",
      bullets: [
        dom.key === "int" ? "Beratung wirkt distanzierter und unpersönlich" : "Überanalyse bremst Entscheidungen und Umsetzung",
        "Zwischenmenschliche Signale werden übersehen oder ignoriert",
        isLeadership ? "Teammitglieder fühlen sich kontrolliert statt geführt" : "Zusammenarbeit wird als starr und unflexibel empfunden",
      ],
    });
  }

  if (wk.key === "ana" || (dom.key === "int" && sec.key === "imp")) {
    risks.push({
      label: "Wenn Beziehungspflege auf Kosten der Struktur geht",
      bullets: [
        "Wirtschaftliche und prozessuale Aspekte werden vernachlässigt",
        "Abläufe verlieren an Klarheit und Verbindlichkeit",
        isLeadership ? "Standards werden zugunsten von Harmonie aufgeweicht" : "Dokumentation und Nachvollziehbarkeit leiden",
      ],
    });
  }

  if (wk.key === "imp") {
    risks.push({
      label: "Wenn Gründlichkeit die Umsetzung blockiert",
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
    const namen = conflicting.slice(0, 2).map((t: any) => cleanTaskName(t.name)).join(" und ");
    risks.push({
      label: "Wenn Kerntätigkeiten und Profil auseinanderfallen",
      bullets: [
        `Hochprioritäre Tätigkeiten wie ${namen} verlangen ein anderes Verhalten als das Stellenprofil`,
        "Die Stelle fordert dauerhaft in einem Bereich, der nicht der natürlichen Stärke entspricht",
        "Kompensation ist kurzfristig möglich. Langfristig steigen Erschöpfung und Fehlerquote",
      ],
    });
  }

  return risks.slice(0, 3);
}

function getFazitVariant(bg: BG): number {
  const vals = [
    { key: "imp", value: bg.imp },
    { key: "int", value: bg.int },
    { key: "ana", value: bg.ana },
  ].sort((a, b) => b.value - a.value || SORT_PRIORITY[a.key] - SORT_PRIORITY[b.key]);
  const [top, mid, bot] = vals;
  const gap1 = top.value - mid.value;
  const gap2 = mid.value - bot.value;

  if (gap1 <= 5 && gap2 <= 5) return 13;
  if (gap1 <= 4 && gap2 >= 6) {
    if (gap2 > 10) {
      if ((top.key === "imp" && mid.key === "ana") || (top.key === "ana" && mid.key === "imp")) return 10;
      if ((top.key === "imp" && mid.key === "int") || (top.key === "int" && mid.key === "imp")) return 11;
      return 12;
    }
    if ((top.key === "imp" && mid.key === "ana") || (top.key === "ana" && mid.key === "imp")) return 4;
    if ((top.key === "imp" && mid.key === "int") || (top.key === "int" && mid.key === "imp")) return 5;
    return 6;
  }
  if (gap2 <= 4 && gap1 >= 6) {
    if (top.key === "imp") return 7;
    if (top.key === "ana") return 8;
    return 9;
  }
  if (top.key === "imp") return 1;
  if (top.key === "ana") return 2;
  return 3;
}

function buildFazit(data: ReportData): { titel: string; absaetze: string[] } {
  const variant = getFazitVariant(data.gesamt);
  const isL = data.isLeadership;

  const texte: Record<number, { titel: string; ohne: string[]; mit: string[] }> = {
    1: {
      titel: "Direkte Umsetzung und schnelles Handeln",
      ohne: [
        "In dieser Stelle werden Themen häufig direkt aufgegriffen und zügig in Handlung überführt. Aufgaben bleiben selten lange liegen, sondern werden aktiv vorangetrieben.",
        "Die Stärke dieser Ausrichtung liegt darin, Bewegung zu schaffen und Entscheidungen schnell in konkrete Schritte umzusetzen.",
        "Die Herausforderung besteht darin, dass Entscheidungen manchmal schneller getroffen werden, als alle Hintergründe vollständig geprüft sind.",
      ],
      mit: [
        "In dieser Stelle entsteht Führung häufig durch schnelles Handeln und klare Entscheidungen. Themen werden aktiv aufgegriffen und zügig vorangetrieben.",
        "Für das Team bedeutet das meist eine klare Richtung und spürbare Dynamik. Aufgaben kommen schnell in Bewegung und Entscheidungen werden nicht lange hinausgeschoben.",
        "Die Stärke dieser Ausrichtung liegt darin, Veränderungen anzustoßen und Themen konsequent voranzubringen.",
        "Die Herausforderung besteht darin, dass Entscheidungen gelegentlich schneller getroffen werden, als alle Hintergründe vollständig geprüft sind. Für das Team kann dadurch gelegentlich Nachsteuerung notwendig werden.",
      ],
    },
    2: {
      titel: "Sorgfältige Prüfung vor wichtigen Schritten",
      ohne: [
        "In dieser Stelle werden Situationen zunächst genau betrachtet. Informationen und Zusammenhänge werden geprüft, bevor eine Entscheidung getroffen wird.",
        "Die Stärke liegt in durchdachten Entscheidungen und einer hohen Verlässlichkeit bei wichtigen Aufgaben.",
        "Die Herausforderung besteht darin, dass Entscheidungen länger vorbereitet werden können, wenn noch offene Fragen geklärt werden sollen.",
      ],
      mit: [
        "In dieser Stelle entsteht Führung häufig über eine gründliche Betrachtung von Situationen. Entscheidungen werden vorbereitet, bevor sie umgesetzt werden.",
        "Für das Team bedeutet das meist klare Orientierung und nachvollziehbare Entscheidungen. Aufgaben werden eingeordnet, Hintergründe werden berücksichtigt.",
        "Die Stärke liegt darin, verlässliche und gut begründete Entscheidungen zu treffen.",
        "Die Herausforderung besteht darin, dass Entscheidungen länger dauern können, wenn zunächst alle Informationen geklärt werden sollen.",
      ],
    },
    3: {
      titel: "Starkes Gespür für Menschen und Situationen",
      ohne: [
        "In dieser Stelle spielen zwischenmenschliche Signale und situative Eindrücke eine wichtige Rolle. Entscheidungen entstehen häufig aus dem Verständnis für Menschen und die aktuelle Situation.",
        "Die Stärke liegt darin, Zusammenarbeit und Wirkung auf andere gut einschätzen zu können.",
        "Die Herausforderung besteht darin, Entscheidungen ausreichend sachlich abzusichern.",
      ],
      mit: [
        "In dieser Stelle entsteht Führung häufig über das Verständnis für Menschen und die Situation im Team. Entscheidungen berücksichtigen stark die Wirkung auf Zusammenarbeit und Stimmung.",
        "Für das Team bedeutet das oft ein hohes Maß an Aufmerksamkeit für Beziehungen, Kommunikation und gegenseitige Unterstützung.",
        "Die Stärke liegt darin, ein gutes Miteinander zu fördern und Spannungen früh wahrzunehmen.",
        "Die Herausforderung besteht darin, Entscheidungen ausreichend sachlich abzusichern und nicht zu stark aus der aktuellen Situation heraus zu treffen.",
      ],
    },
    4: {
      titel: "Tempo verbunden mit sachlicher Überprüfung",
      ohne: [
        "In dieser Stelle verbinden sich Tempo und gedankliche Prüfung. Themen werden aktiv angegangen, gleichzeitig werden Hintergründe und Folgen berücksichtigt.",
        "Die Stärke liegt darin, Entscheidungen voranzubringen und dennoch nachvollziehbar zu begründen.",
        "Die Herausforderung besteht darin, das richtige Gleichgewicht zwischen schneller Umsetzung und gründlicher Prüfung zu halten.",
      ],
      mit: [
        "In dieser Stelle verbinden sich zügige Entscheidungen mit einer gedanklichen Prüfung der Situation. Themen werden aktiv angegangen, gleichzeitig werden Hintergründe berücksichtigt.",
        "Für das Team entsteht dadurch häufig eine gute Mischung aus Dynamik und Orientierung. Aufgaben werden vorangebracht und gleichzeitig nachvollziehbar eingeordnet.",
        "Die Stärke liegt darin, Entscheidungen voranzutreiben und dennoch eine klare Grundlage zu behalten.",
        "Die Herausforderung besteht darin, das richtige Gleichgewicht zwischen Tempo und gründlicher Prüfung zu halten.",
      ],
    },
    5: {
      titel: "Aktives Vorgehen mit Blick auf Menschen",
      ohne: [
        "In dieser Stelle werden Themen aktiv aufgegriffen, gleichzeitig wird darauf geachtet, wie Entscheidungen auf andere wirken.",
        "Die Stärke liegt darin, Bewegung zu schaffen und dabei das Miteinander im Blick zu behalten.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu stark von der aktuellen Situation oder Stimmung beeinflussen zu lassen.",
      ],
      mit: [
        "In dieser Stelle verbinden sich Aktivität und ein gutes Gespür für Menschen. Entscheidungen führen schnell zu Handlung, gleichzeitig wird auf die Wirkung im Team geachtet.",
        "Für das Team bedeutet das oft eine lebendige Zusammenarbeit und klare Bewegung in Aufgaben.",
        "Die Stärke liegt darin, Veränderungen anzustoßen und gleichzeitig das Miteinander im Blick zu behalten.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu stark von der aktuellen Situation oder Stimmung beeinflussen zu lassen.",
      ],
    },
    6: {
      titel: "Sachliche Überlegung mit Gespür für Zusammenarbeit",
      ohne: [
        "In dieser Stelle werden Entscheidungen sowohl über Fakten als auch über ihre Wirkung auf Menschen betrachtet.",
        "Die Stärke liegt darin, Lösungen zu finden, die logisch nachvollziehbar sind und gleichzeitig für andere akzeptabel bleiben.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu lange abzuwägen.",
      ],
      mit: [
        "In dieser Stelle werden Entscheidungen sowohl über Fakten als auch über ihre Wirkung auf Menschen betrachtet.",
        "Für das Team bedeutet das häufig eine ruhige und nachvollziehbare Entscheidungsweise, bei der sowohl Sachfragen als auch Zusammenarbeit berücksichtigt werden.",
        "Die Stärke liegt darin, Lösungen zu finden, die fachlich sinnvoll sind und gleichzeitig für das Team akzeptabel bleiben.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu lange abzuwägen.",
      ],
    },
    7: {
      titel: "Klare Umsetzung mit Blick für Zusammenhänge und Menschen",
      ohne: [
        "In dieser Stelle steht die Umsetzung im Vordergrund. Themen werden aktiv angegangen und Entscheidungen führen schnell zu Handlung.",
        "Gleichzeitig werden sowohl sachliche Hintergründe als auch Auswirkungen auf Menschen berücksichtigt.",
        "Die Stärke liegt darin, Entscheidungen voranzubringen und dabei mehrere Aspekte einzubeziehen.",
        "Die Herausforderung besteht darin, bei vielen Blickwinkeln eine klare Linie zu halten.",
      ],
      mit: [
        "In dieser Stelle werden Entscheidungen aktiv getroffen und zügig umgesetzt. Gleichzeitig werden sowohl Hintergründe als auch Auswirkungen auf das Team berücksichtigt.",
        "Für das Team bedeutet das häufig eine klare Richtung bei gleichzeitiger Aufmerksamkeit für Zusammenhänge und Zusammenarbeit.",
        "Die Stärke liegt darin, Entscheidungen voranzubringen und dabei mehrere Aspekte einzubeziehen.",
        "Die Herausforderung besteht darin, bei verschiedenen Blickwinkeln eine klare Linie beizubehalten.",
      ],
    },
    8: {
      titel: "Guter Überblick mit praktischer Umsetzung",
      ohne: [
        "In dieser Stelle entsteht zunächst ein klares Verständnis der Situation. Anschließend werden Entscheidungen umgesetzt und ihre Wirkung auf das Umfeld berücksichtigt.",
        "Die Stärke liegt darin, Entscheidungen auf einer guten Grundlage zu treffen und anschließend umzusetzen.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu lange vorzubereiten.",
      ],
      mit: [
        "In dieser Stelle entsteht zunächst ein klares Verständnis der Situation. Anschließend werden Entscheidungen umgesetzt und ihre Wirkung auf das Team berücksichtigt.",
        "Für das Team bedeutet das meist eine ruhige Orientierung und nachvollziehbare Entscheidungen.",
        "Die Stärke liegt darin, Entscheidungen auf einer guten Grundlage zu treffen und gleichzeitig praktisch umzusetzen.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu lange vorzubereiten.",
      ],
    },
    9: {
      titel: "Gespür für Menschen mit Handlung und Überblick",
      ohne: [
        "In dieser Stelle steht das Verständnis für Menschen und Situationen im Mittelpunkt. Gleichzeitig stehen Umsetzung und sachliche Betrachtung zur Verfügung.",
        "Die Stärke liegt darin, Entscheidungen zu treffen, die sowohl menschliche als auch praktische Aspekte berücksichtigen.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu stark an der aktuellen Situation auszurichten.",
      ],
      mit: [
        "In dieser Stelle steht das Verständnis für Menschen und Teamdynamik im Mittelpunkt. Gleichzeitig stehen Umsetzung und sachliche Betrachtung zur Verfügung.",
        "Für das Team bedeutet das häufig eine Führung, die sowohl auf Zusammenarbeit als auch auf praktische Lösungen achtet.",
        "Die Stärke liegt darin, menschliche Dynamiken zu erkennen und daraus tragfähige Entscheidungen abzuleiten.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu stark an der aktuellen Situation auszurichten.",
      ],
    },
    10: {
      titel: "Klares Vorgehen mit Tempo und Überblick",
      ohne: [
        "In dieser Stelle verbinden sich Aktivität und sachliche Betrachtung. Entscheidungen werden zügig getroffen und gleichzeitig gedanklich geprüft.",
        "Die Stärke liegt darin, Themen voranzubringen und dabei den Überblick zu behalten.",
        "Die Herausforderung besteht darin, die Wirkung von Entscheidungen auf Menschen ausreichend zu berücksichtigen.",
      ],
      mit: [
        "In dieser Stelle verbinden sich Aktivität und sachliche Betrachtung. Entscheidungen werden zügig getroffen und gleichzeitig gedanklich geprüft.",
        "Für das Team bedeutet das meist klare Orientierung und eine schnelle Umsetzung von Aufgaben.",
        "Die Stärke liegt darin, Entscheidungen voranzubringen und gleichzeitig den Überblick über Zusammenhänge zu behalten.",
        "Die Herausforderung besteht darin, auch die Wirkung von Entscheidungen auf Menschen ausreichend zu berücksichtigen.",
      ],
    },
    11: {
      titel: "Dynamisches Vorgehen mit Blick für Menschen",
      ohne: [
        "In dieser Stelle werden Themen aktiv vorangetrieben und gleichzeitig auf ihre Wirkung auf andere Menschen geachtet.",
        "Die Stärke liegt darin, Bewegung zu schaffen und dabei Beziehungen zu stabilisieren.",
        "Die Herausforderung besteht darin, Entscheidungen ausreichend sachlich zu prüfen.",
      ],
      mit: [
        "In dieser Stelle werden Themen aktiv vorangetrieben und gleichzeitig auf ihre Wirkung auf das Team geachtet.",
        "Für das Team bedeutet das häufig Bewegung, Motivation und eine hohe Aufmerksamkeit für Zusammenarbeit.",
        "Die Stärke liegt darin, Veränderungen anzustoßen und dabei Beziehungen im Team zu stabilisieren.",
        "Die Herausforderung besteht darin, Entscheidungen ausreichend sachlich zu prüfen.",
      ],
    },
    12: {
      titel: "Überlegtes Vorgehen mit Verständnis für Menschen",
      ohne: [
        "In dieser Stelle werden Entscheidungen sowohl über Fakten als auch über ihre Wirkung auf Menschen betrachtet.",
        "Die Stärke liegt darin, Lösungen zu entwickeln, die logisch nachvollziehbar und gleichzeitig für andere stimmig sind.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu lange vorzubereiten.",
      ],
      mit: [
        "In dieser Stelle werden Entscheidungen sowohl über Fakten als auch über ihre Wirkung auf Menschen betrachtet.",
        "Für das Team bedeutet das meist eine ruhige und überlegte Führung mit Blick auf Zusammenarbeit und Verständnis für unterschiedliche Perspektiven.",
        "Die Stärke liegt darin, Lösungen zu entwickeln, die fachlich nachvollziehbar und gleichzeitig für das Team stimmig sind.",
        "Die Herausforderung besteht darin, Entscheidungen nicht zu lange vorzubereiten.",
      ],
    },
    13: {
      titel: "Ausgewogene Betrachtung aus mehreren Blickwinkeln",
      ohne: [
        "In dieser Stelle stehen Handlung, sachliche Betrachtung und das Verständnis für Menschen gleichermaßen zur Verfügung.",
        "Die Stärke liegt darin, Situationen aus verschiedenen Blickwinkeln zu betrachten und flexibel auf unterschiedliche Anforderungen zu reagieren.",
        "Die Herausforderung besteht darin, bei mehreren möglichen Perspektiven eine klare Priorität zu setzen und Entscheidungen konsequent umzusetzen.",
      ],
      mit: [
        "In dieser Stelle stehen Handlung, sachliche Betrachtung und das Verständnis für Menschen gleichermaßen zur Verfügung.",
        "Für das Team bedeutet das meist eine flexible Führung, die unterschiedliche Anforderungen berücksichtigen kann.",
        "Die Stärke liegt darin, Situationen aus mehreren Blickwinkeln zu betrachten und auf Veränderungen reagieren zu können.",
        "Die Herausforderung besteht darin, bei mehreren möglichen Perspektiven eine klare Priorität zu setzen und Entscheidungen konsequent umzusetzen.",
      ],
    },
  };

  const t = texte[variant];
  return { titel: t.titel, absaetze: isL ? t.mit : t.ohne };
}

const MAX_BIO = 67;

function ProfileBar({ label, value, color }: { label: string; value: number; color: string }) {
  const widthPct = (value / MAX_BIO) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 14, color: "#48484A", width: 72, flexShrink: 0, fontWeight: 500 }}>{label}</span>
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
      const beruf = state.beruf || "Unbekannte Stelle";
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
    if (!data) return;
    setPdfLoading(true);
    try {
      const { buildRollenprofilPdf } = await import("@/lib/rollenprofil-pdf-builder");

      const stress = buildStressTexts(data.gesamt, data.isLeadership, data.fuehrungstyp);
      const hauptTaetigkeiten = (data.taetigkeiten || []).filter((t: any) => t.kategorie === "haupt");
      const hochItems = hauptTaetigkeiten.filter((t: any) => t.niveau === "Hoch");
      const erfolgsfokusLabelsLocal = data.erfolgsfokusIndices.map(i => ERFOLGSFOKUS_LABELS[i]).filter(Boolean);

      const topT = hauptTaetigkeiten.slice(0, 3).map((t: any) => cleanTaskName(t.name));
      const introText = (() => {
        const fk = data.isLeadership;
        const pt = data.profileType;
        if (pt === "balanced_all") return `Diese Anforderungen verlangen eine vielseitige Persönlichkeit, die situativ zwischen zügigem Handeln, persönlichem Kontakt und sorgfältigem Arbeiten wechseln kann. Entscheidend ist die Fähigkeit, flexibel auf unterschiedliche Situationen zu reagieren, ohne dabei an Verbindlichkeit und Verlässlichkeit zu verlieren.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team flexibel zu führen und je nach Situation unterschiedliche Schwerpunkte zu setzen." : ""}`;
        if (pt === "hybrid_imp_ana") return `Diese Anforderungen verlangen eine Persönlichkeit, die entschlossen handelt und gleichzeitig methodisch vorgeht. Entscheidend sind Umsetzungsstärke und analytische Sorgfalt – beides muss auf hohem Niveau zusammenwirken.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team sowohl mit klarer Richtung als auch mit strukturierter Steuerung zu führen." : ""}`;
        if (pt === "hybrid_imp_int") return `Diese Anforderungen verlangen eine Persönlichkeit, die zügig entscheidet und gleichzeitig ein Gespür für Menschen und Teamdynamiken mitbringt. Entscheidend sind Handlungsorientierung und Beziehungsfähigkeit – beides muss auf hohem Niveau zusammenwirken.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team mit Energie und Empathie zu führen und dabei sowohl Ergebnisse als auch den Zusammenhalt im Blick zu behalten." : ""}`;
        if (pt === "hybrid_ana_int") return `Diese Anforderungen verlangen eine Persönlichkeit, die sorgfältig analysiert und gleichzeitig im persönlichen Kontakt überzeugt. Entscheidend sind methodische Gründlichkeit und kommunikative Kompetenz – beides muss auf hohem Niveau zusammenwirken.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team fachlich fundiert und zugleich menschlich überzeugend zu führen." : ""}`;
        if (data.dom.key === "int") return `Diese Anforderungen verlangen eine Persönlichkeit, die rasch Vertrauen aufbaut, Bedürfnisse frühzeitig erkennt und im persönlichen Kontakt überzeugt. Entscheidend sind ein ausgeprägtes Gespür für zwischenmenschliche Dynamiken, die Fähigkeit, tragfähige Beziehungen aufzubauen, und ein sicheres Auftreten im direkten Austausch.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team einfühlsam zu führen und dabei sowohl fachliche als auch zwischenmenschliche Anforderungen im Blick zu behalten." : ""}`;
        if (data.dom.key === "imp") return `Diese Anforderungen erfordern eine Persönlichkeit, die zügig entscheidet, klar priorisiert und Ergebnisse konsequent vorantreibt. Entscheidend sind Entschlusskraft, Handlungsorientierung und die Fähigkeit, auch bei unvollständiger Informationslage wirksam zu agieren.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team entschlossen zu führen und Verantwortung für dessen Ergebnisse zu übernehmen." : ""}`;
        return `Diese Anforderungen verlangen eine Persönlichkeit, die strukturiert, sorgfältig und verlässlich arbeitet, klare Standards einhält und auch bei wiederkehrenden Abläufen mit hoher Präzision vorgeht. Entscheidend sind ein ausgeprägtes Qualitätsbewusstsein, ein methodisches Vorgehen und die Fähigkeit, Aufgaben konsequent und gewissenhaft umzusetzen.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team methodisch zu führen und für nachvollziehbare Abläufe und einheitliche Standards zu sorgen." : ""}`;
      })();
      const ergaenzung = (() => {
        const pt = data.profileType;
        if (pt === "balanced_all") return "Da alle drei Anforderungsbereiche nahezu gleich gewichtet sind, gibt es keine eindeutige Ergänzungsanforderung. Die Person muss in allen Dimensionen – Handlung, Kommunikation und Analyse – ein solides Grundniveau mitbringen und situativ den richtigen Schwerpunkt setzen.";
        if (pt === "hybrid_imp_ana") return "Ergänzend erfordert die Stelle ein Mindestmaß an Kommunikationsfähigkeit und Beziehungsarbeit, um Ergebnisse im Team zu verankern und die Zusammenarbeit auch bei hohem Tempo und hoher Anforderung an Genauigkeit nicht zu vernachlässigen.";
        if (pt === "hybrid_imp_int") return "Ergänzend erfordert die Stelle ein Mindestmaß an analytischer Sorgfalt und Strukturbewusstsein, um Entscheidungen auf einer fundierten Grundlage zu treffen und Qualitätsstandards auch bei hoher Dynamik einzuhalten.";
        if (pt === "hybrid_ana_int") return "Ergänzend erfordert die Stelle ein Mindestmaß an Umsetzungsstärke und Entscheidungstempo, um Erkenntnisse und Abstimmungen zeitnah in konkretes Handeln zu überführen und den Fortschritt nicht zu bremsen.";
        if (data.dom.key === "int") return data.sec.key === "ana" ? "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Struktur und Organisationsfähigkeit, um Abläufe verlässlich zu gestalten, Dokumentationen sorgfältig zu führen und einheitliche Standards einzuhalten." : "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Durchsetzungsfähigkeit, um Entscheidungen klar zu treffen, Prioritäten verbindlich zu setzen und auch bei Widerständen handlungsfähig zu bleiben.";
        if (data.dom.key === "imp") return data.sec.key === "int" ? "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Beziehungsfähigkeit, um das Team mitzunehmen, Akzeptanz zu schaffen und die Zusammenarbeit auf eine tragfähige Grundlage zu stellen." : "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Sorgfalt und Genauigkeit, um Qualitätsstandards einzuhalten, Prozesse nachvollziehbar zu dokumentieren und fundierte Entscheidungsgrundlagen zu liefern.";
        return data.sec.key === "int" ? "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Abstimmung und Kommunikationsfähigkeit, um Abläufe im Team verlässlich zu unterstützen, Rückmeldungen verständlich weiterzugeben und eine reibungslose Zusammenarbeit sicherzustellen." : "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Handlungsfähigkeit und Umsetzungsstärke, um Analyseergebnisse in konkrete Maßnahmen zu überführen, Entscheidungen zeitnah zu treffen und den Fortschritt aktiv voranzutreiben.";
      })();

      const hochNamen = hochItems.slice(0, 3).map((t: any) => cleanTaskName(t.name));
      const hochRef = hochNamen.length > 0 ? `Besonders kritisch sind dabei ${hochNamen.join(", ")}. ` : "";
      const alltagText = (() => {
        const person = data.isLeadership ? "Die Führungskraft" : "Die Person";
        const pt = data.profileType;
        if (pt === "balanced_all") return `Im regulären Arbeitsalltag zeigt sich bei dieser Stelle keine eindeutige Handlungsrichtung. ${person} wechselt situativ zwischen zügigem Handeln, persönlichem Kontakt und gründlicher Analyse. ${hochRef}Die Stärke liegt in der Vielseitigkeit. Die Herausforderung besteht darin, bei wechselnden Anforderungen eine konsistente Linie zu halten.`;
        if (pt === "hybrid_imp_ana") return `Im regulären Arbeitsalltag verbindet diese Stelle zügiges Handeln mit gründlicher Prüfung. ${person} treibt Ergebnisse aktiv voran und achtet gleichzeitig auf Qualität und Nachvollziehbarkeit. ${hochRef}Dabei darf die Kommunikation im Team nicht vernachlässigt werden – Ergebnisse wirken nur, wenn sie verstanden und mitgetragen werden.`;
        if (pt === "hybrid_imp_int") return `Im regulären Arbeitsalltag verbindet diese Stelle Umsetzungsstärke mit einem guten Gespür für Menschen. ${person} treibt Ergebnisse voran und achtet gleichzeitig auf den Zusammenhalt im Team. ${hochRef}Dabei darf die analytische Absicherung nicht zu kurz kommen – auch bei hoher Dynamik brauchen Entscheidungen eine fundierte Grundlage.`;
        if (pt === "hybrid_ana_int") return `Im regulären Arbeitsalltag verbindet diese Stelle analytische Gründlichkeit mit kommunikativer Kompetenz. ${person} prüft Sachverhalte sorgfältig und kommuniziert Ergebnisse verständlich im Team. ${hochRef}Dabei muss das Umsetzungstempo gewährleistet bleiben – gründliche Analyse und Abstimmung dürfen die Handlungsfähigkeit nicht bremsen.`;
        if (data.dom.key === "int") return `Im regulären Arbeitsalltag entfaltet diese Stelle ihre Wirkung vor allem im persönlichen Kontakt. ${person} schafft Vertrauen, nimmt Bedürfnisse frühzeitig wahr und gestaltet ein Umfeld, in dem sich Beteiligte eingebunden und wertgeschätzt fühlen. ${hochRef}${data.sec.key === "ana" ? "Damit dies gelingt, erfordert die Stelle zugleich ein hohes Maß an Organisation und Verlässlichkeit. Abläufe, Dokumentation und einheitliche Standards müssen konsequent eingehalten werden." : "Damit dies gelingt, erfordert die Stelle zugleich Entscheidungsstärke und Umsetzungstempo. Nicht jede Situation lässt sich im Konsens lösen."}`;
        if (data.dom.key === "imp") return `Im regulären Arbeitsalltag entfaltet diese Stelle ihre Wirkung vor allem durch klare Priorisierung und konsequente Umsetzung. ${person} treibt Ergebnisse zielgerichtet voran und bleibt auch bei Widerständen handlungsfähig. ${hochRef}${data.sec.key === "int" ? "Damit dies gelingt, erfordert die Stelle zugleich Sensibilität für zwischenmenschliche Dynamiken. Wer ausschließlich auf Tempo setzt, riskiert den Rückhalt im Team." : "Damit dies gelingt, erfordert die Stelle zugleich analytische Sorgfalt und Qualitätsbewusstsein. Auch zügig getroffene Entscheidungen müssen auf einer fundierten Grundlage beruhen."}`;
        return `Im regulären Arbeitsalltag entfaltet diese Stelle ihre Wirkung vor allem durch methodisches Arbeiten, präzise Dokumentation und eine konsequente Qualitätsorientierung. ${person} überzeugt durch fachliche Tiefe und nachvollziehbare Ergebnisse. ${hochRef}${data.sec.key === "int" ? "Damit dies gelingt, erfordert die Stelle zugleich kommunikatives Geschick. Fachlich fundierte Ergebnisse müssen verständlich aufbereitet und im Team verankert werden." : "Damit dies gelingt, erfordert die Stelle zugleich Handlungsbereitschaft und Umsetzungsstärke. Wer ausschließlich analysiert, ohne Entscheidungen herbeizuführen, hemmt den Fortschritt."}`;
      })();

      const strukturText = (() => {
        if (data.profileType === "balanced_all") return "Diese Stelle erfordert keine eindeutige Spezialisierung. Sie verlangt eine Persönlichkeit, die situativ zwischen zügigem Handeln, persönlichem Kontakt und sorgfältigem Arbeiten wechseln kann. Das macht die Besetzung besonders anspruchsvoll – die Person muss vielseitig agieren, ohne dabei an Verlässlichkeit und Verbindlichkeit zu verlieren.";
        if (data.profileType.startsWith("hybrid_")) {
          const domB = data.dom.key === "imp" ? "entschlossenes Handeln und Umsetzungsstärke" : data.dom.key === "int" ? "ein sicheres Auftreten im persönlichen Kontakt und ein gutes Gespür für andere" : "Gründlichkeit, Sorgfalt und eine konsequente Einhaltung von Standards";
          const secB = data.sec.key === "imp" ? "entschlossenes Handeln und Umsetzungsstärke" : data.sec.key === "int" ? "ein sicheres Auftreten im persönlichen Kontakt und ein gutes Gespür für andere" : "Gründlichkeit, Sorgfalt und eine konsequente Einhaltung von Standards";
          return `Diese Stelle verlangt gleichzeitig ${domB} und ${secB}. Beide Anforderungsbereiche sind nahezu gleichwertig ausgeprägt. Die Person muss in beiden Dimensionen ein hohes Wirkungsniveau mitbringen.`;
        }
        const domB = data.dom.key === "imp" ? "entschlossenes Handeln und klare Prioritätensetzung" : data.dom.key === "int" ? "persönlichen Kontakt und die Fähigkeit, Vertrauen und Nähe herzustellen" : "Gründlichkeit, Verlässlichkeit und ein konsequent sorgfältiges Vorgehen";
        return `Das Profil dieser Stelle wird maßgeblich geprägt durch ${domB}. Dies bildet die zentrale Anforderung an die Person. ${data.sec.key === "ana" ? "Ergänzend dazu braucht es eine ordentliche und gewissenhafte Arbeitsweise, damit Abläufe stabil bleiben und Ergebnisse den geforderten Qualitätsstandards entsprechen." : data.sec.key === "int" ? "Ergänzend dazu braucht es die Fähigkeit, sich im Team abzustimmen, verständlich zu kommunizieren und ein konstruktives Miteinander zu fördern." : "Ergänzend dazu braucht es Umsetzungsstärke und Eigeninitiative, damit Aufgaben nicht nur geplant, sondern auch zuverlässig erledigt werden."}`;
      })();

      const arbeitslogik = (() => {
        const fk = data.isLeadership;
        const pt = data.profileType;
        if (pt === "balanced_all") return `Die Wirksamkeit dieser Stelle entsteht nicht über eine einzelne Stärke, sondern über die Fähigkeit, situativ den richtigen Schwerpunkt zu setzen. ${fk ? "Als Führungskraft muss sie je nach Anforderung zwischen zügiger Entscheidung, persönlicher Abstimmung und gründlicher Analyse wechseln können." : "Die Person muss je nach Situation zwischen zügigem Handeln, persönlichem Austausch und gründlicher Analyse wechseln können."} Das erfordert ein hohes Maß an Selbstreflexion und Anpassungsfähigkeit.`;
        if (pt === "hybrid_imp_ana") return `Die Wirksamkeit dieser Stelle entsteht durch die Verbindung von Tempo und Gründlichkeit. ${fk ? "Als Führungskraft treibt sie Ergebnisse voran und sichert gleichzeitig Qualität und Nachvollziehbarkeit." : "Aufgaben werden zügig angegangen und gleichzeitig sorgfältig geprüft."} Dabei darf die zwischenmenschliche Ebene nicht vernachlässigt werden – Ergebnisse müssen im Team verankert und verständlich kommuniziert werden.`;
        if (pt === "hybrid_imp_int") return `Die Wirksamkeit dieser Stelle entsteht durch die Verbindung von Handlungsorientierung und Beziehungsfähigkeit. ${fk ? "Als Führungskraft treibt sie Ergebnisse voran und achtet gleichzeitig auf den Zusammenhalt und die Motivation im Team." : "Aufgaben werden zügig vorangetrieben und gleichzeitig wird auf die Wirkung auf andere geachtet."} Dabei darf die analytische Absicherung nicht zu kurz kommen – auch dynamische Entscheidungen brauchen eine fundierte Grundlage.`;
        if (pt === "hybrid_ana_int") return `Die Wirksamkeit dieser Stelle entsteht durch die Verbindung von analytischer Tiefe und kommunikativer Kompetenz. ${fk ? "Als Führungskraft setzt sie auf fundierte Entscheidungen und verankert diese gleichzeitig über persönliche Kommunikation im Team." : "Sachverhalte werden gründlich geprüft und gleichzeitig verständlich und überzeugend kommuniziert."} Dabei muss die Umsetzungsstärke gewährleistet bleiben – Erkenntnis und Abstimmung allein erzeugen noch keine Wirkung.`;
        if (data.dom.key === "int") return `Die Wirksamkeit dieser Stelle entsteht vor allem im direkten persönlichen Austausch – ${fk ? "mit dem Team, relevanten Stakeholdern und Entscheidungsträgern" : "mit Kolleginnen und Kollegen, Kundinnen und Kunden oder weiteren Gesprächspartnern"}. Entscheidungen werden häufig situativ und dialogorientiert getroffen. ${data.sec.key === "ana" ? "Zugleich verlangt die Stelle die Fähigkeit, Abläufe strukturiert zu organisieren, Prioritäten klar zu setzen und Verbindlichkeit in der Umsetzung sicherzustellen." : "Zugleich verlangt die Stelle die Fähigkeit, zügig zu handeln und Ergebnisse konsequent zu liefern – auch dann, wenn nicht alle Beteiligten einverstanden sind."}`;
        if (data.dom.key === "imp") return `Die Wirksamkeit dieser Stelle entsteht vor allem durch entschlossenes Handeln und klare Priorisierung. ${fk ? "Als Führungskraft gibt sie das Tempo vor und treibt Ergebnisse aktiv und verbindlich voran." : "Aufgaben und Themen werden eigenständig vorangetrieben, ohne auf detaillierte Anweisungen zu warten."} ${data.sec.key === "int" ? "Dabei darf der Blick für das Team und die zwischenmenschliche Ebene nicht verloren gehen. Nachhaltige Ergebnisse entstehen nur, wenn auch die Beziehungsebene gepflegt wird." : "Dabei erfordert die Stelle zugleich analytische Sorgfalt, damit Qualität, Nachhaltigkeit und fundierte Entscheidungsgrundlagen gewährleistet bleiben."}`;
        return `Die Wirksamkeit dieser Stelle entsteht durch systematische Analyse, klar definierte Prozesse und fundierte Entscheidungsgrundlagen. ${fk ? "Als Führungskraft setzt sie auf nachvollziehbare Qualitätsstandards und eine transparente, methodische Steuerung." : "Fachliche Tiefe und eine sorgfältige Arbeitsweise schaffen Vertrauen, Verlässlichkeit und Orientierung."} ${data.sec.key === "int" ? "Zugleich verlangt die Stelle, Erkenntnisse verständlich zu kommunizieren, im Team zu verankern und eine konstruktive Zusammenarbeit aktiv zu fördern." : "Zugleich müssen Analyseergebnisse in konkretes Handeln überführt werden. Fundierte Erkenntnis allein erzeugt noch keine Wirkung."}`;
      })();

      const fazitLocal = buildFazit(data);
      const safeName = (data.beruf || "Bericht").replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").replace(/\s+/g, "_");

      await buildRollenprofilPdf({
        beruf: data.beruf,
        bereich: data.bereich,
        isLeadership: data.isLeadership,
        fuehrungstyp: data.fuehrungstyp,
        aufgabencharakter: data.aufgabencharakter,
        profileType: data.profileType,
        gesamt: data.gesamt,
        dom: data.dom,
        sec: data.sec,
        wk: data.wk,
        einleitung: `Dieser Bericht zeigt, welche Persönlichkeitsstruktur für die Stelle ${data.beruf} besonders passend und wirksam ist. Neben den fachlichen Anforderungen beeinflusst vor allem die Art, wie eine Person Situationen einschätzt, Entscheidungen trifft und unter Druck handelt, die Wirksamkeit in dieser Position.\n\nDie folgenden Abschnitte verdeutlichen, welche Persönlichkeitsanforderungen die Stelle mit sich bringt, wie sich diese im Arbeitsalltag zeigen und welche Spannungsfelder daraus entstehen können.`,
        topTaetigkeiten: topT,
        rollenBeschreibungIntro: introText,
        rollenBeschreibungErgaenzung: ergaenzung,
        strukturprofilText: strukturText,
        komponentenBedeutung: buildKomponentenBedeutung(data),
        profilherkunft: buildProfilherkunft(data),
        profilkonflikt: buildProfilkonflikt(data),
        arbeitslogikText: arbeitslogik,
        rahmenText: buildRahmenText(data),
        erfolgsfokusLabels: erfolgsfokusLabelsLocal,
        erfolgsfokusText: buildErfolgsfokusText(data, erfolgsfokusLabelsLocal),
        alltagsverhalten: alltagText,
        stressControlled: stress.controlled,
        stressUncontrolled: stress.uncontrolled,
        teamwirkung: buildTeamwirkung(data),
        spannungsfelder: buildSpannungsfelder(data),
        fehlbesetzung: buildFehlbesetzung(data),
        kandidatenText: kandidatenText || "",
        fazitTitel: fazitLocal.titel,
        fazitAbsaetze: fazitLocal.absaetze,
      }, `Stellenprofil_${safeName}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
      alert("PDF-Export fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen" style={{ background: "#F1F5F9" }}>
        <GlobalNav />
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(40px)", borderRadius: 20, padding: "28px 32px", boxShadow: "0 8px 30px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <AlertTriangle style={{ width: 40, height: 40, color: "#FF9500", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>Kein Stellenprofil vorhanden</h2>
            <p style={{ fontSize: 14, color: "#48484A", margin: "0 0 24px", lineHeight: 1.6 }}>
              Bitte erstellen Sie zuerst ein Stellenprofil, um den Bericht generieren zu können.
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
              Stellenprofil erstellen
            </button>
          </div>
        </main>
      </div>
    );
  }

  const stress = buildStressTexts(data.gesamt, data.isLeadership, data.fuehrungstyp);
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

  const topTaetigkeiten = hauptTaetigkeiten.slice(0, 3).map((t: any) => cleanTaskName(t.name));

  const rollenBeschreibungIntro = (() => {
    const fk = data.isLeadership;
    const pt = data.profileType;
    if (pt === "balanced_all") {
      return `Diese Anforderungen verlangen eine vielseitige Persönlichkeit, die situativ zwischen zügigem Handeln, persönlichem Kontakt und sorgfältigem Arbeiten wechseln kann. Entscheidend ist die Fähigkeit, flexibel auf unterschiedliche Situationen zu reagieren, ohne dabei an Verbindlichkeit und Verlässlichkeit zu verlieren.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team flexibel zu führen und je nach Situation unterschiedliche Schwerpunkte zu setzen." : ""}`;
    }
    if (pt === "hybrid_imp_ana") {
      return `Diese Anforderungen verlangen eine Persönlichkeit, die entschlossen handelt und gleichzeitig methodisch vorgeht. Entscheidend sind Umsetzungsstärke und analytische Sorgfalt – beides muss auf hohem Niveau zusammenwirken.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team sowohl mit klarer Richtung als auch mit strukturierter Steuerung zu führen." : ""}`;
    }
    if (pt === "hybrid_imp_int") {
      return `Diese Anforderungen verlangen eine Persönlichkeit, die zügig entscheidet und gleichzeitig ein Gespür für Menschen und Teamdynamiken mitbringt. Entscheidend sind Handlungsorientierung und Beziehungsfähigkeit – beides muss auf hohem Niveau zusammenwirken.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team mit Energie und Empathie zu führen und dabei sowohl Ergebnisse als auch den Zusammenhalt im Blick zu behalten." : ""}`;
    }
    if (pt === "hybrid_ana_int") {
      return `Diese Anforderungen verlangen eine Persönlichkeit, die sorgfältig analysiert und gleichzeitig im persönlichen Kontakt überzeugt. Entscheidend sind methodische Gründlichkeit und kommunikative Kompetenz – beides muss auf hohem Niveau zusammenwirken.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team fachlich fundiert und zugleich menschlich überzeugend zu führen." : ""}`;
    }
    if (data.dom.key === "int") {
      return `Diese Anforderungen verlangen eine Persönlichkeit, die rasch Vertrauen aufbaut, Bedürfnisse frühzeitig erkennt und im persönlichen Kontakt überzeugt. Entscheidend sind ein ausgeprägtes Gespür für zwischenmenschliche Dynamiken, die Fähigkeit, tragfähige Beziehungen aufzubauen, und ein sicheres Auftreten im direkten Austausch.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team einfühlsam zu führen und dabei sowohl fachliche als auch zwischenmenschliche Anforderungen im Blick zu behalten." : ""}`;
    }
    if (data.dom.key === "imp") {
      return `Diese Anforderungen erfordern eine Persönlichkeit, die zügig entscheidet, klar priorisiert und Ergebnisse konsequent vorantreibt. Entscheidend sind Entschlusskraft, Handlungsorientierung und die Fähigkeit, auch bei unvollständiger Informationslage wirksam zu agieren.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team entschlossen zu führen und Verantwortung für dessen Ergebnisse zu übernehmen." : ""}`;
    }
    return `Diese Anforderungen verlangen eine Persönlichkeit, die strukturiert, sorgfältig und verlässlich arbeitet, klare Standards einhält und auch bei wiederkehrenden Abläufen mit hoher Präzision vorgeht. Entscheidend sind ein ausgeprägtes Qualitätsbewusstsein, ein methodisches Vorgehen und die Fähigkeit, Aufgaben konsequent und gewissenhaft umzusetzen.${fk ? " Zusätzlich erfordert die Stelle die Fähigkeit, ein Team methodisch zu führen und für nachvollziehbare Abläufe und einheitliche Standards zu sorgen." : ""}`;
  })();

  const rollenBeschreibungErgaenzung = (() => {
    const pt = data.profileType;
    if (pt === "balanced_all") {
      return "Da alle drei Anforderungsbereiche nahezu gleich gewichtet sind, gibt es keine eindeutige Ergänzungsanforderung. Die Person muss in allen Dimensionen – Handlung, Kommunikation und Analyse – ein solides Grundniveau mitbringen und situativ den richtigen Schwerpunkt setzen.";
    }
    if (pt === "hybrid_imp_ana") {
      return "Ergänzend erfordert die Stelle ein Mindestmaß an Kommunikationsfähigkeit und Beziehungsarbeit, um Ergebnisse im Team zu verankern und die Zusammenarbeit auch bei hohem Tempo und hoher Anforderung an Genauigkeit nicht zu vernachlässigen.";
    }
    if (pt === "hybrid_imp_int") {
      return "Ergänzend erfordert die Stelle ein Mindestmaß an analytischer Sorgfalt und Strukturbewusstsein, um Entscheidungen auf einer fundierten Grundlage zu treffen und Qualitätsstandards auch bei hoher Dynamik einzuhalten.";
    }
    if (pt === "hybrid_ana_int") {
      return "Ergänzend erfordert die Stelle ein Mindestmaß an Umsetzungsstärke und Entscheidungstempo, um Erkenntnisse und Abstimmungen zeitnah in konkretes Handeln zu überführen und den Fortschritt nicht zu bremsen.";
    }
    if (data.dom.key === "int") {
      return data.sec.key === "ana"
        ? "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Struktur und Organisationsfähigkeit, um Abläufe verlässlich zu gestalten, Dokumentationen sorgfältig zu führen und einheitliche Standards einzuhalten."
        : "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Durchsetzungsfähigkeit, um Entscheidungen klar zu treffen, Prioritäten verbindlich zu setzen und auch bei Widerständen handlungsfähig zu bleiben.";
    }
    if (data.dom.key === "imp") {
      return data.sec.key === "int"
        ? "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Beziehungsfähigkeit, um das Team mitzunehmen, Akzeptanz zu schaffen und die Zusammenarbeit auf eine tragfähige Grundlage zu stellen."
        : "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Sorgfalt und Genauigkeit, um Qualitätsstandards einzuhalten, Prozesse nachvollziehbar zu dokumentieren und fundierte Entscheidungsgrundlagen zu liefern.";
    }
    return data.sec.key === "int"
      ? "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Abstimmung und Kommunikationsfähigkeit, um Abläufe im Team verlässlich zu unterstützen, Rückmeldungen verständlich weiterzugeben und eine reibungslose Zusammenarbeit sicherzustellen."
      : "Darüber hinaus erfordert die Stelle ein ausreichendes Maß an Handlungsfähigkeit und Umsetzungsstärke, um Analyseergebnisse in konkrete Maßnahmen zu überführen, Entscheidungen zeitnah zu treffen und den Fortschritt aktiv voranzutreiben.";
  })();

  const arbeitslogikText = (() => {
    const fk = data.isLeadership;
    const pt = data.profileType;
    if (pt === "balanced_all") {
      return `Die Wirksamkeit dieser Stelle entsteht nicht über eine einzelne Stärke, sondern über die Fähigkeit, situativ den richtigen Schwerpunkt zu setzen. ${fk ? "Als Führungskraft muss sie je nach Anforderung zwischen zügiger Entscheidung, persönlicher Abstimmung und gründlicher Analyse wechseln können." : "Die Person muss je nach Situation zwischen zügigem Handeln, persönlichem Austausch und gründlicher Analyse wechseln können."} Das erfordert ein hohes Maß an Selbstreflexion und Anpassungsfähigkeit.`;
    }
    if (pt === "hybrid_imp_ana") {
      return `Die Wirksamkeit dieser Stelle entsteht durch die Verbindung von Tempo und Gründlichkeit. ${fk ? "Als Führungskraft treibt sie Ergebnisse voran und sichert gleichzeitig Qualität und Nachvollziehbarkeit." : "Aufgaben werden zügig angegangen und gleichzeitig sorgfältig geprüft."} Dabei darf die zwischenmenschliche Ebene nicht vernachlässigt werden – Ergebnisse müssen im Team verankert und verständlich kommuniziert werden.`;
    }
    if (pt === "hybrid_imp_int") {
      return `Die Wirksamkeit dieser Stelle entsteht durch die Verbindung von Handlungsorientierung und Beziehungsfähigkeit. ${fk ? "Als Führungskraft treibt sie Ergebnisse voran und achtet gleichzeitig auf den Zusammenhalt und die Motivation im Team." : "Aufgaben werden zügig vorangetrieben und gleichzeitig wird auf die Wirkung auf andere geachtet."} Dabei darf die analytische Absicherung nicht zu kurz kommen – auch dynamische Entscheidungen brauchen eine fundierte Grundlage.`;
    }
    if (pt === "hybrid_ana_int") {
      return `Die Wirksamkeit dieser Stelle entsteht durch die Verbindung von analytischer Tiefe und kommunikativer Kompetenz. ${fk ? "Als Führungskraft setzt sie auf fundierte Entscheidungen und verankert diese gleichzeitig über persönliche Kommunikation im Team." : "Sachverhalte werden gründlich geprüft und gleichzeitig verständlich und überzeugend kommuniziert."} Dabei muss die Umsetzungsstärke gewährleistet bleiben – Erkenntnis und Abstimmung allein erzeugen noch keine Wirkung.`;
    }
    if (data.dom.key === "int") {
      return `Die Wirksamkeit dieser Stelle entsteht vor allem im direkten persönlichen Austausch – ${fk ? "mit dem Team, relevanten Stakeholdern und Entscheidungsträgern" : "mit Kolleginnen und Kollegen, Kundinnen und Kunden oder weiteren Gesprächspartnern"}. Entscheidungen werden häufig situativ und dialogorientiert getroffen. ${data.sec.key === "ana" ? "Zugleich verlangt die Stelle die Fähigkeit, Abläufe strukturiert zu organisieren, Prioritäten klar zu setzen und Verbindlichkeit in der Umsetzung sicherzustellen." : "Zugleich verlangt die Stelle die Fähigkeit, zügig zu handeln und Ergebnisse konsequent zu liefern – auch dann, wenn nicht alle Beteiligten einverstanden sind."}`;
    }
    if (data.dom.key === "imp") {
      return `Die Wirksamkeit dieser Stelle entsteht vor allem durch entschlossenes Handeln und klare Priorisierung. ${fk ? "Als Führungskraft gibt sie das Tempo vor und treibt Ergebnisse aktiv und verbindlich voran." : "Aufgaben und Themen werden eigenständig vorangetrieben, ohne auf detaillierte Anweisungen zu warten."} ${data.sec.key === "int" ? "Dabei darf der Blick für das Team und die zwischenmenschliche Ebene nicht verloren gehen. Nachhaltige Ergebnisse entstehen nur, wenn auch die Beziehungsebene gepflegt wird." : "Dabei erfordert die Stelle zugleich analytische Sorgfalt, damit Qualität, Nachhaltigkeit und fundierte Entscheidungsgrundlagen gewährleistet bleiben."}`;
    }
    return `Die Wirksamkeit dieser Stelle entsteht durch systematische Analyse, klar definierte Prozesse und fundierte Entscheidungsgrundlagen. ${fk ? "Als Führungskraft setzt sie auf nachvollziehbare Qualitätsstandards und eine transparente, methodische Steuerung." : "Fachliche Tiefe und eine sorgfältige Arbeitsweise schaffen Vertrauen, Verlässlichkeit und Orientierung."} ${data.sec.key === "int" ? "Zugleich verlangt die Stelle, Erkenntnisse verständlich zu kommunizieren, im Team zu verankern und eine konstruktive Zusammenarbeit aktiv zu fördern." : "Zugleich müssen Analyseergebnisse in konkretes Handeln überführt werden. Fundierte Erkenntnis allein erzeugt noch keine Wirkung."}`;
  })();

  const alltagsverhalten = (() => {
    const hochNamen = hochItems.slice(0, 3).map((t: any) => cleanTaskName(t.name));
    const hochRef = hochNamen.length > 0 ? `Besonders kritisch sind dabei ${hochNamen.join(", ")}. ` : "";
    const fk = data.isLeadership;
    const person = fk ? "Die Führungskraft" : "Die Person";
    const pt = data.profileType;
    if (pt === "balanced_all") {
      return `Im regulären Arbeitsalltag zeigt sich bei dieser Stelle keine eindeutige Handlungsrichtung. ${person} wechselt vorwiegend situativ zwischen zügigem Handeln, persönlichem Kontakt und gründlicher Analyse. ${hochRef}Die Stärke liegt in der Vielseitigkeit. Die Herausforderung besteht eher darin, bei wechselnden Anforderungen eine konsistente Linie zu halten.`;
    }
    if (pt === "hybrid_imp_ana") {
      return `Im regulären Arbeitsalltag verbindet diese Stelle vorwiegend zügiges Handeln mit gründlicher Prüfung. ${person} treibt Ergebnisse eher aktiv voran und achtet gleichzeitig auf Qualität und Nachvollziehbarkeit. ${hochRef}Dabei darf die Kommunikation im Team nicht vernachlässigt werden – Ergebnisse wirken nur, wenn sie verstanden und mitgetragen werden.`;
    }
    if (pt === "hybrid_imp_int") {
      return `Im regulären Arbeitsalltag verbindet diese Stelle vorwiegend Umsetzungsstärke mit einem guten Gespür für Menschen. ${person} treibt eher Ergebnisse voran und achtet gleichzeitig auf den Zusammenhalt im Team. ${hochRef}Dabei darf die analytische Absicherung nicht zu kurz kommen – auch bei hoher Dynamik brauchen Entscheidungen eine fundierte Grundlage.`;
    }
    if (pt === "hybrid_ana_int") {
      return `Im regulären Arbeitsalltag verbindet diese Stelle vorwiegend analytische Gründlichkeit mit kommunikativer Kompetenz. ${person} prüft Sachverhalte eher sorgfältig und kommuniziert Ergebnisse verständlich im Team. ${hochRef}Dabei muss das Umsetzungstempo gewährleistet bleiben – gründliche Analyse und Abstimmung dürfen die Handlungsfähigkeit nicht bremsen.`;
    }
    if (data.dom.key === "int") {
      return `Im regulären Arbeitsalltag entfaltet diese Stelle ihre Wirkung vorwiegend im persönlichen Kontakt. ${person} schafft eher Vertrauen, nimmt Bedürfnisse frühzeitig wahr und gestaltet ein Umfeld, in dem sich Beteiligte eingebunden und wertgeschätzt fühlen. ${hochRef}${data.sec.key === "ana" ? "Damit dies gelingt, erfordert die Stelle zugleich ein hohes Maß an Organisation und Verlässlichkeit. Abläufe, Dokumentation und einheitliche Standards müssen konsequent eingehalten werden." : "Damit dies gelingt, erfordert die Stelle zugleich Entscheidungsstärke und Umsetzungstempo. Nicht jede Situation lässt sich im Konsens lösen."}`;
    }
    if (data.dom.key === "imp") {
      return `Im regulären Arbeitsalltag entfaltet diese Stelle ihre Wirkung vorwiegend durch klare Priorisierung und konsequente Umsetzung. ${person} treibt Ergebnisse eher zielgerichtet voran und bleibt auch bei Widerständen handlungsfähig. ${hochRef}${data.sec.key === "int" ? "Damit dies gelingt, erfordert die Stelle zugleich Sensibilität für zwischenmenschliche Dynamiken. Wer ausschließlich auf Tempo setzt, riskiert den Rückhalt im Team." : "Damit dies gelingt, erfordert die Stelle zugleich analytische Sorgfalt und Qualitätsbewusstsein. Auch zügig getroffene Entscheidungen müssen auf einer fundierten Grundlage beruhen."}`;
    }
    return `Im regulären Arbeitsalltag entfaltet diese Stelle ihre Wirkung vorwiegend durch methodisches Arbeiten, präzise Dokumentation und eine konsequente Qualitätsorientierung. ${person} überzeugt eher durch fachliche Tiefe und nachvollziehbare Ergebnisse. ${hochRef}${data.sec.key === "int" ? "Damit dies gelingt, erfordert die Stelle zugleich kommunikatives Geschick. Fachlich fundierte Ergebnisse müssen verständlich aufbereitet und im Team verankert werden." : "Damit dies gelingt, erfordert die Stelle zugleich Handlungsbereitschaft und Umsetzungsstärke. Wer ausschließlich analysiert, ohne Entscheidungen herbeizuführen, hemmt den Fortschritt."}`;
  })();

  const strukturprofilText = (() => {
    if (data.profileType === "balanced_all") {
      return "Diese Stelle erfordert keine eindeutige Spezialisierung. Sie verlangt eine Persönlichkeit, die situativ zwischen zügigem Handeln, persönlichem Kontakt und sorgfältigem Arbeiten wechseln kann. Das macht die Besetzung besonders anspruchsvoll – die Person muss vielseitig agieren, ohne dabei an Verlässlichkeit und Verbindlichkeit zu verlieren.";
    }
    if (data.profileType.startsWith("hybrid_")) {
      const domBehav = data.dom.key === "imp" ? "entschlossenes Handeln und Umsetzungsstärke" : data.dom.key === "int" ? "ein sicheres Auftreten im persönlichen Kontakt und ein gutes Gespür für andere" : "Gründlichkeit, Sorgfalt und eine konsequente Einhaltung von Standards";
      const secBehav = data.sec.key === "imp" ? "entschlossenes Handeln und Umsetzungsstärke" : data.sec.key === "int" ? "ein sicheres Auftreten im persönlichen Kontakt und ein gutes Gespür für andere" : "Gründlichkeit, Sorgfalt und eine konsequente Einhaltung von Standards";
      return `Diese Stelle verlangt gleichzeitig ${domBehav} und ${secBehav}. Beide Anforderungsbereiche sind nahezu gleichwertig ausgeprägt. Die Person muss in beiden Dimensionen ein hohes Wirkungsniveau mitbringen.`;
    }
    const domBehav = data.dom.key === "imp" ? "entschlossenes Handeln und klare Prioritätensetzung" : data.dom.key === "int" ? "persönlichen Kontakt und die Fähigkeit, Vertrauen und Nähe herzustellen" : "Gründlichkeit, Verlässlichkeit und ein konsequent sorgfältiges Vorgehen";
    return `Das Profil dieser Stelle wird maßgeblich geprägt durch ${domBehav}. Dies bildet die zentrale Anforderung an die Person. ${data.sec.key === "ana" ? "Ergänzend dazu braucht es eine ordentliche und gewissenhafte Arbeitsweise, damit Abläufe stabil bleiben und Ergebnisse den geforderten Qualitätsstandards entsprechen." : data.sec.key === "int" ? "Ergänzend dazu braucht es die Fähigkeit, sich im Team abzustimmen, verständlich zu kommunizieren und ein konstruktives Miteinander zu fördern." : "Ergänzend dazu braucht es Umsetzungsstärke und Eigeninitiative, damit Aufgaben nicht nur geplant, sondern auch zuverlässig erledigt werden."}`;
  })();


  const domColor = COLORS[data.dom.key as keyof typeof COLORS] || "#1A5DAB";

  const SectionHead = ({ num, title }: { num: number; title: string; color?: string }) => (
    <div className="bio-section-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, marginLeft: -44, marginRight: -44, padding: "0 18px", height: 38, background: "linear-gradient(135deg, #343A48 0%, #3d4455 50%, #464f62 100%)", boxShadow: "0 2px 6px rgba(52,58,72,0.3)" }}>
      <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.95)", borderRadius: "50%", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#343A48" }}>{String(num).padStart(2, "0")}</span>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.03em" }}>{title}</span>
    </div>
  );

  const SECTION_COLORS = {
    rollenDna: domColor,
    verhalten: "#6366F1",
    teamwirkung: "#0EA5E9",
  };

  return (
    <div className="min-h-screen" style={{ background: "#F1F5F9" }} lang="de">
      <GlobalNav />

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 80px" }}>
        <div ref={reportRef} style={{ position: "relative", background: "#FFFFFF", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)" }}>

          {/* ── DARK HEADER ── */}
          <div className="report-header" data-testid="bericht-header">

            <img src={logoSrc} alt="bioLogic" className="report-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />

            <button
              onClick={handlePDF}
              disabled={pdfLoading}
              data-testid="button-pdf-export"
              className="report-pdf-btn"
              style={{ cursor: pdfLoading ? "wait" : "pointer", opacity: pdfLoading ? 0.6 : 1, transition: "all 0.15s ease" }}
            >
              <Download style={{ width: 15, height: 15 }} />
              <span>{pdfLoading ? "Wird erstellt..." : "PDF"}</span>
            </button>

            <div className="report-kicker">STELLENANALYSE</div>
            <h1 className="report-title" data-testid="text-report-title">Stellenprofil</h1>
            <div className="report-subtitle">{data.beruf}</div>
            <div className="report-rings" />
          </div>

          {/* ── BODY ── */}
          <div style={{ padding: "40px 44px 48px" }}>

          {/* ── EINLEITUNG ── */}
          <div style={{ marginBottom: 32 }} data-testid="bericht-section-intro">
            <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-einleitung">
              Dieser Bericht zeigt, welche Persönlichkeitsstruktur für die Stelle {data.beruf} besonders passend und wirksam ist. Neben den fachlichen Anforderungen beeinflusst vor allem die Art, wie eine Person Situationen einschätzt, Entscheidungen trifft und unter Druck handelt, die Wirksamkeit in dieser Position.<br /><br />Die folgenden Abschnitte verdeutlichen, welche Persönlichkeitsanforderungen die Stelle mit sich bringt, wie sich diese im Arbeitsalltag zeigen und welche Spannungsfelder daraus entstehen können.
            </p>
          </div>

          {/* ── SEITE 1: ROLLEN-DNA ── */}
          <div data-section="struktur" style={{ marginBottom: 40 }} data-testid="bericht-section-gesamtprofil">
            <SectionHead num={1} title="Stellenprofil · Entscheidungsgrundlage" color={SECTION_COLORS.rollenDna} />

            <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>Welche Persönlichkeit braucht diese Stelle?</p>

            {/* 1. Kurzbeschreibung */}
            <div style={{ marginTop: 24, marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>1. Kurzbeschreibung der Stelle</p>

              {topTaetigkeiten.length > 0 && (
                <>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: "0 0 8px" }}>
                    Die zentralen Aufgaben dieser Stelle:
                  </p>
                  <ul style={{ margin: "0 0 14px", paddingLeft: 20, listStyleType: "disc" }}>
                    {topTaetigkeiten.map((t, i) => (
                      <li key={i} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, marginBottom: 3 }}>{t}</li>
                    ))}
                  </ul>
                </>
              )}

              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "0 0 8px", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                {rollenBeschreibungIntro}
              </p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                {rollenBeschreibungErgaenzung}
              </p>
            </div>

            {/* 2. Strukturprofil */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>2. Strukturprofil der Stelle</p>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, fontWeight: 400, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                  {strukturprofilText}
                </p>
              </div>
              <div style={{ padding: "18px 20px", borderRadius: 12, background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "#48484A", lineHeight: 1.75, margin: "0 0 16px", fontWeight: 400, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                  Jeder Mensch verfügt über die drei grundlegenden Denk- und Handlungsweisen Impulsiv, Intuitiv und Analytisch. Alle drei Anteile sind immer vorhanden. Der Unterschied liegt in ihrer Reihenfolge und Gewichtung.
                  <br /><br />
                  Diese Struktur prägt, wie Menschen im Alltag entscheiden, kommunizieren und handeln. Je nach Situation kann sich die sichtbare Wirkung verändern: im Arbeitsalltag, unter Stress oder in entspannten Situationen.
                </p>
                <ProfileBar label="Impulsiv" value={data.gesamt.imp} color={COLORS.imp} />
                <div style={{ height: 8 }} />
                <ProfileBar label="Intuitiv" value={data.gesamt.int} color={COLORS.int} />
                <div style={{ height: 8 }} />
                <ProfileBar label="Analytisch" value={data.gesamt.ana} color={COLORS.ana} />

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#48484A", margin: "0 0 12px" }}>Bedeutung der Komponenten</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    {komponentenBedeutung.map((kb, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ flex: 1, padding: "14px 16px", borderRadius: 10, background: `linear-gradient(135deg, ${kb.color}12, ${kb.color}06)`, border: `1px solid ${kb.color}20`, display: "flex", flexDirection: "column" }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: kb.color, marginBottom: 8, display: "block" }}>{kb.label}</span>
                            <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, color: "#48484A", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid={`text-bedeutung-${kb.key}`}>
                              {kb.text}
                            </p>
                          </div>
                          <div style={{ width: "100%", height: 2, background: kb.color, margin: "10px 0", borderRadius: 1, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, color: "#48484A", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                            {kb.warning}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {profilkonflikt && (
                <div style={{
                  marginTop: 14, padding: "12px 16px", borderRadius: 12,
                  background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.15)",
                }}>
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7, margin: 0, fontWeight: 450 }} data-testid="text-profilkonflikt" lang="de">
                    {profilkonflikt}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Arbeitslogik */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>3. Arbeitslogik der Stelle</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                {arbeitslogikText}
              </p>
            </div>

            {/* 4. Rahmenbedingungen */}
            {rahmenText && (
              <div style={{ marginBottom: 28 }} data-testid="bericht-section-rahmen">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>4. Rahmenbedingungen</p>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-rahmenbedingungen">
                  {rahmenText}
                </p>
              </div>
            )}

            {/* 5. Erfolgsfokus */}
            {erfolgsfokusText && (
              <div style={{ marginBottom: 0 }} data-testid="bericht-section-kompetenz">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 8px" }}>
                  {rahmenText ? "5." : "4."} Erfolgsfokus
                </p>
                <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-erfolgsfokus">
                  {erfolgsfokusText}
                </p>
              </div>
            )}
          </div>

          {/* ── SEITE 2: VERHALTEN ── */}
          <div data-section="position" style={{ marginBottom: 40 }} data-testid="bericht-section-struktur">
            <SectionHead num={2} title="Verhalten · Alltag und Stress" color={SECTION_COLORS.verhalten} />

            <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 20px" }}>Wie zeigt sich diese Stelle im Alltag und unter Druck?</p>

            {/* Verhalten im Alltag */}
            <div style={{ marginBottom: 20, borderLeft: "4px solid #34C759", borderRadius: 8, background: "rgba(52,199,89,0.04)", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Sun size={18} color="#34C759" strokeWidth={2.2} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Verhalten im Alltag</p>
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                {alltagsverhalten}
              </p>
            </div>

            {/* Verhalten unter Druck */}
            <div style={{ marginBottom: 20, borderLeft: "4px solid #FF9500", borderRadius: 8, background: "rgba(255,149,0,0.04)", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Gauge size={18} color="#FF9500" strokeWidth={2.2} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Verhalten unter Druck</p>
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                {stress.controlled}
              </p>
            </div>

            {/* Verhalten bei starkem Stress */}
            <div style={{ marginBottom: 0, borderLeft: "4px solid #FF3B30", borderRadius: 8, background: "rgba(255,59,48,0.04)", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Flame size={18} color="#FF3B30" strokeWidth={2.2} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Verhalten bei starkem Stress</p>
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                {stress.uncontrolled}
              </p>
            </div>
          </div>

          {/* ── SEITE 3: TEAMWIRKUNG & RISIKEN ── */}
          <div data-section="anforderung" data-testid="bericht-section-risiko">
            <SectionHead num={3} title="Teamwirkung & Fehlbesetzungsrisiken" color={SECTION_COLORS.teamwirkung} />

            <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: "0 0 20px" }}>Welche Wirkung hat diese Stelle im Team?</p>

            {/* Führungswirkung / Teamwirkung */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>
                {data.isLeadership ? "Führungswirkung der Stelle" : "Teamwirkung der Stelle"}
              </p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                {teamwirkung}
              </p>
            </div>

            {/* Spannungsfelder */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Spannungsfelder der Stelle</p>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.6, margin: "0 0 12px" }}>
                Typische Spannungen dieser Stelle sind:
              </p>
              <div style={{ paddingLeft: 4 }}>
                {spannungsfelder.map((sf, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#1D1D1F", marginTop: 8, flexShrink: 0, opacity: 0.4 }} />
                    <span style={{ fontSize: 14, color: "#48484A", lineHeight: 1.7 }}>{sf}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: "12px 0 0", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                {data.dom.key === "imp"
                  ? "Die Stelle verlangt, diese Gegensätze situativ auszubalancieren, ohne dabei das Tempo und die Umsetzungsstärke zu verlieren."
                  : data.dom.key === "int"
                  ? "Die Stelle verlangt, diese Gegensätze situativ auszubalancieren, ohne dabei den persönlichen Kontakt und das Vertrauen zu verlieren."
                  : "Die Stelle verlangt, diese Gegensätze situativ auszubalancieren, ohne dabei die fachliche Qualität und Prozesssicherheit zu gefährden."}
              </p>
            </div>

            {/* Fehlbesetzungsrisiken */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 14px" }}>Fehlbesetzungsrisiken</p>
              {fehlbesetzung.map((risk, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#3A3A3C", margin: "0 0 8px", fontStyle: "italic" }}>{risk.label}</p>
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
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 10px" }}>Typische Person für diese Stelle</p>
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
                    Personenprofil konnte nicht geladen werden.
                  </p>
                ) : (
                  <p style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: 0, textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de" data-testid="text-kandidatenprofil">
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
            }} data-testid="bericht-section-fazit">
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: "0 0 4px" }}>Entscheidungsfazit</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#48484A", margin: "0 0 14px" }}>{fazit.titel}</p>
              {fazit.absaetze.map((absatz, i) => (
                <p key={i} style={{ fontSize: 14, color: "#48484A", lineHeight: 1.85, margin: i < fazit.absaetze.length - 1 ? "0 0 10px" : "0", textAlign: "justify", textAlignLast: "left" as any, hyphens: "auto", WebkitHyphens: "auto" } as any} lang="de">
                  {absatz}
                </p>
              ))}
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "#C7C7CC", margin: 0, letterSpacing: "0.02em" }}>
              © {new Date().getFullYear()} bioLogic Talent Navigator · Stellenanalyse · Erstellt am {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
