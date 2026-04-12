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
    const pTop1 = getTop1(personProfile);
    const tSorted = sortTriad(teamProfile);
    const personSpread = sortTriad(personProfile)[0].value - sortTriad(personProfile)[2].value;
    if (personSpread <= 12) {
      return { score: 80, top1: 45, top2: 25, variant: 10, matchCase: "TOP1_TOP2" };
    }
    const closestDist = Math.abs(round(teamProfile[pTop1]) - round(personProfile[pTop1]));
    if (closestDist <= 8) {
      return { score: 70, top1: 40, top2: 20, variant: 10, matchCase: "TOP1_ONLY" };
    }
    return { score: 60, top1: 30, top2: 20, variant: 10, matchCase: "TOP2_ONLY" };
  }

  if (pClass === "BALANCED") {
    const tTop1 = getTop1(teamProfile);
    const personVal = round(personProfile[tTop1]);
    const teamVal = round(teamProfile[tTop1]);
    if (Math.abs(personVal - teamVal) <= 8) {
      return { score: 75, top1: 45, top2: 20, variant: 10, matchCase: "TOP1_ONLY" };
    }
    return { score: 60, top1: 30, top2: 20, variant: 10, matchCase: "TOP2_ONLY" };
  }

  const tTop1 = getTop1(teamProfile);
  const tTop2 = getTop2(teamProfile);
  const pTop1 = getTop1(personProfile);
  const pTop2 = getTop2(personProfile);

  let top1Score = 0;
  let top2Score = 0;
  let variantScore = 0;

  if (tTop1 === pTop1) {
    top1Score = 60;
  } else {
    const pSorted = sortTriad(personProfile);
    const pTop2Gap = pSorted[0].value - pSorted[1].value;
    if (pTop2Gap < 3 && pTop2 === tTop1) {
      top1Score = 45;
    }
  }

  if (tTop2 === pTop2) {
    top2Score = 30;
  } else if (tTop1 === pTop2) {
    top2Score = 15;
  } else if (tTop2 === pTop1 && top1Score === 0) {
    top2Score = 10;
  }

  const tVar = getVariantKey(teamProfile);
  const pVar = getVariantKey(personProfile);
  if (tVar === pVar) {
    variantScore = 10;
  } else if (isCompatibleVariant(tVar, pVar)) {
    variantScore = 5;
  }

  const score = top1Score + top2Score + variantScore;

  let matchCase: MatchCase;
  if (top1Score >= 45 && top2Score >= 15) matchCase = "TOP1_TOP2";
  else if (top1Score >= 45) matchCase = "TOP1_ONLY";
  else if (top2Score >= 15) matchCase = "TOP2_ONLY";
  else matchCase = "NONE";

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

function computeTaskFit(personProfile: Triad, goal: TeamGoal): string {
  if (!goal) return "nicht bewertbar";
  const goalComp = GOAL_KEY[goal];
  if (!goalComp) return "nicht bewertbar";

  const goalValue = round(personProfile[goalComp]);
  const sorted = sortTriad(personProfile);
  const topValue = sorted[0].value;
  const isTopTied = goalValue >= topValue - EQ_TOL;

  if (isTopTied && goalValue >= 30) return "hoch";
  if (goalValue >= 25) return "mittel";
  return "gering";
}


function gesamtLabel(teamFit: string, taskFit: string): string {
  if (teamFit === "hoch" && taskFit === "hoch") return "Gut passend";
  if (teamFit === "hoch" && taskFit === "mittel") return "Gut passend";
  if (teamFit === "hoch" && taskFit === "gering") return "Im Team passend, für die Aufgabe weniger geeignet";
  if (teamFit === "hoch" && taskFit === "nicht bewertbar") return "Gut passend";

  if (teamFit === "mittel" && taskFit === "hoch") return "Für die Aufgabe passend, im Team herausfordernd";
  if (teamFit === "mittel" && taskFit === "mittel") return "Teilweise passend";
  if (teamFit === "mittel" && taskFit === "gering") return "Eingeschränkt passend";
  if (teamFit === "mittel" && taskFit === "nicht bewertbar") return "Teilweise passend";

  if (teamFit === "gering" && (taskFit === "hoch" || taskFit === "mittel")) return "Strategisch sinnvoll, aber anspruchsvoll";
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
    ? "Dieser Bericht zeigt, wie die Person in einer Führungsrolle im bestehenden Team voraussichtlich wirken wird. Er hilft dabei, früh zu erkennen, wo Zusammenarbeit gut gelingen kann und wo im Alltag mehr Führung, Klarheit oder Begleitung nötig ist."
    : "Dieser Bericht zeigt, wie die Person im bestehenden Team voraussichtlich wirken wird. Er hilft dabei, früh zu erkennen, wo Zusammenarbeit gut gelingen kann und wo im Alltag mehr Klarheit oder Begleitung nötig ist.";
  const p2 = "Unterschiede sind dabei nicht automatisch negativ. Sie können ein Team sinnvoll ergänzen, brauchen aber klare Erwartungen, gute Abstimmung und bewusste Führung, damit daraus Stärke statt Reibung entsteht.";
  return `${p1}\n\n${p2}`;
}


function buildGesamtbewertungText(c: Ctx): string {
  const { matchCase, isLeader, teamClass, personClass, hasGoal, teamGoalLabel, taskFit } = c;
  const paras: string[] = [];

  if (teamClass === "BALANCED" && personClass === "BALANCED") {
    paras.push("Sowohl das Team als auch die Person zeigen eine ausgeglichene Grundstruktur ohne klare Einseitigkeit. Dadurch ist die Integration voraussichtlich reibungsarm. Die Zusammenarbeit kann sich schnell einspielen, weil keine der beiden Seiten eine dominante Richtung erzwingt.");
    paras.push("Das Risiko liegt darin, dass weder Team noch Person eine klare Linie vorgeben. In Phasen mit hohem Entscheidungsdruck kann das zu Unentschlossenheit führen.");
  } else if (teamClass === "BALANCED") {
    paras.push(`Das Team ist breit aufgestellt und nicht auf eine Richtung festgelegt. Die Person bringt dagegen eine klare Arbeitslogik mit, geprägt durch ${COMP_DOMAIN[c.personPrimary]}. Dadurch kann sie dem Team Orientierung geben.`);
    paras.push("Gleichzeitig besteht das Risiko, dass die Person die bestehende Balance einseitig verschiebt. Je klarer die Dominanz der Person, desto wichtiger ist bewusste Führung, damit das Team seine Vielseitigkeit behält.");
  } else if (personClass === "BALANCED") {
    paras.push(`Das Team folgt einer klaren Arbeitslogik mit Schwerpunkt auf ${COMP_DOMAIN[c.teamPrimary]}. Die Person ist dagegen breiter aufgestellt und weniger eindeutig ausgerichtet.`);
    paras.push("Dadurch kann sie flexibel anschliessen, läuft jedoch Gefahr, in der konkreten Rolle nicht klar genug wahrgenommen zu werden. Integration erfordert, dass Erwartungen an die Person früh konkret formuliert werden.");
  } else if (matchCase === "TOP1_TOP2") {
    paras.push(isLeader
      ? `Die Person passt in ihrer Arbeitsweise sehr gut zum bestehenden Team. Sowohl die grundlegende Denklogik (${COMP_DOMAIN[c.teamPrimary]}) als auch die Art der Zusammenarbeit im Alltag (${COMP_DOMAIN[c.teamSecondary]}) stimmen überein. Der Einstieg in die Führungsrolle dürfte reibungsarm verlaufen.`
      : `Die Person passt in ihrer Arbeitsweise sehr gut zum bestehenden Team. Sowohl die grundlegende Denklogik (${COMP_DOMAIN[c.teamPrimary]}) als auch die Art der Zusammenarbeit im Alltag (${COMP_DOMAIN[c.teamSecondary]}) stimmen überein. Die Integration dürfte reibungsarm verlaufen und im Alltag schnell wirksam werden.`);
  } else if (matchCase === "TOP1_ONLY") {
    paras.push(isLeader
      ? `Die Person bringt die gleiche Grundlogik wie das Team mit: ${COMP_DOMAIN[c.teamPrimary]}. Im konkreten Arbeitsalltag unterscheidet sich jedoch die Art der Zusammenarbeit. Das Team setzt stärker auf ${COMP_SHORT[c.teamSecondary]}, die Person eher auf ${COMP_SHORT[c.personSecondary]}.`
      : `Die Person bringt die gleiche Grundlogik wie das Team mit: ${COMP_DOMAIN[c.teamPrimary]}. Im konkreten Arbeitsalltag unterscheidet sich jedoch die Art der Zusammenarbeit. Das Team setzt stärker auf ${COMP_SHORT[c.teamSecondary]}, die Person eher auf ${COMP_SHORT[c.personSecondary]}.`);
    paras.push("Die grundsätzliche Zusammenarbeit ist damit gegeben, im Alltag können jedoch Unterschiede in Kommunikation und Vorgehen sichtbar werden. Mit klarer Abstimmung ist eine stabile Integration gut möglich.");
  } else if (matchCase === "TOP2_ONLY") {
    paras.push(`Die Person unterscheidet sich in der grundlegenden Denk- und Entscheidungslogik vom Team. Das Team arbeitet primär über ${COMP_DOMAIN[c.teamPrimary]}, die Person setzt stärker auf ${COMP_DOMAIN[c.personPrimary]}.`);
    paras.push(`Im konkreten Arbeitsverhalten gibt es jedoch Überschneidungen: Beide setzen auf ${COMP_SHORT[c.teamSecondary]}. Dadurch entsteht eine Mischung aus Ergänzung und Spannung. Die Integration kann funktionieren, erfordert jedoch bewusste Führung und klare Erwartungshaltung.`);
  } else {
    paras.push(`Die Person weicht sowohl in der grundlegenden Arbeitslogik als auch in der konkreten Umsetzung deutlich vom Team ab. Das Team arbeitet über ${COMP_DOMAIN[c.teamPrimary]}, die Person setzt auf ${COMP_DOMAIN[c.personPrimary]}.`);
    paras.push("Dadurch ist mit spürbarer Reibung im Alltag zu rechnen. Eine Integration ist möglich, erfordert jedoch einen hohen Steuerungsaufwand und klare Rahmenbedingungen.");
  }

  if (hasGoal) {
    if (taskFit === "hoch") {
      paras.push(`Für das Funktionsziel ${teamGoalLabel} bringt die Person die passende Stärke mit. Das stützt die Besetzung zusätzlich.`);
    } else if (taskFit === "mittel") {
      paras.push(`Für das Funktionsziel ${teamGoalLabel} bringt die Person einen Teil der geforderten Stärke mit. Im Aufgabenkern braucht es gezielte Begleitung.`);
    } else if (taskFit === "gering") {
      paras.push(`Für das Funktionsziel ${teamGoalLabel} bringt die Person nicht die ideale Stärke mit. Im Aufgabenkern ist die Passung nur begrenzt gegeben.`);
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
    paras.push("Sowohl das Team als auch die Person zeigen ein ausgeglichenes Profil ohne klare Dominanz. Die Integration hängt weniger von struktureller Übereinstimmung ab als von der Fähigkeit, mit Vielseitigkeit und Flexibilität umzugehen.");
  } else if (teamClass === "BALANCED") {
    paras.push(`Das Team zeigt ein ausgeglichenes Profil ohne klare Dominanz. Die Person hat dagegen eine klare Ausrichtung auf ${COMP_DOMAIN[personPrimary]}. Dadurch kann die Integration gelingen, wenn die Person ihre Stärke gezielt einbringt, ohne die Vielseitigkeit des Teams einzuschränken.`);
  } else if (personClass === "BALANCED") {
    paras.push(`Das Team folgt einer klaren Arbeitslogik mit Schwerpunkt auf ${COMP_DOMAIN[teamPrimary]}. Die Person ist dagegen breit aufgestellt und zeigt kein einzelnes dominantes Muster. Die Integration hängt davon ab, ob die Person die Teamlogik verstehen und mittragen kann.`);
  } else {
    if (matchCase === "TOP1_TOP2") {
      paras.push(`Team und Person setzen beide auf ${COMP_DOMAIN[teamPrimary]} als Hauptlogik und auf ${COMP_DOMAIN[teamSecondary]} als ergänzende Arbeitsweise. Diese doppelte Übereinstimmung sorgt für eine hohe Grundkompatibilität.`);
    } else if (matchCase === "TOP1_ONLY") {
      paras.push(`Die Hauptlogik stimmt überein: Beide setzen auf ${COMP_DOMAIN[teamPrimary]}. Im Alltag unterscheidet sich jedoch die Arbeitsweise. Das Team ergänzt mit ${COMP_SHORT[teamSecondary]}, die Person eher mit ${COMP_SHORT[personSecondary]}. Dadurch entsteht eine stabile Basis mit sichtbaren Unterschieden im Detail.`);
    } else if (matchCase === "TOP2_ONLY") {
      paras.push(`Die Hauptlogik unterscheidet sich: Das Team arbeitet primär über ${COMP_DOMAIN[teamPrimary]}, die Person über ${COMP_DOMAIN[personPrimary]}. Im konkreten Arbeitsverhalten gibt es jedoch Überschneidungen. Das sorgt für Anschlussfähigkeit, aber auch für strukturelle Spannung.`);
    } else {
      paras.push(`Team und Person unterscheiden sich sowohl in der Grundlogik als auch in der Arbeitsweise. Das Team setzt auf ${COMP_DOMAIN[teamPrimary]} mit ${COMP_SHORT[teamSecondary]}, die Person auf ${COMP_DOMAIN[personPrimary]} mit ${COMP_SHORT[personSecondary]}. Dadurch entsteht ein deutliches Spannungsfeld.`);
    }
  }

  paras.push(`Der strukturelle Passungsscore liegt bei ${score} von 100 Punkten.`);

  return paras.join("\n\n");
}


function buildWirkungAlltagText(c: Ctx): string {
  const { matchCase, teamPrimary, personPrimary, isLeader } = c;

  if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
    return "Im Alltag dürften beide Seiten situativ zwischen verschiedenen Arbeitsweisen wechseln. Es gibt keine feste Richtung, aber auch keine strukturelle Reibung. Die Zusammenarbeit wird erst dann herausfordernd, wenn klare Entscheidungen oder eindeutige Priorisierung gefragt sind.";
  }

  if (c.teamClass === "BALANCED") {
    return `Im Alltag ist das Team flexibel und offen für verschiedene Arbeitsweisen. Die Person bringt eine klare Richtung mit: ${COMP_DOMAIN[personPrimary]}. Das kann dem Team Orientierung geben, aber auch zu dem Eindruck führen, dass die Person zu einseitig vorgeht. Entscheidend ist, ob das Team die Richtung akzeptiert.`;
  }

  if (c.personClass === "BALANCED") {
    return `Im Alltag folgt das Team einer klaren Linie: ${COMP_DOMAIN[teamPrimary]}. Die Person ist breiter aufgestellt und wechselt situativ zwischen verschiedenen Herangehensweisen. Das kann als Flexibilität oder als Unentschlossenheit wahrgenommen werden. Klare Erwartungen helfen, die Zusammenarbeit zu stabilisieren.`;
  }

  if (matchCase === "TOP1_TOP2") {
    return isLeader
      ? `Im Alltag dürfte die Zusammenarbeit reibungsarm verlaufen. Führungsstil und Teamkultur setzen auf ähnliche Schwerpunkte. Entscheidungen werden ähnlich getroffen und Kommunikation verläuft in vertrauten Bahnen. Das Team wird die Führung voraussichtlich gut annehmen.`
      : `Im Alltag dürfte die Zusammenarbeit reibungsarm verlaufen. Person und Team setzen auf ähnliche Schwerpunkte. Entscheidungen werden ähnlich getroffen und Kommunikation verläuft in vertrauten Bahnen.`;
  }

  if (matchCase === "TOP1_ONLY") {
    return `Im Alltag wird die grundlegende Denkrichtung geteilt: Beide setzen auf ${COMP_DOMAIN[teamPrimary]}. In der konkreten Umsetzung zeigen sich jedoch Unterschiede. Die Person arbeitet ${COMP_ADJ[c.personSecondary]}, während das Team eher ${COMP_ADJ[c.teamSecondary]} vorgeht. Das kann zu produktiver Ergänzung führen, aber auch zu Missverständnissen im Detail.`;
  }

  if (matchCase === "TOP2_ONLY") {
    return `Im Alltag werden Unterschiede in der Grundhaltung spürbar. Das Team erwartet ${COMP_SHORT[teamPrimary]}, die Person bringt ${COMP_SHORT[personPrimary]}. Im konkreten Verhalten gibt es Überschneidungen, die die Zusammenarbeit erleichtern. Trotzdem braucht es klare Abstimmung, um Reibung zu vermeiden.`;
  }

  return `Im Alltag werden deutliche Unterschiede sichtbar. Das Team arbeitet über ${COMP_DOMAIN[teamPrimary]}, die Person über ${COMP_DOMAIN[personPrimary]}. In Meetings, Entscheidungen und Kommunikation prallen unterschiedliche Erwartungen aufeinander. Das erfordert aktive Steuerung und regelmässige Klärung.`;
}


function buildChancenRisiken(c: Ctx): { chancen: V4Block[]; risiken: V4Block[]; chancenRisikenEinordnung: string } {
  const chancen: V4Block[] = [];
  const risiken: V4Block[] = [];

  if (c.matchCase === "TOP1_TOP2") {
    chancen.push({ title: "Schnelle Integration", text: "Die Person kann sich schnell einarbeiten, weil Denk- und Arbeitsweise zum Team passen." });
    chancen.push({ title: "Hohe Akzeptanz", text: "Das Team wird die Person voraussichtlich gut aufnehmen, weil Arbeitskultur und Kommunikation ähnlich sind." });
    chancen.push({ title: "Stabile Zusammenarbeit", text: "Im Alltag entsteht wenig Reibung. Energie kann in die Aufgabe fliessen statt in Integration." });
    risiken.push({ title: "Fehlende Ergänzung", text: "Durch die hohe Ähnlichkeit fehlt ein ergänzender Impuls. Blinde Flecken des Teams werden nicht kompensiert." });
    risiken.push({ title: "Bestätigungstendenz", text: "Die Person verstärkt bestehende Muster im Team, statt sie zu hinterfragen. Schwächen können sich verfestigen." });
  } else if (c.matchCase === "TOP1_ONLY") {
    chancen.push({ title: "Gemeinsame Grundrichtung", text: `Beide setzen auf ${COMP_DOMAIN[c.teamPrimary]}. Das schafft eine stabile Basis für die Zusammenarbeit.` });
    chancen.push({ title: "Ergänzung im Detail", text: `Die Person bringt im Alltag ${COMP_SHORT[c.personSecondary]} ein. Das kann das Team in diesem Bereich stärken.` });
    risiken.push({ title: "Alltagsreibung", text: `Im konkreten Vorgehen unterscheiden sich Team und Person. Das kann zu Missverständnissen führen.` });
    risiken.push({ title: "Abstimmungsbedarf", text: "Die Person versteht die Teamlogik grundsätzlich, braucht aber Orientierung in der konkreten Umsetzung." });
  } else if (c.matchCase === "TOP2_ONLY") {
    chancen.push({ title: "Ergänzende Perspektive", text: `Die Person bringt ${COMP_DOMAIN[c.personPrimary]} als neue Stärke ein. Das kann dem Team helfen, Schwächen auszugleichen.` });
    chancen.push({ title: "Alltagsanschluss", text: `Im konkreten Verhalten gibt es Überschneidungen über ${COMP_SHORT[c.teamSecondary]}. Das erleichtert die tägliche Zusammenarbeit.` });
    risiken.push({ title: "Grundsätzliche Reibung", text: `Die Denklogik unterscheidet sich. Das Team erwartet ${COMP_SHORT[c.teamPrimary]}, die Person arbeitet über ${COMP_SHORT[c.personPrimary]}.` });
    risiken.push({ title: "Führungsaufwand", text: "Die unterschiedliche Grundrichtung erfordert klare Erwartungen und regelmässige Abstimmung." });
    risiken.push({ title: "Fehlinterpretation", text: "Das Team kann das Verhalten der Person als unangepasst wahrnehmen, obwohl es strukturell bedingt ist." });
  } else {
    chancen.push({ title: "Transformation", text: "Die Person kann das Team grundlegend erweitern und neue Perspektiven einbringen." });
    chancen.push({ title: "Blinde Flecken aufdecken", text: `Die Stärke der Person in ${COMP_DOMAIN[c.personPrimary]} kann Schwächen im Team sichtbar machen.` });
    risiken.push({ title: "Starke Reibung", text: `Team und Person arbeiten grundverschieden. Das führt zu Spannungen in Kommunikation, Entscheidungen und Priorisierung.` });
    risiken.push({ title: "Hoher Steuerungsaufwand", text: "Integration erfordert intensive Führung, klare Rahmenbedingungen und Geduld." });
    risiken.push({ title: "Abgrenzungsrisiko", text: "Die Person kann sich isoliert fühlen, wenn die Teamkultur ihre Arbeitsweise nicht unterstützt." });
  }

  if (c.teamClass === "BALANCED") {
    chancen.push({ title: "Offenes System", text: "Das ausgeglichene Team kann unterschiedliche Arbeitsweisen gut aufnehmen." });
    risiken.push({ title: "Richtungsverschiebung", text: "Eine dominante Person kann die Balance im Team einseitig verschieben." });
  }

  if (c.personClass === "BALANCED") {
    chancen.push({ title: "Flexibilität", text: "Die Person kann sich an verschiedene Teamdynamiken anpassen." });
    risiken.push({ title: "Profilunschärfe", text: "Die Person wird möglicherweise als wenig greifbar wahrgenommen." });
  }

  let einordnung: string;
  if (c.score >= 85) {
    einordnung = "Die Chancen überwiegen deutlich. Risiken bestehen vor allem in der fehlenden Ergänzung und möglicher Einseitigkeit.";
  } else if (c.score >= 60) {
    einordnung = "Chancen und Risiken halten sich in etwa die Waage. Die Besetzung kann gut funktionieren, braucht aber bewusste Steuerung.";
  } else {
    einordnung = "Die Risiken überwiegen. Die Besetzung kann trotzdem sinnvoll sein, wenn die Unterschiede strategisch gewollt sind und aktiv begleitet werden.";
  }

  return { chancen, risiken, chancenRisikenEinordnung: einordnung };
}


function buildDruckText(c: Ctx): string {
  if (c.teamClass === "BALANCED" && c.personClass === "BALANCED") {
    return "Unter Druck zeigen weder Team noch Person eine klar vorhersagbare Verschiebung. Das kann zu diffusem Verhalten führen. Wichtig ist, dass in Druckphasen klare Zuständigkeiten und Entscheidungswege definiert sind.";
  }

  if (c.matchCase === "TOP1_TOP2") {
    return `Unter Druck verstärken beide Seiten die gemeinsame Hauptlogik: ${COMP_DOMAIN[c.teamPrimary]}. Das erhöht die Konsistenz, kann aber auch dazu führen, dass blinde Flecken unter Druck besonders sichtbar werden. ${COMP_DOMAIN[c.personSecondary]} tritt dann möglicherweise zu stark in den Hintergrund.`;
  }

  if (c.matchCase === "TOP1_ONLY") {
    return `Unter Druck verstärkt sich bei beiden die Hauptlogik: ${COMP_DOMAIN[c.teamPrimary]}. Die Unterschiede in der Arbeitsweise können sich dabei verschärfen. Die Person reagiert ${COMP_ADJ[c.personSecondary]}, das Team erwartet eher ${COMP_SHORT[c.teamSecondary]}. Klare Kommunikation in Druckphasen ist entscheidend.`;
  }

  if (c.matchCase === "TOP2_ONLY") {
    return `Unter Druck verstärken sich die Unterschiede in der Grundlogik. Das Team zieht sich auf ${COMP_DOMAIN[c.teamPrimary]} zurück, die Person auf ${COMP_DOMAIN[c.personPrimary]}. Die gemeinsame Arbeitsweise kann als Brücke dienen, reicht aber möglicherweise nicht aus, um Konflikte zu vermeiden.`;
  }

  return `Unter Druck werden die Unterschiede zwischen Team und Person deutlich spürbarer. Das Team reagiert ${COMP_ADJ[c.teamPrimary]}, die Person ${COMP_ADJ[c.personPrimary]}. In solchen Phasen besteht erhöhte Konfliktgefahr. Klare Eskalationswege und definierte Verantwortlichkeiten sind wichtig.`;
}


function buildFuehrungshinweis(c: Ctx): V4Block[] | null {
  if (!c.isLeader) return null;

  const hints: V4Block[] = [];

  if (c.matchCase === "TOP1_TOP2") {
    hints.push({ title: "Vertrauen aufbauen", text: "Die Führungskraft wird voraussichtlich schnell akzeptiert. Nutzen Sie diese Phase, um klare Erwartungen zu setzen und die Rolle zu verankern." });
    hints.push({ title: "Ergänzung einfordern", text: "Bei hoher Übereinstimmung besteht die Gefahr, blinde Flecken zu verstärken. Fordern Sie aktiv ein, dass die Führungskraft auch ungewohnte Perspektiven einbringt." });
  } else if (c.matchCase === "TOP1_ONLY" || c.matchCase === "TOP2_ONLY") {
    hints.push({ title: "Erwartungen klären", text: "Die Führungskraft bringt eine Stärke mit, die das Team kennt, aber auch Unterschiede, die Irritation auslösen können. Klären Sie frühzeitig, welche Arbeitsweise erwartet wird." });
    hints.push({ title: "Feedback-Schleifen", text: "Installieren Sie in den ersten 90 Tagen regelmässige Feedback-Gespräche zwischen Führungskraft und Team, um Missverständnisse früh zu erkennen." });
  } else {
    hints.push({ title: "Intensive Begleitung", text: "Die Führungskraft unterscheidet sich deutlich vom Team. Ohne aktive Begleitung besteht die Gefahr, dass die Zusammenarbeit schnell unter Druck gerät." });
    hints.push({ title: "Rollenklarheit", text: "Definieren Sie klar, was die Führungskraft verändern soll und was sie übernehmen soll. Ohne diesen Rahmen wird die Person entweder untergehen oder das Team überfahren." });
    hints.push({ title: "Schutzraum schaffen", text: "Geben Sie der Führungskraft Zeit und Rückendeckung, um sich zu etablieren. Schnelle Urteile aus dem Team sind bei hoher Abweichung besonders wahrscheinlich." });
  }

  return hints;
}


function buildRisikoprognose(c: Ctx): V4RiskPhase[] {
  if (c.matchCase === "TOP1_TOP2") {
    return [
      { label: "Phase 1", period: "0–3 Monate", text: "Der Einstieg verläuft voraussichtlich reibungsarm. Person und Team finden schnell eine gemeinsame Arbeitsweise. Risiko: Zu wenig kritische Distanz, blinde Flecken bleiben unentdeckt." },
      { label: "Phase 2", period: "3–12 Monate", text: "Die Zusammenarbeit stabilisiert sich. Die Gefahr liegt in der Routine: Wenn beide Seiten ähnlich denken, können Probleme übersehen werden, die eine ergänzende Perspektive sichtbar gemacht hätte." },
      { label: "Phase 3", period: "12+ Monate", text: "Die Integration ist stabil. Langfristig sollte geprüft werden, ob das Team durch die Verstärkung nicht einseitiger geworden ist." },
    ];
  }

  if (c.matchCase === "TOP1_ONLY") {
    return [
      { label: "Phase 1", period: "0–3 Monate", text: "Der Einstieg gelingt grundsätzlich, weil die Hauptlogik übereinstimmt. Im Alltag werden jedoch Unterschiede in der Arbeitsweise spürbar. Erste Irritationen sind normal." },
      { label: "Phase 2", period: "3–12 Monate", text: "Die Unterschiede in der Arbeitsweise sind bekannt und können gezielt gesteuert werden. Wenn Abstimmung gelingt, wird die Zusammenarbeit produktiver. Ohne Abstimmung verfestigen sich die Reibungspunkte." },
      { label: "Phase 3", period: "12+ Monate", text: "Die Integration ist stabil, wenn die Unterschiede als Ergänzung genutzt wurden. Andernfalls kann sich schleichende Frustration aufbauen." },
    ];
  }

  if (c.matchCase === "TOP2_ONLY") {
    return [
      { label: "Phase 1", period: "0–3 Monate", text: `Der Einstieg ist herausfordernd: Die Grundlogik unterscheidet sich (Team: ${COMP_SHORT[c.teamPrimary]}, Person: ${COMP_SHORT[c.personPrimary]}). Die gemeinsame Arbeitsweise schafft aber Anschlussfähigkeit. Erwartungen früh klären.` },
      { label: "Phase 2", period: "3–12 Monate", text: "Die strukturelle Spannung wird deutlicher. Entweder wird die Ergänzung als Stärke erkannt und genutzt, oder die Reibung verstärkt sich. Klare Rollenklärung ist jetzt entscheidend." },
      { label: "Phase 3", period: "12+ Monate", text: "Wenn die Integration gelingt, hat die Person das Team nachhaltig ergänzt. Wenn nicht, ist die Reibung wahrscheinlich chronisch geworden und erfordert eine Grundsatzentscheidung." },
    ];
  }

  return [
    { label: "Phase 1", period: "0–3 Monate", text: `Der Einstieg ist anspruchsvoll. Person und Team unterscheiden sich grundlegend. Erste Konflikte oder Missverständnisse sind wahrscheinlich. Intensive Begleitung und klare Erwartungen sind von Anfang an nötig.` },
    { label: "Phase 2", period: "3–12 Monate", text: "Die Unterschiede sind jetzt bekannt. Die Frage ist, ob sie als Bereicherung oder als Belastung erlebt werden. Ohne aktive Steuerung kippt die Dynamik in Richtung Reibung." },
    { label: "Phase 3", period: "12+ Monate", text: "Entweder hat die Person das Team transformiert und neue Stärken eingebracht, oder die Spannung ist dauerhaft. In letzterem Fall muss offen über Passung und Perspektive gesprochen werden." },
  ];
}


function buildIntegrationsplan(c: Ctx): V4IntegrationPhase[] {
  const base: V4IntegrationPhase[] = [
    {
      num: 1,
      title: "Ankommen und Orientierung",
      period: "Tag 1–10",
      ziel: "Die Person versteht die Teamkultur, die wichtigsten Abläufe und die Erwartungen an ihre Rolle.",
      beschreibung: c.matchCase === "TOP1_TOP2"
        ? "Die Einarbeitung kann zügig erfolgen, weil die Arbeitsweise zum Team passt. Fokus auf Rollenklarheit und konkrete Aufgaben."
        : c.matchCase === "NONE"
          ? "Die Einarbeitung braucht besondere Aufmerksamkeit, weil Arbeitsweise und Teamkultur sich unterscheiden. Fokus auf Verständnis und gegenseitiges Kennenlernen."
          : "Die Einarbeitung erfordert klare Orientierungshilfen. Die Person sollte die Teamlogik verstehen, bevor sie eigenständig agiert.",
      praxis: [
        "Persönliches Kennenlernen mit allen Teammitgliedern",
        "Klärung der wichtigsten Aufgaben und Zuständigkeiten",
        "Benennung einer festen Ansprechperson für die ersten Wochen",
      ],
      signale: [
        "Person stellt aktiv Fragen zur Teamkultur",
        "Erste eigene Beiträge in Meetings",
        "Keine offensichtlichen Konflikte oder Rückzug",
      ],
      fuehrungstipp: c.isLeader
        ? "Als Führungskraft: Hören Sie zuerst zu, bevor Sie Veränderungen anstossen. Zeigen Sie Respekt für bestehende Abläufe."
        : "Geben Sie der Person Raum zum Ankommen. Erwarten Sie noch keine volle Produktivität.",
      fokus: {
        intro: "In dieser Phase geht es um:",
        bullets: ["Vertrauensaufbau", "Orientierung im Team", "Erste Kontakte und Abläufe verstehen"],
      },
    },
    {
      num: 2,
      title: "Einarbeitung und erste Wirkung",
      period: "Tag 11–20",
      ziel: "Die Person übernimmt erste eigenständige Aufgaben und wird im Team sichtbar.",
      beschreibung: c.matchCase === "TOP1_TOP2"
        ? "Die Person kann schnell eigenständig arbeiten. Fokus auf sichtbare erste Ergebnisse."
        : "Die Person beginnt, ihre Arbeitsweise einzubringen. Unterschiede zum Team werden jetzt sichtbar und sollten offen besprochen werden.",
      praxis: [
        "Übernahme eines konkreten Arbeitspakets",
        "Erstes Feedback-Gespräch mit der Führungskraft",
        "Einbindung in laufende Teamprojekte",
      ],
      signale: [
        "Person liefert erste eigenständige Ergebnisse",
        "Feedback von Teammitgliedern ist überwiegend positiv",
        "Keine wiederholten Missverständnisse",
      ],
      fuehrungstipp: c.isLeader
        ? "Setzen Sie erste klare Prioritäten. Zeigen Sie dem Team, wohin die Reise geht."
        : "Überprüfen Sie, ob die Person die Teamlogik verstanden hat. Korrigieren Sie frühzeitig, wenn nötig.",
      fokus: {
        intro: "In dieser Phase geht es um:",
        bullets: ["Erste eigene Beiträge", "Sichtbarkeit im Team", "Feedback einholen und verarbeiten"],
      },
    },
    {
      num: 3,
      title: "Stabilisierung und Vertiefung",
      period: "Tag 21–30",
      ziel: "Die Person ist im Team angekommen und arbeitet eigenständig und wirksam.",
      beschreibung: c.score >= 60
        ? "Die Integration sollte jetzt weitgehend abgeschlossen sein. Fokus auf nachhaltige Wirksamkeit und Klärung offener Punkte."
        : "Die Integration ist noch im Aufbau. Klären Sie, ob die Zusammenarbeit langfristig tragfähig ist. Offene Gespräche über Unterschiede und Erwartungen sind jetzt wichtig.",
      praxis: [
        "Zusammenfassendes Feedback-Gespräch",
        "Klärung der weiteren Entwicklung und nächsten Schritte",
        "Auswertung: Wo läuft es gut, wo braucht es Anpassung?",
      ],
      signale: [
        "Person ist eigenständig produktiv",
        "Teamdynamik ist stabil oder verbessert sich",
        "Keine ungelösten Konflikte",
      ],
      fuehrungstipp: c.isLeader
        ? "Reflektieren Sie Ihre erste Wirkung im Team. Was hat gut funktioniert, was braucht Anpassung?"
        : "Führen Sie ein offenes Gespräch: Was läuft gut, was braucht Veränderung? Setzen Sie Ziele für die nächsten 3 Monate.",
      fokus: {
        intro: "In dieser Phase geht es um:",
        bullets: ["Nachhaltigkeit der Integration", "Klärung offener Punkte", "Perspektive für die nächsten Monate"],
      },
    },
  ];

  return base;
}


function buildIntegrationZusatz(c: Ctx): { intWarnsignale: string[]; intLeitfragen: string[]; intVerantwortung: string } {
  const warnsignale: string[] = [
    "Die Person zieht sich in Meetings zurück oder wird auffällig still",
    "Teammitglieder äussern Unzufriedenheit über die Zusammenarbeit",
    "Die Person sucht keinen eigenständigen Kontakt zum Team",
    "Wiederkehrende Missverständnisse in der Kommunikation",
  ];

  if (c.score < 60) {
    warnsignale.push("Offene oder verdeckte Konflikte nehmen zu statt ab");
    warnsignale.push("Die Person versucht, die Teamkultur einseitig zu verändern");
  }

  const leitfragen = [
    "Fühlt sich die Person im Team willkommen?",
    "Versteht sie, was von ihr erwartet wird?",
    "Gibt es Reibungspunkte, die nicht angesprochen werden?",
    "Kann sie ihre Stärken in der aktuellen Rolle einsetzen?",
  ];

  const verantwortung = c.isLeader
    ? "Die Verantwortung für die Integration liegt sowohl bei der Organisation als auch bei der Führungskraft selbst. Eine Führungskraft, die ihr Team nicht versteht, kann nicht wirksam führen."
    : "Die Verantwortung für eine gelungene Integration liegt bei der Führungskraft. Sie muss Rahmenbedingungen schaffen, Erwartungen klären und frühzeitig eingreifen, wenn die Integration stockt.";

  return { intWarnsignale: warnsignale, intLeitfragen: leitfragen, intVerantwortung: verantwortung };
}


function buildEmpfehlungen(c: Ctx): V4Block[] {
  const emps: V4Block[] = [];

  if (c.matchCase === "TOP1_TOP2") {
    emps.push({ title: "Stärken nutzen", text: "Setzen Sie die Person dort ein, wo die gemeinsame Stärke von Team und Person am meisten Wirkung zeigt." });
    emps.push({ title: "Ergänzung suchen", text: "Achten Sie darauf, dass das Team durch die Verstärkung nicht einseitiger wird. Fordern Sie aktiv ergänzende Perspektiven ein." });
  } else if (c.matchCase === "TOP1_ONLY") {
    emps.push({ title: "Gemeinsame Basis stärken", text: "Nutzen Sie die übereinstimmende Grundlogik als Fundament und klären Sie die Unterschiede in der Arbeitsweise offen." });
    emps.push({ title: "Alltagsregeln vereinbaren", text: "Definieren Sie konkrete Spielregeln für Kommunikation und Zusammenarbeit, um die Unterschiede im Detail zu überbrücken." });
  } else if (c.matchCase === "TOP2_ONLY") {
    emps.push({ title: "Erwartungen klären", text: "Die Person bringt eine andere Grundlogik mit. Klären Sie frühzeitig, was erwartet wird und wo Spielraum besteht." });
    emps.push({ title: "Ergänzung bewusst nutzen", text: `Die Stärke der Person in ${COMP_DOMAIN[c.personPrimary]} kann das Team bereichern. Schaffen Sie Situationen, in denen diese Stärke sichtbar wird.` });
    emps.push({ title: "Konflikte normalisieren", text: "Machen Sie dem Team klar, dass Unterschiede gewollt sind und dass Reibung ein Zeichen von Ergänzung sein kann." });
  } else {
    emps.push({ title: "Intensiv begleiten", text: "Die ersten 90 Tage sind entscheidend. Planen Sie regelmässige Check-ins und seien Sie bereit, früh einzugreifen." });
    emps.push({ title: "Rahmenbedingungen schaffen", text: "Definieren Sie klare Zuständigkeiten, Entscheidungswege und Eskalationspfade." });
    emps.push({ title: "Strategie prüfen", text: "Fragen Sie sich: Ist die Abweichung strategisch gewollt? Wenn ja, kommunizieren Sie das klar an das Team. Wenn nicht, überdenken Sie die Besetzung." });
  }

  if (c.hasGoal && c.taskFit === "gering") {
    emps.push({ title: "Aufgabenfokus stärken", text: `Die Person bringt für das Funktionsziel ${c.teamGoalLabel} nicht die ideale Stärke mit. Ergänzen Sie durch gezielte Unterstützung oder klare Aufgabenteilung.` });
  }

  return emps;
}


function buildTeamOhnePerson(c: Ctx): string {
  if (c.matchCase === "TOP1_TOP2") {
    return `Ohne die Person bleibt das Team in seiner bestehenden Grundlogik. Die Verstärkung in ${COMP_DOMAIN[c.teamPrimary]} entfällt. Das Team verliert keine grundlegende Fähigkeit, aber an Kapazität in seiner Kernstärke.\n\nLangfristig ändert sich wenig an der Teamstruktur. Die Frage ist, ob die zusätzliche Kapazität strategisch notwendig war.`;
  }

  if (c.matchCase === "TOP1_ONLY" || c.matchCase === "TOP2_ONLY") {
    return `Ohne die Person verliert das Team den ergänzenden Impuls in ${COMP_DOMAIN[c.personPrimary]}. Je nachdem, wie stark die Person bereits integriert war, kann das spürbar sein oder kaum auffallen.\n\nDas Team kehrt zu seiner bisherigen Arbeitsweise zurück. Das kann Stabilität bringen, aber auch bedeuten, dass Schwächen wieder uncompensiert bleiben.`;
  }

  return `Ohne die Person kehrt das Team zu seiner bisherigen Dynamik zurück. Wenn die Person eine echte Transformation angestossen hat, kann deren Wegfall spürbar sein. Wenn die Integration nicht gelungen ist, entsteht Entlastung.\n\nEntscheidend ist, ob die Person in ihrer Zeit nachhaltige Veränderungen bewirkt hat oder ob ihre Wirkung an ihre Anwesenheit gebunden war.`;
}


function buildSchlussfazit(c: Ctx): string {
  const { gesamteinschaetzung, matchCase, isLeader, score, teamGoalLabel, taskFit, hasGoal } = c;

  if (score >= 85) {
    const goalPart = hasGoal && taskFit === "hoch"
      ? ` Auch für das Funktionsziel ${teamGoalLabel} bringt die Person die passende Stärke mit.`
      : "";
    return isLeader
      ? `Die Besetzung ist aus struktureller Sicht empfehlenswert. Die Person passt in ihrer Arbeitsweise sehr gut zum Team.${goalPart} Der Einstieg in die Führungsrolle dürfte reibungsarm verlaufen.\n\nAuch bei guter Passung lohnt es sich, Erwartungen von Anfang an offen zu besprechen und die Führungswirkung nach 90 Tagen gezielt zu reflektieren.`
      : `Die Besetzung ist aus struktureller Sicht empfehlenswert. Die Person passt in ihrer Arbeitsweise sehr gut zum Team.${goalPart} Die Integration dürfte reibungsarm verlaufen.\n\nAuch bei guter Passung lohnt es sich, Erwartungen von Anfang an offen zu besprechen und die Zusammenarbeit nach 90 Tagen gezielt zu reflektieren.`;
  }

  if (score >= 60) {
    return isLeader
      ? `Die Besetzung ist möglich, braucht aber bewusste Steuerung. Die Person bringt eine teilweise passende Arbeitsweise mit. ${matchCase === "TOP1_ONLY" ? "Die Grundlogik stimmt, im Alltag gibt es Unterschiede." : "Im Detail gibt es Überschneidungen, die Grundrichtung unterscheidet sich jedoch."}\n\nEntscheidend ist, ob die Unterschiede als Ergänzung genutzt werden können. Das erfordert klare Erwartungen, regelmässiges Feedback und die Bereitschaft, Reibung als Lernchance zu sehen.`
      : `Die Besetzung ist möglich, braucht aber bewusste Steuerung. Die Person bringt eine teilweise passende Arbeitsweise mit. ${matchCase === "TOP1_ONLY" ? "Die Grundlogik stimmt, im Alltag gibt es Unterschiede." : "Im Detail gibt es Überschneidungen, die Grundrichtung unterscheidet sich jedoch."}\n\nEntscheidend ist, ob die Unterschiede als Ergänzung genutzt werden können. Das erfordert klare Erwartungen und regelmässiges Feedback.`;
  }

  const strategicPart = hasGoal && taskFit !== "gering"
    ? ` Strategisch kann die Besetzung sinnvoll sein, weil die Person für das Funktionsziel ${teamGoalLabel} einen Beitrag leistet.`
    : "";

  return `Die Besetzung ist aus struktureller Sicht anspruchsvoll. Person und Team unterscheiden sich deutlich in Grundlogik und Arbeitsweise.${strategicPart}\n\nEine Integration ist möglich, erfordert aber hohen Steuerungsaufwand, klare Rahmenbedingungen und die bewusste Entscheidung, mit den Unterschieden arbeiten zu wollen. Ohne aktive Begleitung ist das Risiko von Reibung und Frustration hoch.`;
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
  const taskFit = computeTaskFit(input.personProfile, safeGoal);
  const begleitungsbedarf = fitToBegleitung(teamFit);
  const gesamteinschaetzung = gesamtLabel(teamFit, taskFit);

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
      ? "Sowohl Team als auch Person zeigen ein ausgeglichenes Profil. Keine Seite hat eine klare Dominanz."
      : teamClass === "BALANCED"
        ? `Das Team ist ausgeglichen aufgestellt. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}.`
        : personClass === "BALANCED"
          ? `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person ist breit aufgestellt.`
          : sameDominance
            ? `Team und Person setzen beide auf ${COMP_SHORT[teamPrimary]}. Ihre Arbeitsweisen liegen nah beieinander.`
            : `Das Team arbeitet mit Schwerpunkt auf ${COMP_SHORT[teamPrimary]}. Die Person setzt stärker auf ${COMP_SHORT[personPrimary]}.`,
    teamPrimary,
    personPrimary,
    sameDominance,
    teamTriad: { ...input.teamProfile },
    personTriad: { ...input.personProfile },

    score,
    scoreBreakdown: { top1, top2, variant },
    matchCase,
  };
}
