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
}


type MatchCase = "TOP1_TOP2" | "TOP1_ONLY" | "TOP2_ONLY" | "NONE";
type ProfileClass = "BALANCED" | "DUAL" | "CLEAR" | "ORDER";

const EQ_TOL = 5;

const GOAL_LABELS: Record<string, string> = {
  umsetzung: "Umsetzung und Ergebnisse",
  analyse: "Analyse und Struktur",
  zusammenarbeit: "Zusammenarbeit und Kommunikation",
};

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

const COMP_DOMAIN: Record<ComponentKey, string> = {
  impulsiv: "Handlung und Umsetzung",
  intuitiv: "Kommunikation und Abstimmung",
  analytisch: "Struktur und Analyse",
};

const COMP_ADJ: Record<ComponentKey, string> = {
  impulsiv: "direkter und schneller",
  intuitiv: "stärker über Austausch und Abstimmung",
  analytisch: "genauer und strukturierter",
};

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
): { score: number; top1: number; top2: number; variant: number; matchCase: MatchCase } {
  const tClass = getProfileClass(teamProfile);
  const pClass = getProfileClass(personProfile);

  if (tClass === "BALANCED" && pClass === "BALANCED") {
    return { score: 95, top1: 60, top2: 30, variant: 5, matchCase: "TOP1_TOP2" };
  }

  if (tClass === "BALANCED") {
    const pSpread = getSpreadClass(personProfile);
    if (pSpread === "balanced" || pSpread === "eng") {
      return { score: 80, top1: 45, top2: 25, variant: 10, matchCase: "TOP1_TOP2" };
    }
    if (pSpread === "nah") {
      return { score: 70, top1: 40, top2: 20, variant: 10, matchCase: "TOP1_ONLY" };
    }
    return { score: 60, top1: 30, top2: 20, variant: 10, matchCase: "TOP2_ONLY" };
  }

  if (pClass === "BALANCED") {
    const tSpread = getSpreadClass(teamProfile);
    if (tSpread === "balanced" || tSpread === "eng" || tSpread === "nah") {
      return { score: 75, top1: 45, top2: 20, variant: 10, matchCase: "TOP1_ONLY" };
    }
    return { score: 60, top1: 30, top2: 20, variant: 10, matchCase: "TOP2_ONLY" };
  }

  const tTop1 = getTop1(teamProfile);
  const tTop2 = getTop2(teamProfile);
  const pTop1 = getTop1(personProfile);
  const pTop2 = getTop2(personProfile);

  let top1Score = tTop1 === pTop1 ? 60 : 0;

  let top2Score = 0;
  if (tTop2 === pTop2) {
    top2Score = 30;
  } else if (tTop1 === pTop2) {
    top2Score = 15;
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

  return { score, top1: top1Score, top2: top2Score, variant: variantScore, matchCase };
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

  const personValue = round(personProfile[goalComp]);
  const teamValue = round(teamProfile[goalComp]);

  let fit: string;
  if (personValue >= teamValue - 5) fit = "hoch";
  else if (personValue >= teamValue - 15) fit = "mittel";
  else fit = "gering";

  const sorted = sortTriad(personProfile);
  const dominantValue = sorted[0].value;
  const lowestValue = sorted[2].value;
  if (personValue <= lowestValue && (dominantValue - personValue) > 8) {
    const gap = dominantValue - personValue;
    if (gap > 20) {
      fit = "gering";
    } else {
      if (fit === "hoch") fit = "mittel";
      else if (fit === "mittel") fit = "gering";
    }
  }

  return fit;
}

function computeSystemwirkung(matchCase: MatchCase): string {
  if (matchCase === "TOP1_TOP2") return "Verstärkung";
  if (matchCase === "TOP1_ONLY") return "Stabile Ergänzung";
  if (matchCase === "TOP2_ONLY") return "Ergänzung mit Spannung";
  return "Transformation";
}

function gesamtLabel(teamFit: string, taskFit: string, matchCase: MatchCase): string {
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
  const p1 = c.isLeader
    ? "Dieser Bericht zeigt, wie die Person in einer Führungsrolle im bestehenden Team voraussichtlich wirken wird. Er vergleicht die bioLogic-Profile von Person und Team und macht sichtbar, wo die Zusammenarbeit gut gelingen kann, wo Reibung wahrscheinlich ist und wo im Alltag Klärung nötig sein wird. Er ersetzt keine persönliche Einschätzung, sondern ergänzt sie um eine Perspektive, die im Gespräch oft nicht sichtbar wird."
    : "Dieser Bericht zeigt, wie die Person im bestehenden Team voraussichtlich wirken wird. Er vergleicht die bioLogic-Profile von Person und Team und macht sichtbar, wo die Zusammenarbeit gut gelingen kann, wo Reibung wahrscheinlich ist und wo im Alltag Klärung nötig sein wird. Er ersetzt keine persönliche Einschätzung, sondern ergänzt sie um eine Perspektive, die im Gespräch oft nicht sichtbar wird.";
  const p2 = "Unterschiede zwischen Person und Team sind nicht automatisch negativ. Sie können ein Team sinnvoll ergänzen. Damit das gelingt, braucht es klare Erwartungen und gute Führung. Dieser Bericht liefert die Grundlage, um frühzeitig die richtigen Weichen zu stellen.";
  return `${p1}\n\n${p2}`;
}


function buildGesamtbewertungText(c: Ctx): string {
  const { matchCase, isLeader, teamClass, personClass, hasGoal, teamGoalLabel, taskFit } = c;
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
  if (c.matchCase === "TOP1_TOP2") return `Gleiche Grundlogik und Arbeitsweise wie das Team (${COMP_SHORT[c.teamPrimary]} + ${COMP_SHORT[c.teamSecondary]}).`;
  if (c.matchCase === "TOP1_ONLY") return `Gleiche Grundlogik wie das Team (${COMP_SHORT[c.teamPrimary]}).`;
  if (c.matchCase === "TOP2_ONLY") return `Überschneidung in der Arbeitsweise (${COMP_SHORT[c.teamSecondary]}).`;
  if (c.personClass === "BALANCED") return "Vielseitigkeit und Anpassungsfähigkeit.";
  return `Eigene Stärke in ${COMP_SHORT[c.personPrimary]}.`;
}

function buildHauptabweichung(c: Ctx): string {
  if (c.matchCase === "TOP1_TOP2") return "Keine wesentliche Abweichung erkennbar.";
  if (c.matchCase === "TOP1_ONLY") return `Unterschiedliche Arbeitsweise im Alltag (Team: ${COMP_SHORT[c.teamSecondary]}, Person: ${COMP_SHORT[c.personSecondary]}).`;
  if (c.matchCase === "TOP2_ONLY") return `Unterschiedliche Grundlogik (Team: ${COMP_DOMAIN[c.teamPrimary]}, Person: ${COMP_DOMAIN[c.personPrimary]}).`;
  return `Grundlogik und Arbeitsweise weichen ab (Team: ${COMP_DOMAIN[c.teamPrimary]}, Person: ${COMP_DOMAIN[c.personPrimary]}).`;
}


function buildWarumText(c: Ctx): string {
  const { matchCase, teamPrimary, personPrimary, teamSecondary, personSecondary, teamClass, personClass, score } = c;
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

  paras.push(`Der strukturelle Passungsscore liegt bei ${score} von 100 Punkten. Dieser Score basiert auf dem Vergleich der dominanten Arbeitslogik (Top 1), der ergänzenden Arbeitsweise (Top 2) und der strukturellen Profilkompatibilität (Variante) zwischen Person und Team.`);

  return paras.join("\n\n");
}


function buildWirkungAlltagText(c: Ctx): string {
  const { matchCase, teamPrimary, personPrimary, isLeader } = c;
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
  const inputRoleType = input.roleType;
  const isLeader = inputRoleType === "fuehrung" || inputRoleType === "leadership";
  const roleLabel = isLeader ? "Führungskraft" : "Teammitglied";

  const teamPrimary = getTop1(input.teamProfile);
  const personPrimary = getTop1(input.personProfile);
  const teamSecondary = getTop2(input.teamProfile);
  const personSecondary = getTop2(input.personProfile);
  const teamClass = getProfileClass(input.teamProfile);
  const personClass = getProfileClass(input.personProfile);

  const { score, top1, top2, variant, matchCase } = computeScore(input.teamProfile, input.personProfile);

  const pSorted = sortTriad(input.personProfile);
  const pTop2Gap = pSorted[0].value - pSorted[1].value;
  const pTop2Keys = new Set([pSorted[0].key, pSorted[1].key]);
  const sameDominance = teamPrimary === personPrimary ||
    (pTop2Gap < 3 && pTop2Keys.has(teamPrimary));

  const validGoals: TeamGoal[] = ["umsetzung", "analyse", "zusammenarbeit"];
  const safeGoal: TeamGoal = input.teamGoal && validGoals.includes(input.teamGoal) ? input.teamGoal : null;
  const teamGoalLabel = safeGoal ? GOAL_LABELS[safeGoal] : "";
  const hasGoal = !!safeGoal;

  const teamFit = scoreToFit(score);
  const taskFit = computeTaskFit(input.teamProfile, input.personProfile, safeGoal);
  const begleitungsbedarf = fitToBegleitung(teamFit);
  const gesamteinschaetzung = gesamtLabel(teamFit, taskFit, matchCase);

  const roleName = input.roleTitle || "diese Rolle";
  const goalKey = safeGoal ? GOAL_KEY[safeGoal] : null;

  const ctx: Ctx = {
    isLeader, roleName, teamPrimary, personPrimary, teamSecondary, personSecondary,
    teamClass, personClass, sameDominance, score, matchCase,
    teamFit, taskFit, gesamteinschaetzung, hasGoal, teamGoalLabel, goalKey,
  };

  const cr = buildChancenRisiken(ctx);

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

    teamKontext: teamClass === "BALANCED" && personClass === "BALANCED"
      ? "Sowohl Team als auch Person zeigen ein ausgeglichenes Profil ohne klare Dominanz in einem der drei bioLogic-Grundmuster. Beide Seiten sind situativ flexibel und nicht auf eine bestimmte Arbeitslogik festgelegt. Dadurch entsteht weder eine starke Übereinstimmung noch eine starke Reibung aus der Profilstruktur heraus."
      : teamClass === "BALANCED"
        ? `Das Team ist ausgeglichen aufgestellt und zeigt kein dominantes Arbeitsmuster. Die Person setzt dagegen stärker auf ${COMP_SHORT[personPrimary]} und bringt damit eine klarere Richtung in die Zusammenarbeit ein. Das kann dem Team Orientierung geben, erfordert aber Aufmerksamkeit, damit die Vielseitigkeit des Teams erhalten bleibt.`
        : personClass === "BALANCED"
          ? `Das Team arbeitet mit einem klaren Schwerpunkt auf ${COMP_SHORT[teamPrimary]} und erwartet von neuen Mitgliedern eine ähnliche Ausrichtung. Die Person ist dagegen breit aufgestellt und zeigt kein dominantes Muster. Sie kann flexibel anschliessen, muss aber die Teamlogik aktiv verstehen und annehmen.`
          : sameDominance
            ? `Team und Person setzen beide auf ${COMP_SHORT[teamPrimary]} als primäre Arbeitslogik. Die Grundlogik liegt strukturell nah beieinander, was die Zusammenarbeit grundsätzlich erleichtert. Im Alltag sind jedoch Unterschiede in Tempo und Vorgehen zu erwarten, da das Team stärker auf ${COMP_SHORT[teamSecondary]} setzt, die Person eher auf ${COMP_SHORT[personSecondary]}.`
            : `Das Team arbeitet mit einem klaren Schwerpunkt auf ${COMP_SHORT[teamPrimary]} und hat sich auf diese Arbeitslogik eingestellt. Die Person setzt dagegen stärker auf ${COMP_SHORT[personPrimary]} und geht Dinge anders an. Das braucht klare Erwartungen von Anfang an.`,
    teamPrimary,
    personPrimary,
    sameDominance,
    teamTriad: { ...input.teamProfile },
    personTriad: { ...input.personProfile },

    systemwirkung: computeSystemwirkung(matchCase),

    score,
    scoreBreakdown: { top1, top2, variant },
    matchCase,
  };
}
