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

  const sameDominant = rDom.top1.key === cDom.top1.key;
  const domDiff = Math.abs(r[rDom.top1.key] - c[rDom.top1.key]);
  const rLabel = labelComponent(rDom.top1.key);
  const cLabel = labelComponent(cDom.top1.key);

  rows.push({
    areaId: "dominance", areaLabel: "Dominanzstruktur",
    roleDemand: dominanceLabel(rDom), candidatePattern: dominanceLabel(cDom),
    status: dominanceStatus,
    reasoning: dominanceStatus === "SUITABLE"
      ? `Beide Profile sind ${rLabel}-dominant. Die Abweichung beträgt nur ${domDiff} Prozentpunkte (Soll: ${r[rDom.top1.key]}% / Ist: ${c[rDom.top1.key]}%). Die Rolle wird in ihrer Kernwirkung stabil abgebildet.`
      : dominanceStatus === "CONDITIONAL"
        ? (sameDominant
          ? `Beide Profile sind ${rLabel}-dominant, jedoch unterscheidet sich die Intensität um ${domDiff} Prozentpunkte (Soll: ${r[rDom.top1.key]}% / Ist: ${c[rDom.top1.key]}%). Die Kernlogik bleibt erhalten, die Ausprägungsstärke weicht ab. Klare Rahmensetzung empfohlen.`
          : `Die Dominanz verschiebt sich von ${rLabel} (${r[rDom.top1.key]}%) zu ${cLabel} (${c[cDom.top1.key]}%). Die Abweichung in der Rollenkomponente beträgt ${domDiff} Punkte. Passung möglich mit Monitoring und klarer Zielarchitektur.`)
        : `Die Dominanz verschiebt sich fundamental von ${rLabel} (${r[rDom.top1.key]}%) zu ${cLabel} (${c[cDom.top1.key]}%). Bei einem Rollengap von ${rDom.gap1} Punkten ist die strukturelle Kernlogik der Position nicht mehr abgebildet.`,
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
      ? `Die Rolle verlangt ${decRoleDesc} – der Kandidat entscheidet ${decCandDesc}. Die Entscheidungslogik passt zur Kernanforderung (${rLabel} Soll: ${r[rDom.top1.key]}% / Ist: ${c[rDom.top1.key]}%).`
      : decisionStatus === "CONDITIONAL"
        ? (sameDominant
          ? `Gleiche Entscheidungslogik (${rLabel}), aber die Intensität weicht um ${decMainDiff} Punkte ab (Soll: ${r[rDom.top1.key]}% / Ist: ${c[rDom.top1.key]}%). Entscheidungsfristen, Eskalationsregeln und Verbindlichkeit sollten klar gesetzt werden.`
          : `Die Rolle verlangt ${decRoleDesc} (${rLabel} ${r[rDom.top1.key]}%), der Kandidat entscheidet ${decCandDesc} (${cLabel} ${c[cDom.top1.key]}%). Abweichung: ${decMainDiff} Punkte. Klare Entscheidungsfristen und Eskalationsregeln empfohlen.`)
        : `Die Rolle verlangt ${decRoleDesc} (${rLabel} ${r[rDom.top1.key]}%), der Kandidat ist ${decCandDesc} (${cLabel} ${c[cDom.top1.key]}%). Die Abweichung von ${decMainDiff} Punkten bedeutet, dass Interventionen strukturell verzögert werden können.`,
  });

  const kpiStatus: FitStatus = (() => {
    if (r.analytisch < 20) return "SUITABLE";
    if (c.analytisch >= r.analytisch - 5) return "SUITABLE";
    if (c.analytisch >= r.analytisch - 15) return "CONDITIONAL";
    return "NOT_SUITABLE";
  })();

  const kpiDiff = r.analytisch - c.analytisch;

  rows.push({
    areaId: "kpi_work", areaLabel: "KPI-/Arbeitssteuerung",
    roleDemand: `Analytisch ${r.analytisch}% – Kennzahlen als Steuerungsinstrument`,
    candidatePattern: `Analytisch ${c.analytisch}% – ${c.analytisch >= 30 ? "Zahlen-/Strukturorientierung anschlussfähig" : c.analytisch >= 20 ? "Kennzahlen eher als Orientierung" : "Geringe analytische Steuerungsbasis"}`,
    status: kpiStatus,
    reasoning: kpiStatus === "SUITABLE"
      ? `Der Kandidat bringt ${c.analytisch}% Analytisch mit (Rolle: ${r.analytisch}%). Die analytische Basis ist vorhanden, KPI-Führung und Prozessdisziplin sind stabil aufsetzbar.`
      : kpiStatus === "CONDITIONAL"
        ? `Die Rolle verlangt ${r.analytisch}% Analytisch, der Kandidat bringt ${c.analytisch}% mit (Δ ${kpiDiff} Punkte). KPI-Disziplin ist umsetzbar, erfordert aber feste Routinen, klare Standards und konsequentes Nachhalten.`
        : `Die Rolle verlangt ${r.analytisch}% Analytisch, der Kandidat liegt bei ${c.analytisch}% (Δ ${kpiDiff} Punkte). Reporting-Qualität und Prozessdisziplin werden ohne engmaschige Steuerung voraussichtlich instabil.`,
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
        ? `Das Führungsprofil verlangt ${lLabel}-Dominanz${lDom ? ` (${lp![lDom.top1.key]}%)` : ""} – der Kandidat bringt ${c[lDom?.top1.key || rDom.top1.key]}% mit. Die Führungswirkung wird voraussichtlich stabil entfaltet.`
        : leadershipStatus === "NOT_SUITABLE"
          ? `Die Rolle verlangt ${lLabel}-dominante Führung${lDom ? ` (${lp![lDom.top1.key]}%)` : ""}, der Kandidat liegt bei ${c[lDom?.top1.key || rDom.top1.key]}% (Δ ${leadDiffVal} Punkte). Das Profil ist strukturell zu wenig interventionsstark für diese Führungsanforderung.`
          : `Die Führungsanforderung ist ${lLabel}-geprägt${lDom ? ` (${lp![lDom.top1.key]}%)` : ""}, der Kandidat bringt ${c[lDom?.top1.key || rDom.top1.key]}% mit (Δ ${leadDiffVal} Punkte). Führung ist möglich, wenn Zielarchitektur und Eskalationslogik klar gesetzt sind.`,
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
    roleDemand: `Impulsiv ${r.impulsiv}% – ${r.impulsiv >= 50 ? "direkt, klar, leistungsorientiert" : r.impulsiv >= 35 ? "situativ konfliktfähig" : "eher moderierend"}`,
    candidatePattern: `Impulsiv ${c.impulsiv}% – ${c.impulsiv >= 45 ? "direkt und durchsetzungsstark" : c.impulsiv >= 30 ? "situativ adressierend" : "eher moderierend/vermeidend"}`,
    status: conflictStatus,
    reasoning: conflictStatus === "SUITABLE"
      ? `Die Rolle verlangt ${r.impulsiv}% Impulsiv, der Kandidat bringt ${c.impulsiv}% mit (Δ ${conflictImpDiff} Punkte). Die Konfliktfähigkeit passt zur Rollenanforderung – Durchsetzung und Interventionsstärke sind anschlussfähig.`
      : conflictStatus === "NOT_SUITABLE"
        ? `Die Rolle verlangt ${r.impulsiv}% Impulsiv (hohe Durchsetzung), der Kandidat liegt bei nur ${c.impulsiv}% (Δ ${conflictImpDiff} Punkte). Unter Zielabweichung wird voraussichtlich zu viel moderiert statt konsequent entschieden.`
        : `Die Rolle verlangt ${r.impulsiv}% Impulsiv, der Kandidat bringt ${c.impulsiv}% mit (Δ ${conflictImpDiff} Punkte). Konfliktfähigkeit ist vorhanden, muss aber in Performance-Situationen konsequent aktiviert werden (Eskalationsregeln, klare Fristen).`,
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
    roleDemand: compMarket ? `Hoher Marktdruck – Impulsiv ${r.impulsiv}% gefordert` : `Normale Marktdynamik – Impulsiv ${r.impulsiv}%`,
    candidatePattern: `Impulsiv ${c.impulsiv}% – ${c.impulsiv >= 45 ? "Tempo-/Abschlussorientierung gut" : c.impulsiv >= 30 ? "Tempo anschlussfähig" : "Tempo reduziert"}`,
    status: competitionStatus,
    reasoning: competitionStatus === "SUITABLE"
      ? `Die Rolle verlangt ${r.impulsiv}% Impulsiv${compMarket ? " bei hohem Marktdruck" : ""}, der Kandidat bringt ${c.impulsiv}% mit (Δ ${Math.abs(compImpGap)} Punkte). Tempo und Marktreaktion passen zur Rollenlogik.`
      : competitionStatus === "NOT_SUITABLE"
        ? `${compMarket ? "Hoher Marktdruck: " : ""}Die Rolle verlangt ${r.impulsiv}% Impulsiv, der Kandidat liegt bei ${c.impulsiv}% (Δ ${Math.abs(compImpGap)} Punkte). Die impulsive Interventionslogik fehlt – das Profil verschiebt die Dynamik in Richtung Stabilisierung.`
        : `Die Rolle verlangt ${r.impulsiv}% Impulsiv, der Kandidat bringt ${c.impulsiv}% mit (Δ ${Math.abs(compImpGap)} Punkte). Die Dynamik ist steuerbar, wenn Prioritäten und Zielhärte klar etabliert sind.`,
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
      ? `Der Kandidat bringt ${c.intuitiv}% Intuitiv mit (Rolle: ${r.intuitiv}%, Δ ${cultIntDiff} Punkte). Das Profil kann Teamstabilität, Motivation und Bindung stärken – ohne die Rollenlogik zu gefährden.`
      : cultureStatus === "NOT_SUITABLE"
        ? `Die Rolle verlangt ${r.impulsiv}% Impulsiv (Leistungsfokus), der Kandidat bringt nur ${c.impulsiv}% mit. Die Kulturwirkung verschiebt sich deutlich – Zielhärte und Leistungsdifferenzierung werden strukturell geschwächt.`
        : `Der Kandidat bringt ${c.intuitiv}% Intuitiv mit (Rolle: ${r.intuitiv}%, Δ ${cultIntDiff} Punkte). Es besteht ein Risiko der Kulturverschiebung. Tragfähig, wenn Leistungsarchitektur und Zielhärte klar definiert bleiben.`,
  });

  if (tags.sales_cycle === "lang") {
    const stratStatus: FitStatus = c.analytisch >= 35 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "strategy_complexity", areaLabel: "Strategische Komplexität",
      roleDemand: `Langer Zyklus – Analytisch ${r.analytisch}% gefordert`,
      candidatePattern: `Analytisch ${c.analytisch}% – ${c.analytisch >= 35 ? "stark anschlussfähig" : c.analytisch >= 25 ? "vorhanden" : "gering"}`,
      status: stratStatus,
      reasoning: stratStatus === "SUITABLE"
        ? `Der Kandidat bringt ${c.analytisch}% Analytisch mit – bei langen Zyklen ist die analytische Basis für Pipeline-Qualität und Prozessdisziplin ausreichend.`
        : stratStatus === "CONDITIONAL"
          ? `Der Kandidat bringt ${c.analytisch}% Analytisch mit. Bei langen Zyklen wird Struktur und Planung wichtiger – systematische Arbeitsweise muss aktiv gesteuert werden.`
          : `Der Kandidat bringt nur ${c.analytisch}% Analytisch mit. Für lange strategische Zyklen fehlt die analytische Grundbasis – hohe Gefahr von Inkonsistenz in Pipeline und Forecast.`,
    });
  }

  if (tags.regulation === "hoch") {
    const regStatus: FitStatus = c.analytisch >= 40 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "regulatory_precision", areaLabel: "Regulatorische Präzision",
      roleDemand: `Hohe Regel-/Standardtreue – Analytisch ${r.analytisch}%`,
      candidatePattern: `Analytisch ${c.analytisch}% – ${c.analytisch >= 40 ? "Sorgfalt/Präzision stark" : c.analytisch >= 25 ? "vorhanden" : "deutlich unter Anforderung"}`,
      status: regStatus,
      reasoning: regStatus === "SUITABLE"
        ? `Der Kandidat bringt ${c.analytisch}% Analytisch mit – die Präzision reicht für regulierte Umfelder aus. Compliance und Audit-Readiness sind stabil aufsetzbar.`
        : regStatus === "CONDITIONAL"
          ? `Der Kandidat bringt ${c.analytisch}% Analytisch mit (Rolle: ${r.analytisch}%). In regulierten Umfeldern muss Präzision stabil sein – klare Standards, Freigabeprozesse und Kontrollen erforderlich.`
          : `Der Kandidat bringt nur ${c.analytisch}% Analytisch mit (Rolle: ${r.analytisch}%). In regulierten Kontexten kann diese Lücke zu Qualitäts-, Haftungs- oder Audit-Risiken führen.`,
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
        ? `B2C – Abschlussorientierung, Impulsiv ${r.impulsiv}%`
        : ct === "B2B"
          ? `B2B – Beziehungsstabilität, Intuitiv ${r.intuitiv}%`
          : "Mixed",
      candidatePattern: ct === "B2C"
        ? `Impulsiv ${c.impulsiv}% – ${c.impulsiv >= 40 ? "Abschluss stark" : "muss gesteuert werden"}`
        : `Intuitiv ${c.intuitiv}% / Analytisch ${c.analytisch}% – ${c.intuitiv >= 35 ? "Beziehungsaufbau stark" : "eher transaktional"}`,
      status: custStatus,
      reasoning: custStatus === "SUITABLE"
        ? (ct === "B2C"
          ? `Im B2C-Kontext bringt der Kandidat ${c.impulsiv}% Impulsiv mit – Abschlussorientierung und Tempo passen zur geforderten Dynamik.`
          : ct === "B2B"
            ? `Im B2B-Kontext bringt der Kandidat ${c.intuitiv}% Intuitiv und ${c.analytisch}% Analytisch mit – Beziehungsfähigkeit und wirtschaftliche Steuerung sind anschlussfähig.`
            : `Die Kundenorientierung passt zur geforderten Dynamik.`)
        : custStatus === "CONDITIONAL"
          ? (ct === "B2C"
            ? `Im B2C-Kontext bringt der Kandidat ${c.impulsiv}% Impulsiv mit (Rolle: ${r.impulsiv}%). Die Abschlussorientierung ist vorhanden, muss aber durch klare Ziele und Frequenz gesteuert werden.`
            : `Im B2B-Kontext bringt der Kandidat ${c.intuitiv}% Intuitiv mit (Rolle: ${r.intuitiv}%). Beziehungsfähigkeit ist vorhanden, aber die Balance aus Beziehung und Ergebnislogik muss aktiv gehalten werden.`)
          : (ct === "B2C"
            ? `Im B2C-Kontext bringt der Kandidat nur ${c.impulsiv}% Impulsiv mit (Rolle: ${r.impulsiv}%). Tempo und Abschlussquote werden voraussichtlich unter dem Rollenbedarf liegen.`
            : `Im B2B-Kontext bringt der Kandidat ${c.intuitiv}% Intuitiv und ${c.analytisch}% Analytisch mit – Beziehungstiefe und wirtschaftliche Steuerung fehlen strukturell.`),
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

function buildRisks(role: RoleAnalysis, cand: CandidateInput, engine: { overallFit: FitStatus; control: ControlIntensity; matrix: MatrixRow[]; mismatch: number }) {
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

  const candDualDominance = cDom.gap1 <= 5;
  const roleClearDom = rDom.gap1 >= 15;
  const dualConflict = candDualDominance && roleClearDom;

  if (engine.overallFit === "SUITABLE") {
    shortTerm.push(`Die Person kann sich schnell in der Rolle ${jobTitle} wirksam zeigen, weil die Arbeitsweise gut zur geforderten Struktur passt.`);
    midTerm.push("Der Steuerungsaufwand für die Führungskraft bleibt überschaubar. Die Person arbeitet weitgehend selbstständig im erwarteten Korridor.");
    longTerm.push("Die Rollenwirkung bleibt voraussichtlich stabil. Es ist nicht davon auszugehen, dass sich die Arbeitsweise der Person schleichend von den Anforderungen entfernt.");
  } else if (engine.overallFit === "CONDITIONAL") {
    if (dualConflict) {
      const c2L = labelComponent(cDom.top2.key);
      shortTerm.push(`Die Person zeigt eine Doppeldominanz: ${labelComponent(cDom.top1.key)} und ${c2L} sind nahezu gleich stark ausgeprägt. Die Rolle ${jobTitle} verlangt jedoch eine klare ${rL}-Ausrichtung.`);
      midTerm.push(`Die beiden konkurrierenden Stärken führen dazu, dass die ${rL}-Aufgaben der Rolle nicht mit voller Konsequenz bearbeitet werden. Die Person wird situativ zwischen ${labelComponent(cDom.top1.key)}- und ${c2L}-Logik wechseln.`);
      longTerm.push(`Ohne klare Steuerung entsteht eine zunehmende Unschärfe in der Rollenausübung – die geforderte ${rL}-Wirkung wird verwässert.`);
    } else {
      shortTerm.push(`Ein positiver Start ist möglich, allerdings zeigt sich im Bereich „${critical.label}" eine spürbare Abweichung zwischen dem, was die Rolle erfordert, und dem, was die Person mitbringt.`);
      if (sameDom) {
        midTerm.push(`Die grundlegende Arbeitsweise stimmt, jedoch fehlt es an der nötigen Ausprägung. Ohne klare Rahmenvorgaben kann die Person die Anforderungen der Rolle ${jobTitle} zunehmend weicher auslegen.`);
      } else {
        midTerm.push(`Die Arbeitsweise der Person unterscheidet sich von dem, was die Rolle verlangt. Ohne klare Rahmenvorgaben besteht das Risiko, dass die Person die Position nach eigener Logik interpretiert, statt der geforderten.`);
      }
      longTerm.push(`Wenn die Führungskraft nicht aktiv gegensteuert, kann sich die Wirkung der Rolle ${jobTitle} über die Zeit verändern – Anforderungen werden zunehmend anders priorisiert als ursprünglich vorgesehen.`);
    }
  } else {
    shortTerm.push(`Bereits in der Einarbeitung ist mit Reibung zu rechnen, weil die Arbeitsweise der Person nicht zu dem passt, was die Position ${jobTitle} grundlegend erfordert.`);
    midTerm.push(`Die Leistungsstruktur der Rolle wird voraussichtlich verschoben. Die Person wird Aufgaben anders gewichten und Entscheidungen anders treffen, als es die Rolle verlangt.`);
    longTerm.push("Es besteht ein hohes Risiko, dass die Besetzung dauerhaft nicht die gewünschte Wirkung entfaltet. Die Abweichung betrifft nicht einzelne Aufgaben, sondern die Grundlogik der Rolle.");
  }

  if (critical.id === "conflict") {
    midTerm.push("Die Person wird bei Zielabweichungen eher moderieren und vermitteln, statt Probleme konsequent anzusprechen und zu korrigieren.");
    longTerm.push("Leistungsunterschiede im Team werden nicht klar benannt – die Differenzierung zwischen Stark- und Schwachleistern verliert an Kontur.");
  }
  if (critical.id === "decision_logic") {
    midTerm.push("Entscheidungen werden tendenziell langsamer getroffen. Die Person neigt dazu, stärker abzusichern, statt zügig zu handeln.");
    longTerm.push("Unter Zeitdruck oder bei Zielkonflikten kann die Reaktionsgeschwindigkeit deutlich nachlassen.");
  }
  if (critical.id === "kpi_work") {
    midTerm.push("Die Disziplin bei Reporting, Forecasting und datenbasierter Steuerung ist voraussichtlich inkonsistent.");
    longTerm.push("Ohne engmaschige Nachsteuerung sinkt die Transparenz über Zielerreichung und Pipeline-Qualität.");
  }
  if (critical.id === "leadership_effect") {
    midTerm.push("Die Führungswirkung weicht vom Anforderungsprofil ab – das Team bekommt nicht die Steuerungsimpulse, die die Rolle verlangt.");
    longTerm.push("Ohne klare Eskalationslogik und Zielarchitektur bleibt die Führungseffektivität fragil.");
  }
  if (critical.id === "competition") {
    midTerm.push("Tempo und Abschlussdruck werden voraussichtlich gedämpft. Die Person agiert eher abwägend als durchsetzungsorientiert.");
    longTerm.push("In einem dynamischen Marktumfeld besteht das Risiko, dass Chancen reaktiv statt proaktiv bearbeitet werden.");
  }
  if (critical.id === "culture") {
    midTerm.push("Die kulturelle Wirkung der Person im Team unterscheidet sich von dem, was die Rolle vorsieht. Es besteht das Risiko einer Verschiebung in der Teamdynamik.");
    longTerm.push("Langfristig können Zielhärte und klare Leistungsdifferenzierung erodieren, wenn die kulturelle Passung nicht nachgesteuert wird.");
  }

  if (tags.market_pressure === "hoch")
    longTerm.push("In einem Hochdruckmarkt wirkt jede Verzögerung direkt auf Abschlussquoten und Umsatzdynamik. Die beschriebenen Abweichungen verstärken sich unter Marktdruck.");
  if (tags.regulation === "hoch")
    longTerm.push("In einem regulierten Umfeld können die beschriebenen Abweichungen in der Prozessdisziplin zu Qualitäts- oder Audit-Risiken führen.");

  return { shortTerm, midTerm, longTerm };
}

function developmentFromControl(control: ControlIntensity, points: number, criticalLabel: string) {
  if (control === "LOW") return { likelihood: "hoch" as const, timeframe: "3–6 Monate", text: `Die Integration ist weitgehend selbsttragend (Steuerungspunkte: ${points}). Entwicklung erfolgt primär über Routine und Rollenpraxis.` };
  if (control === "MEDIUM") return { likelihood: "mittel" as const, timeframe: "6–12 Monate", text: `Entwicklung ist realistisch (Steuerungspunkte: ${points}), erfordert jedoch feste Review-Rhythmen und klare Entscheidungsregeln – besonders im Bereich „${criticalLabel}".` };
  return { likelihood: "gering" as const, timeframe: ">12 Monate", text: `Die Abweichung betrifft Kernlogik (Steuerungspunkte: ${points}). Entwicklung nur mit klarer Rahmenarchitektur und engmaschiger Steuerung im Bereich „${criticalLabel}" möglich.` };
}

function integrationPlan(role: RoleAnalysis, criticalArea: MatrixAreaId, control: ControlIntensity) {
  const tags = role.environment_tags || {};
  const jobTitle = role.job_title || "diese Position";
  const jobFamily = role.job_family || "";
  const phase_0_30: string[] = [];
  const phase_30_60: string[] = [];
  const phase_60_90: string[] = [];

  phase_0_30.push(`Onboarding-Gespräch für ${jobTitle}: Verantwortungsbereich, Entscheidungsbefugnisse und Erwartungen an die Rolle schriftlich klären.`);
  phase_0_30.push(`Konkrete Zielvereinbarung für die ersten 90 Tage als ${jobTitle} festlegen – messbar, terminiert, mit klaren Prioritäten.`);
  phase_0_30.push(`Die drei wichtigsten Spannungsfelder dieser Position offen benennen und gemeinsam Lösungsansätze definieren.`);

  if (criticalArea === "conflict") {
    phase_0_30.push(`Für ${jobTitle} klare Eskalationsregeln vereinbaren: Ab welcher Abweichung wird wie und durch wen interveniert.`);
    phase_30_60.push("Schwierige Gespräche im Tagesgeschäft begleiten – Vorbereitung, Gesprächsführung und Nachverfolgung gemeinsam strukturieren.");
    phase_60_90.push("Prüfen: Werden Leistungsprobleme im Team eigenständig und zeitnah angesprochen?");
  } else if (criticalArea === "decision_logic") {
    phase_0_30.push(`Entscheidungsfristen für typische Situationen als ${jobTitle} festlegen – z.\u00ADB. 48 Stunden bei Zielabweichungen, 24 Stunden bei Kundeneskalationen.`);
    phase_30_60.push("Im Tagesgeschäft beobachten: Trifft die Person Entscheidungen zügig oder sichert sie übermäßig ab?");
    phase_60_90.push("Prüfen: Hält der Entscheidungsrhythmus dem Markttempo stand?");
  } else if (criticalArea === "kpi_work") {
    phase_0_30.push(`Reporting-Standards für ${jobTitle} definieren: Welche Zahlen werden wann in welcher Qualität erwartet (z.\u00ADB. Pipeline-Updates, Forecast, CRM-Pflege).`);
    phase_30_60.push("Reporting-Disziplin prüfen: Werden Daten vollständig, aktuell und ohne Nachfragen geliefert?");
    phase_60_90.push("Prüfen: Ist die Transparenz über Zielerreichung stabil und verlässlich?");
  } else if (criticalArea === "leadership_effect") {
    phase_0_30.push(`Erwartungen an die Führungsrolle als ${jobTitle} klar formulieren: Wie soll geführt werden, welche Impulse erwartet das Team.`);
    phase_30_60.push("Führungswirkung im Alltag beobachten: Setzt die Person die richtigen Prioritäten, gibt sie klare Rückmeldungen?");
    phase_60_90.push("Prüfen: Hat das Team eine klare Richtung und fühlt sich geführt?");
  } else if (criticalArea === "competition") {
    phase_0_30.push(`Wettbewerbsrelevante Ziele für ${jobTitle} festlegen: Marktanteile, Abschlussquoten, Reaktionszeiten auf Ausschreibungen.`);
    phase_30_60.push("Tempo und Durchsetzungsstärke im Tagesgeschäft beobachten: Werden Chancen aktiv genutzt oder abwartend bearbeitet?");
    phase_60_90.push("Prüfen: Agiert die Person proaktiv am Markt oder eher reaktiv?");
  } else if (criticalArea === "culture") {
    phase_0_30.push(`Kulturelle Erwartungen an ${jobTitle} klar machen: Welche Haltung, welcher Umgang im Team wird erwartet.`);
    phase_30_60.push("Teamdynamik beobachten: Passt die Wirkung der Person zur gewünschten Kultur?");
    phase_60_90.push("Prüfen: Bleibt die Teamkultur stabil oder verschiebt sie sich in eine ungewollte Richtung?");
  } else {
    phase_30_60.push(`Spannungsfelder der Position ${jobTitle} aktiv steuern: Klare Priorisierung und regelmäßige Review-Gespräche.`);
    phase_60_90.push("Prüfen: Zeigt die Person die gewünschte Wirkung in Tempo, Zielhärte, Prozessqualität und Teamführung?");
  }

  if (tags.market_pressure === "hoch") {
    phase_0_30.push(`Schnelle Entscheidungswege für ${jobTitle} definieren: Wer gibt was frei, wie wird eskaliert.`);
    phase_30_60.push("Reaktionsgeschwindigkeit im Tagesgeschäft messen: Wie schnell wird auf Abweichungen reagiert?");
  }
  if (tags.regulation === "hoch") {
    phase_0_30.push("Compliance-/Qualitätsstandards als Muss-Kriterien dokumentieren.");
    phase_30_60.push("Qualitätsprüfungen in Routine überführen.");
  }

  if (control === "HIGH") {
    phase_0_30.push(`Wöchentliches Steering-Gespräch zwischen ${jobTitle} und direkter Führungskraft im ersten Monat einplanen.`);
    phase_30_60.push("Gezieltes Coaching auf dem kritischen Verhalten: Entscheidungsverhalten, Konfliktfähigkeit oder Reporting-Disziplin – je nach Schwachstelle.");
    phase_60_90.push("Klare Go/No-Go-Entscheidung treffen: Erfüllt die Person die Kernanforderungen der Position oder nicht?");
  }

  phase_60_90.push(`Abschließendes 90-Tage-Review: Passt die Person nachweislich zur Rolle ${jobTitle}? Ergebnis dokumentieren und weitere Schritte festlegen.`);

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
  const candDualDominance = candDom.gap1 <= 5;
  const roleClearDominance = roleDom.gap1 >= 15;
  const dualConflict = candDualDominance && roleClearDominance;
  let overallFit: FitStatus = ko ? "NOT_SUITABLE" : overallFitFromScore(mismatch, sameDom);
  if (dualConflict && overallFit === "SUITABLE") {
    overallFit = "CONDITIONAL";
  }
  const ctrl = calcControlIntensity(role, cand);
  const matrix = buildMatrix(role, cand);
  const critical = criticalAreaFromMatrix(matrix);

  const r = normalizeTriad(role.role_profile);
  const c = normalizeTriad(cand.candidate_profile);
  const rL = labelComponent(roleDom.top1.key);
  const cL = labelComponent(candDom.top1.key);
  const mainDiff = Math.abs(r[roleDom.top1.key] - c[roleDom.top1.key]);

  const keyReason = (() => {
    let domDesc: string;
    if (dualConflict) {
      const c2L = labelComponent(candDom.top2.key);
      domDesc = `Doppeldominanz beim Kandidaten: ${labelComponent(candDom.top1.key)} (${c[candDom.top1.key]}%) und ${c2L} (${c[candDom.top2.key]}%) konkurrieren – die Rolle verlangt klare ${rL}-Dominanz (${r[roleDom.top1.key]}%)`;
    } else if (sameDom) {
      domDesc = `Gleiche Dominanz (${rL}), Intensitätsdifferenz: ${mainDiff} Punkte (Soll: ${r[roleDom.top1.key]}% / Ist: ${c[roleDom.top1.key]}%)`;
    } else {
      domDesc = `Dominanzverschiebung ${rL} (${r[roleDom.top1.key]}%) → ${cL} (${c[candDom.top1.key]}%)`;
    }
    return `${domDesc}; kritisch: ${critical.label}; Mismatch: ${mismatch}; Steuerung: ${controlLabel(ctrl.level)} (${ctrl.points} Pkt.)`;
  })();

  const candName = cand.candidate_name || "Kandidat";
  const execSummary = (() => {
    const intro = `Rolle: ${role.job_title} | ${candName}`;
    const fitLine = `Gesamteinstufung: ${statusLabel(overallFit)} (Mismatch: ${mismatch}) · Steuerungsintensität: ${controlLabel(ctrl.level)} (${ctrl.points} Punkte)`;
    let domLine: string;
    if (dualConflict) {
      domLine = `Kandidat: Doppeldominanz ${labelComponent(candDom.top1.key)}/${labelComponent(candDom.top2.key)} · Rolle: klare ${rL}-Dominanz (${r[roleDom.top1.key]}%)`;
    } else if (sameDom) {
      domLine = `Beide Profile: ${rL}-dominant (Soll: ${r[roleDom.top1.key]}% / Ist: ${c[roleDom.top1.key]}%, Δ ${mainDiff})`;
    } else {
      domLine = `Rollenlogik: ${dominanceLabel(roleDom)} · Kandidatenlogik: ${dominanceLabel(candDom)}`;
    }
    let reasonLine: string;
    if (overallFit === "SUITABLE") {
      reasonLine = `Die ${rL}-Kernlogik der Rolle wird stabil abgebildet (Δ ${mainDiff} Punkte). Kritischer Bereich: ${critical.label}.`;
    } else if (dualConflict) {
      reasonLine = `Die Doppeldominanz des Kandidaten verhindert eine klare ${rL}-Wirkung. Die konkurrierenden Stärken erzeugen Unschärfe in der Aufgabenlogik. Kritischer Bereich: ${critical.label}.`;
    } else if (overallFit === "CONDITIONAL") {
      reasonLine = `Grundpassung vorhanden, aber Abweichung von ${mainDiff} Punkten in der ${rL}-Komponente. Kritischer Bereich: ${critical.label}.`;
    } else {
      reasonLine = `Die ${rL}-Kernlogik der Rolle (${r[roleDom.top1.key]}%) wird durch ${candName} (${c[roleDom.top1.key]}%) nicht abgebildet. Kritischer Bereich: ${critical.label}.`;
    }
    return [intro, fitLine, domLine, reasonLine].join("\n");
  })();

  const risks = buildRisks(role, cand, { overallFit, control: ctrl.level, matrix, mismatch });
  const dev = developmentFromControl(ctrl.level, ctrl.points, critical.label);
  const plan = integrationPlan(role, critical.id, ctrl.level);

  return {
    roleDominance: roleDom, candDominance: candDom,
    overallFit, mismatchScore: mismatch, koTriggered: ko,
    controlIntensity: ctrl.level, controlPoints: ctrl.points,
    criticalArea: critical.id, criticalAreaLabel: critical.label,
    keyReason, executiveSummary: execSummary,
    matrix, risks, development: dev, integrationPlan90: plan,
  };
}
