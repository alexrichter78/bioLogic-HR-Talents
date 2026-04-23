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
  lang?: "de" | "en" | "fr" | "it";
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

let _lang: "de" | "en" | "fr" | "it" = "de";
function t(de: string, en: string, fr?: string, it?: string): string {
  if (_lang === "it") return it ?? en ?? de;
  if (_lang === "fr") return fr ?? de;
  return _lang === "en" ? en : de;
}

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

const GOAL_LABELS_FR: Record<string, string> = {
  umsetzung: "Exécution et Résultats",
  analyse: "Analyse et Structure",
  zusammenarbeit: "Collaboration et Communication",
};

const GOAL_LABELS_IT: Record<string, string> = {
  umsetzung: "Esecuzione e Risultati",
  analyse: "Analisi e Struttura",
  zusammenarbeit: "Collaborazione e Comunicazione",
};

function goalLabel(key: string): string {
  if (_lang === "it") return GOAL_LABELS_IT[key] ?? key;
  if (_lang === "fr") return GOAL_LABELS_FR[key] ?? key;
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
  impulsiv: "Action-oriented",
  intuitiv: "Relational",
  analytisch: "Analytical",
};

const COMP_SHORT_FR: Record<ComponentKey, string> = {
  impulsiv: "Orienté action",
  intuitiv: "Relationnel",
  analytisch: "Analytique",
};

const COMP_SHORT_IT: Record<ComponentKey, string> = {
  impulsiv: "Orientato all'azione",
  intuitiv: "Relazionale",
  analytisch: "Analitico",
};

function cs(k: ComponentKey): string {
  if (_lang === "it") return COMP_SHORT_IT[k];
  if (_lang === "fr") return COMP_SHORT_FR[k];
  return _lang === "en" ? COMP_SHORT_EN[k] : COMP_SHORT[k];
}

const COMP_DOMAIN: Record<ComponentKey, string> = {
  impulsiv: "Handlung und Umsetzung",
  intuitiv: "Kommunikation und Abstimmung",
  analytisch: "Struktur und Analyse",
};

const COMP_DOMAIN_EN: Record<ComponentKey, string> = {
  impulsiv: "Action-oriented",
  intuitiv: "Relational",
  analytisch: "Analytical",
};

const COMP_DOMAIN_FR: Record<ComponentKey, string> = {
  impulsiv: "Orienté action",
  intuitiv: "Relationnel",
  analytisch: "Analytique",
};

const COMP_DOMAIN_IT: Record<ComponentKey, string> = {
  impulsiv: "Orientato all'azione",
  intuitiv: "Relazionale",
  analytisch: "Analitico",
};

function cd(k: ComponentKey): string {
  if (_lang === "it") return COMP_DOMAIN_IT[k];
  if (_lang === "fr") return COMP_DOMAIN_FR[k];
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

const COMP_ADJ_FR: Record<ComponentKey, string> = {
  impulsiv: "avec plus de rythme et de décision",
  intuitiv: "par l'échange et la collaboration",
  analytisch: "de manière plus structurée et rigoureuse",
};

const COMP_ADJ_IT: Record<ComponentKey, string> = {
  impulsiv: "con più ritmo e decisione",
  intuitiv: "attraverso lo scambio e la collaborazione",
  analytisch: "in modo più strutturato e rigoroso",
};

function ca(k: ComponentKey): string {
  if (_lang === "it") return COMP_ADJ_IT[k];
  if (_lang === "fr") return COMP_ADJ_FR[k];
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
  if (_lang === "fr") {
    if (teamFit === "hoch" && taskFit === "hoch") return "Très adapté";
    if (teamFit === "hoch" && taskFit === "mittel") return "Bien adapté";
    if (teamFit === "hoch" && taskFit === "gering") return "Adapté culturellement, portée fonctionnelle limitée";
    if (teamFit === "hoch" && taskFit === "nicht bewertet") return "Bien adapté";
    if (teamFit === "mittel" && taskFit === "hoch") return "Fonctionnellement précieux, intégration exigeante";
    if (teamFit === "mittel" && taskFit === "mittel") return "Partiellement adapté";
    if (teamFit === "mittel" && taskFit === "gering") return "Intégrable, sans levier fonctionnel clair";
    if (teamFit === "mittel" && taskFit === "nicht bewertet") return "Partiellement adapté";
    if (teamFit === "gering" && taskFit === "hoch") return "Intéressant fonctionnellement, risqué culturellement";
    if (teamFit === "gering" && taskFit === "mittel") return "Friction élevée, valeur ajoutée limitée";
    if (matchCase === "TOP2_ONLY") return "Friction notable avec passerelle quotidienne";
    return "Critique";
  }
  if (_lang === "it") {
    if (teamFit === "hoch" && taskFit === "hoch") return "Molto adatto";
    if (teamFit === "hoch" && taskFit === "mittel") return "Ben adatto";
    if (teamFit === "hoch" && taskFit === "gering") return "Compatibile culturalmente, portata funzionale limitata";
    if (teamFit === "hoch" && taskFit === "nicht bewertet") return "Ben adatto";
    if (teamFit === "mittel" && taskFit === "hoch") return "Funzionalmente prezioso, integrazione più impegnativa";
    if (teamFit === "mittel" && taskFit === "mittel") return "Parzialmente adatto";
    if (teamFit === "mittel" && taskFit === "gering") return "Integrabile, senza leva funzionale chiara";
    if (teamFit === "mittel" && taskFit === "nicht bewertet") return "Parzialmente adatto";
    if (teamFit === "gering" && taskFit === "hoch") return "Interessante funzionalmente, culturalmente rischioso";
    if (teamFit === "gering" && taskFit === "mittel") return "Alta tensione, valore aggiunto limitato";
    if (matchCase === "TOP2_ONLY") return "Alta tensione con ponte quotidiano";
    return "Critico";
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
  if (_lang === "fr") {
    const p1 = c.isLeader
      ? "Ce rapport indique comment cette personne est susceptible d'agir dans un rôle de manager au sein de l'équipe existante. Il compare les profils bioLogic de la personne et de l'équipe et montre où la collaboration peut bien fonctionner, où des frictions sont probables et où des clarifications seront nécessaires au quotidien. Il ne remplace pas une évaluation personnelle, mais apporte une perspective que les entretiens ne révèlent souvent pas."
      : "Ce rapport indique comment cette personne est susceptible d'agir au sein de l'équipe existante. Il compare les profils bioLogic de la personne et de l'équipe et montre où la collaboration peut bien fonctionner, où des frictions sont probables et où des clarifications seront nécessaires au quotidien. Il ne remplace pas une évaluation personnelle, mais apporte une perspective que les entretiens ne révèlent souvent pas.";
    const p2 = "Les différences entre la personne et l'équipe ne sont pas automatiquement négatives. Elles peuvent apporter une réelle valeur ajoutée à l'équipe. Pour que cela fonctionne, les attentes doivent être claires et le management doit être actif. Ce rapport fournit la base pour prendre les bonnes décisions rapidement.";
    return `${p1}\n\n${p2}`;
  }
  if (_lang === "it") {
    const p1 = c.isLeader
      ? "Questo rapporto mostra come questa persona agirà probabilmente in un ruolo di responsabile nel team esistente. Confronta i profili bioLogic della persona e del team e rende visibili i punti di forza della collaborazione, le possibili frizioni e le aree che richiedono chiarimento nel quotidiano. Non sostituisce una valutazione personale, ma la integra con una prospettiva che i colloqui spesso non rivelano."
      : "Questo rapporto mostra come questa persona agirà probabilmente nel team esistente. Confronta i profili bioLogic della persona e del team e rende visibili i punti di forza della collaborazione, le possibili frizioni e le aree che richiedono chiarimento nel quotidiano. Non sostituisce una valutazione personale, ma la integra con una prospettiva che i colloqui spesso non rivelano.";
    const p2 = "Le differenze tra persona e team non sono automaticamente negative. Possono integrare il team in modo costruttivo. Perché questo funzioni, sono necessarie aspettative chiare e una leadership attiva. Questo rapporto fornisce la base per prendere le giuste decisioni con anticipo.";
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

  if (_lang === "fr") {
    const paras: string[] = [];

    if (teamClass === "BALANCED" && personClass === "BALANCED") {
      paras.push("L'équipe et la personne présentent toutes deux une structure équilibrée sans dominante claire. Aucune des trois dimensions bioLogic ne ressort fortement d'un côté ou de l'autre. Les deux parties peuvent réagir de manière flexible selon les situations et aucune logique de travail rigide ne vient s'opposer à l'autre. L'intégration devrait donc se dérouler sans friction majeure. La collaboration peut s'établir rapidement car aucun des deux côtés n'impose de direction dominante.");
      paras.push("Le risque de cette configuration réside paradoxalement dans l'absence de friction utile : ni l'équipe ni la personne ne donnent de cap clair. En période de forte pression de décision, de ressources limitées ou de conflits, cela peut conduire à des hésitations, à une dilution des responsabilités ou à un manque de priorisation. Dans ces moments-là, une coordination externe ou une clarification explicite des rôles sera nécessaire.");
    } else if (teamClass === "BALANCED") {
      paras.push(`L'équipe est diversifiée et non fixée à une logique de travail unique. Les trois dimensions bioLogic sont réparties de manière relativement équilibrée, ce qui lui confère une grande capacité d'adaptation. La personne, en revanche, apporte une logique de travail nettement plus marquée, orientée vers ${cd(c.personPrimary)}. Cela peut donner à l'équipe une orientation bienvenue qu'elle n'avait pas jusqu'à présent.`);
      paras.push("En même temps, il existe un risque que la personne fasse pencher l'équilibre existant dans une seule direction. Plus la dominante de la personne est marquée, plus elle attirera la culture d'équipe vers son style. Cela peut être voulu, mais doit être piloté consciemment. Sans leadership clair, l'équipe risque de perdre sa polyvalence et des résistances peuvent apparaître chez certains membres qui ne se retrouvent pas dans la nouvelle orientation.");
    } else if (personClass === "BALANCED") {
      paras.push(`L'équipe suit une logique de travail claire, orientée vers ${cd(c.teamPrimary)}. Les décisions, la communication et la collaboration s'organisent autour de ce schéma. La personne, elle, est plus polyvalente et moins clairement orientée. Elle ne présente pas de logique dominante et peut donc passer situativement d'une approche à l'autre.`);
      paras.push("Cela permet à la personne de s'adapter avec souplesse à la logique de l'équipe. Elle court cependant le risque de ne pas être perçue de manière suffisamment claire dans son rôle. L'équipe pourrait la trouver peu profilée ou difficilement lisible. Une intégration réussie nécessite que les attentes envers la personne soient formulées concrètement dès le début et que sa contribution spécifique soit clairement définie.");
    } else if (matchCase === "TOP1_TOP2") {
      paras.push(isLeader
        ? `La façon de travailler de la personne correspond très bien à celle de l'équipe. La logique fondamentale (${cd(c.teamPrimary)}) et l'approche de collaboration au quotidien (${cd(c.teamSecondary)}) concordent. La personne ne comprend pas seulement la culture d'équipe, elle la partage naturellement. L'entrée dans le rôle de manager devrait se dérouler sans friction, car le manager communique et décide dans un langage que l'équipe reconnaît et attend.`
        : `La façon de travailler de la personne correspond très bien à celle de l'équipe. La logique fondamentale (${cd(c.teamPrimary)}) et l'approche de collaboration au quotidien (${cd(c.teamSecondary)}) concordent. La personne ne comprend pas seulement la culture d'équipe, elle la partage naturellement. L'intégration devrait se dérouler sans friction et devenir rapidement efficace au quotidien, car les deux parties se retrouvent dans des schémas familiers.`);
      paras.push("Cette forte concordance a aussi un revers : la personne renforce la logique d'équipe existante au lieu de la compléter. Les angles morts de l'équipe restent invisibles car la nouvelle personne partage les mêmes forces et les mêmes faiblesses. À long terme, cela peut accentuer les schémas existants et rendre l'équipe plus unidimensionnelle.");
    } else if (matchCase === "TOP1_ONLY") {
      paras.push(isLeader
        ? `La personne partage la logique fondamentale de l'équipe : ${cd(c.teamPrimary)}. Cela crée une base de confiance stable, car l'équipe reconnaît que le manager partage la même façon fondamentale de penser. Dans le travail quotidien, cependant, les approches diffèrent. L'équipe s'appuie davantage sur ${cs(c.teamSecondary)}, la personne plutôt sur ${cs(c.personSecondary)}. La direction est partagée, mais le chemin pour y parvenir diffère.`
        : `La personne partage la logique fondamentale de l'équipe : ${cd(c.teamPrimary)}. Cela crée une base stable pour la collaboration, car les deux parties se comprennent au niveau fondamental. Dans le travail quotidien, cependant, les approches diffèrent. L'équipe s'appuie davantage sur ${cs(c.teamSecondary)}, la personne plutôt sur ${cs(c.personSecondary)}. La direction est partagée, mais le chemin pour y parvenir diffère.`);
      paras.push("La collaboration de base est donc assurée et la personne ne sera pas perçue comme un corps étranger. Au quotidien, des différences dans la communication, le rythme et l'approche concrète peuvent cependant devenir visibles. Ces différences sont généralement bien gérables, mais une clarification précoce des attentes mutuelles est utile. Avec une bonne coordination, une intégration stable et productive est tout à fait réalisable.");
    } else if (matchCase === "TOP2_ONLY") {
      paras.push(`La logique de pensée de la personne diffère de celle de l'équipe. L'équipe travaille par ${cd(c.teamPrimary)}, la personne par ${cd(c.personPrimary)}. Cette différence se fera sentir au quotidien et peut créer des frictions.`);
      paras.push(`Dans le comportement concret au travail, il existe cependant des points communs : les deux s'appuient sur ${cs(c.teamSecondary)}. Cela crée un pont important dans le travail courant. L'intégration peut fonctionner, mais elle nécessite un pilotage conscient et des attentes claires.`);
    } else {
      paras.push(`La personne s'écarte sensiblement de l'équipe tant dans la logique de pensée que dans l'approche concrète. L'équipe travaille par ${cd(c.teamPrimary)}, la personne par ${cd(c.personPrimary)}. Cette différence ne concerne pas seulement des détails, mais la manière dont les décisions sont prises, les priorités fixées et la communication organisée.`);
      paras.push("Des frictions perceptibles au quotidien sont donc à prévoir. En réunion et lors des prises de décision, des attentes différentes se heurteront. Une intégration est possible, mais elle demande un effort de management important et la décision claire que ces différences sont voulues. Sans accompagnement actif, la frustration croît des deux côtés.");
    }

    if (hasGoal) {
      if (taskFit === "hoch") {
        paras.push(`Pour l'objectif fonctionnel ${teamGoalLabel}, la personne apporte la bonne force. Elle pourra vraisemblablement travailler efficacement et de manière autonome dans les tâches principales de ce rôle.`);
      } else if (taskFit === "mittel") {
        paras.push(`Pour l'objectif fonctionnel ${teamGoalLabel}, la personne apporte une partie de la force requise. Dans les tâches principales, un accompagnement ciblé et le soutien de membres de l'équipe plus compétents dans ce domaine seront utiles.`);
      } else if (taskFit === "gering") {
        paras.push(`Pour l'objectif fonctionnel ${teamGoalLabel}, la personne n'apporte pas la force adaptée. Cela ne signifie pas qu'elle ne peut pas remplir le rôle, mais il faudra davantage d'accompagnement et de soutien pour obtenir les résultats attendus.`);
      }
    }

    return paras.join("\n\n");
  }

  if (_lang === "it") {
    const paras: string[] = [];

    if (teamClass === "BALANCED" && personClass === "BALANCED") {
      paras.push("Il team e la persona mostrano entrambi una struttura equilibrata senza una dominante chiara. Nessuna delle tre dimensioni bioLogic emerge con forza da nessuno dei due lati. Entrambe le parti possono reagire in modo flessibile alle situazioni e nessuna logica di lavoro rigida si contrappone all'altra. L'integrazione dovrebbe procedere senza attriti significativi, e la collaborazione può stabilizzarsi rapidamente perché nessuno dei due lati impone una direzione dominante.");
      paras.push("Il rischio di questa configurazione risiede paradossalmente nell'assenza di frizione utile: né il team né la persona indicano una direzione chiara. In momenti di forte pressione decisionale, risorse limitate o conflitti, questo può portare a esitazioni, dispersione delle responsabilità o mancanza di priorità. In questi momenti sarà necessaria una coordinazione esterna o una definizione esplicita dei ruoli.");
    } else if (teamClass === "BALANCED") {
      paras.push(`Il team è ampiamente strutturato e non orientato a un'unica logica di lavoro. Le tre dimensioni bioLogic sono distribuite in modo relativamente equilibrato, il che gli conferisce un'elevata capacità di adattamento. La persona, al contrario, porta una logica di lavoro nettamente più marcata, orientata verso ${cd(c.personPrimary)}. Questo può dare al team un orientamento benvenuto che finora non aveva.`);
      paras.push("Al tempo stesso esiste il rischio che la persona faccia pendere l'equilibrio esistente in un'unica direzione. Più la dominante della persona è marcata, più essa attirerà la cultura del team verso il proprio stile. Questo può essere intenzionale, ma deve essere gestito con consapevolezza. Senza una leadership chiara, il team rischia di perdere la propria versatilità e resistenze possono emergere tra i membri che non si ritrovano nel nuovo orientamento.");
    } else if (personClass === "BALANCED") {
      paras.push(`Il team segue una logica di lavoro chiara, orientata verso ${cd(c.teamPrimary)}. Le decisioni, la comunicazione e la collaborazione si organizzano attorno a questo schema. La persona è più versatile e meno chiaramente orientata. Non ha una logica dominante e può quindi passare situativamente da un approccio all'altro.`);
      paras.push("Questo dà alla persona flessibilità per adattarsi alla logica del team. Il rischio è che possa non apparire chiaramente posizionata. Il team può percepirla come priva di un profilo distinto. Un'integrazione riuscita richiede che le aspettative siano definite concretamente fin dall'inizio e che il contributo specifico della persona sia reso esplicito.");
    } else if (matchCase === "TOP1_TOP2") {
      paras.push(isLeader
        ? `Lo stile di lavoro della persona si allinea strettamente a quello del team. Sia la logica di lavoro principale (${cd(c.teamPrimary)}) sia l'approccio quotidiano (${cd(c.teamSecondary)}) coincidono. La persona non comprende semplicemente la cultura del team: la condivide in modo naturale. L'ingresso nel ruolo di responsabile dovrebbe avvenire senza attriti, perché il responsabile comunica e decide con modalità che il team riconosce.`
        : `Lo stile di lavoro della persona si allinea strettamente a quello del team. Sia la logica di lavoro principale (${cd(c.teamPrimary)}) sia l'approccio quotidiano (${cd(c.teamSecondary)}) coincidono. La persona non comprende semplicemente la cultura del team: la condivide in modo naturale. L'integrazione dovrebbe avvenire rapidamente e diventare produttiva, perché entrambe le parti operano secondo schemi familiari.`);
      paras.push("Questa forte convergenza ha un lato negativo. La persona rafforza la logica esistente del team anziché ampliarla. I punti ciechi restano nascosti perché la nuova persona condivide le stesse forze e debolezze. Nel tempo questo può rendere il team più unilaterale.");
    } else if (matchCase === "TOP1_ONLY") {
      paras.push(isLeader
        ? `La persona condivide la logica principale del team: ${cd(c.teamPrimary)}. Questo crea una base stabile di fiducia, perché il team riconosce che il responsabile pensa nello stesso modo fondamentale. Nel lavoro quotidiano, tuttavia, gli approcci differiscono. Il team si affida maggiormente a ${cs(c.teamSecondary)}, la persona a ${cs(c.personSecondary)}. La direzione è condivisa, ma il percorso per raggiungerla differisce.`
        : `La persona condivide la logica principale del team: ${cd(c.teamPrimary)}. Questo crea una base stabile per la collaborazione, perché entrambe le parti si capiscono al livello fondamentale. Nel lavoro quotidiano, tuttavia, gli approcci differiscono. Il team si affida maggiormente a ${cs(c.teamSecondary)}, la persona a ${cs(c.personSecondary)}. La direzione è condivisa, ma il percorso per raggiungerla differisce.`);
      paras.push("La collaborazione di base è stabilita e la persona non si sentirà fuori posto. In pratica, possono emergere differenze nella comunicazione, nel ritmo e nell'approccio concreto. In genere sono gestibili, ma un chiarimento precoce delle aspettative reciproche aiuta. Con un buon allineamento, un'integrazione stabile e produttiva è ben raggiungibile.");
    } else if (matchCase === "TOP2_ONLY") {
      paras.push(`La logica di pensiero della persona differisce da quella del team. Il team lavora attraverso ${cd(c.teamPrimary)}, la persona attraverso ${cd(c.personPrimary)}. Questa differenza si farà sentire nel lavoro quotidiano e può causare attrito.`);
      paras.push(`Nel comportamento lavorativo concreto esiste una sovrapposizione: entrambi si affidano a ${cs(c.teamSecondary)}. Questo crea un ponte importante nel quotidiano. L'integrazione può funzionare, ma richiede una leadership deliberata e aspettative chiare.`);
    } else {
      paras.push(`La persona differisce dal team sia nella logica di pensiero sia nell'approccio di lavoro. Il team lavora attraverso ${cd(c.teamPrimary)}, la persona attraverso ${cd(c.personPrimary)}. Questa differenza non riguarda solo i dettagli: riguarda il modo in cui vengono prese le decisioni, fissate le priorità e gestita la comunicazione.`);
      paras.push("Nel lavoro quotidiano è prevedibile una frizione significativa. In riunioni e decisioni, aspettative diverse si scontreranno. L'integrazione è possibile, ma richiede un notevole sforzo di leadership e una chiara decisione che queste differenze siano intenzionali. Senza un supporto attivo, la frustrazione crescerà su entrambi i lati.");
    }

    if (hasGoal) {
      if (taskFit === "hoch") {
        paras.push(`Per l'obiettivo funzionale ${teamGoalLabel}, la persona porta la forza giusta. Lavorerà probabilmente bene e in modo autonomo nelle attività principali di questo ruolo.`);
      } else if (taskFit === "mittel") {
        paras.push(`Per l'obiettivo funzionale ${teamGoalLabel}, la persona porta parte della forza necessaria. Nelle attività principali sarà utile un supporto mirato e il contributo di colleghi con maggiore forza in quest'area.`);
      } else if (taskFit === "gering") {
        paras.push(`Per l'obiettivo funzionale ${teamGoalLabel}, la persona non porta la forza adeguata. Questo non significa che il ruolo non possa essere svolto, ma che sarà necessario un maggiore supporto per ottenere i risultati attesi.`);
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
  if (_lang === "fr") {
    if (c.matchCase === "TOP1_TOP2") return `Logique de travail et approche communes avec l'équipe (${cs(c.teamPrimary)} et ${cs(c.teamSecondary)}).`;
    if (c.matchCase === "TOP1_ONLY") return `Logique fondamentale commune avec l'équipe (${cs(c.teamPrimary)}).`;
    if (c.matchCase === "TOP2_ONLY") return `Chevauchement dans l'approche quotidienne (${cs(c.teamSecondary)}).`;
    if (c.personClass === "BALANCED") return "Polyvalence et capacité d'adaptation.";
    return `Atout distinct en ${cs(c.personPrimary)}.`;
  }
  if (_lang === "it") {
    if (c.matchCase === "TOP1_TOP2") return `Logica di lavoro e approccio condivisi con il team (${cs(c.teamPrimary)} e ${cs(c.teamSecondary)}).`;
    if (c.matchCase === "TOP1_ONLY") return `Logica fondamentale condivisa con il team (${cs(c.teamPrimary)}).`;
    if (c.matchCase === "TOP2_ONLY") return `Sovrapposizione nell'approccio quotidiano (${cs(c.teamSecondary)}).`;
    if (c.personClass === "BALANCED") return "Versatilità e capacità di adattamento.";
    return `Forza distinta in ${cs(c.personPrimary)}.`;
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
  if (_lang === "fr") {
    if (c.matchCase === "TOP1_TOP2") return "Aucun écart significatif identifié.";
    if (c.matchCase === "TOP1_ONLY") return `Approche quotidienne différente (équipe : ${cs(c.teamSecondary)}, personne : ${cs(c.personSecondary)}).`;
    if (c.matchCase === "TOP2_ONLY") return `Logique fondamentale différente (équipe : ${cd(c.teamPrimary)}, personne : ${cd(c.personPrimary)}).`;
    return `Logique fondamentale et approche quotidienne diffèrent (équipe : ${cd(c.teamPrimary)}, personne : ${cd(c.personPrimary)}).`;
  }
  if (_lang === "it") {
    if (c.matchCase === "TOP1_TOP2") return "Nessuna deviazione significativa rilevata.";
    if (c.matchCase === "TOP1_ONLY") return `Approccio quotidiano diverso (team: ${cs(c.teamSecondary)}, persona: ${cs(c.personSecondary)}).`;
    if (c.matchCase === "TOP2_ONLY") return `Logica fondamentale diversa (team: ${cd(c.teamPrimary)}, persona: ${cd(c.personPrimary)}).`;
    return `Logica fondamentale e approccio quotidiano differiscono (team: ${cd(c.teamPrimary)}, persona: ${cd(c.personPrimary)}).`;
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

  if (_lang === "fr") {
    const paras: string[] = [];
    if (teamClass === "BALANCED" && personClass === "BALANCED") {
      paras.push("L'équipe et la personne présentent toutes deux un profil équilibré sans dominante claire. Aucune des trois dimensions bioLogic ne se démarque nettement d'un côté ou de l'autre. L'évaluation dépend donc moins d'une correspondance structurelle dans une logique particulière que de la flexibilité fondamentale des deux parties.");
      paras.push("En pratique, les deux parties réagissent de manière situationnelle et peuvent s'adapter à différentes exigences. La collaboration dépendra davantage des facteurs personnels, du style de communication et des tâches concrètes que de la structure des profils. C'est un avantage pour la flexibilité, mais cela peut conduire à une désorientation dans les phases qui requièrent des décisions claires.");
    } else if (teamClass === "BALANCED") {
      paras.push(`L'équipe présente un profil équilibré sans dominante claire. Elle n'est pas fixée à une logique de travail particulière et réagit de manière situationnelle. La personne, en revanche, a une orientation claire vers ${cd(personPrimary)}. Cette configuration signifie que la personne apporte une direction reconnaissable alors que l'équipe y est fondamentalement ouverte.`);
      paras.push("L'intégration peut réussir si la personne apporte sa force de manière ciblée et constructive sans restreindre la polyvalence de l'équipe. L'enjeu clé est de savoir si l'équipe perçoit la ligne claire de la personne comme un enrichissement ou comme une contrainte. C'est là que réside la responsabilité du management : fixer un cadre dans lequel la force de la personne peut s'exprimer sans que l'équipe perde sa capacité d'adaptation.");
    } else if (personClass === "BALANCED") {
      paras.push(`L'équipe suit une logique de travail claire, axée sur ${cd(teamPrimary)}. Les décisions et la communication de l'équipe s'orientent selon ce schéma. La personne, elle, est plus polyvalente et ne présente pas de dominante unique. Elle peut réagir de manière flexible selon les situations, mais n'apporte pas de direction clairement reconnaissable.`);
      paras.push("L'intégration dépend de la capacité de la personne à comprendre, accepter et soutenir la logique de l'équipe. Elle doit s'engager dans le schéma dominant de l'équipe, même si cela ne correspond pas à sa propre façon naturelle de travailler. Si cela fonctionne, la personne peut apporter une précieuse flexibilité. Sinon, il y a un risque qu'elle soit perçue comme peu profilée ou difficilement lisible.");
    } else {
      if (matchCase === "TOP1_TOP2") {
        paras.push(`L'équipe et la personne s'appuient toutes deux sur ${cd(teamPrimary)} comme logique principale et sur ${cd(teamSecondary)} comme approche complémentaire. Cette double concordance crée une compatibilité de base élevée. La personne pense, décide et communique selon les mêmes schémas que l'équipe. Cela facilite considérablement l'intégration et réduit le risque de malentendus dans les premières semaines.`);
        paras.push("Le revers de cette concordance : les deux parties ont les mêmes forces, mais aussi les mêmes angles morts. La personne ne complète pas l'équipe, elle renforce son orientation existante. À long terme, cela peut conduire à un rétrécissement si aucune voix contraire n'est intentionnellement introduite.");
      } else if (matchCase === "TOP1_ONLY") {
        paras.push(`La logique principale est partagée : les deux parties s'appuient sur ${cd(teamPrimary)} comme mode de pensée et de décision primaire. Cela crée une base stable, car la personne et l'équipe se comprennent dans leur approche fondamentale. Au quotidien, cependant, l'approche complémentaire diffère : l'équipe s'appuie davantage sur ${cs(teamSecondary)}, la personne plutôt sur ${cs(personSecondary)}.`);
        paras.push("Cela crée une base stable avec des différences visibles dans les détails. La personne ne sera pas perçue comme un corps étranger, mais dans des situations de travail concrètes, des attentes différentes en matière de rythme, de communication ou de rigueur peuvent se heurter. Ces différences sont généralement bien gérables et peuvent même fonctionner comme un complément si elles sont nommées et acceptées tôt.");
      } else if (matchCase === "TOP2_ONLY") {
        paras.push(`La correspondance reflète une configuration avec deux forces opposées. D'un côté, la logique principale (Top 1) ne correspond pas : l'équipe s'appuie sur ${cd(teamPrimary)}, la personne sur ${cd(personPrimary)}. Cette différence fait baisser considérablement le score car elle concerne la direction fondamentale de la pensée et de la décision.`);
        paras.push(`De l'autre côté, l'approche complémentaire (Top 2) concorde : les deux parties utilisent ${cs(teamSecondary)}. Ce dénominateur commun absorbe une partie des frictions au quotidien et explique pourquoi la collaboration fonctionne souvent mieux en pratique que la simple analyse de profil ne le laisserait supposer. Le score reflète fidèlement la tension structurelle, mais tend à surestimer la distance pratique.`);
      } else {
        paras.push(`L'équipe et la personne diffèrent dans la logique fondamentale et dans l'approche de travail. L'équipe s'appuie sur ${cd(teamPrimary)} avec ${cs(teamSecondary)}, la personne sur ${cd(personPrimary)} avec ${cs(personSecondary)}. Cette tension affecte la communication, les décisions et les interactions quotidiennes.`);
        paras.push("Ce n'est pas forcément un problème. Parfois une équipe a besoin exactement de cette perspective différente. Mais cela nécessite un management actif et une clarté sur les raisons pour lesquelles cette composition a du sens. Sans cela, la friction domine le quotidien.");
      }
    }
    return paras.join("\n\n");
  }

  if (_lang === "it") {
    const paras: string[] = [];

    if (teamClass === "BALANCED" && personClass === "BALANCED") {
      paras.push("Il team e la persona mostrano entrambi un profilo equilibrato senza una dominante chiara. Nessuna delle tre dimensioni bioLogic emerge con forza da nessuno dei due lati. La valutazione dipende quindi meno da una corrispondenza strutturale in una logica particolare che dalla flessibilità fondamentale di entrambe le parti.");
      paras.push("In pratica questo si manifesta nel fatto che entrambe le parti reagiscono in modo situazionale e si adattano a diversi requisiti. La collaborazione dipende quindi più da fattori personali, dallo stile di comunicazione e dalle attività concrete che dalla struttura dei profili. Questo è un vantaggio per la flessibilità, ma può portare a disorientamento nelle fasi che richiedono decisioni chiare.");
    } else if (teamClass === "BALANCED") {
      paras.push(`Il team mostra un profilo equilibrato senza una dominante chiara. Non è vincolato a una logica di lavoro specifica e risponde situazionalmente. La persona, al contrario, ha un orientamento chiaro verso ${cd(personPrimary)}. Questa costellazione significa che la persona porta una direzione riconoscibile mentre il team è fondamentalmente aperto ad essa.`);
      paras.push("L'integrazione può riuscire quando la persona porta la propria forza in modo mirato e costruttivo senza limitare la versatilità del team. La domanda decisiva è se il team percepisce la linea chiara della persona come un arricchimento o come una limitazione. Qui risiede la responsabilità della leadership: definire il quadro in cui la forza della persona può esprimersi senza che il team perda la propria capacità di adattamento.");
    } else if (personClass === "BALANCED") {
      paras.push(`Il team segue una logica di lavoro chiara con enfasi su ${cd(teamPrimary)}. Le decisioni e la comunicazione del team si orientano secondo questo schema. La persona, al contrario, è più ampiamente posizionata e non mostra un pattern dominante unico. Riesce a rispondere in modo flessibile alle situazioni, ma non porta una direzione chiaramente riconoscibile.`);
      paras.push("L'integrazione dipende dalla capacità della persona di comprendere, accettare e sostenere la logica del team. Deve confrontarsi con il pattern dominante del team, anche se non corrisponde al proprio modo naturale di lavorare. Quando questo funziona, la persona può portare una preziosa flessibilità. Quando non funziona, c'è il rischio che venga percepita come priva di profilo o difficile da leggere.");
    } else {
      if (matchCase === "TOP1_TOP2") {
        paras.push(`Il team e la persona si affidano entrambi a ${cd(teamPrimary)} come logica principale e a ${cd(teamSecondary)} come approccio complementare. Questa doppia sovrapposizione crea un'elevata compatibilità di base. La persona pensa, decide e comunica secondo gli stessi schemi del team. Questo facilita notevolmente l'inizio e riduce il rischio di incomprensioni nelle prime settimane.`);
        paras.push("Il lato negativo di questa convergenza: entrambe le parti hanno le stesse forze, ma anche gli stessi punti ciechi. La persona non amplia il team, ma rafforza il suo orientamento esistente. Nel lungo periodo questo può portare a un restringimento se non si introduce consapevolmente una voce contraria.");
      } else if (matchCase === "TOP1_ONLY") {
        paras.push(`La logica principale coincide: entrambe le parti si affidano a ${cd(teamPrimary)} come modo di pensare e decidere primario. Questo crea una base stabile, perché persona e team si capiscono nell'approccio fondamentale. Nel quotidiano, tuttavia, l'approccio complementare differisce: il team si affida maggiormente a ${cs(teamSecondary)}, la persona a ${cs(personSecondary)}.`);
        paras.push("Questo crea una base stabile con differenze visibili nei dettagli. La persona non verrà percepita come un corpo estraneo, ma in situazioni di lavoro concrete possono emergere aspettative diverse su ritmo, comunicazione o accuratezza. Queste differenze sono in genere ben gestibili e possono persino funzionare come complemento se nominate e accettate con anticipo.");
      } else if (matchCase === "TOP2_ONLY") {
        paras.push(`La valutazione riflette una configurazione con due forze contrapposte. Da un lato, la logica principale non corrisponde: il team si affida a ${cd(teamPrimary)}, la persona a ${cd(personPrimary)}. Questa differenza abbassa notevolmente il punteggio perché riguarda la direzione fondamentale del pensiero e della decisione.`);
        paras.push(`Dall'altro lato, l'approccio complementare coincide: entrambe le parti utilizzano ${cs(teamSecondary)}. Questo denominatore comune assorbe parte dell'attrito nel quotidiano e spiega perché la collaborazione funziona spesso meglio in pratica di quanto la sola analisi del profilo lasci supporre. Il punteggio riflette correttamente la tensione strutturale, ma tende a sovrastimare la distanza pratica.`);
      } else {
        paras.push(`Il team e la persona differiscono nella logica fondamentale e nell'approccio di lavoro. Il team si affida a ${cd(teamPrimary)} con ${cs(teamSecondary)}, la persona a ${cd(personPrimary)} con ${cs(personSecondary)}. Questa tensione riguarda la comunicazione, le decisioni e il rapporto quotidiano.`);
        paras.push("Questo non deve necessariamente essere un problema: a volte un team ha bisogno esattamente di questa prospettiva diversa. Ma richiede una leadership attiva e chiarezza sul perché questa scelta abbia senso. Senza questo, la frizione domina il quotidiano.");
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

  if (_lang === "fr") {
    const paras: string[] = [];

    if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
      paras.push("Au quotidien, les deux parties passeront vraisemblablement d'une approche de travail à l'autre selon les situations. Il n'existe pas de direction fixe qu'une des deux parties imposerait systématiquement, ni de friction structurelle issue de logiques opposées. Dans les réunions, les prises de décision et la communication quotidienne, peu de schémas figés devraient apparaître.");
      paras.push("La collaboration devient plus difficile lorsque des décisions claires ou une priorisation nette sont requises. Dans ces moments, aucun des deux côtés ne dispose d'une direction dominante pour donner de l'orientation. Il faudra alors soit des responsabilités claires, soit une instance externe pour définir la direction. Dans les conditions normales, la collaboration devrait cependant se dérouler de manière pragmatique et simple.");
      return paras.join("\n\n");
    }

    if (c.teamClass === "BALANCED") {
      paras.push(`Au quotidien, l'équipe est flexible et ouverte à différentes approches de travail. Il n'y a pas d'attente dominante que les nouveaux membres doivent immédiatement satisfaire. La personne, en revanche, apporte une direction claire : ${cd(personPrimary)}. Cela se ressentira dans la vie professionnelle, car la personne agit de manière plus cohérente et ciblée dans son domaine que ce à quoi l'équipe est habituée.`);
      paras.push("Cela peut donner à l'équipe une orientation bienvenue et accélérer les décisions. Mais cela peut aussi conduire à ce que certains membres de l'équipe se sentent sous pression face au style clair de la personne, ou aient l'impression que leur propre façon de travailler n'est plus valorisée. L'enjeu décisif est de savoir si l'équipe perçoit la direction de la personne comme un enrichissement ou comme une domination. Une coordination régulière et la valorisation consciente de la diversité existante de l'équipe sont essentielles ici.");
      return paras.join("\n\n");
    }

    if (c.personClass === "BALANCED") {
      paras.push(`Au quotidien, l'équipe suit une ligne claire : ${cd(teamPrimary)}. Les réunions, la communication et les décisions s'orientent selon ce schéma. La personne, elle, est plus polyvalente et passe situativement d'une approche à l'autre. À un moment elle réagit de manière analytique et structurée, à l'autre de manière spontanée et orientée vers l'action.`);
      paras.push("Cela peut être perçu par l'équipe comme de la flexibilité ou comme de l'indécision. Ce qui compte, c'est la manière dont la personne utilise et communique sa polyvalence. Si elle s'adapte consciemment à la logique de l'équipe et apporte délibérément sa flexibilité comme un complément, elle sera perçue comme un enrichissement précieux. Si elle passe constamment d'une approche à l'autre sans montrer de ligne claire, cela peut créer de la frustration dans l'équipe. Des attentes claires et des retours réguliers aident à stabiliser la collaboration.");
      return paras.join("\n\n");
    }

    if (matchCase === "TOP1_TOP2") {
      paras.push(isLeader
        ? `Au quotidien, la collaboration devrait se dérouler sans friction. Le style de management et la culture d'équipe partagent des priorités similaires : ${cd(teamPrimary)} comme logique fondamentale et ${cs(c.teamSecondary)} comme approche complémentaire. Les décisions sont prises de manière similaire, la communication emprunte des voies familières, et les attentes fondamentales en matière de rythme, de rigueur et de coordination concordent. L'équipe acceptera probablement bien le management car elle reconnaît le style intuitivement.`
        : `Au quotidien, la collaboration devrait se dérouler sans friction. La personne et l'équipe partagent des priorités similaires : ${cd(teamPrimary)} comme logique fondamentale et ${cs(c.teamSecondary)} comme approche complémentaire. Les décisions sont prises de manière similaire, la communication emprunte des voies familières, et les attentes fondamentales en matière de rythme, de rigueur et de coordination concordent. La personne peut contribuer rapidement et de manière productive car aucune adaptation fondamentale n'est nécessaire.`);
      paras.push("L'avantage : peu de temps d'adaptation, une efficacité rapide, un faible risque de conflit. L'inconvénient : la collaboration peut être trop fluide. Des erreurs ou des faiblesses peuvent ne pas être détectées car les deux parties partagent les mêmes angles morts. Des points de réflexion délibérément intégrés et des rétrospectives régulières peuvent aider à protéger l'équipe contre l'uniformité.");
      return paras.join("\n\n");
    }

    if (matchCase === "TOP1_ONLY") {
      paras.push(`Au quotidien, la direction de pensée fondamentale est partagée : les deux parties s'appuient sur ${cd(teamPrimary)}. Cela crée une base commune sur laquelle la collaboration peut se construire. Dans l'exécution concrète, cependant, des différences apparaissent qui deviennent visibles dans les interactions quotidiennes. La personne travaille ${ca(c.personSecondary)}, tandis que l'équipe tend plutôt à procéder ${ca(c.teamSecondary)}. Cela se voit dans les réunions, la répartition des tâches et la façon d'aborder les problèmes.`);
      paras.push("Ces différences peuvent conduire à un complément productif : la personne apporte un regard différent sur l'exécution qui peut enrichir l'équipe. Elles peuvent aussi engendrer des malentendus et des frictions mineures si les attentes différentes ne sont pas nommées ouvertement. En pratique, il est conseillé de convenir de règles de travail concrètes dans les premières semaines et de clarifier explicitement les attentes mutuelles.");
      return paras.join("\n\n");
    }

    if (matchCase === "TOP2_ONLY") {
      paras.push(`Au quotidien, la tension se manifeste surtout dans les situations de décision : l'équipe attend une approche ${ca(teamPrimary)}, la personne tend ${ca(personPrimary)}. Cela peut se traduire concrètement par le fait que la personne prépare les décisions différemment, priorise d'autres informations ou juge un rythme différent comme approprié par rapport aux habitudes de l'équipe.`);
      paras.push(`Dans le travail courant, le niveau partagé de ${cs(c.teamSecondary)} atténue considérablement ces différences. Dans les réunions, la répartition des tâches et la coordination informelle, les deux parties se retrouvent grâce à ${cs(c.teamSecondary)}. Le quotidien fonctionne donc souvent mieux que la simple analyse de profil ne le laisserait supposer. La friction apparaît typiquement lorsqu'il s'agit de décisions de direction et que la logique fondamentale prend le dessus sur le niveau de travail partagé.`);
      return paras.join("\n\n");
    }

    paras.push(`Au quotidien, les différences seront clairement visibles. L'équipe travaille par ${cd(teamPrimary)}, la personne par ${cd(personPrimary)}. Dans les réunions, les décisions et la communication, des attentes différentes se heurtent.`);
    paras.push("Cela se manifeste concrètement dans la façon dont les priorités sont fixées, la rapidité ou la rigueur des décisions et le type de coordination attendu. Sans management actif, la frustration peut s'accumuler rapidement : la personne se sent incomprise, l'équipe la perçoit comme inadaptée. Des discussions régulières de clarification et des responsabilités claires sont absolument nécessaires ici.");
    return paras.join("\n\n");
  }

  if (_lang === "it") {
    const paras: string[] = [];

    if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
      paras.push("Nel quotidiano, entrambe le parti passeranno probabilmente da un approccio di lavoro all'altro a seconda della situazione. Non esiste una direzione fissa che uno dei due lati imponga sistematicamente, né una frizione strutturale derivante da logiche opposte. In riunioni, decisioni e comunicazione quotidiana difficilmente emergeranno schemi rigidi.");
      paras.push("La collaborazione diventa più impegnativa quando sono richieste decisioni chiare o priorità nette. In quei momenti, nessuno dei due lati dispone di una direzione dominante che faccia da orientamento. Sarà necessaria una coordinazione esterna o una definizione esplicita dei ruoli. Nelle condizioni normali, tuttavia, la collaborazione dovrebbe procedere in modo pragmatico e diretto.");
      return paras.join("\n\n");
    }

    if (c.teamClass === "BALANCED") {
      paras.push(`Nel quotidiano il team è flessibile e aperto a diversi approcci di lavoro. Non esiste un'aspettativa dominante che i nuovi membri debbano soddisfare immediatamente. La persona, al contrario, porta una direzione chiara: ${cd(personPrimary)}. Questo sarà percepibile nella vita lavorativa, perché la persona agisce in modo più coerente e mirato nel proprio ambito rispetto a quanto il team è abituato.`);
      paras.push("Questo può dare al team un orientamento benvenuto e accelerare le decisioni. Può anche portare alcuni membri del team a sentirsi sotto pressione per lo stile netto della persona, o ad avere l'impressione che il proprio modo di lavorare non sia più valorizzato. Il fattore decisivo è se il team percepisce la direzione della persona come arricchimento o come dominio. Una coordinazione regolare e il riconoscimento consapevole della diversità esistente nel team sono fondamentali.");
      return paras.join("\n\n");
    }

    if (c.personClass === "BALANCED") {
      paras.push(`Nel quotidiano il team segue una linea chiara: ${cd(teamPrimary)}. Riunioni, comunicazione e decisioni si orientano secondo questo schema. La persona, al contrario, è più ampiamente posizionata e passa situativamente da un approccio all'altro. In un momento reagisce in modo analitico e strutturato, nel successivo spontaneamente e orientato all'azione.`);
      paras.push("Questo può essere percepito dal team come flessibilità o come indecisione. Ciò che conta è come la persona utilizza e comunica la propria versatilità. Quando si adatta consapevolmente alla logica del team e porta la propria flessibilità come complemento deliberato, verrà percepita come un prezioso arricchimento. Quando invece passa costantemente da un approccio all'altro senza mostrare una linea chiara, può creare frustrazione nel team. Aspettative chiare e feedback regolari aiutano a stabilizzare la collaborazione.");
      return paras.join("\n\n");
    }

    if (matchCase === "TOP1_TOP2") {
      paras.push(isLeader
        ? `Nel quotidiano la collaborazione dovrebbe procedere senza attriti. Lo stile di leadership e la cultura del team condividono priorità simili: ${cd(teamPrimary)} come logica fondamentale e ${cs(c.teamSecondary)} come approccio complementare. Le decisioni vengono prese in modo simile, la comunicazione scorre su canali familiari e le aspettative fondamentali su ritmo, accuratezza e coordinazione coincidono. Il team accetterà probabilmente bene la leadership, perché lo stile è naturalmente riconoscibile.`
        : `Nel quotidiano la collaborazione dovrebbe procedere senza attriti. Persona e team condividono priorità simili: ${cd(teamPrimary)} come logica fondamentale e ${cs(c.teamSecondary)} come approccio complementare. Le decisioni vengono prese in modo simile, la comunicazione scorre su canali familiari e le aspettative fondamentali su ritmo, accuratezza e coordinazione coincidono. La persona può contribuire in modo produttivo fin dall'inizio perché non sono necessari adattamenti fondamentali.`);
      paras.push("Il vantaggio: poco tempo di adattamento, efficacia rapida, basso rischio di conflitti. Lo svantaggio: la collaborazione può scorrere troppo fluidamente. Errori o debolezze possono non essere rilevati perché entrambe le parti condividono gli stessi punti ciechi. Momenti di riflessione deliberatamente integrati e retrospettive regolari possono aiutare a proteggere il team dall'unilateralità.");
      return paras.join("\n\n");
    }

    if (matchCase === "TOP1_ONLY") {
      paras.push(`Nel quotidiano la direzione di pensiero fondamentale è condivisa: entrambe le parti si affidano a ${cd(teamPrimary)}. Questo crea un terreno comune su cui costruire la collaborazione. Nell'esecuzione concreta, tuttavia, emergono differenze che diventano visibili nelle interazioni quotidiane. La persona lavora ${ca(c.personSecondary)}, mentre il team tende a procedere ${ca(c.teamSecondary)}. Questo si manifesta nelle riunioni, nella distribuzione dei compiti e nel modo di affrontare i problemi.`);
      paras.push("Queste differenze possono portare a un complemento produttivo: la persona porta una prospettiva diversa nell'esecuzione che può arricchire il team. Possono anche causare incomprensioni e piccole frizioni se le diverse aspettative non vengono nominate apertamente. In pratica vale la pena concordare norme di lavoro concrete nelle prime settimane e chiarire esplicitamente le aspettative reciproche.");
      return paras.join("\n\n");
    }

    if (matchCase === "TOP2_ONLY") {
      paras.push(`Nel quotidiano la tensione si manifesta soprattutto nelle situazioni decisionali: il team si aspetta un approccio ${ca(teamPrimary)}, la persona tende ${ca(personPrimary)}. Questo può tradursi concretamente nel fatto che la persona prepara le decisioni in modo diverso, dà priorità ad altre informazioni o ritiene appropriato un ritmo diverso rispetto a quanto il team è abituato.`);
      paras.push(`Nel lavoro corrente, il livello condiviso di ${cs(c.teamSecondary)} attenua considerevolmente queste differenze. In riunioni, distribuzione dei compiti e coordinazione informale, entrambe le parti si ritrovano attraverso ${cs(c.teamSecondary)}. Il quotidiano funziona quindi spesso meglio della sola analisi del profilo lascerebbe supporre. La frizione emerge tipicamente quando si tratta di decisioni di direzione e la logica fondamentale prende il sopravvento sul livello di lavoro condiviso.`);
      return paras.join("\n\n");
    }

    paras.push(`Nel quotidiano le differenze saranno chiaramente visibili. Il team lavora attraverso ${cd(teamPrimary)}, la persona attraverso ${cd(personPrimary)}. In riunioni, decisioni e comunicazione si scontrano aspettative diverse.`);
    paras.push("Questo si manifesta concretamente nel modo in cui vengono fissate le priorità, nella rapidità o nell'accuratezza con cui si prendono le decisioni e nel tipo di coordinazione attesa. Senza una leadership attiva, la frustrazione può accumularsi rapidamente: la persona si sente incompresa, il team la percepisce come inadatta. Conversazioni di chiarimento regolari e responsabilità chiare sono assolutamente necessarie.");
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

  if (_lang === "fr") {
    if (c.matchCase === "TOP1_TOP2") {
      chancen.push({ title: "Intégration rapide", text: "La personne peut s'intégrer rapidement car sa logique de travail correspond à celle de l'équipe. La période d'adaptation devrait être courte et la personne pourra contribuer rapidement et de manière productive aux résultats de l'équipe. Cela économise du temps de management et réduit le risque d'un démarrage difficile." });
      chancen.push({ title: "Forte acceptation", text: "L'équipe accueillera probablement bien la personne car la culture de travail et la communication sont similaires. La personne parle le même langage que l'équipe et prend des décisions de manière analogue. Cela crée rapidement de la confiance, qui est le fondement d'une collaboration productive." });
      chancen.push({ title: "Collaboration stable", text: "Peu de friction se crée au quotidien. L'énergie de l'équipe et de la personne peut être investie dans la tâche réelle plutôt que dans des conflits d'intégration et des processus d'adaptation. Sous pression, la collaboration restera probablement stable car les deux parties réagissent de manière similaire." });
      risiken.push({ title: "Absence de complément", text: "La forte similarité manque d'une impulsion complémentaire. Les angles morts ne sont pas mis au jour mais peuvent être renforcés. À long terme, l'équipe peut s'ancrer dans son orientation et manquer des développements importants." });
      risiken.push({ title: "Tendance à la confirmation", text: "La personne renforce les schémas existants au lieu de les remettre en question. Lorsque tout le monde pense de manière similaire, les faiblesses deviennent invisibles et les erreurs se répètent." });
    } else if (c.matchCase === "TOP1_ONLY") {
      chancen.push({ title: "Direction fondamentale commune", text: `Les deux parties s'appuient sur ${cd(c.teamPrimary)} comme logique de travail principale. Cela crée une base stable pour la collaboration et réduit le risque de malentendus fondamentaux. La personne est comprise dans sa façon de penser et peut évoluer en terrain familier.` });
      chancen.push({ title: `Complément par ${cs(c.personSecondary)}`, text: `La personne apporte ${cs(c.personSecondary)} comme approche complémentaire au quotidien, tandis que l'équipe s'appuie davantage sur ${cs(c.teamSecondary)}. Concrètement, cela signifie : ${c.personSecondary === "impulsiv" ? "des décisions plus rapides, plus de dynamisme d'exécution et une approche plus pragmatique des sujets" : c.personSecondary === "analytisch" ? "plus de pensée structurée, une préparation plus systématique et une analyse plus approfondie avant les décisions" : "une plus forte implication de toutes les parties, plus de coordination et un style de travail orienté vers les relations"}. Cela peut renforcer l'équipe dans ce domaine sans compromettre la logique fondamentale commune.` });
      chancen.push({ title: "Opportunité d'apprentissage mutuel", text: `Les différences dans l'approche concrète de travail offrent une opportunité d'apprentissage. L'équipe peut apprendre de la personne ${c.personSecondary === "impulsiv" ? "plus de rythme et de capacité de décision" : c.personSecondary === "analytisch" ? "plus de profondeur et de structure" : "plus d'ouverture et d'échange"}, et la personne peut apprendre de l'équipe ${c.teamSecondary === "impulsiv" ? "la rapidité et le pragmatisme" : c.teamSecondary === "analytisch" ? "la rigueur et la précision" : "la coordination et l'orientation collective"}. Cet enrichissement mutuel peut augmenter la polyvalence de l'équipe à long terme.` });
      risiken.push({ title: "Approche et méthode différentes", text: `Dans l'exécution concrète, l'équipe et la personne diffèrent notablement. L'équipe attend ${c.teamSecondary === "analytisch" ? "plus de rigueur et de vérification approfondie" : c.teamSecondary === "impulsiv" ? "une action rapide et une orientation résultats" : "de la coordination et une prise de décision collective"}, tandis que la personne tend ${c.personSecondary === "impulsiv" ? "vers une action plus rapide et peut être perçue comme trop prompte" : c.personSecondary === "analytisch" ? "vers plus de détails et peut être perçue comme trop lente" : "vers la discussion et l'inclusion et peut être perçue comme trop hésitante"}. Inversement, la personne peut trouver l'équipe ${c.teamSecondary === "analytisch" ? "trop lente et trop prudente" : c.teamSecondary === "impulsiv" ? "trop réactive et trop superficielle" : "trop axée sur le consensus et peu encline à décider"}.` });
      risiken.push({ title: "Besoin d'alignement", text: "La personne comprend fondamentalement la logique de l'équipe et ne se sent pas comme un corps étranger. Elle a néanmoins besoin de repères dans l'exécution concrète et d'indications claires sur la façon dont l'équipe gère certaines choses. Sans ces repères, des contributions bien intentionnées peuvent involontairement créer des frictions." });
    } else if (c.matchCase === "TOP2_ONLY") {
      chancen.push({ title: "Perspective différente", text: `La personne apporte ${cd(c.personPrimary)} dans une équipe qui en est peu dotée. Elle peut prendre en charge des tâches pour lesquelles l'équipe a des lacunes et soulever des sujets que personne d'autre ne suit.` });
      chancen.push({ title: "Niveau de travail commun", text: `Dans le travail courant, il existe un chevauchement important via ${cs(c.teamSecondary)}. Cela donne à la personne et à l'équipe un point de connexion, même quand la logique fondamentale diffère sensiblement.` });
      chancen.push({ title: "Plus large spectre de compétences", text: `L'équipe devient plus polyvalente grâce à cette personne, sans être bouleversée. ${cd(c.personPrimary)} était sous-représentée. Bien exploitée, l'équipe pourra traiter plus efficacement un éventail plus large de problèmes.` });
      risiken.push({ title: "Friction fondamentale", text: `Les logiques de pensée diffèrent clairement. L'équipe opère par ${cs(c.teamPrimary)}, la personne travaille principalement par ${cs(c.personPrimary)}. Cette différence se ressent dans les décisions, la priorisation et la communication. Sans cadrage clair, elle peut mener à des conflits récurrents.` });
      risiken.push({ title: "Effort de management", text: `Le management doit clarifier activement quand ${cs(c.teamPrimary)} a la priorité et quand ${cs(c.personPrimary)} est sollicité. Sans ce cadrage, chaque partie percevra le comportement de l'autre comme erroné.` });
      risiken.push({ title: "Mauvaise interprétation", text: "L'équipe peut percevoir le comportement de la personne comme inadapté, alors qu'il est structurellement fondé. Sans cadrage du management, des préjugés se forment qui rendent l'intégration plus difficile sur la durée." });
    } else {
      chancen.push({ title: "Nouvelle perspective", text: `La personne pense et travaille différemment de l'équipe. Bien exploitée, elle peut soulever des sujets que personne d'autre ne suit et prendre en charge des tâches pour lesquelles l'équipe a des lacunes. ${cd(c.personPrimary)} est peu représentée dans l'équipe, ce qui peut être un vrai atout.` });
      chancen.push({ title: "Rendre les faiblesses visibles", text: "Ce que l'équipe néglige systématiquement est souvent la première chose que la personne remarque, car elle ne pense pas selon les mêmes schémas. Cela peut être inconfortable, mais cela aide à identifier les problèmes plus tôt." });
      chancen.push({ title: "Apprentissage mutuel", text: "Quand la collaboration fonctionne bien, les deux parties apprennent l'une de l'autre. L'équipe acquiert un regard différent sur des choses qu'elle considérait comme acquises. La personne apprend comment l'équipe pense et décide. Les deux parties s'améliorent à long terme." });
      risiken.push({ title: "Forte friction", text: "L'équipe et la personne travaillent de manière fondamentalement différente. Cela crée des tensions dans la communication, les décisions et la priorisation. Sans gestion active, des conflits récurrents peuvent se développer et devenir difficiles à rompre." });
      risiken.push({ title: "Effort de management élevé", text: "Le management doit investir beaucoup plus de temps pour modérer entre la personne et l'équipe que dans le cas d'une meilleure correspondance. Cet effort ne doit pas être sous-estimé." });
      risiken.push({ title: "Risque d'isolement", text: "La personne peut se sentir isolée si la culture d'équipe ne soutient pas sa façon de travailler. Si la motivation baisse durablement, le retrait intérieur ou un départ prématuré deviennent des risques réels." });
    }

    if (c.teamClass === "BALANCED") {
      chancen.push({ title: "Système ouvert", text: "L'équipe équilibrée n'a pas d'attentes rigides et peut accueillir différents styles de travail. Cela abaisse le seuil d'entrée pour la personne et permet une intégration plus flexible." });
      risiken.push({ title: "Déplacement de direction", text: "Une personne avec une dominante claire peut déplacer l'équilibre existant de l'équipe dans une seule direction. Sans gestion délibérée, l'équipe peut perdre sa polyvalence et s'aligner progressivement sur la logique de la nouvelle personne." });
    }

    if (c.personClass === "BALANCED") {
      chancen.push({ title: "Flexibilité", text: "La personne peut s'adapter à différentes dynamiques d'équipe et passer situativement d'une approche de travail à l'autre. Cela apporte de la flexibilité à l'équipe et permet à la personne d'être efficace dans des contextes variés." });
      risiken.push({ title: "Profil peu lisible", text: "La personne risque d'être perçue comme difficile à cerner ou indécise. L'équipe manque d'une image claire de ce pour quoi la personne se positionne et de la contribution spécifique qu'elle apporte. Cela peut créer de l'incertitude et réduire la confiance." });
    }

    let einordnung: string;
    if (c.score >= 85) {
      einordnung = "Les opportunités l'emportent nettement. La forte concordance facilite l'intégration et la collaboration quotidienne. Le risque principal est l'absence de complément, l'équipe pouvant devenir plus unidimensionnelle par renforcement.";
    } else if (c.score >= 60) {
      einordnung = "Opportunités et risques sont en équilibre. Cette composition peut bien fonctionner, mais elle nécessite des attentes claires et une coordination régulière. L'enjeu décisif est de savoir si les différences deviennent un complément productif ou une source de friction persistante.";
    } else {
      einordnung = "Les risques l'emportent. Cette composition peut néanmoins être la bonne, mais seulement si ce style de travail différent est réellement nécessaire dans l'équipe et si le management le communique activement.";
    }

    return { chancen, risiken, chancenRisikenEinordnung: einordnung };
  }

  if (_lang === "it") {
    if (c.matchCase === "TOP1_TOP2") {
      chancen.push({ title: "Integrazione rapida", text: "La persona può integrarsi rapidamente perché la propria logica di lavoro corrisponde a quella del team. Il periodo di adattamento dovrebbe essere breve e la persona potrà contribuire in modo produttivo ai risultati del team fin dall'inizio. Questo risparmia tempo di gestione e riduce il rischio di un inizio difficile." });
      chancen.push({ title: "Alta accettazione", text: "Il team accoglierà probabilmente bene la persona, perché la cultura del lavoro e la comunicazione sono simili. La persona parla lo stesso linguaggio del team e prende decisioni in modo analogo. Questo crea fiducia rapidamente, che è la base per una collaborazione produttiva." });
      chancen.push({ title: "Collaborazione stabile", text: "Nel quotidiano si crea poca frizione. L'energia del team e della persona può essere investita nel compito reale anziché in conflitti di integrazione. Sotto pressione, la collaborazione rimarrà probabilmente stabile perché entrambe le parti reagiscono in modo simile." });
      risiken.push({ title: "Mancanza di complemento", text: "L'elevata similarità manca di un impulso complementare. I punti ciechi non vengono scoperti ma possono essere rafforzati. Nel lungo periodo il team può cristallizzarsi nel proprio orientamento e perdere sviluppi importanti." });
      risiken.push({ title: "Tendenza alla conferma", text: "La persona rafforza i pattern esistenti invece di metterli in discussione. Quando tutti pensano in modo simile, le debolezze diventano invisibili e gli errori si ripetono." });
    } else if (c.matchCase === "TOP1_ONLY") {
      chancen.push({ title: "Direzione fondamentale condivisa", text: `Entrambe le parti si affidano a ${cd(c.teamPrimary)} come logica di lavoro principale. Questo crea una base stabile per la collaborazione e riduce il rischio di incomprensioni fondamentali. La persona è compresa nel proprio modo di pensare e può muoversi su terreno familiare.` });
      chancen.push({ title: `Complemento attraverso ${cs(c.personSecondary)}`, text: `La persona porta ${cs(c.personSecondary)} come approccio complementare, mentre il team si affida maggiormente a ${cs(c.teamSecondary)}. In concreto questo significa: ${c.personSecondary === "impulsiv" ? "decisioni più rapide, maggiore dinamismo esecutivo e un approccio più pragmatico ai temi" : c.personSecondary === "analytisch" ? "maggiore pensiero strutturato, preparazione più sistematica e analisi più attenta prima delle decisioni" : "maggiore coinvolgimento di tutti i soggetti, più coordinazione e uno stile di lavoro orientato alle relazioni"}. Questo può rafforzare il team in quest'area senza compromettere la logica fondamentale condivisa.` });
      chancen.push({ title: "Opportunità di apprendimento reciproco", text: `Le differenze nell'approccio concreto di lavoro offrono un'opportunità di apprendimento. Il team può imparare dalla persona ${c.personSecondary === "impulsiv" ? "maggiore ritmo e capacità decisionale" : c.personSecondary === "analytisch" ? "maggiore profondità e struttura" : "maggiore apertura e scambio"}, e la persona può imparare dal team ${c.teamSecondary === "impulsiv" ? "velocità e pragmatismo" : c.teamSecondary === "analytisch" ? "accuratezza e precisione" : "coordinazione e orientamento collettivo"}. Questo arricchimento reciproco può aumentare la versatilità del team nel lungo periodo.` });
      risiken.push({ title: "Approccio e metodo diversi", text: `Nell'esecuzione concreta, team e persona differiscono in modo evidente. Il team si aspetta ${c.teamSecondary === "analytisch" ? "maggiore accuratezza e verifica approfondita" : c.teamSecondary === "impulsiv" ? "azione rapida e orientamento ai risultati" : "coordinazione e decisione condivisa"}, mentre la persona tende ${c.personSecondary === "impulsiv" ? "verso un'azione più rapida e può essere percepita come precipitosa" : c.personSecondary === "analytisch" ? "verso maggiore dettaglio e può essere percepita come troppo lenta" : "verso la discussione e il coinvolgimento e può essere percepita come troppo esitante"}. A sua volta, la persona può percepire il team come ${c.teamSecondary === "analytisch" ? "troppo lento e troppo cauto" : c.teamSecondary === "impulsiv" ? "troppo reattivo e troppo superficiale" : "troppo orientato al consenso e poco propenso a decidere"}.` });
      risiken.push({ title: "Necessità di allineamento", text: "La persona comprende fondamentalmente la logica del team e non si sente un corpo estraneo. Ha tuttavia bisogno di orientamento nell'esecuzione concreta e di indicazioni chiare su come il team gestisce certe cose. Senza questo orientamento, contributi ben intenzionati possono creare attriti involontariamente." });
    } else if (c.matchCase === "TOP2_ONLY") {
      chancen.push({ title: "Prospettiva diversa", text: `La persona porta ${cd(c.personPrimary)} in un team che ne ha poca. Può occuparsi di compiti in cui il team ha lacune e sollevare temi che nessun altro ha nell'agenda.` });
      chancen.push({ title: "Livello di lavoro condiviso", text: `Nel lavoro corrente esiste una sovrapposizione importante attraverso ${cs(c.teamSecondary)}. Questo offre a persona e team un punto di connessione, anche quando la logica fondamentale differisce notevolmente.` });
      chancen.push({ title: "Spettro di competenze più ampio", text: `Il team diventa più versatile grazie a questa persona, senza essere stravolto. ${cd(c.personPrimary)} era scarsamente rappresentata. Se sfruttata bene, il team potrà affrontare efficacemente una gamma più ampia di problemi.` });
      risiken.push({ title: "Frizione fondamentale", text: `Le logiche di pensiero differiscono chiaramente. Il team opera attraverso ${cs(c.teamPrimary)}, la persona lavora principalmente attraverso ${cs(c.personPrimary)}. Questa differenza si percepisce nelle decisioni, nella prioritizzazione e nella comunicazione. Senza un inquadramento chiaro, può portare a conflitti ricorrenti.` });
      risiken.push({ title: "Sforzo di gestione", text: `La leadership deve chiarire attivamente quando ${cs(c.teamPrimary)} ha la priorità e quando è richiesta ${cs(c.personPrimary)}. Senza questo inquadramento, ciascuna parte percepirà il comportamento dell'altra come sbagliato.` });
      risiken.push({ title: "Interpretazione errata", text: "Il team può percepire il comportamento della persona come inadeguato, anche se è strutturalmente motivato. Senza un inquadramento da parte della leadership, si formano pregiudizi che rendono l'integrazione più difficile nel tempo." });
    } else {
      chancen.push({ title: "Nuova prospettiva", text: `La persona pensa e lavora in modo diverso dal team. Se sfruttata bene, può sollevare temi che nessun altro ha nell'agenda e occuparsi di compiti in cui il team ha lacune. ${cd(c.personPrimary)} è scarsamente rappresentata nel team: questo può essere un vero vantaggio.` });
      chancen.push({ title: "Rendere visibili le debolezze", text: "Ciò che il team trascura sistematicamente è spesso la prima cosa che la persona nota, perché non pensa secondo gli stessi schemi. Questo può essere scomodo, ma aiuta a identificare i problemi prima." });
      chancen.push({ title: "Apprendimento reciproco", text: "Quando la collaborazione funziona bene, entrambe le parti imparano l'una dall'altra. Il team acquisisce una prospettiva diversa su cose che dava per scontate. La persona impara come il team pensa e decide. Entrambe migliorano nel lungo periodo." });
      risiken.push({ title: "Frizione significativa", text: "Il team e la persona lavorano in modo fondamentalmente diverso. Questo crea tensione nella comunicazione, nelle decisioni e nella prioritizzazione. Senza una gestione attiva, possono svilupparsi conflitti ricorrenti difficili da sciogliere." });
      risiken.push({ title: "Elevato sforzo di gestione", text: "La leadership deve investire significativamente più tempo nella mediazione tra persona e team rispetto a una situazione di maggiore compatibilità. Questo sforzo non deve essere sottovalutato." });
      risiken.push({ title: "Rischio di isolamento", text: "La persona può sentirsi isolata se la cultura del team non supporta il suo modo di lavorare. Se la motivazione cala nel tempo, il disimpegno o una partenza precoce diventano rischi reali." });
    }

    if (c.teamClass === "BALANCED") {
      chancen.push({ title: "Sistema aperto", text: "Il team equilibrato non ha aspettative rigide e può accogliere diversi stili di lavoro. Questo abbassa la soglia di ingresso per la persona e consente un'integrazione più flessibile." });
      risiken.push({ title: "Spostamento di direzione", text: "Una persona con una dominante chiara può spostare l'equilibrio esistente del team in un'unica direzione. Senza una gestione deliberata, il team può perdere la propria versatilità e allinearsi progressivamente alla logica della nuova persona." });
    }

    if (c.personClass === "BALANCED") {
      chancen.push({ title: "Flessibilità", text: "La persona può adattarsi a diverse dinamiche di team e passare situativamente da un approccio di lavoro all'altro. Questo porta flessibilità al team e consente alla persona di essere efficace in contesti diversi." });
      risiken.push({ title: "Profilo poco leggibile", text: "La persona rischia di essere percepita come difficile da inquadrare o indecisa. Il team non ha un'immagine chiara di cosa rappresenta la persona e quale contributo specifico porta. Questo può creare incertezza e ridurre la fiducia." });
    }

    let einordnung: string;
    if (c.score >= 85) {
      einordnung = "Le opportunità prevalgono nettamente. La forte convergenza facilita l'integrazione e la collaborazione quotidiana. Il rischio principale è l'assenza di complemento: il team può diventare più unilaterale per effetto del rinforzo.";
    } else if (c.score >= 60) {
      einordnung = "Opportunità e rischi sono in equilibrio. Questa composizione può funzionare bene, ma richiede aspettative chiare e allineamento regolare. Il fattore decisivo è se le differenze diventano un complemento produttivo o una fonte di frizione persistente.";
    } else {
      einordnung = "I rischi prevalgono. Questa composizione può comunque essere quella giusta, ma solo se questo stile di lavoro diverso è genuinamente necessario nel team e la leadership lo comunica attivamente.";
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

  if (_lang === "fr") {
    const paras: string[] = [];
    if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
      paras.push("Sous pression, ni l'équipe ni la personne ne montrent de déplacement clairement prévisible vers un schéma particulier. Les deux parties réagissent de manière situationnelle et peuvent passer d'une stratégie à l'autre. Cela peut être un avantage quand aucune réaction rigide ne domine, mais aussi un inconvénient quand la réponse devient imprévisible et diffuse.");
      paras.push("Dans les phases de pression, une direction claire que tout le monde peut suivre fait défaut. Le risque réside dans l'indécision, des actions parallèles sans coordination et un ralentissement général des processus de décision. Il est donc important que des responsabilités claires, des voies de décision définies et une priorisation explicite soient établies avant que la pression ne monte.");
    } else if (c.matchCase === "TOP1_TOP2") {
      paras.push(`Sous pression, les deux parties intensifient la logique principale commune : ${cd(c.teamPrimary)}. L'équipe et la personne convergent dans la même direction dans les situations de stress. La cohérence augmente car tout le monde poursuit la même stratégie. Dans les crises aiguës, cela peut être un avantage car la réponse est rapide et coordonnée.`);
      paras.push(`L'inconvénient : sous pression, les angles morts deviennent particulièrement visibles. Quand tout le monde réagit ${ca(c.teamPrimary)}, d'autres aspects importants passent au second plan. ${cd(c.personSecondary)} peut être trop négligé, ce qui conduit à des décisions unilatérales aux conséquences à long terme. Un rééquilibrage délibéré et une question explicite sur la perspective négligée peuvent aider.`);
    } else if (c.matchCase === "TOP1_ONLY") {
      paras.push(`Sous pression, les deux parties renforcent la logique principale commune : ${cd(c.teamPrimary)}. Sur le plan stratégique, l'équipe et la personne se rapprocheront. Les différences dans l'approche concrète de travail peuvent cependant s'accentuer. La personne réagit ${ca(c.personSecondary)}, tandis que l'équipe attend davantage de ${cs(c.teamSecondary)}.`);
      paras.push("Cela signifie : la direction stratégique est partagée, mais l'exécution peut créer des tensions. La personne veut procéder différemment des habitudes de l'équipe, même si les deux poursuivent le même objectif. Une communication claire sous pression est décisive pour maintenir cette tension productive. Des règles préalablement convenues pour la gestion des situations de stress permettent d'éviter les conflits.");
    } else if (c.matchCase === "TOP2_ONLY") {
      paras.push(`Sous pression, les deux parties intensifient leur logique principale respective. L'équipe réagit ${ca(c.teamPrimary)} et se replie sur ${cd(c.teamPrimary)}. La personne intensifie ${cd(c.personPrimary)} et réagit ${ca(c.personPrimary)}. En temps normal, le niveau secondaire commun (${cs(c.teamSecondary)}) maintient le contact entre les deux parties. Sous pression croissante, ce pont est mis à rude épreuve.`);
      paras.push(`Sous pression modérée, ${cs(c.teamSecondary)} peut encore fonctionner comme niveau de médiation : les deux parties retrouvent l'échange grâce à lui. Sous forte pression ou pression prolongée, ce pont cède. La logique principale de chaque partie domine alors, et la collaboration se polarise. Dans ces phases, les voies de décision et les responsabilités doivent être prédéfinies pour éviter la rupture de contact.`);
    } else {
      paras.push(`Sous pression, les différences deviennent plus marquées. L'équipe réagit ${ca(c.teamPrimary)}, la personne ${ca(c.personPrimary)}. Les deux parties se replient sur leur propre logique et s'éloignent l'une de l'autre au lieu de se rapprocher.`);
      paras.push("Dans ces phases, le risque de conflit augmente. Les malentendus s'accumulent, la tolérance diminue. Des voies d'escalade claires et un management qui modère activement sous pression sont indispensables ici.");
    }
    return paras.join("\n\n");
  }

  if (_lang === "it") {
    const paras: string[] = [];

    if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
      paras.push("Sotto pressione, né il team né la persona mostrano uno spostamento chiaramente prevedibile verso un pattern particolare. Entrambe le parti reagiscono situazionalmente e possono passare tra diverse strategie. Questo può essere un vantaggio quando nessuna reazione rigida domina, ma anche uno svantaggio quando la risposta diventa imprevedibile e diffusa.");
      paras.push("Nelle fasi di pressione manca una direzione chiara a cui tutti possano orientarsi. Il rischio consiste nell'indecisione, in azioni parallele senza coordinazione e in un rallentamento generale dei processi decisionali. E' quindi importante che in queste fasi siano stabiliti responsabilità chiare, percorsi decisionali definiti e una prioritizzazione esplicita prima che la pressione si manifesti.");
    } else if (c.matchCase === "TOP1_TOP2") {
      paras.push(`Sotto pressione, entrambe le parti intensificano la logica principale condivisa: ${cd(c.teamPrimary)}. Il team e la persona convergono nella stessa direzione nelle situazioni di stress. La coerenza aumenta perché tutti perseguono la stessa strategia. Nelle crisi acute questo può essere un vantaggio perché la risposta è rapida e coordinata.`);
      paras.push(`Il lato negativo: sotto pressione i punti ciechi diventano particolarmente visibili. Quando tutti reagiscono ${ca(c.teamPrimary)}, altri aspetti importanti passano in secondo piano. ${cd(c.personSecondary)} può essere trascurata eccessivamente, portando a decisioni unilaterali con conseguenze a lungo termine. Un riequilibrio deliberato e una domanda esplicita sulla prospettiva trascurata possono aiutare.`);
    } else if (c.matchCase === "TOP1_ONLY") {
      paras.push(`Sotto pressione, entrambe le parti rafforzano la logica principale condivisa: ${cd(c.teamPrimary)}. A livello strategico, team e persona si avvicineranno. Le differenze nell'approccio concreto di lavoro possono tuttavia accentuarsi. La persona reagisce ${ca(c.personSecondary)}, mentre il team si aspetta maggiormente ${cs(c.teamSecondary)}.`);
      paras.push("Questo significa: la direzione strategica è condivisa, ma nell'esecuzione possono emergere tensioni. La persona vuole procedere in modo diverso rispetto alle abitudini del team, anche se entrambe perseguono lo stesso obiettivo. Una comunicazione chiara sotto pressione è decisiva per mantenere questa tensione produttiva. Regole concordate in anticipo per la gestione delle situazioni di stress aiutano a evitare conflitti.");
    } else if (c.matchCase === "TOP2_ONLY") {
      paras.push(`Sotto pressione, entrambe le parti intensificano la rispettiva logica principale. Il team reagisce ${ca(c.teamPrimary)} e si ritira su ${cd(c.teamPrimary)}. La persona intensifica ${cd(c.personPrimary)} e reagisce ${ca(c.personPrimary)}. In condizioni normali, il livello secondario condiviso (${cs(c.teamSecondary)}) mantiene il contatto tra le due parti. Con la pressione crescente, questo ponte viene messo alla prova.`);
      paras.push(`Con pressione moderata, ${cs(c.teamSecondary)} può ancora funzionare come livello di mediazione: entrambe le parti ritrovano lo scambio attraverso di esso. Con pressione forte o prolungata, questo ponte cede. Allora la logica principale di ciascuna parte domina e la collaborazione si polarizza. In queste fasi i percorsi decisionali e le responsabilità devono essere predefiniti per evitare la rottura del contatto.`);
    } else {
      paras.push(`Sotto pressione le differenze diventano più marcate. Il team reagisce ${ca(c.teamPrimary)}, la persona ${ca(c.personPrimary)}. Entrambe le parti si ritirano sulla propria logica e si allontanano invece di avvicinarsi.`);
      paras.push("In queste fasi il rischio di conflitti aumenta. I malintesi si accumulano, la tolleranza diminuisce. Percorsi di escalation chiari e una leadership che modera attivamente sotto pressione sono indispensabili.");
    }
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

  if (_lang === "fr") {
    if (c.matchCase === "TOP1_TOP2") {
      hints.push({ title: "Établir la confiance et ancrer le rôle", text: "Le manager sera probablement accepté rapidement car il partage naturellement la logique de l'équipe. Utilisez ce bon départ pour fixer des attentes claires et ancrer le rôle dans les premières semaines. Définissez ensemble avec le manager les objectifs clés pour les 90 premiers jours et clarifiez les marges de décision existantes. Cette acceptation rapide est un avantage à utiliser délibérément." });
      hints.push({ title: "Solliciter activement le complément", text: "Lorsque le manager et l'équipe s'alignent étroitement, les angles morts ont tendance à être renforcés plutôt que mis au jour. Demandez activement au manager d'introduire aussi des perspectives inhabituelles et de challenger constructivement l'équipe. Un manager qui ne fait que confirmer ce que l'équipe pense déjà n'exploite pas tout son potentiel. Des moments de réflexion réguliers sur ce qui pourrait être négligé sont utiles ici." });
      hints.push({ title: "Observer le développement", text: "Après les trois premiers mois, observez si le manager imprime sa propre direction ou s'adapte trop fortement à la culture d'équipe existante. Un bon manager doit aussi prendre des décisions inconfortables et ne peut pas se contenter de confirmer le statu quo." });
    } else if (c.matchCase === "TOP1_ONLY") {
      hints.push({ title: "Utiliser la logique fondamentale commune comme base de confiance", text: `Le manager partage la logique principale de l'équipe (${cd(c.teamPrimary)}). Utilisez cet avantage délibérément pour établir la confiance dans les premières semaines. En même temps, soyez transparent dès le début sur les points où le style de management diffère dans les détails, notamment en matière de ${cs(c.personSecondary)} par rapport à l'attente de l'équipe en termes de ${cs(c.teamSecondary)}. Plus cette clarification est concrète, moins il y aura de frictions au quotidien.` });
      hints.push({ title: "Mettre en place des boucles de rétroaction", text: "Organisez des entretiens de rétroaction structurés entre le manager et l'équipe dans les 90 premiers jours. Ces échanges doivent aborder à la fois la collaboration sur les tâches et la dynamique interpersonnelle. Questions types : qu'est-ce qui fonctionne bien ? Où y a-t-il des frictions ? Que l'équipe attend-elle du manager ? Que le manager attend-il de l'équipe ? Cette communication précoce évite que les malentendus se figent." });
      hints.push({ title: "Rendre visible l'apport complémentaire", text: `Le manager apporte ${cs(c.personSecondary)} comme une nuance différente au quotidien. Montrez à l'équipe où ce complément est utile et présentez les différences comme un enrichissement, non comme une faiblesse.` });
    } else if (c.matchCase === "TOP2_ONLY") {
      hints.push({ title: "Cadrer activement le style de management", text: `Le manager pense et décide par ${cd(c.personPrimary)}, tandis que l'équipe attend ${cd(c.teamPrimary)}. Expliquez concrètement à l'équipe pourquoi une logique de pensée différente dans ce rôle de management est intentionnelle. Sans ce cadrage, l'équipe interprétera le style de management comme une erreur de placement plutôt qu'un choix délibéré.` });
      hints.push({ title: "Utiliser délibérément le pont quotidien", text: `Les deux parties partagent ${cs(c.teamSecondary)} comme approche de travail. Utilisez ce pont consciemment : structurez les réunions d'équipe et les formats de coordination de façon à ce que ${cs(c.teamSecondary)} domine comme niveau de communication. Ainsi, le manager construit la confiance même si la direction de pensée stratégique est différente.` });
      hints.push({ title: "Préparer les décisions de direction", text: `Dans les sujets stratégiques, la différence de logique fondamentale sera visible. Préparez le manager au fait que l'équipe réagit aux décisions ${ca(c.teamPrimary)} et trouve les décisions ${ca(c.personPrimary)} plus difficiles à comprendre. Le manager doit rendre sa logique de décision transparente plutôt que de la considérer comme évidente.` });
    } else {
      hints.push({ title: "Accompagnement intensif dès le départ", text: "Le manager se distingue significativement de l'équipe. Planifiez des points de suivi hebdomadaires pour les 90 premiers jours et intervenez immédiatement aux premiers signes de conflit." });
      hints.push({ title: "Définir la clarté du rôle et le mandat", text: "Clarifiez d'emblée : que doit changer le manager, que doit-il reprendre et où sont les limites ? Sans ce cadre, le manager soit remodèlera l'équipe unilatéralement, soit se désengagera." });
      hints.push({ title: "Préparer l'équipe", text: "Expliquez à l'équipe à l'avance que le nouveau manager travaille différemment de ce à quoi elle est habituée et pourquoi c'est intentionnel. Sans ce cadrage, les différences seront interprétées comme une erreur de recrutement." });
      hints.push({ title: "Points d'étape réguliers", text: "Planifiez des bilans structurés à 30, 60 et 90 jours : l'intégration fonctionne-t-elle ? Où y a-t-il des frictions ? Que faut-il changer ?" });
    }
    return hints;
  }

  if (_lang === "it") {
    if (c.matchCase === "TOP1_TOP2") {
      hints.push({ title: "Costruire fiducia e radicare il ruolo", text: "Il responsabile verrà probabilmente accettato rapidamente perché condivide intuitivamente la logica del team. Utilizzare questo favorevole punto di partenza per fissare aspettative chiare e radicare il ruolo nelle prime settimane. Definire insieme al responsabile gli obiettivi principali per i primi novanta giorni e chiarire i margini di decisione esistenti. La rapida accettazione è un vantaggio da utilizzare consapevolmente." });
      hints.push({ title: "Richiedere attivamente il complemento", text: "Quando responsabile e team sono molto allineati, i punti ciechi tendono a essere rafforzati anziché scoperti. Richiedere attivamente al responsabile di introdurre anche prospettive inusuali e di sfidare costruttivamente il team. Un responsabile che si limita a confermare ciò che il team pensa già non sfrutta appieno il proprio potenziale. Momenti di riflessione regolari su ciò che potrebbe essere trascurato sono utili." });
      hints.push({ title: "Osservare lo sviluppo", text: "Dopo i primi tre mesi, verificare se il responsabile imprime la propria direzione o si adatta eccessivamente alla cultura del team esistente. Un buon responsabile deve anche prendere decisioni scomode e non può limitarsi a confermare lo status quo." });
    } else if (c.matchCase === "TOP1_ONLY") {
      hints.push({ title: "Utilizzare la logica fondamentale condivisa come base di fiducia", text: `Il responsabile condivide con il team la logica principale (${cd(c.teamPrimary)}). Utilizzare questo vantaggio deliberatamente per costruire fiducia nelle prime settimane. Al tempo stesso essere trasparenti fin dall'inizio sui punti in cui lo stile di leadership differisce nei dettagli, in particolare riguardo a ${cs(c.personSecondary)} rispetto all'aspettativa del team di ${cs(c.teamSecondary)}. Più concreto è questo chiarimento, meno attriti nel quotidiano.` });
      hints.push({ title: "Installare cicli di feedback", text: "Organizzare conversazioni di feedback strutturate tra responsabile e team nei primi novanta giorni. Questi incontri devono affrontare sia la collaborazione sui compiti sia la dinamica interpersonale. Domande tipiche: cosa funziona bene? Dove ci sono frizioni? Cosa si aspetta il team dal responsabile? Cosa si aspetta il responsabile dal team? Questa comunicazione precoce evita che i malintesi si cristallizzino." });
      hints.push({ title: "Rendere visibile il complemento nel dettaglio", text: `Il responsabile porta ${cs(c.personSecondary)} come una sfumatura diversa nel quotidiano. Mostrare al team dove questo complemento aiuta e inquadrare le differenze come arricchimento, non come debolezza.` });
    } else if (c.matchCase === "TOP2_ONLY") {
      hints.push({ title: "Inquadrare attivamente lo stile di leadership", text: `Il responsabile pensa e decide attraverso ${cd(c.personPrimary)}, mentre il team si aspetta ${cd(c.teamPrimary)}. Spiegare concretamente al team perché una logica di pensiero diversa in questo ruolo di leadership è intenzionale. Senza questo inquadramento, il team interpreterà lo stile di leadership come un errore di scelta piuttosto che come una decisione deliberata.` });
      hints.push({ title: "Utilizzare deliberatamente il ponte quotidiano", text: `Entrambe le parti condividono ${cs(c.teamSecondary)} come approccio di lavoro. Usare questo ponte consapevolmente: strutturare le riunioni del team e i formati di coordinazione in modo che ${cs(c.teamSecondary)} domini come livello di comunicazione. In questo modo il responsabile costruisce fiducia anche quando la direzione di pensiero strategica è diversa.` });
      hints.push({ title: "Preparare le decisioni di direzione", text: `Nelle questioni strategiche, la differenza nella logica fondamentale sarà visibile. Preparare il responsabile al fatto che il team risponde alle decisioni ${ca(c.teamPrimary)} e trova le decisioni ${ca(c.personPrimary)} più difficili da comprendere. Il responsabile deve rendere trasparente la propria logica decisionale invece di darla per scontata.` });
    } else {
      hints.push({ title: "Supporto intensivo dall'inizio", text: "Il responsabile differisce significativamente dal team. Pianificare check-in settimanali per i primi novanta giorni e intervenire immediatamente ai primi segnali di conflitto." });
      hints.push({ title: "Definire chiarezza del ruolo e mandato", text: "Chiarire subito: cosa deve cambiare il responsabile, cosa deve mantenere e dove sono i limiti? Senza questo quadro, il responsabile o rimodellerà il team unilateralmente o si disimpegnerà." });
      hints.push({ title: "Preparare il team", text: "Spiegare al team in anticipo che il nuovo responsabile lavora in modo diverso da quello a cui è abituato, e perché questo è intenzionale. Senza questo inquadramento, le differenze verranno interpretate come un errore di selezione." });
      hints.push({ title: "Revisioni periodiche", text: "Pianificare revisioni strutturate a trenta, sessanta e novanta giorni: l'integrazione funziona? Dove emergono frizioni? Cosa deve cambiare?" });
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

  if (_lang === "fr") {
    const p = (label: string, period: string, text: string): V4RiskPhase => ({ label, period, text });
    if (c.matchCase === "TOP1_TOP2") {
      return [
        p("Phase 1", "0-3 mois", "Le démarrage devrait se dérouler sans friction. La personne comprend naturellement la logique de l'équipe et peut contribuer de manière productive rapidement. Le risque principal : tout fonctionne si bien que des clarifications importantes sont omises et des angles morts restent non détectés."),
        p("Phase 2", "3-12 mois", "La personne est entièrement intégrée. Le risque réside maintenant dans la routine : quand tout le monde pense de manière similaire, les problèmes sont négligés. Une réflexion régulière et des perspectives extérieures aident à contrebalancer cela."),
        p("Phase 3", "12+ mois", "La collaboration est stable. Vérifiez à long terme si l'équipe est devenue plus unidimensionnelle par renforcement. Si c'est le cas, la prochaine composition devrait délibérément apporter une perspective différente."),
      ];
    }
    if (c.matchCase === "TOP1_ONLY") {
      return [
        p("Phase 1", "0-3 mois", "Le démarrage se passe globalement bien car la logique principale concorde. Dans le travail quotidien, des différences dans l'approche concrète deviennent cependant perceptibles : rythme différent, communication différente, attentes différentes en matière de rigueur. Les premières frictions doivent être abordées ouvertement avant qu'elles ne se figent en jugements définitifs."),
        p("Phase 2", "3-12 mois", "Les différences sont connues et peuvent être gérées délibérément. Si l'alignement a bien fonctionné en phase 1, la collaboration devient maintenant plus productive. Sinon, les points de friction se figent. Les règles de travail doivent être revues et ajustées si nécessaire."),
        p("Phase 3", "12+ mois", "L'intégration est stable quand les différences ont été acceptées comme un complément. Si elles n'ont jamais vraiment été abordées, une frustration latente peut s'accumuler. Même après une longue période commune, une conversation de clarification reste utile."),
      ];
    }
    if (c.matchCase === "TOP2_ONLY") {
      return [
        p("Phase 1", "0-3 mois", `Le démarrage est exigeant car les logiques de pensée diffèrent. L'équipe travaille par ${cs(c.teamPrimary)}, la personne par ${cs(c.personPrimary)}. L'approche de travail commune offre cependant un pont important. Les attentes doivent être formulées très concrètement dans cette phase.`),
        p("Phase 2", "3-12 mois", "La tension devient plus claire au fur et à mesure que l'effet de nouveauté s'estompe. C'est le moment où l'on voit si le complément est utilisé comme une force ou devient une source de friction persistante. Sans cadrage clair du management, la personne risque d'être marginalisée."),
        p("Phase 3", "12+ mois", "Si l'intégration a réussi, l'équipe est devenue plus polyvalente. Si ce n'est pas le cas, la friction s'est figée. Une décision ouverte s'impose alors : la situation va-t-elle changer, ou reste-t-elle ainsi avec toutes les conséquences ?"),
      ];
    }
    if (c.teamClass === "BALANCED" || c.personClass === "BALANCED") {
      return [
        p("Phase 1", "0-3 mois", "Le démarrage dépend beaucoup de la façon dont la personne se positionne. Avec une équipe équilibrée ou une personne au profil large, il n'y a pas de friction naturelle, mais pas non plus de point d'ancrage clair. Les attentes et la clarté du rôle sont particulièrement importantes dès le début."),
        p("Phase 2", "3-12 mois", "Le schéma de collaboration se stabilise. Sa productivité dépend de la façon dont les deux parties ont trouvé un mode de travail clair. Des points de suivi réguliers aident à s'assurer que la dynamique ne dérive pas."),
        p("Phase 3", "12+ mois", "Une collaboration stable nécessite que les deux parties aient développé un langage de travail commun. Si c'est le cas, la combinaison est résiliente. Sinon, une discussion franche sur la voie à suivre s'impose."),
      ];
    }
    return [
      p("Phase 1", "0-3 mois", "Le démarrage est exigeant. Des conflits et des frictions précoces sont probables, ce qui est normal et non un signe d'échec. Un accompagnement intensif et des attentes claires sont nécessaires dès le début pour éviter que des schémas négatifs ne s'installent."),
      p("Phase 2", "3-12 mois", "Les différences sont connues et l'incertitude initiale est passée. La question se pose maintenant : les différences sont-elles vécues comme un enrichissement ou comme un fardeau ? Sans management actif, la dynamique bascule vers la frustration et le retrait."),
      p("Phase 3", "12+ mois", "Soit la personne a enrichi l'équipe et apporté de nouvelles forces, soit la tension est permanente. Dans ce dernier cas, une discussion ouverte sur la perspective est nécessaire. La poursuite n'a de sens que si les deux parties y travaillent activement."),
    ];
  }

  if (_lang === "it") {
    const p = (label: string, period: string, text: string): V4RiskPhase => ({ label, period, text });
    if (c.matchCase === "TOP1_TOP2") {
      return [
        p("Fase 1", "0-3 mesi", "L'inizio dovrebbe procedere senza attriti. La persona comprende intuitivamente la logica del team e può contribuire in modo produttivo fin da subito. Il rischio principale: tutto funziona così bene che chiarimenti importanti vengono saltati e i punti ciechi rimangono non rilevati."),
        p("Fase 2", "3-12 mesi", "La persona è completamente integrata. Il rischio ora risiede nella routine: quando tutti pensano in modo simile, i problemi vengono trascurati. Una riflessione regolare e prospettive esterne aiutano a controbilanciare questo."),
        p("Fase 3", "12+ mesi", "La collaborazione è stabile. Verificare nel lungo periodo se il team sia diventato più unilaterale per effetto del rinforzo. In caso affermativo, la prossima scelta dovrebbe introdurre deliberatamente una prospettiva diversa."),
      ];
    }
    if (c.matchCase === "TOP1_ONLY") {
      return [
        p("Fase 1", "0-3 mesi", "L'inizio avviene in modo fondamentalmente positivo perché la logica principale coincide. Nel quotidiano, tuttavia, emergono differenze nell'approccio concreto: ritmo diverso, comunicazione diversa, aspettative diverse sull'accuratezza. Le prime frizioni devono essere affrontate apertamente prima che si cristallizzino in giudizi definitivi."),
        p("Fase 2", "3-12 mesi", "Le differenze sono note e possono essere gestite deliberatamente. Se l'allineamento nella fase 1 è riuscito, la collaborazione diventa ora più produttiva. Se no, i punti di frizione si cristallizzano. Le regole di lavoro vanno riviste e adattate se necessario."),
        p("Fase 3", "12+ mesi", "L'integrazione è stabile quando le differenze sono state accettate come complemento. Se non sono mai state affrontate apertamente, può accumularsi una frustrazione latente. Anche dopo un lungo periodo insieme, una conversazione di chiarimento vale la pena."),
      ];
    }
    if (c.matchCase === "TOP2_ONLY") {
      return [
        p("Fase 1", "0-3 mesi", `L'inizio è impegnativo perché le logiche di pensiero differiscono. Il team lavora attraverso ${cs(c.teamPrimary)}, la persona attraverso ${cs(c.personPrimary)}. L'approccio di lavoro condiviso offre tuttavia un ponte importante. Le aspettative devono essere formulate in modo molto concreto in questa fase.`),
        p("Fase 2", "3-12 mesi", "La tensione diventa più chiara man mano che l'effetto novità si attenua. Qui si vede se il complemento viene usato come forza o diventa fonte di frizione persistente. Senza un inquadramento chiaro della leadership, la persona rischia di essere marginalizzata."),
        p("Fase 3", "12+ mesi", "Se l'integrazione è riuscita, il team è diventato più versatile. Se no, la frizione si è cristallizzata. A quel punto è necessaria una decisione aperta: la situazione cambierà, o rimarrà così con tutte le conseguenze?"),
      ];
    }
    if (c.teamClass === "BALANCED" || c.personClass === "BALANCED") {
      return [
        p("Fase 1", "0-3 mesi", "L'inizio dipende molto da come la persona si posiziona. Con un team equilibrato o una persona ampiamente posizionata, non c'è frizione naturale, ma neanche un punto di ancoraggio chiaro. Aspettative e chiarezza del ruolo sono particolarmente importanti fin dall'inizio."),
        p("Fase 2", "3-12 mesi", "Il pattern di collaborazione si stabilizza. Se diventa produttivo dipende da se entrambe le parti hanno trovato una modalità di lavoro chiara. Check-in regolari aiutano a garantire che la dinamica non si deteriori."),
        p("Fase 3", "12+ mesi", "Una collaborazione stabile richiede che entrambe le parti abbiano sviluppato un linguaggio di lavoro comune. Se è così, la combinazione è resiliente. Se no, è necessaria una conversazione franca sulla via da seguire."),
      ];
    }
    return [
      p("Fase 1", "0-3 mesi", "L'inizio è impegnativo. Conflitti e frizioni iniziali sono probabili: è normale, non un segnale di fallimento. Supporto intensivo e aspettative chiare sono necessari fin dall'inizio per evitare che si instaurino pattern negativi."),
      p("Fase 2", "3-12 mesi", "Le differenze sono note e l'incertezza iniziale è passata. Ora si decide: le differenze vengono vissute come arricchimento o come peso? Senza una leadership attiva, la dinamica si orienta verso la frustrazione e il disimpegno."),
      p("Fase 3", "12+ mesi", "O la persona ha ampliato il team e portato nuove forze, o la tensione è diventata permanente. In quest'ultimo caso è necessaria una conversazione aperta sulla prospettiva futura. La continuazione ha senso solo se entrambe le parti vogliono attivamente lavorarci."),
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

  if (_lang === "fr") {
    const base: V4IntegrationPhase[] = [
      {
        num: 1,
        title: "Arrivée et orientation",
        period: "Jours 1-10",
        ziel: "La personne comprend la culture d'équipe, les principaux processus et les attentes liées à son rôle. Elle sait qui fait quoi dans l'équipe et connaît les règles fondamentales de la collaboration.",
        beschreibung: c.matchCase === "TOP1_TOP2"
          ? "L'intégration peut se dérouler rapidement car l'approche de travail de la personne correspond à celle de l'équipe. La personne trouvera rapidement ses marques et comprendra naturellement la culture d'équipe. L'accent doit être mis sur la clarification du rôle et les premières tâches concrètes pour que la personne soit efficace rapidement. Utilisez l'alignement naturel pour établir la confiance rapidement."
          : c.matchCase === "TOP1_ONLY"
            ? `L'intégration peut s'appuyer sur la logique commune (${cs(c.teamPrimary)}), ce qui facilite l'arrivée. En même temps, il faut être transparent dès le départ sur le fait que la personne procède différemment dans le travail quotidien de ce à quoi l'équipe est habituée : ${c.personSecondary === "impulsiv" ? "La personne voudra passer à l'action plus vite, tandis que l'équipe attend davantage de préparation." : c.personSecondary === "analytisch" ? "La personne voudra analyser plus en profondeur, tandis que l'équipe attend plus de rythme." : "La personne cherchera plus de coordination, tandis que l'équipe tend à travailler de manière plus indépendante."} Clarifiez tôt quelle approche est attendue dans quelles situations.`
            : c.matchCase === "NONE"
              ? "L'intégration nécessite une attention particulière car l'approche de travail et la culture d'équipe diffèrent significativement. La personne ne comprendra pas naturellement la logique de l'équipe et a besoin d'explications actives. L'accent doit être mis sur la connaissance mutuelle et la compréhension de la culture d'équipe. Évitez de laisser la personne travailler de manière autonome avant qu'elle ait compris les règles du jeu."
              : "L'intégration nécessite des repères clairs. La personne apporte une approche de travail partiellement compatible, mais doit d'abord comprendre comment l'équipe fonctionne et ce qu'elle attend avant d'agir de manière autonome.",
        praxis: [
          "Présentations personnelles avec tous les membres de l'équipe en tête-à-tête ou en petits groupes",
          "Clarification des principales tâches, responsabilités et voies de décision",
          "Désignation d'un interlocuteur dédié (binôme ou mentor) pour les premières semaines",
          "Introduction aux principaux outils, processus et canaux de communication de l'équipe",
          "Communication transparente à l'équipe sur le rôle et les attentes vis-à-vis de la nouvelle personne",
        ],
        signale: [
          "La personne pose des questions actives sur la culture d'équipe et montre un intérêt réel pour la compréhension",
          "Premières contributions en réunion, même si elles sont encore prudentes",
          "Pas de conflits évidents, pas de retrait ni d'inconfort visible",
          "La personne prend contact spontanément avec les membres de l'équipe",
          "L'équipe fait preuve d'ouverture et de volonté d'impliquer la personne",
        ],
        fuehrungstipp: c.isLeader
          ? "En tant que manager : écoutez plus que vous ne parlez dans les premiers jours. Observez la dynamique d'équipe avant d'initier des changements. Montrez du respect pour les processus existants et signalez que vous souhaitez comprendre la culture d'équipe avant de la façonner. Votre première impression a un effet durable."
          : "Donnez délibérément à la personne de l'espace pour s'installer. N'attendez pas encore une pleine productivité. Concentrez-vous sur la construction des relations et l'orientation. Évitez de la surcharger avec trop d'informations d'un coup. Priorisez les sujets les plus importants.",
        fokus: {
          intro: "Cette phase se concentre sur :",
          bullets: ["Établissement de la confiance entre la personne et l'équipe", "Orientation dans la culture d'équipe, les processus et les attentes", "Premiers contacts personnels et découverte du style de travail de l'équipe", "Clarté du rôle et compréhension de sa propre contribution"],
        },
      },
      {
        num: 2,
        title: "Prise en main et premiers résultats",
        period: "Jours 11-20",
        ziel: "La personne prend en charge ses premières tâches autonomes et devient visible dans l'équipe en tant que membre actif. Elle comprend la logique de l'équipe et peut contribuer de manière productive.",
        beschreibung: c.matchCase === "TOP1_TOP2"
          ? "Grâce au fort alignement, la personne peut rapidement travailler de manière autonome et assumer des responsabilités. L'accent doit maintenant porter sur des résultats précoces et visibles qui confirment la confiance de l'équipe. Utilisez cette phase pour impliquer la personne dans des projets actifs et affiner son profil dans l'équipe."
          : c.matchCase === "TOP1_ONLY"
            ? `La personne commence à apporter plus clairement sa propre approche de travail. Dans cette phase, la différence entre ${cs(c.teamSecondary)} (approche de l'équipe) et ${cs(c.personSecondary)} (approche de la personne) devient concrètement perceptible dans le quotidien. ${c.personSecondary === "impulsiv" ? "Dans des situations que l'équipe gère avec soin et préparation, la personne tendra vers des décisions rapides et une action directe." : c.personSecondary === "analytisch" ? "Dans des situations que l'équipe gère avec rythme et pragmatisme, la personne tendra vers une analyse approfondie et des approches structurées." : "Dans des situations que l'équipe gère de manière structurée et factuelle, la personne cherchera des échanges et l'implication de toutes les parties."} Clarifiez dans des situations concrètes quelle approche a la priorité.`
            : "La personne commence à apporter plus clairement sa propre approche de travail. Dans cette phase, les différences avec l'équipe deviennent visibles et tangibles. C'est une partie normale et importante du processus d'intégration. Les différences doivent être abordées ouvertement et de manière constructive plutôt qu'ignorées ou étouffées. Un retour clair aide la personne à se repérer.",
        praxis: [
          "Prise en charge d'un lot de travail concret et délimité avec un résultat clair",
          "Premier entretien structuré de retour avec le manager sur l'intégration à ce jour",
          "Implication dans des projets d'équipe actifs et collaboration avec différents membres de l'équipe",
          "Réflexion commune : où y a-t-il alignement, où des différences apparaissent-elles ?",
          "Ajustement du rôle ou des attentes si nécessaire selon les expériences des premiers jours",
        ],
        signale: [
          "La personne livre les premiers résultats autonomes qui répondent aux attentes",
          "Le retour des membres de l'équipe est majoritairement positif ou constructif",
          "Pas de malentendus répétés ni de frustration croissante d'un côté ou de l'autre",
          "La personne apporte ses propres idées et fait preuve d'initiative",
          "La collaboration dans l'équipe devient de plus en plus naturelle pour toutes les parties",
        ],
        fuehrungstipp: c.isLeader
          ? "Fixez maintenant les premières priorités claires et montrez à l'équipe la direction prise. Vos premières décisions visibles façonnent la perception de votre management. Soyez décisif, mais respectueux des structures existantes. Recueillez activement des retours de l'équipe et montrez que vous les prenez au sérieux."
          : "Vérifiez activement dans cette phase si la personne a compris la logique de l'équipe et peut contribuer de manière productive. Corrigez tôt et de manière constructive si nécessaire. N'attendez pas que les problèmes se figent. Une courte conversation maintenant évite de longs conflits plus tard.",
        fokus: {
          intro: "Cette phase se concentre sur :",
          bullets: ["Premières contributions autonomes et résultats visibles", "Visibilité et acceptation croissantes dans l'équipe", "Recherche active et traitement des retours", "Gestion constructive des différences qui apparaissent"],
        },
      },
      {
        num: 3,
        title: "Stabilisation et approfondissement",
        period: "Jours 21-30",
        ziel: "La personne est arrivée dans l'équipe et travaille de manière autonome et efficace. L'intégration fondamentale est terminée et les bases d'une collaboration à long terme sont en place.",
        beschreibung: c.score >= 60
          ? "L'intégration devrait maintenant être largement en place. La personne a trouvé sa place dans l'équipe et travaille de manière productive. L'accent porte maintenant sur les points ouverts, les objectifs pour les prochains mois et un entretien de retour honnête des deux côtés."
          : "L'intégration nécessite encore de l'attention. Abordez ouvertement si la collaboration peut fonctionner à long terme. S'il y a des problèmes, ils doivent être nommés maintenant, pas dans six mois.",
        praxis: [
          "Entretien de retour récapitulatif couvrant toute la phase d'intégration",
          "Clarification des prochaines étapes de développement et des objectifs concrets pour les trois prochains mois",
          "Bilan commun : qu'est-ce qui fonctionne bien, qu'est-ce qui nécessite un ajustement ou un soutien supplémentaire ?",
          "Définition d'attentes claires pour la prochaine phase de collaboration",
          "Ajustement du rôle, des responsabilités ou des modes de travail si nécessaire",
        ],
        signale: [
          "La personne est productive de manière autonome et livre des résultats de façon fiable",
          "La dynamique d'équipe est stable ou s'est améliorée par rapport au point de départ",
          "Pas de conflits non résolus ni de tensions latentes",
          "La personne se sent membre de l'équipe et l'exprime",
          "Les membres de l'équipe incluent naturellement la personne dans les décisions et la coordination",
        ],
        fuehrungstipp: c.isLeader
          ? "Réfléchissez honnêtement et de manière autocritique à votre premier impact dans l'équipe. Qu'est-ce qui a bien fonctionné, qu'est-ce qui nécessite un ajustement ? Recueillez un retour structuré de l'équipe et montrez que vous êtes prêt à adapter votre style de management aux besoins de l'équipe, sans abandonner votre propre direction."
          : "Ayez une conversation ouverte et honnête avec la personne : qu'est-ce qui fonctionne bien, qu'est-ce qui doit changer ? Fixez des objectifs communs pour les trois prochains mois et définissez comment le succès de l'intégration sera mesuré. Cette conversation est la base d'une collaboration durablement productive.",
        fokus: {
          intro: "Cette phase se concentre sur :",
          bullets: ["Pérennité de l'intégration et viabilité à long terme", "Clarification de tous les points ouverts et des attentes non exprimées", "Définition d'une direction claire pour les prochains mois", "S'assurer que les deux parties sont satisfaites et collaborent de manière constructive"],
        },
      },
    ];
    return base;
  }

  if (_lang === "it") {
    const base: V4IntegrationPhase[] = [
      {
        num: 1,
        title: "Arrivo e orientamento",
        period: "Giorni 1-10",
        ziel: "La persona comprende la cultura del team, i principali processi e le aspettative legate al proprio ruolo. Sa chi fa cosa nel team e conosce le regole fondamentali della collaborazione.",
        beschreibung: c.matchCase === "TOP1_TOP2"
          ? "L'inserimento può procedere rapidamente perché l'approccio di lavoro della persona corrisponde a quello del team. La persona troverà rapidamente il proprio posto e comprenderà la cultura del team in modo naturale. L'accento deve essere posto sulla chiarificazione del ruolo e sui primi compiti concreti affinché la persona possa essere efficace fin dall'inizio. Sfruttare l'allineamento naturale per costruire fiducia rapidamente."
          : c.matchCase === "TOP1_ONLY"
            ? `L'inserimento può fondarsi sulla logica comune (${cs(c.teamPrimary)}), che facilita l'arrivo. Al tempo stesso, è importante essere trasparenti fin dall'inizio sul fatto che la persona procede in modo diverso nel lavoro quotidiano rispetto a quanto il team è abituato: ${c.personSecondary === "impulsiv" ? "La persona vorrà passare all'azione più rapidamente, mentre il team tende ad aspettarsi maggiore preparazione." : c.personSecondary === "analytisch" ? "La persona vorrà analizzare più a fondo, mentre il team si aspetta maggiore ritmo." : "La persona cercherà maggiore coordinazione, mentre il team tende a lavorare in modo più indipendente."} Chiarire fin dall'inizio quale approccio è atteso in quali situazioni.`
            : c.matchCase === "NONE"
              ? "L'inserimento richiede particolare attenzione perché approccio di lavoro e cultura del team differiscono significativamente. La persona non comprenderà la logica del team in modo naturale e ha bisogno di spiegazioni attive. L'accento deve essere posto sulla reciproca conoscenza e sulla comprensione della cultura del team. Evitare di lasciare la persona lavorare in modo autonomo prima che abbia compreso le regole del gioco."
              : "L'inserimento richiede orientamenti chiari. La persona porta un approccio di lavoro parzialmente compatibile, ma deve prima comprendere come funziona il team e cosa si aspetta prima di agire in modo autonomo.",
        praxis: [
          "Presentazioni personali con tutti i membri del team in colloqui individuali o piccoli gruppi",
          "Chiarificazione dei principali compiti, responsabilità e percorsi decisionali",
          "Designazione di un interlocutore fisso (buddy o mentore) per le prime settimane",
          "Introduzione ai principali strumenti, processi e canali di comunicazione del team",
          "Comunicazione trasparente al team sul ruolo e le aspettative nei confronti della nuova persona",
        ],
        signale: [
          "La persona pone domande attive sulla cultura del team e mostra genuino interesse per la comprensione",
          "Primi contributi nelle riunioni, anche se ancora cauti",
          "Nessun conflitto evidente, nessun ritiro o disagio visibile",
          "La persona prende contatto in modo autonomo con i membri del team",
          "Il team mostra apertura e disponibilità a coinvolgere la persona",
        ],
        fuehrungstipp: c.isLeader
          ? "Come responsabile: ascoltare più che parlare nei primi giorni. Osservare la dinamica del team prima di avviare cambiamenti. Mostrare rispetto per i processi esistenti e segnalare che si vuole comprendere la cultura del team prima di plasmarla. La prima impressione ha un effetto duraturo."
          : "Dare deliberatamente alla persona lo spazio per ambientarsi. Non aspettarsi ancora piena produttività. Concentrarsi sulla costruzione delle relazioni e sull'orientamento. Evitare di sovraccaricare la persona con troppe informazioni in una volta. Dare priorità ai temi più importanti.",
        fokus: {
          intro: "Questa fase si concentra su:",
          bullets: ["Costruzione della fiducia tra persona e team", "Orientamento nella cultura del team, nei processi e nelle aspettative", "Primi contatti personali e conoscenza dello stile di lavoro del team", "Chiarezza del ruolo e comprensione del proprio contributo"],
        },
      },
      {
        num: 2,
        title: "Inserimento e primo impatto",
        period: "Giorni 11-20",
        ziel: "La persona si assume i primi compiti autonomi e diventa visibile nel team come membro attivo. Comprende la logica del team e può contribuire in modo produttivo.",
        beschreibung: c.matchCase === "TOP1_TOP2"
          ? "Grazie al forte allineamento, la persona può rapidamente lavorare in modo autonomo e assumere responsabilità. L'accento deve ora essere posto su risultati precoci e visibili che confermino la fiducia del team. Utilizzare questa fase per coinvolgere la persona in progetti attivi e affinare il suo profilo nel team."
          : c.matchCase === "TOP1_ONLY"
            ? `La persona inizia a portare più chiaramente il proprio approccio di lavoro. In questa fase, la differenza tra ${cs(c.teamSecondary)} (approccio del team) e ${cs(c.personSecondary)} (approccio della persona) diventa concretamente percepibile nel quotidiano. ${c.personSecondary === "impulsiv" ? "In situazioni che il team gestisce con cura e preparazione, la persona tenderà verso decisioni rapide e azione diretta." : c.personSecondary === "analytisch" ? "In situazioni che il team gestisce con ritmo e pragmatismo, la persona tenderà verso un'analisi approfondita e approcci strutturati." : "In situazioni che il team gestisce in modo strutturato e oggettivo, la persona cercherà scambi e il coinvolgimento di tutte le parti."} Chiarire in situazioni concrete quale approccio ha la priorità.`
            : "La persona inizia a portare più chiaramente il proprio approccio di lavoro. In questa fase, le differenze con il team diventano visibili e tangibili. E' una parte normale e importante del processo di integrazione. Le differenze devono essere affrontate apertamente e in modo costruttivo piuttosto che ignorate o soppresse. Un feedback chiaro aiuta la persona a orientarsi.",
        praxis: [
          "Assunzione di un pacchetto di lavoro concreto e delimitato con un risultato chiaro",
          "Primo colloquio strutturato di feedback con il responsabile sull'integrazione fino a quel momento",
          "Coinvolgimento in progetti attivi del team e collaborazione con diversi membri del team",
          "Riflessione comune: dove c'è allineamento, dove emergono differenze?",
          "Eventuale adattamento del ruolo o delle aspettative in base alle esperienze dei primi giorni",
        ],
        signale: [
          "La persona consegna i primi risultati autonomi che soddisfano le aspettative",
          "Il feedback dei membri del team è prevalentemente positivo o costruttivo",
          "Nessun malinteso ripetuto né frustrazione crescente da nessuno dei due lati",
          "La persona porta idee proprie e mostra iniziativa",
          "La collaborazione nel team sembra sempre più naturale per tutti i coinvolti",
        ],
        fuehrungstipp: c.isLeader
          ? "Fissare ora le prime priorità chiare e mostrare al team la direzione. Le prime decisioni visibili modellano la percezione della leadership. Essere decisi, ma rispettosi delle strutture esistenti. Raccogliere attivamente feedback dal team e mostrare che lo si prende sul serio."
          : "Verificare attivamente in questa fase se la persona ha compreso la logica del team e può contribuire in modo produttivo. Correggere presto e in modo costruttivo se necessario. Non aspettare che i problemi si consolidino. Una breve conversazione ora evita lunghi conflitti in seguito.",
        fokus: {
          intro: "Questa fase si concentra su:",
          bullets: ["Primi contributi autonomi e risultati visibili", "Crescente visibilità e accettazione nel team", "Ricerca attiva e elaborazione del feedback", "Gestione costruttiva delle differenze che emergono"],
        },
      },
      {
        num: 3,
        title: "Stabilizzazione e approfondimento",
        period: "Giorni 21-30",
        ziel: "La persona è arrivata nel team e lavora in modo autonomo ed efficace. L'integrazione fondamentale è completata e le basi per la collaborazione a lungo termine sono poste.",
        beschreibung: c.score >= 60
          ? "L'integrazione dovrebbe ora essere ampiamente in atto. La persona ha trovato il proprio posto nel team e lavora in modo produttivo. L'accento è ora sulle questioni aperte, sugli obiettivi per i prossimi mesi e su un colloquio di feedback onesto da entrambe le parti."
          : "L'integrazione richiede ancora attenzione. Affrontare apertamente se la collaborazione può funzionare a lungo termine. Se ci sono problemi, devono essere nominati ora, non tra sei mesi.",
        praxis: [
          "Colloquio di feedback riassuntivo sull'intera fase di inserimento",
          "Chiarificazione dei prossimi passi di sviluppo e degli obiettivi concreti per i prossimi tre mesi",
          "Valutazione comune: cosa funziona bene, cosa necessita di adattamento o supporto aggiuntivo?",
          "Definizione di aspettative chiare per la prossima fase di collaborazione",
          "Eventuale adattamento del ruolo, delle responsabilità o delle modalità di collaborazione",
        ],
        signale: [
          "La persona è produttiva in modo autonomo e consegna risultati in modo affidabile",
          "La dinamica del team è stabile o è migliorata rispetto al punto di partenza",
          "Nessun conflitto irrisolto o tensioni latenti",
          "La persona si sente parte del team e lo esprime",
          "I membri del team includono naturalmente la persona nelle decisioni e nella coordinazione",
        ],
        fuehrungstipp: c.isLeader
          ? "Riflettere onestamente e autocriticamente sul proprio primo impatto nel team. Cosa ha funzionato bene, cosa necessita di adattamento? Raccogliere feedback strutturato dal team e mostrare disponibilità ad adattare il proprio stile di leadership alle esigenze del team, senza abbandonare la propria direzione."
          : "Avere una conversazione aperta e onesta con la persona: cosa funziona bene, cosa deve cambiare? Fissare obiettivi comuni per i prossimi tre mesi e definire come verrà misurato il successo dell'integrazione. Questa conversazione è la base per una collaborazione durevole e produttiva.",
        fokus: {
          intro: "Questa fase si concentra su:",
          bullets: ["Sostenibilità dell'integrazione e fattibilità a lungo termine", "Chiarificazione di tutte le questioni aperte e delle aspettative non espresse", "Definizione di una direzione chiara per i prossimi mesi", "Garantire che entrambe le parti siano soddisfatte e collaborino in modo costruttivo"],
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

  if (_lang === "fr") {
    const warnsignale: string[] = [
      "La personne se retire dans les réunions, devient anormalement silencieuse ou ne contribue que lorsqu'on s'adresse directement à elle",
      "Les membres de l'équipe expriment leur insatisfaction quant à la collaboration ou évitent le contact avec la nouvelle personne",
      "La personne ne prend pas contact de manière autonome avec l'équipe et reste isolée dans son propre travail",
      "Des malentendus récurrents dans la communication qui persistent malgré les tentatives de clarification",
      "La personne montre une motivation déclinante, arrive en retard, part tôt ou semble de plus en plus désintéressée",
      "L'équipe forme des sous-groupes informels qui excluent la nouvelle personne",
    ];

    if (c.score < 60) {
      warnsignale.push("Les conflits ouverts ou latents augmentent plutôt que diminuent, malgré des tentatives antérieures de résolution");
      warnsignale.push("La personne tente de déplacer la culture d'équipe dans sa propre direction sans tenir compte des dynamiques existantes");
      warnsignale.push("Les membres de l'équipe réagissent avec un rejet croissant ou une résistance passive aux propositions de la personne");
      warnsignale.push("Le management doit de plus en plus souvent arbitrer entre la personne et l'équipe sans amélioration de la situation");
    }

    const leitfragen = [
      "La personne se sent-elle la bienvenue dans l'équipe et reconnue comme membre à part entière ?",
      "La personne comprend-elle clairement ce qu'on attend d'elle et peut-elle répondre à ces attentes ?",
      "Existe-t-il des points de friction ou des tensions qui ne sont pas abordés ouvertement et agissent en sourdine ?",
      "La personne peut-elle réellement utiliser ses forces spécifiques dans le rôle actuel et les rendre visibles ?",
      "Existe-t-il une couche de travail commune où la personne et l'équipe collaborent régulièrement de manière productive ?",
      "Les attentes initiales des deux parties se sont-elles avérées réalistes, ou doivent-elles être ajustées ?",
      "Comment la dynamique d'équipe a-t-elle évolué depuis l'arrivée de la personne : positivement ou négativement ?",
    ];

    const verantwortung = c.isLeader
      ? "La responsabilité de l'intégration incombe conjointement à l'organisation et au management. L'organisation définit le cadre et les attentes. Le manager doit aller vers l'équipe, écouter et apprendre avant de façonner. Les deux parties doivent être prêtes à investir dans le processus et à intervenir tôt si nécessaire."
      : "La responsabilité principale incombe au manager : formuler des attentes claires, donner un retour régulier, intervenir tôt quand ça bloque et expliquer à l'équipe pourquoi cette personne a été choisie. La personne elle-même doit faire preuve d'ouverture et aller activement vers l'équipe.";

    return { intWarnsignale: warnsignale, intLeitfragen: leitfragen, intVerantwortung: verantwortung };
  }

  if (_lang === "it") {
    const warnsignale: string[] = [
      "La persona si ritira nelle riunioni, diventa insolitamente silenziosa o contribuisce solo quando le viene rivolta la parola direttamente",
      "I membri del team esprimono insoddisfazione sulla collaborazione o evitano il contatto con la nuova persona",
      "La persona non cerca autonomamente il contatto con il team e rimane isolata nel proprio lavoro",
      "Malintesi ricorrenti nella comunicazione che persistono nonostante i tentativi di chiarimento",
      "La persona mostra motivazione calante, arriva in ritardo, se ne va prima o appare sempre più disinteressata",
      "Il team forma sottogruppi informali che escludono la nuova persona",
    ];

    if (c.score < 60) {
      warnsignale.push("Conflitti aperti o latenti aumentano invece di diminuire, nonostante precedenti tentativi di chiarimento");
      warnsignale.push("La persona tenta di spostare la cultura del team nella propria direzione senza tenere conto delle dinamiche esistenti");
      warnsignale.push("I membri del team reagiscono con crescente rifiuto o resistenza passiva alle proposte della persona");
      warnsignale.push("La leadership deve mediare sempre più spesso tra persona e team senza che la situazione migliori");
    }

    const leitfragen = [
      "La persona si sente benvenuta nel team e riconosciuta come membro a pieno titolo?",
      "La persona comprende chiaramente cosa ci si aspetta da lei e può soddisfare queste aspettative?",
      "Esistono punti di frizione o tensioni che non vengono affrontati apertamente e agiscono in modo latente?",
      "La persona può effettivamente mettere a frutto i propri punti di forza specifici nel ruolo attuale e renderli visibili?",
      "Esiste un livello di lavoro condiviso in cui persona e team collaborano regolarmente in modo produttivo?",
      "Le aspettative iniziali di entrambe le parti si sono rivelate realistiche, o devono essere adattate?",
      "Come si è evoluta la dinamica del team dall'arrivo della persona: in senso positivo o negativo?",
    ];

    const verantwortung = c.isLeader
      ? "La responsabilità dell'integrazione spetta congiuntamente all'organizzazione e alla leadership. L'organizzazione definisce il quadro e le aspettative. Il responsabile deve andare verso il team, ascoltare e imparare prima di plasmare. Entrambe le parti devono essere disposte a investire nel processo e a intervenire tempestivamente quando necessario."
      : "La responsabilità principale spetta alla leadership: formulare aspettative chiare, fornire feedback regolare, intervenire tempestivamente quando la situazione si blocca e spiegare al team perché questa persona è stata scelta. La persona stessa deve mostrare apertura e cercare attivamente il contatto con il team.";

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

  if (_lang === "fr") {
    if (c.matchCase === "TOP1_TOP2") {
      emps.push({ title: "Déployer les forces délibérément", text: `Placez la personne là où la force commune de l'équipe et de la personne a le plus d'impact. Le fort alignement en ${cd(c.teamPrimary)} et en ${cs(c.teamSecondary)} permet un déploiement rapide sur les tâches principales sans longue période d'intégration. Utilisez cet avantage consciemment et donnez tôt de la responsabilité à la personne dans des domaines qui s'appuient sur la force commune.` });
      emps.push({ title: "Rechercher activement le complément", text: "Veillez délibérément à ce que l'équipe ne devienne pas plus unidimensionnelle par renforcement. Invitez activement des perspectives complémentaires, par exemple à travers des questions ciblées en réunion ou en intégrant consciemment des points de vue extérieurs. Pour la prochaine composition d'équipe, envisagez si quelqu'un avec une logique de travail différente renforcerait la polyvalence de l'équipe." });
      emps.push({ title: "Intégrer des temps de réflexion", text: "Créez des moments de réflexion réguliers où l'équipe réfléchit délibérément à sa propre façon de travailler. Des questions comme 'Qu'est-ce que nous négligeons en ce moment ?' ou 'Quelle perspective nous manque ?' aident à minimiser les risques d'un fort alignement et à mettre en lumière les angles morts." });
    } else if (c.matchCase === "TOP1_ONLY") {
      emps.push({ title: "Renforcer la base commune", text: `Utilisez la logique commune en ${cd(c.teamPrimary)} comme fondation stable pour la collaboration. Aidez la personne et l'équipe à reconnaître qu'elles s'accordent au niveau fondamental, et abordez ouvertement et de manière constructive les différences dans l'approche de travail concrète. Présentez les différences comme des chemins différents vers le même objectif, non comme des incompatibilités fondamentales.` });
      emps.push({ title: "Convenir des règles du quotidien", text: "Définissez dans les premières semaines des règles concrètes pour la collaboration quotidienne : comment communique-t-on ? À quelle rapidité attend-on des réponses ? Avec quelle rigueur les décisions doivent-elles être préparées ? Ces petits accords concrets comblent les différences dans les détails et empêchent que des différences normales de style de travail ne deviennent des conflits émotionnels." });
      emps.push({ title: "Valoriser le complément", text: `La personne apporte ${cs(c.personSecondary)} comme une force différente dans le quotidien par rapport à l'équipe. Rendez visible où ce complément aide l'équipe, et créez délibérément des opportunités pour que la personne apporte sa force particulière. Cela augmente l'acceptation et montre à l'équipe la valeur de cette composition.` });
    } else if (c.matchCase === "TOP2_ONLY") {
      emps.push({ title: "Rendre la logique de décision transparente", text: `L'équipe décide ${ca(c.teamPrimary)}, la personne ${ca(c.personPrimary)}. Clarifiez concrètement : dans quelles situations ${cs(c.teamPrimary)} a-t-il la priorité (par exemple sous pression de temps, dans les décisions opérationnelles) ? Et où ${cs(c.personPrimary)} est-il explicitement souhaité (par exemple dans les questions stratégiques, la gestion de la qualité) ? Quand les deux parties savent quelle logique s'applique dans quel cas, les frictions quotidiennes diminuent.` });
      emps.push({ title: "Utiliser activement la couche commune", text: `Les deux parties se rejoignent par ${cs(c.teamSecondary)}. Utilisez cette approche de travail commune consciemment comme pont : structurez les réunions de coordination, les tours de rétroaction et les sessions de travail communes de façon à ce que ${cs(c.teamSecondary)} soit le format dominant. Cela renforce le lien et crée une couche familière où les différences de logique fondamentale ont moins d'impact.` });
      emps.push({ title: "Cadrer les différences pour l'équipe", text: `L'équipe peut percevoir le comportement de la personne comme inadapté ou résistant, même si c'est structurellement fondé. Expliquez à l'équipe que la personne ne travaille pas différemment par mauvaise volonté, mais parce que ${cd(c.personPrimary)} est sa logique de travail naturelle. Nommez concrètement où le complément aide l'équipe, par exemple dans des tâches où l'équipe avait des lacunes. Ce cadrage prévient les préjugés et augmente l'acceptation.` });
    } else {
      emps.push({ title: "Fournir un accompagnement intensif", text: "Les 90 premiers jours sont particulièrement décisifs ici. Planifiez des points de suivi hebdomadaires et adressez les premiers signes de conflit immédiatement. Plus les problèmes sont traités tôt, plus ils sont faciles à résoudre." });
      emps.push({ title: "Créer des responsabilités claires", text: "Définissez dès le début les responsabilités, les voies de décision et les voies d'escalade. Avec une forte déviation, la coordination intuitive ne fonctionne pas. Les deux parties ont besoin de règles claires." });
      emps.push({ title: "Vérifier et communiquer l'intention", text: "La différence est-elle intentionnelle ? L'équipe a-t-elle vraiment besoin d'une perspective différente ? Si oui, dites-le clairement à l'équipe. Sans ce cadrage, les différences seront interprétées comme une erreur dans la décision de recrutement. Si la différence n'était pas prévue, reconsidérez la composition." });
    }

    if (c.hasGoal && c.taskFit === "gering") {
      emps.push({ title: "Renforcer délibérément le focus sur la tâche", text: `La personne n'apporte pas la force appropriée pour l'objectif fonctionnel ${c.teamGoalLabel}. Elle peut quand même remplir le rôle, mais aura besoin de plus de soutien. Complétez délibérément avec des membres de l'équipe plus forts dans ce domaine, et veillez à ce que la personne ne travaille pas durablement contre sa logique de travail naturelle.` });
    }

    return emps;
  }

  if (_lang === "it") {
    if (c.matchCase === "TOP1_TOP2") {
      emps.push({ title: "Utilizzare i punti di forza deliberatamente", text: `Collocare la persona dove la forza condivisa di team e persona ha il maggiore impatto. Il forte allineamento in ${cd(c.teamPrimary)} e ${cs(c.teamSecondary)} consente un impiego rapido nei compiti principali senza un lungo periodo di inserimento. Utilizzare questo vantaggio consapevolmente e dare alla persona responsabilità precocemente in aree che si basano sulla forza condivisa.` });
      emps.push({ title: "Richiedere attivamente il complemento", text: "Prestare attenzione deliberata affinché il team non diventi più unilaterale attraverso il rinforzo. Invitare attivamente prospettive complementari, ad esempio attraverso domande mirate nelle riunioni o includendo consapevolmente punti di vista esterni. Per la prossima scelta del team, considerare se una persona con una logica di lavoro diversa rafforzerebbe la versatilità del team." });
      emps.push({ title: "Integrare momenti di riflessione", text: "Creare punti di riflessione regolari in cui il team riflette deliberatamente sul proprio modo di lavorare. Domande come 'Cosa stiamo trascurando in questo momento?' o 'Quale prospettiva ci manca?' aiutano a minimizzare i rischi dell'alto allineamento e a portare alla luce i punti ciechi." });
    } else if (c.matchCase === "TOP1_ONLY") {
      emps.push({ title: "Rafforzare la base comune", text: `Utilizzare la logica comune in ${cd(c.teamPrimary)} come fondamenta stabile per la collaborazione. Aiutare la persona e il team a riconoscere che concordano a livello fondamentale, e affrontare apertamente e in modo costruttivo le differenze nell'approccio concreto di lavoro. Inquadrare le differenze come vie diverse verso lo stesso obiettivo, non come incompatibilità fondamentali.` });
      emps.push({ title: "Concordare le regole del quotidiano", text: "Definire nelle prime settimane regole concrete per la collaborazione quotidiana: come si comunica? Con quale rapidità ci si aspetta risposta? Con quale cura devono essere preparate le decisioni? Questi piccoli accordi concreti colmano le differenze nei dettagli e impediscono che normali differenze di stile di lavoro diventino conflitti emotivi." });
      emps.push({ title: "Valorizzare il complemento", text: `La persona porta ${cs(c.personSecondary)} come forza diversa nel quotidiano rispetto al team. Rendere visibile dove questo complemento aiuta il team e creare deliberatamente opportunità in cui la persona può portare la propria forza particolare. Questo aumenta l'accettazione e mostra al team il valore della scelta.` });
    } else if (c.matchCase === "TOP2_ONLY") {
      emps.push({ title: "Rendere trasparente la logica decisionale", text: `Il team decide ${ca(c.teamPrimary)}, la persona ${ca(c.personPrimary)}. Chiarire concretamente: in quali situazioni ${cs(c.teamPrimary)} ha la priorità (ad esempio sotto pressione di tempo, nelle decisioni operative)? E dove ${cs(c.personPrimary)} è esplicitamente desiderato (ad esempio nelle questioni strategiche, nella gestione della qualità)? Quando entrambe le parti sanno quale logica si applica in quale situazione, le frizioni quotidiane diminuiscono.` });
      emps.push({ title: "Utilizzare attivamente il livello comune", text: `Entrambe le parti si incontrano attraverso ${cs(c.teamSecondary)}. Utilizzare questo approccio di lavoro comune consapevolmente come ponte: strutturare le riunioni di coordinazione, i cicli di feedback e le sessioni di lavoro comuni in modo che ${cs(c.teamSecondary)} sia il formato dominante. Questo rafforza il legame e crea un livello familiare in cui le differenze nella logica fondamentale hanno meno impatto.` });
      emps.push({ title: "Inquadrare le differenze per il team", text: `Il team potrebbe percepire il comportamento della persona come inadatto o resistente, anche se è strutturalmente motivato. Spiegare al team che la persona non lavora diversamente per mancanza di volontà, ma perché ${cd(c.personPrimary)} è la sua logica di lavoro naturale. Nominare concretamente dove il complemento aiuta il team, ad esempio nei compiti in cui il team aveva lacune. Questo inquadramento previene i pregiudizi e aumenta l'accettazione.` });
    } else {
      emps.push({ title: "Fornire supporto intensivo", text: "I primi novanta giorni sono particolarmente decisivi. Pianificare check-in settimanali e intervenire immediatamente ai primi segnali di conflitto. Prima vengono affrontati i problemi, più facilmente si risolvono." });
      emps.push({ title: "Creare responsabilità chiare", text: "Definire fin dall'inizio responsabilità, percorsi decisionali e vie di escalation. Con una forte deviazione, la coordinazione intuitiva non funziona: entrambe le parti hanno bisogno di regole chiare." });
      emps.push({ title: "Verificare e comunicare l'intenzione", text: "La differenza è intenzionale? Il team ha davvero bisogno di una prospettiva diversa? In caso affermativo, dirlo chiaramente al team. Senza questo inquadramento, le differenze verranno interpretate come un errore nella decisione di selezione. Se la differenza non era intenzionale, riconsiderare la scelta." });
    }

    if (c.hasGoal && c.taskFit === "gering") {
      emps.push({ title: "Rafforzare deliberatamente il focus sul compito", text: `La persona non porta la forza adeguata per l'obiettivo funzionale ${c.teamGoalLabel}. Può comunque svolgere il ruolo, ma avrà bisogno di maggiore supporto. Integrare deliberatamente con membri del team più forti in quest'area e garantire che la persona non lavori permanentemente contro la propria logica di lavoro naturale.` });
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

  if (_lang === "fr") {
    const paras: string[] = [];
    if (c.matchCase === "TOP1_TOP2") {
      paras.push(`Sans cette personne, l'équipe reste dans sa logique fondamentale. Le renforcement en ${cd(c.teamPrimary)} disparaît, mais l'équipe ne perd aucune capacité qu'elle n'avait pas auparavant, seulement de la capacité dans la force principale. La dynamique reste probablement stable.`);
      paras.push("À long terme, la structure et la culture de l'équipe changent peu. La question est : la capacité supplémentaire était-elle nécessaire et doit-elle être remplacée ? Si la personne était un renforcement purement quantitatif, le remplacement est simple. Si elle a apporté des qualités personnelles au-delà de la correspondance de profil, le vide sera plus grand que ce que l'analyse du profil laisse supposer.");
    } else if (c.matchCase === "TOP1_ONLY") {
      paras.push(`Sans cette personne, l'équipe perd l'apport complémentaire en ${cd(c.personSecondary)}. La logique fondamentale (${cs(c.teamPrimary)}) reste inchangée, mais l'approche de travail particulière, ${cs(c.personSecondary)} plutôt que ${cs(c.teamSecondary)}, manque comme perspective.`);
      paras.push("L'équipe revient à son mode de travail précédent. À court terme, cela apporte de la stabilité, car l'effort d'adaptation disparaît. À long terme, le complément manque. Pour la prochaine composition, il vaut la peine d'examiner si un profil similaire doit être recherché à nouveau.");
    } else if (c.matchCase === "TOP2_ONLY") {
      paras.push(`Sans cette personne, l'équipe perd l'apport en ${cd(c.personPrimary)}. La mesure dans laquelle cela est perceptible dépend de la qualité de l'intégration de la personne et de la façon dont l'équipe a activement utilisé son complément.`);
      paras.push("L'équipe revient à son mode de travail précédent. À court terme, cela apporte de la stabilité. À long terme, les faiblesses et les angles morts que la personne compensait restent de nouveau sans compensation. Pour la prochaine composition, il vaut la peine d'examiner si un profil similaire doit être recherché à nouveau.");
    } else {
      paras.push("Sans cette personne, l'équipe revient à sa dynamique précédente. La mesure dans laquelle cela est perceptible dépend du déroulement de l'intégration. Si la personne a réellement élargi l'équipe, elle laisse un vide. Si la collaboration était dominée par les frictions, le départ peut même apporter un soulagement.");
      paras.push("La question clé : la personne a-t-elle ancré des changements dans les processus ou les façons de penser qui perdurent après son départ ? Si oui, l'effet positif reste. Sinon, l'équipe reviendra rapidement à son point de départ. Utilisez le départ pour une réflexion honnête : qu'a apporté cette composition ? Que feriez-vous différemment ?");
    }
    return paras.join("\n\n");
  }

  if (_lang === "it") {
    const paras: string[] = [];
    if (c.matchCase === "TOP1_TOP2") {
      paras.push(`Senza questa persona, il team rimane nella propria logica fondamentale. Il rinforzo in ${cd(c.teamPrimary)} viene meno, ma il team non perde nessuna capacità che non avesse prima, solo capacità nella forza principale. La dinamica rimarrà probabilmente stabile.`);
      paras.push("Nel lungo termine, struttura e cultura del team cambiano poco. La domanda è: la capacità aggiuntiva era necessaria e deve essere sostituita? Se la persona era un rinforzo puramente quantitativo, la sostituzione è semplice. Se ha portato qualità personali oltre la corrispondenza del profilo, il vuoto sarà maggiore di quanto l'analisi del profilo lasci supporre.");
    } else if (c.matchCase === "TOP1_ONLY") {
      paras.push(`Senza questa persona, il team perde il contributo complementare in ${cd(c.personSecondary)}. La logica fondamentale (${cs(c.teamPrimary)}) rimane invariata, ma l'approccio di lavoro particolare, ${cs(c.personSecondary)} invece di ${cs(c.teamSecondary)}, non è più presente come prospettiva.`);
      paras.push("Il team ritorna al proprio stile di lavoro precedente. Nel breve termine questo porta stabilità, perché lo sforzo di adattamento viene meno. Nel lungo termine manca il complemento. Per la prossima scelta vale la pena considerare se cercare nuovamente un profilo simile.");
    } else if (c.matchCase === "TOP2_ONLY") {
      paras.push(`Senza questa persona, il team perde il contributo in ${cd(c.personPrimary)}. Quanto questo sia percepibile dipende da quanto bene la persona era integrata e se il team ha utilizzato attivamente il suo complemento.`);
      paras.push("Il team ritorna al proprio stile di lavoro precedente. Nel breve termine questo porta stabilità. Nel lungo termine rimangono però senza compensazione le debolezze e i punti ciechi che la persona compensava. Per la prossima scelta vale la pena considerare se cercare nuovamente un profilo simile.");
    } else {
      paras.push("Senza questa persona, il team ritorna alla propria dinamica precedente. Quanto questo sia percepibile dipende da come si è svolta l'integrazione. Se la persona ha davvero ampliato il team, lascia un vuoto. Se la collaborazione era dominata dalle frizioni, la partenza può persino portare sollievo.");
      paras.push("La domanda decisiva: la persona ha radicato cambiamenti nei processi o nei modi di pensare che perdurano oltre la sua presenza? In caso affermativo, l'effetto positivo rimane. Se no, il team tornerà rapidamente al punto di partenza. Utilizzare la partenza per una riflessione onesta: cosa ha portato questa scelta? Cosa si farebbe diversamente?");
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

  if (_lang === "fr") {
    const paras: string[] = [];
    if (score >= 85) {
      const goalPart = hasGoal && taskFit === "hoch"
        ? ` Pour l'objectif fonctionnel ${teamGoalLabel}, la personne présente également une bonne adéquation.`
        : "";
      paras.push(`Cette composition est recommandée. Le style de travail de la personne s'aligne bien avec l'équipe.${goalPart} ${isLeader ? "La prise de poste de manager devrait se dérouler sans heurts, car le manager communique et décide d'une façon que l'équipe reconnaît." : "L'intégration devrait se faire rapidement, car la personne comprend naturellement la culture d'équipe."}`);
      paras.push(`Il vaut quand même la peine de discuter ouvertement des attentes dès le départ. Une bonne adéquation de profil réduit les frictions, mais ne garantit pas une collaboration parfaite. ${isLeader ? "Vérifiez après 90 jours si le manager imprime aussi sa propre direction et ne fait pas que confirmer ce que l'équipe pense déjà." : "Vérifiez après 90 jours si l'équipe n'est pas devenue plus unidimensionnelle par renforcement."}`);
    } else if (score >= 60) {
      paras.push(`Cette composition peut fonctionner, mais nécessite un pilotage. ${matchCase === "TOP1_ONLY" ? "La logique de pensée concorde, ce qui constitue une base stable. Dans le quotidien, il existe cependant des différences qui nécessitent une clarification." : "Dans le travail quotidien, il y a des chevauchements qui portent la collaboration. La direction de pensée diffère cependant, ce qui se remarque sous pression."}`);
      paras.push(`Le succès de cette composition dépend de la façon dont les différences sont utilisées comme complément. Cela nécessite des attentes claires, un retour régulier et de l'ouverture des deux côtés. ${isLeader ? "Le manager doit savoir où s'adapter et où imprimer sa propre direction." : "Le manager porte la responsabilité principale de définir le cadre."} Un bilan après 90 jours est recommandé.`);
    } else {
      const goalPart = hasGoal && taskFit !== "gering"
        ? ` Pour l'objectif fonctionnel ${teamGoalLabel}, la personne peut cependant apporter une contribution concrète.`
        : "";
      if (matchCase === "TOP2_ONLY") {
        paras.push(`Cette composition est exigeante. Les logiques de pensée diffèrent significativement, mais dans le travail quotidien il existe une couche de connexion par ${cs(c.teamSecondary)}.${goalPart}`);
        paras.push("Cette couche de travail commune rend l'intégration plus réaliste que sans aucun chevauchement. Le management doit cependant clarifier quand quelle logique de travail a la priorité, et communiquer ouvertement pourquoi cette composition a du sens malgré tout.");
      } else {
        paras.push(`Cette composition est exigeante. La personne et l'équipe diffèrent significativement tant dans la logique de pensée que dans l'approche de travail.${goalPart}`);
        paras.push("Une intégration est possible, mais seulement quand il est clair pourquoi cette composition a du sens malgré les différences. Quand cela est justifié, elle peut renforcer l'équipe. Sinon, la décision devrait être réexaminée.");
      }
    }
    return paras.join("\n\n");
  }

  if (_lang === "it") {
    const paras: string[] = [];
    if (score >= 85) {
      const goalPart = hasGoal && taskFit === "hoch"
        ? ` Per l'obiettivo funzionale ${teamGoalLabel}, la persona presenta anche una buona corrispondenza.`
        : "";
      paras.push(`Questa scelta è raccomandata. Lo stile di lavoro della persona si allinea bene con il team.${goalPart} ${isLeader ? "L'inserimento nel ruolo di responsabile dovrebbe avvenire senza attriti, perché il responsabile comunica e decide in un modo che il team riconosce." : "L'integrazione dovrebbe avvenire rapidamente, perché la persona comprende naturalmente la cultura del team."}`);
      paras.push(`Vale comunque la pena di discutere apertamente le aspettative fin dall'inizio. Una buona corrispondenza di profilo riduce le frizioni, ma non garantisce una collaborazione perfetta. ${isLeader ? "Verificare dopo novanta giorni se il responsabile imprime anche la propria direzione e non si limita a confermare ciò che il team pensa già." : "Verificare dopo novanta giorni se il team sia diventato più unilaterale attraverso il rinforzo."}`);
    } else if (score >= 60) {
      paras.push(`Questa scelta può funzionare, ma richiede gestione. ${matchCase === "TOP1_ONLY" ? "La logica di pensiero coincide, il che è una base stabile. Nel quotidiano esistono tuttavia differenze che richiedono chiarimento." : "Nel lavoro quotidiano ci sono sovrapposizioni che sostengono la collaborazione. La direzione di pensiero differisce però, il che diventa percepibile sotto pressione."}`);
      paras.push(`Il successo di questa scelta dipende da se le differenze vengono utilizzate come complemento. Questo richiede aspettative chiare, feedback regolare e apertura da entrambe le parti. ${isLeader ? "Il responsabile deve sapere dove adattarsi e dove imprimere la propria direzione." : "Il responsabile porta la responsabilità principale di definire il quadro."} Una revisione dopo novanta giorni è raccomandata.`);
    } else {
      const goalPart = hasGoal && taskFit !== "gering"
        ? ` Per l'obiettivo funzionale ${teamGoalLabel}, la persona può tuttavia apportare un contributo concreto.`
        : "";
      if (matchCase === "TOP2_ONLY") {
        paras.push(`Questa scelta è impegnativa. Le logiche di pensiero differiscono significativamente, ma nel lavoro quotidiano esiste un livello di connessione attraverso ${cs(c.teamSecondary)}.${goalPart}`);
        paras.push("Questo livello di lavoro condiviso rende l'integrazione più realistica rispetto all'assenza di qualsiasi sovrapposizione. La leadership deve tuttavia chiarire quando quale logica di lavoro ha la priorità e comunicare apertamente perché questa scelta ha senso nonostante tutto.");
      } else {
        paras.push(`Questa scelta è impegnativa. Persona e team differiscono significativamente sia nella logica di pensiero sia nell'approccio di lavoro.${goalPart}`);
        paras.push("Un'integrazione è possibile, ma solo quando è chiaro perché questa scelta ha senso nonostante le differenze. Quando è giustificata, può rafforzare il team. Se no, la decisione dovrebbe essere riesaminata.");
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
  _lang = input.lang === "en" ? "en" : input.lang === "fr" ? "fr" : input.lang === "it" ? "it" : "de";

  const inputRoleType = input.roleType;
  const isLeader = inputRoleType === "fuehrung" || inputRoleType === "leadership";
  const roleLabel = _lang === "fr"
    ? (isLeader ? "Manager" : "Membre d'équipe")
    : _lang === "en"
      ? (isLeader ? "Manager" : "Team member")
      : _lang === "it"
        ? (isLeader ? "Responsabile" : "Membro del team")
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

  const roleName = input.roleTitle || (_lang === "fr" ? "ce poste" : _lang === "en" ? "this role" : "diese Rolle");
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
    : _lang === "fr"
      ? (teamClass === "BALANCED" && personClass === "BALANCED"
          ? "L'équipe et la personne présentent toutes deux un profil équilibré sans dominance claire dans l'un des trois schémas comportementaux. Les deux parties sont flexibles et non fixées à une logique de travail particulière. Cela ne génère ni fort alignement ni forte friction structurelle à partir des profils."
          : teamClass === "BALANCED"
            ? `L'équipe est positionnée de manière équilibrée et ne montre pas de schéma de travail dominant. La personne, en revanche, s'oriente plus clairement vers ${cs(personPrimary)} et apporte une direction plus définie à la collaboration. Cela peut donner une orientation à l'équipe, mais nécessite une attention particulière pour préserver la polyvalence de l'équipe.`
            : personClass === "BALANCED"
              ? `L'équipe travaille avec un accent clair sur ${cs(teamPrimary)} et attend une orientation similaire des nouveaux membres. La personne est positionnée de manière plus large sans schéma dominant. Elle peut s'adapter avec souplesse, mais doit comprendre activement et adopter la logique de l'équipe.`
              : sameDominance
                ? `L'équipe et la personne opèrent toutes deux avec ${cs(teamPrimary)} comme logique de travail principale. La logique fondamentale est structurellement proche, ce qui facilite la collaboration en principe. Dans le travail quotidien, des différences de rythme et d'approche sont à prévoir, car l'équipe s'appuie davantage sur ${cs(teamSecondary)} tandis que la personne tend vers ${cs(personSecondary)}.`
                : `L'équipe travaille avec un accent clair sur ${cs(teamPrimary)} et s'est alignée sur cette logique. La personne, en revanche, s'oriente davantage vers ${cs(personPrimary)} et aborde les choses différemment. Des attentes claires dès le début sont nécessaires.`)
    : _lang === "it"
      ? (teamClass === "BALANCED" && personClass === "BALANCED"
          ? "Il team e la persona mostrano entrambi un profilo equilibrato senza dominanza chiara in nessuno dei tre schemi comportamentali. Entrambe le parti sono flessibili e non vincolate a una particolare logica di lavoro. Questo non genera né un forte allineamento né una forte frizione strutturale dai profili."
          : teamClass === "BALANCED"
            ? `Il team è posizionato in modo equilibrato e non mostra uno schema di lavoro dominante. La persona, al contrario, si orienta più chiaramente verso ${cs(personPrimary)} e porta una direzione più definita alla collaborazione. Questo può dare al team un orientamento, ma richiede attenzione per preservare la versatilità del team.`
            : personClass === "BALANCED"
              ? `Il team lavora con un chiaro accento su ${cs(teamPrimary)} e si aspetta un orientamento simile dai nuovi membri. La persona è posizionata in modo più ampio senza uno schema dominante. Può adattarsi con flessibilità, ma deve comprendere attivamente e adottare la logica del team.`
              : sameDominance
                ? `Team e persona operano entrambi con ${cs(teamPrimary)} come logica di lavoro principale. La logica fondamentale è strutturalmente vicina, il che facilita la collaborazione in linea di principio. Nel quotidiano sono da prevedere differenze di ritmo e approccio, poiché il team si affida maggiormente a ${cs(teamSecondary)} mentre la persona tende verso ${cs(personSecondary)}.`
                : `Il team lavora con un chiaro accento su ${cs(teamPrimary)} e si è allineato a questa logica. La persona, al contrario, si orienta maggiormente verso ${cs(personPrimary)} e affronta le cose in modo diverso. Aspettative chiare fin dall'inizio sono necessarie.`)
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
