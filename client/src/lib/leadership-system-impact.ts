import type { ComponentKey } from "./bio-types";

type Profile = {
  impulsiv: number;
  intuitiv: number;
  analytisch: number;
};

type ProfileKind = "BALANCED" | "CLEAR" | "MIXED";

export type SystemImpactLabel = "Verstärkung" | "Spannung" | "Transformation";
type EffortLabel = "Niedrig" | "Mittel" | "Hoch";
type GoalFitLabel = "Passend" | "Teilweise passend" | "Kritisch" | "Kein Ziel gewählt";
type TeamGoal = "umsetzung" | "analyse" | "zusammenarbeit" | null;

export type LeadershipAssessmentResult = {
  show: boolean;
  systemImpact: {
    label: SystemImpactLabel | null;
    text: string | null;
    variant: "success" | "warning" | "danger" | null;
    reasons: string[];
  };
  integrationEffort: {
    label: EffortLabel | null;
    text: string | null;
    variant: "success" | "warning" | "danger" | null;
    reasons: string[];
  };
  teamGoalImpact: {
    label: GoalFitLabel | null;
    text: string | null;
    variant: "success" | "warning" | "danger" | "neutral" | null;
    reasons: string[];
    selectedGoal: TeamGoal;
  };
  metrics: {
    totalGap: number;
    maxGap: number;
    personTop: ComponentKey;
    teamTop: ComponentKey;
    personTopGap: number;
    teamTopGap: number;
    sameTop: boolean;
    personSpread: number;
    teamSpread: number;
    personKind: ProfileKind;
    teamKind: ProfileKind;
    bothBalanced: boolean;
    bothClear: boolean;
    bothClearDifferentTop: boolean;
    bothClearSameTop: boolean;
  } | null;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeProfile(profile: Profile): Profile {
  return {
    impulsiv: clampPercent(profile.impulsiv),
    intuitiv: clampPercent(profile.intuitiv),
    analytisch: clampPercent(profile.analytisch),
  };
}

function getSortedComponents(profile: Profile): Array<{ key: ComponentKey; value: number }> {
  return [
    { key: "impulsiv", value: profile.impulsiv },
    { key: "intuitiv", value: profile.intuitiv },
    { key: "analytisch", value: profile.analytisch },
  ].sort((a, b) => b.value - a.value);
}

function getTopComponent(profile: Profile): ComponentKey {
  return getSortedComponents(profile)[0].key;
}

function getTopGap(profile: Profile): number {
  const sorted = getSortedComponents(profile);
  return sorted[0].value - sorted[1].value;
}

function getSpread(profile: Profile): number {
  const values = [profile.impulsiv, profile.intuitiv, profile.analytisch];
  return Math.max(...values) - Math.min(...values);
}

function getProfileKind(profile: Profile): ProfileKind {
  const spread = getSpread(profile);
  const topGap = getTopGap(profile);
  if (spread <= 10) return "BALANCED";
  if (topGap >= 8) return "CLEAR";
  return "MIXED";
}

function getGapMetrics(person: Profile, team: Profile) {
  const gapImpulsiv = Math.abs(person.impulsiv - team.impulsiv);
  const gapIntuitiv = Math.abs(person.intuitiv - team.intuitiv);
  const gapAnalytisch = Math.abs(person.analytisch - team.analytisch);
  const totalGap = gapImpulsiv + gapIntuitiv + gapAnalytisch;
  const maxGap = Math.max(gapImpulsiv, gapIntuitiv, gapAnalytisch);
  return { gapImpulsiv, gapIntuitiv, gapAnalytisch, totalGap, maxGap };
}

function getGoalComponent(goal: TeamGoal): ComponentKey | null {
  switch (goal) {
    case "umsetzung": return "impulsiv";
    case "analyse": return "analytisch";
    case "zusammenarbeit": return "intuitiv";
    default: return null;
  }
}

const emptyResult: LeadershipAssessmentResult = {
  show: false,
  systemImpact: { label: null, text: null, variant: null, reasons: [] },
  integrationEffort: { label: null, text: null, variant: null, reasons: [] },
  teamGoalImpact: { label: null, text: null, variant: null, reasons: [], selectedGoal: null },
  metrics: null,
};

export function calculateLeadershipAssessment(
  personProfile: Profile,
  teamProfile: Profile,
  role: string,
  teamGoal: TeamGoal = null
): LeadershipAssessmentResult {
  if (role !== "fuehrung" && role !== "Führungskraft" && role !== "leadership") {
    return emptyResult;
  }

  const person = normalizeProfile(personProfile);
  const team = normalizeProfile(teamProfile);
  const gaps = getGapMetrics(person, team);

  const personTop = getTopComponent(person);
  const teamTop = getTopComponent(team);
  const personTopGap = getTopGap(person);
  const teamTopGap = getTopGap(team);
  const personSpread = getSpread(person);
  const teamSpread = getSpread(team);
  const personKind = getProfileKind(person);
  const teamKind = getProfileKind(team);
  const sameTop = personTop === teamTop;

  const bothBalanced = personKind === "BALANCED" && teamKind === "BALANCED";
  const bothClear = personKind === "CLEAR" && teamKind === "CLEAR";
  const bothClearDifferentTop = bothClear && !sameTop;
  const bothClearSameTop = bothClear && sameTop;

  let systemImpactLabel: SystemImpactLabel;
  const systemReasons: string[] = [];

  if (
    (bothBalanced && gaps.maxGap <= 6 && gaps.totalGap <= 15) ||
    (sameTop && gaps.totalGap <= 18 && gaps.maxGap <= 8) ||
    (bothClearSameTop && gaps.totalGap <= 24 && gaps.maxGap <= 12)
  ) {
    systemImpactLabel = "Verstärkung";
    systemReasons.push("Die Führungskraft liegt strukturell nah an der bestehenden Teamlogik.");
    if (sameTop) {
      systemReasons.push("Die Hauptprägung der Führungskraft entspricht der Hauptprägung des Teams.");
    }
  } else if (
    bothClearDifferentTop ||
    gaps.totalGap >= 34 ||
    gaps.maxGap >= 16 ||
    (!sameTop && gaps.totalGap >= 24)
  ) {
    systemImpactLabel = "Transformation";
    systemReasons.push("Die Führungskraft bringt eine deutlich andere Arbeits- und Führungslogik in das Team.");
    if (bothClearDifferentTop) {
      systemReasons.push("Sowohl Team als auch Führungskraft haben eine klare, aber unterschiedliche Hauptprägung.");
    }
  } else {
    systemImpactLabel = "Spannung";
    systemReasons.push("Die Führungskraft setzt spürbar andere Akzente, ohne die Teamlogik vollständig zu drehen.");
  }

  let effortLabel: EffortLabel;
  const effortReasons: string[] = [];

  if (systemImpactLabel === "Verstärkung" && gaps.totalGap <= 18 && gaps.maxGap <= 8) {
    effortLabel = "Niedrig";
    effortReasons.push("Die Führungskraft liegt nah an der bestehenden Teamlogik.");
  } else if (
    systemImpactLabel === "Transformation" ||
    gaps.totalGap >= 34 ||
    gaps.maxGap >= 16
  ) {
    effortLabel = "Hoch";
    effortReasons.push("Die Integration der Führungskraft wird voraussichtlich intensiven Abstimmungs- und Begleitungsbedarf erzeugen.");
  } else {
    effortLabel = "Mittel";
    effortReasons.push("Die Integration ist möglich, sollte aber aktiv begleitet werden.");
  }

  let goalLabel: GoalFitLabel;
  const goalReasons: string[] = [];

  if (!teamGoal) {
    goalLabel = "Kein Ziel gewählt";
    goalReasons.push("Es wurde kein aktuelles Teamziel ausgewählt.");
  } else {
    const targetComponent = getGoalComponent(teamGoal)!;
    const dominant = getTopComponent(person);
    const dominantValue = person[dominant];
    const targetValue = person[targetComponent];
    const targetGapToTop = dominantValue - targetValue;
    const targetIsDominant = dominant === targetComponent;

    let score = 0;
    score += Math.min(60, Math.round((targetValue / 100) * 60));
    if (targetIsDominant) score += 25;
    if (!targetIsDominant && targetGapToTop <= 5) score += 10;
    if (targetGapToTop > 5) score -= Math.min(20, Math.round((targetGapToTop - 5) * 2));

    if (teamGoal === "umsetzung" && person.analytisch >= 45 && person.impulsiv < 35) score -= 12;
    if (teamGoal === "analyse" && person.impulsiv >= 40 && person.analytisch < 40) score -= 12;
    if (teamGoal === "zusammenarbeit" && dominant !== "intuitiv" && dominantValue >= 45 && person.intuitiv < 35) score -= 12;

    score = Math.max(0, Math.min(100, score));

    if (teamGoal === "umsetzung") {
      if (person.impulsiv < 28 && dominant !== "impulsiv") goalLabel = "Kritisch";
      else if (targetIsDominant && person.impulsiv >= 36) goalLabel = "Passend";
      else if (score >= 62) goalLabel = "Passend";
      else if (score >= 42) goalLabel = "Teilweise passend";
      else goalLabel = "Kritisch";
    } else if (teamGoal === "analyse") {
      if (person.analytisch < 30 && dominant !== "analytisch") goalLabel = "Kritisch";
      else if (targetIsDominant && person.analytisch >= 40) goalLabel = "Passend";
      else if (score >= 62) goalLabel = "Passend";
      else if (score >= 42) goalLabel = "Teilweise passend";
      else goalLabel = "Kritisch";
    } else {
      if (person.intuitiv < 28 && dominant !== "intuitiv") goalLabel = "Kritisch";
      else if (targetIsDominant && person.intuitiv >= 36) goalLabel = "Passend";
      else if (score >= 62) goalLabel = "Passend";
      else if (score >= 42) goalLabel = "Teilweise passend";
      else goalLabel = "Kritisch";
    }

    if (teamGoal === "umsetzung") {
      if (goalLabel === "Passend") goalReasons.push("Die Führungskraft bringt eine zum aktuellen Teamziel passende Umsetzungsorientierung mit.");
      else if (goalLabel === "Teilweise passend") goalReasons.push("Die Führungskraft unterstützt das Teamziel nur teilweise, da ihre Arbeitsweise nicht konsequent auf Tempo und direkte Umsetzung ausgerichtet ist.");
      else goalReasons.push("Die Führungskraft arbeitet deutlich anders als das aktuelle Teamziel des Teams.");
    } else if (teamGoal === "analyse") {
      if (goalLabel === "Passend") goalReasons.push("Die Führungskraft passt gut zum aktuellen Teamziel des Teams.");
      else if (goalLabel === "Teilweise passend") goalReasons.push("Die Führungskraft unterstützt das Teamziel grundsätzlich, arbeitet aber nicht durchgehend in derselben Logik.");
      else goalReasons.push("Die Führungskraft arbeitet deutlich anders als das aktuelle Teamziel des Teams.");
    } else if (teamGoal === "zusammenarbeit") {
      if (goalLabel === "Passend") goalReasons.push("Die Führungskraft passt gut zum aktuellen Teamziel des Teams.");
      else if (goalLabel === "Teilweise passend") goalReasons.push("Die Führungskraft unterstützt das Teamziel nur teilweise, da ihre Arbeitsweise stärker von einer anderen Logik geprägt ist.");
      else goalReasons.push("Die Führungskraft arbeitet deutlich anders als das aktuelle Teamziel des Teams.");
    }
  }

  const systemText =
    systemImpactLabel === "Verstärkung"
      ? "Die Führungskraft wird die bestehende Teamlogik voraussichtlich eher stabilisieren und verstärken."
      : systemImpactLabel === "Spannung"
      ? "Die Führungskraft wird voraussichtlich andere Akzente setzen und damit spürbare Reibung, aber auch Entwicklung auslösen."
      : "Die Führungskraft wird das Team voraussichtlich deutlich verändern und eine neue Arbeitslogik hineinbringen.";

  const effortText =
    effortLabel === "Niedrig"
      ? "Die Integration verläuft voraussichtlich reibungsarm. Geringer Begleitungsbedarf, normale Führungssteuerung ist ausreichend."
      : effortLabel === "Mittel"
      ? "Die Integration ist machbar, sollte aber gezielt begleitet werden. Regelmässige Abstimmung und klare Erwartungen beschleunigen den Prozess."
      : "Die Integration erfordert intensive Begleitung. Strukturierte Onboarding-Massnahmen, enge Abstimmung und aktive Führungssteuerung sind notwendig.";

  const goalText =
    goalLabel === "Kein Ziel gewählt"
      ? "Für das Team wurde aktuell kein Funktionsziel ausgewählt."
      : goalLabel === "Passend"
      ? "Die Führungskraft passt gut zum aktuellen Teamziel."
      : goalLabel === "Teilweise passend"
      ? "Die Führungskraft unterstützt das aktuelle Teamziel nur teilweise."
      : "Die Führungskraft arbeitet deutlich anders als das aktuelle Teamziel es erfordert.";

  return {
    show: true,
    systemImpact: {
      label: systemImpactLabel,
      text: systemText,
      variant: systemImpactLabel === "Verstärkung" ? "success" : systemImpactLabel === "Spannung" ? "warning" : "danger",
      reasons: systemReasons,
    },
    integrationEffort: {
      label: effortLabel,
      text: effortText,
      variant: effortLabel === "Niedrig" ? "success" : effortLabel === "Mittel" ? "warning" : "danger",
      reasons: effortReasons,
    },
    teamGoalImpact: {
      label: goalLabel,
      text: goalText,
      variant: goalLabel === "Passend" ? "success" : goalLabel === "Teilweise passend" ? "warning" : goalLabel === "Kritisch" ? "danger" : "neutral",
      reasons: goalReasons,
      selectedGoal: teamGoal,
    },
    metrics: {
      totalGap: gaps.totalGap,
      maxGap: gaps.maxGap,
      personTop,
      teamTop,
      personTopGap,
      teamTopGap,
      sameTop,
      personSpread,
      teamSpread,
      personKind,
      teamKind,
      bothBalanced,
      bothClear,
      bothClearDifferentTop,
      bothClearSameTop,
    },
  };
}
