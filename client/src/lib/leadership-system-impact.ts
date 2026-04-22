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
  const arr: Array<{ key: ComponentKey; value: number }> = [
    { key: "impulsiv", value: profile.impulsiv },
    { key: "intuitiv", value: profile.intuitiv },
    { key: "analytisch", value: profile.analytisch },
  ];
  return arr.sort((a, b) => b.value - a.value);
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
  const fr = lang === "FR";
  const _t = (de: string, enStr: string, frStr: string) => en ? enStr : fr ? frStr : de;
  const isLeadership = role === "fuehrung" || role === "Führungskraft" || role === "leadership";

  const actorNom = isLeadership
    ? _t("Die Führungskraft", "The leader", "Le responsable")
    : _t("Das Teammitglied", "The team member", "Le collaborateur");
  const actorGen = isLeadership
    ? _t("der Führungskraft", "the leader", "du responsable")
    : _t("des Teammitglieds", "the team member", "du collaborateur");

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
    systemReasons.push(_t(
      `${actorNom} liegt strukturell nah an der bestehenden Teamlogik.`,
      `${actorNom} is structurally close to the existing team logic.`,
      `${actorNom} est structurellement proche de la logique d'équipe existante.`
    ));
    if (sameTop) {
      systemReasons.push(_t(
        `Die Hauptprägung ${actorGen} entspricht der Hauptprägung des Teams.`,
        `The primary orientation of ${actorGen} matches the primary orientation of the team.`,
        `L'orientation principale ${actorGen} correspond à l'orientation principale de l'équipe.`
      ));
    }
  } else if (
    bothClearDifferentTop ||
    gaps.totalGap >= 34 ||
    gaps.maxGap >= 16 ||
    (!sameTop && gaps.totalGap >= 24)
  ) {
    systemImpactLabel = "Transformation";
    systemReasons.push(_t(
      `${actorNom} bringt eine deutlich andere Arbeits- und Führungslogik in das Team.`,
      `${actorNom} brings a distinctly different working and leadership logic to the team.`,
      `${actorNom} apporte une logique de travail et de management nettement différente à l'équipe.`
    ));
    if (bothClearDifferentTop) {
      systemReasons.push(_t(
        `Sowohl Team als auch ${isLeadership ? "Führungskraft" : "Teammitglied"} haben eine klare, aber unterschiedliche Hauptprägung.`,
        `Both team and ${isLeadership ? "leader" : "team member"} have a clear but different primary orientation.`,
        `L'équipe et ${isLeadership ? "le responsable" : "le collaborateur"} ont une orientation principale claire mais différente.`
      ));
    }
  } else {
    systemImpactLabel = "Spannung";
    systemReasons.push(_t(
      `${actorNom} setzt spürbar andere Akzente, ohne die Teamlogik vollständig zu drehen.`,
      `${actorNom} introduces noticeably different emphases without fully shifting the team logic.`,
      `${actorNom} apporte des accents nettement différents sans transformer entièrement la logique d'équipe.`
    ));
  }

  let effortLabel: EffortLabel;
  const effortReasons: string[] = [];

  if (systemImpactLabel === "Verstärkung" && gaps.totalGap <= 18 && gaps.maxGap <= 8) {
    effortLabel = "Niedrig";
    effortReasons.push(_t(
      `${actorNom} liegt nah an der bestehenden Teamlogik.`,
      `${actorNom} is close to the existing team logic.`,
      `${actorNom} est proche de la logique d'équipe existante.`
    ));
  } else if (
    systemImpactLabel === "Transformation" ||
    gaps.totalGap >= 34 ||
    gaps.maxGap >= 16
  ) {
    effortLabel = "Hoch";
    effortReasons.push(_t(
      `Die Integration ${actorGen} wird voraussichtlich intensiven Abstimmungs- und Begleitungsbedarf erzeugen.`,
      `Integrating ${actorGen} will likely require intensive alignment and support.`,
      `L'intégration ${actorGen} nécessitera probablement un accompagnement intensif et de nombreuses concertations.`
    ));
  } else {
    effortLabel = "Mittel";
    effortReasons.push(_t(
      "Die Integration ist möglich, sollte aber aktiv begleitet werden.",
      "Integration is possible but should be actively supported.",
      "L'intégration est possible, mais doit être activement accompagnée."
    ));
  }

  let goalLabel: GoalFitLabel;
  const goalReasons: string[] = [];

  if (!teamGoal) {
    goalLabel = "Kein Ziel gewählt";
    goalReasons.push(_t(
      "Es wurde kein aktuelles Teamziel ausgewählt.",
      "No current team goal has been selected.",
      "Aucun objectif d'équipe n'a été sélectionné."
    ));
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
    const GOAL_NAMES_FR: Record<string, string> = { umsetzung: "Exécution et résultats", analyse: "Analyse et structure", zusammenarbeit: "Collaboration et communication" };
    const goalName = (en ? GOAL_NAMES_EN : fr ? GOAL_NAMES_FR : GOAL_NAMES_DE)[teamGoal] || teamGoal;

    if (goalLabel === "Passend") {
      goalReasons.push(_t(
        `${actorNom} bringt für das Teamziel ${goalName} die passende Stärke mit.`,
        `${actorNom} brings the right strength for the team goal "${goalName}".`,
        `${actorNom} dispose des atouts appropriés pour l'objectif d'équipe "${goalName}".`
      ));
    } else if (goalLabel === "Teilweise passend") {
      goalReasons.push(_t(
        `${actorNom} unterstützt das Teamziel ${goalName} teilweise, liegt aber etwas unter dem Teamniveau in diesem Bereich.`,
        `${actorNom} partially supports the team goal "${goalName}", but is slightly below the team level in this area.`,
        `${actorNom} soutient partiellement l'objectif d'équipe "${goalName}", mais se situe légèrement en dessous du niveau de l'équipe dans ce domaine.`
      ));
    } else {
      goalReasons.push(_t(
        `${actorNom} arbeitet deutlich anders als das Teamziel ${goalName} es erfordert.`,
        `${actorNom} works significantly differently from what the team goal "${goalName}" requires.`,
        `${actorNom} travaille de manière nettement différente de ce que l'objectif d'équipe "${goalName}" requiert.`
      ));
    }
  }

  const steuerung = isLeadership ? "Führungssteuerung" : "Teamführung";
  const steuerungEN = isLeadership ? "leadership steering" : "team management";
  const steuerungFR = isLeadership ? "pilotage managérial" : "management d'équipe";

  const systemText =
    systemImpactLabel === "Verstärkung"
      ? _t(
          `${actorNom} wird die bestehende Teamlogik voraussichtlich eher stabilisieren und verstärken.`,
          `${actorNom} will likely stabilise and reinforce the existing team logic.`,
          `${actorNom} va probablement stabiliser et renforcer la logique d'équipe existante.`
        )
      : systemImpactLabel === "Spannung"
      ? _t(
          `${actorNom} wird voraussichtlich andere Akzente setzen und damit spürbare Reibung, aber auch Entwicklung auslösen.`,
          `${actorNom} will likely set different emphases, generating noticeable tension but also development.`,
          `${actorNom} va probablement introduire des accents différents, générant une tension notable mais aussi du développement.`
        )
      : _t(
          `${actorNom} wird das Team voraussichtlich deutlich verändern und eine neue Arbeitslogik hineinbringen.`,
          `${actorNom} will likely significantly change the team and introduce a new working logic.`,
          `${actorNom} va probablement modifier significativement l'équipe et introduire une nouvelle logique de travail.`
        );

  const effortText =
    effortLabel === "Niedrig"
      ? _t(
          `Die Integration verläuft voraussichtlich reibungsarm. Geringer Begleitungsbedarf, normale ${steuerung} ist ausreichend.`,
          `Integration is expected to proceed smoothly. Low support needs — normal ${steuerungEN} is sufficient.`,
          `L'intégration devrait se dérouler sans friction. Peu d'accompagnement est nécessaire — un ${steuerungFR} normal est suffisant.`
        )
      : effortLabel === "Mittel"
      ? _t(
          "Die Integration ist machbar, sollte aber gezielt begleitet werden. Regelmässige Abstimmung und klare Erwartungen beschleunigen den Prozess.",
          "Integration is achievable but should be deliberately supported. Regular alignment and clear expectations will accelerate the process.",
          "L'intégration est réalisable, mais doit être soutenue de manière ciblée. Des concertations régulières et des attentes claires accéléreront le processus."
        )
      : _t(
          `Die Integration erfordert intensive Begleitung. Strukturierte Onboarding-Massnahmen, enge Abstimmung und aktive ${steuerung} sind notwendig.`,
          `Integration requires intensive support. Structured onboarding, close alignment and active ${steuerungEN} are necessary.`,
          `L'intégration requiert un accompagnement intensif. Des mesures d'onboarding structurées, une coordination étroite et un ${steuerungFR} actif sont nécessaires.`
        );

  const goalText =
    goalLabel === "Kein Ziel gewählt"
      ? _t("Für das Team wurde aktuell kein Funktionsziel ausgewählt.", "No functional goal has been selected for the team.", "Aucun objectif fonctionnel n'a été sélectionné pour l'équipe.")
      : goalLabel === "Passend"
      ? _t(`${actorNom} passt gut zum aktuellen Teamziel.`, `${actorNom} is a good fit for the current team goal.`, `${actorNom} correspond bien à l'objectif d'équipe actuel.`)
      : goalLabel === "Teilweise passend"
      ? _t(`${actorNom} unterstützt das aktuelle Teamziel nur teilweise.`, `${actorNom} only partially supports the current team goal.`, `${actorNom} ne soutient que partiellement l'objectif d'équipe actuel.`)
      : _t(`${actorNom} arbeitet deutlich anders als das aktuelle Teamziel es erfordert.`, `${actorNom} works significantly differently from what the current team goal requires.`, `${actorNom} travaille de manière nettement différente de ce que l'objectif d'équipe actuel requiert.`);

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
