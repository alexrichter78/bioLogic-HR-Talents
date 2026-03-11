export type ComponentKey = "impulsiv" | "intuitiv" | "analytisch";
export type FitStatus = "SUITABLE" | "CONDITIONAL" | "NOT_SUITABLE";
export type ControlIntensity = "LOW" | "MEDIUM" | "HIGH";

export type Triad = Record<ComponentKey, number>;

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

export type MatrixAreaId =
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

function sortTriadDesc(t: Triad) {
  return (Object.keys(t) as ComponentKey[]).map(k => ({ key: k, value: t[k] })).sort((a, b) => b.value - a.value);
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

export function labelComponent(k: ComponentKey) {
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

function koRuleTriggered(role: RoleAnalysis, cand: CandidateInput): boolean {
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

function calcControlIntensity(role: RoleAnalysis, cand: CandidateInput): { points: number; level: ControlIntensity } {
  const r = normalizeTriad(role.role_profile);
  const c = normalizeTriad(cand.candidate_profile);
  const rDom = dominanceModeOf(r);
  const cDom = dominanceModeOf(c);
  let points = 0;

  if (rDom.top1.key !== cDom.top1.key || rDom.mode.startsWith("DUAL") !== cDom.mode.startsWith("DUAL")) points += 2;
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
  if (diff <= 15) return "eine spürbare Abweichung";
  if (diff <= 25) return "eine deutliche Abweichung";
  return "eine große Diskrepanz";
}

function gapAdj(diff: number): string {
  if (diff <= 3) return "nahezu identisch";
  if (diff <= 8) return "leicht abweichend";
  if (diff <= 15) return "spürbar abweichend";
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
      ? `Gleichverteilung: Die Person zeigt keine klare Arbeitsweise. Die Rolle braucht eine deutliche ${rLabel}-Ausrichtung. Ohne einen klaren Schwerpunkt fehlt die Grundlage, um Aufgaben gezielt zu priorisieren und Entscheidungen konsequent zu treffen.`
      : dominanceStatus === "SUITABLE"
        ? `Die Arbeitsweise passt: Beide Profile sind ${rLabel}-geprägt und ${gapAdj(domDiff)}. Die Rolle wird in ihren Kernanforderungen gut abgebildet – Entscheidungen, Prioritäten und Arbeitsweise bleiben konsistent.`
        : dominanceStatus === "CONDITIONAL"
          ? (sameDominant
            ? `Gleiche Arbeitsweise (${rLabel}), aber es gibt ${gapDesc(domDiff)} in der Ausprägung. In Drucksituationen kann die Umsetzung schwächer ausfallen als gefordert. Klare Ziele und regelmäßige Abstimmungen helfen hier.`
            : `Verschiebung von ${rLabel} zu ${cLabel}: Die Arbeitsweise verändert sich. Entscheidungen und Prioritäten folgen einer anderen Logik. Mit klaren Zielvorgaben und festen Entscheidungsfristen lässt sich das steuern.`)
          : `Deutliche Verschiebung von ${rLabel} zu ${cLabel}. Die zentrale Arbeitsweise der Position wird nicht abgebildet. Die Art, wie Entscheidungen getroffen und Prioritäten gesetzt werden, weicht grundlegend von dem ab, was die Rolle verlangt.`,
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
      ? `Passt: Die Rolle braucht ${decRoleDesc}, die Person entscheidet ${decCandDesc}. Die Art, wie Entscheidungen getroffen und Prioritäten gesetzt werden, stimmt überein. Tempo und Abläufe bleiben stabil.`
      : decisionStatus === "CONDITIONAL"
        ? (sameDominant
          ? `Gleiche Entscheidungsweise (${rLabel}), aber es gibt ${gapDesc(decMainDiff)} in der Ausprägung. Entscheidungen können weicher oder langsamer ausfallen. Klare Fristen und feste Regeln für Eskalationen helfen.`
          : `Die Rolle braucht ${decRoleDesc}, die Person entscheidet ${decCandDesc}. Es gibt ${gapDesc(decMainDiff)} zwischen Anforderung und Person. Entscheidungen werden anders getroffen als die Rolle es verlangt. Klare Fristen und Eskalationswege können das ausgleichen.`)
        : `Die Rolle braucht ${decRoleDesc}, die Person ist ${decCandDesc}. Es gibt ${gapDesc(decMainDiff)} zwischen Anforderung und Person. Eingriffe werden verzögert oder anders priorisiert. ${t.tempoContext}, ${t.qualityMetric} und die operative Führung sind betroffen.`,
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
        ? `Die Führungsanforderung ist ${lLabel}-geprägt – die Person bringt eine passende Ausprägung mit. Zielklarheit, Delegation und Durchsetzungsfähigkeit passen zur Rolle. Das Team bekommt die Führung, die es braucht.`
        : leadershipStatus === "NOT_SUITABLE"
          ? `Die Rolle braucht ${lLabel}-betonte Führung. Es gibt ${gapDesc(leadDiffVal)} zwischen Anforderung und Person. Klare Zielsetzung, Konfliktfähigkeit und Durchsetzung unter Druck sind zu schwach ausgeprägt. Der Führungsaufwand für die nächste Ebene steigt erheblich.`
          : `Die Führungsanforderung ist ${lLabel}-geprägt. Es gibt ${gapDesc(leadDiffVal)} zwischen Anforderung und Person. Führungswirkung ist machbar, wenn klare Ziele, Eskalationswege und regelmäßige Reviews für ${t.kpiExamples} definiert werden.`,
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
      ? `Durchsetzungsfähigkeit und Bereitschaft, Probleme direkt anzusprechen, passen zur Rolle. Konflikte werden zeitnah angegangen, Leistungsunterschiede im Team bleiben sichtbar.`
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
      ? `Tempo und Reaktionsfähigkeit passen zur Rolle${compMarket ? " – auch unter hohem Marktdruck" : ""}. ${t.resultMetric} bleiben stabil.`
      : competitionStatus === "NOT_SUITABLE"
        ? `${compMarket ? "Hoher Marktdruck: " : ""}Es gibt ${gapDesc(Math.abs(compImpGap))} beim Tempo. Der nötige Antrieb fehlt – Aufgaben werden eher geprüft als zügig umgesetzt. ${t.resultMetric} werden spürbar geschwächt.`
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
      ? `Die kulturelle Wirkung passt zur Rolle. Teamzusammenhalt, Motivation und Bindung bleiben stabil, ohne die Rollenanforderungen zu beeinträchtigen.`
      : cultureStatus === "NOT_SUITABLE"
        ? `Die kulturelle Wirkung verschiebt sich deutlich. Ergebnisorientierung und klare Leistungsunterschiede werden geschwächt. Die Rolle verlangt Leistungsfokus, die Person setzt eher auf Beziehungspflege.`
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
          ? `In regulierten Umfeldern braucht es durchgehend klare Standards, Freigabeprozesse und regelmäßige Kontrollen. Ohne diese Struktur steigt das Risiko für Abweichungen.`
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
            ? `Im B2C-Umfeld: Die Abschlussstärke ist vorhanden, braucht aber klare Ziele und regelmäßige Führung, um wirksam zu werden. Ohne das sinkt die Abschlussquote.`
            : `Im B2B-Umfeld: Beziehungsfähigkeit ist vorhanden, aber die Balance zwischen Beziehungspflege und Ergebnisorientierung muss aktiv gehalten werden. ${t.pipelineTerm} braucht Führung.`)
          : (ct === "B2C"
            ? `Im B2C-Umfeld: Tempo und Abschlussquote werden voraussichtlich unter dem liegen, was die Rolle braucht. Der nötige Antrieb für schnelle Abschlüsse fehlt.`
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
  const jobTitle = role.job_title || "diese Position";
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
    shortTerm.push(`Die Arbeitsweise passt zur Rolle ${jobTitle}. Die Person kann sich schnell einarbeiten und wirksam werden. ${t.qualityMetric} und stabile Abläufe sind positiv zu erwarten.`);
    midTerm.push("Der Führungsaufwand bleibt überschaubar. Prioritäten und Entscheidungen liegen im erwarteten Rahmen – die Person steuert sich weitgehend selbst.");
    longTerm.push("Die Wirkung in der Rolle bleibt voraussichtlich stabil. Es ist nicht zu erwarten, dass sich die Arbeitsweise schleichend von den Anforderungen entfernt.");
  } else if (engine.overallFit === "CONDITIONAL") {
    if (dualConflict) {
      const c2L = labelComponent(cDom.top2.key);
      shortTerm.push(`Die Person zeigt eine Doppeldominanz: ${labelComponent(cDom.top1.key)} und ${c2L} sind nahezu gleich stark ausgeprägt. Die Rolle ${jobTitle} braucht aber eine klare ${rL}-Ausrichtung. Reibung im Alltag ist wahrscheinlich.`);
      midTerm.push(`Die beiden gleichstarken Arbeitsweisen führen dazu, dass ${rL}-Aufgaben nicht mit voller Konsequenz bearbeitet werden. Die Person wechselt zwischen ${labelComponent(cDom.top1.key)}- und ${c2L}-Prioritäten – Konstanz und ${t.qualityMetric} schwanken.`);
      longTerm.push(`Ohne klare Führung wird die Rollenausübung zunehmend unscharf. Die geforderte ${rL}-Wirkung verwässert – Entscheidungen und Abläufe verschieben sich schleichend.`);
    } else {
      shortTerm.push(`Reibung im Bereich „${critical.label}": Die Abweichung zwischen dem, was die Rolle braucht, und der Arbeitsweise der Person zeigt sich hier am deutlichsten. Ein guter Start ist möglich, braucht aber klare Führung.`);
      if (sameDom) {
        midTerm.push(`Die Grundrichtung stimmt, aber die nötige Intensität fehlt. Ohne klare Ziele und regelmäßige Abstimmungen werden Prioritäten und Umsetzung zunehmend weicher – Abläufe werden instabiler.`);
      } else {
        midTerm.push(`Die Arbeitsweise der Person weicht von dem ab, was die Rolle braucht. Ohne klare Ziele besteht das Risiko, dass Entscheidungen und Prioritäten nach eigener Logik gesetzt werden. Abläufe verschieben sich.`);
      }
      longTerm.push(`Ohne aktive Führung verändert sich die Wirkung der Position ${jobTitle} über die Zeit. Anforderungen werden anders priorisiert, der Fokus auf ${t.kpiExamples} verschiebt sich – die Wirkung der Position nimmt ab.`);
    }
  } else {
    if (equalDistConflict) {
      shortTerm.push(`Gleichverteilung (${c.impulsiv}/${c.intuitiv}/${c.analytisch}): Es gibt keinen erkennbaren Schwerpunkt in der Arbeitsweise. Die Rolle ${jobTitle} braucht eine klare ${rL}-Ausrichtung – diese fehlt. Bereits in der Einarbeitung ist Orientierungslosigkeit zu erwarten.`);
      midTerm.push(`Ohne klaren Schwerpunkt fehlt die Grundlage, um konsequent Prioritäten zu setzen. Die Person reagiert situativ statt systematisch. Entscheidungsqualität, ${t.qualityMetric} und stabile Abläufe sind nicht verlässlich.`);
      longTerm.push(`Die Gleichverteilung verhindert eine stabile Wirkung in der Rolle. Statt ${rL}-geprägter Arbeit entsteht eine unklare Dynamik. ${t.kpiExamples}, Tempo und Qualität bleiben dauerhaft fragil.`);
    } else if (dualConflict && !roleKeyInDual) {
      const c2L = labelComponent(cDom.top2.key);
      shortTerm.push(`Doppeldominanz ${labelComponent(cDom.top1.key)}/${c2L} – die von der Rolle ${jobTitle} geforderte ${rL}-Ausrichtung ist in keiner der beiden Stärken enthalten. Reibung zeigt sich schon in der Einarbeitung.`);
      midTerm.push(`Die Arbeitsweise wird von ${labelComponent(cDom.top1.key)} und ${c2L} bestimmt. Die für die Rolle zentrale ${rL}-Ausrichtung fehlt. Entscheidungen, ${t.qualityMetric} und Prioritäten folgen einer grundlegend anderen Logik.`);
      longTerm.push(`Die Besetzung verändert die Grundausrichtung der Position. Statt ${rL}-geprägter Arbeit entsteht eine ${labelComponent(cDom.top1.key)}/${c2L}-Dynamik. Abläufe, Tempo und Qualität passen nicht zur Rolle.`);
    } else {
      shortTerm.push(`Schon in der Einarbeitung ist mit Reibung zu rechnen. Die Arbeitsweise der Person passt nicht zu dem, was die Position ${jobTitle} braucht.`);
      midTerm.push(`Die Leistungsstruktur der Rolle wird sich voraussichtlich verschieben. Prioritäten, Entscheidungen und Führungsfähigkeit folgen einer anderen Logik. ${t.qualityMetric} und stabile Abläufe sind gefährdet.`);
      longTerm.push(
        role.leadership?.required
          ? `Die Abweichung betrifft die Kernanforderungen der Position. Tempo, ${t.qualityMetric}, ${t.forecastTerm} und Führungswirkung werden dauerhaft nicht das erreichen, was die Rolle braucht.`
          : `Die Abweichung betrifft die Kernanforderungen der Position. Tempo, ${t.qualityMetric} und ${t.forecastTerm} werden dauerhaft nicht das erreichen, was die Rolle braucht.`
      );
    }
  }

  if (critical.id === "conflict") {
    midTerm.push("Bei Zielabweichungen wird die Person eher vermitteln als klar einzugreifen. Leistungsunterschiede im Team werden nicht deutlich angesprochen.");
    longTerm.push("Der Unterschied zwischen starken und schwachen Leistungen verwischt. Qualität und Ergebnisse sinken, weil Korrekturen nicht rechtzeitig erfolgen.");
  }
  if (critical.id === "decision_logic") {
    midTerm.push("Entscheidungen werden tendenziell langsamer getroffen. Die Person sichert sich stärker ab, statt zügig zu handeln. Operative Abläufe verlangsamen sich.");
    longTerm.push(`Unter Zeitdruck oder bei Zielkonflikten sinkt die Reaktionsgeschwindigkeit deutlich. ${t.forecastTerm} und stabile Abläufe leiden, weil sich Verzögerungen aufsummieren.`);
  }
  if (critical.id === "kpi_work") {
    midTerm.push(`${t.forecastTerm} und Reporting: Die Disziplin bei ${t.reportingDesc} wird voraussichtlich ungleichmäßig sein. Kennzahlen verlieren ihre Aussagekraft.`);
    longTerm.push(`Ohne regelmäßiges Nachhalten sinkt die Transparenz über Zielerreichung und ${t.pipelineTerm}. Lücken werden erst spät sichtbar.`);
  }
  if (critical.id === "leadership_effect") {
    midTerm.push("Die Führungswirkung weicht von dem ab, was die Rolle braucht. Das Team bekommt nicht die Impulse, die es braucht. Der Führungsaufwand für die nächste Ebene steigt.");
    longTerm.push(`Ohne klare Eskalationswege und feste Ziele bleibt die Führungswirkung fragil. Delegation und konsequente Zielverfolgung nehmen ab – ${t.qualityMetric} leidet.`);
  }
  if (critical.id === "competition") {
    midTerm.push(`Tempo und ${t.resultMetric}: Geschwindigkeit und Durchsetzungskraft werden voraussichtlich gebremst. Prioritäten verschieben sich in Richtung Absicherung statt Handlung.`);
    longTerm.push(`In einem dynamischen Umfeld besteht das Risiko, dass Aufgaben abwartend statt proaktiv angegangen werden. ${t.resultMetric} und ${t.qualityMetric} können sich verschlechtern.`);
  }
  if (critical.id === "culture") {
    midTerm.push("Die kulturelle Wirkung der Person unterscheidet sich von dem, was die Rolle braucht. Leistungsfokus und Ergebnisorientierung im Team verschieben sich.");
    longTerm.push(`Langfristig können Leistungsunterschiede und Ergebnisorientierung nachlassen. ${t.qualityMetric} leidet, weil die Teamkultur in eine unkontrollierte Richtung driftet.`);
  }

  if (candEqualDist) {
    midTerm.push(`Vollsymmetrie-Risiko: Ohne klare Leitstruktur fehlt unter Stress der Rückfallmechanismus. Das Verhalten wird sprunghaft – die Person wechselt unkontrolliert zwischen allen drei Arbeitsweisen. Entscheidungen werden widersprüchlich oder bleiben aus.`);
    longTerm.push(`Die fehlende Leitstruktur verhindert eine stabile Stressreaktion. Während Personen mit klarem Schwerpunkt unter Druck vorhersagbar reagieren, bleibt bei Vollsymmetrie offen, welche Steuerungslogik sich durchsetzt. Das macht langfristige Führung und Entwicklung deutlich schwieriger.`);
  }

  if (tags.market_pressure === "hoch")
    longTerm.push(`In einem Hochdruckumfeld wirkt jede Verzögerung direkt auf ${t.resultMetric}. Die beschriebenen Abweichungen verstärken sich unter Druck.`);
  if (tags.regulation === "hoch")
    longTerm.push("In einem regulierten Umfeld können die beschriebenen Abweichungen zu Qualitäts-, Haftungs- oder Auditproblemen führen. Sorgfalt und Regeltreue müssen durchgehend sichergestellt werden.");

  return { shortTerm, midTerm, longTerm };
}

function developmentFromControl(control: ControlIntensity, points: number, criticalLabel: string, t: RoleTerms) {
  if (control === "LOW") return { likelihood: "hoch" as const, timeframe: "3–6 Monate", text: `Führungsaufwand: gering. Die Arbeitsweise passt zur Rolle – regelmäßige Gespräche und normales Feedback reichen aus. ${t.qualityMetric} und stabile Abläufe sind positiv zu erwarten.` };
  if (control === "MEDIUM") return { likelihood: "mittel" as const, timeframe: "6–12 Monate", text: `Führungsaufwand: mittel. Gezielte Review-Gespräche und klare Ziele sind nötig – besonders im Bereich „${criticalLabel}". Ohne aktive Führung verschieben sich Prioritäten. ${t.qualityMetric} ist machbar, aber braucht Begleitung.` };
  return { likelihood: "gering" as const, timeframe: ">12 Monate", text: `Führungsaufwand: hoch. Die Abweichung betrifft die zentralen Anforderungen der Rolle. Entwicklung braucht intensive Führungsarbeit und enge Begleitung – besonders im Bereich „${criticalLabel}". ${t.qualityMetric} und stabile Abläufe sind nur mit dauerhaft hohem Führungsaufwand erreichbar.` };
}

function integrationPlan(role: RoleAnalysis, criticalArea: MatrixAreaId, control: ControlIntensity, t: RoleTerms) {
  const tags = role.environment_tags || {};
  const jobTitle = role.job_title || "diese Position";
  const jobFamily = role.job_family || "";
  const phase_0_30: string[] = [];
  const phase_30_60: string[] = [];
  const phase_60_90: string[] = [];

  phase_0_30.push(`Onboarding ${jobTitle}: Verantwortungsbereich, Entscheidungsbefugnisse, Eskalationswege und zentrale Kennzahlen (${t.kpiExamples}) schriftlich festhalten.`);
  phase_0_30.push(`${t.targetTerm} für die ersten 90 Tage: messbar, terminiert, mit klaren Prioritäten und festen Abstimmungsterminen.`);
  phase_0_30.push(`Die drei wichtigsten Herausforderungen der Position identifizieren und gemeinsam besprechen, wie damit umgegangen wird.`);

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
    phase_0_30.push(`Führungsanforderung für ${jobTitle} festhalten: Ziele, Delegation, Eskalationswege und regelmäßige Reviews für ${t.kpiExamples} definieren.`);
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
    phase_30_60.push(`Die zentralen Herausforderungen der Position ${jobTitle} aktiv begleiten: Klare Prioritäten, feste Ziele und regelmäßige Review-Gespräche.`);
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
    phase_60_90.push(`Klare Go/No-Go-Entscheidung: Erfüllt die Person die Kernanforderungen der Position? Ergebnis anhand messbarer Kriterien (${t.kpiExamples}) bewerten.`);
  }

  phase_60_90.push(
    role.leadership?.required
      ? `90-Tage-Review: Passung zur Rolle ${jobTitle} bewerten. Ergebnis festhalten – ${t.kpiExamples}, Prozessqualität und Führungswirkung als Entscheidungsgrundlage.`
      : `90-Tage-Review: Passung zur Rolle ${jobTitle} bewerten. Ergebnis festhalten – ${t.kpiExamples} und Prozessqualität als Entscheidungsgrundlage.`
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

export function runEngine(role: RoleAnalysis, cand: CandidateInput): EngineResult {
  const roleDom = dominanceModeOf(role.role_profile);
  const candDom = dominanceModeOf(cand.candidate_profile);
  const ko = koRuleTriggered(role, cand);
  const mismatch = weightedMismatch(role.role_profile, cand.candidate_profile);
  const sameDom = roleDom.top1.key === candDom.top1.key;
  const roleNearDual = roleDom.gap1 <= 5;
  const effectiveSameDom = sameDom || (roleNearDual && candDom.top1.key === roleDom.top2.key);
  const candEqualDist = candDom.mode === "BAL_FULL";
  const candDualDominance = !candEqualDist && candDom.gap1 <= 5;
  const roleClearDominance = roleDom.gap1 >= 15;
  const dualConflict = candDualDominance && roleClearDominance;
  const equalDistConflict = candEqualDist && roleClearDominance;
  const roleKeyInDual = dualConflict && (candDom.top1.key === roleDom.top1.key || candDom.top2.key === roleDom.top1.key);
  let overallFit: FitStatus = ko ? "NOT_SUITABLE" : overallFitFromScore(mismatch, effectiveSameDom);
  if (equalDistConflict && !ko) {
    overallFit = "NOT_SUITABLE";
  } else if (dualConflict && !ko) {
    if (roleKeyInDual) {
      if (overallFit === "SUITABLE") overallFit = "CONDITIONAL";
    } else {
      overallFit = "NOT_SUITABLE";
    }
  }
  const secondaryFlipped = sameDom && roleDom.top2.key !== candDom.top2.key;
  if (overallFit === "SUITABLE" && !ko) {
    if (secondaryFlipped && candDom.gap2 > 5) {
      overallFit = "NOT_SUITABLE";
    } else if (secondaryFlipped) {
      overallFit = "CONDITIONAL";
    } else if (sameDom && candDom.gap2 <= 5 && candDom.gap1 <= 15) {
      overallFit = "CONDITIONAL";
    }
  }
  const t = resolveRoleTerms(role);
  const ctrl = calcControlIntensity(role, cand);
  const matrix = buildMatrix(role, cand, t);
  const critical = criticalAreaFromMatrix(matrix);

  const r = normalizeTriad(role.role_profile);
  const c = normalizeTriad(cand.candidate_profile);
  const rL = labelComponent(roleDom.top1.key);
  const cL = labelComponent(candDom.top1.key);
  const mainDiff = Math.abs(r[roleDom.top1.key] - c[roleDom.top1.key]);

  const candName = cand.candidate_name || "Person";
  const jobTitle = role.job_title || "diese Position";
  const competingL = dualConflict ? labelComponent(candDom.top1.key === roleDom.top1.key ? candDom.top2.key : candDom.top1.key) : "";

  const keyReason = (() => {
    if (equalDistConflict) {
      return `${candName} zeigt eine Gleichverteilung aller drei Komponenten – es gibt keinen erkennbaren Schwerpunkt. Die Rolle ${jobTitle} braucht eine klare ${rL}-Ausrichtung. Ohne klaren Schwerpunkt fehlt die Grundlage, um gezielt Prioritäten zu setzen und konsequent zu entscheiden.`;
    }
    if (dualConflict && roleKeyInDual) {
      return `${candName} bringt die geforderte ${rL}-Arbeitsweise grundsätzlich mit, allerdings konkurriert sie mit einer gleich starken ${competingL}-Prägung. Die Rolle ${jobTitle} braucht eine klare ${rL}-Ausrichtung – diese Eindeutigkeit fehlt. Prioritäten und ${t.qualityMetric} werden instabil.`;
    }
    if (dualConflict && !roleKeyInDual) {
      return `${candName} arbeitet vorrangig ${labelComponent(candDom.top1.key)}-/${labelComponent(candDom.top2.key)}-geprägt. Die für ${jobTitle} entscheidende ${rL}-Arbeitsweise fehlt. Entscheidungen, Prioritäten und stabile Abläufe sind kritisch betroffen.`;
    }
    if (overallFit === "SUITABLE") {
      return `${candName} passt zur Rolle ${jobTitle}. Die geforderte ${rL}-Arbeitsweise wird stabil abgebildet. Kritischster Bereich: „${critical.label}" – dort ist die Passung am engsten.`;
    }
    if (secondaryFlipped && overallFit === "NOT_SUITABLE") {
      const roleSecL = labelComponent(roleDom.top2.key);
      const candSecL = labelComponent(candDom.top2.key);
      return `${candName} arbeitet zwar ${rL}-orientiert, aber die Sekundärausrichtung passt nicht: Die Rolle braucht ${roleSecL} als zweite Stärke, ${candName} bringt jedoch klar ${candSecL} mit. Diese strukturelle Abweichung verändert Arbeitsstil und Prioritäten grundlegend – besonders im Bereich „${critical.label}".`;
    }
    if (secondaryFlipped && sameDom && overallFit === "CONDITIONAL") {
      const roleSecL = labelComponent(roleDom.top2.key);
      const candSecL = labelComponent(candDom.top2.key);
      return `${candName} arbeitet ${rL}-orientiert wie gefordert, aber die Sekundärausrichtung ist unklar: Die Rolle braucht ${roleSecL} als zweite Stärke, ${candName} zeigt eine Mischung aus ${roleSecL} und ${candSecL}. Mit Führung steuerbar – besonders im Bereich „${critical.label}".`;
    }
    if (effectiveSameDom && overallFit === "CONDITIONAL") {
      return `${candName} arbeitet grundsätzlich ${rL}-orientiert, aber die Ausprägung liegt unter dem, was die Rolle braucht. Es gibt ${gapDesc(mainDiff)} – besonders im Bereich „${critical.label}". Mit Führung steuerbar, aber nicht selbsttragend.`;
    }
    if (overallFit === "CONDITIONAL") {
      return `${candName} bringt eine andere Arbeitsweise mit als ${jobTitle} braucht (Rolle: ${rL}, Person: ${cL}). Eine Besetzung ist möglich, braucht aber klare Ziele und Führung – besonders im Bereich „${critical.label}".`;
    }
    return `${candName} passt nicht zu den Kernanforderungen der Rolle ${jobTitle}. Die geforderte ${rL}-Arbeitsweise wird nicht abgebildet – es gibt ${gapDesc(mainDiff)}. Besonders kritisch: „${critical.label}".`;
  })();

  const execSummary = (() => {
    const intro = `Rolle: ${jobTitle} | ${candName}`;
    const fitLine = `Gesamteinstufung: ${statusLabel(overallFit)} · Führungsaufwand: ${controlLabel(ctrl.level)}`;
    let domLine: string;
    if (equalDistConflict) {
      domLine = `Gleichverteilung – kein erkennbarer Schwerpunkt. Die Rolle braucht eine klare ${rL}-Ausrichtung. Die Grundlage für gezielte Prioritäten und konsequente Entscheidungen fehlt.`;
    } else if (dualConflict) {
      domLine = `Doppeldominanz: ${labelComponent(candDom.top1.key)} und ${labelComponent(candDom.top2.key)} konkurrieren – die Rolle braucht eine klare ${rL}-Ausrichtung. Prioritäten und Entscheidungen werden instabil.`;
    } else if (sameDom && secondaryFlipped && candDom.gap2 > 5) {
      const roleSecL = labelComponent(roleDom.top2.key);
      const candSecL = labelComponent(candDom.top2.key);
      domLine = `Beide Profile sind ${rL}-geprägt, aber die Sekundärausrichtung passt nicht: Rolle erwartet ${roleSecL}, Person bringt klar ${candSecL}. Arbeitsstil und Prioritätensetzung weichen strukturell ab.`;
    } else if (sameDom && secondaryFlipped) {
      const roleSecL = labelComponent(roleDom.top2.key);
      const candSecL = labelComponent(candDom.top2.key);
      domLine = `Beide Profile sind ${rL}-geprägt, die Sekundärausrichtung ist jedoch unklar: Rolle erwartet ${roleSecL}, Person zeigt eine Mischung. Mit Führung steuerbar.`;
    } else if (effectiveSameDom) {
      domLine = `Beide Profile sind ${rL}-geprägt und ${gapAdj(mainDiff)}. Arbeitsweise und Prioritäten stimmen in der Grundrichtung überein.`;
    } else {
      domLine = `Die Rolle braucht eine ${rL}-geprägte Arbeitsweise. ${candName} arbeitet ${cL}-geprägt. Entscheidungen und Prioritäten brauchen Führung.`;
    }
    return [intro, fitLine, domLine].join("\n");
  })();

  const secondaryTension = (() => {
    if (!sameDom || equalDistConflict || dualConflict) return null;
    const rSec = roleDom.top2.key;
    const cSec = candDom.top2.key;
    if (rSec === cSec) return null;
    const rSecVal = r[rSec];
    const cSecDiff = Math.abs(c[cSec] - c[rSec]);
    if (cSecDiff < 3) return null;

    const secDescriptions: Record<ComponentKey, { label: string; focus: string; stressBehavior: string }> = {
      impulsiv: { label: "Impulsiv", focus: "Umsetzungsdruck und Ergebnisverantwortung", stressBehavior: "Durchsetzung und schnelle Entscheidungen" },
      intuitiv: { label: "Intuitiv", focus: "Beziehungsorientierung und Teamdynamik", stressBehavior: "Abstimmung, Konsens und zwischenmenschliche Klärung" },
      analytisch: { label: "Analytisch", focus: "Sachbezogenheit und fachliche Präzision", stressBehavior: "Datenprüfung, Absicherung und strukturelle Klärung" },
    };

    const roleSecDesc = secDescriptions[rSec];
    const candSecDesc = secDescriptions[cSec];

    const text = `Die Hauptausrichtung stimmt überein (${rL}). Die Zweitstärke der Rolle ist ${roleSecDesc.label} (${roleSecDesc.focus}), die Person bringt jedoch ${candSecDesc.label} als Zweitstärke mit (${candSecDesc.focus}). Im Alltag unauffällig – unter Druck reagiert die Person eher mit ${candSecDesc.stressBehavior} statt mit ${roleSecDesc.stressBehavior}.`;

    const stressText = `Unter Stress: Die Rolle erwartet in kritischen Situationen ${roleSecDesc.stressBehavior}. Die Person wird stattdessen auf ${candSecDesc.stressBehavior} zurückgreifen. Im Team und in den Abläufen ist das situativ spürbar.`;

    return {
      detected: true,
      roleSecondary: rSec,
      candSecondary: cSec,
      roleSecondaryValue: rSecVal,
      candSecondaryValue: c[cSec],
      text,
      stressText,
    };
  })();

  const risks = buildRisks(role, cand, { overallFit, control: ctrl.level, matrix, mismatch }, t);
  if (secondaryTension) {
    risks.midTerm.push(secondaryTension.stressText);
  }
  const dev = developmentFromControl(ctrl.level, ctrl.points, critical.label, t);
  const plan = integrationPlan(role, critical.id, ctrl.level, t);

  return {
    roleDominance: roleDom, candDominance: candDom,
    overallFit, mismatchScore: mismatch, koTriggered: ko,
    controlIntensity: ctrl.level, controlPoints: ctrl.points,
    criticalArea: critical.id, criticalAreaLabel: critical.label,
    equalDistribution: equalDistConflict,
    secondaryTension,
    keyReason, executiveSummary: execSummary,
    matrix, risks, development: dev, integrationPlan90: plan,
  };
}
