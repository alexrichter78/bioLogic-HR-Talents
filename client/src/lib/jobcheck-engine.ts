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
      ? `Rolle und Kandidat arbeiten beide ${rLabel}-geprägt. Die Grundausrichtung stimmt überein, die Rolle wird in ihrer Kernwirkung stabil abgebildet.`
      : dominanceStatus === "CONDITIONAL"
        ? (sameDominant
          ? `Beide Profile sind ${rLabel}-geprägt, allerdings ist die Ausprägung beim Kandidaten schwächer als von der Rolle gefordert. Die Grundrichtung stimmt, die Intensität weicht ab.`
          : `Die Rolle verlangt eine ${rLabel}-geprägte Arbeitsweise, der Kandidat arbeitet eher ${cLabel}-geprägt. Eine Passung ist möglich, erfordert aber klare Rahmenvorgaben.`)
        : `Die Rolle verlangt klar ${rLabel}-geprägtes Arbeiten, der Kandidat ist ${cLabel}-geprägt. Die Grundlogik der Position wird durch dieses Profil nicht abgebildet.`,
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
      ? `Die Rolle verlangt ${decRoleDesc} – der Kandidat entscheidet ${decCandDesc}. Die Entscheidungslogik passt zur Anforderung der Position.`
      : decisionStatus === "CONDITIONAL"
        ? (sameDominant
          ? `Der Kandidat entscheidet grundsätzlich in der richtigen Logik, allerdings weniger konsequent als die Rolle es verlangt. Klare Entscheidungsfristen und Eskalationsregeln empfohlen.`
          : `Die Rolle verlangt ${decRoleDesc}, der Kandidat entscheidet eher ${decCandDesc}. Die Abweichung ist steuerbar, wenn Entscheidungsfristen und Eskalationsregeln klar gesetzt werden.`)
        : `Die Rolle verlangt ${decRoleDesc}, der Kandidat ist ${decCandDesc}. Die Entscheidungslogik passt nicht zusammen – Interventionen werden voraussichtlich verzögert oder anders priorisiert.`,
  });

  const kpiStatus: FitStatus = (() => {
    if (r.analytisch < 20) return "SUITABLE";
    if (c.analytisch >= r.analytisch - 5) return "SUITABLE";
    if (c.analytisch >= r.analytisch - 15) return "CONDITIONAL";
    return "NOT_SUITABLE";
  })();

  const kpiDiff = r.analytisch - c.analytisch;

  rows.push({
    areaId: "kpi_work", areaLabel: "Kennzahlen und Arbeitssteuerung",
    roleDemand: r.analytisch >= 40 ? "Stark kennzahlengesteuert, hohe Anforderung an Berichte und Nachverfolgung" : r.analytisch >= 25 ? "Kennzahlen als Steuerungsinstrument erwartet" : "Geringe Anforderung an zahlenbasiertes Arbeiten",
    candidatePattern: c.analytisch >= 30 ? "Zahlen- und strukturorientiert, anschlussfähig" : c.analytisch >= 20 ? "Kennzahlen eher als Orientierung, nicht als Steuerungsinstrument" : "Geringe zahlenbasierte Steuerungsbasis",
    status: kpiStatus,
    reasoning: kpiStatus === "SUITABLE"
      ? "Der Kandidat arbeitet ausreichend zahlen- und strukturorientiert. Kennzahlenbasierte Steuerung und regelmäßige Berichte können stabil aufgesetzt werden."
      : kpiStatus === "CONDITIONAL"
        ? "Der Kandidat bringt Grundlagen für zahlenbasiertes Arbeiten mit, allerdings schwächer als die Rolle es verlangt. Feste Routinen, klare Standards und konsequentes Nachhalten sind nötig."
        : "Die Rolle verlangt ein stark zahlenorientiertes Profil – der Kandidat arbeitet deutlich weniger strukturiert. Die Qualität von Berichten und Arbeitsabläufen wird ohne engmaschige Steuerung voraussichtlich instabil.",
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
      roleDemand: lp ? `${lLabel}-geprägte Führung erwartet` : "Führung erforderlich",
      candidatePattern: `${labelComponent(cDom.top1.key)}-geprägte Führungswirkung`,
      status: leadershipStatus,
      reasoning: leadershipStatus === "SUITABLE"
        ? `Der Kandidat bringt die geforderte ${lLabel}-geprägte Führungsweise mit. Die Führungswirkung wird voraussichtlich stabil entfaltet.`
        : leadershipStatus === "NOT_SUITABLE"
          ? `Die Rolle verlangt eine klar ${lLabel}-geprägte Führung – der Kandidat bringt diese Führungsqualität nicht ausreichend mit. Das Profil ist für diese Führungsanforderung zu schwach aufgestellt.`
          : `Die Führungsanforderung ist ${lLabel}-geprägt, der Kandidat bringt eine andere Schwerpunktsetzung mit. Führung ist möglich, wenn Zielarchitektur und Erwartungen klar definiert werden.`,
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
    roleDemand: r.impulsiv >= 50 ? "Direkte, klare Konfliktführung erwartet" : r.impulsiv >= 35 ? "Situative Konfliktfähigkeit erwartet" : "Eher moderierende Konfliktbearbeitung",
    candidatePattern: c.impulsiv >= 45 ? "Direkt und durchsetzungsstark" : c.impulsiv >= 30 ? "Situativ adressierend" : "Eher moderierend und vermeidend",
    status: conflictStatus,
    reasoning: conflictStatus === "SUITABLE"
      ? "Die Konfliktfähigkeit des Kandidaten passt zur Rollenanforderung. Durchsetzungsstärke und Interventionsbereitschaft sind anschlussfähig."
      : conflictStatus === "NOT_SUITABLE"
        ? "Die Rolle braucht jemanden, der Konflikte direkt anspricht und Leistungsprobleme klar benennt. Der Kandidat neigt dazu, eher zu moderieren als konsequent durchzugreifen."
        : "Grundlegende Konfliktfähigkeit ist vorhanden, reicht aber nicht vollständig an die Rollenanforderung heran. In Performance-Situationen müssen klare Eskalationsregeln und Fristen helfen.",
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
    roleDemand: compMarket ? "Hoher Marktdruck – schnelle Reaktion und Abschlussstärke gefordert" : "Marktübliche Dynamik – Tempo und Zielorientierung erwartet",
    candidatePattern: c.impulsiv >= 45 ? "Hohes Tempo, abschlussorientiert" : c.impulsiv >= 30 ? "Solides Tempo, anschlussfähig" : "Eher abwägend, reduziertes Tempo",
    status: competitionStatus,
    reasoning: competitionStatus === "SUITABLE"
      ? `Tempo und Marktreaktion des Kandidaten passen zur Rollenanforderung${compMarket ? " – auch unter hohem Marktdruck" : ""}.`
      : competitionStatus === "NOT_SUITABLE"
        ? `${compMarket ? "Bei hohem Marktdruck: " : ""}Die Rolle braucht jemanden, der schnell reagiert und Abschlüsse aktiv vorantreibt. Der Kandidat arbeitet deutlich abwägender – das Tempo reicht für diese Anforderung nicht aus.`
        : "Der Kandidat bringt ein solides Grundtempo mit, bleibt aber hinter der Anforderung der Rolle zurück. Mit klaren Prioritäten und Zielvorgaben ist die Dynamik steuerbar.",
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
    roleDemand: r.impulsiv >= 55 ? "Leistungs- und ergebnisorientierte Teamkultur" : r.intuitiv >= 40 ? "Beziehungs- und teamorientierte Kultur" : "Ausgewogene Teamkultur",
    candidatePattern: c.intuitiv >= 45 ? "Beziehungsstabilisierend, teamverbindend" : c.impulsiv >= 45 ? "Leistungsorientiert, ergebnisfokussiert" : "Sach- und strukturorientiert",
    status: cultureStatus,
    reasoning: cultureStatus === "SUITABLE"
      ? "Der Kandidat kann Teamstabilität, Motivation und Bindung stärken – ohne die Rollenlogik zu gefährden. Die Kulturwirkung passt zur Erwartung."
      : cultureStatus === "NOT_SUITABLE"
        ? "Die Rolle braucht eine klar leistungsorientierte Wirkung im Team. Der Kandidat arbeitet deutlich beziehungsorientierter – Zielhärte und Leistungsdifferenzierung werden geschwächt."
        : "Der Kandidat bringt eine etwas andere Kulturwirkung mit als die Rolle verlangt. Eine Kulturverschiebung ist möglich, bleibt aber tragfähig, wenn Leistungserwartungen klar definiert werden.",
  });

  if (tags.sales_cycle === "lang") {
    const stratStatus: FitStatus = c.analytisch >= 35 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "strategy_complexity", areaLabel: "Strategische Komplexität",
      roleDemand: "Langer Zyklus – hohe Anforderung an Planung und Prozessdisziplin",
      candidatePattern: c.analytisch >= 35 ? "Stark strukturiert, strategiefähig" : c.analytisch >= 25 ? "Grundlegende Strukturfähigkeit vorhanden" : "Geringe strategische Planungsbasis",
      status: stratStatus,
      reasoning: stratStatus === "SUITABLE"
        ? "Der Kandidat arbeitet ausreichend strukturiert und planungsorientiert. Bei langen Zyklen kann die Qualität der Vertriebsarbeit und Planungsdisziplin stabil gehalten werden."
        : stratStatus === "CONDITIONAL"
          ? "Der Kandidat bringt Grundlagen für strategisches Arbeiten mit. Bei langen Zyklen muss systematische Arbeitsweise aber aktiv gesteuert und eingefordert werden."
          : "Für lange strategische Zyklen fehlt die nötige Planungs- und Strukturbasis. Ohne engmaschige Steuerung drohen Schwankungen in der Vertriebsplanung und Umsatzprognose.",
    });
  }

  if (tags.regulation === "hoch") {
    const regStatus: FitStatus = c.analytisch >= 40 ? "SUITABLE" : c.analytisch >= 25 ? "CONDITIONAL" : "NOT_SUITABLE";
    rows.push({
      areaId: "regulatory_precision", areaLabel: "Regulatorische Präzision",
      roleDemand: "Hohe Regel- und Standardtreue gefordert",
      candidatePattern: c.analytisch >= 40 ? "Hohe Sorgfalt und Präzision" : c.analytisch >= 25 ? "Grundlegende Präzision vorhanden" : "Deutlich unter Anforderung",
      status: regStatus,
      reasoning: regStatus === "SUITABLE"
        ? "Der Kandidat arbeitet ausreichend sorgfältig und präzise. Regelkonformität und Prüfsicherheit können stabil aufgesetzt werden."
        : regStatus === "CONDITIONAL"
          ? "Der Kandidat bringt Grundlagen für sorgfältiges Arbeiten mit. In regulierten Umfeldern müssen aber klare Standards, Freigabeprozesse und regelmäßige Kontrollen ergänzend sichergestellt werden."
          : "Die Sorgfalt und Präzision des Kandidaten reicht für ein stark reguliertes Umfeld nicht aus. Es drohen Qualitäts-, Haftungs- oder Prüfungsrisiken.",
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
        ? "B2C – hohe Abschlussorientierung und schnelles Tempo gefordert"
        : ct === "B2B"
          ? "B2B – Beziehungsaufbau und langfristige Kundenbindung gefordert"
          : "Gemischtes Kundenumfeld",
      candidatePattern: ct === "B2C"
        ? (c.impulsiv >= 40 ? "Abschlussstark und tempoorientiert" : "Abschlussorientierung muss gesteuert werden")
        : (c.intuitiv >= 35 ? "Beziehungsorientiert, guter Kundenaufbau" : "Eher transaktional, weniger beziehungsorientiert"),
      status: custStatus,
      reasoning: custStatus === "SUITABLE"
        ? (ct === "B2C"
          ? "Der Kandidat arbeitet abschlussorientiert und mit hohem Tempo – das passt zum B2C-Umfeld."
          : ct === "B2B"
            ? "Der Kandidat bringt Beziehungsfähigkeit und wirtschaftliches Verständnis mit – beides wichtig im B2B-Kontext."
            : "Die Kundenorientierung passt zur geforderten Dynamik.")
        : custStatus === "CONDITIONAL"
          ? (ct === "B2C"
            ? "Im B2C-Umfeld ist grundlegende Abschlussorientierung vorhanden, reicht aber nicht vollständig an die Anforderung heran. Klare Ziele und Taktung helfen."
            : "Der Kandidat kann Beziehungen aufbauen, aber die Balance aus Beziehungspflege und Ergebnisorientierung muss aktiv gehalten werden.")
          : (ct === "B2C"
            ? "Im B2C-Umfeld fehlt dem Kandidaten die nötige Abschlussorientierung. Tempo und Abschlussquote werden voraussichtlich unter den Erwartungen liegen."
            : "Im B2B-Kontext fehlen dem Kandidaten die nötige Beziehungstiefe und wirtschaftliche Steuerungsfähigkeit."),
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
  const roleKeyInDual = dualConflict && (cDom.top1.key === rDom.top1.key || cDom.top2.key === rDom.top1.key);

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
    if (dualConflict && !roleKeyInDual) {
      const c2L = labelComponent(cDom.top2.key);
      shortTerm.push(`Die Person zeigt eine Doppeldominanz aus ${labelComponent(cDom.top1.key)} und ${c2L} – die geforderte ${rL}-Komponente der Rolle ${jobTitle} ist in keiner der beiden Stärken vertreten.`);
      midTerm.push(`Die Arbeitslogik der Person wird von ${labelComponent(cDom.top1.key)} und ${c2L} bestimmt. Die für die Rolle zentrale ${rL}-Steuerung fehlt strukturell – das lässt sich durch Einarbeitung nicht kompensieren.`);
      longTerm.push(`Die Besetzung würde die Grundlogik der Position verändern. Statt ${rL}-gesteuerter Arbeit entsteht eine ${labelComponent(cDom.top1.key)}/${c2L}-geprägte Dynamik, die den Anforderungen der Rolle widerspricht.`);
    } else {
      shortTerm.push(`Bereits in der Einarbeitung ist mit Reibung zu rechnen, weil die Arbeitsweise der Person nicht zu dem passt, was die Position ${jobTitle} grundlegend erfordert.`);
      midTerm.push(`Die Leistungsstruktur der Rolle wird voraussichtlich verschoben. Die Person wird Aufgaben anders gewichten und Entscheidungen anders treffen, als es die Rolle verlangt.`);
      longTerm.push("Es besteht ein hohes Risiko, dass die Besetzung dauerhaft nicht die gewünschte Wirkung entfaltet. Die Abweichung betrifft nicht einzelne Aufgaben, sondern die Grundlogik der Rolle.");
    }
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
    midTerm.push("Die Disziplin bei Berichten, Prognosen und zahlenbasierter Steuerung ist voraussichtlich inkonsistent.");
    longTerm.push("Ohne engmaschige Nachsteuerung sinkt die Transparenz über Zielerreichung und Vertriebsqualität.");
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
    longTerm.push("In einem regulierten Umfeld können die beschriebenen Abweichungen in der Prozessdisziplin zu Qualitäts- oder Prüfungsrisiken führen.");

  return { shortTerm, midTerm, longTerm };
}

function developmentFromControl(control: ControlIntensity, points: number, criticalLabel: string) {
  if (control === "LOW") return { likelihood: "hoch" as const, timeframe: "3–6 Monate", text: "Die Person kann sich voraussichtlich gut selbst in die Rolle einarbeiten. Der Steuerungsaufwand für die Führungskraft ist gering – es reichen regelmäßige Check-ins und normale Feedbackrunden." };
  if (control === "MEDIUM") return { likelihood: "mittel" as const, timeframe: "6–12 Monate", text: `Eine erfolgreiche Entwicklung ist realistisch, erfordert aber feste Review-Gespräche und klare Spielregeln – besonders im Bereich „${criticalLabel}". Die Führungskraft muss aktiv begleiten.` };
  return { likelihood: "gering" as const, timeframe: ">12 Monate", text: `Die Abweichung betrifft die Grundlogik der Rolle. Eine Entwicklung in die richtige Richtung ist nur mit intensiver Führungsarbeit und engmaschiger Begleitung möglich – besonders im Bereich „${criticalLabel}".` };
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
    phase_0_30.push(`Berichtsstandards für ${jobTitle} definieren: Welche Zahlen werden wann in welcher Qualität erwartet (z.\u00ADB. Vertriebsberichte, Umsatzprognosen, Datenpflege).`);
    phase_30_60.push("Berichtsdisziplin prüfen: Werden Zahlen vollständig, aktuell und ohne Nachfragen geliefert?");
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
    phase_0_30.push("Qualitäts- und Regelwerksstandards als verbindliche Anforderungen dokumentieren.");
    phase_30_60.push("Qualitätsprüfungen in Routine überführen.");
  }

  if (control === "HIGH") {
    phase_0_30.push(`Wöchentliches Steuerungsgespräch zwischen ${jobTitle} und direkter Führungskraft im ersten Monat einplanen.`);
    phase_30_60.push("Gezieltes Coaching auf dem kritischen Verhalten: Entscheidungsverhalten, Konfliktfähigkeit oder Berichtsdisziplin – je nach Schwachstelle.");
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
  const roleKeyInDual = dualConflict && (candDom.top1.key === roleDom.top1.key || candDom.top2.key === roleDom.top1.key);
  let overallFit: FitStatus = ko ? "NOT_SUITABLE" : overallFitFromScore(mismatch, sameDom);
  if (dualConflict && !ko) {
    if (roleKeyInDual) {
      if (overallFit === "SUITABLE") overallFit = "CONDITIONAL";
    } else {
      overallFit = "NOT_SUITABLE";
    }
  }
  const ctrl = calcControlIntensity(role, cand);
  const matrix = buildMatrix(role, cand);
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
    if (dualConflict && roleKeyInDual) {
      return `${candName} bringt die geforderte ${rL}-Arbeitsweise grundsätzlich mit, allerdings konkurriert sie mit einer gleich starken ${competingL}-Ausprägung. Die Rolle ${jobTitle} verlangt eine klare ${rL}-Ausrichtung – diese Eindeutigkeit ist beim Kandidaten nicht gegeben.`;
    }
    if (dualConflict && !roleKeyInDual) {
      return `${candName} arbeitet vorrangig ${labelComponent(candDom.top1.key)} und ${labelComponent(candDom.top2.key)} geprägt. Die für ${jobTitle} entscheidende ${rL}-Arbeitsweise ist nicht als Stärke vorhanden.`;
    }
    if (overallFit === "SUITABLE") {
      return `${candName} passt gut zur Rolle ${jobTitle}. Die geforderte ${rL}-Arbeitsweise wird stabil abgebildet. Der kritischste Bereich ist „${critical.label}", dort ist die Passung am engsten.`;
    }
    if (sameDom && overallFit === "CONDITIONAL") {
      return `${candName} arbeitet grundsätzlich ${rL}-orientiert, wie es die Rolle ${jobTitle} verlangt. Allerdings ist die Ausprägung schwächer als gefordert. Besonders im Bereich „${critical.label}" zeigt sich die Abweichung.`;
    }
    if (overallFit === "CONDITIONAL") {
      return `${candName} bringt eine andere Schwerpunktsetzung mit als die Rolle ${jobTitle} erfordert. Eine Besetzung ist möglich, erfordert aber klare Steuerung – besonders im Bereich „${critical.label}".`;
    }
    return `${candName} passt nicht zur Grundstruktur der Rolle ${jobTitle}. Die geforderte ${rL}-Arbeitsweise wird nicht abgebildet. Besonders kritisch: „${critical.label}".`;
  })();

  const execSummary = (() => {
    const intro = `Rolle: ${jobTitle} | ${candName}`;
    const fitLine = `Gesamteinstufung: ${statusLabel(overallFit)} · Steuerungsaufwand: ${controlLabel(ctrl.level)}`;
    let domLine: string;
    if (dualConflict) {
      domLine = `${candName} zeigt zwei gleich starke Arbeitsweisen (${labelComponent(candDom.top1.key)} und ${labelComponent(candDom.top2.key)}). Die Rolle verlangt eine klare ${rL}-Ausrichtung.`;
    } else if (sameDom) {
      domLine = `Beide Profile sind ${rL}-geprägt. Die Grundrichtung stimmt überein.`;
    } else {
      domLine = `Die Rolle erfordert ${rL}-geprägtes Arbeiten. ${candName} arbeitet eher ${cL}-geprägt.`;
    }
    return [intro, fitLine, domLine].join("\n");
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
