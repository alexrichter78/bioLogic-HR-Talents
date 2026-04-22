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
  teamGoal: TeamGoal = null,
  lang?: string
): LeadershipAssessmentResult {
  const en = lang === "EN";
  const isLeadership = role === "fuehrung" || role === "Führungskraft" || role === "leadership";

  const actorNom = isLeadership
    ? (en ? "The leader" : "Die Führungskraft")
    : (en ? "The team member" : "Das Teammitglied");
  const actorGen = isLeadership
    ? (en ? "the leader" : "der Führungskraft")
    : (en ? "the team member" : "des Teammitglieds");

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
    systemReasons.push(en
      ? `${actorNom} is structurally close to the existing team logic.`
      : `${actorNom} liegt strukturell nah an der bestehenden Teamlogik.`);
    if (sameTop) {
      systemReasons.push(en
        ? `The primary orientation of ${actorGen} matches the primary orientation of the team.`
        : `Die Hauptprägung ${actorGen} entspricht der Hauptprägung des Teams.`);
    }
  } else if (
    bothClearDifferentTop ||
    gaps.totalGap >= 34 ||
    gaps.maxGap >= 16 ||
    (!sameTop && gaps.totalGap >= 24)
  ) {
    systemImpactLabel = "Transformation";
    systemReasons.push(en
      ? `${actorNom} brings a distinctly different working and leadership logic to the team.`
      : `${actorNom} bringt eine deutlich andere Arbeits- und Führungslogik in das Team.`);
    if (bothClearDifferentTop) {
      systemReasons.push(en
        ? `Both team and ${isLeadership ? "leader" : "team member"} have a clear but different primary orientation.`
        : `Sowohl Team als auch ${isLeadership ? "Führungskraft" : "Teammitglied"} haben eine klare, aber unterschiedliche Hauptprägung.`);
    }
  } else {
    systemImpactLabel = "Spannung";
    systemReasons.push(en
      ? `${actorNom} introduces noticeably different emphases without fully shifting the team logic.`
      : `${actorNom} setzt spürbar andere Akzente, ohne die Teamlogik vollständig zu drehen.`);
  }

  let effortLabel: EffortLabel;
  const effortReasons: string[] = [];

  if (systemImpactLabel === "Verstärkung" && gaps.totalGap <= 18 && gaps.maxGap <= 8) {
    effortLabel = "Niedrig";
    effortReasons.push(en
      ? `${actorNom} is close to the existing team logic.`
      : `${actorNom} liegt nah an der bestehenden Teamlogik.`);
  } else if (
    systemImpactLabel === "Transformation" ||
    gaps.totalGap >= 34 ||
    gaps.maxGap >= 16
  ) {
    effortLabel = "Hoch";
    effortReasons.push(en
      ? `Integrating ${actorGen} will likely require intensive alignment and support.`
      : `Die Integration ${actorGen} wird voraussichtlich intensiven Abstimmungs- und Begleitungsbedarf erzeugen.`);
  } else {
    effortLabel = "Mittel";
    effortReasons.push(en
      ? "Integration is possible but should be actively supported."
      : "Die Integration ist möglich, sollte aber aktiv begleitet werden.");
  }

  let goalLabel: GoalFitLabel;
  const goalReasons: string[] = [];

  if (!teamGoal) {
    goalLabel = "Kein Ziel gewählt";
    goalReasons.push(en
      ? "No current team goal has been selected."
      : "Es wurde kein aktuelles Teamziel ausgewählt.");
  } else {
    const targetComponent = getGoalComponent(teamGoal)!;
    const sorted = getSortedComponents(person);
    const top1Key = sorted[0].key;
    const top2Key = sorted[1].key;
    const gap1 = sorted[0].value - sorted[1].value;
    const gap2 = sorted[1].value - sorted[2].value;
    const EQ_TOL = 5;

    const personIsBalanced = gap1 <= EQ_TOL && gap2 <= EQ_TOL;
    const personIsDual = gap1 <= EQ_TOL && gap2 > EQ_TOL;

    if (personIsBalanced) {
      goalLabel = "Teilweise passend";
    } else if (top1Key === targetComponent && gap1 > EQ_TOL) {
      goalLabel = "Passend";
    } else if (personIsDual && (top1Key === targetComponent || top2Key === targetComponent)) {
      goalLabel = "Teilweise passend";
    } else {
      goalLabel = "Kritisch";
    }

    const GOAL_NAMES_DE: Record<string, string> = { umsetzung: "Umsetzung und Ergebnisse", analyse: "Analyse und Struktur", zusammenarbeit: "Zusammenarbeit und Kommunikation" };
    const GOAL_NAMES_EN: Record<string, string> = { umsetzung: "Execution and results", analyse: "Analysis and structure", zusammenarbeit: "Collaboration and communication" };
    const goalName = (en ? GOAL_NAMES_EN : GOAL_NAMES_DE)[teamGoal] || teamGoal;

    if (goalLabel === "Passend") {
      goalReasons.push(en
        ? `${actorNom} brings the right strength for the team goal "${goalName}".`
        : `${actorNom} bringt für das Teamziel ${goalName} die passende Stärke mit.`);
    } else if (goalLabel === "Teilweise passend") {
      goalReasons.push(en
        ? `${actorNom} partially supports the team goal "${goalName}", but is slightly below the team level in this area.`
        : `${actorNom} unterstützt das Teamziel ${goalName} teilweise, liegt aber etwas unter dem Teamniveau in diesem Bereich.`);
    } else {
      goalReasons.push(en
        ? `${actorNom} works significantly differently from what the team goal "${goalName}" requires.`
        : `${actorNom} arbeitet deutlich anders als das Teamziel ${goalName} es erfordert.`);
    }
  }

  const steuerung = isLeadership ? "Führungssteuerung" : "Teamführung";
  const steuerungEN = isLeadership ? "leadership steering" : "team management";

  const systemText =
    systemImpactLabel === "Verstärkung"
      ? (en
          ? `${actorNom} will likely stabilise and reinforce the existing team logic.`
          : `${actorNom} wird die bestehende Teamlogik voraussichtlich eher stabilisieren und verstärken.`)
      : systemImpactLabel === "Spannung"
      ? (en
          ? `${actorNom} will likely set different emphases, generating noticeable tension but also development.`
          : `${actorNom} wird voraussichtlich andere Akzente setzen und damit spürbare Reibung, aber auch Entwicklung auslösen.`)
      : (en
          ? `${actorNom} will likely significantly change the team and introduce a new working logic.`
          : `${actorNom} wird das Team voraussichtlich deutlich verändern und eine neue Arbeitslogik hineinbringen.`);

  const effortText =
    effortLabel === "Niedrig"
      ? (en
          ? `Integration is expected to proceed smoothly. Low support needs — normal ${steuerungEN} is sufficient.`
          : `Die Integration verläuft voraussichtlich reibungsarm. Geringer Begleitungsbedarf, normale ${steuerung} ist ausreichend.`)
      : effortLabel === "Mittel"
      ? (en
          ? "Integration is achievable but should be deliberately supported. Regular alignment and clear expectations will accelerate the process."
          : "Die Integration ist machbar, sollte aber gezielt begleitet werden. Regelmässige Abstimmung und klare Erwartungen beschleunigen den Prozess.")
      : (en
          ? `Integration requires intensive support. Structured onboarding, close alignment and active ${steuerungEN} are necessary.`
          : `Die Integration erfordert intensive Begleitung. Strukturierte Onboarding-Massnahmen, enge Abstimmung und aktive ${steuerung} sind notwendig.`);

  const goalText =
    goalLabel === "Kein Ziel gewählt"
      ? (en ? "No functional goal has been selected for the team." : "Für das Team wurde aktuell kein Funktionsziel ausgewählt.")
      : goalLabel === "Passend"
      ? (en ? `${actorNom} is a good fit for the current team goal.` : `${actorNom} passt gut zum aktuellen Teamziel.`)
      : goalLabel === "Teilweise passend"
      ? (en ? `${actorNom} only partially supports the current team goal.` : `${actorNom} unterstützt das aktuelle Teamziel nur teilweise.`)
      : (en ? `${actorNom} works significantly differently from what the current team goal requires.` : `${actorNom} arbeitet deutlich anders als das aktuelle Teamziel es erfordert.`);

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
