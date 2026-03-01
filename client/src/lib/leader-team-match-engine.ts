import type { Triad, ComponentKey } from "./jobcheck-engine";

const MAX = 67;
const COMPONENTS: ComponentKey[] = ["impulsiv", "intuitiv", "analytisch"];

type DiffCategory = "A" | "B" | "C";
type Rating = "Passend" | "Bedingt passend" | "Nicht passend";

export type MatchEvaluation = {
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
  };
  rating: Rating;
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

function componentLabel(key: ComponentKey): string {
  switch (key) {
    case "impulsiv": return "Impulsiv (Tempo/Entscheidung/Durchsetzung)";
    case "intuitiv": return "Intuitiv (Beziehung/Teamgefühl/Kommunikation)";
    case "analytisch": return "Analytisch (Struktur/Planung/Absicherung)";
  }
}

function balanceIndex(p: Triad): number {
  const sd = stdDev3(p.impulsiv, p.intuitiv, p.analytisch);
  return 1 - sd / MAX;
}

function estimateStressIntensity(leader: Triad, team: Triad): number {
  const biL = balanceIndex(leader);
  const biT = balanceIndex(team);
  const unbalance = (1 - biL + 1 - biT) / 2;
  return clamp(unbalance, 0, 1);
}

function applyControlledStress(profile: Triad, intensity: number, k = 10, midDecay = 0.15): Triad {
  const p = { ...profile };
  const keys = sortKeysByValueDesc(p);
  const delta = k * clamp(intensity, 0, 1);
  p[keys[0]] = clamp(p[keys[0]] + delta);
  p[keys[2]] = clamp(p[keys[2]] - delta);
  p[keys[1]] = clamp(p[keys[1]] - midDecay * delta);
  return p;
}

function applyUncontrolledStress(profile: Triad, intensity: number, k = 10, top1Loss = 0.6, lowLoss = 0.2): Triad {
  const p = { ...profile };
  const keys = sortKeysByValueDesc(p);
  const delta = k * clamp(intensity, 0, 1);
  p[keys[1]] = clamp(p[keys[1]] + delta);
  p[keys[0]] = clamp(p[keys[0]] - top1Loss * delta);
  p[keys[2]] = clamp(p[keys[2]] - lowLoss * delta);
  return p;
}

function teamFit(leader: Triad, team: Triad): MatchEvaluation {
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

  const nonFit = countC >= 2 || (dominanceRisk && countC >= 1) || TFS < tfsBorder;
  const conditionalFit = countC === 1 || countB >= 2 || intuitiveBreakRisk || (dualLeader && clearTeam) || (TFS >= tfsBorder && TFS < tfsPass);

  let rating: Rating = "Passend";
  if (nonFit) rating = "Nicht passend";
  else if (conditionalFit) rating = "Bedingt passend";

  return {
    differences: { impulsiv: dR, intuitiv: dY, analytisch: dB },
    categories: { impulsiv: cR, intuitiv: cY, analytisch: cB },
    indices: { TFS },
    flags: { dominanceRisk, intuitiveBreakRisk, dualLeader, clearTeam, gapLeader, gapTeam },
    rating,
  };
}

function buildTexts(stateName: string, leader: Triad, team: Triad, evalResult: MatchEvaluation): MatchTexts {
  const { differences, categories, indices, flags, rating } = evalResult;

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
      `Zusätzlich ${bKeys.length > 1 ? "liegen" : "liegt"} ${bKeys.length} moderate Verschiebung${bKeys.length > 1 ? "en" : ""} vor: ` +
      `${bKeys.map(k => `${componentLabel(k)} (Δ ${differences[k]})`).join(", ")}.`
    );
  }

  if (flags.intuitiveBreakRisk) {
    reasons.push(
      "Das Team ist stark intuitiv geprägt, die Führungskraft ist dort sehr niedrig. Das erhöht das Risiko für Beziehungsabriss."
    );
  }
  if (flags.dominanceRisk) {
    reasons.push(
      "Die Führungskraft zeigt eine sehr hohe Dominanz in mindestens einer Komponente. In Kombination mit Abweichungen kann das unter Druck zu Übersteuerung führen."
    );
  }
  if (flags.dualLeader && flags.clearTeam) {
    reasons.push(
      "Die Führungskraft hat eine Doppeldominanz, das Team hat eine klare Dominanz. Ohne Entscheidungsregeln entsteht Reibung."
    );
  }

  const tfsPct = Math.round(indices.TFS * 100);
  reasons.push(`Team-Fit-Score: ${tfsPct} %`);

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

function buildStressComparison(normalEval: MatchEvaluation, controlledEval: MatchEvaluation, uncontrolledEval: MatchEvaluation): StressComparison {
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
    `Unter kontrolliertem Stress ${deltaText(controlledDelta)} die Passung (${normalEval.rating} → ${controlledEval.rating}). ` +
    `Unter unkontrolliertem Stress ${deltaText(uncontrolledDelta)} die Passung (${normalEval.rating} → ${uncontrolledEval.rating}).`;

  const guidance = [
    "Kontrollierter Stress: Die stärkste Komponente wird dominanter – mehr Klarheit, aber auch Tunnelblick-Risiko.",
    "Unkontrollierter Stress: Die zweitstärkste Komponente wird sichtbarer und kann die Führungslinie verschieben.",
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
  intensity = clamp(intensity, 0, 1);

  const normalEval = teamFit(leader, team);
  const normalTexts = buildTexts("Normalzustand", leader, team, normalEval);

  const leaderControlled = applyControlledStress(leader, intensity, k);
  const teamControlled = applyControlledStress(team, intensity, k);
  const controlledEval = teamFit(leaderControlled, teamControlled);
  const controlledTexts = buildTexts("Kontrollierter Stress", leaderControlled, teamControlled, controlledEval);

  const leaderUncontrolled = applyUncontrolledStress(leader, intensity, k);
  const teamUncontrolled = applyUncontrolledStress(team, intensity, k);
  const uncontrolledEval = teamFit(leaderUncontrolled, teamUncontrolled);
  const uncontrolledTexts = buildTexts("Unkontrollierter Stress", leaderUncontrolled, teamUncontrolled, uncontrolledEval);

  const comparison = buildStressComparison(normalEval, controlledEval, uncontrolledEval);

  return {
    input: { leader, team, stress: { intensity, k } },
    normal: { leader, team, evaluation: normalEval, texts: normalTexts },
    controlledStress: { leader: leaderControlled, team: teamControlled, evaluation: controlledEval, texts: controlledTexts },
    uncontrolledStress: { leader: leaderUncontrolled, team: teamUncontrolled, evaluation: uncontrolledEval, texts: uncontrolledTexts },
    stressComparison: comparison,
  };
}
