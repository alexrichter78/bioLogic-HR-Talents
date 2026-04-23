import type { ComponentKey, Triad } from "./bio-types";
export type { ComponentKey, Triad } from "./bio-types";
export type FitStatus = "SUITABLE" | "CONDITIONAL" | "NOT_SUITABLE";
export type ControlIntensity = "LOW" | "MEDIUM" | "HIGH";

type BG = { imp: number; int: number; ana: number };

export type RoleDnaStateInput = {
  beruf: string;
  fuehrung?: string;
  erfolgsfokusIndices?: number[];
  aufgabencharakter?: string;
  arbeitslogik?: string;
  taetigkeiten?: { id: number; name: string; kategorie: string; kompetenz?: string; niveau?: string }[];
  bioGramGesamt?: BG;
  bioGramHaupt?: BG;
  bioGramNeben?: BG;
  bioGramFuehrung?: BG;
  bioGramRahmen?: BG;
};

type RoleTerms = {
  kpiExamples: string;
  forecastTerm: string;
  reportingDesc: string;
  qualityMetric: string;
  pipelineTerm: string;
  escalationExample: string;
  competitionMetrics: string;
  resultMetric: string;
  targetTerm: string;
  tempoContext: string;
};

type RoleCategory = "vertrieb" | "bildung" | "technik" | "produktion" | "pflege" | "finanzen" | "hr" | "marketing" | "fuehrung" | "verwaltung" | "generic";

function detectRoleCategory(jobFamily: string, jobTitle: string): RoleCategory {
  const text = `${jobFamily} ${jobTitle}`.toLowerCase();
  if (/vertrieb|sales|verkauf|akquise|business.?development|account|key.?account/.test(text)) return "vertrieb";
  if (/bildung|ausbildung|lehre|training|pädagog|berufsbildung|dozent|lehrer|schul|erzieh|coach|seminar|kurs|lernbegleit/.test(text)) return "bildung";
  if (/technik|it\b|software|engineering|entwickl|informatik|system|devops|architekt|programm/.test(text)) return "technik";
  if (/produktion|fertigung|manufacturing|logistik|lager|supply.?chain|montage|werkstatt/.test(text)) return "produktion";
  if (/pflege|gesundheit|medizin|therapeut|klinik|spital|praxis|patient|ärzt|apothek/.test(text)) return "pflege";
  if (/finanz|controlling|buchhaltung|rechnungswesen|treuhänd|revision|audit|steuer(?!ung)/.test(text)) return "finanzen";
  if (/personal|hr\b|human.?resources|recruiting|talent/.test(text)) return "hr";
  if (/marketing|kommunikation|werbung|content|brand|kampagne|digital.?market/.test(text)) return "marketing";
  if (/geschäftsführ|direktor|leitung|ceo|coo|cfo|managing|vorstand/.test(text)) return "fuehrung";
  if (/verwaltung|administration|sachbearbeit|sekretariat|empfang|office/.test(text)) return "verwaltung";
  return "generic";
}

function resolveRoleTerms(role: RoleAnalysis): RoleTerms {
  const cat = detectRoleCategory(role.job_family, role.job_title);
  switch (cat) {
    case "vertrieb":
      return {
        kpiExamples: "Abschlussquoten, Pipeline-Volumen, Umsatz",
        forecastTerm: "Umsatz-Forecast",
        reportingDesc: "Vertriebsberichte, Umsatzprognosen, Pipeline-Pflege",
        qualityMetric: "Vertriebsqualität",
        pipelineTerm: "Pipeline-Qualität",
        escalationExample: "bei Kundeneskalationen",
        competitionMetrics: "Marktanteile, Abschlussquoten, Reaktionszeiten",
        resultMetric: "Abschlussquoten und Umsatzdynamik",
        targetTerm: "Umsatzziele",
        tempoContext: "Markttempo",
      };
    case "bildung":
      return {
        kpiExamples: "Ausbildungsqualität, Lernfortschritt, Prüfungserfolgsquote",
        forecastTerm: "Ausbildungsplanung",
        reportingDesc: "Ausbildungsberichte, Lernstandserhebungen, Bildungsdokumentation",
        qualityMetric: "Ausbildungsqualität",
        pipelineTerm: "Lernfortschritt und Ausbildungsstand",
        escalationExample: "bei Lernrückständen oder Ausbildungsabbruch",
        competitionMetrics: "Ausbildungsqualität, Betreuungsschlüssel, Prüfungserfolgsquote",
        resultMetric: "Lernerfolg und Ausbildungsqualität",
        targetTerm: "Ausbildungsziele",
        tempoContext: "Ausbildungstempo",
      };
    case "technik":
      return {
        kpiExamples: "Projektqualität, Liefertreue, Fehlerquoten",
        forecastTerm: "Projekt-Forecast",
        reportingDesc: "Projektberichte, Statusupdates, Qualitätskennzahlen",
        qualityMetric: "Projektqualität",
        pipelineTerm: "Projektfortschritt und Lieferqualität",
        escalationExample: "bei technischen Eskalationen oder Lieferverzug",
        competitionMetrics: "Innovationsgeschwindigkeit, Liefertreue, Qualitätsstandards",
        resultMetric: "Projektqualität und Liefertreue",
        targetTerm: "Projektziele",
        tempoContext: "Projekttempo",
      };
    case "produktion":
      return {
        kpiExamples: "Produktionsqualität, Durchlaufzeiten, Ausschussquote",
        forecastTerm: "Produktionsplanung",
        reportingDesc: "Produktionsberichte, Qualitätsprotokolle, Auslastungskennzahlen",
        qualityMetric: "Produktionsqualität",
        pipelineTerm: "Produktionsfluss und Liefertreue",
        escalationExample: "bei Produktionsstörungen oder Qualitätsabweichungen",
        competitionMetrics: "Durchlaufzeiten, Ausschussquote, Liefertreue",
        resultMetric: "Produktionsleistung und Liefertreue",
        targetTerm: "Produktionsziele",
        tempoContext: "Produktionstempo",
      };
    case "pflege":
      return {
        kpiExamples: "Versorgungsqualität, Betreuungsschlüssel, Dokumentationsqualität",
        forecastTerm: "Einsatzplanung",
        reportingDesc: "Pflegeberichte, Dokumentation, Qualitätskennzahlen",
        qualityMetric: "Versorgungsqualität",
        pipelineTerm: "Versorgungskontinuität und Betreuungsqualität",
        escalationExample: "bei Versorgungsengpässen oder kritischen Situationen",
        competitionMetrics: "Versorgungsqualität, Patientenzufriedenheit, Dokumentationsstandards",
        resultMetric: "Versorgungsqualität und Patientensicherheit",
        targetTerm: "Versorgungsziele",
        tempoContext: "Versorgungstempo",
      };
    case "finanzen":
      return {
        kpiExamples: "Berichtsqualität, Forecast-Genauigkeit, Budgetdisziplin",
        forecastTerm: "Finanz-Forecast",
        reportingDesc: "Finanzberichte, Abschlüsse, Budgetübersichten",
        qualityMetric: "Berichtsqualität",
        pipelineTerm: "Abschlussqualität und Reporting-Konsistenz",
        escalationExample: "bei Budgetabweichungen oder Prüfungsanfragen",
        competitionMetrics: "Abschlussqualität, Termintreue, Prüfungssicherheit",
        resultMetric: "Berichtsqualität und Forecast-Genauigkeit",
        targetTerm: "Finanzziele",
        tempoContext: "Abschlusstempo",
      };
    case "hr":
      return {
        kpiExamples: "Time-to-Hire, Besetzungsqualität, Mitarbeiterbindung",
        forecastTerm: "Personalplanung",
        reportingDesc: "Personalberichte, Fluktuationskennzahlen, Besetzungsstand",
        qualityMetric: "Besetzungsqualität",
        pipelineTerm: "Besetzungs-Pipeline und Besetzungsstand",
        escalationExample: "bei Vakanzen oder Personalengpässen",
        competitionMetrics: "Time-to-Hire, Besetzungsqualität, Fluktuation",
        resultMetric: "Besetzungsqualität und Mitarbeiterbindung",
        targetTerm: "Personalziele",
        tempoContext: "Besetzungstempo",
      };
    case "marketing":
      return {
        kpiExamples: "Kampagnen-Performance, Reichweite, Conversion-Rate",
        forecastTerm: "Kampagnenplanung",
        reportingDesc: "Kampagnenberichte, Performance-Analysen, ROI-Kennzahlen",
        qualityMetric: "Kampagnenqualität",
        pipelineTerm: "Kampagnen-Pipeline und Content-Qualität",
        escalationExample: "bei Kampagnenabweichungen oder Budgetüberschreitung",
        competitionMetrics: "Reichweite, Conversion, Markenbekanntheit",
        resultMetric: "Kampagnen-Performance und Markenpositionierung",
        targetTerm: "Marketingziele",
        tempoContext: "Kampagnentempo",
      };
    case "fuehrung":
      return {
        kpiExamples: "Teamperformance, Zielerreichung, Mitarbeiterbindung",
        forecastTerm: "Geschäfts-Forecast",
        reportingDesc: "Management-Reports, Zielvereinbarungen, Performance-Übersichten",
        qualityMetric: "Führungsqualität",
        pipelineTerm: "Zielerreichung und Teamperformance",
        escalationExample: "bei Zielabweichungen oder Führungskonflikten",
        competitionMetrics: "Zielerreichung, Teamstabilität, Marktpositionierung",
        resultMetric: "Geschäftsergebnisse und Teamperformance",
        targetTerm: "Geschäftsziele",
        tempoContext: "Umsetzungstempo",
      };
    case "verwaltung":
      return {
        kpiExamples: "Durchlaufzeiten, Fehlerquoten, Termintreue",
        forecastTerm: "Arbeitsplanung",
        reportingDesc: "Statusberichte, Prozessübersichten, Qualitätskennzahlen",
        qualityMetric: "Prozessqualität",
        pipelineTerm: "Vorgangsbearbeitung und Prozessqualität",
        escalationExample: "bei Terminverzug oder Prozessabweichungen",
        competitionMetrics: "Durchlaufzeiten, Fehlerquoten, Termintreue",
        resultMetric: "Prozessqualität und Termintreue",
        targetTerm: "Prozessziele",
        tempoContext: "Bearbeitungstempo",
      };
    default:
      return {
        kpiExamples: "Zielerreichung, Ergebnisqualität, Prozessstabilität",
        forecastTerm: "Ergebnisprognose",
        reportingDesc: "Statusberichte, Kennzahlenübersichten, Ergebnisprotokolle",
        qualityMetric: "Ergebnisqualität",
        pipelineTerm: "Arbeitsfortschritt und Ergebnisqualität",
        escalationExample: "bei Zielabweichungen oder Qualitätsproblemen",
        competitionMetrics: "Ergebnisqualität, Zielerreichung, Reaktionsgeschwindigkeit",
        resultMetric: "Ergebnisqualität und Zielerreichung",
        targetTerm: "Leistungsziele",
        tempoContext: "Arbeitstempo",
      };
  }
}

export type RoleAnalysis = {
  job_title: string;
  job_family: string;
  role_profile: Triad;
  frame_profile: Triad;
  leadership: {
    required: boolean;
    profile?: Triad;
    type?: string;
  };
  tasks_profile: Triad;
  human_profile: Triad;
  success_metrics: string[];
  tension_fields: string[];
  environment_tags?: {
    market_pressure?: "niedrig" | "mittel" | "hoch";
    regulation?: "niedrig" | "mittel" | "hoch";
    change_rate?: "niedrig" | "mittel" | "hoch";
    sales_cycle?: "kurz" | "mittel" | "lang";
    customer_type?: "B2C" | "B2B" | "mixed";
  };
};

export type CandidateInput = {
  candidate_name?: string;
  candidate_profile: Triad;
  leadership_profile?: Triad;
};

export type DominanceMode =
  | "EXTREME_I" | "EXTREME_N" | "EXTREME_A"
  | "DOM_I" | "DOM_N" | "DOM_A"
  | "DUAL_I_A" | "DUAL_I_N" | "DUAL_N_A"
  | "BAL_I" | "BAL_N" | "BAL_A"
  | "BAL_FULL";

export type DominanceResult = {
  mode: DominanceMode;
  top1: { key: ComponentKey; value: number };
  top2: { key: ComponentKey; value: number };
  top3: { key: ComponentKey; value: number };
  gap1: number;
  gap2: number;
};

type MatrixAreaId =
  | "dominance" | "decision_logic" | "kpi_work" | "leadership_effect"
  | "conflict" | "competition" | "culture"
  | "strategy_complexity" | "regulatory_precision" | "customer_orientation";

export type MatrixRow = {
  areaId: MatrixAreaId;
  areaLabel: string;
  roleDemand: string;
  candidatePattern: string;
  status: FitStatus;
  reasoning: string;
};

export type EngineResult = {
  roleDominance: DominanceResult;
  candDominance: DominanceResult;
  overallFit: FitStatus;
  mismatchScore: number;
  koTriggered: boolean;
  controlIntensity: ControlIntensity;
  controlPoints: number;
  criticalArea: MatrixAreaId;
  criticalAreaLabel: string;
  equalDistribution: boolean;
  secondaryTension: {
    detected: boolean;
    roleSecondary: ComponentKey;
    candSecondary: ComponentKey;
    roleSecondaryValue: number;
    candSecondaryValue: number;
    text: string;
    stressText: string;
  } | null;
  keyReason: string;
  executiveSummary: string;
  matrix: MatrixRow[];
  risks: { shortTerm: string[]; midTerm: string[]; longTerm: string[] };
  development: { likelihood: "hoch" | "mittel" | "gering"; timeframe: string; text: string };
  integrationPlan90: { phase_0_30: string[]; phase_30_60: string[]; phase_60_90: string[] };
};

function triadSum(t: Triad) {
  return t.impulsiv + t.intuitiv + t.analytisch;
}

export function normalizeTriad(t: Triad): Triad {
  const sum = triadSum(t);
  if (sum === 0) return { impulsiv: 0, intuitiv: 0, analytisch: 0 };
  if (Math.abs(sum - 100) <= 1) return t;
  return {
    impulsiv: Math.round((t.impulsiv / sum) * 100),
    intuitiv: Math.round((t.intuitiv / sum) * 100),
    analytisch: Math.round((t.analytisch / sum) * 100),
  };
}

const COMP_SORT_ORDER: Record<ComponentKey, number> = { impulsiv: 0, intuitiv: 1, analytisch: 2 };
function sortTriadDesc(t: Triad) {
  return (Object.keys(t) as ComponentKey[]).map(k => ({ key: k, value: t[k] })).sort((a, b) => b.value - a.value || COMP_SORT_ORDER[a.key] - COMP_SORT_ORDER[b.key]);
}

export function dominanceModeOf(tIn: Triad): DominanceResult {
  const t = normalizeTriad(tIn);
  const sorted = sortTriadDesc(t);
  const [top1, top2, top3] = sorted;
  const gap1 = top1.value - top2.value;
  const gap2 = top2.value - top3.value;

  const isExtreme = top1.value >= 60 || gap1 >= 18;
  const isClear = gap1 >= 8;
  const isDual = gap1 <= 4 && gap2 >= 6;
  const isFullBal = gap1 <= 5 && gap2 <= 5;
  const isBalancedTendency = gap1 <= 7 && gap2 <= 7 && top1.value > top2.value;

  const k = top1.key;
  const k2 = top2.key;
  let mode: DominanceMode;

  if (isExtreme) {
    mode = k === "impulsiv" ? "EXTREME_I" : k === "intuitiv" ? "EXTREME_N" : "EXTREME_A";
  } else if (isDual) {
    const pair = [k, k2].sort().join("_");
    if (pair === ["analytisch", "impulsiv"].sort().join("_")) mode = "DUAL_I_A";
    else if (pair === ["impulsiv", "intuitiv"].sort().join("_")) mode = "DUAL_I_N";
    else mode = "DUAL_N_A";
  } else if (isClear) {
    mode = k === "impulsiv" ? "DOM_I" : k === "intuitiv" ? "DOM_N" : "DOM_A";
  } else if (isFullBal) {
    mode = "BAL_FULL";
  } else if (isBalancedTendency) {
    mode = k === "impulsiv" ? "BAL_I" : k === "intuitiv" ? "BAL_N" : "BAL_A";
  } else {
    mode = "BAL_FULL";
  }

  return { mode, top1, top2, top3, gap1, gap2 };
}

export function labelComponent(k: ComponentKey, lang?: string) {
  if (lang === "EN") {
    if (k === "impulsiv") return "Impulsive";
    if (k === "intuitiv") return "Intuitive";
    return "Analytical";
  }
  if (lang === "FR") {
    if (k === "impulsiv") return "Rythme et Décision";
    if (k === "intuitiv") return "Communication et Relations";
    return "Structure et Rigueur";
  }
  if (lang === "IT") {
    if (k === "impulsiv") return "Ritmo e Decisione";
    if (k === "intuitiv") return "Comunicazione e Relazioni";
    return "Struttura e Rigore";
  }
  if (k === "impulsiv") return "Impulsiv";
  if (k === "intuitiv") return "Intuitiv";
  return "Analytisch";
}

export function dominanceLabel(dom: DominanceResult) {
  const { mode, top1, top2 } = dom;
  const k1 = labelComponent(top1.key);
  const k2 = labelComponent(top2.key);

  switch (mode) {
    case "EXTREME_I": case "EXTREME_N": case "EXTREME_A":
      return `${k1} extrem dominant`;
    case "DOM_I": case "DOM_N": case "DOM_A":
      return `${k1} dominant`;
    case "DUAL_I_A": return "Doppel-Schwerpunkt: Impulsiv–Analytisch";
    case "DUAL_I_N": return "Doppel-Schwerpunkt: Impulsiv–Intuitiv";
    case "DUAL_N_A": return "Doppel-Schwerpunkt: Intuitiv–Analytisch";
    case "BAL_I": case "BAL_N": case "BAL_A":
      return `Ausgeglichen mit ${k1}-Tendenz`;
    case "BAL_FULL": return "Voll ausgeglichen";
    default: return `${k1} / ${k2}`;
  }
}

function weightedMismatch(role: Triad, cand: Triad) {
  const r = normalizeTriad(role);
  const c = normalizeTriad(cand);
  const wI = r.impulsiv / 100;
  const wN = r.intuitiv / 100;
  const wA = r.analytisch / 100;
  const dI = Math.abs(r.impulsiv - c.impulsiv);
  const dN = Math.abs(r.intuitiv - c.intuitiv);
  const dA = Math.abs(r.analytisch - c.analytisch);
  return +(wI * dI + wN * dN + wA * dA).toFixed(2);
}

export function koRuleTriggered(role: RoleAnalysis, cand: CandidateInput): boolean {
  const r = normalizeTriad(role.role_profile);
  const c = normalizeTriad(cand.candidate_profile);
  const roleDom = dominanceModeOf(r);
  const candDom = dominanceModeOf(c);

  if ((roleDom.mode === "EXTREME_I" && c.impulsiv <= 35 && r.impulsiv >= 65) ||
      (roleDom.mode === "EXTREME_N" && c.intuitiv <= 30 && r.intuitiv >= 55) ||
      (roleDom.mode === "EXTREME_A" && c.analytisch <= 35 && r.analytisch >= 65)) return true;

  if (roleDom.top1.key !== candDom.top1.key) {
    const mainDiff = Math.abs(r[roleDom.top1.key] - c[roleDom.top1.key]);
    if (mainDiff >= 18) return true;
    if (roleDom.gap1 >= 20 && mainDiff >= 15) return true;
  }

  if (roleDom.mode.startsWith("DUAL")) {
    const domKeys: ComponentKey[] = [roleDom.top1.key, roleDom.top2.key];
    for (const k of domKeys) { if (c[k] < r[k] * 0.75) return true; }
  }

  if (role.leadership?.required) {
    const lp = role.leadership.profile ? normalizeTriad(role.leadership.profile) : null;
    if (lp && lp.impulsiv >= 60 && c.impulsiv <= 35) return true;
  }

  return false;
}

function overallFitFromScore(mismatch: number, sameDominance: boolean): FitStatus {
  const suitableThreshold = sameDominance ? 12 : 10;
  const conditionalThreshold = sameDominance ? 20 : 18;
  if (mismatch <= suitableThreshold) return "SUITABLE";
  if (mismatch <= conditionalThreshold) return "CONDITIONAL";
  return "NOT_SUITABLE";
}

export function calcControlIntensity(role: RoleAnalysis, cand: CandidateInput): { points: number; level: ControlIntensity } {
  const r = normalizeTriad(role.role_profile);
  const c = normalizeTriad(cand.candidate_profile);
  const rDom = dominanceModeOf(r);
  const cDom = dominanceModeOf(c);
  let points = 0;

  const rIsDual = rDom.gap1 <= 4 && rDom.gap2 >= 6;
  const cPrimaryInRDual = rIsDual && (cDom.top1.key === rDom.top1.key || cDom.top1.key === rDom.top2.key);
  const effSameDom = rDom.top1.key === cDom.top1.key || cPrimaryInRDual;
  if (!effSameDom || rDom.mode.startsWith("DUAL") !== cDom.mode.startsWith("DUAL")) points += 2;
  if (rDom.mode.startsWith("EXTREME")) points += 1;
  if (rDom.gap1 >= 12) points += 1;

  const mainDiff = Math.abs(r[rDom.top1.key] - c[rDom.top1.key]);
  if (mainDiff >= 25) points += 3;
  else if (mainDiff >= 15) points += 2;

  if (role.leadership?.required) {
    const lp = role.leadership.profile ? normalizeTriad(role.leadership.profile) : null;
    if (lp) {
      const lDom = dominanceModeOf(lp);
      const leadDiff = Math.abs(lp[lDom.top1.key] - c[lDom.top1.key]);
      if (leadDiff >= 15) points += 2;
    } else { points += 1; }
  }

  const f = normalizeTriad(role.frame_profile);
  const fDom = dominanceModeOf(f);
  if (fDom.top1.value >= 75) { if (cDom.top1.key !== fDom.top1.key) points += 2; }
  else if (fDom.top1.value >= 65) { if (cDom.top1.key !== fDom.top1.key) points += 1; }

  const tags = role.environment_tags || {};
  if (tags.market_pressure === "hoch" && r.impulsiv - c.impulsiv >= 15) points += 1;
  if (tags.regulation === "hoch" && r.analytisch - c.analytisch >= 15) points += 1;
  if (tags.change_rate === "hoch" && c.analytisch - r.analytisch >= 15) points += 1;

  let level: ControlIntensity = "LOW";
  if (points >= 6) level = "HIGH";
  else if (points >= 3) level = "MEDIUM";

  return { points, level };
}

function gapDesc(diff: number): string {
  if (diff <= 3) return "nahezu identisch";
  if (diff <= 8) return "eine kleine Abweichung";
  if (diff <= 15) return "eine merkliche Abweichung";
  if (diff <= 25) return "eine deutliche Abweichung";
  return "eine grosse Diskrepanz";
}

function gapAdj(diff: number): string {
  if (diff <= 3) return "nahezu identisch";
  if (diff <= 8) return "leicht abweichend";
  if (diff <= 15) return "erkennbar abweichend";
  if (diff <= 25) return "deutlich abweichend";
  return "stark abweichend";
}

function buildMatrix(role: RoleAnalysis, cand: CandidateInput, t: RoleTerms): MatrixRow[] {
  const r = normalizeTriad(role.role_profile);
  const c = normalizeTriad(cand.candidate_profile);
  const rDom = dominanceModeOf(r);
  const cDom = dominanceModeOf(c);
  const rows: MatrixRow[] = [];

  const candIsEqualDist = cDom.mode === "BAL_FULL";

  const dominanceStatus: FitStatus = (() => {
    if (candIsEqualDist && rDom.gap1 >= 12) return "NOT_SUITABLE";
    if (candIsEqualDist) return "CONDITIONAL";
    const sameDominant =
      (rDom.mode.startsWith("DUAL") && cDom.mode.startsWith("DUAL") &&
        [rDom.top1.key, rDom.top2.key].sort().join("|") === [cDom.top1.key, cDom.top2.key].sort().join("|")) ||
      (!rDom.mode.startsWith("DUAL") && !cDom.mode.startsWith("DUAL") && rDom.top1.key === cDom.top1.key);
    const diff = Math.abs(r[rDom.top1.key] - c[rDom.top1.key]);
    if (sameDominant && diff <= 10) return "SUITABLE";
    if (sameDominant && diff <= 20) return "CONDITIONAL";
    if (!sameDominant && rDom.gap1 >= 12) return "NOT_SUITABLE";
    if (!sameDominant && diff <= 5) return "CONDITIONAL";
    if (!sameDominant && diff > 20) return "NOT_SUITABLE";
    return "CONDITIONAL";
  })();

  const sameDominant = rDom.top1.key === cDom.top1.key;
  const domDiff = Math.abs(r[rDom.top1.key] - c[rDom.top1.key]);
  const rLabel = labelComponent(rDom.top1.key);
  const cLabel = labelComponent(cDom.top1.key);

  rows.push({
    areaId: "dominance", areaLabel: "Dominanzstruktur",
    roleDemand: dominanceLabel(rDom), candidatePattern: dominanceLabel(cDom),
    status: dominanceStatus,
    reasoning: candIsEqualDist
      ? `Gleichverteilung: Die Person zeigt keine klare Arbeitsweise. Die Stelle braucht eine deutliche ${rLabel}-Ausrichtung. Ohne einen klaren Schwerpunkt fehlt die Grundlage, um Aufgaben gezielt zu priorisieren und Entscheidungen konsequent zu treffen.`
      : dominanceStatus === "SUITABLE"
        ? `Die Arbeitsweise passt: Beide Profile sind ${rLabel}-geprägt und ${gapAdj(domDiff)}. Die Stelle wird in ihren Kernanforderungen gut abgebildet – Entscheidungen, Prioritäten und Arbeitsweise bleiben konsistent.`
        : dominanceStatus === "CONDITIONAL"
          ? (sameDominant
            ? `Gleiche Arbeitsweise (${rLabel}), aber es gibt ${gapDesc(domDiff)} in der Ausprägung. In Drucksituationen kann die Umsetzung schwächer ausfallen als gefordert. Klare Ziele und regelmässige Abstimmungen helfen hier.`
            : `Verschiebung von ${rLabel} zu ${cLabel}: Die Arbeitsweise verändert sich. Entscheidungen und Prioritäten folgen einer anderen Logik. Mit klaren Zielvorgaben und festen Entscheidungsfristen lässt sich das steuern.`)
          : `Deutliche Verschiebung von ${rLabel} zu ${cLabel}. Die zentrale Arbeitsweise der Stelle wird nicht abgebildet. Die Art, wie Entscheidungen getroffen und Prioritäten gesetzt werden, weicht grundlegend von dem ab, was die Stelle verlangt.`,
  });

  const decisionStatus: FitStatus = (() => {
    if (rDom.top1.key === "impulsiv" && cDom.top1.key === "intuitiv" && r.impulsiv >= 50) return "NOT_SUITABLE";
    if (rDom.top1.key === "analytisch" && cDom.top1.key === "impulsiv" && r.analytisch >= 50) return "NOT_SUITABLE";
    if (rDom.top1.key === cDom.top1.key) return "SUITABLE";
    const mainKeyDiff = Math.abs(r[rDom.top1.key] - c[rDom.top1.key]);
    if (mainKeyDiff <= 8) return "CONDITIONAL";
    if (mainKeyDiff <= 15) return "CONDITIONAL";
    return "NOT_SUITABLE";
  })();

  const decRoleDesc = rDom.top1.key === "impulsiv" ? "schnelle, verbindliche Entscheidungen"
    : rDom.top1.key === "analytisch" ? "sorgfältige, standardorientierte Entscheidungen"
    : "abstimmungsorientierte, beziehungsstabilisierende Entscheidungen";
  const decCandDesc = cDom.top1.key === "impulsiv" ? "direkt und tempoorientiert"
    : cDom.top1.key === "analytisch" ? "abwägend und strukturorientiert"
    : "konsensorientiert und teambezogen";
  const decMainDiff = Math.abs(r[rDom.top1.key] - c[rDom.top1.key]);

  rows.push({
    areaId: "decision_logic", areaLabel: "Entscheidungslogik",
    roleDemand: rDom.top1.key === "impulsiv" ? "Schnell, verbindlich, interventionsstark"
      : rDom.top1.key === "analytisch" ? "Sorgfältig, standardorientiert, risikobewusst"
      : "Abstimmungsorientiert, beziehungsstabilisierend",
    candidatePattern: cDom.top1.key === "impulsiv" ? "Direkt, tempoorientiert, entscheidungsfreudig"
      : cDom.top1.key === "analytisch" ? "Abwägend, absichernd, strukturorientiert"
      : "Konsensorientiert, teambezogen, moderierend",
    status: decisionStatus,
    reasoning: decisionStatus === "SUITABLE"
      ? `Passt: Die Stelle braucht ${decRoleDesc}, die Person entscheidet ${decCandDesc}. Die Art, wie Entscheidungen getroffen und Prioritäten gesetzt werden, stimmt überein. Tempo und Abläufe bleiben stabil.`
      : decisionStatus === "CONDITIONAL"
        ? (sameDominant
          ? `Gleiche Entscheidungsweise (${rLabel}), aber es gibt ${gapDesc(decMainDiff)} in der Ausprägung. Entscheidungen können weicher oder langsamer ausfallen. Klare Fristen und feste Regeln für Eskalationen helfen.`
          : `Die Stelle braucht ${decRoleDesc}, die Person entscheidet ${decCandDesc}. Es gibt ${gapDesc(decMainDiff)} zwischen Anforderung und Person. Entscheidungen werden anders getroffen als die Stelle es verlangt. Klare Fristen und Eskalationswege können das ausgleichen.`)
        : `Die Stelle braucht ${decRoleDesc}, die Person ist ${decCandDesc}. Es gibt ${gapDesc(decMainDiff)} zwischen Anforderung und Person. Eingriffe werden verzögert oder anders priorisiert. ${t.tempoContext}, ${t.qualityMetric} und die operative Führung sind betroffen.`,
  });

  const kpiStatus: FitStatus = (() => {
    if (r.analytisch < 20) return "SUITABLE";
    if (c.analytisch >= r.analytisch - 5) return "SUITABLE";
    if (c.analytisch >= r.analytisch - 15) return "CONDITIONAL";
    return "NOT_SUITABLE";
  })();

  const kpiDiff = r.analytisch - c.analytisch;

  rows.push({
    areaId: "kpi_work", areaLabel: "Arbeitssteuerung und Dokumentation",
    roleDemand: r.analytisch >= 40 ? `Stark kennzahlengesteuert, hohe Anforderung an ${t.reportingDesc}` : r.analytisch >= 25 ? "Kennzahlen als Steuerungsinstrument" : `Geringe Anforderung an ${t.reportingDesc}`,
    candidatePattern: c.analytisch >= 30 ? "Zahlenorientierung und Strukturdisziplin gut ausgeprägt" : c.analytisch >= 20 ? "Kennzahlen als Orientierung, nicht als zentrales Werkzeug" : "Wenig analytische Grundlage",
    status: kpiStatus,
    reasoning: kpiStatus === "SUITABLE"
      ? `Die analytische Grundlage ist vorhanden. Der Umgang mit ${t.kpiExamples} und ${t.reportingDesc} kann stabil aufgesetzt werden. ${t.forecastTerm} und Zielerreichung bleiben verlässlich.`
      : kpiStatus === "CONDITIONAL"
        ? `Es gibt ${gapDesc(kpiDiff)} zwischen Anforderung und Person im analytischen Bereich. Für ${t.reportingDesc} braucht es feste Routinen, klare Standards und konsequentes Nachhalten. Ohne diese Struktur sinkt die Qualität von ${t.forecastTerm} und ${t.qualityMetric}.`
        : `Die analytische Anforderung wird ${gapAdj(kpiDiff)} verfehlt. ${t.reportingDesc} wird unzuverlässig und braucht durchgehende Begleitung. Kennzahlen wie ${t.kpiExamples} verlieren ohne enge Führung ihre Wirkung. ${t.forecastTerm} und ${t.qualityMetric} werden instabil.`,
  });

  if (role.leadership?.required) {
    const lp = role.leadership.profile ? normalizeTriad(role.leadership.profile) : null;
    const leadershipStatus: FitStatus = (() => {
      if (lp) {
        if (lp.impulsiv >= 60 && c.impulsiv <= 35) return "NOT_SUITABLE";
        if (lp.impulsiv >= 55 && cDom.top1.key === "intuitiv") return "CONDITIONAL";
        const lDom = dominanceModeOf(lp);
        const leadDiff = Math.abs(lp[lDom.top1.key] - c[lDom.top1.key]);
        if (leadDiff <= 10 && lDom.top1.key === cDom.top1.key) return "SUITABLE";
        if (leadDiff <= 15) return "CONDITIONAL";
        return "NOT_SUITABLE";
      }
      if (cDom.top1.key === rDom.top1.key) return "SUITABLE";
      return "CONDITIONAL";
    })();

    const lDom = lp ? dominanceModeOf(lp) : null;
    const lLabel = lDom ? labelComponent(lDom.top1.key) : "";
    const leadDiffVal = lDom ? Math.abs(lp![lDom.top1.key] - c[lDom.top1.key]) : 0;

    rows.push({
      areaId: "leadership_effect", areaLabel: "Führungswirkung",
      roleDemand: lp ? `${lLabel}-geprägt (${lp.impulsiv}/${lp.intuitiv}/${lp.analytisch})` : "Führung erforderlich (Profil nicht hinterlegt)",
      candidatePattern: `${labelComponent(cDom.top1.key)}-geprägt (${c.impulsiv}/${c.intuitiv}/${c.analytisch})`,
      status: leadershipStatus,
      reasoning: leadershipStatus === "SUITABLE"
        ? `Die Führungsanforderung ist ${lLabel}-geprägt – die Person bringt eine passende Ausprägung mit. Zielklarheit, Delegation und Durchsetzungsfähigkeit passen zur Stelle. Das Team bekommt die Führung, die es braucht.`
        : leadershipStatus === "NOT_SUITABLE"
          ? `Die Stelle braucht ${lLabel}-betonte Führung. Es gibt ${gapDesc(leadDiffVal)} zwischen Anforderung und Person. Klare Zielsetzung, Konfliktfähigkeit und Durchsetzung unter Druck sind zu schwach ausgeprägt. Der Führungsaufwand für die nächste Ebene steigt erheblich.`
          : `Die Führungsanforderung ist ${lLabel}-geprägt. Es gibt ${gapDesc(leadDiffVal)} zwischen Anforderung und Person. Führungswirkung ist machbar, wenn klare Ziele, Eskalationswege und regelmässige Reviews für ${t.kpiExamples} definiert werden.`,
    });
  }

  const conflictStatus: FitStatus = (() => {
    const impDiff = r.impulsiv - c.impulsiv;
    if (r.impulsiv >= 50 && c.impulsiv <= 35) return "NOT_SUITABLE";
    if (r.impulsiv >= 45 && c.impulsiv <= 40) return "CONDITIONAL";
    if (c.impulsiv >= r.impulsiv + 20) return "CONDITIONAL";
    if (Math.abs(impDiff) <= 5) return "SUITABLE";
    if (Math.abs(impDiff) <= 10) return "SUITABLE";
    if (impDiff > 10) return "CONDITIONAL";
    return "SUITABLE";
  })();

  const conflictImpDiff = Math.abs(r.impulsiv - c.impulsiv);

  rows.push({
    areaId: "conflict", areaLabel: "Konfliktfähigkeit",
    roleDemand: r.impulsiv >= 50 ? "Direkt, durchsetzungsstark, leistungsorientiert" : r.impulsiv >= 35 ? "Situativ konfliktfähig" : "Eher moderierend",
    candidatePattern: c.impulsiv >= 45 ? "Direkt und durchsetzungsstark" : c.impulsiv >= 30 ? "Situativ adressierend" : "Eher moderierend/vermeidend",
    status: conflictStatus,
    reasoning: conflictStatus === "SUITABLE"
      ? `Durchsetzungsfähigkeit und Bereitschaft, Probleme direkt anzusprechen, passen zur Stelle. Konflikte werden zeitnah angegangen, Leistungsunterschiede im Team bleiben sichtbar.`
      : conflictStatus === "NOT_SUITABLE"
        ? `Es gibt ${gapDesc(conflictImpDiff)} bei der Konfliktfähigkeit. Bei Abweichungen von Zielen wird die Person eher vermitteln statt klar einzugreifen. Leistungsunterschiede im Team werden nicht konsequent angesprochen – Qualität und Tempo leiden.`
        : `Es gibt ${gapDesc(conflictImpDiff)} bei der Konfliktfähigkeit. Sie ist vorhanden, muss aber in schwierigen Leistungssituationen konsequent eingesetzt werden. Klare Eskalationswege, feste Fristen und verbindliche Ziele helfen dabei.`,
  });

  const tags = role.environment_tags || {};
  const competitionStatus: FitStatus = (() => {
    const impGap = r.impulsiv - c.impulsiv;
    if (tags.market_pressure === "hoch" && impGap >= 15) return "NOT_SUITABLE";
    if (impGap >= 10) return "CONDITIONAL";
    if (c.impulsiv >= r.impulsiv + 15) return "CONDITIONAL";
    if (Math.abs(impGap) <= 8) return "SUITABLE";
    return "CONDITIONAL";
  })();

  const compImpGap = r.impulsiv - c.impulsiv;
  const compMarket = tags.market_pressure === "hoch";

  rows.push({
    areaId: "competition", areaLabel: "Wettbewerbsdynamik",
    roleDemand: compMarket ? "Hoher Marktdruck – starkes Tempo gefordert" : "Marktübliche Dynamik",
    candidatePattern: c.impulsiv >= 45 ? "Tempo- und Abschlussorientierung stark" : c.impulsiv >= 30 ? "Tempo anschlussfähig" : "Tempo reduziert",
    status: competitionStatus,
    reasoning: competitionStatus === "SUITABLE"
      ? `Tempo und Reaktionsfähigkeit passen zur Stelle${compMarket ? " – auch unter hohem Marktdruck" : ""}. ${t.resultMetric} bleiben stabil.`
      : competitionStatus === "NOT_SUITABLE"
        ? `${compMarket ? "Hoher Marktdruck: " : ""}Es gibt ${gapDesc(Math.abs(compImpGap))} beim Tempo. Der nötige Antrieb fehlt – Aufgaben werden eher geprüft als zügig umgesetzt. ${t.resultMetric} werden merklich geschwächt.`
        : `Es gibt ${gapDesc(Math.abs(compImpGap))} beim Tempo. ${t.tempoContext} und Durchsetzungskraft sind machbar, wenn Prioritäten, Fristen und klare Zielvorgaben fest stehen. Ohne diese Struktur verschiebt sich die Dynamik Richtung Absicherung statt Handlung.`,
  });

  const cultureStatus: FitStatus = (() => {
    const domMatch = rDom.top1.key === cDom.top1.key;
    if (r.impulsiv >= 60 && c.intuitiv >= 50) return "CONDITIONAL";
    if (r.impulsiv >= 55 && c.impulsiv < 30) return "NOT_SUITABLE";
    if (domMatch && Math.abs(r.intuitiv - c.intuitiv) <= 10) return "SUITABLE";
    if (c.intuitiv >= 45 && r.impulsiv < 55) return "SUITABLE";
    if (domMatch && Math.abs(r[rDom.top1.key] - c[rDom.top1.key]) <= 8) return "SUITABLE";
    return "CONDITIONAL";
  })();

  const cultIntDiff = Math.abs(r.intuitiv - c.intuitiv);

  rows.push({
    areaId: "culture", areaLabel: "Kulturwirkung",
    roleDemand: r.impulsiv >= 55 ? "Leistungs- und Ergebnisfokus" : r.intuitiv >= 40 ? "Beziehungs- und Teamorientierung" : "Ausgewogene Kultur",
    candidatePattern: c.intuitiv >= 45 ? "Beziehungsstabilisierend" : c.impulsiv >= 45 ? "Leistungsorientiert" : "Sach-/strukturorientiert",
    status: cultureStatus,
    reasoning: cultureStatus === "SUITABLE"
      ? `Die kulturelle Wirkung passt zur Stelle. Teamzusammenhalt, Motivation und Bindung bleiben stabil, ohne die Stellenanforderungen zu beeinträchtigen.`
      : cultureStatus === "NOT_SUITABLE"
        ? `Die kulturelle Wirkung verschiebt sich merklich. Ergebnisorientierung und klare Leistungsunterschiede werden geschwächt. Die Stelle verlangt Leistungsfokus, die Person setzt eher auf Beziehungspflege.`
        : `Es gibt ${gapDesc(cultIntDiff)} in der kulturellen Wirkung. Es besteht das Risiko einer Kulturverschiebung. Machbar, wenn klare Ziele, Leistungserwartungen und Ergebnisorientierung fest verankert werden.`,
  });

  if (tags.sales_cycle === "lang") {
    const stratStatus: FitStatus = c.analytisch >= 35 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "strategy_complexity", areaLabel: "Strategische Komplexität",
      roleDemand: "Langer Zyklus – analytisches Denken gefordert",
      candidatePattern: c.analytisch >= 35 ? "Stark anschlussfähig" : c.analytisch >= 25 ? "Vorhanden" : "Gering",
      status: stratStatus,
      reasoning: stratStatus === "SUITABLE"
        ? `Bei langen Zyklen ist die analytische Grundlage für ${t.pipelineTerm}, ${t.forecastTerm} und geordnete Abläufe ausreichend. Die Umsetzung bleibt stabil.`
        : stratStatus === "CONDITIONAL"
          ? `Bei langen strategischen Zyklen braucht es aktive Begleitung, um Struktur und Disziplin aufrechtzuerhalten. ${t.pipelineTerm} und ${t.forecastTerm} erfordern eine systematische Arbeitsweise, die nicht von selbst stabil bleibt.`
          : `Für lange strategische Zyklen fehlt die analytische Grundlage. ${t.pipelineTerm}, ${t.forecastTerm} und geordnete Abläufe sind ohne enge Begleitung nicht verlässlich.`,
    });
  }

  if (tags.regulation === "hoch") {
    const regStatus: FitStatus = c.analytisch >= 40 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "regulatory_precision", areaLabel: "Regulatorische Präzision",
      roleDemand: "Hohe Regel- und Standardtreue gefordert",
      candidatePattern: c.analytisch >= 40 ? "Sorgfalt und Präzision stark" : c.analytisch >= 25 ? "Vorhanden" : "Deutlich unter der Anforderung",
      status: regStatus,
      reasoning: regStatus === "SUITABLE"
        ? `Die Genauigkeit reicht für regulierte Umfelder aus. Compliance, Auditfähigkeit und Prozessqualität lassen sich stabil aufsetzen.`
        : regStatus === "CONDITIONAL"
          ? `In regulierten Umfeldern braucht es durchgehend klare Standards, Freigabeprozesse und regelmässige Kontrollen. Ohne diese Struktur steigt das Risiko für Abweichungen.`
          : `In regulierten Bereichen kann diese Lücke zu Qualitäts-, Haftungs- oder Auditproblemen führen. Sorgfalt und Regeltreue sind ohne intensive Begleitung nicht gewährleistet.`,
    });
  }

  if (tags.customer_type) {
    const ct = tags.customer_type;
    const custStatus: FitStatus = (() => {
      if (ct === "B2C") {
        if (c.impulsiv >= 40) return "SUITABLE";
        if (c.impulsiv >= 25) return "CONDITIONAL";
        return "NOT_SUITABLE";
      }
      if (ct === "B2B") {
        if (c.intuitiv >= 35 && c.analytisch >= 25) return "SUITABLE";
        if (c.intuitiv >= 25) return "CONDITIONAL";
        return "NOT_SUITABLE";
      }
      return "SUITABLE";
    })();
    rows.push({
      areaId: "customer_orientation", areaLabel: "Kundenorientierung",
      roleDemand: ct === "B2C"
        ? "B2C – Abschlussorientierung gefordert"
        : ct === "B2B"
          ? "B2B – Beziehungsstabilität gefordert"
          : "Mixed",
      candidatePattern: ct === "B2C"
        ? (c.impulsiv >= 40 ? "Abschlussstärke gut ausgeprägt" : "Abschlussstärke muss gesteuert werden")
        : (c.intuitiv >= 35 ? "Beziehungsaufbau stark" : "Eher transaktional"),
      status: custStatus,
      reasoning: custStatus === "SUITABLE"
        ? (ct === "B2C"
          ? `Im B2C-Umfeld: Abschlussstärke und Tempo passen zur geforderten Dynamik. Abschlussquoten bleiben stabil.`
          : ct === "B2B"
            ? `Im B2B-Umfeld: Beziehungsaufbau und wirtschaftliches Verständnis passen zusammen. Kundenbindung und ${t.pipelineTerm} bleiben stabil.`
            : "Die Kundenorientierung passt zur geforderten Dynamik.")
        : custStatus === "CONDITIONAL"
          ? (ct === "B2C"
            ? `Im B2C-Umfeld: Die Abschlussstärke ist vorhanden, braucht aber klare Ziele und regelmässige Führung, um wirksam zu werden. Ohne das sinkt die Abschlussquote.`
            : `Im B2B-Umfeld: Beziehungsfähigkeit ist vorhanden, aber die Balance zwischen Beziehungspflege und Ergebnisorientierung muss aktiv gehalten werden. ${t.pipelineTerm} braucht Führung.`)
          : (ct === "B2C"
            ? `Im B2C-Umfeld: Tempo und Abschlussquote werden voraussichtlich unter dem liegen, was die Stelle braucht. Der nötige Antrieb für schnelle Abschlüsse fehlt.`
            : `Im B2B-Umfeld: Beziehungstiefe und wirtschaftliches Verständnis fehlen. ${t.pipelineTerm} und Kundenbindung sind instabil.`),
    });
  }

  return rows;
}

function criticalAreaFromMatrix(matrix: MatrixRow[]): { id: MatrixAreaId; label: string } {
  const score = (s: FitStatus) => (s === "NOT_SUITABLE" ? 2 : s === "CONDITIONAL" ? 1 : 0);
  let worst = matrix[0];
  for (const row of matrix) { if (score(row.status) > score(worst.status)) worst = row; }
  return { id: worst.areaId, label: worst.areaLabel };
}

function buildRisks(role: RoleAnalysis, cand: CandidateInput, engine: { overallFit: FitStatus; control: ControlIntensity; matrix: MatrixRow[]; mismatch: number }, t: RoleTerms) {
  const tags = role.environment_tags || {};
  const r = normalizeTriad(role.role_profile);
  const c = normalizeTriad(cand.candidate_profile);
  const rDom = dominanceModeOf(r);
  const cDom = dominanceModeOf(c);
  const critical = criticalAreaFromMatrix(engine.matrix);
  const rL = labelComponent(rDom.top1.key);
  const cL = labelComponent(cDom.top1.key);
  const sameDom = rDom.top1.key === cDom.top1.key;
  const jobTitle = role.job_title || "diese Stelle";
  const shortTerm: string[] = [];
  const midTerm: string[] = [];
  const longTerm: string[] = [];

  const candEqualDist = cDom.mode === "BAL_FULL";
  const candDualDominance = !candEqualDist && cDom.gap1 <= 5;
  const roleClearDom = rDom.gap1 >= 15;
  const dualConflict = candDualDominance && roleClearDom;
  const equalDistConflict = candEqualDist && roleClearDom;
  const roleKeyInDual = dualConflict && (cDom.top1.key === rDom.top1.key || cDom.top2.key === rDom.top1.key);

  if (engine.overallFit === "SUITABLE") {
    shortTerm.push(`Die Stelle ${jobTitle} braucht ${rL}-geprägte Arbeit. Die Arbeitsweise passt dazu. Schnelle Einarbeitung und stabile Wirkung bei ${t.qualityMetric} sind zu erwarten.`);
    midTerm.push(`Die Stelle erfordert eigenständiges Priorisieren und Entscheiden. Der Führungsaufwand bleibt überschaubar, die Person steuert sich weitgehend selbst.`);
    longTerm.push(`Die Stellenanforderungen werden langfristig stabil abgedeckt. Es ist nicht zu erwarten, dass sich die Arbeitsweise schleichend von dem entfernt, was ${jobTitle} braucht.`);
  } else if (engine.overallFit === "CONDITIONAL") {
    if (dualConflict) {
      const c2L = labelComponent(cDom.top2.key);
      shortTerm.push(`Die Stelle ${jobTitle} braucht eine klare ${rL}-Ausrichtung. Die Person zeigt aber eine Doppeldominanz: ${labelComponent(cDom.top1.key)} und ${c2L} sind nahezu gleich stark. Reibung im Alltag ist wahrscheinlich.`);
      midTerm.push(`Die Stelle verlangt konsequente ${rL}-Arbeit. Durch die Doppeldominanz wechselt die Person zwischen ${labelComponent(cDom.top1.key)}- und ${c2L}-Prioritäten. Konstanz und ${t.qualityMetric} schwanken.`);
      longTerm.push(`Ohne klare Führung wird die geforderte ${rL}-Wirkung in ${jobTitle} zunehmend verwässert. Entscheidungen und Abläufe verschieben sich schleichend.`);
    } else {
      shortTerm.push(`Die Stelle ${jobTitle} hat im Bereich "${critical.label}" die höchsten Anforderungen. Genau dort zeigt sich die grösste Abweichung. Ein guter Start ist möglich, braucht aber klare Führung.`);
      if (sameDom) {
        midTerm.push(`Die Stelle braucht eine stärkere ${rL}-Ausprägung als vorhanden. Ohne klare Ziele und regelmässige Abstimmungen werden Prioritäten und Umsetzung zunehmend weicher.`);
      } else {
        midTerm.push(`Die Stelle erfordert ${rL}-geprägte Arbeit. Die Arbeitsweise weicht davon ab. Ohne klare Ziele besteht das Risiko, dass Entscheidungen und Prioritäten nach eigener Logik gesetzt werden.`);
      }
      longTerm.push(`Ohne aktive Führung verändert sich die Wirkung von ${jobTitle} über die Zeit. Der Fokus auf ${t.kpiExamples} verschiebt sich, die Stelleneffektivität nimmt ab.`);
    }
  } else {
    if (equalDistConflict) {
      shortTerm.push(`Die Stelle ${jobTitle} braucht eine klare ${rL}-Ausrichtung. Die Person zeigt keinen erkennbaren Schwerpunkt. Bereits in der Einarbeitung ist Orientierungslosigkeit zu erwarten.`);
      midTerm.push(`Die Stelle verlangt konsequente Prioritäten und systematische Entscheidungen. Ohne klaren Schwerpunkt reagiert die Person situativ statt rollengerecht. ${t.qualityMetric} und stabile Abläufe sind nicht verlässlich.`);
      longTerm.push(`Die Stellenanforderungen verlangen ${rL}-geprägte Arbeit. Die Gleichverteilung verhindert eine stabile Wirkung. ${t.kpiExamples} und Ergebnisqualität bleiben dauerhaft fragil.`);
    } else if (dualConflict && !roleKeyInDual) {
      const c2L = labelComponent(cDom.top2.key);
      shortTerm.push(`Die Stelle ${jobTitle} verlangt ${rL}-Ausrichtung. Diese ist in keiner der beiden Stärken (${labelComponent(cDom.top1.key)}/${c2L}) enthalten. Reibung zeigt sich schon in der Einarbeitung.`);
      midTerm.push(`Die Stelle erfordert ${rL}-geprägte Entscheidungen und Prioritäten. Die Arbeitsweise wird aber von ${labelComponent(cDom.top1.key)} und ${c2L} bestimmt. ${t.qualityMetric} folgt einer grundlegend anderen Logik.`);
      longTerm.push(`Die Stellenanforderungen verlangen ${rL}-geprägte Arbeit. Stattdessen entsteht eine ${labelComponent(cDom.top1.key)}/${c2L}-Dynamik. Abläufe und Ergebnisqualität passen nicht zu ${jobTitle}.`);
    } else {
      shortTerm.push(`Die Stelle ${jobTitle} stellt klare Anforderungen an die Arbeitsweise. Diese werden nicht abgedeckt. Schon in der Einarbeitung ist mit Reibung zu rechnen.`);
      midTerm.push(`Die Stelle erfordert eine bestimmte Leistungsstruktur. Prioritäten, Entscheidungen und Arbeitsweise folgen einer anderen Logik. ${t.qualityMetric} und stabile Abläufe sind gefährdet.`);
      longTerm.push(
        role.leadership?.required
          ? `Die Kernanforderungen von ${jobTitle} werden dauerhaft nicht erreicht. Tempo, ${t.qualityMetric}, ${t.forecastTerm} und Führungswirkung bleiben unter dem, was die Stelle braucht.`
          : `Die Kernanforderungen von ${jobTitle} werden dauerhaft nicht erreicht. Tempo, ${t.qualityMetric} und ${t.forecastTerm} bleiben unter dem, was die Stelle braucht.`
      );
    }
  }

  if (critical.id === "conflict") {
    midTerm.push(`Die Stelle ${jobTitle} erfordert klares Eingreifen bei Zielabweichungen. Stattdessen wird eher vermittelt. Leistungsunterschiede im Team werden nicht klar angesprochen.`);
    longTerm.push(`Die Stelle braucht konsequente Korrekturen. Ohne diese verwischt der Unterschied zwischen starken und schwachen Leistungen. Qualität und Ergebnisse sinken.`);
  }
  if (critical.id === "decision_logic") {
    midTerm.push(`Die Stelle ${jobTitle} braucht zügige Entscheidungen. Stattdessen wird stärker abgesichert. Operative Abläufe verlangsamen sich.`);
    longTerm.push(`Die Stelle verlangt Tempo bei Zielkonflikten. Unter Zeitdruck sinkt die Reaktionsgeschwindigkeit erheblich. ${t.forecastTerm} und stabile Abläufe leiden.`);
  }
  if (critical.id === "kpi_work") {
    midTerm.push(`Die Stelle ${jobTitle} erfordert verlässliches Reporting (${t.reportingDesc}). Die Disziplin wird voraussichtlich ungleichmässig sein. Kennzahlen verlieren ihre Aussagekraft.`);
    longTerm.push(`Ohne regelmässiges Nachhalten sinkt die Transparenz über Zielerreichung und ${t.pipelineTerm}. Die Stelle braucht stabile Datenbasis, Lücken werden erst spät sichtbar.`);
  }
  if (critical.id === "leadership_effect") {
    midTerm.push(`Die Stelle ${jobTitle} erfordert klare Führungsimpulse. Das Team bekommt nicht die Orientierung, die es braucht. Der Führungsaufwand für die nächste Ebene steigt.`);
    longTerm.push(`Die Stelle braucht konsequente Zielverfolgung und Delegation. Ohne klare Eskalationswege bleibt die Führungswirkung fragil. ${t.qualityMetric} leidet.`);
  }
  if (critical.id === "competition") {
    midTerm.push(`Die Stelle ${jobTitle} braucht Tempo bei ${t.resultMetric}. Geschwindigkeit und Durchsetzungskraft werden voraussichtlich gebremst. Prioritäten verschieben sich in Richtung Absicherung.`);
    longTerm.push(`Die Stelle verlangt proaktives Handeln in einem dynamischen Umfeld. Stattdessen werden Aufgaben abwartend angegangen. ${t.resultMetric} und ${t.qualityMetric} können sich verschlechtern.`);
  }
  if (critical.id === "culture") {
    midTerm.push(`Die Stelle ${jobTitle} erfordert eine bestimmte Leistungskultur. Die kulturelle Wirkung weicht davon ab. Leistungsfokus und Ergebnisorientierung im Team verschieben sich.`);
    longTerm.push(`Die Stelle braucht stabile Ergebnisorientierung. Ohne diese können Leistungsunterschiede nachlassen. ${t.qualityMetric} leidet, weil die Teamkultur in eine unkontrollierte Richtung driftet.`);
  }

  if (candEqualDist) {
    midTerm.push(`Vollsymmetrie-Risiko: Die Stelle ${jobTitle} braucht unter Stress eine klare Leitstruktur. Diese fehlt. Das Verhalten wird sprunghaft, Entscheidungen werden widersprüchlich oder bleiben aus.`);
    longTerm.push(`Die Stelle braucht vorhersagbare Stressreaktionen. Die fehlende Leitstruktur verhindert das. Langfristige Führung und Entwicklung für ${jobTitle} werden wesentlich schwieriger.`);
  }

  if (tags.market_pressure === "hoch")
    longTerm.push(`Die Stelle ${jobTitle} operiert in einem Hochdruckumfeld. Jede Verzögerung wirkt direkt auf ${t.resultMetric}. Die beschriebenen Abweichungen verstärken sich unter diesem Druck.`);
  if (tags.regulation === "hoch")
    longTerm.push(`Die Stelle ${jobTitle} operiert in einem regulierten Umfeld. Die beschriebenen Abweichungen können zu Qualitäts-, Haftungs- oder Auditproblemen führen. Sorgfalt und Regeltreue müssen durchgehend sichergestellt werden.`);

  return { shortTerm, midTerm, longTerm };
}

function devModeLabel(mode: DominanceMode): string {
  switch (mode) {
    case "EXTREME_I": return "stark impulsiver Prägung";
    case "EXTREME_N": return "stark intuitiver Prägung";
    case "EXTREME_A": return "stark analytischer Prägung";
    case "DOM_I": return "impulsivem Schwerpunkt";
    case "DOM_N": return "intuitivem Schwerpunkt";
    case "DOM_A": return "analytischem Schwerpunkt";
    case "DUAL_I_A": return "impulsiv-analytischem Doppelfokus";
    case "DUAL_I_N": return "impulsiv-intuitivem Doppelfokus";
    case "DUAL_N_A": return "intuitiv-analytischem Doppelfokus";
    case "BAL_I": return "ausgeglichenem Profil mit Impulsiv-Tendenz";
    case "BAL_N": return "ausgeglichenem Profil mit Intuitiv-Tendenz";
    case "BAL_A": return "ausgeglichenem Profil mit Analytisch-Tendenz";
    case "BAL_FULL": return "voll ausgeglichenem Profil";
    default: return "gemischtem Profil";
  }
}

function developmentFromControl(control: ControlIntensity, points: number, criticalLabel: string, t: RoleTerms, roleDom?: DominanceResult, candDom?: DominanceResult) {
  const rLabel = roleDom ? devModeLabel(roleDom.mode) : "";
  const cLabel = candDom ? devModeLabel(candDom.mode) : "";
  const sameDom = roleDom && candDom && roleDom.top1.key === candDom.top1.key;

  let text: string;
  if (control === "LOW") {
    text = sameDom
      ? `Die Stelle verlangt ${rLabel}. Die Grundlogik stimmt überein, regelmässiges Feedback reicht aus.`
      : `Die Stelle verlangt ${rLabel}. Die Anpassung von ${cLabel} gelingt mit normalem Feedback.`;
    return { likelihood: "hoch" as const, timeframe: "3-6 Monate", text };
  }
  if (control === "MEDIUM") {
    text = sameDom
      ? `Die Stelle verlangt ${rLabel}. Die Grundrichtung stimmt, aber im Bereich "${criticalLabel}" ist gezielte Nachjustierung nötig.`
      : `Die Stelle verlangt ${rLabel}. Die Anpassung von ${cLabel} erfordert gezielte Führung im Bereich "${criticalLabel}".`;
    return { likelihood: "mittel" as const, timeframe: "6-12 Monate", text };
  }
  text = sameDom
    ? `Die Stelle verlangt ${rLabel}. Trotz gleicher Grundrichtung ist der Abstand im Bereich "${criticalLabel}" so gross, dass intensive Begleitung nötig ist.`
    : `Die Stelle verlangt ${rLabel}. Der Wechsel von ${cLabel} erfordert intensive Führung und ist nicht sicher.`;
  return { likelihood: "gering" as const, timeframe: ">12 Monate", text };
}

function integrationPlan(role: RoleAnalysis, criticalArea: MatrixAreaId, control: ControlIntensity, t: RoleTerms) {
  const tags = role.environment_tags || {};
  const jobTitle = role.job_title || "diese Stelle";
  const jobFamily = role.job_family || "";
  const phase_0_30: string[] = [];
  const phase_30_60: string[] = [];
  const phase_60_90: string[] = [];

  phase_0_30.push(`Onboarding ${jobTitle}: Verantwortungsbereich, Entscheidungsbefugnisse, Eskalationswege und zentrale Kennzahlen (${t.kpiExamples}) schriftlich festhalten.`);
  phase_0_30.push(`${t.targetTerm} für die ersten 90 Tage: messbar, terminiert, mit klaren Prioritäten und festen Abstimmungsterminen.`);
  phase_0_30.push(`Die drei wichtigsten Herausforderungen der Stelle identifizieren und gemeinsam besprechen, wie damit umgegangen wird.`);

  if (criticalArea === "conflict") {
    phase_0_30.push(`Eskalationsregeln für ${jobTitle} festlegen: Ab welcher Abweichung wird wie und durch wen eingegriffen? Verbindlich festhalten.`);
    phase_30_60.push("Konfliktverhalten begleiten: Wie geht die Person mit Leistungsabweichungen im Alltag um? Gesprächsführung und Nachverfolgung gemeinsam besprechen.");
    phase_60_90.push(`Prüfung ${t.qualityMetric}: Werden Leistungsprobleme im Team eigenständig und zeitnah angesprochen?`);
  } else if (criticalArea === "decision_logic") {
    phase_0_30.push(`Entscheidungsfristen für ${jobTitle} festlegen: z.\u00ADB. 48h bei Zielabweichungen, 24h ${t.escalationExample}. Schriftlich festhalten.`);
    phase_30_60.push(`Entscheidungstempo beobachten: Werden Entscheidungen im nötigen Rhythmus getroffen oder wird zu viel abgesichert? Auswirkung auf ${t.tempoContext} beobachten.`);
    phase_60_90.push(`Prüfung: Hält das Entscheidungstempo dem ${t.tempoContext} und den Anforderungen an ${t.forecastTerm} stand?`);
  } else if (criticalArea === "kpi_work") {
    phase_0_30.push(`Reporting-Standards für ${jobTitle} festlegen: Welche Kennzahlen (${t.kpiExamples}), wie oft, in welcher Qualität. ${t.forecastTerm} und Datenpflege als Anforderung festhalten.`);
    phase_30_60.push(`Reporting-Disziplin prüfen: Werden Kennzahlen (${t.kpiExamples}) vollständig, pünktlich und ohne Nachfragen geliefert? ${t.forecastTerm} prüfen.`);
    phase_60_90.push(`Prüfung: Ist die Transparenz über Zielerreichung und ${t.pipelineTerm} stabil und verlässlich?`);
  } else if (criticalArea === "leadership_effect") {
    phase_0_30.push(`Führungsanforderung für ${jobTitle} festhalten: Ziele, Delegation, Eskalationswege und regelmässige Reviews für ${t.kpiExamples} definieren.`);
    phase_30_60.push("Führungswirkung beobachten: Setzt die Person die richtigen Prioritäten? Gibt sie klare, ergebnisorientierte Rückmeldungen? Teamdynamik beobachten.");
    phase_60_90.push(`Prüfung ${t.qualityMetric}: Hat das Team klare Richtung, stabile Prioritäten und messbare Ziele?`);
  } else if (criticalArea === "competition") {
    phase_0_30.push(`${t.targetTerm} für ${jobTitle} festlegen: ${t.competitionMetrics}. Messbar und terminiert.`);
    phase_30_60.push(`Wettbewerbsdynamik beobachten: Werden Aufgaben proaktiv angegangen oder abwartend bearbeitet? ${t.resultMetric} und Tempo messen.`);
    phase_60_90.push(`Prüfung: Agiert die Person proaktiv? Sind ${t.resultMetric} und ${t.pipelineTerm} im Zielkorridor?`);
  } else if (criticalArea === "culture") {
    phase_0_30.push(`Kulturelle Erwartungen an ${jobTitle} festlegen: Welche Leistungsorientierung, welche Teamdynamik, welche Ergebnisorientierung wird erwartet.`);
    phase_30_60.push("Kulturelle Wirkung beobachten: Passt die Wirkung der Person zur geforderten Leistungs- und Ergebniskultur? Teamdynamik beobachten.");
    phase_60_90.push(`Prüfung ${t.qualityMetric}: Bleibt die Leistungskultur stabil oder verschiebt sich die Teamdynamik in eine unkontrollierte Richtung?`);
  } else {
    phase_30_60.push(`Die zentralen Herausforderungen der Stelle ${jobTitle} aktiv begleiten: Klare Prioritäten, feste Ziele und regelmässige Review-Gespräche.`);
    phase_60_90.push(`Prüfung ${t.qualityMetric}: Zeigt die Person die geforderte Wirkung in Tempo, Zielklarheit und ${t.qualityMetric}?`);
  }

  if (tags.market_pressure === "hoch") {
    phase_0_30.push(`Schnelle Entscheidungswege für ${jobTitle} festlegen: Wer gibt was frei, wie wird eskaliert.`);
    phase_30_60.push("Reaktionsgeschwindigkeit im Alltag beobachten: Wie schnell wird auf Abweichungen reagiert?");
  }
  if (tags.regulation === "hoch") {
    phase_0_30.push("Qualitäts- und Regelwerksstandards als verbindliche Anforderungen dokumentieren.");
    phase_30_60.push("Qualitätsprüfungen in Routine überführen.");
  }

  if (control === "HIGH") {
    phase_0_30.push(`Wöchentliches Gespräch zwischen ${jobTitle} und direkter Führungskraft. ${t.kpiExamples} und Zielabgleich als fester Termin.`);
    phase_30_60.push(`Gezielt am kritischen Verhalten arbeiten: Entscheidungsverhalten, Eingreifen bei Problemen oder Dokumentationsdisziplin – je nach Schwachstelle. Fortschritt anhand ${t.kpiExamples} messen.`);
    phase_60_90.push(`Klare Go/No-Go-Entscheidung: Erfüllt die Person die Kernanforderungen der Stelle? Ergebnis anhand messbarer Kriterien (${t.kpiExamples}) bewerten.`);
  }

  phase_60_90.push(
    role.leadership?.required
      ? `90-Tage-Review: Passung zur Stelle ${jobTitle} bewerten. Ergebnis festhalten – ${t.kpiExamples}, Prozessqualität und Führungswirkung als Entscheidungsgrundlage.`
      : `90-Tage-Review: Passung zur Stelle ${jobTitle} bewerten. Ergebnis festhalten – ${t.kpiExamples} und Prozessqualität als Entscheidungsgrundlage.`
  );

  return { phase_0_30, phase_30_60, phase_60_90 };
}

export function statusLabel(s: FitStatus) {
  if (s === "SUITABLE") return "Geeignet";
  if (s === "CONDITIONAL") return "Bedingt geeignet";
  return "Nicht geeignet";
}

export function controlLabel(c: ControlIntensity) {
  if (c === "LOW") return "Niedrig";
  if (c === "MEDIUM") return "Mittel";
  return "Hoch";
}

type ConstellationType =
  | "H_DOM" | "B_DOM" | "S_DOM"
  | "H_GT_B" | "H_GT_S" | "B_GT_H" | "B_GT_S" | "S_GT_H" | "S_GT_B"
  | "H_NEAR_B" | "H_NEAR_S" | "B_NEAR_S"
  | "BALANCED";

function detectConstellation(t: Triad): ConstellationType {
  const sorted = ([
    { key: "impulsiv" as ComponentKey, val: t.impulsiv },
    { key: "intuitiv" as ComponentKey, val: t.intuitiv },
    { key: "analytisch" as ComponentKey, val: t.analytisch },
  ]).sort((a, b) => b.val - a.val);
  const top = sorted[0];
  const mid = sorted[1];
  const d12 = top.val - mid.val;
  const range = top.val - sorted[2].val;
  if (range <= 8) return "BALANCED";
  const pairKey = (a: ComponentKey, b: ComponentKey): string => {
    const m: Record<string, string> = {
      "impulsiv_intuitiv": "H_B", "intuitiv_impulsiv": "B_H",
      "impulsiv_analytisch": "H_S", "analytisch_impulsiv": "S_H",
      "intuitiv_analytisch": "B_S", "analytisch_intuitiv": "S_B",
    };
    return m[`${a}_${b}`] || "";
  };
  if (d12 >= 15) {
    if (top.key === "impulsiv") return "H_DOM";
    if (top.key === "intuitiv") return "B_DOM";
    return "S_DOM";
  }
  if (d12 <= 5) {
    const pk = pairKey(top.key, mid.key);
    if (pk === "H_B" || pk === "B_H") return "H_NEAR_B";
    if (pk === "H_S" || pk === "S_H") return "H_NEAR_S";
    return "B_NEAR_S";
  }
  const gtKey = pairKey(top.key, mid.key);
  const gtMap: Record<string, ConstellationType> = {
    "H_B": "H_GT_B", "H_S": "H_GT_S",
    "B_H": "B_GT_H", "B_S": "B_GT_S",
    "S_H": "S_GT_H", "S_B": "S_GT_B",
  };
  return gtMap[gtKey] || "BALANCED";
}

function subjName(name: string): string {
  const l = name.toLowerCase();
  if (l === "person" || l === "die person") return "die Person";
  return name;
}
function SubjName(name: string): string {
  const l = name.toLowerCase();
  if (l === "person" || l === "die person") return "Die Person";
  return name;
}

function constellationRoleText(c: ConstellationType): string {
  const texts: Record<ConstellationType, string> = {
    H_DOM: "Diese Stelle wirkt vor allem über Geschwindigkeit, klare Priorisierung und direkte Umsetzung. Entscheidungen werden zügig getroffen, Themen schnell in Bewegung gebracht.",
    B_DOM: "Diese Stelle lebt vom direkten Kontakt mit Menschen, vom Gespür für Situationen und von tragfähiger Zusammenarbeit. Wirksamkeit entsteht über Vertrauen und Beziehungsarbeit.",
    S_DOM: "Diese Stelle verlangt analytisches Denken, sorgfältige Planung und verlässliche Prüftiefe. Qualität entsteht über Ordnung, Systematik und Nachvollziehbarkeit.",
    H_GT_B: "Die Stelle wird vor allem durch Ergebnisorientierung und operative Geschwindigkeit getragen, braucht aber gleichzeitig die Fähigkeit, Menschen mitzunehmen und Situationen sozial klug zu lesen.",
    H_GT_S: "Die Stelle lebt von schnellen Entscheidungen und direkter Umsetzung, braucht aber eine stabile Struktur im Hintergrund. Geschwindigkeit allein reicht nicht; sie muss in klare Abläufe eingebettet sein.",
    B_GT_H: "Die Stelle wirkt primär über Vertrauen, Einfühlungsvermögen und Gesprächsführung, braucht aber eine klare Fähigkeit, bei Bedarf zu entscheiden und in Handlung zu kommen.",
    B_GT_S: "Die Stelle braucht vor allem Beziehungsgestaltung, situatives Gespür und tragfähigen Dialog. Analytische Absicherung dient hier als stabilisierendes Fundament.",
    S_GT_H: "Die Stelle verlangt in erster Linie analytisches Denken, Sorgfalt und systematische Ordnung, braucht aber gleichzeitig die Fähigkeit, Entscheidungen rechtzeitig umzusetzen.",
    S_GT_B: "Die Stelle wird vor allem über analytische Tiefe, Verlässlichkeit und klare Prozesse getragen. Gleichzeitig braucht sie ausreichend Kommunikationsfähigkeit, damit Strukturen auch angenommen werden.",
    H_NEAR_B: "Die Stelle verbindet hohe Ergebnisdynamik mit sozialer Beweglichkeit. Sie wirkt zugleich über Handlungsorientierung und Kontaktfähigkeit.",
    H_NEAR_S: "Die Stelle verbindet Entscheidungsstärke mit Struktur. Sie kann stark sein, wenn operative Geschwindigkeit und saubere Planung gemeinsam wirken.",
    B_NEAR_S: "Die Stelle verbindet Beziehungsgestaltung und analytische Absicherung. Sie wirkt über Orientierung, saubere Abstimmung und verlässliche Standards.",
    BALANCED: "Die Stelle zeigt keine klare strukturelle Einseitigkeit. Handlungsorientierung, Zusammenarbeit und Struktur wirken in relativ ausgeglichener Form zusammen.",
  };
  return texts[c];
}

function constellationCandText(c: ConstellationType, cand: string): string {
  const s = SubjName(cand);
  const sLower = subjName(cand);
  const texts: Record<ConstellationType, string> = {
    H_DOM: `${s} arbeitet mit hoher Umsetzungsenergie, trifft Entscheidungen zügig und bringt Themen schnell ins Handeln.`,
    B_DOM: `${s} baut schnell Vertrauen auf, erkennt Bedürfnisse früh und schafft ein kooperatives Arbeitsumfeld.`,
    S_DOM: `${s} arbeitet analytisch und präzise, sorgt für verlässliche Abläufe und prüft gründlich.`,
    H_GT_B: `${s} setzt auf schnelle Entscheidungen und direkte Umsetzung, kann aber gleichzeitig Menschen einbinden und situative Zusammenarbeit leisten.`,
    H_GT_S: `${s} arbeitet schnell und entscheidungsorientiert, sichert Ergebnisse aber zusätzlich über klare Abläufe und Struktur ab.`,
    B_GT_H: `${s} wirkt vor allem über Vertrauen und Einfühlungsvermögen, kann aber bei Bedarf schnell entscheiden und handeln.`,
    B_GT_S: `${s} ist stark in Beziehungsgestaltung und situativem Gespür und nutzt gleichzeitig analytische Absicherung als Fundament.`,
    S_GT_H: `${s} arbeitet vorwiegend analytisch und systematisch, kann aber bei Bedarf schnell umschalten und handeln.`,
    S_GT_B: `${s} legt Wert auf Analyse, Ordnung und Verlässlichkeit. Gleichzeitig sorgt ein erkennbarer Beziehungsanteil dafür, dass Ergebnisse auch kommunikativ vermittelt werden.`,
    H_NEAR_B: `Bei ${sLower} wechseln sich starke Umsetzungsenergie und hohe soziale Beweglichkeit je nach Situation ab.`,
    H_NEAR_S: `Bei ${sLower} stehen Umsetzungskraft und Strukturorientierung fast gleichwertig nebeneinander. Je nach Situation wird entweder schnell gehandelt oder gründlich geprüft.`,
    B_NEAR_S: `Bei ${sLower} stehen Beziehungsgestaltung und analytisches Denken fast gleichwertig nebeneinander. Je nach Situation wird moderiert oder systematisch geordnet.`,
    BALANCED: `${s} zeigt ein ausgeglichenes Profil ohne klare Einseitigkeit. Das Verhalten passt sich situativ an, ist aber weniger eindeutig vorhersagbar.`,
  };
  return texts[c];
}

type FitReason = {
  rule: string;
  effect: "KO" | "OVERRIDE" | "CAP" | "BASE";
};

export type StructureRelationType = "EXACT" | "SOFT_CONFLICT" | "HARD_CONFLICT";

export type CoreFitResult = {
  overallFit: FitStatus;
  controlIntensity: ControlIntensity;
  controlPoints: number;
  mismatchScore: number;
  koTriggered: boolean;
  reasons: FitReason[];
  flags: {
    sameDom: boolean;
    effectiveSameDom: boolean;
    roleIsBalFull: boolean;
    candIsBalFull: boolean;
    equalDistConflict: boolean;
    dualConflict: boolean;
    roleKeyInDual: boolean;
    secondaryFlipped: boolean;
    softConflict: boolean;
    structureRelation: StructureRelationType;
    maxGapVal: number;
    candSpread: number;
  };
};

type VariantMeta = {
  variantType: "ALL_EQUAL" | "TOP_PAIR" | "BOTTOM_PAIR" | "ORDER";
  variantCode: string;
  top: ComponentKey;
  second: ComponentKey;
  third: ComponentKey;
  d1: number;
  d2: number;
};

function getVariantMeta(profile: Triad, eqTol = 5): VariantMeta {
  const sorted = (["impulsiv", "intuitiv", "analytisch"] as ComponentKey[])
    .map(k => ({ k, v: profile[k] }))
    .sort((a, b) => b.v - a.v);
  const [a, b, c] = sorted;
  const d1 = a.v - b.v;
  const d2 = b.v - c.v;

  if (d1 <= eqTol && d2 <= eqTol) return { variantType: "ALL_EQUAL", variantCode: "ALL_EQUAL", top: a.k, second: b.k, third: c.k, d1, d2 };
  if (d1 <= eqTol) return { variantType: "TOP_PAIR", variantCode: `TOP_PAIR_${[a.k, b.k].sort().join("")}_${c.k}`, top: a.k, second: b.k, third: c.k, d1, d2 };
  if (d2 <= eqTol) return { variantType: "BOTTOM_PAIR", variantCode: `BOTTOM_PAIR_${a.k}_${[b.k, c.k].sort().join("")}`, top: a.k, second: b.k, third: c.k, d1, d2 };
  return { variantType: "ORDER", variantCode: `ORDER_${a.k}${b.k}${c.k}`, top: a.k, second: b.k, third: c.k, d1, d2 };
}

type PairRelation = -1 | 0 | 1;
type PairRelations = { I_N: PairRelation; I_A: PairRelation; N_A: PairRelation };

function getPairRelations(profile: Triad, eqTol: number): PairRelations {
  function rel(a: number, b: number): PairRelation {
    const diff = a - b;
    if (Math.abs(diff) <= eqTol) return 0;
    return diff > 0 ? 1 : -1;
  }
  return {
    I_N: rel(profile.impulsiv, profile.intuitiv),
    I_A: rel(profile.impulsiv, profile.analytisch),
    N_A: rel(profile.intuitiv, profile.analytisch),
  };
}

function getStructureFromPairs(sollRel: PairRelations, istRel: PairRelations): StructureRelationType {
  const keys: (keyof PairRelations)[] = ["I_N", "I_A", "N_A"];
  let mismatchCount = 0;
  let hasHardFlip = false;

  for (const k of keys) {
    const s = sollRel[k];
    const i = istRel[k];
    if (s !== i) {
      mismatchCount++;
      if ((s === 1 && i === -1) || (s === -1 && i === 1)) {
        hasHardFlip = true;
      }
    }
  }

  if (mismatchCount === 0) return "EXACT";
  if (mismatchCount === 1 && !hasHardFlip) return "SOFT_CONFLICT";
  return "HARD_CONFLICT";
}

export function computeCoreFit(roleTriad: Triad, candTriad: Triad, externalKo?: boolean): CoreFitResult {
  const rN = normalizeTriad(roleTriad);
  const cN = normalizeTriad(candTriad);
  const roleDom = dominanceModeOf(rN);
  const candDom = dominanceModeOf(cN);
  const reasons: FitReason[] = [];

  const EQ_TOL = 5;
  const GOOD_TOL = 5;
  const COND_TOL = 10;

  const ko = externalKo === true;
  if (ko) {
    reasons.push({ rule: "Externes KO (Führungs-KO oder erweitertes Rollenprofil)", effect: "KO" });
  }

  const mismatch = weightedMismatch(roleTriad, candTriad);
  const maxGapVal = Math.max(Math.abs(rN.impulsiv - cN.impulsiv), Math.abs(rN.intuitiv - cN.intuitiv), Math.abs(rN.analytisch - cN.analytisch));

  const sollMeta = getVariantMeta(rN, EQ_TOL);
  const istMeta = getVariantMeta(cN, EQ_TOL);

  const sollRel = getPairRelations(rN, EQ_TOL);
  const istRel = getPairRelations(cN, EQ_TOL);
  const structureRelation = getStructureFromPairs(sollRel, istRel);

  const structureMatches = structureRelation === "EXACT";
  const soft = structureRelation === "SOFT_CONFLICT";
  const hard = structureRelation === "HARD_CONFLICT";

  reasons.push({ rule: `Soll-Variante: ${sollMeta.variantCode}`, effect: "BASE" });
  reasons.push({ rule: `Ist-Variante: ${istMeta.variantCode}`, effect: "BASE" });
  reasons.push({ rule: `Strukturbeziehung: ${structureRelation}`, effect: "BASE" });

  let overallFit: FitStatus;
  if (ko) {
    overallFit = "NOT_SUITABLE";
  } else if (hard) {
    overallFit = "NOT_SUITABLE";
    reasons.push({ rule: `Harter Strukturkonflikt: Soll=${sollMeta.variantCode} vs Ist=${istMeta.variantCode}`, effect: "OVERRIDE" });
  } else if (soft) {
    if (maxGapVal <= COND_TOL) {
      overallFit = "CONDITIONAL";
      reasons.push({ rule: `Weicher Strukturkonflikt, max. Abweichung ${maxGapVal.toFixed(0)} ≤ ${COND_TOL} → bedingt geeignet`, effect: "BASE" });
    } else {
      overallFit = "NOT_SUITABLE";
      reasons.push({ rule: `Weicher Strukturkonflikt, max. Abweichung ${maxGapVal.toFixed(0)} > ${COND_TOL} → nicht geeignet`, effect: "OVERRIDE" });
    }
  } else if (maxGapVal <= GOOD_TOL) {
    overallFit = "SUITABLE";
    reasons.push({ rule: `Struktur identisch, max. Abweichung ${maxGapVal.toFixed(0)} ≤ ${GOOD_TOL} → geeignet`, effect: "BASE" });
  } else if (maxGapVal <= COND_TOL) {
    overallFit = "CONDITIONAL";
    reasons.push({ rule: `Struktur identisch, max. Abweichung ${maxGapVal.toFixed(0)} > ${GOOD_TOL} und ≤ ${COND_TOL} → bedingt geeignet`, effect: "BASE" });
  } else {
    overallFit = "NOT_SUITABLE";
    reasons.push({ rule: `Struktur identisch, aber max. Abweichung ${maxGapVal.toFixed(0)} > ${COND_TOL} → nicht geeignet`, effect: "OVERRIDE" });
  }

  const sameDom = roleDom.top1.key === candDom.top1.key;
  const candIsBalFull = candDom.gap1 <= 5 && candDom.gap2 <= 5;
  const roleIsBalFull = roleDom.gap1 <= 5 && roleDom.gap2 <= 5;
  const effectiveSameDom = structureMatches || soft;
  const candEqualDist = candDom.mode === "BAL_FULL";
  const candDualDominance = !candEqualDist && candDom.gap1 <= 5;
  const roleClearDominance = roleDom.gap1 >= 15;
  const dualConflict = candDualDominance && roleClearDominance && hard;
  const equalDistConflict = candEqualDist && roleClearDominance && hard;
  const roleKeyInDual = dualConflict && (candDom.top1.key === roleDom.top1.key || candDom.top2.key === roleDom.top1.key);
  const candSpread = candDom.top1.value - candDom.top3.value;
  const secondaryFlipped = structureMatches && roleDom.top2.key !== candDom.top2.key;

  let points = 0;
  if (hard) points += 3;
  else if (soft) points += 2;
  if (maxGapVal > COND_TOL) points += 2;
  else if (maxGapVal > GOOD_TOL) points += 1;
  if ((sollMeta.variantType === "ORDER" || sollMeta.variantType === "BOTTOM_PAIR") && sollMeta.d1 > 10) points += 1;
  let level: ControlIntensity = "LOW";
  if (points >= 5) level = "HIGH";
  else if (points >= 3) level = "MEDIUM";

  return {
    overallFit, controlIntensity: level, controlPoints: points, mismatchScore: mismatch, koTriggered: ko, reasons,
    flags: { sameDom, effectiveSameDom, roleIsBalFull, candIsBalFull, equalDistConflict, dualConflict, roleKeyInDual, secondaryFlipped, softConflict: soft, structureRelation, maxGapVal, candSpread },
  };
}

export function runEngine(role: RoleAnalysis, cand: CandidateInput): EngineResult {
  const roleDom = dominanceModeOf(role.role_profile);
  const candDom = dominanceModeOf(cand.candidate_profile);

  const ko = koRuleTriggered(role, cand);
  const coreFit = computeCoreFit(role.role_profile, cand.candidate_profile, ko);
  const { overallFit, mismatchScore: mismatch, flags } = coreFit;
  const { sameDom, equalDistConflict, dualConflict, roleKeyInDual, secondaryFlipped } = flags;

  const t = resolveRoleTerms(role);
  const ctrl = calcControlIntensity(role, cand);
  const matrix = buildMatrix(role, cand, t);
  const critical = criticalAreaFromMatrix(matrix);

  const rN = normalizeTriad(role.role_profile);
  const cN = normalizeTriad(cand.candidate_profile);
  const rL = labelComponent(roleDom.top1.key);
  const cL = labelComponent(candDom.top1.key);
  const mainDiff = Math.abs(rN[roleDom.top1.key] - cN[roleDom.top1.key]);

  const candName = cand.candidate_name || "Person";
  const s = SubjName(candName);
  const jobTitle = role.job_title || "diese Stelle";
  const competingL = dualConflict ? labelComponent(candDom.top1.key === roleDom.top1.key ? candDom.top2.key : candDom.top1.key) : "";
  const rConst = detectConstellation(rN);
  const cConst = detectConstellation(cN);
  const roleDesc = constellationRoleText(rConst);
  const candDesc = constellationCandText(cConst, candName);

  const keyReason = (() => {
    if (equalDistConflict) {
      return `${roleDesc} Die Stelle braucht eine klare ${rL}-Ausrichtung. ${s} zeigt jedoch ein ausgeglichenes Profil ohne erkennbaren Schwerpunkt. Damit fehlt die Grundlage, um die Anforderungen von ${jobTitle} gezielt umzusetzen.`;
    }
    if (dualConflict && roleKeyInDual) {
      return `${roleDesc} Die Stelle verlangt eine eindeutige ${rL}-Ausrichtung. ${s} bringt diese Arbeitsweise grundsätzlich mit, allerdings konkurriert sie mit einer gleich starken ${competingL}-Prägung. Die nötige Eindeutigkeit fehlt. Prioritäten und ${t.qualityMetric} werden instabil.`;
    }
    if (dualConflict && !roleKeyInDual) {
      return `${roleDesc} Die für ${jobTitle} entscheidende ${rL}-Arbeitsweise wird nicht abgebildet. ${candDesc} Entscheidungen, Prioritäten und stabile Abläufe sind kritisch betroffen.`;
    }
    if (overallFit === "SUITABLE") {
      return `${roleDesc} ${s} arbeitet nach derselben Grundlogik. Arbeitsweise und Prioritäten passen zur Stelle ${jobTitle}. Kleinere Unterschiede in der Gewichtung der sekundären Bereiche sind im Alltag gut handhabbar.`;
    }
    if (secondaryFlipped && overallFit === "NOT_SUITABLE") {
      const roleSecL = labelComponent(roleDom.top2.key);
      const candSecL = labelComponent(candDom.top2.key);
      return `${roleDesc} Die Stelle braucht ${roleSecL} als zweite Stärke. ${s} arbeitet zwar ${rL}-orientiert, bringt aber ${candSecL} statt ${roleSecL} mit. Diese strukturelle Abweichung verändert Arbeitsstil und Prioritäten in ${jobTitle} grundlegend.`;
    }
    if (secondaryFlipped && sameDom && overallFit === "CONDITIONAL") {
      const roleSecL = labelComponent(roleDom.top2.key);
      const candSecL = labelComponent(candDom.top2.key);
      return `${roleDesc} Die Stelle braucht ${roleSecL} als zweite Stärke. ${s} arbeitet ${rL}-orientiert wie gefordert, zeigt aber eine Mischung aus ${roleSecL} und ${candSecL} als Zweitstärke. Mit gezielter Führung gut handhabbar.`;
    }
    if (sameDom && overallFit === "CONDITIONAL") {
      return `${roleDesc} ${s} bringt die geforderte Arbeitsweise grundsätzlich mit, aber die Ausprägung liegt unter dem, was ${jobTitle} braucht. ${candDesc} Die Unterschiede sind erkennbar, lassen sich aber bei gezielter Führung und klaren Erwartungen ausgleichen.`;
    }
    if (overallFit === "CONDITIONAL") {
      return `${roleDesc} ${s} bringt eine andere Arbeitsweise mit als ${jobTitle} erfordert. ${candDesc} Im Alltag kann das zu erhöhtem Abstimmungsbedarf und höherem Führungsaufwand führen. Mit gezielter Führung und klaren Erwartungen lassen sich die Unterschiede ausgleichen.`;
    }
    return `${roleDesc} ${candDesc} Stelle und ${subjName(candName)} arbeiten nach unterschiedlichen Prinzipien. Im Alltag führt das zu erhöhtem Abstimmungsbedarf, Konflikten im Team und erheblich höherem Führungsaufwand.`;
  })();

  const execSummary = (() => {
    const intro = `Stelle: ${jobTitle} | ${candName}`;
    const fitLine = `Gesamteinstufung: ${statusLabel(overallFit)} · Führungsaufwand: ${controlLabel(ctrl.level)}`;
    let domLine: string;
    if (equalDistConflict) {
      domLine = `${roleDesc} Die Stelle braucht eine klare ${rL}-Ausrichtung. ${s} zeigt ein ausgeglichenes Profil ohne Schwerpunkt. Die Grundlage für gezielte Prioritäten und konsequente Entscheidungen fehlt.`;
    } else if (dualConflict) {
      domLine = `${roleDesc} Die Stelle verlangt eine eindeutige ${rL}-Ausrichtung. ${s} zeigt eine Doppeldominanz: ${labelComponent(candDom.top1.key)} und ${labelComponent(candDom.top2.key)} konkurrieren. Prioritäten und Entscheidungen werden instabil.`;
    } else if (sameDom && secondaryFlipped && candDom.gap2 > 5) {
      domLine = `${roleDesc} Beide Profile sind ${rL}-geprägt, aber die Sekundärausrichtung passt nicht zur Stelle. ${candDesc} Arbeitsstil und Prioritätensetzung weichen strukturell ab.`;
    } else if (sameDom && secondaryFlipped) {
      domLine = `${roleDesc} Beide Profile sind ${rL}-geprägt. Die Sekundärausrichtung weicht leicht von den Stellenanforderungen ab. Mit Führung gut überbrückbar.`;
    } else if (sameDom) {
      domLine = `${roleDesc} Arbeitsweise und Prioritäten passen zur Stelle. Beide Profile setzen auf dieselbe Arbeitsweise und sind ${gapAdj(mainDiff)}.`;
    } else {
      domLine = `${roleDesc} ${candDesc} Die Arbeitsweise weicht von den Stellenanforderungen ab. Entscheidungen und Prioritäten brauchen Führung.`;
    }
    return [intro, fitLine, domLine].join("\n");
  })();

  const secondaryTension = (() => {
    if (!sameDom || equalDistConflict || dualConflict) return null;
    const rSec = roleDom.top2.key;
    const cSec = candDom.top2.key;
    if (rSec === cSec) return null;
    const rSecVal = rN[rSec];
    const cSecDiff = Math.abs(cN[cSec] - cN[rSec]);
    if (cSecDiff < 3) return null;

    const secDescriptions: Record<ComponentKey, { label: string; focus: string; stressBehavior: string }> = {
      impulsiv: { label: "Impulsiv", focus: "Umsetzungsdruck und Ergebnisverantwortung", stressBehavior: "Durchsetzung und schnelle Entscheidungen" },
      intuitiv: { label: "Intuitiv", focus: "Beziehungsorientierung und Teamdynamik", stressBehavior: "Abstimmung, Konsens und zwischenmenschliche Klärung" },
      analytisch: { label: "Analytisch", focus: "Sachbezogenheit und fachliche Präzision", stressBehavior: "Datenprüfung, Absicherung und strukturelle Klärung" },
    };

    const roleSecDesc = secDescriptions[rSec];
    const candSecDesc = secDescriptions[cSec];

    const text = `Die Hauptausrichtung stimmt überein (${rL}). Die Stelle braucht ${roleSecDesc.label} als Zweitstärke (${roleSecDesc.focus}). Die Person bringt jedoch ${candSecDesc.label} als Zweitstärke mit (${candSecDesc.focus}). Im Alltag unauffällig, unter Druck reagiert die Person eher mit ${candSecDesc.stressBehavior} statt mit ${roleSecDesc.stressBehavior}.`;

    const stressText = `Unter Stress: Die Stelle erwartet ${roleSecDesc.stressBehavior}. Die Person greift stattdessen auf ${candSecDesc.stressBehavior} zurück. Im Team und in den Abläufen wird das situativ bemerkbar.`;

    return {
      detected: true,
      roleSecondary: rSec,
      candSecondary: cSec,
      roleSecondaryValue: rSecVal,
      candSecondaryValue: cN[cSec],
      text,
      stressText,
    };
  })();

  const risks = buildRisks(role, cand, { overallFit, control: ctrl.level, matrix, mismatch }, t);
  if (secondaryTension) {
    risks.midTerm.push(secondaryTension.stressText);
  }
  const devControl: ControlIntensity = overallFit === "NOT_SUITABLE" ? "HIGH"
    : overallFit === "CONDITIONAL" ? "MEDIUM"
    : coreFit.controlIntensity === "LOW" ? "LOW"
    : "MEDIUM";
  const dev = developmentFromControl(devControl, coreFit.controlPoints, critical.label, t, roleDom, candDom);
  const plan = integrationPlan(role, critical.id, ctrl.level, t);

  return {
    roleDominance: roleDom, candDominance: candDom,
    overallFit, mismatchScore: mismatch, koTriggered: coreFit.koTriggered,
    controlIntensity: ctrl.level, controlPoints: ctrl.points,
    criticalArea: critical.id, criticalAreaLabel: critical.label,
    equalDistribution: equalDistConflict,
    secondaryTension,
    keyReason, executiveSummary: execSummary,
    matrix, risks, development: dev, integrationPlan90: plan,
  };
}

function roundPct(p1: number, p2: number, p3: number): [number, number, number] {
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

function calcBG(taetigkeiten: any[]): BG {
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
  const [imp, int, ana] = roundPct((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
  return { imp, int, ana };
}

function calcRahmen(state: RoleDnaStateInput): BG {
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
  const [imp, int, ana] = roundPct((sI / total) * 100, (sN / total) * 100, (sA / total) * 100);
  return { imp, int, ana };
}

function calcGesamt(haupt: BG, neben: BG, fuehrung: BG, rahmen: BG): BG {
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
  const [imp, int, ana] = roundPct(vals[0], vals[1], vals[2]);
  return { imp, int, ana };
}

function bgToTriadShared(bg: BG | undefined): { impulsiv: number; intuitiv: number; analytisch: number } {
  if (!bg) return { impulsiv: 33, intuitiv: 33, analytisch: 34 };
  return { impulsiv: Math.round(bg.imp), intuitiv: Math.round(bg.int), analytisch: Math.round(bg.ana) };
}

export function buildRoleAnalysisFromState(state: RoleDnaStateInput): RoleAnalysis | null {
  try {
    const beruf = state.beruf || "Unbenannte Stelle";
    const fuehrungstyp = state.fuehrung || "Keine";
    const isLeadership = fuehrungstyp !== "Keine";
    const taetigkeiten = state.taetigkeiten || [];

    const haupt = state.bioGramHaupt || calcBG(taetigkeiten.filter((t: any) => t.kategorie === "haupt"));
    const neben = state.bioGramNeben || calcBG(taetigkeiten.filter((t: any) => t.kategorie === "neben"));
    const fuehrungBG = state.bioGramFuehrung || calcBG(taetigkeiten.filter((t: any) => t.kategorie === "fuehrung"));
    const rahmen = state.bioGramRahmen || calcRahmen(state);
    const gesamt = state.bioGramGesamt || calcGesamt(haupt, neben, fuehrungBG, rahmen);

    return {
      job_title: beruf,
      job_family: "",
      role_profile: bgToTriadShared(gesamt),
      frame_profile: bgToTriadShared(rahmen),
      leadership: {
        required: isLeadership,
        profile: isLeadership ? bgToTriadShared(fuehrungBG) : undefined,
        type: fuehrungstyp.startsWith("Disziplinarische") ? "disziplinarisch" : fuehrungstyp === "Fachliche Führung" ? "fachlich" : undefined,
      },
      tasks_profile: bgToTriadShared(haupt),
      human_profile: bgToTriadShared(neben),
      success_metrics: [],
      tension_fields: [],
    };
  } catch { return null; }
}
