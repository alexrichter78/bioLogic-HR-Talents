export type ComponentKey = "impulsiv" | "intuitiv" | "analytisch";
export type FitStatus = "SUITABLE" | "CONDITIONAL" | "NOT_SUITABLE";
export type ControlIntensity = "LOW" | "MEDIUM" | "HIGH";

export type Triad = Record<ComponentKey, number>;

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
  keyReason: string;
  executiveSummary: string;
  coreFinding: string;
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

  if ((roleDom.mode === "EXTREME_I" && c.impulsiv <= 35 && r.impulsiv >= 65) ||
      (roleDom.mode === "EXTREME_N" && c.intuitiv <= 30 && r.intuitiv >= 55) ||
      (roleDom.mode === "EXTREME_A" && c.analytisch <= 35 && r.analytisch >= 65)) return true;

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

function overallFitFromScore(mismatch: number): FitStatus {
  if (mismatch <= 10) return "SUITABLE";
  if (mismatch <= 18) return "CONDITIONAL";
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

function buildMatrix(role: RoleAnalysis, cand: CandidateInput): MatrixRow[] {
  const r = normalizeTriad(role.role_profile);
  const c = normalizeTriad(cand.candidate_profile);
  const rDom = dominanceModeOf(r);
  const cDom = dominanceModeOf(c);
  const rows: MatrixRow[] = [];

  const dominanceStatus: FitStatus = (() => {
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

  rows.push({
    areaId: "dominance", areaLabel: "Dominanzstruktur",
    roleDemand: dominanceLabel(rDom), candidatePattern: dominanceLabel(cDom),
    status: dominanceStatus,
    reasoning: dominanceStatus === "SUITABLE"
      ? "Die dominante Steuerungslogik ist kompatibel. Die Rolle wird in ihrer Kernwirkung stabil abgebildet."
      : dominanceStatus === "CONDITIONAL"
        ? "Es gibt eine erkennbare Verschiebung in der Dominanzlogik. Passung möglich mit klarer Rahmensetzung und Monitoring."
        : "Die dominante Kernlogik der Rolle wird durch die Kandidatenstruktur strukturell verschoben. Das betrifft die zentrale Wirkweise der Position.",
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
      ? "Die Entscheidungslogik des Kandidaten trifft die Kernanforderung der Rolle. Entscheidungen werden voraussichtlich im passenden Rhythmus getroffen."
      : decisionStatus === "CONDITIONAL"
        ? "Die Entscheidungslogik weicht in Teilen ab. Entscheidend ist, ob Entscheidungsfristen, Eskalationsregeln und Verbindlichkeit klar gesetzt werden."
        : "Die Rolle verlangt schnelle Durchsetzung bei Zielabweichung. Das Profil priorisiert Stabilität/Abstimmung, wodurch Interventionen verzögert werden können.",
  });

  const kpiStatus: FitStatus = (() => {
    if (r.analytisch < 20) return "SUITABLE";
    if (c.analytisch >= r.analytisch - 5) return "SUITABLE";
    if (c.analytisch >= r.analytisch - 15) return "CONDITIONAL";
    return "NOT_SUITABLE";
  })();

  rows.push({
    areaId: "kpi_work", areaLabel: "KPI-/Arbeitssteuerung",
    roleDemand: "Kennzahlen als Steuerungsinstrument, klare Reporting-Rhythmen",
    candidatePattern: c.analytisch >= 30 ? "Zahlen-/Strukturorientierung gut anschlussfähig"
      : c.analytisch >= 20 ? "Kennzahlen eher als Orientierung, weniger als konsequenter Steuerungshebel"
      : "Geringe analytische Steuerungsbasis, KPI-Disziplin muss stark extern geführt werden",
    status: kpiStatus,
    reasoning: kpiStatus === "SUITABLE"
      ? "Die notwendige analytische Basis ist vorhanden. KPI-Führung und Prozessdisziplin sind stabil aufsetzbar."
      : kpiStatus === "CONDITIONAL"
        ? "KPI-Disziplin ist umsetzbar, aber nicht zwingend aus der natürlichen Dominanz. Erfordert feste Routinen, klare Standards und konsequentes Nachhalten."
        : "Die analytische Basis ist deutlich unter dem Rollenbedarf. Reporting-Qualität und Prozessdisziplin werden ohne engmaschige Steuerung voraussichtlich instabil.",
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

    rows.push({
      areaId: "leadership_effect", areaLabel: "Führungswirkung",
      roleDemand: lp ? `${lp.impulsiv}% Impulsiv / ${lp.intuitiv}% Intuitiv / ${lp.analytisch}% Analytisch (Führungskontext)` : "Führung erforderlich (Profil nicht hinterlegt)",
      candidatePattern: `${c.impulsiv}% Impulsiv / ${c.intuitiv}% Intuitiv / ${c.analytisch}% Analytisch`,
      status: leadershipStatus,
      reasoning: leadershipStatus === "SUITABLE"
        ? "Das Führungsprofil des Kandidaten passt zur geforderten Führungslogik. Führungswirkung wird voraussichtlich stabil entfaltet."
        : leadershipStatus === "NOT_SUITABLE"
          ? "Die Rolle verlangt klare Ergebnisdominanz in der Führung. Das Profil ist hierfür strukturell zu wenig interventionsstark."
          : "Führung ist möglich, jedoch nur stabil, wenn Erwartungshaltung, Zielarchitektur und Eskalationslogik eindeutig gesetzt sind.",
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

  rows.push({
    areaId: "conflict", areaLabel: "Konfliktfähigkeit",
    roleDemand: r.impulsiv >= 50 ? "Direkt, klar, leistungs- und zielorientiert" : r.impulsiv >= 35 ? "Situativ konfliktfähig" : "Eher moderierend, deeskalierend",
    candidatePattern: c.impulsiv >= 45 ? "Konflikte werden eher direkt geführt" : c.impulsiv >= 30 ? "Konflikte werden situativ adressiert" : "Konflikte werden eher moderiert/vermieden",
    status: conflictStatus,
    reasoning: conflictStatus === "SUITABLE"
      ? "Die Konfliktfähigkeit des Kandidaten entspricht der Rollenanforderung. Durchsetzung und Interventionsstärke sind anschlussfähig."
      : conflictStatus === "NOT_SUITABLE"
        ? "Unter Zielabweichung wird wahrscheinlich zu viel moderiert statt konsequent entschieden. Low-Performance kann zu lange im System bleiben."
        : "Konfliktfähigkeit ist grundsätzlich vorhanden, muss aber in Performance-Situationen konsequent aktiviert werden (Eskalationsregeln, klare Fristen, Review-Routinen).",
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

  rows.push({
    areaId: "competition", areaLabel: "Wettbewerbsdynamik",
    roleDemand: tags.market_pressure === "hoch" ? "Hoher Marktdruck: Tempo & Abschlussdominanz" : "Normale Marktdynamik",
    candidatePattern: c.impulsiv >= 45 ? "Tempo-/Abschlussorientierung gut"
      : c.impulsiv >= 30 ? "Tempo anschlussfähig, Abschlussorientierung muss gesteuert werden"
      : "Tempo eher zugunsten Stabilität/Abstimmung reduziert",
    status: competitionStatus,
    reasoning: competitionStatus === "SUITABLE"
      ? "Die Wettbewerbsdynamik wird durch das Kandidatenprofil stabil abgebildet. Tempo und Marktreaktion passen zur Rollenlogik."
      : competitionStatus === "NOT_SUITABLE"
        ? "In einem Hochdruckumfeld ist eine impulsive Interventionslogik zentral. Das Profil verschiebt die Dynamik in Richtung Stabilisierung."
        : "Die Dynamik ist steuerbar, wenn Prioritäten, Zielhärte und schnelle Maßnahmenwege klar etabliert sind.",
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

  rows.push({
    areaId: "culture", areaLabel: "Kulturwirkung",
    roleDemand: r.impulsiv >= 55 ? "Performance-/Ergebnisfokus" : r.intuitiv >= 40 ? "Beziehungs- und Teamorientierung" : "Ausgewogene Kultur",
    candidatePattern: c.intuitiv >= 45 ? "Beziehungsstabilisierend, motivationsorientiert"
      : c.impulsiv >= 45 ? "Leistungs- und ergebnisorientiert"
      : "Eher sach-/strukturorientiert",
    status: cultureStatus,
    reasoning: cultureStatus === "SUITABLE"
      ? "Das Profil kann Teamstabilität, Motivation und Bindung stärken – ohne die Rollenlogik zu gefährden."
      : "Es besteht ein Risiko der Kulturverschiebung (Zielhärte/Leistungsdifferenzierung). Das ist nur tragfähig, wenn Leistungsarchitektur klar bleibt.",
  });

  if (tags.sales_cycle === "lang") {
    const stratStatus: FitStatus = c.analytisch >= 35 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "strategy_complexity", areaLabel: "Strategische Komplexität",
      roleDemand: "Langer Zyklus: Priorisierung, Geduld, strukturierte Marktbearbeitung",
      candidatePattern: c.analytisch >= 35 ? "Struktur und Planung stark anschlussfähig" : c.analytisch >= 25 ? "Struktur vorhanden, muss aber gesteuert werden" : "Mehr situativ als systematisch",
      status: stratStatus,
      reasoning: stratStatus === "SUITABLE"
        ? "Die analytische Basis für strategische Zyklen ist ausreichend. Pipeline-Qualität und Prozessdisziplin sind aufsetzbar."
        : stratStatus === "CONDITIONAL"
          ? "Bei langen Zyklen wird Struktur wichtiger. Entscheidend ist, ob der Kandidat systematisch arbeitet."
          : "Für lange strategische Zyklen fehlt die analytische Grundbasis. Hohe Gefahr von Inkonsistenz in Pipeline und Forecast.",
    });
  }

  if (tags.regulation === "hoch") {
    const regStatus: FitStatus = c.analytisch >= 40 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "regulatory_precision", areaLabel: "Regulatorische Präzision",
      roleDemand: "Hohe Regel-/Standardtreue erforderlich",
      candidatePattern: c.analytisch >= 40 ? "Sorgfalt/Präzision stark" : c.analytisch >= 25 ? "Präzision vorhanden, muss gerahmt werden" : "Präzision deutlich unter Anforderung",
      status: regStatus,
      reasoning: regStatus === "SUITABLE"
        ? "Die analytische Präzision reicht für regulierte Umfelder aus. Compliance und Audit-Readiness sind stabil aufsetzbar."
        : regStatus === "CONDITIONAL"
          ? "In regulierten Umfeldern muss Präzision stabil sein. Erfordert klare Standards, Freigabeprozesse und Kontrollen."
          : "In regulierten Kontexten kann fehlende Präzision zu Qualitäts-, Haftungs- oder Audit-Risiken führen.",
    });
  }

  if (tags.customer_type) {
    const custStatus: FitStatus = (() => {
      if (tags.customer_type === "B2C") {
        if (c.impulsiv >= 40) return "SUITABLE";
        if (c.impulsiv >= 25) return "CONDITIONAL";
        return "NOT_SUITABLE";
      }
      if (tags.customer_type === "B2B") {
        if (c.intuitiv >= 35 && c.analytisch >= 25) return "SUITABLE";
        if (c.intuitiv >= 25) return "CONDITIONAL";
        return "NOT_SUITABLE";
      }
      return "SUITABLE";
    })();
    rows.push({
      areaId: "customer_orientation", areaLabel: "Kundenorientierung",
      roleDemand: tags.customer_type === "B2C"
        ? "Hohe Frequenz, klare Abschlussorientierung, schnelle Reaktion"
        : tags.customer_type === "B2B"
          ? "Beziehungsstabilität + wirtschaftliche Steuerung"
          : "Situativ",
      candidatePattern: tags.customer_type === "B2C"
        ? (c.impulsiv >= 40 ? "Abschlussorientierung stark" : "Abschlussorientierung muss gesteuert werden")
        : (c.intuitiv >= 35 ? "Beziehungsaufbau stark" : "Eher transaktional"),
      status: custStatus,
      reasoning: custStatus === "SUITABLE"
        ? "Die Kundenorientierung passt zur geforderten Dynamik. Beziehungsfähigkeit und Abschlusslogik sind im Gleichgewicht."
        : custStatus === "CONDITIONAL"
          ? "Kundenorientierung ist grundsätzlich vorhanden; entscheidend ist die Balance aus Beziehungsfähigkeit und Abschluss-/Ergebnislogik im geforderten Setting."
          : "Die Kundenorientierung weicht strukturell von der Rollenanforderung ab. Das betrifft entweder Tempo (B2C) oder Beziehungstiefe (B2B).",
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

function buildRisks(role: RoleAnalysis, engine: { overallFit: FitStatus; control: ControlIntensity; matrix: MatrixRow[] }) {
  const tags = role.environment_tags || {};
  const critical = criticalAreaFromMatrix(engine.matrix).id;
  const shortTerm: string[] = [];
  const midTerm: string[] = [];
  const longTerm: string[] = [];

  if (engine.overallFit === "SUITABLE") {
    shortTerm.push("Schnelle Wirksamkeit durch hohe strukturelle Passung, geringe Reibung im Start.");
    midTerm.push("Stabile Ziel- und Entscheidungslogik bei überschaubarem Steuerungsaufwand.");
    longTerm.push("Rollenwirkung bleibt konsistent, geringe Gefahr von schleichender Systemverschiebung.");
  } else if (engine.overallFit === "CONDITIONAL") {
    shortTerm.push("Positive Startwirkung möglich, jedoch mit klarer Abweichung in einem relevanten Strukturfeld.");
    midTerm.push("Ohne klare Rahmensetzung steigt das Risiko von Unschärfe in Zielhärte und Entscheidungsrhythmus.");
    longTerm.push("Möglichkeit einer schleichenden Systemverschiebung, wenn Steuerungsmechanismen nicht greifen.");
  } else {
    shortTerm.push("Reibung im Start wahrscheinlich, da Kernlogik der Rolle nicht abgebildet wird.");
    midTerm.push("Leistungsarchitektur wird voraussichtlich verschoben.");
    longTerm.push("Hohe Wahrscheinlichkeit von dauerhafter Fehlwirkung.");
  }

  if (critical === "conflict") {
    midTerm.push("Zielabweichungen werden eher moderiert als konsequent korrigiert.");
    longTerm.push("Leistungsdifferenzierung verliert Klarheit.");
  }
  if (critical === "decision_logic") {
    midTerm.push("Entscheidungsfristen verlängern sich, Abweichungen werden eher abgesichert als entschieden.");
    longTerm.push("Reaktionsgeschwindigkeit nimmt ab.");
  }
  if (critical === "kpi_work") {
    midTerm.push("Reporting- und Prozessdisziplin wird inkonsistent.");
    longTerm.push("Forecast-/Transparenzqualität sinkt.");
  }

  if (tags.market_pressure === "hoch")
    longTerm.push("Im Hochdruckmarkt wirkt jede Verzögerung direkt auf Abschlussquote und Umsatzdynamik.");
  if (tags.regulation === "hoch")
    longTerm.push("In regulierten Kontexten kann fehlende Präzision zu Qualitäts- oder Audit-Risiken führen.");

  return { shortTerm, midTerm, longTerm };
}

function developmentFromControl(control: ControlIntensity) {
  if (control === "LOW") return { likelihood: "hoch" as const, timeframe: "3–6 Monate", text: "Die Integration ist weitgehend selbsttragend. Entwicklung erfolgt primär über Routine und Rollenpraxis." };
  if (control === "MEDIUM") return { likelihood: "mittel" as const, timeframe: "6–12 Monate", text: "Entwicklung ist realistisch, erfordert jedoch feste Review-Rhythmen und klare Entscheidungsregeln." };
  return { likelihood: "gering" as const, timeframe: ">12 Monate", text: "Die Abweichung betrifft Kernlogik. Entwicklung nur mit sehr klarer Rahmenarchitektur und engmaschiger Steuerung möglich." };
}

function integrationPlan(role: RoleAnalysis, criticalArea: MatrixAreaId, control: ControlIntensity) {
  const tags = role.environment_tags || {};
  const phase_0_30: string[] = [];
  const phase_30_60: string[] = [];
  const phase_60_90: string[] = [];

  phase_0_30.push("Entscheidungsbefugnisse, Zielarchitektur und Verantwortungsgrenzen schriftlich klären.");
  phase_0_30.push("Fixe KPI-/Review-Rhythmen setzen (z.\u00ADB. wöchentlich Pipeline/Performance, monatlich Forecast).");
  phase_0_30.push("Top-3 Spannungsfelder der Rolle offen benennen und als Steuerungsfokus definieren.");

  if (criticalArea === "conflict") {
    phase_0_30.push("Eskalationsregeln definieren: ab welcher Abweichung wird wie interveniert.");
    phase_30_60.push("Konfliktführung in realen Fällen strukturieren: Vorbereitung, Gesprächsleitfaden, Nachhalten.");
    phase_60_90.push("Validierung: Werden Low-Performance-Themen zeitnah adressiert?");
  } else if (criticalArea === "decision_logic") {
    phase_0_30.push("Entscheidungsfristen festlegen (z.\u00ADB. 48h bei Zielabweichung).");
    phase_30_60.push("Entscheidungsqualität prüfen: Geschwindigkeit vs. Absicherung.");
    phase_60_90.push("Validierung: Bleibt der Entscheidungsrhythmus marktkonform?");
  } else if (criticalArea === "kpi_work") {
    phase_0_30.push("Reporting-Standard definieren (CRM-Disziplin, Pipeline-Definition, Forecast-Regeln).");
    phase_30_60.push("KPI-Nachhalten auditieren: Vollständigkeit, Aktualität, Konsequenz.");
    phase_60_90.push("Validierung: Stabilität der Transparenz und Forecast-Güte.");
  } else {
    phase_30_60.push("Spannungsfelder aktiv steuern: Priorisierung, Maßnahmenlogik, klare Review-Entscheidungen.");
    phase_60_90.push("Validierung: Systemwirkung prüfen (Tempo, Zielhärte, Prozessqualität, Teamdynamik).");
  }

  if (tags.market_pressure === "hoch") {
    phase_0_30.push("Schnelle Maßnahmenwege definieren (Aktionen, Freigaben, Eskalationspfade).");
    phase_30_60.push("Reaktionsgeschwindigkeit messen: Zeit von Abweichung → Entscheidung → Maßnahme.");
  }
  if (tags.regulation === "hoch") {
    phase_0_30.push("Compliance-/Qualitätsstandards als Muss-Kriterien dokumentieren.");
    phase_30_60.push("Qualitätsprüfungen in Routine überführen.");
  }

  if (control === "HIGH") {
    phase_0_30.push("Management-Sponsoring festlegen: wöchentliches Steering im ersten Monat.");
    phase_30_60.push("Enges Coaching auf kritischem Verhalten (Entscheidung, Konflikt, KPI-Disziplin).");
    phase_60_90.push("Go/No-Go-Kriterien definieren.");
  }

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
  const overallFit: FitStatus = ko ? "NOT_SUITABLE" : overallFitFromScore(mismatch);
  const ctrl = calcControlIntensity(role, cand);
  const matrix = buildMatrix(role, cand);
  const critical = criticalAreaFromMatrix(matrix);

  const keyReason = (() => {
    const domShift = roleDom.mode.startsWith("DUAL") || candDom.mode.startsWith("DUAL")
      ? `Dominanzlogik (Rolle: ${dominanceLabel(roleDom)} vs. Kandidat: ${dominanceLabel(candDom)})`
      : `Dominanzverschiebung ${labelComponent(roleDom.top1.key)} → ${labelComponent(candDom.top1.key)}`;
    return `${domShift}; kritisch: ${critical.label}; Steuerungsintensität: ${controlLabel(ctrl.level)}`;
  })();

  const execSummary = (() => {
    const name = cand.candidate_name ? ` (${cand.candidate_name})` : "";
    const intro = `Rolle: ${role.job_title} | Kandidat${name}`;
    const fitLine = `Gesamteinstufung: ${statusLabel(overallFit)} · Steuerungsintensität: ${controlLabel(ctrl.level)}`;
    const domLine = `Rollenlogik: ${dominanceLabel(roleDom)} · Kandidatenlogik: ${dominanceLabel(candDom)}`;
    const reasonLine = overallFit === "SUITABLE"
      ? `Die Kernlogik der Rolle wird strukturell stabil getroffen. Kritischer Bereich: ${critical.label}.`
      : overallFit === "CONDITIONAL"
        ? `Die Passung ist grundsätzlich vorhanden, jedoch mit relevanter Abweichung. Kritischer Bereich: ${critical.label}.`
        : `Die Kernlogik der Rolle wird durch das Kandidatenprofil voraussichtlich verschoben. Kritischer Bereich: ${critical.label}.`;
    return [intro, fitLine, domLine, reasonLine].join("\n");
  })();

  const coreFinding = (() => {
    if (overallFit === "SUITABLE")
      return `Die strukturelle Grundpassung ist hoch. Die dominanten Anforderungen der Rolle werden durch die Persönlichkeitsstruktur des Kandidaten abgebildet.`;
    if (overallFit === "CONDITIONAL")
      return `Die strukturelle Passung ist grundsätzlich gegeben, jedoch nicht selbststabilisierend. Die Abweichung liegt im Bereich „${critical.label}". Ohne klare Entscheidungsregeln und verbindliche KPI-Führung besteht das Risiko einer schleichenden Verschiebung der Rollenwirkung.`;
    return `Die strukturelle Passung ist niedrig. Die Abweichung betrifft die Kernlogik der Rolle und zeigt sich besonders im Bereich „${critical.label}". Eine Besetzung würde voraussichtlich die Leistungsarchitektur der Rolle verändern.`;
  })();

  const risks = buildRisks(role, { overallFit, control: ctrl.level, matrix });
  const dev = developmentFromControl(ctrl.level);
  const plan = integrationPlan(role, critical.id, ctrl.level);

  return {
    roleDominance: roleDom, candDominance: candDom,
    overallFit, mismatchScore: mismatch, koTriggered: ko,
    controlIntensity: ctrl.level, controlPoints: ctrl.points,
    criticalArea: critical.id, criticalAreaLabel: critical.label,
    keyReason, executiveSummary: execSummary, coreFinding,
    matrix, risks, development: dev, integrationPlan90: plan,
  };
}
