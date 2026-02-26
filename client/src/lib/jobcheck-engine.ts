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
        pipelineTerm: "Kandidaten-Pipeline und Besetzungsstand",
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
      ? `Gleichverteilung: Das Kandidatenprofil zeigt keine erkennbare Steuerungsrichtung (${c.impulsiv}/${c.intuitiv}/${c.analytisch}). Die Rolle verlangt ${rLabel}-Arbeitslogik (Soll: ${r[rDom.top1.key]}). Ohne dominantes Steuerungsprofil fehlt die strukturelle Basis für Priorisierung, Entscheidungsarchitektur und ${t.qualityMetric}.`
      : dominanceStatus === "SUITABLE"
        ? `Die Arbeitslogik ist identisch: Beide Profile sind ${rLabel}-gesteuert (Abweichung ${domDiff} Punkte). Die Rolle wird in ihrer Kernwirkung stabil abgebildet – Priorisierung, Entscheidungsarchitektur und Steuerungslogik bleiben konsistent.`
        : dominanceStatus === "CONDITIONAL"
          ? (sameDominant
            ? `Gleiche Arbeitslogik (${rLabel}), jedoch weicht die Intensität um ${domDiff} Punkte ab (Soll: ${r[rDom.top1.key]} / Ist: ${c[rDom.top1.key]}). Auswirkung: Priorisierungsverhalten und Umsetzungskonstanz können unter Druck schwächer ausfallen als gefordert. Klare Zielarchitektur und Steuerungsintervalle erforderlich.`
            : `Dominanzverschiebung von ${rLabel} (${r[rDom.top1.key]}) zu ${cLabel} (${c[cDom.top1.key]}). Die Arbeitslogik verändert sich: Entscheidungswege, Priorisierung und operative Steuerung folgen einer anderen Logik. Abweichung in der Rollenkomponente: ${domDiff} Punkte. Steuerbar mit engmaschiger Zielarchitektur und klaren Entscheidungsfristen.`)
          : `Fundamentale Dominanzverschiebung von ${rLabel} (${r[rDom.top1.key]}) zu ${cLabel} (${c[cDom.top1.key]}). Die strukturelle Kernlogik der Position ist nicht abgebildet. Auswirkung: Entscheidungsarchitektur, ${t.qualityMetric} und Priorisierungsverhalten weichen grundlegend von der Rollenanforderung ab.`,
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
      ? `Die Entscheidungsarchitektur passt: Die Rolle verlangt ${decRoleDesc}, der Kandidat entscheidet ${decCandDesc}. Entscheidungswege, Eskalationslogik und Priorisierung bleiben konsistent. Auswirkung auf Tempo und Prozessstabilität: stabil.`
      : decisionStatus === "CONDITIONAL"
        ? (sameDominant
          ? `Gleiche Entscheidungslogik (${rLabel}), jedoch weicht die Intensität um ${decMainDiff} Punkte ab (Soll: ${r[rDom.top1.key]} / Ist: ${c[rDom.top1.key]}). Auswirkung: Entscheidungen fallen tendenziell weicher oder langsamer. Steuerbar durch klare Entscheidungsfristen, Eskalationsregeln und verbindliche Priorisierung.`
          : `Die Rolle verlangt ${decRoleDesc} (${rLabel} ${r[rDom.top1.key]}), der Kandidat entscheidet ${decCandDesc} (${cLabel} ${c[cDom.top1.key]}). Abweichung: ${decMainDiff} Punkte. Auswirkung: Entscheidungswege verschieben sich, Priorisierung folgt einer anderen Logik. Steuerbar mit klaren Entscheidungsfristen und Eskalationsregeln.`)
        : `Die Rolle verlangt ${decRoleDesc} (${rLabel} ${r[rDom.top1.key]}), der Kandidat ist ${decCandDesc} (${cLabel} ${c[cDom.top1.key]}). Abweichung: ${decMainDiff} Punkte. Auswirkung: Interventionen werden strukturell verzögert oder anders priorisiert. ${t.tempoContext}, ${t.qualityMetric} und operative Steuerung sind betroffen.`,
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
    roleDemand: `Analytisch ${r.analytisch} – ${r.analytisch >= 40 ? `stark kennzahlengesteuert, hohe Anforderung an ${t.reportingDesc}` : r.analytisch >= 25 ? "Kennzahlen als Steuerungsinstrument" : `geringe Anforderung an ${t.reportingDesc}`}`,
    candidatePattern: `Analytisch ${c.analytisch} – ${c.analytisch >= 30 ? "Strukturdisziplin und Zahlenorientierung anschlussfähig" : c.analytisch >= 20 ? "Kennzahlen als Orientierung, nicht als Steuerungsinstrument" : "geringe analytische Steuerungsbasis"}`,
    status: kpiStatus,
    reasoning: kpiStatus === "SUITABLE"
      ? `Analytisch Soll: ${r.analytisch} / Ist: ${c.analytisch}. Die analytische Basis ist vorhanden. Steuerung über ${t.kpiExamples} und ${t.reportingDesc} ist stabil aufsetzbar. Auswirkung auf ${t.forecastTerm} und Zielerreichung: stabil.`
      : kpiStatus === "CONDITIONAL"
        ? `Analytisch Soll: ${r.analytisch} / Ist: ${c.analytisch} (Δ ${kpiDiff} Punkte). Auswirkung: Disziplin bei ${t.reportingDesc} erfordert feste Routinen, klare Standards und konsequentes Nachhalten. Ohne Steuerung sinkt die Qualität von ${t.forecastTerm} und ${t.qualityMetric}.`
        : `Analytisch Soll: ${r.analytisch} / Ist: ${c.analytisch} (Δ ${kpiDiff} Punkte). Auswirkung: ${t.reportingDesc} wird interpretationsabhängig, Strukturdisziplin muss durchgängig geführt werden. Kennzahlen (${t.kpiExamples}) verlieren ohne engmaschige Steuerung ihre Steuerungswirkung. ${t.forecastTerm} und ${t.qualityMetric} instabil.`,
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
        ? `Die Führungsanforderung ist ${lLabel}-geprägt${lDom ? ` (${lp![lDom.top1.key]})` : ""} – der Kandidat bringt ${c[lDom?.top1.key || rDom.top1.key]} mit. Zielklarheit, Delegationslogik und Durchsetzungsfähigkeit passen zur Rollenanforderung. Auswirkung auf Teamdynamik und Führungsaufwand: stabil.`
        : leadershipStatus === "NOT_SUITABLE"
          ? `Die Rolle verlangt ${lLabel}-dominante Führung${lDom ? ` (${lp![lDom.top1.key]})` : ""}, der Kandidat liegt bei ${c[lDom?.top1.key || rDom.top1.key]} (Δ ${leadDiffVal} Punkte). Auswirkung: Zielarchitektur, Konfliktfähigkeit und Durchsetzung unter Druck sind strukturell zu schwach. Führungsaufwand für die nächste Ebene steigt erheblich.`
          : `Die Führungsanforderung ist ${lLabel}-geprägt${lDom ? ` (${lp![lDom.top1.key]})` : ""}, der Kandidat bringt ${c[lDom?.top1.key || rDom.top1.key]} mit (Δ ${leadDiffVal} Punkte). Auswirkung: Führungswirkung ist steuerbar, wenn Zielarchitektur, Eskalationslogik und Review-Zyklen für ${t.kpiExamples} klar definiert werden.`,
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
    roleDemand: `Impulsiv ${r.impulsiv} – ${r.impulsiv >= 50 ? "direkt, durchsetzungsstark, leistungsorientiert" : r.impulsiv >= 35 ? "situativ konfliktfähig" : "eher moderierend"}`,
    candidatePattern: `Impulsiv ${c.impulsiv} – ${c.impulsiv >= 45 ? "direkt und durchsetzungsstark" : c.impulsiv >= 30 ? "situativ adressierend" : "eher moderierend/vermeidend"}`,
    status: conflictStatus,
    reasoning: conflictStatus === "SUITABLE"
      ? `Impulsiv Soll: ${r.impulsiv} / Ist: ${c.impulsiv} (Δ ${conflictImpDiff} Punkte). Durchsetzungsfähigkeit und Interventionsbereitschaft passen zur Rollenanforderung. Auswirkung: Konflikte werden zeitnah adressiert, Leistungsdifferenzierung im Team bleibt stabil.`
      : conflictStatus === "NOT_SUITABLE"
        ? `Impulsiv Soll: ${r.impulsiv} / Ist: ${c.impulsiv} (Δ ${conflictImpDiff} Punkte). Auswirkung: Unter Zielabweichung wird voraussichtlich moderiert statt interveniert. Leistungsunterschiede im Team werden nicht konsequent adressiert – Qualität und Tempo sinken.`
        : `Impulsiv Soll: ${r.impulsiv} / Ist: ${c.impulsiv} (Δ ${conflictImpDiff} Punkte). Auswirkung: Konfliktfähigkeit ist vorhanden, muss aber in Performance-Situationen konsequent aktiviert werden. Steuerbar durch klare Eskalationsregeln, Entscheidungsfristen und verbindliche Zielarchitektur.`,
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
    roleDemand: compMarket ? `Hoher Marktdruck – Impulsiv ${r.impulsiv} gefordert` : `Marktübliche Dynamik – Impulsiv ${r.impulsiv}`,
    candidatePattern: `Impulsiv ${c.impulsiv} – ${c.impulsiv >= 45 ? "Tempo-/Abschlussorientierung stark" : c.impulsiv >= 30 ? "Tempo anschlussfähig" : "Tempo reduziert"}`,
    status: competitionStatus,
    reasoning: competitionStatus === "SUITABLE"
      ? `Impulsiv Soll: ${r.impulsiv} / Ist: ${c.impulsiv}${compMarket ? " bei hohem Marktdruck" : ""} (Δ ${Math.abs(compImpGap)} Punkte). Tempo und Reaktionsfähigkeit passen zur Rollenlogik. Auswirkung auf ${t.resultMetric}: stabil.`
      : competitionStatus === "NOT_SUITABLE"
        ? `${compMarket ? "Hoher Marktdruck: " : ""}Impulsiv Soll: ${r.impulsiv} / Ist: ${c.impulsiv} (Δ ${Math.abs(compImpGap)} Punkte). Auswirkung: Die impulsive Interventionslogik fehlt – Tempo sinkt, Aufgaben werden stärker geprüft als zügig umgesetzt. ${t.resultMetric} werden strukturell geschwächt.`
        : `Impulsiv Soll: ${r.impulsiv} / Ist: ${c.impulsiv} (Δ ${Math.abs(compImpGap)} Punkte). Auswirkung: ${t.tempoContext} und Durchsetzungsdynamik sind steuerbar, wenn Prioritäten, Entscheidungsfristen und Zielhärte klar etabliert sind. Ohne Steuerung verschiebt sich die Dynamik in Richtung Absicherung.`,
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
    roleDemand: `${r.impulsiv >= 55 ? "Performance-/Ergebnisfokus" : r.intuitiv >= 40 ? "Beziehungs- und Teamorientierung" : "Ausgewogene Kultur"} (I:${r.impulsiv}/N:${r.intuitiv}/A:${r.analytisch})`,
    candidatePattern: `${c.intuitiv >= 45 ? "Beziehungsstabilisierend" : c.impulsiv >= 45 ? "Leistungsorientiert" : "Sach-/strukturorientiert"} (I:${c.impulsiv}/N:${c.intuitiv}/A:${c.analytisch})`,
    status: cultureStatus,
    reasoning: cultureStatus === "SUITABLE"
      ? `Intuitiv Soll: ${r.intuitiv} / Ist: ${c.intuitiv} (Δ ${cultIntDiff} Punkte). Die Kulturwirkung passt zur Rollenanforderung. Auswirkung auf Teamdynamik: Teamstabilität, Motivation und Bindung bleiben stabil, ohne die Rollenlogik zu gefährden.`
      : cultureStatus === "NOT_SUITABLE"
        ? `Impulsiv Soll: ${r.impulsiv} / Ist: ${c.impulsiv}. Die Kulturwirkung verschiebt sich deutlich. Auswirkung auf Teamdynamik: Zielhärte und Leistungsdifferenzierung werden strukturell geschwächt. Die Rolle verlangt Performance-Orientierung, der Kandidat wirkt beziehungsstabilisierend.`
        : `Intuitiv Soll: ${r.intuitiv} / Ist: ${c.intuitiv} (Δ ${cultIntDiff} Punkte). Auswirkung: Es besteht ein Risiko der Kulturverschiebung. Steuerbar, wenn Zielarchitektur, Leistungsdifferenzierung und Zielhärte klar definiert und durchgesetzt werden.`,
  });

  if (tags.sales_cycle === "lang") {
    const stratStatus: FitStatus = c.analytisch >= 35 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "strategy_complexity", areaLabel: "Strategische Komplexität",
      roleDemand: `Langer Zyklus – Analytisch ${r.analytisch} gefordert`,
      candidatePattern: `Analytisch ${c.analytisch} – ${c.analytisch >= 35 ? "stark anschlussfähig" : c.analytisch >= 25 ? "vorhanden" : "gering"}`,
      status: stratStatus,
      reasoning: stratStatus === "SUITABLE"
        ? `Analytisch ${c.analytisch} – bei langen Zyklen ist die analytische Basis für ${t.pipelineTerm}, ${t.forecastTerm} und Prozesssteuerung ausreichend. Auswirkung auf Umsetzungskonstanz: stabil.`
        : stratStatus === "CONDITIONAL"
          ? `Analytisch ${c.analytisch}. Auswirkung: Bei langen strategischen Zyklen muss Strukturdisziplin aktiv gesteuert werden. ${t.pipelineTerm} und ${t.forecastTerm} erfordern systematische Arbeitsweise, die nicht selbstständig aufrechterhalten wird.`
          : `Analytisch ${c.analytisch}. Auswirkung: Für lange strategische Zyklen fehlt die analytische Grundbasis. ${t.pipelineTerm}, ${t.forecastTerm} und Prozessdisziplin sind ohne engmaschige Steuerung instabil.`,
    });
  }

  if (tags.regulation === "hoch") {
    const regStatus: FitStatus = c.analytisch >= 40 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "regulatory_precision", areaLabel: "Regulatorische Präzision",
      roleDemand: `Hohe Regel-/Standardtreue – Analytisch ${r.analytisch}`,
      candidatePattern: `Analytisch ${c.analytisch} – ${c.analytisch >= 40 ? "Sorgfalt/Präzision stark" : c.analytisch >= 25 ? "vorhanden" : "deutlich unter Anforderung"}`,
      status: regStatus,
      reasoning: regStatus === "SUITABLE"
        ? `Analytisch ${c.analytisch}. Die Präzision reicht für regulierte Umfelder aus. Auswirkung: Compliance, Audit-Readiness und Prozessqualität sind stabil aufsetzbar.`
        : regStatus === "CONDITIONAL"
          ? `Analytisch Soll: ${r.analytisch} / Ist: ${c.analytisch}. Auswirkung: In regulierten Umfeldern muss Strukturdisziplin durchgängig sichergestellt werden – klare Standards, Freigabeprozesse und regelmäßige Kontrollen erforderlich. Ohne Steuerung steigt das Risiko für Prozessabweichungen.`
          : `Analytisch Soll: ${r.analytisch} / Ist: ${c.analytisch}. Auswirkung: In regulierten Kontexten kann diese Lücke zu Qualitäts-, Haftungs- oder Audit-Risiken führen. Prozessdisziplin und Standardtreue sind ohne intensive Steuerung nicht gewährleistet.`,
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
        ? `B2C – Abschlussorientierung, Impulsiv ${r.impulsiv}`
        : ct === "B2B"
          ? `B2B – Beziehungsstabilität, Intuitiv ${r.intuitiv}`
          : "Mixed",
      candidatePattern: ct === "B2C"
        ? `Impulsiv ${c.impulsiv} – ${c.impulsiv >= 40 ? "Abschluss stark" : "muss gesteuert werden"}`
        : `Intuitiv ${c.intuitiv} / Analytisch ${c.analytisch} – ${c.intuitiv >= 35 ? "Beziehungsaufbau stark" : "eher transaktional"}`,
      status: custStatus,
      reasoning: custStatus === "SUITABLE"
        ? (ct === "B2C"
          ? `Im B2C-Kontext: Impulsiv ${c.impulsiv}. Abschlussorientierung und Tempo passen zur geforderten Marktdynamik. Auswirkung auf Abschlussquoten: stabil.`
          : ct === "B2B"
            ? `Im B2B-Kontext: Intuitiv ${c.intuitiv} / Analytisch ${c.analytisch}. Beziehungsfähigkeit und wirtschaftliche Steuerung sind anschlussfähig. Auswirkung auf Kundenbindung und ${t.pipelineTerm}: stabil.`
            : "Die Kundenorientierung passt zur geforderten Dynamik.")
        : custStatus === "CONDITIONAL"
          ? (ct === "B2C"
            ? `Im B2C-Kontext: Impulsiv Soll: ${r.impulsiv} / Ist: ${c.impulsiv}. Auswirkung: Die Abschlussorientierung ist vorhanden, muss aber durch klare Ziele, Frequenz und Steuerung aktiviert werden. Ohne Steuerung sinkt die Abschlussquote.`
            : `Im B2B-Kontext: Intuitiv Soll: ${r.intuitiv} / Ist: ${c.intuitiv}. Auswirkung: Beziehungsfähigkeit ist vorhanden, aber die Balance aus Beziehungsstabilität und Ergebnislogik muss aktiv gehalten werden. ${t.pipelineTerm} erfordert Steuerung.`)
          : (ct === "B2C"
            ? `Im B2C-Kontext: Impulsiv Soll: ${r.impulsiv} / Ist: ${c.impulsiv}. Auswirkung: Tempo und Abschlussquote werden voraussichtlich unter dem Rollenbedarf liegen. Die impulsive Marktdynamik fehlt strukturell.`
            : `Im B2B-Kontext: Intuitiv ${c.intuitiv} / Analytisch ${c.analytisch}. Auswirkung: Beziehungstiefe und wirtschaftliche Steuerung fehlen strukturell. ${t.pipelineTerm} und Kundenbindung sind instabil.`),
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
    shortTerm.push(`Die Arbeitslogik passt zur Rollenanforderung ${jobTitle}. Die Person kann sich operativ schnell wirksam zeigen. Auswirkung auf ${t.qualityMetric} und Prozessstabilität: positiv.`);
    midTerm.push("Der Steuerungsaufwand für die Führungskraft bleibt überschaubar. Priorisierungsverhalten und Entscheidungsarchitektur liegen im erwarteten Korridor – Selbststeuerung ist stabil.");
    longTerm.push("Die Rollenwirkung bleibt voraussichtlich konsistent. Es ist nicht davon auszugehen, dass sich Arbeitslogik oder Priorisierungsverhalten schleichend von den Anforderungen entfernen.");
  } else if (engine.overallFit === "CONDITIONAL") {
    if (dualConflict) {
      const c2L = labelComponent(cDom.top2.key);
      shortTerm.push(`Die Person zeigt eine Doppeldominanz: ${labelComponent(cDom.top1.key)} und ${c2L} sind nahezu gleich stark ausgeprägt. Die Rolle ${jobTitle} verlangt jedoch eine klare ${rL}-Steuerungslogik. Operative Irritation ist wahrscheinlich.`);
      midTerm.push(`Die konkurrierenden Arbeitslogiken führen dazu, dass ${rL}-Aufgaben nicht mit voller Konsequenz bearbeitet werden. Auswirkung: Die Person wechselt situativ zwischen ${labelComponent(cDom.top1.key)}- und ${c2L}-Priorisierung – Umsetzungskonstanz und ${t.qualityMetric} schwanken.`);
      longTerm.push(`Ohne klare Steuerung entsteht eine zunehmende Unschärfe in der Rollenausübung. Die geforderte ${rL}-Wirkung wird verwässert – Entscheidungsarchitektur und Prozessstabilität verschieben sich schleichend.`);
    } else {
      shortTerm.push(`Operative Reibung im Bereich „${critical.label}": Die Abweichung zwischen Rollenanforderung und Arbeitslogik der Person zeigt sich hier am deutlichsten. Ein positiver Start ist möglich, erfordert aber klare Steuerung.`);
      if (sameDom) {
        midTerm.push(`Die Arbeitslogik stimmt, jedoch fehlt es an der geforderten Intensität. Auswirkung: Ohne klare Zielarchitektur und Steuerungsintervalle werden Priorisierung und Umsetzungskonstanz zunehmend weicher – Prozessstabilität sinkt.`);
      } else {
        midTerm.push(`Die Arbeitslogik der Person weicht von der Rollenanforderung ab. Auswirkung: Ohne klare Zielarchitektur besteht das Risiko, dass Entscheidungswege, Priorisierung und operative Steuerung nach eigener Logik interpretiert werden. Prozessverschiebung ist wahrscheinlich.`);
      }
      longTerm.push(`Ohne aktive Gegensteuerung verändert sich die Rollenlogik von ${jobTitle} über die Zeit. Anforderungen werden anders priorisiert, der Fokus auf ${t.kpiExamples} verschiebt sich – die strukturelle Wirkung der Position erodiert.`);
    }
  } else {
    if (equalDistConflict) {
      shortTerm.push(`Gleichverteilung (${c.impulsiv}/${c.intuitiv}/${c.analytisch}): Es liegt kein erkennbares Steuerungsprofil vor. Die Rolle ${jobTitle} verlangt klare ${rL}-Arbeitslogik – diese fehlt strukturell. Operative Orientierungslosigkeit bereits in der Einarbeitung.`);
      midTerm.push(`Ohne dominante Steuerungsrichtung fehlt die Basis für konsequente Priorisierung. Die Person reagiert situativ statt systematisch. Auswirkung auf Entscheidungsarchitektur, ${t.qualityMetric} und Prozessstabilität: nicht steuerbar.`);
      longTerm.push(`Die Gleichverteilung verhindert eine stabile Rollenwirkung. Statt ${rL}-gesteuerter Arbeit entsteht eine undefinierte Dynamik ohne erkennbare Steuerungslogik. Auswirkung auf ${t.kpiExamples}, Tempo und Qualität: strukturelle Inkompatibilität.`);
    } else if (dualConflict && !roleKeyInDual) {
      const c2L = labelComponent(cDom.top2.key);
      shortTerm.push(`Doppeldominanz ${labelComponent(cDom.top1.key)}/${c2L} – die geforderte ${rL}-Steuerungslogik der Rolle ${jobTitle} ist in keiner der beiden Stärken vertreten. Operative Reibung bereits in der Einarbeitung.`);
      midTerm.push(`Die Arbeitslogik wird von ${labelComponent(cDom.top1.key)} und ${c2L} bestimmt. Auswirkung: Die für die Rolle zentrale ${rL}-Steuerung fehlt strukturell. Entscheidungsarchitektur, ${t.qualityMetric} und Priorisierung folgen einer fundamental anderen Logik.`);
      longTerm.push(`Die Besetzung verändert die Grundlogik der Position. Statt ${rL}-gesteuerter Arbeit entsteht eine ${labelComponent(cDom.top1.key)}/${c2L}-geprägte Dynamik. Auswirkung auf Prozessstabilität, Tempo und Qualität: strukturelle Inkompatibilität.`);
    } else {
      shortTerm.push(`Bereits in der Einarbeitung ist mit operativer Reibung zu rechnen. Die Arbeitslogik der Person passt nicht zu dem, was die Position ${jobTitle} strukturell erfordert.`);
      midTerm.push(`Die Leistungsstruktur der Rolle wird voraussichtlich verschoben. Auswirkung: Priorisierung, Entscheidungsarchitektur und Steuerungsfähigkeit folgen einer anderen Logik. ${t.qualityMetric} und Prozessstabilität sind gefährdet.`);
      longTerm.push(
        role.leadership?.required
          ? `Die Abweichung betrifft die Kernlogik der Position. Auswirkung: Tempo, ${t.qualityMetric}, ${t.forecastTerm} und Führungswirkung werden dauerhaft nicht die geforderte Wirkung entfalten.`
          : `Die Abweichung betrifft die Kernlogik der Position. Auswirkung: Tempo, ${t.qualityMetric} und ${t.forecastTerm} werden dauerhaft nicht die geforderte Wirkung entfalten.`
      );
    }
  }

  if (critical.id === "conflict") {
    midTerm.push("Auswirkung auf Qualität und Teamdynamik: Die Person wird bei Zielabweichungen eher moderieren statt konsequent intervenieren. Leistungsunterschiede im Team werden nicht klar adressiert.");
    longTerm.push("Die Differenzierung zwischen Stark- und Schwachleistern verliert an Kontur. Prozessstabilität und Ergebnisqualität sinken, weil Korrekturen nicht zeitnah erfolgen.");
  }
  if (critical.id === "decision_logic") {
    midTerm.push("Auswirkung auf Tempo: Entscheidungen werden tendenziell langsamer getroffen. Die Person sichert stärker ab, statt zügig zu handeln. Operative Prozesse verlangsamen sich.");
    longTerm.push(`Unter Zeitdruck oder bei Zielkonflikten sinkt die Reaktionsgeschwindigkeit deutlich. Auswirkung auf ${t.forecastTerm} und Prozessstabilität: Verzögerungen kumulieren sich.`);
  }
  if (critical.id === "kpi_work") {
    midTerm.push(`Auswirkung auf ${t.forecastTerm} und Reporting: Die Disziplin bei ${t.reportingDesc} ist voraussichtlich inkonsistent. Steuerungswirkung der Kennzahlen sinkt.`);
    longTerm.push(`Ohne engmaschige Nachsteuerung sinkt die Transparenz über Zielerreichung und ${t.pipelineTerm}. Auswirkung auf Prozessstabilität: Steuerungslücken werden erst spät sichtbar.`);
  }
  if (critical.id === "leadership_effect") {
    midTerm.push("Auswirkung auf Teamdynamik: Die Führungswirkung weicht vom Anforderungsprofil ab. Das Team bekommt nicht die Steuerungsimpulse, die die Rolle verlangt. Führungsaufwand für die nächste Ebene steigt.");
    longTerm.push(`Ohne klare Eskalationslogik und Zielarchitektur bleibt die Führungseffektivität fragil. Auswirkung auf Prozessstabilität und ${t.qualityMetric}: Delegation und Zielhärte erodieren.`);
  }
  if (critical.id === "competition") {
    midTerm.push(`Auswirkung auf Tempo und ${t.resultMetric}: Tempo und Durchsetzungsdruck werden voraussichtlich gedämpft. Priorisierung verschiebt sich in Richtung Absicherung statt Durchsetzung.`);
    longTerm.push(`In einem dynamischen Umfeld besteht das Risiko, dass Aufgaben reaktiv statt proaktiv bearbeitet werden. Auswirkung auf ${t.resultMetric}: ${t.qualityMetric} kann sich verschlechtern.`);
  }
  if (critical.id === "culture") {
    midTerm.push("Auswirkung auf Teamdynamik: Die kulturelle Wirkung der Person unterscheidet sich von der Rollenanforderung. Priorisierung und Zielhärte im Team verschieben sich.");
    longTerm.push(`Langfristig können Leistungsdifferenzierung und Ergebnisorientierung erodieren. Auswirkung auf ${t.qualityMetric}: Die Teamkultur verschiebt sich in eine nicht gesteuerte Richtung.`);
  }

  if (tags.market_pressure === "hoch")
    longTerm.push(`In einem Hochdruckumfeld wirkt jede Verzögerung direkt auf ${t.resultMetric}. Die beschriebenen Abweichungen in Arbeitslogik und Priorisierungsverhalten verstärken sich unter Druck.`);
  if (tags.regulation === "hoch")
    longTerm.push("In einem regulierten Umfeld können die beschriebenen Abweichungen in der Prozessdisziplin zu Qualitäts-, Haftungs- oder Audit-Risiken führen. Strukturdisziplin muss durchgängig sichergestellt werden.");

  return { shortTerm, midTerm, longTerm };
}

function developmentFromControl(control: ControlIntensity, points: number, criticalLabel: string, t: RoleTerms) {
  if (control === "LOW") return { likelihood: "hoch" as const, timeframe: "3–6 Monate", text: `Steuerungsaufwand für die Führungskraft: gering. Die Arbeitslogik passt zur Rollenanforderung – reguläre Review-Zyklen und Standard-Feedback reichen aus. Auswirkung auf ${t.qualityMetric} und Prozessstabilität: positiv.` };
  if (control === "MEDIUM") return { likelihood: "mittel" as const, timeframe: "6–12 Monate", text: `Steuerungsaufwand: mittel. Gezielte Review-Gespräche und klare Zielarchitektur erforderlich – besonders im Bereich „${criticalLabel}". Ohne aktive Steuerung verschiebt sich das Priorisierungsverhalten. Auswirkung auf ${t.qualityMetric}: steuerbar, aber nicht selbsttragend.` };
  return { likelihood: "gering" as const, timeframe: ">12 Monate", text: `Steuerungsaufwand: hoch. Die Abweichung betrifft die operative Kernlogik der Rolle. Entwicklung erfordert intensive Führungsarbeit und engmaschige Steuerung – besonders im Bereich „${criticalLabel}". Auswirkung auf ${t.qualityMetric} und Prozessstabilität: nur mit dauerhaft hohem Führungsaufwand erreichbar.` };
}

function integrationPlan(role: RoleAnalysis, criticalArea: MatrixAreaId, control: ControlIntensity, t: RoleTerms) {
  const tags = role.environment_tags || {};
  const jobTitle = role.job_title || "diese Position";
  const jobFamily = role.job_family || "";
  const phase_0_30: string[] = [];
  const phase_30_60: string[] = [];
  const phase_60_90: string[] = [];

  phase_0_30.push(`Onboarding ${jobTitle}: Verantwortungsbereich, Entscheidungsbefugnisse, Eskalationslogik und zentrale Kennzahlen (${t.kpiExamples}) schriftlich definieren.`);
  phase_0_30.push(`${t.targetTerm} für die ersten 90 Tage: messbar, terminiert, mit klaren Prioritäten und Steuerungsintervallen.`);
  phase_0_30.push(`Die drei operativ kritischsten Spannungsfelder der Position identifizieren und Steuerungslogik gemeinsam festlegen.`);

  if (criticalArea === "conflict") {
    phase_0_30.push(`Eskalationsregeln für ${jobTitle} definieren: Ab welcher Zielabweichung wird wie und durch wen interveniert. Verbindlich dokumentieren.`);
    phase_30_60.push("Steuerung Konfliktfähigkeit: Leistungsabweichungen im Tagesgeschäft begleiten – Interventionslogik, Gesprächsführung und Nachverfolgung strukturieren.");
    phase_60_90.push(`Prüfung ${t.qualityMetric}: Werden Leistungsprobleme im Team eigenständig, zeitnah und mit konkreter Auswirkung auf Zielerreichung adressiert?`);
  } else if (criticalArea === "decision_logic") {
    phase_0_30.push(`Entscheidungsfristen für ${jobTitle} definieren: z.\u00ADB. 48h bei Zielabweichungen, 24h ${t.escalationExample}. Prozess schriftlich fixieren.`);
    phase_30_60.push(`Steuerung Entscheidungstempo: Werden Entscheidungen im geforderten Rhythmus getroffen oder wird übermäßig abgesichert? Auswirkung auf ${t.tempoContext} messen.`);
    phase_60_90.push(`Prüfung: Hält der Entscheidungsrhythmus dem ${t.tempoContext} und der Anforderung an ${t.forecastTerm} stand?`);
  } else if (criticalArea === "kpi_work") {
    phase_0_30.push(`Reporting-Standards für ${jobTitle} definieren: Welche Kennzahlen (${t.kpiExamples}), in welchem Zyklus, in welcher Qualität. ${t.forecastTerm} und Datenpflege als Anforderung dokumentieren.`);
    phase_30_60.push(`Steuerung Reporting-Disziplin: Werden Kennzahlen (${t.kpiExamples}) vollständig, termingerecht und ohne Nachfragen geliefert? ${t.forecastTerm} prüfen.`);
    phase_60_90.push(`Prüfung: Ist die Transparenz über Zielerreichung, ${t.pipelineTerm} und Prozesssteuerung stabil und verlässlich?`);
  } else if (criticalArea === "leadership_effect") {
    phase_0_30.push(`Führungsanforderung für ${jobTitle} dokumentieren: Zielarchitektur, Delegationslogik, Eskalationsverhalten und Review-Zyklen für ${t.kpiExamples} definieren.`);
    phase_30_60.push("Steuerung Führungswirkung: Setzt die Person die richtigen Prioritäten? Gibt sie klare, ergebnisorientierte Rückmeldungen? Auswirkung auf Teamdynamik beobachten.");
    phase_60_90.push(`Prüfung ${t.qualityMetric}: Hat das Team klare Richtung, stabile Priorisierung und messbare Zielarchitektur?`);
  } else if (criticalArea === "competition") {
    phase_0_30.push(`${t.targetTerm} für ${jobTitle} festlegen: ${t.competitionMetrics}. Messbar und terminiert.`);
    phase_30_60.push(`Steuerung Wettbewerbsdynamik: Werden Aufgaben proaktiv angegangen oder abwartend bearbeitet? ${t.resultMetric} und Tempo messen.`);
    phase_60_90.push(`Prüfung: Agiert die Person proaktiv? Sind ${t.resultMetric} und ${t.pipelineTerm} im Zielkorridor?`);
  } else if (criticalArea === "culture") {
    phase_0_30.push(`Kultur-Erwartungen an ${jobTitle} definieren: Welche Leistungsorientierung, welche Teamdynamik, welche Ergebnisorientierung wird erwartet.`);
    phase_30_60.push("Steuerung Kulturwirkung: Passt die Wirkung der Person zur geforderten Leistungs- und Ergebniskultur? Teamdynamik beobachten.");
    phase_60_90.push(`Prüfung ${t.qualityMetric}: Bleibt die Leistungskultur stabil oder verschiebt sich die Teamdynamik in eine nicht gesteuerte Richtung?`);
  } else {
    phase_30_60.push(`Operative Spannungsfelder der Position ${jobTitle} aktiv steuern: Klare Priorisierung, Zielarchitektur und regelmäßige Review-Zyklen.`);
    phase_60_90.push(`Prüfung ${t.qualityMetric}: Zeigt die Person die geforderte Wirkung in Tempo, Zielhärte und ${t.qualityMetric}?`);
  }

  if (tags.market_pressure === "hoch") {
    phase_0_30.push(`Schnelle Entscheidungswege für ${jobTitle} definieren: Wer gibt was frei, wie wird eskaliert.`);
    phase_30_60.push("Reaktionsgeschwindigkeit im Tagesgeschäft messen: Wie schnell wird auf Abweichungen reagiert?");
  }
  if (tags.regulation === "hoch") {
    phase_0_30.push("Qualitäts- und Regelwerksstandards als verbindliche Anforderungen dokumentieren.");
    phase_30_60.push("Qualitätsprüfungen in Routine überführen.");
  }

  if (control === "HIGH") {
    phase_0_30.push(`Wöchentliches Steuerungsgespräch zwischen ${jobTitle} und direkter Führungskraft. Review von ${t.kpiExamples} und Zielabgleich als fester Prozess.`);
    phase_30_60.push(`Gezielte operative Steuerung auf dem kritischen Verhalten: Entscheidungsarchitektur, Interventionslogik oder Dokumentationsdisziplin – je nach Schwachstelle. Fortschritt anhand ${t.kpiExamples} messen.`);
    phase_60_90.push(`Klare Go/No-Go-Entscheidung: Erfüllt die Person die Kernanforderungen der Position? Ergebnis anhand messbarer Kriterien (${t.kpiExamples}) bewerten.`);
  }

  phase_60_90.push(
    role.leadership?.required
      ? `90-Tage-Review: Strukturelle Passung zur Rolle ${jobTitle} bewerten. Ergebnis dokumentieren – ${t.kpiExamples}, Prozessqualität und Führungswirkung als Entscheidungsbasis.`
      : `90-Tage-Review: Strukturelle Passung zur Rolle ${jobTitle} bewerten. Ergebnis dokumentieren – ${t.kpiExamples} und Prozessqualität als Entscheidungsbasis.`
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
  const candEqualDist = candDom.mode === "BAL_FULL";
  const candDualDominance = !candEqualDist && candDom.gap1 <= 5;
  const roleClearDominance = roleDom.gap1 >= 15;
  const dualConflict = candDualDominance && roleClearDominance;
  const equalDistConflict = candEqualDist && roleClearDominance;
  const roleKeyInDual = dualConflict && (candDom.top1.key === roleDom.top1.key || candDom.top2.key === roleDom.top1.key);
  let overallFit: FitStatus = ko ? "NOT_SUITABLE" : overallFitFromScore(mismatch, sameDom);
  if (equalDistConflict && !ko) {
    overallFit = "NOT_SUITABLE";
  } else if (dualConflict && !ko) {
    if (roleKeyInDual) {
      if (overallFit === "SUITABLE") overallFit = "CONDITIONAL";
    } else {
      overallFit = "NOT_SUITABLE";
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

  const candName = cand.candidate_name || "Kandidat";
  const jobTitle = role.job_title || "diese Position";
  const competingL = dualConflict ? labelComponent(candDom.top1.key === roleDom.top1.key ? candDom.top2.key : candDom.top1.key) : "";

  const keyReason = (() => {
    if (equalDistConflict) {
      return `${candName} zeigt eine Gleichverteilung aller drei Komponenten (${c.impulsiv}/${c.intuitiv}/${c.analytisch}). Es liegt kein erkennbares Steuerungsprofil vor. Die Rolle ${jobTitle} verlangt eine klare ${rL}-Arbeitslogik (Soll: ${r[roleDom.top1.key]}). Ohne dominante Steuerungsrichtung fehlt die strukturelle Basis für zielgerichtete Priorisierung, Entscheidungsarchitektur und ${t.qualityMetric}.`;
    }
    if (dualConflict && roleKeyInDual) {
      return `${candName} bringt die geforderte ${rL}-Steuerungslogik grundsätzlich mit, allerdings konkurriert sie mit einer gleich starken ${competingL}-Prägung. Die Rolle ${jobTitle} verlangt eine klare ${rL}-Ausrichtung – diese Eindeutigkeit fehlt. Auswirkung auf Priorisierungsverhalten und ${t.qualityMetric}: instabil.`;
    }
    if (dualConflict && !roleKeyInDual) {
      return `${candName} arbeitet vorrangig ${labelComponent(candDom.top1.key)}-/${labelComponent(candDom.top2.key)}-geprägt. Die für ${jobTitle} entscheidende ${rL}-Steuerungslogik fehlt strukturell. Auswirkung auf Entscheidungsarchitektur, Priorisierung und Prozessstabilität: kritisch.`;
    }
    if (overallFit === "SUITABLE") {
      return `${candName} passt zur Rollenanforderung ${jobTitle}. Die geforderte ${rL}-Arbeitslogik wird stabil abgebildet (Soll: ${r[roleDom.top1.key]} / Ist: ${c[roleDom.top1.key]}). Kritischster Bereich: „${critical.label}" – dort ist die Passung am engsten.`;
    }
    if (sameDom && overallFit === "CONDITIONAL") {
      return `${candName} arbeitet grundsätzlich ${rL}-orientiert (Soll: ${r[roleDom.top1.key]} / Ist: ${c[roleDom.top1.key]}, Δ ${mainDiff} Punkte). Die Intensität liegt unter der Rollenanforderung – besonders im Bereich „${critical.label}". Auswirkung auf Prozessstabilität: steuerbar, aber nicht selbsttragend.`;
    }
    if (overallFit === "CONDITIONAL") {
      return `${candName} bringt eine andere Steuerungslogik mit als ${jobTitle} erfordert (Rolle: ${rL} / Kandidat: ${cL}). Eine Besetzung ist möglich, erfordert aber klare Zielarchitektur und Steuerung – besonders im Bereich „${critical.label}".`;
    }
    return `${candName} passt nicht zur Kernlogik der Rolle ${jobTitle}. Die geforderte ${rL}-Arbeitslogik wird nicht abgebildet (Soll: ${r[roleDom.top1.key]} / Ist: ${c[roleDom.top1.key]}, Δ ${mainDiff} Punkte). Besonders kritisch: „${critical.label}".`;
  })();

  const execSummary = (() => {
    const intro = `Rolle: ${jobTitle} | ${candName}`;
    const fitLine = `Gesamteinstufung: ${statusLabel(overallFit)} · Steuerungsaufwand: ${controlLabel(ctrl.level)}`;
    const profileLine = `Soll-Profil: ${r.impulsiv}/${r.intuitiv}/${r.analytisch} · Ist-Profil: ${c.impulsiv}/${c.intuitiv}/${c.analytisch}`;
    let domLine: string;
    if (equalDistConflict) {
      domLine = `Gleichverteilung: ${c.impulsiv}/${c.intuitiv}/${c.analytisch} – kein erkennbares Steuerungsprofil. Die Rolle verlangt klare ${rL}-Arbeitslogik (${r[roleDom.top1.key]}). Strukturelle Basis für Priorisierung und Entscheidungsarchitektur fehlt.`;
    } else if (dualConflict) {
      domLine = `Doppeldominanz: ${labelComponent(candDom.top1.key)}/${labelComponent(candDom.top2.key)} – die Rolle verlangt klare ${rL}-Steuerungslogik. Auswirkung auf Priorisierung und Entscheidungsarchitektur: instabil.`;
    } else if (sameDom) {
      domLine = `Beide Profile sind ${rL}-geprägt (Δ ${mainDiff} Punkte). Arbeitslogik und Priorisierungsverhalten stimmen in der Grundrichtung überein.`;
    } else {
      domLine = `Die Rolle erfordert ${rL}-gesteuerte Arbeitslogik. ${candName} arbeitet ${cL}-geprägt. Auswirkung auf Entscheidungsarchitektur und Priorisierung: Steuerung erforderlich.`;
    }
    return [intro, fitLine, profileLine, domLine].join("\n");
  })();

  const secondaryTension = (() => {
    if (!sameDom || equalDistConflict || dualConflict) return null;
    const rSec = roleDom.top2.key;
    const cSec = candDom.top2.key;
    if (rSec === cSec) return null;
    const rSecVal = r[rSec];
    const cSecVal = c[rSec];
    const secDiff = Math.abs(rSecVal - cSecVal);
    if (secDiff < 5) return null;

    const secDescriptions: Record<ComponentKey, { label: string; focus: string; stressBehavior: string }> = {
      impulsiv: { label: "Impulsiv", focus: "Umsetzungsdruck und Ergebnisverantwortung", stressBehavior: "Durchsetzung und schnelle Entscheidungen" },
      intuitiv: { label: "Intuitiv", focus: "Beziehungsorientierung und Teamdynamik", stressBehavior: "Abstimmung, Konsens und zwischenmenschliche Klärung" },
      analytisch: { label: "Analytisch", focus: "Sachbezogenheit und fachliche Präzision", stressBehavior: "Datenprüfung, Absicherung und strukturelle Klärung" },
    };

    const roleSecDesc = secDescriptions[rSec];
    const candSecDesc = secDescriptions[cSec];

    const text = `Die Primärdominanz stimmt überein (${rL}). Die Zweitstärke der Rolle ist ${roleSecDesc.label} (${roleSecDesc.focus}, Soll: ${rSecVal}), der Kandidat bringt jedoch ${candSecDesc.label} als Zweitstärke mit (${candSecDesc.focus}, Ist: ${c[cSec]}). Auswirkung: In Standardsituationen unauffällig – unter Druck verlagert sich die Steuerung in Richtung ${candSecDesc.stressBehavior} statt ${roleSecDesc.stressBehavior}.`;

    const stressText = `Spannungsfeld unter Stress: Die Rolle erwartet in kritischen Situationen ${roleSecDesc.stressBehavior}. Der Kandidat wird stattdessen auf ${candSecDesc.stressBehavior} zurückgreifen. Auswirkung auf Teamdynamik und Prozesssteuerung: situativ spürbar.`;

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
