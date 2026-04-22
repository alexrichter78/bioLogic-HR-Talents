import type { Triad, ComponentKey } from "./bio-types";

export type TeamGoal = "umsetzung" | "analyse" | "zusammenarbeit" | null;

export interface TeamCheckV4Input {
  teamProfile: Triad;
  personProfile: Triad;
  roleTitle: string;
  roleLevel?: string;
  taskStructure?: string;
  workStyle?: string;
  successFocus?: string[];
  candidateName?: string;
  teamGoal?: TeamGoal;
  roleType?: string;
  lang?: "de" | "en";
}

export interface V4Block {
  title: string;
  text: string;
}

export interface V4RiskPhase {
  label: string;
  period: string;
  text: string;
}

export interface V4IntegrationPhase {
  num: number;
  title: string;
  period: string;
  ziel: string;
  beschreibung: string;
  praxis: string[];
  signale: string[];
  fuehrungstipp: string;
  fokus: { intro: string; bullets: string[] };
}

export interface TeamCheckV4Result {
  roleTitle: string;
  roleType: "leadership" | "member";
  roleLabel: string;
  teamGoal: TeamGoal;
  teamGoalLabel: string;

  introText: string;

  gesamteinschaetzung: string;
  passungZumTeam: string;
  beitragZurAufgabe: string;
  begleitungsbedarf: string;

  gesamtbewertungText: string;
  hauptstaerke: string;
  hauptabweichung: string;

  warumText: string;

  wirkungAlltagText: string;

  chancen: V4Block[];
  risiken: V4Block[];
  chancenRisikenEinordnung: string;

  druckText: string;

  fuehrungshinweis: V4Block[] | null;

  risikoprognose: V4RiskPhase[];
  integrationsplan: V4IntegrationPhase[];
  intWarnsignale: string[];
  intLeitfragen: string[];
  intVerantwortung: string;

  empfehlungen: V4Block[];

  teamOhnePersonText: string;
  schlussfazit: string;

  teamKontext: string;
  teamPrimary: ComponentKey;
  personPrimary: ComponentKey;
  sameDominance: boolean;
  teamTriad: Triad;
  personTriad: Triad;

  systemwirkung: string;

  score: number;
  scoreBreakdown: { top1: number; top2: number; variant: number };
  matchCase: MatchCase;
  integrationCase: IntegrationCase;
}


type MatchCase = "TOP1_TOP2" | "TOP1_ONLY" | "TOP2_ONLY" | "NONE";
type ProfileClass = "BALANCED" | "DUAL" | "CLEAR" | "ORDER";
export type IntegrationCase =
  | "STANDARD"
  | "BALANCED_BALANCED"
  | "TEAM_BALANCED_OPEN"
  | "TEAM_BALANCED_SELECTIVE"
  | "TEAM_BALANCED_TENSE"
  | "PERSON_BALANCED_ADAPTIVE"
  | "PERSON_BALANCED_LIMITED";
export type GoalContribution = "hoch" | "mittel" | "gering" | "nicht bewertet";

const EQ_TOL = 5;

let _lang: "de" | "en" = "de";
function t(de: string, en: string): string { return _lang === "en" ? en : de; }

const GOAL_LABELS: Record<string, string> = {
  umsetzung: "Umsetzung und Ergebnisse",
  analyse: "Analyse und Struktur",
  zusammenarbeit: "Zusammenarbeit und Kommunikation",
};

const GOAL_LABELS_EN: Record<string, string> = {
  umsetzung: "Delivery and Results",
  analyse: "Analysis and Structure",
  zusammenarbeit: "Collaboration and Communication",
};

function goalLabel(key: string): string {
  return _lang === "en" ? (GOAL_LABELS_EN[key] ?? key) : (GOAL_LABELS[key] ?? key);
}

const GOAL_KEY: Record<string, ComponentKey> = {
  umsetzung: "impulsiv",
  analyse: "analytisch",
  zusammenarbeit: "intuitiv",
};

const COMP_SHORT: Record<ComponentKey, string> = {
  impulsiv: "Tempo und direkte Umsetzung",
  intuitiv: "Austausch und Miteinander",
  analytisch: "Struktur und Genauigkeit",
};

const COMP_SHORT_EN: Record<ComponentKey, string> = {
  impulsiv: "Pace and Decision",
  intuitiv: "Communication and Relationships",
  analytisch: "Structure and Diligence",
};

function cs(k: ComponentKey): string {
  return _lang === "en" ? COMP_SHORT_EN[k] : COMP_SHORT[k];
}

const COMP_DOMAIN: Record<ComponentKey, string> = {
  impulsiv: "Handlung und Umsetzung",
  intuitiv: "Kommunikation und Abstimmung",
  analytisch: "Struktur und Analyse",
};

const COMP_DOMAIN_EN: Record<ComponentKey, string> = {
  impulsiv: "Pace and Decision",
  intuitiv: "Communication and Relationships",
  analytisch: "Structure and Diligence",
};

function cd(k: ComponentKey): string {
  return _lang === "en" ? COMP_DOMAIN_EN[k] : COMP_DOMAIN[k];
}

const COMP_ADJ: Record<ComponentKey, string> = {
  impulsiv: "direkter und schneller",
  intuitiv: "stärker über Austausch und Abstimmung",
  analytisch: "genauer und strukturierter",
};

const COMP_ADJ_EN: Record<ComponentKey, string> = {
  impulsiv: "with more pace and decisiveness",
  intuitiv: "through exchange and collaboration",
  analytisch: "more thoroughly and systematically",
};

function ca(k: ComponentKey): string {
  return _lang === "en" ? COMP_ADJ_EN[k] : COMP_ADJ[k];
}

const COMP_LABEL: Record<ComponentKey, string> = {
  impulsiv: "Impulsiv",
  intuitiv: "Intuitiv",
  analytisch: "Analytisch",
};


function round(v: number): number {
  return Math.round(Number(v || 0));
}

function sortTriad(profile: Triad): { key: ComponentKey; value: number }[] {
  return [
    { key: "impulsiv" as ComponentKey, value: round(profile.impulsiv) },
    { key: "intuitiv" as ComponentKey, value: round(profile.intuitiv) },
    { key: "analytisch" as ComponentKey, value: round(profile.analytisch) },
  ].sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.key.localeCompare(b.key);
  });
}

function getTop1(profile: Triad): ComponentKey {
  return sortTriad(profile)[0].key;
}

function getTop2(profile: Triad): ComponentKey {
  return sortTriad(profile)[1].key;
}

function getProfileClass(profile: Triad): ProfileClass {
  const sorted = sortTriad(profile);
  const gap1 = sorted[0].value - sorted[1].value;
  const gap2 = sorted[1].value - sorted[2].value;

  if (gap1 <= EQ_TOL && gap2 <= EQ_TOL) return "BALANCED";
  if (gap1 <= EQ_TOL && gap2 > EQ_TOL) return "DUAL";
  if (gap2 <= EQ_TOL && gap1 > EQ_TOL) return "CLEAR";
  return "ORDER";
}

function getVariantKey(profile: Triad): string {
  const pc = getProfileClass(profile);
  const sorted = sortTriad(profile);
  if (pc === "BALANCED") return "ALL_EQUAL";
  if (pc === "DUAL") return `TOP_PAIR_${[sorted[0].key, sorted[1].key].sort().join("_")}`;
  if (pc === "CLEAR") return `BOTTOM_PAIR_${[sorted[1].key, sorted[2].key].sort().join("_")}`;
  return `ORDER_${sorted[0].key}_${sorted[1].key}_${sorted[2].key}`;
}

function isCompatibleVariant(a: string, b: string): boolean {
  const pcA = a.startsWith("ALL") ? "BALANCED" : a.startsWith("TOP") ? "DUAL" : a.startsWith("BOTTOM") ? "CLEAR" : "ORDER";
  const pcB = b.startsWith("ALL") ? "BALANCED" : b.startsWith("TOP") ? "DUAL" : b.startsWith("BOTTOM") ? "CLEAR" : "ORDER";

  if (pcA === pcB) return true;
  if ((pcA === "DUAL" && pcB === "ORDER") || (pcA === "ORDER" && pcB === "DUAL")) return true;
  if ((pcA === "CLEAR" && pcB === "ORDER") || (pcA === "ORDER" && pcB === "CLEAR")) return true;
  if ((pcA === "DUAL" && pcB === "CLEAR") || (pcA === "CLEAR" && pcB === "DUAL")) return true;
  return false;
}


function getSpreadClass(profile: Triad): "balanced" | "eng" | "nah" | "fern" {
  const sorted = sortTriad(profile);
  const spread = sorted[0].value - sorted[2].value;
  if (spread <= 5) return "balanced";
  if (spread <= 12) return "eng";
  if (spread <= 20) return "nah";
  return "fern";
}

function deriveMatchCase(teamProfile: Triad, personProfile: Triad): MatchCase {
  const tTop1 = getTop1(teamProfile);
  const tTop2 = getTop2(teamProfile);
  const pTop1 = getTop1(personProfile);
  const pTop2 = getTop2(personProfile);

  if (tTop1 === pTop1 && tTop2 === pTop2) return "TOP1_TOP2";
  if (tTop1 === pTop1) return "TOP1_ONLY";
  if (tTop2 === pTop2) return "TOP2_ONLY";
  return "NONE";
}

function computeScore(
  teamProfile: Triad,
  personProfile: Triad
): { score: number; top1: number; top2: number; variant: number; matchCase: MatchCase; integrationCase: IntegrationCase } {
  const tClass = getProfileClass(teamProfile);
  const pClass = getProfileClass(personProfile);
  const realMatchCase = deriveMatchCase(teamProfile, personProfile);

  if (tClass === "BALANCED" && pClass === "BALANCED") {
    return { score: 95, top1: 60, top2: 30, variant: 5, matchCase: realMatchCase, integrationCase: "BALANCED_BALANCED" };
  }

  if (tClass === "BALANCED") {
    const pSpread = getSpreadClass(personProfile);
    if (pSpread === "balanced" || pSpread === "eng") {
      return { score: 80, top1: 45, top2: 25, variant: 10, matchCase: realMatchCase, integrationCase: "TEAM_BALANCED_OPEN" };
    }
    if (pSpread === "nah") {
      return { score: 70, top1: 40, top2: 20, variant: 10, matchCase: realMatchCase, integrationCase: "TEAM_BALANCED_SELECTIVE" };
    }
    return { score: 60, top1: 30, top2: 20, variant: 10, matchCase: realMatchCase, integrationCase: "TEAM_BALANCED_TENSE" };
  }

  if (pClass === "BALANCED") {
    const tSpread = getSpreadClass(teamProfile);
    if (tSpread === "balanced" || tSpread === "eng" || tSpread === "nah") {
      return { score: 75, top1: 45, top2: 20, variant: 10, matchCase: realMatchCase, integrationCase: "PERSON_BALANCED_ADAPTIVE" };
    }
    return { score: 60, top1: 30, top2: 20, variant: 10, matchCase: realMatchCase, integrationCase: "PERSON_BALANCED_LIMITED" };
  }

  const tTop1 = getTop1(teamProfile);
  const tTop2 = getTop2(teamProfile);
  const pTop1 = getTop1(personProfile);
  const pTop2 = getTop2(personProfile);

  let top1Max: number;
  let top2Max: number;
  if (tClass === "DUAL") {
    top1Max = 50;
    top2Max = 40;
  } else if (tClass === "CLEAR") {
    top1Max = 80;
    top2Max = 10;
  } else {
    top1Max = 75;
    top2Max = 15;
  }

  let top1Score = tTop1 === pTop1 ? top1Max : 0;

  let top2Score = 0;
  if (tTop2 === pTop2) {
    top2Score = top2Max;
  } else if (tTop1 === pTop2) {
    top2Score = Math.round(top2Max / 2);
  }

  const tVar = getVariantKey(teamProfile);
  const pVar = getVariantKey(personProfile);
  let variantScore = 0;
  if (tVar === pVar) {
    variantScore = 10;
  } else if (isCompatibleVariant(tVar, pVar)) {
    variantScore = 5;
  }

  const score = top1Score + top2Score + variantScore;
  const matchCase = deriveMatchCase(teamProfile, personProfile);

  return { score, top1: top1Score, top2: top2Score, variant: variantScore, matchCase, integrationCase: "STANDARD" };
}


function scoreToFit(score: number): string {
  if (score >= 85) return "hoch";
  if (score >= 60) return "mittel";
  return "gering";
}

function fitToBegleitung(fit: string): string {
  if (fit === "hoch") return "gering";
  if (fit === "mittel") return "mittel";
  return "hoch";
}

function computeTaskFit(teamProfile: Triad, personProfile: Triad, goal: TeamGoal): string {
  if (!goal) return "nicht bewertet";
  const goalComp = GOAL_KEY[goal];
  if (!goalComp) return "nicht bewertet";

  const personClass = getProfileClass(personProfile);
  const sorted = sortTriad(personProfile);
  const top1Key = sorted[0].key;
  const top2Key = sorted[1].key;
  const gap1 = sorted[0].value - sorted[1].value;

  if (personClass === "BALANCED") return "mittel";

  if (top1Key === goalComp && gap1 > EQ_TOL) return "hoch";

  if (personClass === "DUAL" && (top1Key === goalComp || top2Key === goalComp)) return "mittel";

  return "gering";
}

function computeSystemwirkung(matchCase: MatchCase, integrationCase: IntegrationCase = "STANDARD"): string {
  if (integrationCase === "BALANCED_BALANCED") return "Verstärkung";
  if (integrationCase === "TEAM_BALANCED_OPEN") return "Stabile Ergänzung";
  if (integrationCase === "TEAM_BALANCED_SELECTIVE") return "Stabile Ergänzung";
  if (integrationCase === "TEAM_BALANCED_TENSE") return "Ergänzung mit Spannung";
  if (integrationCase === "PERSON_BALANCED_ADAPTIVE") return "Stabile Ergänzung";
  if (integrationCase === "PERSON_BALANCED_LIMITED") return "Ergänzung mit Spannung";

  if (matchCase === "TOP1_TOP2") return "Verstärkung";
  if (matchCase === "TOP1_ONLY") return "Stabile Ergänzung";
  if (matchCase === "TOP2_ONLY") return "Ergänzung mit Spannung";
  return "Transformation";
}

function gesamtLabel(teamFit: string, taskFit: string, matchCase: MatchCase): string {
  if (_lang === "en") {
    if (teamFit === "hoch" && taskFit === "hoch") return "Strong fit";
    if (teamFit === "hoch" && taskFit === "mittel") return "Good fit";
    if (teamFit === "hoch" && taskFit === "gering") return "Culturally aligned, limited task fit";
    if (teamFit === "hoch" && taskFit === "nicht bewertet") return "Good fit";
    if (teamFit === "mittel" && taskFit === "hoch") return "Functionally strong, more demanding integration";
    if (teamFit === "mittel" && taskFit === "mittel") return "Partial fit";
    if (teamFit === "mittel" && taskFit === "gering") return "Integrable, limited task leverage";
    if (teamFit === "mittel" && taskFit === "nicht bewertet") return "Partial fit";
    if (teamFit === "gering" && taskFit === "hoch") return "Functionally interesting, culturally risky";
    if (teamFit === "gering" && taskFit === "mittel") return "High friction, limited added value";
    if (matchCase === "TOP2_ONLY") return "Tension with a shared working layer";
    return "Critical";
  }
  if (teamFit === "hoch" && taskFit === "hoch") return "Sehr passend";
  if (teamFit === "hoch" && taskFit === "mittel") return "Gut passend";
  if (teamFit === "hoch" && taskFit === "gering") return "Kulturell passend, fachlich begrenzt";
  if (teamFit === "hoch" && taskFit === "nicht bewertet") return "Gut passend";

  if (teamFit === "mittel" && taskFit === "hoch") return "Fachlich wertvoll, integrativ anspruchsvoller";
  if (teamFit === "mittel" && taskFit === "mittel") return "Bedingt passend";
  if (teamFit === "mittel" && taskFit === "gering") return "Integrierbar, aber ohne klaren Aufgabenhebel";
  if (teamFit === "mittel" && taskFit === "nicht bewertet") return "Bedingt passend";

  if (teamFit === "gering" && taskFit === "hoch") return "Inhaltlich interessant, kulturell riskant";
  if (teamFit === "gering" && taskFit === "mittel") return "Spannungsreich bei begrenztem Zusatznutzen";
  if (matchCase === "TOP2_ONLY") return "Spannungsreich mit Alltagsbrücke";
  return "Kritisch";
}


interface Ctx {
  isLeader: boolean;
  roleName: string;
  teamPrimary: ComponentKey;
  personPrimary: ComponentKey;
  teamSecondary: ComponentKey;
  personSecondary: ComponentKey;
  teamClass: ProfileClass;
  personClass: ProfileClass;
  sameDominance: boolean;
  score: number;
  matchCase: MatchCase;
  teamFit: string;
  taskFit: string;
  gesamteinschaetzung: string;
  hasGoal: boolean;
  teamGoalLabel: string;
  goalKey: ComponentKey | null;
}


function buildIntroText(c: Ctx): string {
  if (_lang === "en") {
    const p1 = c.isLeader
      ? "This report shows how this person will likely perform in a leadership role in the existing team. It compares the bioLogic profiles of person and team. It identifies where collaboration can work well, where friction is likely, and where clarity will be needed in day-to-day work. It does not replace a personal assessment. It adds a dimension that conversations often cannot reveal."
      : "This report shows how this person will likely perform in the existing team. It compares the bioLogic profiles of person and team. It identifies where collaboration can work well, where friction is likely, and where clarity will be needed in day-to-day work. It does not replace a personal assessment. It adds a dimension that conversations often cannot reveal.";
    const p2 = "Differences between person and team are not automatically negative. They can add real value to a team. For that to work, expectations need to be clear and leadership needs to be active. This report provides the basis for making the right decisions early.";
    return `${p1}\n\n${p2}`;
  }
  const p1 = c.isLeader
    ? "Dieser Bericht zeigt, wie die Person in einer Führungsrolle im bestehenden Team voraussichtlich wirken wird. Er vergleicht die bioLogic-Profile von Person und Team und macht sichtbar, wo die Zusammenarbeit gut gelingen kann, wo Reibung wahrscheinlich ist und wo im Alltag Klärung nötig sein wird. Er ersetzt keine persönliche Einschätzung, sondern ergänzt sie um eine Perspektive, die im Gespräch oft nicht sichtbar wird."
    : "Dieser Bericht zeigt, wie die Person im bestehenden Team voraussichtlich wirken wird. Er vergleicht die bioLogic-Profile von Person und Team und macht sichtbar, wo die Zusammenarbeit gut gelingen kann, wo Reibung wahrscheinlich ist und wo im Alltag Klärung nötig sein wird. Er ersetzt keine persönliche Einschätzung, sondern ergänzt sie um eine Perspektive, die im Gespräch oft nicht sichtbar wird.";
  const p2 = "Unterschiede zwischen Person und Team sind nicht automatisch negativ. Sie können ein Team sinnvoll ergänzen. Damit das gelingt, braucht es klare Erwartungen und gute Führung. Dieser Bericht liefert die Grundlage, um frühzeitig die richtigen Weichen zu stellen.";
  return `${p1}\n\n${p2}`;
}


function buildGesamtbewertungText(c: Ctx): string {
  const { matchCase, isLeader, teamClass, personClass, hasGoal, teamGoalLabel, taskFit } = c;

  if (_lang === "en") {
    const paras: string[] = [];

    if (teamClass === "BALANCED" && personClass === "BALANCED") {
      paras.push("Both the team and the person show a balanced structure with no clearly dominant pattern. None of the three behavioural dimensions stands out strongly on either side. Both can respond flexibly to changing situations. Integration is likely to be smooth. Collaboration can settle quickly because neither side forces a fixed direction.");
      paras.push("The risk in this combination is the absence of useful friction. Neither the team nor the person provides a clear lead. Under pressure, when quick decisions or firm priorities are needed, this can result in indecision or diffused responsibility. In those moments, clear role assignments or external direction will be needed.");
    } else if (teamClass === "BALANCED") {
      paras.push(`The team is broadly set up with no dominant working pattern. All three behavioural dimensions are roughly balanced, giving the team high adaptability. The person brings a clearer direction, centred on ${cd(c.personPrimary)}. This can give the team a welcome orientation it has lacked.`);
      paras.push("At the same time, the person may shift the existing balance in one direction. The stronger the person's dominance, the more they will pull team culture toward their style. This can be intended, but it needs deliberate management. Without clear leadership, the team risks losing its versatility and some members may not find themselves in the new direction.");
    } else if (personClass === "BALANCED") {
      paras.push(`The team follows a clear working logic centred on ${cd(c.teamPrimary)}. Decisions, communication, and collaboration align to this pattern. The person is more broadly positioned with no single dominant pattern. They can shift between different approaches depending on the situation.`);
      paras.push("This gives the person flexibility to adapt to the team's logic. The risk is that they may not come across as clearly positioned. The team may experience them as lacking a distinct profile. Successful integration requires that expectations are defined concretely early on, and that the person's specific contribution is made explicit.");
    } else if (matchCase === "TOP1_TOP2") {
      paras.push(isLeader
        ? `The person's working style aligns closely with the team's. Both the primary working logic (${cd(c.teamPrimary)}) and the day-to-day working approach (${cd(c.teamSecondary)}) match. The person does not just understand the team culture. They share it naturally. Starting in the leadership role should be smooth, because the manager communicates and decides in ways the team recognises.`
        : `The person's working style aligns closely with the team's. Both the primary working logic (${cd(c.teamPrimary)}) and the day-to-day working approach (${cd(c.teamSecondary)}) match. The person does not just understand the team culture. They share it naturally. Integration should be smooth and become effective quickly, because both sides operate in familiar patterns.`);
      paras.push("This strong alignment has a downside. The person reinforces the existing team logic rather than extending it. Blind spots remain hidden because the new person shares the same strengths and weaknesses. Over time, this can make the team more one-sided.");
    } else if (matchCase === "TOP1_ONLY") {
      paras.push(isLeader
        ? `The person shares the team's core logic: ${cd(c.teamPrimary)}. This creates a stable foundation of trust, because the team recognises that the manager thinks in the same fundamental way. In day-to-day work, however, the working approaches differ. The team relies more on ${cs(c.teamSecondary)}, the person more on ${cs(c.personSecondary)}. The direction is shared. The path to get there differs.`
        : `The person shares the team's core logic: ${cd(c.teamPrimary)}. This creates a stable foundation for collaboration, because both sides understand each other at the fundamental level. In day-to-day work, however, the working approaches differ. The team relies more on ${cs(c.teamSecondary)}, the person more on ${cs(c.personSecondary)}. The direction is shared. The path to get there differs.`);
      paras.push("Basic collaboration is established and the person will not feel out of place. In practice, differences in communication, pace, and concrete approach may become visible. These are typically manageable, but early clarification of mutual expectations helps. With good alignment, stable and productive integration is well within reach.");
    } else if (matchCase === "TOP2_ONLY") {
      paras.push(`The person's thinking logic differs from the team's. The team works through ${cd(c.teamPrimary)}, the person through ${cd(c.personPrimary)}. This difference will be felt in daily work and can cause friction.`);
      paras.push(`In concrete working behaviour, there is overlap: both rely on ${cs(c.teamSecondary)}. This creates an important bridge in day-to-day work. Integration can work, but it needs deliberate leadership and clear expectations.`);
    } else {
      paras.push(`The person differs from the team both in thinking logic and in working approach. The team works through ${cd(c.teamPrimary)}, the person through ${cd(c.personPrimary)}. This difference is not just in detail. It affects how decisions are made, priorities are set, and communication flows.`);
      paras.push("Noticeable friction in daily work should be expected. In meetings and decisions, different expectations will collide. Integration is possible, but it requires significant leadership effort and a clear decision that these differences are intentional. Without active support, frustration will grow on both sides.");
    }

    if (hasGoal) {
      if (taskFit === "hoch") {
        paras.push(`For the functional goal ${teamGoalLabel}, the person brings the right strength. They are likely to work well and independently in the core tasks of this role.`);
      } else if (taskFit === "mittel") {
        paras.push(`For the functional goal ${teamGoalLabel}, the person brings some of the required strength. In core tasks, targeted support and input from stronger team members will be helpful.`);
      } else if (taskFit === "gering") {
        paras.push(`For the functional goal ${teamGoalLabel}, the person does not bring the right strength. This does not mean the role cannot be fulfilled. It does mean more support will be needed to deliver the expected results.`);
      }
    }

    return paras.join("\n\n");
  }

  const paras: string[] = [];

  if (teamClass === "BALANCED" && personClass === "BALANCED") {
    paras.push("Sowohl das Team als auch die Person zeigen eine ausgeglichene Grundstruktur ohne klare Einseitigkeit. Keines der drei bioLogic-Grundmuster dominiert deutlich. Das bedeutet, dass beide Seiten situativ flexibel reagieren können und keine starre Arbeitslogik aufeinandertrifft. Dadurch ist die Integration voraussichtlich reibungsarm. Die Zusammenarbeit kann sich schnell einspielen, weil keine der beiden Seiten eine dominante Richtung erzwingt oder erwartet.");
    paras.push("Das Risiko dieser Konstellation liegt paradoxerweise in der fehlenden Reibung: Weder Team noch Person geben eine klare Linie vor. In Phasen mit hohem Entscheidungsdruck, knappen Ressourcen oder Konflikten kann das zu Unentschlossenheit, Verantwortungsdiffusion oder mangelnder Priorisierung führen. Gerade in solchen Momenten braucht es dann externe Steuerung oder eine bewusste Rollenklärung, wer welche Richtung vorgibt.");
  } else if (teamClass === "BALANCED") {
    paras.push(`Das Team ist breit aufgestellt und nicht auf eine einzelne Arbeitslogik festgelegt. Die drei bioLogic-Grundmuster sind relativ gleichmässig verteilt, was dem Team eine hohe Anpassungsfähigkeit verleiht. Die Person bringt dagegen eine deutlich klarere Arbeitslogik mit, geprägt durch ${COMP_DOMAIN[c.personPrimary]}. Das kann dem Team eine willkommene Orientierung und Richtung geben, die bisher gefehlt hat.`);
    paras.push("Gleichzeitig besteht das Risiko, dass die Person die bestehende Balance einseitig verschiebt. Je klarer die Dominanz der Person, desto stärker wird sie die Teamkultur in ihre Richtung ziehen. Das kann gewünscht sein, muss aber bewusst gesteuert werden. Ohne klare Führung besteht die Gefahr, dass das Team seine bisherige Vielseitigkeit verliert und Widerstände bei einzelnen Teammitgliedern entstehen, die sich in der neuen Ausrichtung nicht wiederfinden.");
  } else if (personClass === "BALANCED") {
    paras.push(`Das Team folgt einer klaren Arbeitslogik mit Schwerpunkt auf ${COMP_DOMAIN[c.teamPrimary]}. Entscheidungen, Kommunikation und Zusammenarbeit sind auf dieses Muster ausgerichtet. Die Person ist dagegen breiter aufgestellt und weniger eindeutig ausgerichtet. Sie zeigt keine dominante Arbeitslogik und kann daher situativ zwischen verschiedenen Herangehensweisen wechseln.`);
    paras.push("Dadurch kann die Person flexibel an die Teamlogik anschliessen und sich anpassen. Sie läuft jedoch Gefahr, in der konkreten Rolle nicht klar genug wahrgenommen zu werden. Das Team könnte sie als zu wenig profiliert oder zu wenig greifbar erleben. Eine erfolgreiche Integration erfordert deshalb, dass Erwartungen an die Person früh konkret formuliert werden und klar definiert wird, welchen spezifischen Beitrag sie leisten soll.");
  } else if (matchCase === "TOP1_TOP2") {
    paras.push(isLeader
      ? `Die Person passt in ihrer Arbeitsweise sehr gut zum bestehenden Team. Sowohl die grundlegende Denklogik (${COMP_DOMAIN[c.teamPrimary]}) als auch die Art der Zusammenarbeit im Alltag (${COMP_DOMAIN[c.teamSecondary]}) stimmen überein. Das bedeutet, dass die Person die Teamkultur nicht nur versteht, sondern sie intuitiv teilt. Der Einstieg in die Führungsrolle dürfte reibungsarm verlaufen, weil die Führungskraft in einer Sprache kommuniziert und entscheidet, die das Team kennt und erwartet.`
      : `Die Person passt in ihrer Arbeitsweise sehr gut zum bestehenden Team. Sowohl die grundlegende Denklogik (${COMP_DOMAIN[c.teamPrimary]}) als auch die Art der Zusammenarbeit im Alltag (${COMP_DOMAIN[c.teamSecondary]}) stimmen überein. Das bedeutet, dass die Person die Teamkultur nicht nur versteht, sondern sie intuitiv teilt. Die Integration dürfte reibungsarm verlaufen und im Alltag schnell wirksam werden, weil sich beide Seiten in vertrauten Mustern begegnen.`);
    paras.push("Diese hohe Übereinstimmung hat auch eine Kehrseite: Die Person verstärkt die bestehende Teamlogik, statt sie zu ergänzen. Blinde Flecken des Teams bleiben unentdeckt, weil die neue Person dieselben Stärken und Schwächen mitbringt. Langfristig kann das zu einer Verstärkung bestehender Muster führen, die das Team einseitiger macht.");
  } else if (matchCase === "TOP1_ONLY") {
    paras.push(isLeader
      ? `Die Person bringt die gleiche Grundlogik wie das Team mit: ${COMP_DOMAIN[c.teamPrimary]}. Das schafft eine stabile Vertrauensbasis, weil das Team erkennt, dass die Führungskraft die gleiche grundlegende Denkweise teilt. Im konkreten Arbeitsalltag unterscheidet sich jedoch die Art der Zusammenarbeit. Das Team setzt stärker auf ${COMP_SHORT[c.teamSecondary]}, die Person eher auf ${COMP_SHORT[c.personSecondary]}. Das bedeutet: Die Richtung stimmt, aber der Weg dorthin wird unterschiedlich beschritten.`
      : `Die Person bringt die gleiche Grundlogik wie das Team mit: ${COMP_DOMAIN[c.teamPrimary]}. Das schafft eine stabile Basis für die Zusammenarbeit, weil sich beide Seiten in der grundlegenden Denkweise verstehen. Im konkreten Arbeitsalltag unterscheidet sich jedoch die Art der Zusammenarbeit. Das Team setzt stärker auf ${COMP_SHORT[c.teamSecondary]}, die Person eher auf ${COMP_SHORT[c.personSecondary]}. Das bedeutet: Die Richtung stimmt, aber der Weg dorthin wird unterschiedlich beschritten.`);
    paras.push("Die grundsätzliche Zusammenarbeit ist damit gegeben und die Person wird vom Team nicht als Fremdkörper wahrgenommen. Im Alltag können jedoch Unterschiede in Kommunikation, Tempo und konkretem Vorgehen sichtbar werden. Diese Unterschiede sind typischerweise gut steuerbar, brauchen aber frühzeitige Klärung. Mit klarer Abstimmung über gegenseitige Erwartungen ist eine stabile und produktive Integration gut möglich.");
  } else if (matchCase === "TOP2_ONLY") {
    paras.push(`Die Person unterscheidet sich in der Denklogik vom Team. Das Team arbeitet über ${COMP_DOMAIN[c.teamPrimary]}, die Person setzt auf ${COMP_DOMAIN[c.personPrimary]}. Dieser Unterschied wird im Alltag spürbar und kann zu Irritationen führen.`);
    paras.push(`Im konkreten Arbeitsverhalten gibt es aber Überschneidungen: Beide setzen auf ${COMP_SHORT[c.teamSecondary]}. Das schafft im Tagesgeschäft eine wichtige Brücke. Die Integration kann funktionieren, braucht aber bewusste Führung und klare Erwartungen.`);
  } else {
    paras.push(`Die Person weicht sowohl in der Denklogik als auch im konkreten Vorgehen deutlich vom Team ab. Das Team arbeitet über ${COMP_DOMAIN[c.teamPrimary]}, die Person setzt auf ${COMP_DOMAIN[c.personPrimary]}. Dieser Unterschied betrifft nicht nur Details, sondern die Art, wie Entscheidungen getroffen, Prioritäten gesetzt und kommuniziert wird.`);
    paras.push("Dadurch ist mit spürbarer Reibung im Alltag zu rechnen. In Meetings und bei Entscheidungen prallen unterschiedliche Erwartungen aufeinander. Eine Integration ist möglich, braucht aber viel Führungsaufwand und die klare Entscheidung, dass diese Unterschiede gewollt sind. Ohne aktive Begleitung wächst die Frustration auf beiden Seiten.");
  }

  if (hasGoal) {
    if (taskFit === "hoch") {
      paras.push(`Für das Funktionsziel ${teamGoalLabel} bringt die Person die passende Stärke mit. Sie kann in den Kernaufgaben dieser Rolle voraussichtlich gut und selbstständig arbeiten.`);
    } else if (taskFit === "mittel") {
      paras.push(`Für das Funktionsziel ${teamGoalLabel} bringt die Person einen Teil der geforderten Stärke mit. In den Kernaufgaben braucht es gezielte Begleitung und möglicherweise Unterstützung durch Teammitglieder, die in diesem Bereich stärker sind.`);
    } else if (taskFit === "gering") {
      paras.push(`Für das Funktionsziel ${teamGoalLabel} bringt die Person nicht die passende Stärke mit. Das heisst nicht, dass sie die Aufgabe nicht erfüllen kann — aber es braucht mehr Begleitung und Unterstützung, um die geforderten Ergebnisse zu erzielen.`);
    }
  }

  return paras.join("\n\n");
}


function buildHauptstaerke(c: Ctx): string {
  if (_lang === "en") {
    if (c.matchCase === "TOP1_TOP2") return `Shared working logic and approach with the team (${cs(c.teamPrimary)} and ${cs(c.teamSecondary)}).`;
    if (c.matchCase === "TOP1_ONLY") return `Shared core logic with the team (${cs(c.teamPrimary)}).`;
    if (c.matchCase === "TOP2_ONLY") return `Overlap in day-to-day working approach (${cs(c.teamSecondary)}).`;
    if (c.personClass === "BALANCED") return "Versatility and adaptability.";
    return `Distinct strength in ${cs(c.personPrimary)}.`;
  }
  if (c.matchCase === "TOP1_TOP2") return `Gleiche Grundlogik und Arbeitsweise wie das Team (${COMP_SHORT[c.teamPrimary]} + ${COMP_SHORT[c.teamSecondary]}).`;
  if (c.matchCase === "TOP1_ONLY") return `Gleiche Grundlogik wie das Team (${COMP_SHORT[c.teamPrimary]}).`;
  if (c.matchCase === "TOP2_ONLY") return `Überschneidung in der Arbeitsweise (${COMP_SHORT[c.teamSecondary]}).`;
  if (c.personClass === "BALANCED") return "Vielseitigkeit und Anpassungsfähigkeit.";
  return `Eigene Stärke in ${COMP_SHORT[c.personPrimary]}.`;
}

function buildHauptabweichung(c: Ctx): string {
  if (_lang === "en") {
    if (c.matchCase === "TOP1_TOP2") return "No significant deviation identified.";
    if (c.matchCase === "TOP1_ONLY") return `Different working approach in day-to-day tasks (team: ${cs(c.teamSecondary)}, person: ${cs(c.personSecondary)}).`;
    if (c.matchCase === "TOP2_ONLY") return `Different core logic (team: ${cd(c.teamPrimary)}, person: ${cd(c.personPrimary)}).`;
    return `Both core logic and working approach differ (team: ${cd(c.teamPrimary)}, person: ${cd(c.personPrimary)}).`;
  }
  if (c.matchCase === "TOP1_TOP2") return "Keine wesentliche Abweichung erkennbar.";
  if (c.matchCase === "TOP1_ONLY") return `Unterschiedliche Arbeitsweise im Alltag (Team: ${COMP_SHORT[c.teamSecondary]}, Person: ${COMP_SHORT[c.personSecondary]}).`;
  if (c.matchCase === "TOP2_ONLY") return `Unterschiedliche Grundlogik (Team: ${COMP_DOMAIN[c.teamPrimary]}, Person: ${COMP_DOMAIN[c.personPrimary]}).`;
  return `Grundlogik und Arbeitsweise weichen ab (Team: ${COMP_DOMAIN[c.teamPrimary]}, Person: ${COMP_DOMAIN[c.personPrimary]}).`;
}


function buildWarumText(c: Ctx): string {
  const { matchCase, teamPrimary, personPrimary, teamSecondary, personSecondary, teamClass, personClass } = c;

  if (_lang === "en") {
    const paras: string[] = [];
    if (teamClass === "BALANCED" && personClass === "BALANCED") {
      paras.push("Both the team and the person show a balanced profile with no clear dominant pattern. None of the three behavioural dimensions stands out strongly on either side. The fit assessment therefore depends less on structural overlap in one particular logic and more on the fundamental flexibility of both sides.");
      paras.push("In practice, both sides respond situationally and can adapt to different demands. Collaboration will depend more on personal factors, communication style, and specific tasks than on profile structure. This is an advantage for flexibility but can create disorientation when clear decisions are needed.");
    } else if (teamClass === "BALANCED") {
      paras.push(`The team shows a balanced profile with no dominant pattern. It is not fixed to any particular working logic and responds situationally. The person, by contrast, has a clear orientation toward ${cd(personPrimary)}. This means the person brings a recognisable direction while the team is open to it.`);
      paras.push("Integration can succeed when the person contributes their strength constructively without narrowing the team's versatility. The key question is whether the team experiences the person's clear style as enriching or constraining. That is where leadership responsibility lies: setting a frame in which the person's strength can work without the team losing its adaptability.");
    } else if (personClass === "BALANCED") {
      paras.push(`The team follows a clear working logic centred on ${cd(teamPrimary)}. Decisions and communication align to this pattern. The person is more broadly positioned and brings no single dominant pattern. They can respond flexibly but do not introduce a clear direction of their own.`);
      paras.push("Integration depends on whether the person can understand, accept, and work within the team's logic. They must engage with the team's dominant pattern even if it does not come naturally. When that works, the person can add valuable flexibility. When it does not, they risk being seen as unprofilated or hard to read. Clear expectations and regular feedback help stabilise the collaboration.");
    } else {
      if (matchCase === "TOP1_TOP2") {
        paras.push(`Both team and person operate through ${cd(teamPrimary)} as their primary logic and ${cd(teamSecondary)} as their supporting approach. This double overlap creates high baseline compatibility. The person thinks, decides, and communicates in the same patterns as the team. This makes the start substantially easier and reduces the risk of misunderstandings in the early weeks.`);
        paras.push("The downside of this overlap is that both sides share not only the same strengths but also the same blind spots. The person does not extend the team. They reinforce it in its existing direction. Over time this can narrow the team if no deliberate counterbalance is introduced.");
      } else if (matchCase === "TOP1_ONLY") {
        paras.push(`The core logic matches: both sides operate through ${cd(teamPrimary)} as their primary way of thinking and deciding. This creates a stable foundation because person and team understand each other at the fundamental level. In day-to-day work, however, the supporting approach differs. The team relies more on ${cs(teamSecondary)}, the person more on ${cs(personSecondary)}.`);
        paras.push("This creates a stable base with visible differences in the detail. The person will not be seen as out of place, but in concrete work situations, different expectations around pace, communication, or thoroughness can emerge. These differences are typically manageable and can even act as a useful complement when named and accepted early.");
      } else if (matchCase === "TOP2_ONLY") {
        paras.push(`The fit reflects a combination of two opposing forces. On one hand, the core logic does not match: the team operates through ${cd(teamPrimary)}, the person through ${cd(personPrimary)}. This difference reduces fit significantly because it affects the fundamental direction of thinking and deciding.`);
        paras.push(`On the other hand, the supporting working approach matches: both sides rely on ${cs(teamSecondary)}. This shared layer absorbs some of the friction in daily work and explains why collaboration often functions better in practice than the profile analysis alone would suggest. The fit score captures the structural tension accurately but tends to overstate the practical distance.`);
      } else {
        paras.push(`Team and person differ in both core logic and working approach. The team operates through ${cd(teamPrimary)} with ${cs(teamSecondary)}, the person through ${cd(personPrimary)} with ${cs(personSecondary)}. This tension affects communication, decisions, and daily interaction.`);
        paras.push("This does not have to be a problem. Sometimes a team needs exactly this different perspective. But it needs active leadership and clarity about why this placement makes sense. Without that, friction dominates the daily dynamic.");
      }
    }
    return paras.join("\n\n");
  }

  const paras: string[] = [];

  if (teamClass === "BALANCED" && personClass === "BALANCED") {
    paras.push("Sowohl das Team als auch die Person zeigen ein ausgeglichenes Profil ohne klare Dominanz. Keines der drei bioLogic-Grundmuster sticht bei einer der beiden Seiten deutlich hervor. Das bedeutet, dass die Bewertung weniger von einer strukturellen Übereinstimmung in einer bestimmten Logik abhängt, als von der grundsätzlichen Flexibilität und Vielseitigkeit beider Seiten.");
    paras.push("In der Praxis zeigt sich das daran, dass beide Seiten situativ reagieren und sich an unterschiedliche Anforderungen anpassen können. Die Zusammenarbeit hängt daher stärker von persönlichen Faktoren, Kommunikationsstil und konkreten Aufgabenstellungen ab als von der Profilstruktur. Das ist ein Vorteil für die Flexibilität, kann aber in Phasen, die klare Entscheidungen erfordern, zu Orientierungslosigkeit führen.");
  } else if (teamClass === "BALANCED") {
    paras.push(`Das Team zeigt ein ausgeglichenes Profil ohne klare Dominanz. Es ist nicht auf eine bestimmte Arbeitslogik festgelegt und reagiert situativ. Die Person hat dagegen eine klare Ausrichtung auf ${COMP_DOMAIN[personPrimary]}. Diese Konstellation bedeutet, dass die Person eine erkennbare Richtung einbringt, während das Team dafür grundsätzlich offen ist.`);
    paras.push("Die Integration kann gelingen, wenn die Person ihre Stärke gezielt und konstruktiv einbringt, ohne die Vielseitigkeit des Teams einzuschränken. Entscheidend ist, ob das Team die klare Linie der Person als Bereicherung wahrnimmt oder als Einengung. Hier liegt die Führungsverantwortung: Sie muss den Rahmen setzen, in dem die Stärke der Person wirken kann, ohne dass das Team seine Anpassungsfähigkeit verliert.");
  } else if (personClass === "BALANCED") {
    paras.push(`Das Team folgt einer klaren Arbeitslogik mit Schwerpunkt auf ${COMP_DOMAIN[teamPrimary]}. Entscheidungen und Kommunikation im Team orientieren sich an diesem Muster. Die Person ist dagegen breit aufgestellt und zeigt kein einzelnes dominantes Muster. Sie kann situativ flexibel reagieren, bringt aber keine klar erkennbare Richtung ein.`);
    paras.push("Die Integration hängt davon ab, ob die Person die Teamlogik verstehen, annehmen und mittragen kann. Sie muss sich auf das dominante Muster des Teams einlassen, auch wenn es nicht ihrer eigenen natürlichen Arbeitsweise entspricht. Wenn das gelingt, kann die Person eine wertvolle Flexibilität einbringen. Wenn nicht, besteht die Gefahr, dass sie als unprofiliert oder nicht greifbar wahrgenommen wird.");
  } else {
    if (matchCase === "TOP1_TOP2") {
      paras.push(`Team und Person setzen beide auf ${COMP_DOMAIN[teamPrimary]} als Hauptlogik und auf ${COMP_DOMAIN[teamSecondary]} als ergänzende Arbeitsweise. Diese doppelte Übereinstimmung sorgt für eine hohe Grundkompatibilität. Die Person denkt, entscheidet und kommuniziert in den gleichen Mustern wie das Team. Das erleichtert den Einstieg erheblich und reduziert das Risiko von Missverständnissen in den ersten Wochen.`);
      paras.push("Die Kehrseite dieser Übereinstimmung: Beide Seiten haben dieselben Stärken, aber auch dieselben blinden Flecken. Die Person ergänzt das Team nicht, sondern verstärkt es in seiner bestehenden Ausrichtung. Langfristig kann das zu einer Verengung führen, wenn keine bewusste Gegenstimme eingebracht wird.");
    } else if (matchCase === "TOP1_ONLY") {
      paras.push(`Die Hauptlogik stimmt überein: Beide Seiten setzen auf ${COMP_DOMAIN[teamPrimary]} als primäre Denk- und Entscheidungsweise. Das schafft eine stabile Grundlage, weil sich Person und Team in der grundlegenden Herangehensweise verstehen. Im Alltag unterscheidet sich jedoch die ergänzende Arbeitsweise: Das Team setzt stärker auf ${COMP_SHORT[teamSecondary]}, die Person eher auf ${COMP_SHORT[personSecondary]}.`);
      paras.push("Dadurch entsteht eine stabile Basis mit sichtbaren Unterschieden im Detail. Die Person wird nicht als Fremdkörper wahrgenommen, aber in konkreten Arbeitssituationen können unterschiedliche Erwartungen an Tempo, Kommunikation oder Gründlichkeit aufeinandertreffen. Diese Unterschiede sind typischerweise gut steuerbar und können sogar als Ergänzung wirken, wenn sie frühzeitig benannt und akzeptiert werden.");
    } else if (matchCase === "TOP2_ONLY") {
      paras.push(`Der Score spiegelt eine Konstellation mit zwei gegenläufigen Kräften wider. Einerseits fehlt die Übereinstimmung in der Hauptlogik (Top 1): Das Team setzt auf ${COMP_DOMAIN[teamPrimary]}, die Person auf ${COMP_DOMAIN[personPrimary]}. Dieser Unterschied drückt den Score deutlich nach unten, weil er die grundsätzliche Denk- und Entscheidungsrichtung betrifft.`);
      paras.push(`Andererseits stimmt die ergänzende Arbeitsweise (Top 2) überein: Beide Seiten nutzen ${COMP_SHORT[teamSecondary]}. Dieser gemeinsame Nenner fängt im Alltag einen Teil der Reibung ab und erklärt, warum die Zusammenarbeit trotz des niedrigen Scores oft besser funktioniert, als die reine Zahl vermuten lässt. Der Score bildet die strukturelle Spannung korrekt ab, überschätzt aber tendenziell die praktische Distanz.`);
    } else {
      paras.push(`Team und Person unterscheiden sich in Grundlogik und Arbeitsweise. Das Team setzt auf ${COMP_DOMAIN[teamPrimary]} mit ${COMP_SHORT[teamSecondary]}, die Person auf ${COMP_DOMAIN[personPrimary]} mit ${COMP_SHORT[personSecondary]}. Diese Spannung betrifft Kommunikation, Entscheidungen und das tägliche Miteinander.`);
      paras.push("Das muss kein Problem sein — manchmal braucht ein Team genau diese andere Perspektive. Aber es braucht aktive Führung und Klarheit darüber, warum diese Besetzung Sinn ergibt. Ohne das dominiert die Reibung den Alltag.");
    }
  }

  return paras.join("\n\n");
}


function buildWirkungAlltagText(c: Ctx): string {
  const { matchCase, teamPrimary, personPrimary, isLeader } = c;

  if (_lang === "en") {
    const paras: string[] = [];

    if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
      paras.push("In day-to-day work, both sides are likely to shift between different working approaches depending on the situation. There is no fixed direction that either side consistently enforces, and no structural friction arising from opposing logics. In meetings, decisions, and daily communication, rigid patterns are unlikely to emerge.");
      paras.push("Collaboration becomes more demanding when clear decisions or firm priorities are required. In those moments, neither side has a dominant direction to provide orientation. Clear role assignments or external input will be needed. In normal conditions, however, collaboration is likely to be practical and straightforward.");
      return paras.join("\n\n");
    }

    if (c.teamClass === "BALANCED") {
      paras.push(`In day-to-day work, the team is flexible and open to different working approaches. There is no dominant expectation that new members must immediately meet. The person, by contrast, brings a clear direction: ${cd(personPrimary)}. This will be noticeable in work life, because the person operates more consistently and purposefully in their domain than the team is used to.`);
      paras.push("This can give the team a welcome sense of direction and accelerate decisions. It can also lead to individual team members feeling pressured by the person's clear style, or gaining the impression that their own way of working is no longer valued. The deciding factor is whether the team experiences the person's direction as enriching or as dominance. Regular alignment and deliberate recognition of the team's existing diversity are key.");
      return paras.join("\n\n");
    }

    if (c.personClass === "BALANCED") {
      paras.push(`In day-to-day work, the team follows a clear line: ${cd(teamPrimary)}. Meetings, communication, and decisions align to this pattern. The person, by contrast, is more broadly positioned and shifts between different approaches situationally. In one moment they may be systematic and thorough, in the next more spontaneous and action-oriented.`);
      paras.push("The team may experience this as flexibility or as indecisiveness. What matters is how the person uses and communicates their versatility. When they consciously adapt to the team's logic and contribute their flexibility as a deliberate complement, they are likely to be seen as a valuable addition. When they constantly switch between approaches without showing a clear line, it can create frustration in the team. Clear expectations and regular feedback help stabilise the collaboration.");
      return paras.join("\n\n");
    }

    if (matchCase === "TOP1_TOP2") {
      paras.push(isLeader
        ? `Day-to-day collaboration should be smooth. Leadership style and team culture share similar priorities: ${cd(teamPrimary)} as the core logic and ${cs(c.teamSecondary)} as the supporting approach. Decisions are made in familiar ways, communication runs in familiar channels, and basic expectations around pace, thoroughness, and coordination align. The team is likely to accept the leadership quickly, because the manager's style is naturally recognisable.`
        : `Day-to-day collaboration should be smooth. Person and team share similar priorities: ${cd(teamPrimary)} as the core logic and ${cs(c.teamSecondary)} as the supporting approach. Decisions are made in familiar ways, communication runs in familiar channels, and basic expectations around pace, thoroughness, and coordination align. The person can contribute productively from early on because no fundamental adjustments are needed.`);
      paras.push("The upside is low friction, fast effectiveness, and low conflict risk. The downside is that collaboration may run too smoothly. Errors or weaknesses may go unnoticed because both sides share the same blind spots. Deliberately built-in reflection points and regular retrospectives help protect the team from one-sidedness.");
      return paras.join("\n\n");
    }

    if (matchCase === "TOP1_ONLY") {
      paras.push(`In day-to-day work, the core direction is shared: both operate through ${cd(teamPrimary)}. This creates a common foundation for collaboration. In concrete execution, however, differences become visible. The person works ${ca(c.personSecondary)}, while the team tends toward ${ca(c.teamSecondary)}. This shows up in meetings, task distribution, and the way problems are approached.`);
      paras.push("These differences can lead to productive complementarity: the person brings a different perspective on execution that can enrich the team. They can also cause misunderstandings and minor friction when the different expectations are not named openly. In practice, it is worth agreeing on concrete working norms in the first weeks and clarifying mutual expectations explicitly.");
      return paras.join("\n\n");
    }

    if (matchCase === "TOP2_ONLY") {
      paras.push(`In day-to-day work, the tension shows up most in decision situations. The team expects ${ca(teamPrimary)} approaches, the person tends ${ca(personPrimary)}. This can show up concretely as the person preparing decisions differently, prioritising different information, or judging a different pace as appropriate compared to what the team expects.`);
      paras.push(`In ongoing work, the shared layer of ${cs(c.teamSecondary)} significantly dampens these differences. In meetings, task distribution, and informal coordination, both sides find each other through ${cs(c.teamSecondary)}. Day-to-day work therefore often functions better than pure profile analysis would suggest. Friction typically arises when directional decisions are at stake and core logic becomes more prominent than the shared working layer.`);
      return paras.join("\n\n");
    }

    paras.push(`In daily work, the differences will be clearly visible. The team works through ${cd(teamPrimary)}, the person through ${cd(personPrimary)}. In meetings, decisions, and communication, different expectations collide.`);
    paras.push("This shows up concretely in how priorities are set, how quickly or thoroughly decisions are made, and what kind of coordination is expected. Without active leadership, frustration can build quickly: the person feels misunderstood, the team sees them as unadapted. Regular clarifying conversations and clear role assignments are essential.");
    return paras.join("\n\n");
  }

  const paras: string[] = [];

  if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
    paras.push("Im Alltag dürften beide Seiten situativ zwischen verschiedenen Arbeitsweisen wechseln. Es gibt keine feste Richtung, die eine der beiden Seiten konsequent durchsetzt, aber auch keine strukturelle Reibung, die aus gegensätzlichen Logiken entsteht. In Meetings, bei Entscheidungen und in der täglichen Kommunikation zeigen sich voraussichtlich wenig festgefahrene Muster.");
    paras.push("Die Zusammenarbeit wird erst dann herausfordernd, wenn klare Entscheidungen oder eindeutige Priorisierung gefragt sind. In solchen Momenten fehlt auf beiden Seiten eine dominante Richtung, die Orientierung gibt. Dann braucht es entweder klare Zuständigkeiten oder eine externe Instanz, die die Richtung vorgibt. Im Normalfall dürfte die Zusammenarbeit aber pragmatisch und unkompliziert verlaufen.");
    return paras.join("\n\n");
  }

  if (c.teamClass === "BALANCED") {
    paras.push(`Im Alltag ist das Team flexibel und offen für verschiedene Arbeitsweisen. Es gibt keine dominante Erwartungshaltung, die neue Mitglieder sofort erfüllen müssen. Die Person bringt dagegen eine klare Richtung mit: ${COMP_DOMAIN[personPrimary]}. Das wird im Arbeitsalltag spürbar sein, weil die Person konsequenter und zielgerichteter in ihrem Bereich agiert als das Team es gewohnt ist.`);
    paras.push("Das kann dem Team eine willkommene Orientierung geben und Entscheidungen beschleunigen. Es kann aber auch dazu führen, dass einzelne Teammitglieder sich durch den klaren Stil der Person unter Druck gesetzt fühlen oder den Eindruck gewinnen, dass ihre eigene Arbeitsweise nicht mehr geschätzt wird. Entscheidend ist, ob das Team die Richtung der Person als Bereicherung annimmt oder als Dominanz erlebt. Regelmässige Abstimmung und bewusste Wertschätzung der bestehenden Teamvielfalt sind hier zentral.");
    return paras.join("\n\n");
  }

  if (c.personClass === "BALANCED") {
    paras.push(`Im Alltag folgt das Team einer klaren Linie: ${COMP_DOMAIN[teamPrimary]}. Meetings, Kommunikation und Entscheidungen orientieren sich an diesem Muster. Die Person ist dagegen breiter aufgestellt und wechselt situativ zwischen verschiedenen Herangehensweisen. Im einen Moment reagiert sie analytisch und strukturiert, im nächsten spontan und handlungsorientiert.`);
    paras.push("Das kann vom Team als Flexibilität oder als Unentschlossenheit wahrgenommen werden. Entscheidend ist, wie die Person ihre Vielseitigkeit einsetzt und kommuniziert. Wenn sie sich bewusst an die Teamlogik anpasst und ihre Flexibilität gezielt als Ergänzung einbringt, wird sie als wertvolle Bereicherung wahrgenommen. Wenn sie dagegen ständig zwischen verschiedenen Herangehensweisen wechselt, ohne eine klare Linie zu zeigen, kann das Irritation im Team auslösen. Klare Erwartungen und regelmässiges Feedback helfen, die Zusammenarbeit zu stabilisieren.");
    return paras.join("\n\n");
  }

  if (matchCase === "TOP1_TOP2") {
    paras.push(isLeader
      ? `Im Alltag dürfte die Zusammenarbeit reibungsarm verlaufen. Führungsstil und Teamkultur setzen auf ähnliche Schwerpunkte: ${COMP_DOMAIN[teamPrimary]} als Grundlogik und ${COMP_SHORT[c.teamSecondary]} als ergänzende Arbeitsweise. Entscheidungen werden ähnlich getroffen, Kommunikation verläuft in vertrauten Bahnen, und die grundlegenden Erwartungen an Tempo, Gründlichkeit und Abstimmung stimmen überein. Das Team wird die Führung voraussichtlich gut annehmen, weil es den Stil intuitiv versteht.`
      : `Im Alltag dürfte die Zusammenarbeit reibungsarm verlaufen. Person und Team setzen auf ähnliche Schwerpunkte: ${COMP_DOMAIN[teamPrimary]} als Grundlogik und ${COMP_SHORT[c.teamSecondary]} als ergänzende Arbeitsweise. Entscheidungen werden ähnlich getroffen, Kommunikation verläuft in vertrauten Bahnen, und die grundlegenden Erwartungen an Tempo, Gründlichkeit und Abstimmung stimmen überein. Die Person kann sich schnell produktiv einbringen, weil keine grundsätzlichen Anpassungen nötig sind.`);
    paras.push("Der Vorteil: Wenig Einarbeitungszeit, schnelle Wirksamkeit, geringe Konfliktgefahr. Der Nachteil: Die Zusammenarbeit kann zu glatt laufen. Fehler oder Schwächen werden möglicherweise nicht erkannt, weil beide Seiten dieselben blinden Flecken haben. Bewusst eingebaute Reflexionspunkte und regelmässige Retrospektiven können hier helfen, das Team vor Einseitigkeit zu schützen.");
    return paras.join("\n\n");
  }

  if (matchCase === "TOP1_ONLY") {
    paras.push(`Im Alltag wird die grundlegende Denkrichtung geteilt: Beide setzen auf ${COMP_DOMAIN[teamPrimary]}. Das schafft ein gemeinsames Fundament, auf dem Zusammenarbeit aufbauen kann. In der konkreten Umsetzung zeigen sich jedoch Unterschiede, die im täglichen Miteinander sichtbar werden. Die Person arbeitet ${COMP_ADJ[c.personSecondary]}, während das Team eher ${COMP_ADJ[c.teamSecondary]} vorgeht. Das zeigt sich in Meetings, bei der Aufgabenverteilung und in der Art, wie Probleme angegangen werden.`);
    paras.push("Diese Unterschiede können zu produktiver Ergänzung führen: Die Person bringt eine andere Perspektive in die Umsetzung ein, die das Team bereichern kann. Sie können aber auch zu Missverständnissen und kleineren Irritationen führen, wenn die unterschiedlichen Erwartungen nicht offen benannt werden. In der Praxis empfiehlt es sich, in den ersten Wochen konkrete Spielregeln für die Zusammenarbeit zu vereinbaren und gegenseitige Erwartungen explizit zu klären.");
    return paras.join("\n\n");
  }

  if (matchCase === "TOP2_ONLY") {
    paras.push(`Im Alltag zeigt sich die Spannung vor allem in Entscheidungssituationen: Das Team erwartet ${COMP_ADJ[teamPrimary]} Vorgehen, die Person nähert sich ${COMP_ADJ[personPrimary]}. Das kann sich konkret darin äussern, dass die Person Entscheidungen anders vorbereitet, andere Informationen priorisiert oder ein anderes Tempo für angemessen hält, als das Team es gewohnt ist.`);
    paras.push(`Im Tagesgeschäft federt die gemeinsame Ebene über ${COMP_SHORT[c.teamSecondary]} diese Unterschiede jedoch deutlich ab. In Meetings, bei der Aufgabenverteilung und in der informellen Abstimmung finden beide Seiten über ${COMP_SHORT[c.teamSecondary]} zueinander. Der Alltag funktioniert deshalb oft besser als die reine Profilanalyse vermuten lässt. Reibung entsteht typischerweise dann, wenn es um Richtungsentscheidungen geht und die Grundlogik stärker durchschlägt als die gemeinsame Arbeitsebene.`);
    return paras.join("\n\n");
  }

  paras.push(`Im Alltag werden die Unterschiede deutlich sichtbar. Das Team arbeitet über ${COMP_DOMAIN[teamPrimary]}, die Person über ${COMP_DOMAIN[personPrimary]}. In Meetings, bei Entscheidungen und in der Kommunikation treffen unterschiedliche Erwartungen aufeinander.`);
  paras.push("Das zeigt sich konkret darin, wie Prioritäten gesetzt werden, wie schnell oder gründlich Entscheidungen fallen und welche Art von Abstimmung erwartet wird. Ohne aktive Führung kann das schnell zu Frustration führen: Die Person fühlt sich nicht verstanden, das Team empfindet sie als unangepasst. Regelmässige Klärungsgespräche und klare Zuständigkeiten sind hier unbedingt nötig.");
  return paras.join("\n\n");
}


function buildChancenRisiken(c: Ctx): { chancen: V4Block[]; risiken: V4Block[]; chancenRisikenEinordnung: string } {
  const chancen: V4Block[] = [];
  const risiken: V4Block[] = [];

  if (_lang === "en") {
    if (c.matchCase === "TOP1_TOP2") {
      chancen.push({ title: "Fast integration", text: "The person can get up to speed quickly because their working logic matches the team's. The onboarding period should be short, and the person can contribute productively to team results early. This saves leadership time and reduces the risk of a difficult start." });
      chancen.push({ title: "High acceptance", text: "The team is likely to receive the person well, because working culture and communication feel familiar. The person speaks the same language as the team and makes decisions in a similar way. Trust builds quickly, forming the foundation for productive collaboration." });
      chancen.push({ title: "Stable collaboration", text: "Little friction arises in daily work. Team energy can go into the actual task rather than into integration conflicts. Under pressure, collaboration is likely to remain stable because both sides respond in similar ways." });
      risiken.push({ title: "No complementary input", text: "The strong similarity means no broadening impulse is added. Blind spots are not uncovered but may be reinforced. Over time the team can become more one-sided and miss important developments." });
      risiken.push({ title: "Confirmation tendency", text: "The person reinforces existing patterns rather than challenging them. When everyone thinks alike, weaknesses become invisible and errors repeat." });
    } else if (c.matchCase === "TOP1_ONLY") {
      chancen.push({ title: "Shared core direction", text: `Both sides operate through ${cd(c.teamPrimary)} as their primary working logic. This creates a stable foundation and reduces the risk of fundamental misunderstandings. The person is understood in their thinking and can work on familiar ground.` });
      chancen.push({ title: `Complement through ${cs(c.personSecondary)}`, text: `The person brings ${cs(c.personSecondary)} as a supporting approach, while the team relies more on ${cs(c.teamSecondary)}. Concretely, this means: ${c.personSecondary === "impulsiv" ? "faster decisions, more delivery momentum, and a more pragmatic approach to tasks" : c.personSecondary === "analytisch" ? "more structured thinking, more systematic preparation, and more careful analysis before decisions" : "stronger involvement of all parties, more coordination, and a relationship-oriented working style"}. This can strengthen the team in this area without threatening the shared core logic.` });
      chancen.push({ title: "Learning opportunity for both sides", text: `The differences in working approach create a learning opportunity. The team can learn from the person ${c.personSecondary === "impulsiv" ? "more pace and decisiveness" : c.personSecondary === "analytisch" ? "more depth and structure" : "more openness and exchange"}, and the person can learn from the team ${c.teamSecondary === "impulsiv" ? "speed and pragmatism" : c.teamSecondary === "analytisch" ? "thoroughness and accuracy" : "coordination and team orientation"}. This mutual enrichment can increase the team's versatility over time.` });
      risiken.push({ title: "Different pace and approach", text: `In concrete execution, team and person differ noticeably. The team expects ${c.teamSecondary === "analytisch" ? "more thoroughness and careful checking" : c.teamSecondary === "impulsiv" ? "fast action and results focus" : "coordination and joint decision-making"}, while the person tends ${c.personSecondary === "impulsiv" ? "toward faster action and can be seen as hasty" : c.personSecondary === "analytisch" ? "toward more detail and can be seen as too slow" : "toward conversation and inclusion, and can be seen as too hesitant"}. In turn, the person may experience the team as ${c.teamSecondary === "analytisch" ? "too slow and too cautious" : c.teamSecondary === "impulsiv" ? "too reactive and too shallow" : "too consensus-driven and too reluctant to decide"}.` });
      risiken.push({ title: "Need for alignment", text: "The person understands the team's core logic and does not feel out of place. They still need guidance in concrete execution and clear signals about how the team handles things. Without this orientation, well-intentioned contributions can land awkwardly." });
    } else if (c.matchCase === "TOP2_ONLY") {
      chancen.push({ title: "Different perspective", text: `The person brings ${cd(c.personPrimary)} into a team that has limited representation of this. They can take on tasks where the team has gaps and raise topics that others are not tracking.` });
      chancen.push({ title: "Shared working layer", text: `In day-to-day work, there is an important overlap through ${cs(c.teamSecondary)}. This gives person and team a point of connection, even when the core logic differs significantly.` });
      chancen.push({ title: "Broader capability range", text: `The team becomes more versatile through this person, without being turned upside down. ${cd(c.personPrimary)} was underrepresented before. When used well, the team can address a wider range of problems effectively.` });
      risiken.push({ title: "Fundamental friction", text: `The thinking logics differ clearly. The team operates through ${cs(c.teamPrimary)}, the person works primarily through ${cs(c.personPrimary)}. This difference shows up in decisions, prioritisation, and communication. Without clear framing, it can lead to recurring conflicts.` });
      risiken.push({ title: "Leadership effort", text: `Leadership must actively clarify when ${cs(c.teamPrimary)} takes precedence and when ${cs(c.personPrimary)} is called for. Without this framing, each side will see the other's behaviour as wrong.` });
      risiken.push({ title: "Misinterpretation", text: "The team may perceive the person's behaviour as unadapted, even though it is structurally grounded. Without framing from leadership, biases form that make integration harder over time." });
    } else {
      chancen.push({ title: "New perspective", text: `The person thinks and works differently from the team. When used well, they can raise topics nobody else is tracking and take on tasks where the team has gaps. ${cd(c.personPrimary)} is underrepresented in the team. That can be a real gain.` });
      chancen.push({ title: "Making weaknesses visible", text: "What the team systematically overlooks is often the first thing the person notices, because they do not think in the same patterns. This can be uncomfortable, but it helps identify problems earlier." });
      chancen.push({ title: "Mutual learning", text: "When collaboration works well, both sides learn from each other. The team gains a different view on things it has taken for granted. The person learns how the team thinks and decides. Both become more capable over time." });
      risiken.push({ title: "Strong friction", text: "Team and person work in fundamentally different ways. This creates tension in communication, decisions, and prioritisation. Without active management, recurring conflicts can develop that are hard to break." });
      risiken.push({ title: "High leadership effort", text: "Leadership must invest significantly more time in moderating between person and team than in a closer fit. This effort should not be underestimated." });
      risiken.push({ title: "Risk of isolation", text: "The person may feel isolated when team culture does not support their way of working. If motivation drops over time, disengagement or early departure becomes a risk." });
    }

    if (c.teamClass === "BALANCED") {
      chancen.push({ title: "Open system", text: "The balanced team has no rigid expectations and can accommodate different working styles. This lowers the entry threshold for the person and enables a more flexible integration." });
      risiken.push({ title: "Directional shift", text: "A person with a clear dominance can shift the existing team balance in one direction. Without deliberate management, the team may lose its versatility and gradually align to the new person's logic." });
    }

    if (c.personClass === "BALANCED") {
      chancen.push({ title: "Flexibility", text: "The person can adapt to different team dynamics and shift between working approaches situationally. This adds flexibility to the team and allows the person to be effective across different contexts." });
      risiken.push({ title: "Unclear profile", text: "The person may come across as hard to read or indecisive. The team lacks a clear picture of what the person stands for and what specific contribution they bring. This can create uncertainty and reduce trust." });
    }

    let einordnung: string;
    if (c.score >= 85) {
      einordnung = "The opportunities clearly outweigh the risks. The strong alignment makes onboarding and daily collaboration easier. The main risk is the absence of complementary input. The team may become more one-sided through reinforcement.";
    } else if (c.score >= 60) {
      einordnung = "Opportunities and risks are balanced. This placement can work well, but it needs clear expectations and regular alignment. The deciding factor is whether the differences become a productive complement or a source of recurring friction.";
    } else {
      einordnung = "The risks outweigh the opportunities. This placement can still be right, but only if this different working style is genuinely needed in the team and leadership communicates that actively.";
    }

    return { chancen, risiken, chancenRisikenEinordnung: einordnung };
  }

  if (c.matchCase === "TOP1_TOP2") {
    chancen.push({ title: "Schnelle Integration", text: "Die Person kann sich schnell einarbeiten, weil Denk- und Arbeitsweise zum Team passen. Die Eingewöhnungsphase ist voraussichtlich kurz, und die Person kann früh produktiv zum Teamergebnis beitragen. Das spart Führungszeit und reduziert das Risiko eines schwierigen Starts." });
    chancen.push({ title: "Hohe Akzeptanz", text: "Das Team wird die Person voraussichtlich gut aufnehmen, weil Arbeitskultur und Kommunikation ähnlich sind. Die Person spricht die gleiche Sprache wie das Team und trifft Entscheidungen auf ähnliche Weise. Dadurch entsteht schnell Vertrauen, das die Grundlage für eine produktive Zusammenarbeit ist." });
    chancen.push({ title: "Stabile Zusammenarbeit", text: "Im Alltag entsteht wenig Reibung. Die Energie des Teams und der Person kann in die eigentliche Aufgabe fliessen, statt in Integrationskonflikte und Anpassungsprozesse. In Druckphasen bleibt die Zusammenarbeit voraussichtlich stabil, weil beide Seiten ähnlich reagieren." });
    risiken.push({ title: "Fehlende Ergänzung", text: "Durch die hohe Ähnlichkeit fehlt ein ergänzender Impuls. Blinde Flecken werden nicht aufgedeckt, sondern möglicherweise verstärkt. Langfristig kann das Team in seiner Ausrichtung verharren und wichtige Entwicklungen verpassen." });
    risiken.push({ title: "Bestätigungstendenz", text: "Die Person verstärkt bestehende Muster, statt sie zu hinterfragen. Wenn alle ähnlich denken, werden Schwächen unsichtbar und Fehler wiederholen sich." });
  } else if (c.matchCase === "TOP1_ONLY") {
    chancen.push({ title: "Gemeinsame Grundrichtung", text: `Beide Seiten setzen auf ${COMP_DOMAIN[c.teamPrimary]} als primäre Arbeitslogik. Das schafft eine stabile Basis für die Zusammenarbeit und reduziert das Risiko grundlegender Missverständnisse. Die Person wird in ihrer Denkweise verstanden und kann sich auf vertrautem Boden bewegen.` });
    chancen.push({ title: `Ergänzung durch ${COMP_SHORT[c.personSecondary]}`, text: `Die Person bringt im Alltag ${COMP_SHORT[c.personSecondary]} als ergänzende Arbeitsweise ein, während das Team stärker auf ${COMP_SHORT[c.teamSecondary]} setzt. Konkret bedeutet das: ${c.personSecondary === "impulsiv" ? "schnellere Entscheidungen, mehr Umsetzungsdynamik und einen pragmatischeren Zugriff auf Themen" : c.personSecondary === "analytisch" ? "mehr Strukturdenken, systematischere Aufbereitung und sorgfältigere Analyse vor Entscheidungen" : "stärkere Einbindung aller Beteiligten, mehr Abstimmung und einen beziehungsorientierten Arbeitsstil"}. Das kann das Team in diesem Bereich gezielt stärken, ohne die gemeinsame Grundlogik zu gefährden.` });
    chancen.push({ title: "Lerneffekt für beide Seiten", text: `Die Unterschiede in der konkreten Arbeitsweise bieten eine Lernchance. Das Team kann von der Person ${c.personSecondary === "impulsiv" ? "mehr Tempo und Entschlusskraft" : c.personSecondary === "analytisch" ? "mehr Tiefe und Struktur" : "mehr Offenheit und Austausch"} übernehmen, und die Person kann vom Team ${c.teamSecondary === "impulsiv" ? "Geschwindigkeit und Pragmatismus" : c.teamSecondary === "analytisch" ? "Gründlichkeit und Genauigkeit" : "Abstimmung und Teamorientierung"} lernen. Diese gegenseitige Bereicherung kann langfristig die Vielseitigkeit des Teams erhöhen.` });
    risiken.push({ title: "Unterschiedliches Tempo und Vorgehen", text: `Im konkreten Vorgehen unterscheiden sich Team und Person deutlich. Das Team erwartet ${c.teamSecondary === "analytisch" ? "mehr Absicherung und Genauigkeit" : c.teamSecondary === "impulsiv" ? "schnelles Handeln und Ergebnisorientierung" : "Abstimmung und gemeinsame Entscheidungsfindung"}, die Person geht eher ${c.personSecondary === "impulsiv" ? "schneller in Handlung und kann vom Team als vorschnell erlebt werden" : c.personSecondary === "analytisch" ? "gründlicher und detaillierter vor und kann vom Team als zu langsam erlebt werden" : "den Weg über Gespräche und Einbindung und kann vom Team als zu zögerlich erlebt werden"}. Umgekehrt kann die Person das Team als ${c.teamSecondary === "analytisch" ? "zu langsam und zu vorsichtig" : c.teamSecondary === "impulsiv" ? "zu sprunghaft und zu oberflächlich" : "zu konsensorientiert und zu wenig entscheidungsfreudig"} erleben.` });
    risiken.push({ title: "Abstimmungsbedarf", text: "Die Person versteht die Teamlogik grundsätzlich und fühlt sich nicht als Fremdkörper. Sie braucht aber Orientierung in der konkreten Umsetzung und klare Hinweise darauf, wie das Team bestimmte Dinge gewohnt ist zu handhaben. Ohne diese Orientierung können gut gemeinte Beiträge ungewollt anecken." });
  } else if (c.matchCase === "TOP2_ONLY") {
    chancen.push({ title: "Andere Perspektive", text: `Die Person bringt ${COMP_DOMAIN[c.personPrimary]} in ein Team, das bisher wenig davon hat. Sie kann Aufgaben angehen, bei denen das Team Lücken hat, und Themen ansprechen, die sonst niemand auf dem Schirm hat.` });
    chancen.push({ title: "Gemeinsame Arbeitsebene", text: `Im Tagesgeschäft gibt es eine wichtige Überschneidung über ${COMP_SHORT[c.teamSecondary]}. Dort finden Person und Team einen Anschlusspunkt — auch wenn die Denklogik grundverschieden ist.` });
    chancen.push({ title: "Breiteres Spektrum", text: `Das Team wird durch die Person vielseitiger — ohne komplett umgekrempelt zu werden. ${COMP_DOMAIN[c.personPrimary]} war bisher schwach vertreten. Wenn das genutzt wird, kann das Team künftig mehr Arten von Problemen gut lösen.` });
    risiken.push({ title: "Grundsätzliche Reibung", text: `Die Denklogik unterscheidet sich deutlich. Das Team erwartet und lebt ${COMP_SHORT[c.teamPrimary]}, die Person arbeitet dagegen primär über ${COMP_SHORT[c.personPrimary]}. Dieser Unterschied wird in Entscheidungssituationen, bei der Priorisierung und in der Kommunikation spürbar. Ohne klare Einordnung kann er zu wiederkehrenden Konflikten führen.` });
    risiken.push({ title: "Führungsaufwand", text: `Die Führung muss aktiv klären, wann ${COMP_SHORT[c.teamPrimary]} Vorrang hat und wann ${COMP_SHORT[c.personPrimary]} gefragt ist. Ohne diese Einordnung hält jede Seite das Verhalten der anderen für falsch.` });
    risiken.push({ title: "Fehlinterpretation", text: "Das Team kann das Verhalten der Person als unangepasst wahrnehmen, obwohl es strukturell bedingt ist. Ohne Einordnung durch die Führung entstehen Vorurteile, die die Integration nachhaltig erschweren." });
  } else {
    chancen.push({ title: "Neue Perspektive", text: `Die Person denkt und arbeitet anders als das Team. Wenn das genutzt wird, kann sie Themen ansprechen, die sonst niemand auf dem Schirm hat, und Aufgaben angehen, bei denen das Team bisher Lücken hat. ${COMP_DOMAIN[c.personPrimary]} ist im Team bisher wenig vertreten — das kann ein echter Gewinn sein.` });
    chancen.push({ title: "Schwächen sichtbar machen", text: `Was das Team systematisch übersieht, fällt der Person oft als erstes auf — weil sie nicht in denselben Mustern denkt. Das ist manchmal unbequem, aber es hilft, Probleme früher zu erkennen.` });
    chancen.push({ title: "Team kann dazulernen", text: "Wenn die Zusammenarbeit gut läuft, lernen beide Seiten voneinander. Das Team bekommt einen anderen Blick auf Dinge, die es bisher selbstverständlich gemacht hat. Die Person lernt, wie das Team denkt und entscheidet. Das macht beide Seiten langfristig besser." });
    risiken.push({ title: "Starke Reibung", text: "Team und Person arbeiten grundverschieden. Das führt zu Spannungen in Kommunikation, Entscheidungen und Priorisierung. Ohne aktive Steuerung können sich wiederkehrende Konflikte entwickeln, die schwer zu durchbrechen sind." });
    risiken.push({ title: "Hoher Führungsaufwand", text: "Die Führungskraft muss deutlich mehr Zeit in die Moderation zwischen Person und Team investieren als bei höherer Passung. Dieser Aufwand darf nicht unterschätzt werden." });
    risiken.push({ title: "Isolationsrisiko", text: "Die Person kann sich isoliert fühlen, wenn die Teamkultur ihre Arbeitsweise nicht stützt. Sinkt die Motivation dauerhaft, droht innerer Rückzug oder frühzeitiger Abgang." });
  }

  if (c.teamClass === "BALANCED") {
    chancen.push({ title: "Offenes System", text: "Das ausgeglichene Team hat keine starre Erwartungshaltung und kann unterschiedliche Arbeitsweisen gut aufnehmen. Das senkt die Eintrittshürde für die Person und ermöglicht eine flexiblere Integration." });
    risiken.push({ title: "Richtungsverschiebung", text: "Eine Person mit klarer Dominanz kann die bestehende Balance im Team einseitig verschieben. Wenn das nicht bewusst gesteuert wird, verliert das Team seine bisherige Vielseitigkeit und richtet sich zunehmend an der Logik der neuen Person aus." });
  }

  if (c.personClass === "BALANCED") {
    chancen.push({ title: "Flexibilität", text: "Die Person kann sich an verschiedene Teamdynamiken anpassen und situativ zwischen Arbeitsweisen wechseln. Das gibt dem Team zusätzliche Flexibilität und ermöglicht es der Person, in verschiedenen Kontexten wirksam zu sein." });
    risiken.push({ title: "Profilunschärfe", text: "Die Person wird möglicherweise als wenig greifbar oder unentschlossen wahrgenommen. Dem Team fehlt ein klares Bild davon, wofür die Person steht und welchen spezifischen Beitrag sie leistet. Das kann zu Unsicherheit und mangelndem Vertrauen führen." });
  }

  let einordnung: string;
  if (c.score >= 85) {
    einordnung = "Die Chancen überwiegen deutlich. Die hohe Übereinstimmung erleichtert den Einstieg und die tägliche Zusammenarbeit. Das Hauptrisiko ist die fehlende Ergänzung — das Team könnte durch die Verstärkung einseitiger werden.";
  } else if (c.score >= 60) {
    einordnung = "Chancen und Risiken halten sich die Waage. Die Besetzung kann gut funktionieren, braucht aber klare Erwartungen und regelmässige Abstimmung. Entscheidend ist, ob die Unterschiede als Ergänzung genutzt werden oder zur Dauerreibung werden.";
  } else {
    einordnung = "Die Risiken überwiegen. Die Besetzung kann trotzdem richtig sein — aber nur, wenn diese andere Arbeitsweise im Team wirklich gebraucht wird und die Führung das auch aktiv vermittelt.";
  }

  return { chancen, risiken, chancenRisikenEinordnung: einordnung };
}


function buildDruckText(c: Ctx): string {
  if (_lang === "en") {
    const paras: string[] = [];

    if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
      paras.push("Under pressure, neither the team nor the person shows a clearly predictable shift toward any particular pattern. Both sides respond situationally and can move between different strategies. This can be an advantage when no rigid reaction takes over, but also a disadvantage when the response becomes unpredictable and unfocused.");
      paras.push("In high-pressure moments, a clear direction that everyone can follow is missing. The risk lies in indecision, parallel actions without coordination, and a general slowing of decisions. It is therefore important that clear responsibilities, defined decision paths, and explicit prioritisation are established before pressure builds.");
      return paras.join("\n\n");
    }

    if (c.matchCase === "TOP1_TOP2") {
      paras.push(`Under pressure, both sides intensify the shared core logic: ${cd(c.teamPrimary)}. Team and person pull in the same direction in stressful situations. Consistency increases because everyone pursues the same strategy: ${ca(c.teamPrimary)}. In acute crises, this can be an advantage because the response is fast and coordinated.`);
      paras.push(`The downside: under pressure, blind spots become especially prominent. When everyone responds ${ca(c.teamPrimary)}, other important aspects recede. ${cd(c.personSecondary)} may be neglected too strongly, leading to one-sided decisions with long-term consequences. Deliberate counterbalancing and an explicit question about the neglected perspective can help.`);
      return paras.join("\n\n");
    }

    if (c.matchCase === "TOP1_ONLY") {
      paras.push(`Under pressure, both sides strengthen the shared core logic: ${cd(c.teamPrimary)}. At the strategic level, team and person will draw closer together. The differences in working approach may, however, become more pronounced. The person responds ${ca(c.personSecondary)}, while the team expects ${cs(c.teamSecondary)}.`);
      paras.push("This means strategic direction is shared while execution can create tension. The person wants to proceed differently from the team's habit, even though both pursue the same goal. Clear communication under pressure is decisive to keep this tension productive. Pre-agreed norms for handling stressful situations help prevent conflict.");
      return paras.join("\n\n");
    }

    if (c.matchCase === "TOP2_ONLY") {
      paras.push(`Under pressure, both sides intensify their respective core logic. The team responds ${ca(c.teamPrimary)} and retreats into ${cd(c.teamPrimary)}. The person intensifies ${cd(c.personPrimary)} and responds ${ca(c.personPrimary)}. Under normal conditions, the shared secondary layer (${cs(c.teamSecondary)}) keeps contact between both sides. As pressure builds, this bridge comes under strain.`);
      paras.push(`Under moderate pressure, ${cs(c.teamSecondary)} can still serve as a mediation layer: both sides find their way back to exchange through it. Under strong or sustained pressure, this bridge breaks. Then the core logic of each side dominates, and collaboration polarises: the team expects ${ca(c.teamPrimary)} responses, the person delivers ${ca(c.personPrimary)} answers. In such phases, decision paths and responsibilities must be pre-defined to prevent the contact from breaking.`);
      return paras.join("\n\n");
    }

    paras.push(`Under pressure, the differences become more pronounced. The team responds ${ca(c.teamPrimary)}, the person ${ca(c.personPrimary)}. Both sides retreat to their own logic and move further apart rather than coming together.`);
    paras.push("In these phases, conflict risk rises. Misunderstandings accumulate, tolerance drops. Clear escalation paths and a leadership style that actively moderates under pressure are essential here.");
    return paras.join("\n\n");
  }

  const paras: string[] = [];

  if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
    paras.push("Unter Druck zeigen weder Team noch Person eine klar vorhersagbare Verschiebung in Richtung eines bestimmten Musters. Beide Seiten reagieren situativ und können zwischen verschiedenen Strategien wechseln. Das kann ein Vorteil sein, weil keine starre Reaktion dominiert, aber auch ein Nachteil, weil die Reaktion unvorhersehbar und diffus werden kann.");
    paras.push("In Druckphasen fehlt dann eine klare Richtung, an der sich alle orientieren können. Das Risiko besteht in Unentschlossenheit, parallelen Aktionen ohne Abstimmung und einer allgemeinen Verlangsamung der Entscheidungsprozesse. Wichtig ist deshalb, dass in solchen Phasen klare Zuständigkeiten, definierte Entscheidungswege und eine eindeutige Priorisierung etabliert sind, bevor der Druck einsetzt.");
  } else if (c.matchCase === "TOP1_TOP2") {
    paras.push(`Unter Druck verstärken beide Seiten die gemeinsame Hauptlogik: ${COMP_DOMAIN[c.teamPrimary]}. Das führt dazu, dass Team und Person in Stresssituationen noch enger zusammenrücken und in die gleiche Richtung ziehen. Die Konsistenz steigt, weil alle dieselbe Strategie verfolgen: ${COMP_ADJ[c.teamPrimary]}. Das kann in akuten Krisen ein Vorteil sein, weil schnell und geschlossen reagiert wird.`);
    paras.push(`Die Kehrseite: Unter Druck werden blinde Flecken besonders sichtbar. Wenn alle ${COMP_ADJ[c.teamPrimary]} reagieren, treten andere wichtige Aspekte in den Hintergrund. ${COMP_DOMAIN[c.personSecondary]} wird möglicherweise zu stark vernachlässigt, was zu einseitigen Entscheidungen führen kann, die sich langfristig rächen. Bewusstes Gegensteuern in Druckphasen und die gezielte Frage nach der vernachlässigten Perspektive können hier helfen.`);
  } else if (c.matchCase === "TOP1_ONLY") {
    paras.push(`Unter Druck verstärkt sich bei beiden Seiten die gemeinsame Hauptlogik: ${COMP_DOMAIN[c.teamPrimary]}. In der Grundrichtung werden Team und Person also enger zusammenrücken. Die Unterschiede in der konkreten Arbeitsweise können sich dabei allerdings verschärfen. Die Person reagiert unter Druck ${COMP_ADJ[c.personSecondary]}, während das Team eher ${COMP_SHORT[c.teamSecondary]} erwartet.`);
    paras.push("Das bedeutet: In der strategischen Richtung herrscht Einigkeit, in der Umsetzung können Spannungen entstehen. Die Person möchte anders vorgehen als das Team es gewohnt ist, obwohl beide dasselbe Ziel verfolgen. Klare Kommunikation in Druckphasen ist entscheidend, um diese Spannung produktiv zu halten. Vorher vereinbarte Regeln für den Umgang mit Stress können helfen, Konflikte zu vermeiden.");
  } else if (c.matchCase === "TOP2_ONLY") {
    paras.push(`Unter Druck verstärken beide Seiten ihre jeweilige Hauptlogik: Das Team reagiert ${COMP_ADJ[c.teamPrimary]} und zieht sich auf ${COMP_DOMAIN[c.teamPrimary]} zurück. Die Person verstärkt ${COMP_DOMAIN[c.personPrimary]} und reagiert ${COMP_ADJ[c.personPrimary]}. Im Normalzustand hält die gemeinsame sekundäre Ebene (${COMP_SHORT[c.teamSecondary]}) den Kontakt zwischen beiden Seiten aufrecht. Unter wachsendem Druck wird diese Brücke zunehmend belastet.`);
    paras.push(`Bei moderatem Druck kann ${COMP_SHORT[c.teamSecondary]} noch als Vermittlungsebene funktionieren: Beide Seiten finden darüber zurück in den Austausch. Bei starkem oder anhaltendem Druck kippt diese Brücke. Dann dominiert auf beiden Seiten die jeweilige Hauptlogik, und die Zusammenarbeit polarisiert sich: Das Team erwartet ${COMP_ADJ[c.teamPrimary]} Reaktionen, die Person liefert ${COMP_ADJ[c.personPrimary]} Antworten. In solchen Phasen müssen Entscheidungswege und Zuständigkeiten vorher definiert sein, damit der Kontakt nicht abreisst.`);
  } else {
    paras.push(`Unter Druck werden die Unterschiede spürbarer. Das Team reagiert ${COMP_ADJ[c.teamPrimary]}, die Person ${COMP_ADJ[c.personPrimary]}. Beide Seiten ziehen sich auf ihre eigene Logik zurück und entfernen sich voneinander, statt zusammenzurücken.`);
    paras.push("In solchen Phasen steigt die Konfliktgefahr. Missverständnisse häufen sich, die Toleranz sinkt. Klare Eskalationswege und eine Führung, die in Druckphasen aktiv moderiert, sind hier unbedingt nötig.");
  }

  return paras.join("\n\n");
}


function buildFuehrungshinweis(c: Ctx): V4Block[] | null {
  if (!c.isLeader) return null;

  const hints: V4Block[] = [];

  if (_lang === "en") {
    if (c.matchCase === "TOP1_TOP2") {
      hints.push({ title: "Build trust and anchor the role", text: "The manager is likely to be accepted quickly because they naturally share the team's logic. Use this favourable start to set clear expectations and establish the role in the first weeks. Define the key goals for the first ninety days together with the manager and make clear what decision-making scope exists. Fast acceptance is an advantage that should be used deliberately." });
      hints.push({ title: "Actively demand complementary input", text: "When manager and team align closely, blind spots tend to be reinforced rather than uncovered. Actively request that the manager also introduces unfamiliar perspectives and challenges the team constructively. A manager who only confirms what the team already thinks is not using their full potential. Regular reflection on what might be overlooked is helpful here." });
      hints.push({ title: "Monitor development", text: "After the first three months, observe whether the manager is setting their own direction or adapting too strongly to the existing team culture. A strong manager must also make uncomfortable decisions and cannot settle into simply confirming the status quo." });
    } else if (c.matchCase === "TOP1_ONLY") {
      hints.push({ title: "Use the shared core logic as a trust base", text: `The manager shares the team's primary logic (${cd(c.teamPrimary)}). Use this advantage deliberately to build trust in the first weeks. At the same time, be transparent early about where the leadership style differs in detail, specifically around ${cs(c.personSecondary)} compared to the team's expectation of ${cs(c.teamSecondary)}. The more concrete this clarification, the less friction in day-to-day work.` });
      hints.push({ title: "Install feedback loops", text: "Set up regular feedback conversations between manager and team in the first ninety days. These should be structured and address both task-level collaboration and interpersonal dynamics. Typical questions: What is working well? Where is friction showing up? What does the team need from the manager? What does the manager need from the team? Early communication like this prevents misunderstandings from becoming fixed." });
      hints.push({ title: "Make the complementary element visible", text: `The manager brings ${cs(c.personSecondary)} as a different nuance to daily work. Show the team where this complement helps, and frame differences as an enrichment, not a weakness.` });
    } else if (c.matchCase === "TOP2_ONLY") {
      hints.push({ title: "Frame the leadership style actively", text: `The manager thinks and decides through ${cd(c.personPrimary)}, while the team expects ${cd(c.teamPrimary)}. Explain to the team concretely why a different thinking logic in this leadership role is intentional. Without this framing, the team will interpret the leadership style as a misplacement rather than a deliberate choice.` });
      hints.push({ title: "Use the shared working layer deliberately", text: `Both sides share ${cs(c.teamSecondary)} as a working approach. Use this bridge consciously: structure team meetings and coordination formats so that ${cs(c.teamSecondary)} dominates as the communication layer. This helps the manager build trust even when the strategic thinking direction differs.` });
      hints.push({ title: "Prepare for directional decisions", text: `In strategic matters, the difference in core logic will be visible. Prepare the manager for the fact that the team responds to ${ca(c.teamPrimary)} decisions and finds ${ca(c.personPrimary)} decisions harder to read. The manager should make their decision logic transparent rather than assuming it is self-evident.` });
    } else {
      hints.push({ title: "Intensive support from the start", text: "The manager differs significantly from the team. Plan weekly check-ins for the first ninety days and address the first signs of conflict immediately." });
      hints.push({ title: "Define role clarity and mandate", text: "Make clear from the outset: What should the manager change, what should they take over, and where are the limits? Without this frame, they will either reshape the team one-sidedly or disengage." });
      hints.push({ title: "Prepare the team", text: "Explain to the team in advance that the new manager works differently from what they are used to, and why this is intentional. Without this framing, the differences will be read as a poor hiring decision." });
      hints.push({ title: "Regular progress reviews", text: "Plan structured reviews at thirty, sixty, and ninety days: Is integration working? Where is friction showing up? What needs to change?" });
    }
    return hints;
  }

  if (c.matchCase === "TOP1_TOP2") {
    hints.push({ title: "Vertrauen aufbauen und Rolle verankern", text: "Die Führungskraft wird voraussichtlich schnell akzeptiert, weil sie die Teamlogik intuitiv teilt. Nutzen Sie diese günstige Ausgangslage, um in den ersten Wochen klare Erwartungen zu setzen und die Rolle zu verankern. Definieren Sie gemeinsam mit der Führungskraft die wichtigsten Ziele für die ersten 90 Tage und machen Sie transparent, welche Entscheidungsspielräume bestehen. Die schnelle Akzeptanz ist ein Vorteil, der bewusst genutzt werden sollte." });
    hints.push({ title: "Ergänzung aktiv einfordern", text: "Bei hoher Übereinstimmung zwischen Führungskraft und Team besteht die Gefahr, dass blinde Flecken verstärkt statt aufgedeckt werden. Fordern Sie aktiv ein, dass die Führungskraft auch ungewohnte Perspektiven einbringt und das Team bewusst herausfordert. Eine Führungskraft, die nur bestätigt, was das Team ohnehin denkt, nutzt ihr Potenzial nicht voll aus. Regelmässige Reflexionsrunden über Dinge, die übersehen werden könnten, helfen hier." });
    hints.push({ title: "Entwicklung beobachten", text: "Beobachten Sie nach den ersten 3 Monaten, ob die Führungskraft eigene Akzente setzt oder sich zu stark an die bestehende Teamkultur anpasst. Eine gute Führungskraft muss auch unbequeme Entscheidungen treffen und darf sich nicht in der Bestätigung des Status quo einrichten." });
  } else if (c.matchCase === "TOP1_ONLY") {
    hints.push({ title: "Gemeinsame Grundlogik als Vertrauensbasis nutzen", text: `Die Führungskraft teilt mit dem Team die Hauptlogik (${COMP_DOMAIN[c.teamPrimary]}). Nutzen Sie diesen Vorteil gezielt, um in den ersten Wochen Vertrauen aufzubauen. Gleichzeitig: Klären Sie offen, wo sich der Führungsstil im Detail unterscheidet — konkret bei ${COMP_SHORT[c.personSecondary]} gegenüber der Teamerwartung ${COMP_SHORT[c.teamSecondary]}. Je konkreter diese Klärung, desto weniger Irritation im Alltag.` });
    hints.push({ title: "Feedback-Schleifen installieren", text: "Installieren Sie in den ersten 90 Tagen regelmässige Feedback-Gespräche zwischen Führungskraft und Team. Diese Gespräche sollten strukturiert sein und sowohl die fachliche Zusammenarbeit als auch die zwischenmenschliche Dynamik adressieren. Typische Fragen: Was läuft gut? Wo gibt es Irritationen? Was braucht das Team von der Führungskraft? Was braucht die Führungskraft vom Team? Diese frühzeitige Kommunikation verhindert, dass sich Missverständnisse festsetzen." });
    hints.push({ title: "Ergänzung im Detail sichtbar machen", text: `Die Führungskraft bringt mit ${COMP_SHORT[c.personSecondary]} eine andere Nuance in den Alltag. Machen Sie dem Team sichtbar, wo diese Ergänzung hilft, und ordnen Sie Unterschiede als Bereicherung ein, nicht als Schwäche.` });
  } else if (c.matchCase === "TOP2_ONLY") {
    hints.push({ title: "Führungsstil aktiv einordnen", text: `Die Führungskraft denkt und entscheidet über ${COMP_DOMAIN[c.personPrimary]}, das Team erwartet ${COMP_DOMAIN[c.teamPrimary]}. Erklären Sie dem Team konkret, warum eine andere Denklogik in dieser Führungsrolle gewollt ist. Ohne diese Einordnung interpretiert das Team den Führungsstil als Fehlbesetzung statt als bewusste Wahl.` });
    hints.push({ title: "Alltagsbrücke gezielt einsetzen", text: `Beide Seiten teilen ${COMP_SHORT[c.teamSecondary]} als Arbeitsweise. Nutzen Sie diese Brücke bewusst: Legen Sie Team-Meetings und Abstimmungsformate so an, dass ${COMP_SHORT[c.teamSecondary]} als Kommunikationsebene dominiert. Dadurch baut die Führungskraft Vertrauen auf, auch wenn die strategische Denkrichtung anders ist.` });
    hints.push({ title: "Richtungsentscheidungen vorbereiten", text: `In strategischen Fragen wird der Unterschied in der Grundlogik sichtbar. Bereiten Sie die Führungskraft darauf vor, dass das Team auf ${COMP_ADJ[c.teamPrimary]} Entscheidungen reagiert und ${COMP_ADJ[c.personPrimary]} Entscheidungen erklärungsbedürftig sind. Die Führungskraft sollte ihre Entscheidungslogik transparent machen, statt sie stillschweigend vorauszusetzen.` });
  } else {
    hints.push({ title: "Intensive Begleitung von Anfang an", text: "Die Führungskraft unterscheidet sich deutlich vom Team. Planen Sie in den ersten 90 Tagen wöchentliche Abstimmungen ein und greifen Sie bei ersten Anzeichen von Konflikten sofort ein." });
    hints.push({ title: "Rollenklarheit und Mandat definieren", text: "Klären Sie unmissverständlich: Was soll die Führungskraft verändern, was übernehmen, wo liegen die Grenzen? Ohne diesen Rahmen baut sie das Team entweder einseitig um — oder zieht sich zurück." });
    hints.push({ title: "Team vorbereiten", text: "Erklären Sie dem Team vorab, dass die neue Führung anders arbeitet als gewohnt und warum das gewollt ist. Ohne diese Einordnung werden die Unterschiede als Fehlbesetzung gedeutet." });
    hints.push({ title: "Regelmässige Zwischenbilanz", text: "Planen Sie nach 30, 60 und 90 Tagen eine strukturierte Bilanz: Funktioniert die Integration? Wo gibt es Reibung? Was muss sich ändern?" });
  }

  return hints;
}


function buildRisikoprognose(c: Ctx): V4RiskPhase[] {
  if (_lang === "en") {
    const p = (label: string, period: string, text: string): V4RiskPhase => ({ label, period, text });
    if (c.matchCase === "TOP1_TOP2") {
      return [
        p("Phase 1", "0-3 months", "The start is likely to go smoothly. The person understands the team's logic naturally and can contribute productively early. The main risk: everything runs so well that important clarifications are skipped and blind spots go undetected."),
        p("Phase 2", "3-12 months", "The person is fully integrated. The risk now lies in routine: when everyone thinks alike, problems are overlooked. Regular reflection and external perspectives help counteract this."),
        p("Phase 3", "12+ months", "Collaboration is stable. Check over time whether the team has become more one-sided through reinforcement. If so, the next placement should deliberately bring a different perspective."),
      ];
    }
    if (c.matchCase === "TOP1_ONLY") {
      return [
        p("Phase 1", "0-3 months", "The start goes well overall, because the core logic matches. In day-to-day work, however, differences in concrete approach become noticeable: different pace, different communication, different expectations around thoroughness. First friction points should be addressed openly before they solidify into fixed judgments."),
        p("Phase 2", "3-12 months", "The differences are known and can be managed deliberately. If alignment worked in phase one, collaboration becomes more productive now. If not, friction points solidify. Working norms should be reviewed and adjusted as needed."),
        p("Phase 3", "12+ months", "Integration is stable when the differences have been accepted as a complement. When they were never really addressed, slow-building frustration can emerge. Even after a long period together, a clarifying conversation can still be worthwhile."),
      ];
    }
    if (c.matchCase === "TOP2_ONLY") {
      return [
        p("Phase 1", "0-3 months", `The start is demanding, because the thinking logics differ. The team operates through ${cs(c.teamPrimary)}, the person through ${cs(c.personPrimary)}. The shared working approach provides an important bridge. Expectations should be stated very concretely in this phase.`),
        p("Phase 2", "3-12 months", "The tension becomes clearer as the novelty effect fades. This is the point where it becomes clear whether the complement is used as a strength or becomes a source of recurring friction. Without clear framing from leadership, the person risks being pushed to the margins."),
        p("Phase 3", "12+ months", "When integration has worked, the team has become more versatile. When it has not, friction has solidified. At that point an open decision is needed: will the situation change, or will it stay as it is with all the consequences?"),
      ];
    }
    if (c.teamClass === "BALANCED" || c.personClass === "BALANCED") {
      return [
        p("Phase 1", "0-3 months", "The start depends heavily on how the person positions themselves. With a balanced team or a broadly positioned person, there is no natural friction, but also no clear anchor point. Expectations and role clarity are particularly important early on."),
        p("Phase 2", "3-12 months", "The collaboration pattern settles. Whether it becomes productive depends on whether both sides have found a clear working mode. Regular check-ins help ensure the dynamic does not drift."),
        p("Phase 3", "12+ months", "A stable collaboration requires that both sides have developed a shared working language. If that has happened, the combination is resilient. If not, a frank conversation about the way forward is due."),
      ];
    }
    return [
      p("Phase 1", "0-3 months", "The start is demanding. Early conflicts and friction are likely. This is normal, not a sign of failure. Intensive support and clear expectations are needed from the start to prevent negative patterns from forming."),
      p("Phase 2", "3-12 months", "The differences are known and the initial uncertainty has passed. Now the decision is made: are the differences experienced as enrichment or as a burden? Without active leadership, the dynamic tips toward frustration and disengagement."),
      p("Phase 3", "12+ months", "Either the person has broadened the team and contributed new strengths, or the tension has become permanent. In the latter case, a frank conversation about the path forward is needed. Continuation only makes sense if both sides actively want to work on it."),
    ];
  }

  if (c.matchCase === "TOP1_TOP2") {
    return [
      { label: "Phase 1", period: "0–3 Monate", text: "Der Einstieg verläuft voraussichtlich glatt. Die Person versteht die Teamlogik intuitiv und kann früh produktiv beitragen. Das Hauptrisiko: Alles läuft so reibungslos, dass wichtige Klärungen übersprungen werden und blinde Flecken unentdeckt bleiben." },
      { label: "Phase 2", period: "3–12 Monate", text: "Die Person ist vollständig integriert. Die Gefahr liegt jetzt in der Routine: Wenn alle ähnlich denken, werden Probleme übersehen. Regelmässige Reflexion und externe Perspektiven helfen, dem entgegenzuwirken." },
      { label: "Phase 3", period: "12+ Monate", text: "Die Zusammenarbeit ist stabil. Prüfen Sie langfristig, ob das Team durch die Verstärkung einseitiger geworden ist. Wenn ja, sollte die nächste Besetzung gezielt eine andere Perspektive einbringen." },
    ];
  }

  if (c.matchCase === "TOP1_ONLY") {
    return [
      { label: "Phase 1", period: "0–3 Monate", text: "Der Einstieg gelingt grundsätzlich gut, weil die Hauptlogik übereinstimmt. Im Alltag werden aber Unterschiede im konkreten Vorgehen spürbar — anderes Tempo, andere Kommunikation, andere Erwartungen an Gründlichkeit. Erste Irritationen sollten offen angesprochen werden, bevor sie sich zu festen Urteilen verdichten." },
      { label: "Phase 2", period: "3–12 Monate", text: "Die Unterschiede sind bekannt und können gezielt gesteuert werden. Wenn die Abstimmung in Phase 1 gelungen ist, wird die Zusammenarbeit jetzt produktiver. Wenn nicht, verfestigen sich Reibungspunkte. Spielregeln überprüfen und bei Bedarf anpassen." },
      { label: "Phase 3", period: "12+ Monate", text: "Die Integration ist stabil, wenn die Unterschiede als Ergänzung akzeptiert wurden. Wenn sie nie wirklich angesprochen wurden, kann sich schleichende Frustration aufbauen. Auch nach langer Zugehörigkeit lohnt sich dann ein klärendes Gespräch." },
    ];
  }

  if (c.matchCase === "TOP2_ONLY") {
    return [
      { label: "Phase 1", period: "0–3 Monate", text: `Der Einstieg ist herausfordernd, weil sich die Denklogik unterscheidet. Das Team arbeitet über ${COMP_SHORT[c.teamPrimary]}, die Person über ${COMP_SHORT[c.personPrimary]}. Die gemeinsame Arbeitsweise im Alltag schafft aber eine wichtige Brücke. Erwartungen sollten in dieser Phase sehr konkret formuliert werden.` },
      { label: "Phase 2", period: "3–12 Monate", text: "Die Spannung wird deutlicher, sobald der Neuheitseffekt nachlässt. Jetzt zeigt sich, ob die Ergänzung als Stärke genutzt wird oder zur Dauerreibung wird. Ohne klare Einordnung durch die Führung droht die Person, an den Rand gedrängt zu werden." },
      { label: "Phase 3", period: "12+ Monate", text: "Wenn die Integration gelungen ist, ist das Team vielseitiger geworden. Wenn nicht, hat sich die Reibung verfestigt. Dann braucht es eine offene Entscheidung: Wird die Situation verändert, oder bleibt sie so — mit allen Konsequenzen?" },
    ];
  }

  return [
    { label: "Phase 1", period: "0–3 Monate", text: "Der Einstieg ist anspruchsvoll. Erste Konflikte und Irritationen sind wahrscheinlich — das ist normal, nicht ein Zeichen des Scheiterns. Intensive Begleitung und klare Erwartungen sind von Anfang an nötig, damit sich keine negativen Muster einschleifen." },
    { label: "Phase 2", period: "3–12 Monate", text: "Die Unterschiede sind bekannt, die anfängliche Unsicherheit ist vorbei. Jetzt entscheidet sich, ob die Unterschiede als Bereicherung oder als Belastung erlebt werden. Ohne aktive Führung kippt die Dynamik in Richtung Frustration und Rückzug." },
    { label: "Phase 3", period: "12+ Monate", text: "Entweder hat die Person das Team erweitert und neue Stärken eingebracht, oder die Spannung ist dauerhaft. Im zweiten Fall muss offen über die Perspektive gesprochen werden. Eine Fortführung ist nur sinnvoll, wenn beide Seiten aktiv daran arbeiten wollen." },
  ];
}


function buildIntegrationsplan(c: Ctx): V4IntegrationPhase[] {
  if (_lang === "en") {
    const base: V4IntegrationPhase[] = [
      {
        num: 1,
        title: "Arrival and orientation",
        period: "Days 1-10",
        ziel: "The person understands the team culture, key processes, and expectations for their role. They know who does what in the team and are familiar with the basic norms of collaboration.",
        beschreibung: c.matchCase === "TOP1_TOP2"
          ? "Onboarding can proceed quickly because the person's working approach matches the team's. They will find their footing fast and understand team culture naturally. Focus should be on clear role clarification and concrete first tasks so the person can become effective early. Use the natural alignment to build trust quickly."
          : c.matchCase === "TOP1_ONLY"
            ? `Onboarding can build on the shared core logic (${cs(c.teamPrimary)}), which makes arrival easier. At the same time, be transparent from the start that the person works differently in day-to-day tasks from what the team is used to: ${c.personSecondary === "impulsiv" ? "The person will want to move to action faster, while the team tends to expect more groundwork first." : c.personSecondary === "analytisch" ? "The person will want to analyse more thoroughly, while the team expects more pace." : "The person will seek more consultation, while the team tends to work more independently."} Clarify early which approach is expected in which situations.`
            : c.matchCase === "NONE"
              ? "Onboarding needs particular attention because working approach and team culture differ significantly. The person will not understand the team's logic naturally and needs active explanation. Focus on mutual getting-to-know and understanding team culture. Avoid letting the person work independently before they have grasped the norms."
              : "Onboarding needs clear orientation support. The person brings a partially matching working approach but should first understand how the team works and what it expects before acting independently.",
        praxis: [
          "Personal introductions with all team members in one-on-ones or small group settings",
          "Clarification of key tasks, responsibilities, and decision paths",
          "Assignment of a dedicated contact person (buddy or mentor) for the first weeks",
          "Introduction to the team's main tools, processes, and communication channels",
          "Transparent communication to the team about the role and expectations for the new person",
        ],
        signale: [
          "The person asks active questions about team culture and shows genuine interest in understanding",
          "First contributions in meetings, even if still cautious",
          "No obvious conflicts, no withdrawal or visible discomfort",
          "The person proactively makes contact with team members",
          "The team shows openness and willingness to involve the person",
        ],
        fuehrungstipp: c.isLeader
          ? "As manager: listen more than you speak in the first days. Observe the team dynamic before initiating change. Show respect for existing processes and signal that you want to understand the team culture before shaping it. Your first impression has a lasting effect."
          : "Give the person deliberate space to settle in. Do not expect full productivity yet. Focus on building relationships and orientation. Avoid overwhelming them with too much information at once. Prioritise the most important topics.",
        fokus: {
          intro: "This phase focuses on:",
          bullets: ["Building trust between person and team", "Orientation in team culture, processes, and expectations", "First personal contacts and getting to know the team's working style", "Role clarity and understanding of one's own contribution"],
        },
      },
      {
        num: 2,
        title: "Onboarding and first impact",
        period: "Days 11-20",
        ziel: "The person takes on first independent tasks and becomes visible in the team as an active member. They understand the team's logic and can contribute productively.",
        beschreibung: c.matchCase === "TOP1_TOP2"
          ? "Because of the strong fit, the person can quickly take on independent work and assume responsibility. Focus now on visible early results that confirm the team's trust. Use this phase to involve the person in active projects and sharpen their profile in the team."
          : c.matchCase === "TOP1_ONLY"
            ? `The person begins to bring their own working approach more clearly. In this phase, the difference between ${cs(c.teamSecondary)} (team approach) and ${cs(c.personSecondary)} (person approach) becomes concretely visible in day-to-day work. ${c.personSecondary === "impulsiv" ? "In situations the team handles with groundwork and care, the person will tend toward fast decisions and direct action." : c.personSecondary === "analytisch" ? "In situations the team handles with pace and pragmatism, the person will tend toward thorough analysis and structured approaches." : "In situations the team handles in a structured and factual way, the person will seek exchange and involvement of all parties."} Clarify in concrete situations which approach takes precedence.`
            : "The person begins to bring their own working approach more clearly. In this phase, differences from the team become visible and tangible. This is a normal and important part of the integration process. Differences should be addressed openly and constructively rather than ignored or suppressed. Clear feedback helps the person find their footing.",
        praxis: [
          "Ownership of a concrete, bounded work package with a clear outcome",
          "First structured feedback conversation with the manager about integration so far",
          "Involvement in active team projects and collaboration with different team members",
          "Joint reflection: where is there alignment, where are differences showing up?",
          "Adjustment of role or expectations based on experience from the first days if needed",
        ],
        signale: [
          "The person delivers first independent results that meet expectations",
          "Feedback from team members is mostly positive or constructive",
          "No repeated misunderstandings or growing frustration on either side",
          "The person contributes their own ideas and shows initiative",
          "Collaboration in the team increasingly feels natural for all involved",
        ],
        fuehrungstipp: c.isLeader
          ? "Set first clear priorities now and show the team where things are heading. Your first visible decisions shape how your leadership is perceived. Be decisive, but respectful of existing structures. Actively gather feedback from the team and show that you take it seriously."
          : "In this phase, actively check whether the person has understood the team's logic and can contribute productively. Correct early and constructively when needed. Do not wait for problems to solidify. A short conversation now prevents long conflicts later.",
        fokus: {
          intro: "This phase focuses on:",
          bullets: ["First independent contributions and visible results", "Growing visibility and acceptance in the team", "Actively seeking and processing feedback", "Constructive handling of differences that become visible"],
        },
      },
      {
        num: 3,
        title: "Stabilisation and deepening",
        period: "Days 21-30",
        ziel: "The person has arrived in the team and is working independently and effectively. The fundamental integration is complete and the foundations for long-term collaboration are in place.",
        beschreibung: c.score >= 60
          ? "Integration should now largely be in place. The person has found their place in the team and is working productively. The focus now is on open points, goals for the next months, and an honest feedback conversation on both sides."
          : "Integration still needs attention. Address openly whether the collaboration can work long term. If there are issues, they should be named now, not in six months.",
        praxis: [
          "Summary feedback conversation covering the entire onboarding phase",
          "Clarification of next development steps and concrete goals for the coming three months",
          "Joint review: what is working well, what needs adjustment or additional support?",
          "Definition of clear expectations for the next phase of collaboration",
          "Adjustment of role, responsibilities, or working patterns if needed",
        ],
        signale: [
          "The person is independently productive and delivers results reliably",
          "Team dynamics are stable or have improved compared to the starting point",
          "No unresolved conflicts or simmering tensions",
          "The person feels part of the team and expresses this",
          "Team members naturally include the person in decisions and coordination",
        ],
        fuehrungstipp: c.isLeader
          ? "Reflect honestly and self-critically on your first impact in the team. What has worked well, what needs adjustment? Gather structured feedback from the team and show that you are willing to adapt your leadership style to the team's needs, without giving up your own direction."
          : "Have an open and honest conversation with the person: what is working well, what needs to change? Set shared goals for the next three months and define how the success of integration will be measured. This conversation is the foundation for sustainably productive collaboration.",
        fokus: {
          intro: "This phase focuses on:",
          bullets: ["Sustainability of integration and long-term viability", "Clarification of all open points and unspoken expectations", "Definition of a clear direction for the coming months", "Ensuring both sides are satisfied and collaborating constructively"],
        },
      },
    ];
    return base;
  }

  const base: V4IntegrationPhase[] = [
    {
      num: 1,
      title: "Ankommen und Orientierung",
      period: "Tag 1–10",
      ziel: "Die Person versteht die Teamkultur, die wichtigsten Abläufe und die Erwartungen an ihre Rolle. Sie weiss, wer im Team welche Funktion hat und kennt die grundlegenden Spielregeln der Zusammenarbeit.",
      beschreibung: c.matchCase === "TOP1_TOP2"
        ? "Die Einarbeitung kann zügig erfolgen, weil die Arbeitsweise der Person zum Team passt. Die Person wird sich schnell zurechtfinden und die Teamkultur intuitiv verstehen. Der Fokus sollte auf klarer Rollenklärung und konkreten ersten Aufgaben liegen, damit die Person früh wirksam werden kann. Nutzen Sie die natürliche Passung, um schnell Vertrauen aufzubauen."
        : c.matchCase === "TOP1_ONLY"
          ? `Die Einarbeitung kann auf der gemeinsamen Grundlogik (${COMP_SHORT[c.teamPrimary]}) aufbauen, die das Ankommen erleichtert. Gleichzeitig sollte von Anfang an transparent gemacht werden, dass die Person im Alltag anders vorgeht als das Team es gewohnt ist: ${c.personSecondary === "impulsiv" ? "Die Person wird schneller in Handlung gehen wollen, während das Team eher Absicherung erwartet." : c.personSecondary === "analytisch" ? "Die Person wird gründlicher analysieren wollen, während das Team eher Tempo erwartet." : "Die Person wird mehr Abstimmung suchen, während das Team eher strukturiert vorgeht."} Klären Sie früh, in welchen Situationen welches Vorgehen erwünscht ist.`
          : c.matchCase === "NONE"
            ? "Die Einarbeitung braucht besondere Aufmerksamkeit, weil Arbeitsweise und Teamkultur sich deutlich unterscheiden. Die Person wird die Teamlogik nicht intuitiv verstehen und braucht aktive Erklärung. Der Fokus sollte auf gegenseitigem Kennenlernen und dem Verständnis der Teamkultur liegen. Vermeiden Sie es, die Person zu früh eigenständig arbeiten zu lassen, bevor sie die Spielregeln verstanden hat."
            : "Die Einarbeitung braucht klare Orientierungshilfen. Die Person bringt eine teilweise passende Arbeitsweise mit, sollte aber zunächst verstehen, wie das Team arbeitet und was es erwartet, bevor sie eigenständig agiert.",
      praxis: [
        "Persönliches Kennenlernen mit allen Teammitgliedern in Einzelgesprächen oder kleinen Runden",
        "Klärung der wichtigsten Aufgaben, Zuständigkeiten und Entscheidungswege",
        "Benennung einer festen Ansprechperson (Buddy/Mentor) für die ersten Wochen",
        "Einführung in die wichtigsten Tools, Prozesse und Kommunikationskanäle des Teams",
        "Transparente Kommunikation an das Team über die Rolle und die Erwartungen an die neue Person",
      ],
      signale: [
        "Die Person stellt aktiv Fragen zur Teamkultur und zeigt echtes Interesse am Verständnis",
        "Erste eigene Beiträge in Meetings, auch wenn sie noch zurückhaltend sind",
        "Keine offensichtlichen Konflikte, kein Rückzug oder sichtbares Unbehagen",
        "Die Person sucht eigenständig Kontakt zu Teammitgliedern",
        "Das Team zeigt Offenheit und Bereitschaft, die Person einzubeziehen",
      ],
      fuehrungstipp: c.isLeader
        ? "Als Führungskraft: Hören Sie in den ersten Tagen vor allem zu. Beobachten Sie die Teamdynamik, bevor Sie Veränderungen anstossen. Zeigen Sie Respekt für bestehende Abläufe und signalisieren Sie, dass Sie die Teamkultur verstehen wollen, bevor Sie sie gestalten. Ihr erstes Auftreten prägt die Wahrnehmung nachhaltig."
        : "Geben Sie der Person bewusst Raum zum Ankommen. Erwarten Sie noch keine volle Produktivität, sondern fokussieren Sie sich auf Beziehungsaufbau und Orientierung. Überfordern Sie die Person nicht mit zu vielen Informationen auf einmal, sondern priorisieren Sie die wichtigsten Themen.",
      fokus: {
        intro: "In dieser Phase geht es um folgende Schwerpunkte:",
        bullets: ["Vertrauensaufbau zwischen Person und Team", "Orientierung in Teamkultur, Abläufen und Erwartungen", "Erste persönliche Kontakte und Kennenlernen der Arbeitsweise des Teams", "Rollenklarheit und Verständnis des eigenen Beitrags"],
      },
    },
    {
      num: 2,
      title: "Einarbeitung und erste Wirkung",
      period: "Tag 11–20",
      ziel: "Die Person übernimmt erste eigenständige Aufgaben und wird im Team als aktives Mitglied sichtbar. Sie versteht die Teamlogik und kann sich produktiv einbringen.",
      beschreibung: c.matchCase === "TOP1_TOP2"
        ? "Die Person kann aufgrund der hohen Passung schnell eigenständig arbeiten und eigene Verantwortung übernehmen. Der Fokus sollte jetzt auf sichtbaren ersten Ergebnissen liegen, die das Vertrauen des Teams bestätigen. Nutzen Sie diese Phase, um die Person in wichtige laufende Projekte einzubinden und ihr Profil im Team zu schärfen."
        : c.matchCase === "TOP1_ONLY"
          ? `Die Person beginnt, ihre eigene Arbeitsweise stärker einzubringen. Dabei wird der Unterschied zwischen ${COMP_SHORT[c.teamSecondary]} (Teamlogik) und ${COMP_SHORT[c.personSecondary]} (Personlogik) im Alltag konkret erlebbar. ${c.personSecondary === "impulsiv" ? "Die Person wird in Situationen, die das Team mit Genauigkeit und Absicherung löst, eher auf schnelle Entscheidungen und direkte Umsetzung setzen." : c.personSecondary === "analytisch" ? "Die Person wird in Situationen, die das Team mit Tempo und Pragmatismus löst, eher auf gründliche Analyse und strukturiertes Vorgehen setzen." : "Die Person wird in Situationen, die das Team strukturiert und sachlich löst, eher auf Austausch und Einbindung aller Beteiligten setzen."} Klären Sie in konkreten Situationen, wann welches Vorgehen Vorrang hat.`
          : "Die Person beginnt, ihre eigene Arbeitsweise stärker einzubringen. In dieser Phase werden Unterschiede zum Team sichtbar und konkret erlebbar. Das ist ein normaler und wichtiger Teil des Integrationsprozesses. Die Unterschiede sollten offen angesprochen und konstruktiv eingeordnet werden, statt sie zu ignorieren oder zu unterdrücken. Klare Rückmeldungen helfen der Person, sich zu orientieren.",
      praxis: [
        "Übernahme eines konkreten, abgrenzbaren Arbeitspakets mit klarem Ergebnis",
        "Erstes strukturiertes Feedback-Gespräch mit der Führungskraft über die bisherige Integration",
        "Einbindung in laufende Teamprojekte und Zusammenarbeit mit verschiedenen Teammitgliedern",
        "Gemeinsame Reflexion: Wo gibt es Übereinstimmung, wo zeigen sich Unterschiede?",
        "Gegebenenfalls Anpassung der Rolle oder der Erwartungen basierend auf den Erfahrungen der ersten Tage",
      ],
      signale: [
        "Die Person liefert erste eigenständige Ergebnisse, die den Erwartungen entsprechen",
        "Feedback von Teammitgliedern ist überwiegend positiv oder konstruktiv",
        "Keine wiederholten Missverständnisse oder wachsende Frustration auf einer der Seiten",
        "Die Person bringt eigene Ideen ein und zeigt Initiative",
        "Zusammenarbeit im Team fühlt sich für alle Beteiligten zunehmend natürlich an",
      ],
      fuehrungstipp: c.isLeader
        ? "Setzen Sie jetzt erste klare Prioritäten und zeigen Sie dem Team, wohin die Reise geht. Ihre ersten sichtbaren Entscheidungen prägen die Wahrnehmung Ihrer Führung. Seien Sie dabei entschieden, aber respektvoll gegenüber bestehenden Strukturen. Holen Sie aktiv Feedback aus dem Team ein und zeigen Sie, dass Sie es ernst nehmen."
        : "Überprüfen Sie in dieser Phase aktiv, ob die Person die Teamlogik verstanden hat und sich produktiv einbringen kann. Korrigieren Sie frühzeitig und konstruktiv, wenn nötig. Warten Sie nicht, bis sich Probleme verfestigen. Ein kurzes Gespräch jetzt spart lange Konflikte später.",
      fokus: {
        intro: "In dieser Phase geht es um folgende Schwerpunkte:",
        bullets: ["Erste eigenständige Beiträge und sichtbare Ergebnisse", "Zunehmende Sichtbarkeit und Akzeptanz im Team", "Aktives Einholen und Verarbeiten von Feedback", "Konstruktiver Umgang mit sichtbar werdenden Unterschieden"],
      },
    },
    {
      num: 3,
      title: "Stabilisierung und Vertiefung",
      period: "Tag 21–30",
      ziel: "Die Person ist im Team angekommen und arbeitet eigenständig und wirksam. Die grundlegende Integration ist abgeschlossen und die Weichen für die langfristige Zusammenarbeit sind gestellt.",
      beschreibung: c.score >= 60
        ? "Die Integration sollte jetzt weitgehend stehen. Die Person hat ihren Platz im Team gefunden und arbeitet produktiv. Jetzt geht es um offene Punkte, Ziele für die nächsten Monate und ein ehrliches Feedback-Gespräch auf beiden Seiten."
        : "Die Integration braucht noch Aufmerksamkeit. Klären Sie offen, ob die Zusammenarbeit langfristig funktioniert. Wenn es Probleme gibt, sollten sie jetzt benannt werden — nicht erst in sechs Monaten.",
      praxis: [
        "Zusammenfassendes Feedback-Gespräch über die gesamte Einarbeitungsphase",
        "Klärung der weiteren Entwicklung, nächsten Schritte und konkreten Ziele für die kommenden 3 Monate",
        "Gemeinsame Auswertung: Wo läuft es gut, wo braucht es Anpassung oder zusätzliche Unterstützung?",
        "Definition klarer Erwartungen für die nächste Phase der Zusammenarbeit",
        "Gegebenenfalls Anpassung der Rolle, der Verantwortlichkeiten oder der Zusammenarbeitsmuster",
      ],
      signale: [
        "Die Person ist eigenständig produktiv und liefert verlässlich Ergebnisse",
        "Die Teamdynamik ist stabil oder hat sich im Vergleich zum Ausgangszustand verbessert",
        "Keine ungelösten Konflikte oder schwelenden Spannungen",
        "Die Person fühlt sich als Teil des Teams und äussert dies auch",
        "Teammitglieder beziehen die Person selbstverständlich in Entscheidungen und Abstimmungen ein",
      ],
      fuehrungstipp: c.isLeader
        ? "Reflektieren Sie Ihre erste Wirkung im Team ehrlich und selbstkritisch. Was hat gut funktioniert, was braucht Anpassung? Holen Sie strukturiertes Feedback aus dem Team ein und zeigen Sie, dass Sie bereit sind, Ihren Führungsstil an die Bedürfnisse des Teams anzupassen, ohne dabei Ihre eigene Linie aufzugeben."
        : "Führen Sie ein offenes und ehrliches Gespräch mit der Person: Was läuft gut, was braucht Veränderung? Setzen Sie gemeinsam Ziele für die nächsten 3 Monate und definieren Sie, wie der Erfolg der Integration gemessen wird. Dieses Gespräch ist die Grundlage für eine nachhaltig produktive Zusammenarbeit.",
      fokus: {
        intro: "In dieser Phase geht es um folgende Schwerpunkte:",
        bullets: ["Nachhaltigkeit der Integration und langfristige Tragfähigkeit", "Klärung aller offenen Punkte und unausgesprochenen Erwartungen", "Definition einer klaren Perspektive für die nächsten Monate", "Sicherstellung, dass beide Seiten zufrieden sind und konstruktiv zusammenarbeiten"],
      },
    },
  ];

  return base;
}


function buildIntegrationZusatz(c: Ctx): { intWarnsignale: string[]; intLeitfragen: string[]; intVerantwortung: string } {
  if (_lang === "en") {
    const warnsignale: string[] = [
      "The person withdraws in meetings, becomes notably quiet, or only contributes when directly addressed",
      "Team members express dissatisfaction with the collaboration or avoid contact with the new person",
      "The person makes no independent contact with the team and stays isolated in their own work",
      "Recurring misunderstandings in communication that persist despite attempts at clarification",
      "The person shows declining motivation, arrives late, leaves early, or appears increasingly disengaged",
      "The team forms informal subgroups that exclude the new person",
    ];

    if (c.score < 60) {
      warnsignale.push("Open or hidden conflicts increase rather than decrease, despite earlier attempts at resolution");
      warnsignale.push("The person tries to shift team culture in their own direction without regard for existing dynamics");
      warnsignale.push("Team members respond with increasing rejection or passive resistance to the person's proposals");
      warnsignale.push("Leadership must mediate between person and team more and more frequently without any improvement");
    }

    const leitfragen = [
      "Does the person feel welcome in the team and recognised as a full member?",
      "Does the person have a clear understanding of what is expected of them and can they meet those expectations?",
      "Are there friction points or tensions that are not being addressed openly and are working under the surface?",
      "Can the person actually use their specific strengths in the current role and make them visible?",
      "Is there a shared working layer where person and team collaborate productively on a regular basis?",
      "Have the initial expectations of both sides proved realistic, or do they need to be adjusted?",
      "How has team dynamics changed since the person joined: for better or for worse?",
    ];

    const verantwortung = c.isLeader
      ? "Responsibility for integration rests jointly with the organisation and leadership. The organisation defines the framework and expectations. The manager must reach out to the team, listen, and learn before shaping. Both sides must be willing to invest in the process and intervene early when needed."
      : "The primary responsibility lies with the manager: formulate clear expectations, give regular feedback, intervene early when things stall, and explain to the team why this person was chosen. The person themselves must show openness and actively reach out to the team.";

    return { intWarnsignale: warnsignale, intLeitfragen: leitfragen, intVerantwortung: verantwortung };
  }

  const warnsignale: string[] = [
    "Die Person zieht sich in Meetings zurück, wird auffällig still oder beteiligt sich nur noch auf direkte Ansprache",
    "Teammitglieder äussern Unzufriedenheit über die Zusammenarbeit oder vermeiden den Kontakt mit der neuen Person",
    "Die Person sucht keinen eigenständigen Kontakt zum Team und bleibt in ihrer eigenen Arbeitswelt isoliert",
    "Wiederkehrende Missverständnisse in der Kommunikation, die trotz Klärung immer wieder auftreten",
    "Die Person zeigt sinkende Motivation, kommt später, geht früher oder wirkt zunehmend desinteressiert",
    "Das Team bildet informelle Gruppen, die die neue Person ausschliessen",
  ];

  if (c.score < 60) {
    warnsignale.push("Offene oder verdeckte Konflikte nehmen zu statt ab, trotz bereits erfolgter Klärungsversuche");
    warnsignale.push("Die Person versucht, die Teamkultur einseitig in ihre Richtung zu verändern, ohne Rücksicht auf bestehende Dynamiken");
    warnsignale.push("Teammitglieder reagieren zunehmend ablehnend oder passiv-aggressiv auf Vorschläge der Person");
    warnsignale.push("Die Führungskraft muss immer häufiger zwischen Person und Team vermitteln, ohne dass sich die Situation verbessert");
  }

  const leitfragen = [
    "Fühlt sich die Person im Team willkommen und als vollwertiges Mitglied anerkannt?",
    "Versteht die Person klar, was von ihr erwartet wird, und kann sie diese Erwartungen erfüllen?",
    "Gibt es Reibungspunkte oder Spannungen, die nicht offen angesprochen werden und unterschwellig wirken?",
    "Kann die Person ihre spezifischen Stärken in der aktuellen Rolle tatsächlich einsetzen und sichtbar machen?",
    "Gibt es eine gemeinsame Arbeitsebene, auf der Person und Team regelmässig produktiv zusammenarbeiten?",
    "Haben sich die anfänglichen Erwartungen beider Seiten als realistisch erwiesen oder müssen sie angepasst werden?",
    "Wie hat sich die Teamdynamik seit dem Eintritt der Person verändert — zum Positiven oder zum Negativen?",
  ];

  const verantwortung = c.isLeader
    ? "Die Verantwortung für die Integration liegt bei Organisation und Führungskraft gemeinsam. Die Organisation definiert Rahmenbedingungen und Erwartungen. Die Führungskraft muss auf das Team zugehen, zuhören und lernen, bevor sie gestaltet. Beide Seiten müssen bereit sein, in den Prozess zu investieren und bei Bedarf frühzeitig gegenzusteuern."
    : "Die Hauptverantwortung liegt bei der Führungskraft: klare Erwartungen formulieren, regelmässig Feedback geben, frühzeitig eingreifen wenn es stockt und dem Team erklären, warum die Person gewählt wurde. Die Person selbst muss Offenheit zeigen und aktiv auf das Team zugehen.";

  return { intWarnsignale: warnsignale, intLeitfragen: leitfragen, intVerantwortung: verantwortung };
}


function buildEmpfehlungen(c: Ctx): V4Block[] {
  const emps: V4Block[] = [];

  if (_lang === "en") {
    if (c.matchCase === "TOP1_TOP2") {
      emps.push({ title: "Deploy strengths deliberately", text: `Place the person where the shared strength of team and person has the most impact. The strong alignment in ${cd(c.teamPrimary)} and ${cs(c.teamSecondary)} enables rapid deployment in core tasks without a long onboarding period. Use this advantage consciously and give the person responsibility early in areas that build on the shared strength.` });
      emps.push({ title: "Actively seek complementary input", text: "Pay deliberate attention to whether the team is becoming more one-sided through reinforcement. Actively invite complementary perspectives, for example through targeted questions in meetings or by consciously including external views. For the next placement, consider whether someone with a different working logic would strengthen the team's versatility." });
      emps.push({ title: "Build in reflection", text: "Create regular reflection points where the team deliberately thinks about its own working style. Questions such as 'What are we currently overlooking?' or 'Which perspective are we missing?' help minimise the risks of high alignment and surface blind spots." });
    } else if (c.matchCase === "TOP1_ONLY") {
      emps.push({ title: "Strengthen the shared foundation", text: `Use the matching core logic in ${cd(c.teamPrimary)} as a stable foundation for collaboration. Help the person and the team recognise that they agree at the fundamental level, and address differences in concrete working approach openly and constructively. Frame the differences as different paths to the same goal, not as fundamental incompatibilities.` });
      emps.push({ title: "Agree on working norms", text: "Define concrete working norms in the first weeks: how is communication handled, how quickly are responses expected, how thoroughly should decisions be prepared? These small, concrete agreements bridge the differences in detail and prevent normal working style differences from becoming emotional conflicts." });
      emps.push({ title: "Value the complement", text: `The person brings ${cs(c.personSecondary)} as a different strength into daily work compared to the team. Make visible where this complement helps the team, and create deliberate opportunities for the person to contribute their particular strength. This increases acceptance and shows the team the value of the placement.` });
    } else if (c.matchCase === "TOP2_ONLY") {
      emps.push({ title: "Make the decision logic transparent", text: `The team decides ${ca(c.teamPrimary)}, the person ${ca(c.personPrimary)}. Clarify concretely: in which situations does ${cs(c.teamPrimary)} take precedence (for example under time pressure, in operational decisions)? And where is ${cs(c.personPrimary)} explicitly wanted (for example in strategic questions, quality assurance)? When both sides know which logic applies when, daily friction decreases.` });
      emps.push({ title: "Use the shared layer actively", text: `Both sides connect through ${cs(c.teamSecondary)}. Use this shared working approach consciously as a bridge: structure coordination meetings, feedback rounds, and shared working sessions so that ${cs(c.teamSecondary)} is the dominant format. This strengthens the connection and creates a familiar layer where the core logic differences have less impact.` });
      emps.push({ title: "Frame differences for the team", text: `The team may perceive the person's behaviour as unadapted or resistant, even though it is structurally grounded. Explain to the team that the person does not work differently out of unwillingness, but because ${cd(c.personPrimary)} is their natural working logic. Name concretely where the complement helps the team, for example in tasks where the team has had gaps. This framing prevents biases and increases acceptance.` });
    } else {
      emps.push({ title: "Provide intensive support", text: "The first ninety days are particularly decisive here. Plan weekly check-ins and address the first signs of conflict immediately. The earlier problems are addressed, the easier they are to resolve." });
      emps.push({ title: "Create clear responsibilities", text: "Define responsibilities, decision paths, and escalation routes from the start. With high deviation, intuitive coordination does not work. Both sides need clear norms." });
      emps.push({ title: "Check and communicate the intent", text: `Is the difference intentional? Does the team genuinely need a different perspective? If yes, say so to the team clearly. Without this framing, the differences will be interpreted as an error in the hiring decision. If the difference was not intended, reconsider the placement.` });
    }

    if (c.hasGoal && c.taskFit === "gering") {
      emps.push({ title: "Strengthen task focus deliberately", text: `The person does not bring the right strength for the functional goal ${c.teamGoalLabel}. They can still fulfil the role, but will need more support. Complement deliberately with team members who are stronger in this area, and ensure the person is not working against their natural working logic on a permanent basis.` });
    }

    return emps;
  }

  if (c.matchCase === "TOP1_TOP2") {
    emps.push({ title: "Stärken gezielt nutzen", text: `Setzen Sie die Person dort ein, wo die gemeinsame Stärke von Team und Person am meisten Wirkung zeigt. Die hohe Übereinstimmung in ${COMP_DOMAIN[c.teamPrimary]} und ${COMP_SHORT[c.teamSecondary]} ermöglicht es, die Person schnell in Kernaufgaben einzusetzen, ohne lange Einarbeitungszeit. Nutzen Sie diesen Vorteil bewusst und geben Sie der Person früh Verantwortung in Bereichen, die auf die gemeinsame Stärke einzahlen.` });
    emps.push({ title: "Ergänzung aktiv suchen", text: "Achten Sie bewusst darauf, dass das Team durch die Verstärkung nicht einseitiger wird. Fordern Sie aktiv ergänzende Perspektiven ein, zum Beispiel durch gezielte Fragen in Meetings oder durch die bewusste Einbeziehung externer Sichtweisen. Überlegen Sie bei der nächsten Teambesetzung, ob eine Person mit einer anderen Arbeitslogik sinnvoller wäre, um die Vielseitigkeit des Teams zu erhöhen." });
    emps.push({ title: "Reflexion einbauen", text: "Bauen Sie regelmässige Reflexionspunkte ein, an denen das Team bewusst über seine Arbeitsweise nachdenkt. Fragen wie 'Was übersehen wir gerade?' oder 'Welche Perspektive fehlt uns?' helfen, die Risiken der hohen Übereinstimmung zu minimieren und blinde Flecken aufzudecken." });
  } else if (c.matchCase === "TOP1_ONLY") {
    emps.push({ title: "Gemeinsame Basis stärken", text: `Nutzen Sie die übereinstimmende Grundlogik in ${COMP_DOMAIN[c.teamPrimary]} als stabiles Fundament für die Zusammenarbeit. Machen Sie der Person und dem Team bewusst, dass sie in der grundlegenden Denkweise übereinstimmen, und klären Sie die Unterschiede in der konkreten Arbeitsweise offen und konstruktiv. Benennen Sie die Unterschiede als das, was sie sind: verschiedene Wege zum gleichen Ziel, nicht grundlegende Unvereinbarkeiten.` });
    emps.push({ title: "Alltagsregeln vereinbaren", text: "Definieren Sie in den ersten Wochen konkrete Spielregeln für die tägliche Zusammenarbeit: Wie wird kommuniziert? Wie schnell werden Antworten erwartet? Wie detailliert sollen Entscheidungen vorbereitet werden? Diese kleinen, konkreten Vereinbarungen überbrücken die Unterschiede im Detail und verhindern, dass aus normalen Arbeitsweiseunterschieden emotionale Konflikte werden." });
    emps.push({ title: "Ergänzung wertschätzen", text: `Die Person bringt mit ${COMP_SHORT[c.personSecondary]} eine andere Stärke in den Alltag ein als das Team. Machen Sie sichtbar, wo diese Ergänzung dem Team hilft, und schaffen Sie bewusst Gelegenheiten, in denen die Person ihre besondere Stärke einbringen kann. Das erhöht die Akzeptanz und zeigt dem Team den Mehrwert der Besetzung.` });
  } else if (c.matchCase === "TOP2_ONLY") {
    emps.push({ title: "Entscheidungslogik transparent machen", text: `Das Team entscheidet ${COMP_ADJ[c.teamPrimary]}, die Person ${COMP_ADJ[c.personPrimary]}. Klären Sie konkret: In welchen Situationen hat ${COMP_SHORT[c.teamPrimary]} Vorrang (z.B. bei Zeitdruck, operativen Entscheidungen)? Und wo ist ${COMP_SHORT[c.personPrimary]} ausdrücklich erwünscht (z.B. bei strategischen Fragen, Qualitätssicherung)? Wenn beide Seiten wissen, wann welche Logik gilt, entsteht weniger Reibung im Alltag.` });
    emps.push({ title: "Die gemeinsame Ebene aktiv nutzen", text: `Beide Seiten verbinden sich über ${COMP_SHORT[c.teamSecondary]}. Nutzen Sie diese gemeinsame Arbeitsweise bewusst als Brücke: Legen Sie Abstimmungstermine, Feedback-Runden und gemeinsame Arbeitsphasen so an, dass ${COMP_SHORT[c.teamSecondary]} als Arbeitsformat dominiert. Das stärkt die Verbindung und schafft eine vertraute Ebene, auf der die Grundlogik-Unterschiede weniger stark durchschlagen.` });
    emps.push({ title: "Unterschiede vor dem Team einordnen", text: `Das Team könnte das Verhalten der Person als unangepasst oder widerständig wahrnehmen, obwohl es strukturell bedingt ist. Erklären Sie dem Team, dass die Person nicht aus Unwillen anders arbeitet, sondern weil ${COMP_DOMAIN[c.personPrimary]} ihre natürliche Arbeitslogik ist. Benennen Sie konkret, wo die Ergänzung dem Team hilft, zum Beispiel bei Aufgaben, in denen das Team bisher Lücken hat. Diese Einordnung verhindert Vorurteile und erhöht die Akzeptanz.` });
  } else {
    emps.push({ title: "Intensiv begleiten", text: "Die ersten 90 Tage sind hier besonders entscheidend. Planen Sie wöchentliche Check-ins ein und greifen Sie bei ersten Anzeichen von Konflikten sofort ein. Je früher Probleme adressiert werden, desto einfacher lassen sie sich lösen." });
    emps.push({ title: "Klare Zuständigkeiten schaffen", text: "Definieren Sie von Anfang an Zuständigkeiten, Entscheidungswege und Eskalationspfade. Bei hoher Abweichung funktioniert intuitive Abstimmung nicht — beide Seiten brauchen klare Regeln." });
    emps.push({ title: "Intention prüfen und kommunizieren", text: `Ist die Abweichung gewollt? Braucht das Team tatsächlich eine andere Perspektive? Wenn ja, sagen Sie das dem Team klar. Ohne diese Einordnung werden die Unterschiede als Fehler in der Personalentscheidung gedeutet. Wenn die Abweichung nicht gewollt ist, überdenken Sie die Besetzung.` });
  }

  if (c.hasGoal && c.taskFit === "gering") {
    emps.push({ title: "Aufgabenfokus gezielt stärken", text: `Die Person bringt für das Funktionsziel ${c.teamGoalLabel} nicht die passende Stärke mit. Sie kann die Aufgabe trotzdem erfüllen, braucht aber mehr Unterstützung. Ergänzen Sie gezielt durch Teammitglieder, die hier stärker sind, und achten Sie darauf, dass die Person nicht dauerhaft gegen ihre natürliche Arbeitslogik arbeiten muss.` });
  }

  return emps;
}


function buildTeamOhnePerson(c: Ctx): string {
  if (_lang === "en") {
    const paras: string[] = [];
    if (c.matchCase === "TOP1_TOP2") {
      paras.push(`Without this person, the team stays within its existing logic. The reinforcement in ${cd(c.teamPrimary)} is no longer there, but the team loses no capability it did not have before. Only capacity in the core strength is reduced. Dynamics are likely to remain stable.`);
      paras.push("Over time, team structure and culture will change little. The question is: was the additional capacity needed and must it be replaced? If the person was purely a quantitative addition, replacement is straightforward. If they brought personal qualities beyond the profile match, the gap will be larger than the profile analysis suggests.");
    } else if (c.matchCase === "TOP1_ONLY") {
      paras.push(`Without this person, the team loses the complementary input in ${cd(c.personSecondary)}. The core logic (${cs(c.teamPrimary)}) remains unchanged, but the particular working approach, ${cs(c.personSecondary)} rather than ${cs(c.teamSecondary)}, is no longer present as a perspective.`);
      paras.push("The team returns to its previous working style. In the short term this brings stability, as the adaptation effort falls away. In the long run, the complement is missing. For the next placement, consider whether a similar profile should be sought again.");
    } else if (c.matchCase === "TOP2_ONLY") {
      paras.push(`Without this person, the team loses the input in ${cd(c.personPrimary)}. How noticeable this is depends on how well the person was integrated and whether the team actively used their complement.`);
      paras.push("The team returns to its previous working style. In the short term this brings stability. In the long run, the weaknesses and blind spots the person compensated for remain unaddressed. For the next placement, consider whether a similar profile should be sought again.");
    } else {
      paras.push("Without this person, the team returns to its previous dynamic. How noticeable this is depends on how integration played out. If the person genuinely broadened the team, there is a real gap. If the collaboration was dominated by friction, the departure may even bring relief.");
      paras.push("The key question: has the person anchored changes in processes or thinking that outlast their presence? If yes, the positive effect remains. If not, the team will quickly return to its starting point. Use the departure for an honest reflection: what did this placement bring? What would you do differently?");
    }
    return paras.join("\n\n");
  }

  const paras: string[] = [];

  if (c.matchCase === "TOP1_TOP2") {
    paras.push(`Ohne die Person bleibt das Team in seiner Grundlogik. Die Verstärkung in ${COMP_DOMAIN[c.teamPrimary]} entfällt, aber das Team verliert keine Fähigkeit, die es vorher nicht hatte — nur Kapazität in der Kernstärke. Die Dynamik bleibt voraussichtlich stabil.`);
    paras.push("Langfristig ändert sich an Teamstruktur und -kultur wenig. Die Frage ist: War die zusätzliche Kapazität nötig und muss sie ersetzt werden? War die Person eine rein quantitative Verstärkung, ist der Ersatz unkompliziert. Hat sie darüber hinaus persönliche Qualitäten eingebracht, wird die Lücke grösser sein als die Profilanalyse vermuten lässt.");
  } else if (c.matchCase === "TOP1_ONLY") {
    paras.push(`Ohne die Person verliert das Team den ergänzenden Impuls in ${COMP_DOMAIN[c.personSecondary]}. Die Grundlogik (${COMP_SHORT[c.teamPrimary]}) bleibt unverändert, aber die besondere Arbeitsweise — ${COMP_SHORT[c.personSecondary]} statt ${COMP_SHORT[c.teamSecondary]} — fehlt als Perspektive.`);
    paras.push("Das Team kehrt zu seiner bisherigen Arbeitsweise zurück. Kurzfristig bringt das Stabilität, weil die Anpassungsleistung wegfällt. Langfristig fehlt aber die Ergänzung. Bei der nächsten Besetzung sollte geprüft werden, ob ein ähnliches Profil erneut gesucht werden soll.");
  } else if (c.matchCase === "TOP2_ONLY") {
    paras.push(`Ohne die Person verliert das Team den Impuls in ${COMP_DOMAIN[c.personPrimary]}. Wie stark das spürbar ist, hängt davon ab, wie gut die Person integriert war und ob das Team ihre Ergänzung aktiv genutzt hat.`);
    paras.push("Das Team kehrt zu seiner bisherigen Arbeitsweise zurück. Kurzfristig bringt das Stabilität. Langfristig bleiben aber Schwächen und blinde Flecken, die die Person kompensiert hat, wieder unkompensiert. Bei der nächsten Besetzung prüfen, ob ein ähnliches Profil erneut gesucht werden soll.");
  } else {
    paras.push("Ohne die Person kehrt das Team zu seiner bisherigen Dynamik zurück. Wie stark das spürbar ist, hängt davon ab, wie die Integration verlaufen ist. Hat die Person das Team nachhaltig erweitert, hinterlässt sie eine Lücke. War die Zusammenarbeit von Reibung geprägt, entsteht möglicherweise sogar Entlastung.");
    paras.push("Entscheidend: Hat die Person Veränderungen in Prozessen oder Denkweisen verankert, die über ihre Anwesenheit hinaus wirken? Wenn ja, bleibt der positive Effekt. Wenn nicht, kehrt das Team schnell zum Ausgangszustand zurück. Nutzen Sie den Weggang für eine ehrliche Reflexion: Was hat die Besetzung gebracht? Was würden Sie anders machen?");
  }

  return paras.join("\n\n");
}


function buildSchlussfazit(c: Ctx): string {
  const { matchCase, isLeader, score, teamGoalLabel, taskFit, hasGoal } = c;

  if (_lang === "en") {
    const paras: string[] = [];
    if (score >= 85) {
      const goalPart = hasGoal && taskFit === "hoch"
        ? ` For the functional goal ${teamGoalLabel}, the person also brings a good fit.`
        : "";
      paras.push(`This placement is recommended. The person's working style aligns well with the team.${goalPart} ${isLeader ? "Starting in the leadership role should be smooth, because the manager communicates and decides in ways the team recognises." : "Integration should happen quickly, because the person understands team culture naturally."}`);
      paras.push(`It is still worth discussing expectations openly from the start. A strong profile fit reduces friction but does not guarantee perfect collaboration. ${isLeader ? "Check after ninety days whether the manager is also setting their own direction and not simply confirming what the team already thinks." : "Check after ninety days whether the team has become more one-sided through reinforcement."}`);
    } else if (score >= 60) {
      paras.push(`This placement can work, but it needs management. ${matchCase === "TOP1_ONLY" ? "The thinking logic matches, which is a stable foundation. In daily work there are differences that need clarification." : "In day-to-day work there are overlaps that carry the collaboration. The thinking direction differs, however, which becomes noticeable under pressure."}`);
      paras.push(`Whether the placement succeeds depends on whether the differences are used as a complement. This requires clear expectations, regular feedback, and openness on both sides. ${isLeader ? "The manager needs to know where to adapt and where to set their own direction." : "The manager carries the primary responsibility for setting the frame."} A progress review after ninety days is recommended.`);
    } else {
      const goalPart = hasGoal && taskFit !== "gering"
        ? ` For the functional goal ${teamGoalLabel}, however, the person can make a concrete contribution.`
        : "";
      if (matchCase === "TOP2_ONLY") {
        paras.push(`This placement is demanding. The thinking logics differ significantly, but in day-to-day work there is a connecting layer through ${cs(c.teamSecondary)}.${goalPart}`);
        paras.push("This shared working layer makes integration more realistic than with no overlap at all. Leadership must make clear when which working logic takes precedence, and communicate openly why this placement makes sense.");
      } else {
        paras.push(`This placement is demanding. Person and team differ significantly in both thinking logic and working approach.${goalPart}`);
        paras.push("Integration is possible, but only when it is clear why this placement makes sense despite the differences. When that is justified, it can strengthen the team. When it is not, the decision should be reviewed.");
      }
    }
    return paras.join("\n\n");
  }

  const paras: string[] = [];

  if (score >= 85) {
    const goalPart = hasGoal && taskFit === "hoch"
      ? ` Für das Funktionsziel ${teamGoalLabel} passt die Person ebenfalls gut.`
      : "";
    paras.push(`Die Besetzung ist empfehlenswert. Die Person passt in Denkweise und Arbeitsweise gut zum Team.${goalPart} ${isLeader ? "Der Einstieg in die Führungsrolle dürfte glatt verlaufen, weil die Führungskraft so kommuniziert und entscheidet, wie das Team es kennt." : "Die Integration dürfte schnell gelingen, weil die Person die Teamkultur intuitiv versteht."}`);
    paras.push(`Trotzdem lohnt es sich, Erwartungen von Anfang an offen zu besprechen. Gute Profilpassung reduziert Reibung, garantiert aber keine perfekte Zusammenarbeit. ${isLeader ? "Prüfen Sie nach 90 Tagen, ob die Führungskraft auch eigene Akzente setzt und nicht nur bestätigt, was das Team ohnehin denkt." : "Prüfen Sie nach 90 Tagen, ob das Team durch die Verstärkung nicht einseitiger geworden ist."}`);
  } else if (score >= 60) {
    paras.push(`Die Besetzung kann funktionieren, braucht aber Steuerung. ${matchCase === "TOP1_ONLY" ? "Die Denklogik stimmt überein — das ist eine stabile Basis. Im Alltag gibt es aber Unterschiede, die Klärung brauchen." : "Im Arbeitsalltag gibt es Überschneidungen, die den Alltag tragen. Die Denkrichtung unterscheidet sich aber, was unter Druck spürbar wird."}`);
    paras.push(`Ob die Besetzung gelingt, hängt davon ab, ob die Unterschiede als Ergänzung genutzt werden. Das braucht klare Erwartungen, regelmässiges Feedback und Offenheit auf beiden Seiten. ${isLeader ? "Die Führungskraft muss wissen, wo sie sich anpassen muss und wo sie eigene Akzente setzen kann." : "Die Führungskraft trägt die Hauptverantwortung, den Rahmen zu setzen."} Eine Bilanz nach 90 Tagen ist empfohlen.`);
  } else {
    const goalPart = hasGoal && taskFit !== "gering"
      ? ` Für das Funktionsziel ${teamGoalLabel} kann die Person allerdings einen konkreten Beitrag leisten.`
      : "";

    if (matchCase === "TOP2_ONLY") {
      paras.push(`Die Besetzung ist anspruchsvoll. Die Denklogik unterscheidet sich deutlich, aber im Arbeitsalltag gibt es über ${COMP_SHORT[c.teamSecondary]} eine verbindende Ebene.${goalPart}`);
      paras.push("Diese Alltagsbrücke macht die Integration realistischer als ohne jede Überschneidung. Die Führung muss aber klar machen, wann welche Arbeitslogik Vorrang hat — und offen kommunizieren, warum diese Besetzung trotzdem Sinn ergibt.");
    } else {
      paras.push(`Die Besetzung ist anspruchsvoll. Person und Team unterscheiden sich in Denkweise und Arbeitsweise deutlich.${goalPart}`);
      paras.push("Eine Integration ist möglich — aber nur, wenn klar ist, warum diese Besetzung trotz der Unterschiede Sinn ergibt. Wenn das begründet ist, kann sie das Team stärken. Wenn nicht, sollte die Entscheidung nochmals geprüft werden.");
    }
  }

  return paras.join("\n\n");
}


export function computeTeamCheckV4(input: TeamCheckV4Input): TeamCheckV4Result {
  _lang = input.lang === "en" ? "en" : "de";

  const inputRoleType = input.roleType;
  const isLeader = inputRoleType === "fuehrung" || inputRoleType === "leadership";
  const roleLabel = _lang === "en"
    ? (isLeader ? "Manager" : "Team member")
    : (isLeader ? "Führungskraft" : "Teammitglied");

  const teamPrimary = getTop1(input.teamProfile);
  const personPrimary = getTop1(input.personProfile);
  const teamSecondary = getTop2(input.teamProfile);
  const personSecondary = getTop2(input.personProfile);
  const teamClass = getProfileClass(input.teamProfile);
  const personClass = getProfileClass(input.personProfile);

  const { score, top1, top2, variant, matchCase, integrationCase } = computeScore(input.teamProfile, input.personProfile);

  const pSorted = sortTriad(input.personProfile);
  const pTop2Gap = pSorted[0].value - pSorted[1].value;
  const pTop2Keys = new Set([pSorted[0].key, pSorted[1].key]);
  const sameDominance = teamPrimary === personPrimary ||
    (pTop2Gap < 3 && pTop2Keys.has(teamPrimary));

  const validGoals: TeamGoal[] = ["umsetzung", "analyse", "zusammenarbeit"];
  const safeGoal: TeamGoal = input.teamGoal && validGoals.includes(input.teamGoal) ? input.teamGoal : null;
  const teamGoalLabel = safeGoal ? goalLabel(safeGoal) : "";
  const hasGoal = !!safeGoal;

  const teamFit = scoreToFit(score);
  const taskFit = computeTaskFit(input.teamProfile, input.personProfile, safeGoal);
  const begleitungsbedarf = fitToBegleitung(teamFit);
  const gesamteinschaetzung = gesamtLabel(teamFit, taskFit, matchCase);

  const roleName = input.roleTitle || (_lang === "en" ? "this role" : "diese Rolle");
  const goalKey = safeGoal ? GOAL_KEY[safeGoal] : null;

  const ctx: Ctx = {
    isLeader, roleName, teamPrimary, personPrimary, teamSecondary, personSecondary,
    teamClass, personClass, sameDominance, score, matchCase,
    teamFit, taskFit, gesamteinschaetzung, hasGoal, teamGoalLabel, goalKey,
  };

  const cr = buildChancenRisiken(ctx);

  const teamKontext = _lang === "en"
    ? (teamClass === "BALANCED" && personClass === "BALANCED"
        ? "Both the team and the person show a balanced profile with no clear dominant pattern across the three behavioural dimensions. Both sides are flexible and not fixed to any particular working logic. This means neither a strong alignment nor strong structural friction arises from the profiles."
        : teamClass === "BALANCED"
          ? `The team is broadly positioned with no dominant working pattern. The person, by contrast, leans more clearly toward ${cs(personPrimary)} and brings a more defined direction to the collaboration. This can provide the team with orientation, but requires attention to preserve the team's versatility.`
          : personClass === "BALANCED"
            ? `The team works with a clear focus on ${cs(teamPrimary)} and expects a similar orientation from new members. The person is more broadly positioned with no dominant pattern. They can adapt flexibly but must actively understand and embrace the team's logic.`
            : sameDominance
              ? `Both team and person operate through ${cs(teamPrimary)} as their primary working logic. The core logic is structurally close, which makes collaboration easier in principle. In day-to-day work, differences in pace and approach are to be expected, as the team relies more on ${cs(teamSecondary)} while the person tends toward ${cs(personSecondary)}.`
              : `The team works with a clear focus on ${cs(teamPrimary)} and has aligned to this logic. The person, by contrast, leans more toward ${cs(personPrimary)} and approaches things differently. Clear expectations from the start are needed.`)
    : (teamClass === "BALANCED" && personClass === "BALANCED"
        ? "Sowohl Team als auch Person zeigen ein ausgeglichenes Profil ohne klare Dominanz in einem der drei bioLogic-Grundmuster. Beide Seiten sind situativ flexibel und nicht auf eine bestimmte Arbeitslogik festgelegt. Dadurch entsteht weder eine starke Übereinstimmung noch eine starke Reibung aus der Profilstruktur heraus."
        : teamClass === "BALANCED"
          ? `Das Team ist ausgeglichen aufgestellt und zeigt kein dominantes Arbeitsmuster. Die Person setzt dagegen stärker auf ${COMP_SHORT[personPrimary]} und bringt damit eine klarere Richtung in die Zusammenarbeit ein. Das kann dem Team Orientierung geben, erfordert aber Aufmerksamkeit, damit die Vielseitigkeit des Teams erhalten bleibt.`
          : personClass === "BALANCED"
            ? `Das Team arbeitet mit einem klaren Schwerpunkt auf ${COMP_SHORT[teamPrimary]} und erwartet von neuen Mitgliedern eine ähnliche Ausrichtung. Die Person ist dagegen breit aufgestellt und zeigt kein dominantes Muster. Sie kann flexibel anschliessen, muss aber die Teamlogik aktiv verstehen und annehmen.`
            : sameDominance
              ? `Team und Person setzen beide auf ${COMP_SHORT[teamPrimary]} als primäre Arbeitslogik. Die Grundlogik liegt strukturell nah beieinander, was die Zusammenarbeit grundsätzlich erleichtert. Im Alltag sind jedoch Unterschiede in Tempo und Vorgehen zu erwarten, da das Team stärker auf ${COMP_SHORT[teamSecondary]} setzt, die Person eher auf ${COMP_SHORT[personSecondary]}.`
              : `Das Team arbeitet mit einem klaren Schwerpunkt auf ${COMP_SHORT[teamPrimary]} und hat sich auf diese Arbeitslogik eingestellt. Die Person setzt dagegen stärker auf ${COMP_SHORT[personPrimary]} und geht Dinge anders an. Das braucht klare Erwartungen von Anfang an.`);

  return {
    roleTitle: input.roleTitle,
    roleType: isLeader ? "leadership" : "member",
    roleLabel,
    teamGoal: safeGoal,
    teamGoalLabel,

    introText: buildIntroText(ctx),

    gesamteinschaetzung,
    passungZumTeam: teamFit,
    beitragZurAufgabe: taskFit,
    begleitungsbedarf,

    gesamtbewertungText: buildGesamtbewertungText(ctx),
    hauptstaerke: buildHauptstaerke(ctx),
    hauptabweichung: buildHauptabweichung(ctx),

    warumText: buildWarumText(ctx),

    wirkungAlltagText: buildWirkungAlltagText(ctx),

    chancen: cr.chancen,
    risiken: cr.risiken,
    chancenRisikenEinordnung: cr.chancenRisikenEinordnung,

    druckText: buildDruckText(ctx),

    fuehrungshinweis: buildFuehrungshinweis(ctx),

    risikoprognose: buildRisikoprognose(ctx),
    integrationsplan: buildIntegrationsplan(ctx),
    ...buildIntegrationZusatz(ctx),

    empfehlungen: buildEmpfehlungen(ctx),

    teamOhnePersonText: buildTeamOhnePerson(ctx),
    schlussfazit: buildSchlussfazit(ctx),

    teamKontext,
    teamPrimary,
    personPrimary,
    sameDominance,
    teamTriad: { ...input.teamProfile },
    personTriad: { ...input.personProfile },

    systemwirkung: computeSystemwirkung(matchCase, integrationCase),

    score,
    scoreBreakdown: { top1, top2, variant },
    matchCase,
    integrationCase,
  };
}
