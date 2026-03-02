import type { Triad, ComponentKey } from "./jobcheck-engine";

const MAX = 67;
const COMPONENTS: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];

const SECONDARY_COMP_GAP_MAX = 5;
const DOMINANT_TOP1_MIN_GAP = 10;

const F1_MIN_STEERING_IMP = 18;
const F1_MIN_STEERING_ANA = 18;
const F2_TEAM_INT_HIGH = 40;
const F2_LEADER_INT_LOW = 18;
const F2_LEADER_ANA_HIGH = 45;
const F3_LEADER_IMP_OVERDRIVE = 58;
const F3_TEAM_IMP_LOW = 25;
const F4_TEAM_ANA_HIGH = 35;
const F4_LEADER_ANA_LOW = 15;
const F5_LEADERSHIP_CLARITY_LOW_GAP = 2;
const F5_TEAM_CLEAR_GAP = 15;
const F6_SECONDARY_COMP_PENALTY_BASE = 0.05;
const F7_FULL_SYMM_TOLERANCE = 5;
const F7_FULL_SYMM_PENALTY_NORMAL = 0.02;
const F7_FULL_SYMM_PENALTY_UNCONTROLLED = 0.05;

type DiffCategory = "A" | "B" | "C";
type Rating = "Passend" | "Bedingt passend" | "Nicht passend";
type StateKey = "normal" | "controlledStress" | "uncontrolledStress";

export type LeadershipRule = {
  code: string;
  title: string;
  message: string;
  minRating: Rating | null;
  tfsPenalty: number;
};

export type SecondaryCompetition = {
  active: boolean;
  top1: ComponentKey;
  top2: ComponentKey;
  top3: ComponentKey;
  gap12: number;
  gap23: number;
};

export type MatchEvaluation = {
  differences: Record<ComponentKey, number>;
  categories: Record<ComponentKey, DiffCategory>;
  indices: { TFS: number; TFS_beforeLeadershipRules?: number };
  flags: {
    dominanceRisk: boolean;
    intuitiveBreakRisk: boolean;
    dualLeader: boolean;
    clearTeam: boolean;
    gapLeader: number;
    gapTeam: number;
    leaderFullSymmetry: boolean;
    teamFullSymmetry: boolean;
    leaderSecondaryCompetition: SecondaryCompetition;
    teamSecondaryCompetition: SecondaryCompetition;
    leadershipRules: LeadershipRule[];
    leadershipRuleFlags: Record<string, boolean>;
  };
  rating: Rating;
  rating_beforeLeadershipRules?: Rating;
};

export type MatchTexts = {
  title: string;
  rating: Rating;
  ratingHeadline: string;
  summary: string;
  componentBreakdown: string;
};

export type StressComparisonFlags = {
  worsensControlled: boolean;
  worsensUncontrolled: boolean;
  worsensAny: boolean;
  worsensByTwoOrMoreControlled: boolean;
  worsensByTwoOrMoreUncontrolled: boolean;
};

export type StressComparison = {
  summary: string;
  guidance: string;
  flags: StressComparisonFlags;
};

export type LeaderTeamMatchResult = {
  input: { leader: Triad; team: Triad; stress: { intensity: number; k: number } };
  normal: { leader: Triad; team: Triad; evaluation: MatchEvaluation; texts: MatchTexts };
  controlledStress: { leader: Triad; team: Triad; evaluation: MatchEvaluation; texts: MatchTexts };
  uncontrolledStress: { leader: Triad; team: Triad; evaluation: MatchEvaluation; texts: MatchTexts };
  stressComparison: StressComparison;
};

function clamp(x: number, min = 0, max = MAX): number {
  return Math.max(min, Math.min(max, x));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function sortKeysByValueDesc(p: Triad): ComponentKey[] {
  return [...COMPONENTS].sort((a, b) => p[b] - p[a]);
}

function mean3(a: number, b: number, c: number): number {
  return (a + b + c) / 3;
}

function stdDev3(a: number, b: number, c: number): number {
  const m = mean3(a, b, c);
  const v = ((a - m) ** 2 + (b - m) ** 2 + (c - m) ** 2) / 3;
  return Math.sqrt(v);
}

function classifyDiff(d: number): DiffCategory {
  if (d <= 10) return "A";
  if (d <= 20) return "B";
  return "C";
}

function ratingOrder(rating: Rating): number {
  if (rating === "Passend") return 2;
  if (rating === "Bedingt passend") return 1;
  return 0;
}

function enforceMinRating(currentRating: Rating, minRating: Rating): Rating {
  const cur = ratingOrder(currentRating);
  const min = ratingOrder(minRating);
  if (cur > min) return minRating;
  return currentRating;
}

function componentLabel(key: ComponentKey): string {
  switch (key) {
    case "impulsiv": return "Impulsiv (Tempo/Entscheidung/Durchsetzung)";
    case "intuitiv": return "Intuitiv (Beziehung/Teamgefühl/Kommunikation)";
    case "analytisch": return "Analytisch (Struktur/Planung/Absicherung)";
  }
}

function detectSecondaryCompetition(profile: Triad): SecondaryCompetition {
  const keys = sortKeysByValueDesc(profile);
  const gap12 = profile[keys[0]] - profile[keys[1]];
  const gap23 = profile[keys[1]] - profile[keys[2]];
  const active = gap12 >= DOMINANT_TOP1_MIN_GAP && gap23 <= SECONDARY_COMP_GAP_MAX;
  return { active, top1: keys[0], top2: keys[1], top3: keys[2], gap12, gap23 };
}

function detectFullSymmetry(profile: Triad): boolean {
  const vals = [profile.impulsiv, profile.intuitiv, profile.analytisch];
  return (Math.max(...vals) - Math.min(...vals)) <= F7_FULL_SYMM_TOLERANCE;
}

function balanceIndex(p: Triad): number {
  const sd = stdDev3(p.impulsiv, p.intuitiv, p.analytisch);
  return 1 - sd / MAX;
}

function estimateStressIntensity(leader: Triad, team: Triad): number {
  const biL = balanceIndex(leader);
  const biT = balanceIndex(team);
  const unbalance = (1 - biL + 1 - biT) / 2;
  return clamp01(unbalance);
}

function applyControlledStress(profile: Triad, intensity: number, k = 10, midDecay = 0.15): Triad {
  const p = { ...profile };
  const i = clamp01(intensity);
  const keys = sortKeysByValueDesc(p);
  const delta = k * i;

  p[keys[0]] = clamp(p[keys[0]] + delta);
  p[keys[2]] = clamp(p[keys[2]] - delta);
  p[keys[1]] = clamp(p[keys[1]] - midDecay * delta);

  const comp = detectSecondaryCompetition(profile);
  if (comp.active) {
    const noise = 0.25 * delta;
    p[comp.top2] = clamp(p[comp.top2] + noise);
    p[comp.top3] = clamp(p[comp.top3] - noise);
  }

  return p;
}

function applyUncontrolledStress(profile: Triad, intensity: number, k = 10): Triad {
  const p = { ...profile };
  const i = clamp01(intensity);
  const delta = k * i;
  const keys = sortKeysByValueDesc(profile);
  const comp = detectSecondaryCompetition(profile);

  if (!comp.active) {
    const top1Loss = 0.6 * delta;
    const lowLoss = 0.2 * delta;
    p[keys[1]] = clamp(p[keys[1]] + delta);
    p[keys[0]] = clamp(p[keys[0]] - top1Loss);
    p[keys[2]] = clamp(p[keys[2]] - lowLoss);
    return p;
  }

  const secGain = 0.8 * delta;
  const top1Loss = 0.9 * delta;
  p[comp.top2] = clamp(p[comp.top2] + secGain);
  p[comp.top3] = clamp(p[comp.top3] + secGain);
  p[comp.top1] = clamp(p[comp.top1] - top1Loss);
  return p;
}

type BaseEval = {
  differences: Record<ComponentKey, number>;
  categories: Record<ComponentKey, DiffCategory>;
  indices: { TFS: number };
  flags: {
    dominanceRisk: boolean;
    intuitiveBreakRisk: boolean;
    dualLeader: boolean;
    clearTeam: boolean;
    gapLeader: number;
    gapTeam: number;
    leaderFullSymmetry: boolean;
    teamFullSymmetry: boolean;
    leaderSecondaryCompetition: SecondaryCompetition;
    teamSecondaryCompetition: SecondaryCompetition;
  };
  rating: Rating;
};

function teamFitBase(leader: Triad, team: Triad): BaseEval {
  const tfsPass = 0.65;
  const tfsBorder = 0.50;
  const dominanceLeaderHigh = 60;
  const teamIntuitiveHigh = 35;
  const leaderIntuitiveLow = 15;
  const dualGapMax = 5;
  const clearGapMin = 15;
  const wY = 0.35;
  const wR = 0.35;
  const wB = 0.30;

  const dR = Math.abs(leader.impulsiv - team.impulsiv);
  const dY = Math.abs(leader.intuitiv - team.intuitiv);
  const dB = Math.abs(leader.analytisch - team.analytisch);

  const fitR = 1 - dR / MAX;
  const fitY = 1 - dY / MAX;
  const fitB = 1 - dB / MAX;
  const TFS = wY * fitY + wR * fitR + wB * fitB;

  const cR = classifyDiff(dR);
  const cY = classifyDiff(dY);
  const cB = classifyDiff(dB);

  const countC = [dR, dY, dB].filter(d => d > 20).length;
  const countB = [dR, dY, dB].filter(d => d > 10 && d <= 20).length;

  const dominanceRisk = Math.max(leader.impulsiv, leader.intuitiv, leader.analytisch) >= dominanceLeaderHigh;
  const intuitiveBreakRisk = team.intuitiv >= teamIntuitiveHigh && leader.intuitiv <= leaderIntuitiveLow;

  const leaderKeys = sortKeysByValueDesc(leader);
  const teamKeys = sortKeysByValueDesc(team);
  const gapLeader = leader[leaderKeys[0]] - leader[leaderKeys[1]];
  const gapTeam = team[teamKeys[0]] - team[teamKeys[1]];
  const dualLeader = gapLeader <= dualGapMax;
  const clearTeam = gapTeam >= clearGapMin;

  const leaderSecondaryCompetition = detectSecondaryCompetition(leader);
  const teamSecondaryCompetition = detectSecondaryCompetition(team);
  const leaderFullSymmetry = detectFullSymmetry(leader);
  const teamFullSymmetry = detectFullSymmetry(team);

  const nonFit = countC >= 2 || (dominanceRisk && countC >= 1) || TFS < tfsBorder;
  const conditionalFit = countC === 1 || countB >= 2 || intuitiveBreakRisk || (dualLeader && clearTeam) || (TFS >= tfsBorder && TFS < tfsPass);

  let rating: Rating = "Passend";
  if (nonFit) rating = "Nicht passend";
  else if (conditionalFit) rating = "Bedingt passend";

  return {
    differences: { impulsiv: dR, intuitiv: dY, analytisch: dB },
    categories: { impulsiv: cR, intuitiv: cY, analytisch: cB },
    indices: { TFS },
    flags: { dominanceRisk, intuitiveBreakRisk, dualLeader, clearTeam, gapLeader, gapTeam, leaderFullSymmetry, teamFullSymmetry, leaderSecondaryCompetition, teamSecondaryCompetition },
    rating,
  };
}

function applyLeadershipRules(stateKey: StateKey, baseEval: BaseEval, leader: Triad, team: Triad, intensity: number): MatchEvaluation {
  const eval2: MatchEvaluation = JSON.parse(JSON.stringify(baseEval));
  eval2.flags.leadershipRules = [];
  eval2.flags.leadershipRuleFlags = {};

  let tfs = eval2.indices.TFS;
  let rating = eval2.rating;

  function addRule(code: string, title: string, message: string, minRating: Rating | null = null, tfsPenalty = 0) {
    eval2.flags.leadershipRules.push({ code, title, message, minRating, tfsPenalty });
    eval2.flags.leadershipRuleFlags[code] = true;
    if (tfsPenalty > 0) {
      tfs = clamp01(tfs - tfsPenalty);
    }
    if (minRating) {
      rating = enforceMinRating(rating, minRating);
    }
  }

  if (leader.impulsiv < F1_MIN_STEERING_IMP && leader.analytisch < F1_MIN_STEERING_ANA) {
    addRule("F1", "Steuerungsminimum fehlt",
      "Impulsiv und Analytisch sind gleichzeitig sehr niedrig. Das reduziert Entscheidungs- und Steuerungsfähigkeit. Führung wird schnell als unklar erlebt.",
      "Bedingt passend", 0);
  }

  if (team.intuitiv >= F2_TEAM_INT_HIGH && leader.intuitiv <= F2_LEADER_INT_LOW && leader.analytisch >= F2_LEADER_ANA_HIGH) {
    addRule("F2", "Kältebruch-Risiko",
      "Das Team braucht Nähe und Abstimmung (Intuitiv hoch). Die Führung ist intuitiv niedrig, aber analytisch sehr hoch. Das kann als sachlich-distanziert erlebt werden.",
      "Bedingt passend", 0.03);
  }

  if (leader.impulsiv >= F3_LEADER_IMP_OVERDRIVE && team.impulsiv <= F3_TEAM_IMP_LOW) {
    const hasAnyC = Object.values(eval2.categories).some(c => c === "C");
    addRule("F3", "Overdrive-Risiko",
      "Die Führung taktet deutlich schneller als das Team. Risiko: Überfahren, Widerstand, Reibung im Alltag.",
      hasAnyC ? "Nicht passend" : "Bedingt passend", 0.04);
  }

  if (team.analytisch >= F4_TEAM_ANA_HIGH && leader.analytisch <= F4_LEADER_ANA_LOW) {
    const hasAnyC = Object.values(eval2.categories).some(c => c === "C");
    addRule("F4", "Strukturlücke",
      "Das Team erwartet Struktur und Standards (Analytisch hoch). Die Führung ist dort sehr niedrig. Risiko: fehlende Prozesse, Unklarheit, Nacharbeit.",
      hasAnyC ? "Nicht passend" : "Bedingt passend", 0.04);
  }

  const leaderKeys = sortKeysByValueDesc(leader);
  const teamKeys = sortKeysByValueDesc(team);
  const gapLeader = leader[leaderKeys[0]] - leader[leaderKeys[1]];
  const gapTeam = team[teamKeys[0]] - team[teamKeys[1]];

  if (gapLeader <= F5_LEADERSHIP_CLARITY_LOW_GAP) {
    if (gapTeam >= F5_TEAM_CLEAR_GAP) {
      addRule("F5", "Leitklarheit niedrig",
        "Die Führung hat sehr geringe Leitklarheit. Das Team ist klar dominant und erwartet eine klare Linie. Ohne Entscheidungsregeln entsteht schnell Reibung.",
        "Bedingt passend", 0.02);
    } else {
      addRule("F5", "Leitklarheit niedrig",
        "Die Führung hat sehr geringe Leitklarheit. Das kann zu wechselnder Steuerungslogik führen, besonders bei Zeitdruck.",
        null, 0.01);
    }
  }

  if (stateKey === "uncontrolledStress" && eval2.flags.leaderSecondaryCompetition?.active) {
    const penalty = F6_SECONDARY_COMP_PENALTY_BASE * clamp01(intensity);
    addRule("F6", "Sekundär-Konkurrenz unter Stress",
      "Bei unkontrolliertem Stress konkurrieren die 2. und 3. Komponente der Führung. Dadurch wirkt der Führungsstil inkonsistenter.",
      "Bedingt passend", penalty);
  }

  if (eval2.flags.leaderFullSymmetry) {
    const penalty = stateKey === "uncontrolledStress" ? F7_FULL_SYMM_PENALTY_UNCONTROLLED : F7_FULL_SYMM_PENALTY_NORMAL;
    const stressNote = stateKey === "uncontrolledStress"
      ? " Unter unkontrolliertem Stress wird dieses Risiko deutlich stärker: Ohne klare Leitstruktur fehlt der Rückfallmechanismus – Führungsverhalten wird sprunghaft und unberechenbar."
      : "";
    addRule("F7", "Vollsymmetrie – fehlende Leitstruktur",
      `Das Führungsprofil zeigt keine klare Leitkomponente (alle Werte innerhalb von ${F7_FULL_SYMM_TOLERANCE} Punkten). Es fehlt eine stabile Steuerungslogik. Die Führung wechselt situativ zwischen den Arbeitsweisen – das Team erlebt keine klare Linie.${stressNote}`,
      stateKey === "uncontrolledStress" ? "Bedingt passend" : null, penalty);
  }

  eval2.indices.TFS_beforeLeadershipRules = baseEval.indices.TFS;
  eval2.indices.TFS = tfs;
  eval2.rating_beforeLeadershipRules = baseEval.rating;
  eval2.rating = rating;

  return eval2;
}

function buildStateTexts(stateName: string, leader: Triad, team: Triad, evaluation: MatchEvaluation, stateKey: StateKey, intensity: number): MatchTexts {
  const { differences, categories, indices, flags, rating } = evaluation;

  const ratingHeadline =
    rating === "Passend"
      ? "Passung ist stabil: Führungsstil und Team-DNA greifen gut ineinander."
      : rating === "Bedingt passend"
        ? "Passung ist möglich, aber es gibt erkennbare Reibungsfelder, die aktiv geführt werden müssen."
        : "Passung ist kritisch: Es besteht ein hohes Risiko, dass Führung und Teamstruktur gegeneinander arbeiten.";

  const reasons: string[] = [];

  const cKeys = COMPONENTS.filter(k => categories[k] === "C");
  const bKeys = COMPONENTS.filter(k => categories[k] === "B");

  if (cKeys.length >= 1) {
    reasons.push(
      `Es gibt ${cKeys.length} starke${cKeys.length > 1 ? "" : "n"} Strukturbruch${cKeys.length > 1 ? "e" : ""} zwischen Führung und Team: ` +
      `${cKeys.map(k => `${componentLabel(k)} (Δ ${differences[k]})`).join(", ")}.`
    );
  }
  if (bKeys.length >= 1) {
    reasons.push(
      `${bKeys.length > 1 ? "Es liegen" : "Es liegt"} ${bKeys.length} moderate Verschiebung${bKeys.length > 1 ? "en" : ""} vor: ` +
      `${bKeys.map(k => `${componentLabel(k)} (Δ ${differences[k]})`).join(", ")}.`
    );
  }

  if (flags.intuitiveBreakRisk) {
    reasons.push("Team ist stark intuitiv, Führung ist dort sehr niedrig – Risiko: Beziehungsabriss.");
  }
  if (flags.dominanceRisk) {
    reasons.push("Führung zeigt sehr hohe Dominanz – Risiko: Übersteuerung unter Druck.");
  }
  if (flags.dualLeader && flags.clearTeam) {
    reasons.push("Führung hat Doppeldominanz, Team ist klar dominant – Team erwartet klare Führungs-Handschrift.");
  }

  if (flags.leaderSecondaryCompetition?.active) {
    const sc = flags.leaderSecondaryCompetition;
    reasons.push(
      `Sekundär-Konkurrenz (Führung): ${componentLabel(sc.top2)} und ${componentLabel(sc.top3)} sind nahezu gleich stark (Δ ${sc.gap23}). Unter Stress können diese beiden Steuerungsachsen konkurrieren.`
    );
  }

  if (flags.leadershipRules?.length) {
    reasons.push(
      "Führungsregeln: " +
      flags.leadershipRules.map(r => `${r.code}: ${r.title} – ${r.message}`).join(" ")
    );
  }

  const tfsPct = Math.round(indices.TFS * 100);
  const tfsPctBefore = indices.TFS_beforeLeadershipRules !== undefined
    ? Math.round(indices.TFS_beforeLeadershipRules * 100)
    : null;

  if (tfsPctBefore !== null && tfsPctBefore !== tfsPct) {
    reasons.push(`Team-Fit-Score durch Führungsregeln angepasst: ${tfsPctBefore} % → ${tfsPct} %.`);
  } else {
    reasons.push(`Team-Fit-Score: ${tfsPct} %`);
  }

  if (stateKey === "controlledStress") {
    reasons.push(
      `Stresslogik (kontrolliert, Intensität ${Math.round(intensity * 100)} %): Die stärkste Komponente wird dominanter.`
    );
  } else if (stateKey === "uncontrolledStress") {
    reasons.push(
      `Stresslogik (unkontrolliert, Intensität ${Math.round(intensity * 100)} %): Die zweitstärkste Komponente wird sichtbarer. Bei Top2 ≈ Top3 konkurrieren beide.`
    );
  }

  const compLines = COMPONENTS.map(k => {
    const cat = categories[k];
    const d = differences[k];
    const fit = Math.round((1 - d / MAX) * 100);
    const catText = cat === "A" ? "harmonisch" : cat === "B" ? "moderate Verschiebung" : "starker Strukturbruch";
    return `${componentLabel(k)}: Δ ${d} → ${catText} | Fit: ${fit} %`;
  });

  return {
    title: `${stateName}: Leader–Team-Match`,
    rating,
    ratingHeadline,
    summary: [ratingHeadline, ...reasons].join(" "),
    componentBreakdown: compLines.join("\n"),
  };
}

function buildStressComparison(normalEval: MatchEvaluation, controlledEval: MatchEvaluation, uncontrolledEval: MatchEvaluation, intensity: number): StressComparison {
  const n = ratingOrder(normalEval.rating);
  const c = ratingOrder(controlledEval.rating);
  const u = ratingOrder(uncontrolledEval.rating);

  const controlledDelta = c - n;
  const uncontrolledDelta = u - n;

  function deltaText(delta: number): string {
    if (delta === 0) return "bleibt gleich";
    if (delta === -1) return "verschlechtert sich um eine Stufe";
    if (delta <= -2) return "kippt deutlich";
    if (delta === 1) return "verbessert sich um eine Stufe";
    if (delta >= 2) return "verbessert sich deutlich";
    return "ändert sich";
  }

  const summary =
    `Stressvergleich (Intensität: ${Math.round(intensity * 100)} %): ` +
    `Unter kontrolliertem Stress ${deltaText(controlledDelta)} die Passung (${normalEval.rating} → ${controlledEval.rating}). ` +
    `Unter unkontrolliertem Stress ${deltaText(uncontrolledDelta)} die Passung (${normalEval.rating} → ${uncontrolledEval.rating}).`;

  const guidance = [
    "Kontrollierter Stress: Die stärkste Komponente wird dominanter – mehr Klarheit, aber Tunnelblick-Risiko.",
    "Unkontrollierter Stress: Die zweitstärkste Komponente wird sichtbarer; bei Top2 ≈ Top3 konkurrieren beide – Verhalten wirkt wechselhafter.",
    "Wenn die Passung unter unkontrolliertem Stress kippt, braucht es klare Entscheidungsregeln, Kommunikationsrhythmus und Eskalationslogik.",
  ].join("\n");

  return {
    summary,
    guidance,
    flags: {
      worsensControlled: controlledDelta < 0,
      worsensUncontrolled: uncontrolledDelta < 0,
      worsensAny: controlledDelta < 0 || uncontrolledDelta < 0,
      worsensByTwoOrMoreControlled: controlledDelta <= -2,
      worsensByTwoOrMoreUncontrolled: uncontrolledDelta <= -2,
    },
  };
}

export function leaderTeamMatchFull(input: {
  leader: Triad;
  team: Triad;
  stress?: { intensity?: number; k?: number };
}): LeaderTeamMatchResult {
  const leader = input.leader;
  const team = input.team;
  const k = input.stress?.k ?? 10;

  let intensity = input.stress?.intensity;
  if (typeof intensity !== "number") {
    intensity = estimateStressIntensity(leader, team);
  }
  intensity = clamp01(intensity);

  const normalBase = teamFitBase(leader, team);
  const normalEval = applyLeadershipRules("normal", normalBase, leader, team, intensity);
  const normalTexts = buildStateTexts("Normalzustand", leader, team, normalEval, "normal", intensity);

  const leaderControlled = applyControlledStress(leader, intensity, k);
  const teamControlled = applyControlledStress(team, intensity, k);
  const controlledBase = teamFitBase(leaderControlled, teamControlled);
  const controlledEval = applyLeadershipRules("controlledStress", controlledBase, leaderControlled, teamControlled, intensity);
  const controlledTexts = buildStateTexts("Kontrollierter Stress", leaderControlled, teamControlled, controlledEval, "controlledStress", intensity);

  const leaderUncontrolled = applyUncontrolledStress(leader, intensity, k);
  const teamUncontrolled = applyUncontrolledStress(team, intensity, k);
  const uncontrolledBase = teamFitBase(leaderUncontrolled, teamUncontrolled);
  const uncontrolledEval = applyLeadershipRules("uncontrolledStress", uncontrolledBase, leaderUncontrolled, teamUncontrolled, intensity);
  const uncontrolledTexts = buildStateTexts("Unkontrollierter Stress", leaderUncontrolled, teamUncontrolled, uncontrolledEval, "uncontrolledStress", intensity);

  const comparison = buildStressComparison(normalEval, controlledEval, uncontrolledEval, intensity);

  return {
    input: { leader, team, stress: { intensity, k } },
    normal: { leader, team, evaluation: normalEval, texts: normalTexts },
    controlledStress: { leader: leaderControlled, team: teamControlled, evaluation: controlledEval, texts: controlledTexts },
    uncontrolledStress: { leader: leaderUncontrolled, team: teamUncontrolled, evaluation: uncontrolledEval, texts: uncontrolledTexts },
    stressComparison: comparison,
  };
}
